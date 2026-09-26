package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/domain"
)

type StudentRepo struct{ pool *pgxpool.Pool }

func NewStudentRepo(pool *pgxpool.Pool) domain.StudentRepository { return &StudentRepo{pool: pool} }

const studentColumns = `s.id,s.student_number,s.nisn,s.full_name,s.class_id,c.name,s.active,s.deleted_at,s.created_at,s.updated_at`
const studentFrom = ` FROM students s JOIN classes c ON c.id=s.class_id `

func scanStudent(row interface{ Scan(...any) error }) (domain.StudentRecord, error) {
	var s domain.StudentRecord
	err := row.Scan(&s.ID, &s.NIS, &s.NISN, &s.FullName, &s.CurrentClassID, &s.CurrentClassName, &s.Active, &s.DeletedAt, &s.CreatedAt, &s.UpdatedAt)
	return s, err
}

func (r *StudentRepo) List(ctx context.Context, filter domain.StudentListFilter) ([]domain.StudentRecord, int64, error) {
	where := make([]string, 0, 4)
	args := make([]any, 0, 5)
	add := func(expr string, value any) {
		args = append(args, value)
		where = append(where, fmt.Sprintf(expr, len(args)))
	}
	if !filter.IncludeDeleted {
		where = append(where, "s.deleted_at IS NULL")
	}
	if filter.Search != "" {
		args = append(args, filter.Search)
		placeholder := len(args)
		where = append(where, fmt.Sprintf("(s.student_number ILIKE '%%' || $%d || '%%' OR s.nisn ILIKE '%%' || $%d || '%%' OR s.full_name ILIKE '%%' || $%d || '%%')", placeholder, placeholder, placeholder))
	}
	if filter.ClassID != nil {
		add("s.class_id=$%d", *filter.ClassID)
	}
	if filter.Active != nil {
		add("s.active=$%d", *filter.Active)
	}
	clause := ""
	if len(where) != 0 {
		clause = " WHERE " + strings.Join(where, " AND ")
	}
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*)`+studentFrom+clause, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	sortColumns := map[string]string{"nis": "s.student_number", "full_name": "s.full_name", "class_name": "c.name", "created_at": "s.created_at"}
	sortColumn, ok := sortColumns[filter.SortBy]
	if !ok {
		sortColumn = "s.created_at"
	}
	direction := "ASC"
	if strings.EqualFold(filter.SortOrder, "desc") {
		direction = "DESC"
	}
	if filter.SortOrder != "" && !strings.EqualFold(filter.SortOrder, "asc") && !strings.EqualFold(filter.SortOrder, "desc") {
		return nil, 0, fmt.Errorf("invalid sort order %q", filter.SortOrder)
	}
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.PerPage < 1 {
		filter.PerPage = 20
	}
	args = append(args, filter.PerPage, (filter.Page-1)*filter.PerPage)
	query := `SELECT ` + studentColumns + studentFrom + clause + fmt.Sprintf(" ORDER BY %s %s,s.id ASC LIMIT $%d OFFSET $%d", sortColumn, direction, len(args)-1, len(args))
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	result := make([]domain.StudentRecord, 0)
	for rows.Next() {
		item, err := scanStudent(rows)
		if err != nil {
			return nil, 0, err
		}
		result = append(result, item)
	}
	return result, total, rows.Err()
}

func (r *StudentRepo) Get(ctx context.Context, id uuid.UUID, includeDeleted bool) (domain.StudentRecord, error) {
	query := `SELECT ` + studentColumns + studentFrom + ` WHERE s.id=$1`
	if !includeDeleted {
		query += ` AND s.deleted_at IS NULL`
	}
	student, err := scanStudent(r.pool.QueryRow(ctx, query, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.StudentRecord{}, domain.ErrNotFound
	}
	return student, err
}

func (r *StudentRepo) Create(ctx context.Context, student domain.StudentRecord, effectiveOn time.Time, actorID uuid.UUID) (domain.StudentRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return domain.StudentRecord{}, err
	}
	defer tx.Rollback(ctx)
	if student.ID == uuid.Nil {
		student.ID = uuid.New()
	}
	err = tx.QueryRow(ctx, `INSERT INTO students (id,student_number,nisn,full_name,class_id,active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING created_at,updated_at`, student.ID, student.NIS, student.NISN, student.FullName, student.CurrentClassID, student.Active).Scan(&student.CreatedAt, &student.UpdatedAt)
	if err != nil {
		return domain.StudentRecord{}, mapStudentWriteError(err)
	}
	if _, err = tx.Exec(ctx, `INSERT INTO student_enrollments (student_id,class_id,valid_from) VALUES ($1,$2,$3)`, student.ID, student.CurrentClassID, effectiveOn.UTC().Format("2006-01-02")); err != nil {
		return domain.StudentRecord{}, mapStudentWriteError(err)
	}
	if err = insertStudentAudit(ctx, tx, actorID, "CREATE", student.ID); err != nil {
		return domain.StudentRecord{}, err
	}
	if err = tx.QueryRow(ctx, `SELECT name FROM classes WHERE id=$1`, student.CurrentClassID).Scan(&student.CurrentClassName); err != nil {
		return domain.StudentRecord{}, err
	}
	if err = tx.Commit(ctx); err != nil {
		return domain.StudentRecord{}, err
	}
	return student, nil
}

func (r *StudentRepo) Update(ctx context.Context, student domain.StudentRecord, actorID uuid.UUID) (domain.StudentRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return domain.StudentRecord{}, err
	}
	defer tx.Rollback(ctx)
	result, err := tx.Exec(ctx, `UPDATE students SET student_number=$2,nisn=$3,full_name=$4,active=$5,updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, student.ID, student.NIS, student.NISN, student.FullName, student.Active)
	if err != nil {
		return domain.StudentRecord{}, mapStudentWriteError(err)
	}
	if result.RowsAffected() == 0 {
		return domain.StudentRecord{}, domain.ErrNotFound
	}
	if err = insertStudentAudit(ctx, tx, actorID, "UPDATE", student.ID); err != nil {
		return domain.StudentRecord{}, err
	}
	if err = tx.QueryRow(ctx, `SELECT `+studentColumns+studentFrom+` WHERE s.id=$1`, student.ID).Scan(&student.ID, &student.NIS, &student.NISN, &student.FullName, &student.CurrentClassID, &student.CurrentClassName, &student.Active, &student.DeletedAt, &student.CreatedAt, &student.UpdatedAt); err != nil {
		return domain.StudentRecord{}, err
	}
	if err = tx.Commit(ctx); err != nil {
		return domain.StudentRecord{}, err
	}
	return student, nil
}

func (r *StudentRepo) SoftDelete(ctx context.Context, id, actorID uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	result, err := tx.Exec(ctx, `UPDATE students SET active=FALSE,deleted_at=NOW(),updated_at=NOW() WHERE id=$1 AND deleted_at IS NULL`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	if err = insertStudentAudit(ctx, tx, actorID, "DELETE", id); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *StudentRepo) Enrollments(ctx context.Context, id uuid.UUID) ([]domain.StudentEnrollment, error) {
	if _, err := r.Get(ctx, id, true); err != nil {
		return nil, err
	}
	rows, err := r.pool.Query(ctx, `SELECT e.id,e.student_id,e.class_id,c.name,e.valid_from,e.valid_to,e.created_at FROM student_enrollments e JOIN classes c ON c.id=e.class_id WHERE e.student_id=$1 ORDER BY e.valid_from DESC,e.id`, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	history := make([]domain.StudentEnrollment, 0)
	for rows.Next() {
		var item domain.StudentEnrollment
		if err := rows.Scan(&item.ID, &item.StudentID, &item.ClassID, &item.ClassName, &item.ValidFrom, &item.ValidTo, &item.CreatedAt); err != nil {
			return nil, err
		}
		history = append(history, item)
	}
	return history, rows.Err()
}

func (r *StudentRepo) Transfer(ctx context.Context, id, classID uuid.UUID, effectiveOn time.Time, actorID uuid.UUID) (domain.StudentRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return domain.StudentRecord{}, err
	}
	defer tx.Rollback(ctx)
	student, err := scanStudent(tx.QueryRow(ctx, `SELECT `+studentColumns+studentFrom+` WHERE s.id=$1 AND s.deleted_at IS NULL FOR UPDATE OF s`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.StudentRecord{}, domain.ErrNotFound
	}
	if err != nil {
		return domain.StudentRecord{}, err
	}
	if student.CurrentClassID == classID {
		return domain.StudentRecord{}, domain.ErrEnrollmentConflict
	}
	var enrollmentID uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM student_enrollments WHERE student_id=$1 AND valid_to IS NULL FOR UPDATE`, id).Scan(&enrollmentID)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.StudentRecord{}, domain.ErrEnrollmentConflict
	}
	if err != nil {
		return domain.StudentRecord{}, err
	}
	date := effectiveOn.UTC().Format("2006-01-02")
	result, err := tx.Exec(ctx, `UPDATE student_enrollments SET valid_to=$2 WHERE id=$1 AND valid_to IS NULL`, enrollmentID, date)
	if err != nil {
		return domain.StudentRecord{}, mapStudentWriteError(err)
	}
	if result.RowsAffected() != 1 {
		return domain.StudentRecord{}, domain.ErrEnrollmentConflict
	}
	if _, err = tx.Exec(ctx, `INSERT INTO student_enrollments (student_id,class_id,valid_from) VALUES ($1,$2,$3)`, id, classID, date); err != nil {
		return domain.StudentRecord{}, mapStudentWriteError(err)
	}
	if _, err = tx.Exec(ctx, `UPDATE students SET class_id=$2,updated_at=NOW() WHERE id=$1`, id, classID); err != nil {
		return domain.StudentRecord{}, mapStudentWriteError(err)
	}
	if err = insertStudentAudit(ctx, tx, actorID, "TRANSFER", id); err != nil {
		return domain.StudentRecord{}, err
	}
	student, err = scanStudent(tx.QueryRow(ctx, `SELECT `+studentColumns+studentFrom+` WHERE s.id=$1`, id))
	if err != nil {
		return domain.StudentRecord{}, err
	}
	if err = tx.Commit(ctx); err != nil {
		return domain.StudentRecord{}, err
	}
	return student, nil
}

func insertStudentAudit(ctx context.Context, tx pgx.Tx, actorID uuid.UUID, action string, studentID uuid.UUID) error {
	_, err := tx.Exec(ctx, `INSERT INTO audit_events (actor_id,action,entity,entity_id) VALUES ($1,$2,'STUDENT',$3)`, actorID, action, studentID)
	return err
}

func mapStudentWriteError(err error) error {
	var pgErr *pgconn.PgError
	if !errors.As(err, &pgErr) {
		return err
	}
	if pgErr.Code == "23505" {
		switch pgErr.ConstraintName {
		case "students_student_number_key", "idx_students_student_number_unique":
			return domain.ErrDuplicateNIS
		case "idx_students_nisn_unique":
			return domain.ErrDuplicateNISN
		default:
			return domain.ErrConflict
		}
	}
	if pgErr.Code == "23503" && (pgErr.ConstraintName == "students_class_id_fkey" || pgErr.ConstraintName == "student_enrollments_class_id_fkey") {
		return domain.ErrNotFound
	}
	if pgErr.Code == "23514" || pgErr.Code == "23P01" {
		return domain.ErrEnrollmentConflict
	}
	return err
}

package postgres

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/domain"
)

type ClassRepo struct {
	pool *pgxpool.Pool
}

func NewClassRepo(pool *pgxpool.Pool) domain.ClassRepository {
	return &ClassRepo{pool: pool}
}

func (r *ClassRepo) List(ctx context.Context, f domain.ClassFilter) ([]domain.ClassDetail, int64, error) {
	where := ` WHERE c.deleted_at IS NULL`
	args := []any{}
	argIdx := 1

	if f.AcademicYearID != uuid.Nil {
		where += ` AND c.academic_year_id = $` + string(rune('0'+argIdx))
		args = append(args, f.AcademicYearID)
		argIdx++
	}
	if f.HomeroomTeacherID != uuid.Nil {
		where += ` AND c.homeroom_teacher_id = $` + string(rune('0'+argIdx))
		args = append(args, f.HomeroomTeacherID)
		argIdx++
	}
	if strings.TrimSpace(f.Search) != "" {
		search := "%" + strings.TrimSpace(f.Search) + "%"
		where += ` AND (c.name ILIKE $` + string(rune('0'+argIdx)) + ` OR c.code ILIKE $` + string(rune('0'+argIdx)) + `)`
		args = append(args, search)
		argIdx++
	}

	countQuery := `SELECT COUNT(*) FROM classes c` + where
	var total int64
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := int(f.PerPage)
	if limit <= 0 {
		limit = 20
	}
	offset := (int(f.Page) - 1) * limit
	if offset < 0 {
		offset = 0
	}

	selectQuery := `SELECT c.id, c.code, c.name, c.grade, c.section,
		c.academic_year_id, COALESCE(ay.name, ''),
		c.homeroom_teacher_id, COALESCE(u.name, ''),
		(SELECT COUNT(*) FROM students st WHERE st.class_id = c.id AND st.active AND st.deleted_at IS NULL)::int AS total_students,
		c.created_at, c.updated_at, c.deleted_at
		FROM classes c
		LEFT JOIN academic_years ay ON ay.id = c.academic_year_id
		LEFT JOIN users u ON u.id = c.homeroom_teacher_id` +
		where + ` ORDER BY c.name ASC LIMIT $` + string(rune('0'+argIdx)) + ` OFFSET $` + string(rune('0'+argIdx+1))
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []domain.ClassDetail
	for rows.Next() {
		var item domain.ClassDetail
		if err := rows.Scan(
			&item.ID, &item.Code, &item.Name, &item.Grade, &item.Section,
			&item.AcademicYearID, &item.AcademicYearName,
			&item.HomeroomTeacherID, &item.HomeroomTeacherName,
			&item.TotalStudents, &item.CreatedAt, &item.UpdatedAt, &item.DeletedAt,
		); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}

	return items, total, rows.Err()
}

func (r *ClassRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.ClassDetail, error) {
	query := `SELECT c.id, c.code, c.name, c.grade, c.section,
		c.academic_year_id, COALESCE(ay.name, ''),
		c.homeroom_teacher_id, COALESCE(u.name, ''),
		(SELECT COUNT(*) FROM students st WHERE st.class_id = c.id AND st.active AND st.deleted_at IS NULL)::int AS total_students,
		c.created_at, c.updated_at, c.deleted_at
		FROM classes c
		LEFT JOIN academic_years ay ON ay.id = c.academic_year_id
		LEFT JOIN users u ON u.id = c.homeroom_teacher_id
		WHERE c.id = $1 AND c.deleted_at IS NULL`

	var item domain.ClassDetail
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&item.ID, &item.Code, &item.Name, &item.Grade, &item.Section,
		&item.AcademicYearID, &item.AcademicYearName,
		&item.HomeroomTeacherID, &item.HomeroomTeacherName,
		&item.TotalStudents, &item.CreatedAt, &item.UpdatedAt, &item.DeletedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *ClassRepo) Create(ctx context.Context, input domain.ClassCreateInput, actorID uuid.UUID) (*domain.ClassDetail, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var classID uuid.UUID
	query := `INSERT INTO classes (id, code, name, grade, section, academic_year_id, homeroom_teacher_id, created_at, updated_at)
		VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, NOW(), NOW())
		RETURNING id`
	err = tx.QueryRow(ctx, query,
		strings.TrimSpace(input.Code), strings.TrimSpace(input.Name),
		strings.TrimSpace(input.Grade), strings.TrimSpace(input.Section),
		input.AcademicYearID, input.HomeroomTeacherID,
	).Scan(&classID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'CREATE', 'CLASS', $2)`, actorID, classID)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetByID(ctx, classID)
}

func (r *ClassRepo) Update(ctx context.Context, id uuid.UUID, input domain.ClassUpdateInput, actorID uuid.UUID) (*domain.ClassDetail, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	current, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	newCode := current.Code
	if input.Code != nil && strings.TrimSpace(*input.Code) != "" {
		newCode = strings.TrimSpace(*input.Code)
	}
	newName := current.Name
	if input.Name != nil && strings.TrimSpace(*input.Name) != "" {
		newName = strings.TrimSpace(*input.Name)
	}
	newGrade := current.Grade
	if input.Grade != nil {
		newGrade = strings.TrimSpace(*input.Grade)
	}
	newSection := current.Section
	if input.Section != nil {
		newSection = strings.TrimSpace(*input.Section)
	}
	newAcademicYearID := current.AcademicYearID
	if input.AcademicYearID != nil {
		newAcademicYearID = input.AcademicYearID
	}
	newHomeroomTeacherID := current.HomeroomTeacherID
	if input.ClearHomeroomTeacher {
		newHomeroomTeacherID = nil
	} else if input.HomeroomTeacherID != nil {
		newHomeroomTeacherID = input.HomeroomTeacherID
	}

	query := `UPDATE classes
		SET code = $1, name = $2, grade = $3, section = $4, academic_year_id = $5, homeroom_teacher_id = $6, updated_at = NOW()
		WHERE id = $7`
	_, err = tx.Exec(ctx, query, newCode, newName, newGrade, newSection, newAcademicYearID, newHomeroomTeacherID, id)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'UPDATE', 'CLASS', $2)`, actorID, id)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetByID(ctx, id)
}

func (r *ClassRepo) Delete(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var dummy uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM classes WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, id).Scan(&dummy)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return err
	}

	// Check if active students are in this class
	var studentCount int64
	if err := tx.QueryRow(ctx, `SELECT COUNT(*) FROM students WHERE class_id = $1 AND active AND deleted_at IS NULL`, id).Scan(&studentCount); err != nil {
		return err
	}
	if studentCount > 0 {
		return domain.ErrConflict
	}

	// Check teaching assignments
	var assignCount int64
	if err := tx.QueryRow(ctx, `SELECT COUNT(*) FROM teaching_assignments WHERE class_id = $1`, id).Scan(&assignCount); err != nil {
		return err
	}
	if assignCount > 0 {
		return domain.ErrConflict
	}

	_, err = tx.Exec(ctx, `UPDATE classes SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, id)
	if err != nil {
		return err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'DELETE', 'CLASS', $2)`, actorID, id)

	return tx.Commit(ctx)
}

func (r *ClassRepo) ListStudents(ctx context.Context, classID uuid.UUID, page, perPage int32) ([]domain.ClassStudentItem, int64, error) {
	countQuery := `SELECT COUNT(*) FROM students st WHERE st.class_id = $1 AND st.deleted_at IS NULL`
	var total int64
	if err := r.pool.QueryRow(ctx, countQuery, classID).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := int(perPage)
	if limit <= 0 {
		limit = 20
	}
	offset := (int(page) - 1) * limit
	if offset < 0 {
		offset = 0
	}

	selectQuery := `SELECT st.id, st.student_number, st.nisn, st.full_name, st.active,
		COALESCE(se.valid_from, st.created_at::date) as valid_from, st.created_at
		FROM students st
		LEFT JOIN student_enrollments se ON se.student_id = st.id AND se.class_id = st.class_id AND se.valid_to IS NULL
		WHERE st.class_id = $1 AND st.deleted_at IS NULL
		ORDER BY st.full_name ASC LIMIT $2 OFFSET $3`

	rows, err := r.pool.Query(ctx, selectQuery, classID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []domain.ClassStudentItem
	for rows.Next() {
		var it domain.ClassStudentItem
		var validFrom time.Time
		if err := rows.Scan(&it.StudentID, &it.NIS, &it.NISN, &it.FullName, &it.Active, &validFrom, &it.EnrolledAt); err != nil {
			return nil, 0, err
		}
		it.ValidFrom = validFrom
		items = append(items, it)
	}

	return items, total, rows.Err()
}

func (r *ClassRepo) AddStudent(ctx context.Context, classID uuid.UUID, studentID uuid.UUID, effectiveDate time.Time, actorID uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Verify class exists and not deleted
	var cID uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM classes WHERE id = $1 AND deleted_at IS NULL`, classID).Scan(&cID)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return err
	}

	// Verify student exists and not deleted
	var currentClassID uuid.UUID
	err = tx.QueryRow(ctx, `SELECT class_id FROM students WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, studentID).Scan(&currentClassID)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return err
	}

	if currentClassID == classID {
		// already in this class
		return nil
	}

	// Close open enrollment
	_, err = tx.Exec(ctx, `UPDATE student_enrollments SET valid_to = $1 WHERE student_id = $2 AND valid_to IS NULL`, effectiveDate, studentID)
	if err != nil {
		return err
	}

	// Create new open enrollment
	_, err = tx.Exec(ctx, `INSERT INTO student_enrollments (id, student_id, class_id, valid_from, created_at)
		VALUES (uuid_generate_v4(), $1, $2, $3, NOW())`, studentID, classID, effectiveDate)
	if err != nil {
		return err
	}

	// Update student class_id
	_, err = tx.Exec(ctx, `UPDATE students SET class_id = $1, updated_at = NOW() WHERE id = $2`, classID, studentID)
	if err != nil {
		return err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'ENROLL_CLASS', 'STUDENT', $2)`, actorID, studentID)

	return tx.Commit(ctx)
}

func (r *ClassRepo) RemoveStudent(ctx context.Context, classID uuid.UUID, studentID uuid.UUID, effectiveDate time.Time, actorID uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var curClass uuid.UUID
	err = tx.QueryRow(ctx, `SELECT class_id FROM students WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, studentID).Scan(&curClass)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return err
	}
	if curClass != classID {
		return domain.ErrValidation
	}

	// Close open enrollment
	res, err := tx.Exec(ctx, `UPDATE student_enrollments SET valid_to = $1 WHERE student_id = $2 AND class_id = $3 AND valid_to IS NULL`, effectiveDate, studentID, classID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'REMOVE_CLASS', 'STUDENT', $2)`, actorID, studentID)

	return tx.Commit(ctx)
}

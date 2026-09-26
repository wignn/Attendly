package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/domain"
)

type TeachingAssignmentRepo struct{ pool *pgxpool.Pool }

func NewTeachingAssignmentRepo(pool *pgxpool.Pool) domain.TeachingAssignmentRepository {
	return &TeachingAssignmentRepo{pool: pool}
}

const assignmentColumns = `id,teacher_id,class_id,subject_id,academic_year_id,active,created_at,updated_at`

func scanAssignment(row pgx.Row) (domain.TeachingAssignmentRecord, error) {
	var item domain.TeachingAssignmentRecord
	err := row.Scan(&item.ID, &item.TeacherID, &item.ClassID, &item.SubjectID, &item.AcademicYearID, &item.Active, &item.CreatedAt, &item.UpdatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return item, domain.ErrNotFound
	}
	return item, err
}

func assignmentWriteError(err error) error {
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23505":
			return domain.ErrConflict
		case "23503", "23514", "23502":
			return domain.ErrValidation
		}
	}
	return err
}

// Check the related rows before a write; foreign keys protect existence at commit.
func validateAssignmentReferences(ctx context.Context, tx pgx.Tx, input domain.TeachingAssignmentInput) error {
	var valid bool
	err := tx.QueryRow(ctx, `SELECT EXISTS (
		SELECT 1 FROM users u JOIN user_roles ur ON ur.user_id=u.id JOIN roles r ON r.role_id=ur.role_id
		WHERE u.id=$1 AND u.is_active AND r.name IN ('TEACHER','HOMEROOM_TEACHER'))`, input.TeacherID).Scan(&valid)
	if err != nil {
		return err
	}
	if !valid {
		return domain.ErrValidation
	}
	if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM classes WHERE id=$1)`, input.ClassID).Scan(&valid); err != nil {
		return err
	}
	if !valid {
		return domain.ErrValidation
	}
	if err := tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM subjects WHERE id=$1)`, input.SubjectID).Scan(&valid); err != nil {
		return err
	}
	if !valid {
		return domain.ErrValidation
	}
	if err := tx.QueryRow(ctx, `SELECT TRUE FROM academic_years WHERE id=$1 FOR SHARE`, input.AcademicYearID).Scan(&valid); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.ErrValidation
		}
		return err
	}
	if !valid {
		return domain.ErrValidation
	}
	return nil
}

func auditAssignment(ctx context.Context, tx pgx.Tx, actorID, id uuid.UUID, action string) error {
	_, err := tx.Exec(ctx, `INSERT INTO audit_events(actor_id,action,entity,entity_id) VALUES($1,$2,'teaching_assignment',$3)`, actorID, action, id)
	return err
}

func (r *TeachingAssignmentRepo) CreateAssignment(ctx context.Context, actorID uuid.UUID, input domain.TeachingAssignmentInput) (domain.TeachingAssignmentRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return domain.TeachingAssignmentRecord{}, err
	}
	defer tx.Rollback(ctx)
	if err := validateAssignmentReferences(ctx, tx, input); err != nil {
		return domain.TeachingAssignmentRecord{}, err
	}
	item, err := scanAssignment(tx.QueryRow(ctx, `INSERT INTO teaching_assignments(teacher_id,class_id,subject_id,academic_year_id)
		VALUES($1,$2,$3,$4) RETURNING `+assignmentColumns, input.TeacherID, input.ClassID, input.SubjectID, input.AcademicYearID))
	if err != nil {
		return item, assignmentWriteError(err)
	}
	if err := auditAssignment(ctx, tx, actorID, item.ID, "teaching_assignment.created"); err != nil {
		return item, err
	}
	return item, tx.Commit(ctx)
}

func (r *TeachingAssignmentRepo) GetAssignment(ctx context.Context, id uuid.UUID) (domain.TeachingAssignmentRecord, error) {
	return scanAssignment(r.pool.QueryRow(ctx, `SELECT `+assignmentColumns+` FROM teaching_assignments WHERE id=$1 AND active`, id))
}

func (r *TeachingAssignmentRepo) ListAssignments(ctx context.Context, filter domain.TeachingAssignmentFilter) ([]domain.TeachingAssignmentRecord, int64, error) {
	const where = ` FROM teaching_assignments WHERE active AND ($1::uuid IS NULL OR teacher_id=$1) AND ($2::uuid IS NULL OR class_id=$2) AND ($3::uuid IS NULL OR subject_id=$3) AND ($4::uuid IS NULL OR academic_year_id=$4)`
	args := []any{nullableUUID(filter.TeacherID), nullableUUID(filter.ClassID), nullableUUID(filter.SubjectID), nullableUUID(filter.AcademicYearID)}
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*)`+where, args...).Scan(&total); err != nil {
		return nil, 0, err
	}
	rows, err := r.pool.Query(ctx, `SELECT `+assignmentColumns+where+` ORDER BY created_at DESC,id DESC LIMIT $5 OFFSET $6`, append(args, filter.PerPage, (int64(filter.Page)-1)*int64(filter.PerPage))...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()
	items := make([]domain.TeachingAssignmentRecord, 0)
	for rows.Next() {
		item, err := scanAssignment(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	return items, total, rows.Err()
}

func (r *TeachingAssignmentRepo) UpdateAssignment(ctx context.Context, actorID, id uuid.UUID, input domain.TeachingAssignmentInput) (domain.TeachingAssignmentRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return domain.TeachingAssignmentRecord{}, err
	}
	defer tx.Rollback(ctx)
	current, err := scanAssignment(tx.QueryRow(ctx, `SELECT `+assignmentColumns+` FROM teaching_assignments WHERE id=$1 AND active FOR UPDATE`, id))
	if err != nil {
		return current, err
	}
	if current.TeacherID != input.TeacherID || current.ClassID != input.ClassID || current.SubjectID != input.SubjectID || current.AcademicYearID != input.AcademicYearID {
		var referenced bool
		err = tx.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM class_schedules WHERE teaching_assignment_id=$1) OR EXISTS(
			SELECT 1 FROM attendance_sessions WHERE teacher_id=$2 AND class_id=$3 AND subject_id=$4)`, id, current.TeacherID, current.ClassID, current.SubjectID).Scan(&referenced)
		if err != nil {
			return current, err
		}
		if referenced {
			return current, domain.ErrConflict
		}
	}
	if err := validateAssignmentReferences(ctx, tx, input); err != nil {
		return current, err
	}
	item, err := scanAssignment(tx.QueryRow(ctx, `UPDATE teaching_assignments SET teacher_id=$2,class_id=$3,subject_id=$4,academic_year_id=$5,updated_at=NOW()
		WHERE id=$1 AND active RETURNING `+assignmentColumns, id, input.TeacherID, input.ClassID, input.SubjectID, input.AcademicYearID))
	if err != nil {
		return item, assignmentWriteError(err)
	}
	if err := auditAssignment(ctx, tx, actorID, item.ID, "teaching_assignment.updated"); err != nil {
		return item, err
	}
	return item, tx.Commit(ctx)
}

func (r *TeachingAssignmentRepo) DeactivateAssignment(ctx context.Context, actorID, id uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	var lockedID uuid.UUID
	if err := tx.QueryRow(ctx, `SELECT id FROM teaching_assignments WHERE id=$1 AND active FOR UPDATE`, id).Scan(&lockedID); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.ErrNotFound
		}
		return err
	}
	rows, err := tx.Query(ctx, `UPDATE class_schedules SET active=FALSE,updated_at=NOW() WHERE teaching_assignment_id=$1 AND active RETURNING id`, id)
	if err != nil {
		return err
	}
	var scheduleIDs []uuid.UUID
	for rows.Next() {
		var scheduleID uuid.UUID
		if err := rows.Scan(&scheduleID); err != nil {
			rows.Close()
			return err
		}
		scheduleIDs = append(scheduleIDs, scheduleID)
	}
	if err := rows.Err(); err != nil {
		rows.Close()
		return err
	}
	rows.Close()
	result, err := tx.Exec(ctx, `UPDATE teaching_assignments SET active=FALSE,updated_at=NOW() WHERE id=$1 AND active`, id)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	for _, scheduleID := range scheduleIDs {
		if _, err := tx.Exec(ctx, `INSERT INTO audit_events(actor_id,action,entity,entity_id) VALUES($1,'schedule.deactivated','class_schedule',$2)`, actorID, scheduleID); err != nil {
			return err
		}
	}
	if err := auditAssignment(ctx, tx, actorID, id, "teaching_assignment.deleted"); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

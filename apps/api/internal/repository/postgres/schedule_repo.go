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

type ScheduleRepo struct{ pool *pgxpool.Pool }

func NewScheduleRepo(pool *pgxpool.Pool) domain.ScheduleRepository { return &ScheduleRepo{pool: pool} }

const scheduleSelect = `SELECT s.id,s.teaching_assignment_id,s.teacher_id,s.class_id,ta.subject_id,s.academic_year_id,
 s.day_of_week,s.starts_at::text,s.ends_at::text,s.effective_from::text,s.effective_until::text,
 s.active,s.created_at,s.updated_at FROM class_schedules s
 JOIN teaching_assignments ta ON ta.id=s.teaching_assignment_id
 JOIN academic_years ay ON ay.id=s.academic_year_id`

const scheduleWhere = ` WHERE ($1::uuid IS NULL OR s.teacher_id=$1)
 AND ($2::uuid IS NULL OR s.class_id=$2)
 AND ($3::uuid IS NULL OR ta.subject_id=$3)
 AND ($4::uuid IS NULL OR s.academic_year_id=$4)
 AND ($5::smallint IS NULL OR s.day_of_week=$5)
 AND ($6::date IS NULL OR (s.effective_from<=$6::date AND (s.effective_until IS NULL OR s.effective_until>=$6::date)
   AND ay.starts_on<=$6::date AND ay.ends_on>=$6::date))
 AND ($7::boolean IS NULL OR s.active=$7)
 AND (NOT $8::boolean OR (ta.active AND ay.active))`

func scheduleFilterArgs(f domain.ScheduleFilter) []any {
	var day any
	if f.DayOfWeek != 0 {
		day = f.DayOfWeek
	}
	var onDate any
	if f.OnDate != "" {
		onDate = f.OnDate
	}
	return []any{nullableUUID(f.TeacherID), nullableUUID(f.ClassID), nullableUUID(f.SubjectID), nullableUUID(f.AcademicYearID), day, onDate, f.Active, f.CurrentOnly}
}

func scanSchedule(row interface{ Scan(...any) error }) (*domain.Schedule, error) {
	var item domain.Schedule
	err := row.Scan(&item.ID, &item.TeachingAssignmentID, &item.TeacherID, &item.ClassID,
		&item.SubjectID, &item.AcademicYearID, &item.DayOfWeek, &item.StartsAt, &item.EndsAt,
		&item.EffectiveFrom, &item.EffectiveUntil, &item.Active, &item.CreatedAt, &item.UpdatedAt)
	if err != nil {
		return nil, mapScheduleError(err)
	}
	return &item, nil
}

func (r *ScheduleRepo) List(ctx context.Context, f domain.ScheduleFilter) ([]domain.Schedule, int64, error) {
	args := scheduleFilterArgs(f)
	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM class_schedules s JOIN teaching_assignments ta ON ta.id=s.teaching_assignment_id JOIN academic_years ay ON ay.id=s.academic_year_id`+scheduleWhere, args...).Scan(&total); err != nil {
		return nil, 0, mapScheduleError(err)
	}
	rows, err := r.pool.Query(ctx, scheduleSelect+scheduleWhere+` ORDER BY s.day_of_week,s.starts_at,s.id LIMIT $9 OFFSET $10`, append(args, f.PerPage, (int64(f.Page)-1)*int64(f.PerPage))...)
	if err != nil {
		return nil, 0, mapScheduleError(err)
	}
	defer rows.Close()
	items := make([]domain.Schedule, 0)
	for rows.Next() {
		item, err := scanSchedule(rows)
		if err != nil {
			return nil, 0, err
		}
		items = append(items, *item)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, mapScheduleError(err)
	}
	return items, total, nil
}

func (r *ScheduleRepo) Get(ctx context.Context, id uuid.UUID) (*domain.Schedule, error) {
	return scanSchedule(r.pool.QueryRow(ctx, scheduleSelect+` WHERE s.id=$1`, id))
}

func (r *ScheduleRepo) Create(ctx context.Context, item *domain.Schedule, actor uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	_, err = tx.Exec(ctx, `INSERT INTO class_schedules
 (id,teaching_assignment_id,day_of_week,starts_at,ends_at,effective_from,effective_until)
 VALUES ($1,$2,$3,$4::time,$5::time,$6::date,$7::date)`, item.ID, item.TeachingAssignmentID,
		item.DayOfWeek, item.StartsAt, item.EndsAt, item.EffectiveFrom, item.EffectiveUntil)
	if err != nil {
		return mapScheduleError(err)
	}
	if err := scheduleAudit(ctx, tx, actor, "schedule.created", item.ID); err != nil {
		return err
	}
	created, err := scanSchedule(tx.QueryRow(ctx, scheduleSelect+` WHERE s.id=$1`, item.ID))
	if err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return mapScheduleError(err)
	}
	*item = *created
	return nil
}

func (r *ScheduleRepo) Update(ctx context.Context, item *domain.Schedule, actor uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	result, err := tx.Exec(ctx, `UPDATE class_schedules SET teaching_assignment_id=$2,day_of_week=$3,
 starts_at=$4::time,ends_at=$5::time,effective_from=$6::date,effective_until=$7::date
 WHERE id=$1 AND active`, item.ID, item.TeachingAssignmentID, item.DayOfWeek,
		item.StartsAt, item.EndsAt, item.EffectiveFrom, item.EffectiveUntil)
	if err != nil {
		return mapScheduleError(err)
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	if err := scheduleAudit(ctx, tx, actor, "schedule.updated", item.ID); err != nil {
		return err
	}
	updated, err := scanSchedule(tx.QueryRow(ctx, scheduleSelect+` WHERE s.id=$1`, item.ID))
	if err != nil {
		return err
	}
	if err := tx.Commit(ctx); err != nil {
		return mapScheduleError(err)
	}
	*item = *updated
	return nil
}

func (r *ScheduleRepo) Delete(ctx context.Context, id uuid.UUID, actor uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	result, err := tx.Exec(ctx, `UPDATE class_schedules SET active=FALSE,updated_at=NOW() WHERE id=$1 AND active`, id)
	if err != nil {
		return mapScheduleError(err)
	}
	if result.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	if err := scheduleAudit(ctx, tx, actor, "schedule.deleted", id); err != nil {
		return err
	}
	return mapScheduleError(tx.Commit(ctx))
}

func scheduleAudit(ctx context.Context, tx pgx.Tx, actor uuid.UUID, action string, id uuid.UUID) error {
	_, err := tx.Exec(ctx, `INSERT INTO audit_events (actor_id,action,entity,entity_id) VALUES ($1,$2,'class_schedule',$3)`, actor, action, id)
	return mapScheduleError(err)
}

func mapScheduleError(err error) error {
	if err == nil {
		return nil
	}
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	var pgErr *pgconn.PgError
	if errors.As(err, &pgErr) {
		switch pgErr.Code {
		case "23P01", "23505":
			return domain.ErrConflict
		case "23503", "23514", "22007", "22008", "22P02":
			return domain.ErrValidation
		}
	}
	return err
}

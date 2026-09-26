package postgres

import (
	"context"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/domain"
)

type AcademicYearRepo struct {
	pool *pgxpool.Pool
}

func NewAcademicYearRepo(pool *pgxpool.Pool) domain.AcademicYearRepository {
	return &AcademicYearRepo{pool: pool}
}

func (r *AcademicYearRepo) List(ctx context.Context, f domain.AcademicYearFilter) ([]domain.AcademicYearRecord, int64, error) {
	where := ` WHERE 1=1`
	args := []any{}
	argIdx := 1

	if f.Active != nil {
		where += ` AND active = $` + string(rune('0'+argIdx))
		args = append(args, *f.Active)
		argIdx++
	}

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM academic_years`+where, args...).Scan(&total); err != nil {
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

	query := `SELECT id, name, semester, starts_on::text, ends_on::text, active, created_at, updated_at
		FROM academic_years` + where +
		` ORDER BY starts_on DESC, semester DESC LIMIT $` + string(rune('0'+argIdx)) + ` OFFSET $` + string(rune('0'+argIdx+1))
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []domain.AcademicYearRecord
	for rows.Next() {
		var item domain.AcademicYearRecord
		if err := rows.Scan(&item.ID, &item.Name, &item.Semester, &item.StartsOn, &item.EndsOn, &item.Active, &item.CreatedAt, &item.UpdatedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	return items, total, rows.Err()
}

func (r *AcademicYearRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.AcademicYearRecord, error) {
	var item domain.AcademicYearRecord
	query := `SELECT id, name, semester, starts_on::text, ends_on::text, active, created_at, updated_at
		FROM academic_years WHERE id = $1`
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&item.ID, &item.Name, &item.Semester, &item.StartsOn, &item.EndsOn, &item.Active, &item.CreatedAt, &item.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *AcademicYearRepo) Create(ctx context.Context, item domain.AcademicYearRecord, actorID uuid.UUID) (*domain.AcademicYearRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	if item.Active {
		if _, err := tx.Exec(ctx, `UPDATE academic_years SET active = FALSE WHERE active = TRUE`); err != nil {
			return nil, err
		}
	}

	var created domain.AcademicYearRecord
	query := `INSERT INTO academic_years (id, name, semester, starts_on, ends_on, active, created_at, updated_at)
		VALUES (uuid_generate_v4(), $1, $2, $3::date, $4::date, $5, NOW(), NOW())
		RETURNING id, name, semester, starts_on::text, ends_on::text, active, created_at, updated_at`
	err = tx.QueryRow(ctx, query, strings.TrimSpace(item.Name), item.Semester, item.StartsOn, item.EndsOn, item.Active).
		Scan(&created.ID, &created.Name, &created.Semester, &created.StartsOn, &created.EndsOn, &created.Active, &created.CreatedAt, &created.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && (pgErr.Code == "23505" || pgErr.Code == "23P01") {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'CREATE', 'ACADEMIC_YEAR', $2)`, actorID, created.ID)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &created, nil
}

func (r *AcademicYearRepo) Update(ctx context.Context, id uuid.UUID, input domain.AcademicYearUpdateInput, actorID uuid.UUID) (*domain.AcademicYearRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	current, err := r.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	newName := current.Name
	if input.Name != nil && strings.TrimSpace(*input.Name) != "" {
		newName = strings.TrimSpace(*input.Name)
	}
	newSemester := current.Semester
	if input.Semester != nil && (*input.Semester == 1 || *input.Semester == 2) {
		newSemester = *input.Semester
	}
	newStartsOn := current.StartsOn
	if input.StartsOn != nil && strings.TrimSpace(*input.StartsOn) != "" {
		newStartsOn = strings.TrimSpace(*input.StartsOn)
	}
	newEndsOn := current.EndsOn
	if input.EndsOn != nil && strings.TrimSpace(*input.EndsOn) != "" {
		newEndsOn = strings.TrimSpace(*input.EndsOn)
	}

	var updated domain.AcademicYearRecord
	query := `UPDATE academic_years
		SET name = $1, semester = $2, starts_on = $3::date, ends_on = $4::date, updated_at = NOW()
		WHERE id = $5
		RETURNING id, name, semester, starts_on::text, ends_on::text, active, created_at, updated_at`
	err = tx.QueryRow(ctx, query, newName, newSemester, newStartsOn, newEndsOn, id).
		Scan(&updated.ID, &updated.Name, &updated.Semester, &updated.StartsOn, &updated.EndsOn, &updated.Active, &updated.CreatedAt, &updated.UpdatedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && (pgErr.Code == "23505" || pgErr.Code == "23P01") {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'UPDATE', 'ACADEMIC_YEAR', $2)`, actorID, id)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &updated, nil
}

func (r *AcademicYearRepo) Delete(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var active bool
	err = tx.QueryRow(ctx, `SELECT active FROM academic_years WHERE id = $1 FOR UPDATE`, id).Scan(&active)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return err
	}
	if active {
		return domain.ErrConflict
	}

	var assignCount int64
	if err := tx.QueryRow(ctx, `SELECT COUNT(*) FROM teaching_assignments WHERE academic_year_id = $1`, id).Scan(&assignCount); err != nil {
		return err
	}
	if assignCount > 0 {
		return domain.ErrConflict
	}

	_, err = tx.Exec(ctx, `DELETE FROM academic_years WHERE id = $1`, id)
	if err != nil {
		return err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'DELETE', 'ACADEMIC_YEAR', $2)`, actorID, id)

	return tx.Commit(ctx)
}

func (r *AcademicYearRepo) Activate(ctx context.Context, id uuid.UUID, actorID uuid.UUID) (*domain.AcademicYearRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var dummy uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM academic_years WHERE id = $1 FOR UPDATE`, id).Scan(&dummy)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if _, err := tx.Exec(ctx, `UPDATE academic_years SET active = FALSE WHERE active = TRUE`); err != nil {
		return nil, err
	}

	var activated domain.AcademicYearRecord
	query := `UPDATE academic_years SET active = TRUE, updated_at = NOW() WHERE id = $1
		RETURNING id, name, semester, starts_on::text, ends_on::text, active, created_at, updated_at`
	err = tx.QueryRow(ctx, query, id).
		Scan(&activated.ID, &activated.Name, &activated.Semester, &activated.StartsOn, &activated.EndsOn, &activated.Active, &activated.CreatedAt, &activated.UpdatedAt)
	if err != nil {
		return nil, err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'ACTIVATE', 'ACADEMIC_YEAR', $2)`, actorID, id)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &activated, nil
}

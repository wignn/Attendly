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

type SubjectRepo struct {
	pool *pgxpool.Pool
}

func NewSubjectRepo(pool *pgxpool.Pool) domain.SubjectRepository {
	return &SubjectRepo{pool: pool}
}

func (r *SubjectRepo) List(ctx context.Context, f domain.SubjectFilter) ([]domain.SubjectRecord, int64, error) {
	where := ` WHERE deleted_at IS NULL`
	args := []any{}
	argIdx := 1

	if strings.TrimSpace(f.Search) != "" {
		where += ` AND (code ILIKE $` + string(rune('0'+argIdx)) + ` OR name ILIKE $` + string(rune('0'+argIdx)) + `)`
		args = append(args, "%"+strings.TrimSpace(f.Search)+"%")
		argIdx++
	}

	var total int64
	if err := r.pool.QueryRow(ctx, `SELECT COUNT(*) FROM subjects`+where, args...).Scan(&total); err != nil {
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

	query := `SELECT id, code, name, created_at, updated_at, deleted_at FROM subjects` +
		where + ` ORDER BY code ASC LIMIT $` + string(rune('0'+argIdx)) + ` OFFSET $` + string(rune('0'+argIdx+1))
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []domain.SubjectRecord
	for rows.Next() {
		var item domain.SubjectRecord
		if err := rows.Scan(&item.ID, &item.Code, &item.Name, &item.CreatedAt, &item.UpdatedAt, &item.DeletedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}
	return items, total, rows.Err()
}

func (r *SubjectRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.SubjectRecord, error) {
	var item domain.SubjectRecord
	err := r.pool.QueryRow(ctx, `SELECT id, code, name, created_at, updated_at, deleted_at FROM subjects WHERE id = $1 AND deleted_at IS NULL`, id).
		Scan(&item.ID, &item.Code, &item.Name, &item.CreatedAt, &item.UpdatedAt, &item.DeletedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *SubjectRepo) Create(ctx context.Context, item domain.SubjectRecord, actorID uuid.UUID) (*domain.SubjectRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var created domain.SubjectRecord
	query := `INSERT INTO subjects (id, code, name, created_at, updated_at)
		VALUES (uuid_generate_v4(), $1, $2, NOW(), NOW())
		RETURNING id, code, name, created_at, updated_at, deleted_at`
	err = tx.QueryRow(ctx, query, strings.TrimSpace(item.Code), strings.TrimSpace(item.Name)).
		Scan(&created.ID, &created.Code, &created.Name, &created.CreatedAt, &created.UpdatedAt, &created.DeletedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'CREATE', 'SUBJECT', $2)`, actorID, created.ID)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &created, nil
}

func (r *SubjectRepo) Update(ctx context.Context, id uuid.UUID, input domain.SubjectUpdateInput, actorID uuid.UUID) (*domain.SubjectRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var current domain.SubjectRecord
	err = tx.QueryRow(ctx, `SELECT id, code, name FROM subjects WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, id).
		Scan(&current.ID, &current.Code, &current.Name)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
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

	var updated domain.SubjectRecord
	query := `UPDATE subjects SET code = $1, name = $2, updated_at = NOW() WHERE id = $3
		RETURNING id, code, name, created_at, updated_at, deleted_at`
	err = tx.QueryRow(ctx, query, newCode, newName, id).
		Scan(&updated.ID, &updated.Code, &updated.Name, &updated.CreatedAt, &updated.UpdatedAt, &updated.DeletedAt)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'UPDATE', 'SUBJECT', $2)`, actorID, id)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &updated, nil
}

func (r *SubjectRepo) Delete(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	// Check if exists
	var dummy uuid.UUID
	err = tx.QueryRow(ctx, `SELECT id FROM subjects WHERE id = $1 AND deleted_at IS NULL FOR UPDATE`, id).Scan(&dummy)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return err
	}

	// Check if referenced by teaching assignments
	var assignCount int64
	if err := tx.QueryRow(ctx, `SELECT COUNT(*) FROM teaching_assignments WHERE subject_id = $1`, id).Scan(&assignCount); err != nil {
		return err
	}
	if assignCount > 0 {
		return domain.ErrConflict
	}

	// Check if referenced by attendance sessions
	var sessionCount int64
	if err := tx.QueryRow(ctx, `SELECT COUNT(*) FROM attendance_sessions WHERE subject_id = $1`, id).Scan(&sessionCount); err != nil {
		return err
	}
	if sessionCount > 0 {
		return domain.ErrConflict
	}

	_, err = tx.Exec(ctx, `UPDATE subjects SET deleted_at = NOW(), updated_at = NOW() WHERE id = $1`, id)
	if err != nil {
		return err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'DELETE', 'SUBJECT', $2)`, actorID, id)

	return tx.Commit(ctx)
}

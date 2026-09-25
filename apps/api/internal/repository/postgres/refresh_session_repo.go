package postgres

import (
	"context"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/domain"
)

type RefreshSessionRepo struct {
	pool *pgxpool.Pool
}

func NewRefreshSessionRepo(pool *pgxpool.Pool) domain.RefreshSessionRepository {
	return &RefreshSessionRepo{pool: pool}
}

func (r *RefreshSessionRepo) Create(ctx context.Context, session domain.RefreshSession) error {
	_, err := r.pool.Exec(ctx, `
		INSERT INTO refresh_sessions (token_id, family_id, user_id, expires_at)
		VALUES ($1, $2, $3, $4)
	`, session.TokenID, session.FamilyID, session.UserID, session.ExpiresAt)
	return err
}

func (r *RefreshSessionRepo) Rotate(ctx context.Context, tokenID string, next domain.RefreshSession) (bool, error) {
	tx, err := r.pool.BeginTx(ctx, pgx.TxOptions{})
	if err != nil {
		return false, err
	}
	defer tx.Rollback(ctx)

	if _, err := tx.Exec(ctx, `SELECT pg_advisory_xact_lock(hashtextextended($1, 0))`, next.FamilyID); err != nil {
		return false, err
	}

	command, err := tx.Exec(ctx, `
		UPDATE refresh_sessions
		SET revoked_at = NOW()
		WHERE token_id = $1 AND revoked_at IS NULL AND expires_at > NOW()
	`, tokenID)
	if err != nil {
		return false, err
	}
	if command.RowsAffected() == 0 {
		return false, nil
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO refresh_sessions (token_id, family_id, user_id, expires_at)
		VALUES ($1, $2, $3, $4)
	`, next.TokenID, next.FamilyID, next.UserID, next.ExpiresAt)
	if err != nil {
		return false, err
	}
	if err := tx.Commit(ctx); err != nil {
		return false, err
	}
	return true, nil
}

func (r *RefreshSessionRepo) Revoke(ctx context.Context, tokenID, familyID string, userID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE refresh_sessions SET revoked_at = NOW()
		WHERE token_id = $1 AND family_id = $2 AND user_id = $3 AND revoked_at IS NULL
	`, tokenID, familyID, userID)
	return err
}

func (r *RefreshSessionRepo) RevokeFamily(ctx context.Context, familyID string) error {
	_, err := r.pool.Exec(ctx, `
		UPDATE refresh_sessions SET revoked_at = NOW()
		WHERE family_id = $1 AND revoked_at IS NULL
	`, familyID)
	return err
}

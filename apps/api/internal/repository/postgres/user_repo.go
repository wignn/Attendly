package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/domain"
)

type UserRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) domain.UserRepository {
	return &UserRepo{pool: pool}
}

func (r *UserRepo) Create(ctx context.Context, u *domain.User) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	query := `
		INSERT INTO users (id, email, password, name, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	if _, err := tx.Exec(ctx, query, u.ID, u.Email, u.Password, u.Name, u.IsActive, u.CreatedAt, u.UpdatedAt); err != nil {
		return err
	}
	if err := setUserRoles(ctx, tx, u.ID, u.RoleSet()); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func setUserRoles(ctx context.Context, tx pgx.Tx, userID uuid.UUID, roles []domain.Role) error {
	for _, role := range roles {
		if !role.IsValid() {
			return domain.ErrInvalidRole
		}
		result, err := tx.Exec(ctx, `INSERT INTO user_roles (user_id, role_id) SELECT $1, role_id FROM roles WHERE name = $2`, userID, string(role))
		if err != nil {
			return err
		}
		if result.RowsAffected() != 1 {
			return domain.ErrInvalidRole
		}
	}
	return nil
}

func (r *UserRepo) SetRoles(ctx context.Context, userID uuid.UUID, roles []domain.Role) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	if _, err := tx.Exec(ctx, `DELETE FROM user_roles WHERE user_id = $1`, userID); err != nil {
		return err
	}
	if err := setUserRoles(ctx, tx, userID, roles); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *UserRepo) loadRoles(ctx context.Context, user *domain.User) error {
	rows, err := r.pool.Query(ctx, `SELECT roles.name FROM user_roles JOIN roles USING (role_id) WHERE user_id = $1 ORDER BY roles.name`, user.ID)
	if err != nil {
		return err
	}
	defer rows.Close()
	var roles []domain.Role
	for rows.Next() {
		var role string
		if err := rows.Scan(&role); err != nil {
			return err
		}
		roles = append(roles, domain.Role(role))
	}
	if err := rows.Err(); err != nil {
		return err
	}
	user.SetRoles(roles)
	return nil
}

func (r *UserRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `SELECT id, email, password, name, is_active, created_at, updated_at FROM users WHERE id = $1`
	row := r.pool.QueryRow(ctx, query, id)

	var u domain.User
	err := row.Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	if err := r.loadRoles(ctx, &u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `SELECT id, email, password, name, is_active, created_at, updated_at FROM users WHERE email = $1`
	row := r.pool.QueryRow(ctx, query, email)

	var u domain.User
	err := row.Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.IsActive, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	if err := r.loadRoles(ctx, &u); err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UserRepo) List(ctx context.Context, offset, limit int32) ([]*domain.User, int64, error) {
	countQuery := `SELECT COUNT(*) FROM users`
	var total int64
	if err := r.pool.QueryRow(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `SELECT id, email, password, name, is_active, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var u domain.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Password, &u.Name, &u.IsActive, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		users = append(users, &u)
	}
	if err := rows.Err(); err != nil {
		return nil, 0, err
	}
	rows.Close()

	for _, u := range users {
		if err := r.loadRoles(ctx, u); err != nil {
			return nil, 0, err
		}
	}
	return users, total, nil
}

func (r *UserRepo) Update(ctx context.Context, u *domain.User) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	u.UpdatedAt = time.Now()
	if _, err := tx.Exec(ctx, `UPDATE users SET name = $2, is_active = $3, updated_at = $4 WHERE id = $1`, u.ID, u.Name, u.IsActive, u.UpdatedAt); err != nil {
		return err
	}
	if _, err := tx.Exec(ctx, `DELETE FROM user_roles WHERE user_id = $1`, u.ID); err != nil {
		return err
	}
	if err := setUserRoles(ctx, tx, u.ID, u.RoleSet()); err != nil {
		return err
	}
	return tx.Commit(ctx)
}

func (r *UserRepo) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

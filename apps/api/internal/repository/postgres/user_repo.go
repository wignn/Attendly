package postgres

import (
	"context"
	"errors"
	"time"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepo struct {
	pool *pgxpool.Pool
}

func NewUserRepo(pool *pgxpool.Pool) domain.UserRepository {
	return &UserRepo{pool: pool}
}

func (r *UserRepo) Create(ctx context.Context, u *domain.User) error {
	query := `
		INSERT INTO users (id, email, password, name, role, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`
	_, err := r.pool.Exec(ctx, query, u.ID, u.Email, u.Password, u.Name, string(u.Role), u.CreatedAt, u.UpdatedAt)
	return err
}

func (r *UserRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	query := `SELECT id, email, password, name, role, created_at, updated_at FROM users WHERE id = $1`
	row := r.pool.QueryRow(ctx, query, id)

	var u domain.User
	var roleStr string
	err := row.Scan(&u.ID, &u.Email, &u.Password, &u.Name, &roleStr, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	u.Role = domain.Role(roleStr)
	return &u, nil
}

func (r *UserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `SELECT id, email, password, name, role, created_at, updated_at FROM users WHERE email = $1`
	row := r.pool.QueryRow(ctx, query, email)

	var u domain.User
	var roleStr string
	err := row.Scan(&u.ID, &u.Email, &u.Password, &u.Name, &roleStr, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	u.Role = domain.Role(roleStr)
	return &u, nil
}

func (r *UserRepo) List(ctx context.Context, offset, limit int32) ([]*domain.User, int64, error) {
	countQuery := `SELECT COUNT(*) FROM users`
	var total int64
	if err := r.pool.QueryRow(ctx, countQuery).Scan(&total); err != nil {
		return nil, 0, err
	}

	query := `SELECT id, email, password, name, role, created_at, updated_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.pool.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var users []*domain.User
	for rows.Next() {
		var u domain.User
		var roleStr string
		if err := rows.Scan(&u.ID, &u.Email, &u.Password, &u.Name, &roleStr, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, 0, err
		}
		u.Role = domain.Role(roleStr)
		users = append(users, &u)
	}

	return users, total, nil
}

func (r *UserRepo) Update(ctx context.Context, u *domain.User) error {
	query := `UPDATE users SET name = $2, role = $3, updated_at = $4 WHERE id = $1`
	u.UpdatedAt = time.Now()
	_, err := r.pool.Exec(ctx, query, u.ID, u.Name, string(u.Role), u.UpdatedAt)
	return err
}

func (r *UserRepo) Delete(ctx context.Context, id uuid.UUID) error {
	query := `DELETE FROM users WHERE id = $1`
	_, err := r.pool.Exec(ctx, query, id)
	return err
}

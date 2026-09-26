package postgres

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"errors"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/domain"
	"golang.org/x/crypto/bcrypt"
)

type TeacherRepo struct {
	pool *pgxpool.Pool
}

func NewTeacherRepo(pool *pgxpool.Pool) domain.TeacherRepository {
	return &TeacherRepo{pool: pool}
}

func (r *TeacherRepo) List(ctx context.Context, f domain.TeacherFilter) ([]domain.TeacherRecord, int64, error) {
	where := ` WHERE 1=1`
	args := []any{}
	argIdx := 1

	if !f.IncludeDeleted {
		where += ` AND t.deleted_at IS NULL`
	}
	if f.Status != "" {
		where += ` AND t.status = $` + string(rune('0'+argIdx))
		args = append(args, f.Status)
		argIdx++
	}
	if strings.TrimSpace(f.Search) != "" {
		search := "%" + strings.TrimSpace(f.Search) + "%"
		where += ` AND (u.name ILIKE $` + string(rune('0'+argIdx)) + ` OR u.email ILIKE $` + string(rune('0'+argIdx)) + ` OR t.nip ILIKE $` + string(rune('0'+argIdx)) + `)`
		args = append(args, search)
		argIdx++
	}

	countQuery := `SELECT COUNT(*) FROM teachers t JOIN users u ON u.id = t.user_id` + where
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

	selectQuery := `SELECT t.id, t.user_id, COALESCE(t.nip, ''), u.name, u.email, t.phone, t.status, t.created_at, t.updated_at, t.deleted_at
		FROM teachers t
		JOIN users u ON u.id = t.user_id` + where +
		` ORDER BY u.name ASC LIMIT $` + string(rune('0'+argIdx)) + ` OFFSET $` + string(rune('0'+argIdx+1))
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, selectQuery, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var items []domain.TeacherRecord
	for rows.Next() {
		var item domain.TeacherRecord
		if err := rows.Scan(&item.ID, &item.UserID, &item.NIP, &item.FullName, &item.Email, &item.Phone, &item.Status, &item.CreatedAt, &item.UpdatedAt, &item.DeletedAt); err != nil {
			return nil, 0, err
		}
		items = append(items, item)
	}

	return items, total, rows.Err()
}

func (r *TeacherRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.TeacherRecord, error) {
	query := `SELECT t.id, t.user_id, COALESCE(t.nip, ''), u.name, u.email, t.phone, t.status, t.created_at, t.updated_at, t.deleted_at
		FROM teachers t
		JOIN users u ON u.id = t.user_id
		WHERE (t.id = $1 OR t.user_id = $1) AND t.deleted_at IS NULL`
	var item domain.TeacherRecord
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&item.ID, &item.UserID, &item.NIP, &item.FullName, &item.Email, &item.Phone, &item.Status, &item.CreatedAt, &item.UpdatedAt, &item.DeletedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *TeacherRepo) Create(ctx context.Context, input domain.TeacherCreateInput, actorID uuid.UUID) (*domain.TeacherRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	pwd := strings.TrimSpace(input.Password)
	if pwd == "" {
		secret := make([]byte, 32)
		if _, err := rand.Read(secret); err != nil {
			return nil, err
		}
		pwd = base64.RawURLEncoding.EncodeToString(secret)
	} else if len(pwd) < 12 {
		return nil, domain.ErrValidation
	}
	hashed, err := bcrypt.GenerateFromPassword([]byte(pwd), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	userID := uuid.New()
	userInsertQuery := `INSERT INTO users (id, email, password, name, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, true, NOW(), NOW())`
	_, err = tx.Exec(ctx, userInsertQuery, userID, strings.TrimSpace(input.Email), string(hashed), strings.TrimSpace(input.FullName))
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	roleAssignQuery := `INSERT INTO user_roles (user_id, role_id, granted_by, granted_at)
		SELECT $1, role_id, $2, NOW() FROM roles WHERE name = 'TEACHER'`
	if _, err := tx.Exec(ctx, roleAssignQuery, userID, actorID); err != nil {
		return nil, err
	}

	teacherInsertQuery := `INSERT INTO teachers (id, user_id, nip, phone, status, created_at, updated_at)
		VALUES ($1, $1, $2, $3, 'ACTIVE', NOW(), NOW())`
	_, err = tx.Exec(ctx, teacherInsertQuery, userID, strings.TrimSpace(input.NIP), strings.TrimSpace(input.Phone))
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	if _, err := tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'CREATE', 'TEACHER', $2)`, actorID, userID); err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetByID(ctx, userID)
}

func (r *TeacherRepo) Update(ctx context.Context, id uuid.UUID, input domain.TeacherUpdateInput, actorID uuid.UUID) (*domain.TeacherRecord, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var userID uuid.UUID
	var curNip, curPhone, curStatus string
	var curName, curEmail string
	err = tx.QueryRow(ctx, `SELECT t.user_id, COALESCE(t.nip, ''), t.phone, t.status, u.name, u.email
		FROM teachers t JOIN users u ON u.id = t.user_id
		WHERE (t.id = $1 OR t.user_id = $1) AND t.deleted_at IS NULL FOR UPDATE`, id).
		Scan(&userID, &curNip, &curPhone, &curStatus, &curName, &curEmail)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	newNip := curNip
	if input.NIP != nil && strings.TrimSpace(*input.NIP) != "" {
		newNip = strings.TrimSpace(*input.NIP)
	}
	newPhone := curPhone
	if input.Phone != nil {
		newPhone = strings.TrimSpace(*input.Phone)
	}
	newStatus := curStatus
	if input.Status != nil && (*input.Status == "ACTIVE" || *input.Status == "INACTIVE") {
		newStatus = *input.Status
	}
	newName := curName
	if input.FullName != nil && strings.TrimSpace(*input.FullName) != "" {
		newName = strings.TrimSpace(*input.FullName)
	}
	newEmail := curEmail
	if input.Email != nil && strings.TrimSpace(*input.Email) != "" {
		newEmail = strings.TrimSpace(*input.Email)
	}

	isActive := newStatus == "ACTIVE"
	_, err = tx.Exec(ctx, `UPDATE users SET name = $1, email = $2, is_active = $3, updated_at = NOW() WHERE id = $4`,
		newName, newEmail, isActive, userID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	_, err = tx.Exec(ctx, `UPDATE teachers SET nip = $1, phone = $2, status = $3, updated_at = NOW() WHERE user_id = $4`,
		newNip, newPhone, newStatus, userID)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, domain.ErrConflict
		}
		return nil, err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'UPDATE', 'TEACHER', $2)`, actorID, userID)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetByID(ctx, userID)
}

func (r *TeacherRepo) Delete(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var userID uuid.UUID
	err = tx.QueryRow(ctx, `SELECT user_id FROM teachers WHERE (id = $1 OR user_id = $1) AND deleted_at IS NULL FOR UPDATE`, id).Scan(&userID)
	if errors.Is(err, pgx.ErrNoRows) {
		return domain.ErrNotFound
	}
	if err != nil {
		return err
	}

	// Soft delete preserving assignments and attendance history
	_, err = tx.Exec(ctx, `UPDATE teachers SET deleted_at = NOW(), status = 'INACTIVE', updated_at = NOW() WHERE user_id = $1`, userID)
	if err != nil {
		return err
	}

	_, err = tx.Exec(ctx, `UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1`, userID)
	if err != nil {
		return err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'DELETE', 'TEACHER', $2)`, actorID, userID)

	return tx.Commit(ctx)
}

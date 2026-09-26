package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/domain"
)

type ExportAuditRepo struct {
	pool *pgxpool.Pool
}

func NewExportAuditRepo(pool *pgxpool.Pool) domain.ExportAuditRepository {
	return &ExportAuditRepo{pool: pool}
}

func (r *ExportAuditRepo) ListAuditLogs(ctx context.Context, f domain.AuditLogFilter) ([]domain.AuditLog, int64, error) {
	where := ` WHERE 1=1`
	args := []any{}
	argIdx := 1

	if f.ActorID != uuid.Nil {
		where += ` AND a.actor_id = $` + string(rune('0'+argIdx))
		args = append(args, f.ActorID)
		argIdx++
	}
	if strings.TrimSpace(f.Entity) != "" {
		where += ` AND a.entity = $` + string(rune('0'+argIdx))
		args = append(args, strings.TrimSpace(f.Entity))
		argIdx++
	}
	if f.EntityID != uuid.Nil {
		where += ` AND a.entity_id = $` + string(rune('0'+argIdx))
		args = append(args, f.EntityID)
		argIdx++
	}
	if strings.TrimSpace(f.Action) != "" {
		where += ` AND a.action = $` + string(rune('0'+argIdx))
		args = append(args, strings.TrimSpace(f.Action))
		argIdx++
	}
	if strings.TrimSpace(f.FromDate) != "" {
		where += ` AND a.created_at::date >= $` + string(rune('0'+argIdx)) + `::date`
		args = append(args, f.FromDate)
		argIdx++
	}
	if strings.TrimSpace(f.ToDate) != "" {
		where += ` AND a.created_at::date <= $` + string(rune('0'+argIdx)) + `::date`
		args = append(args, f.ToDate)
		argIdx++
	}

	countQuery := `SELECT COUNT(*) FROM audit_events a` + where
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

	query := `SELECT a.id, a.actor_id, COALESCE(u.name, ''), a.action, a.entity, a.entity_id, COALESCE(a.details, '{}'::jsonb), a.created_at
		FROM audit_events a
		LEFT JOIN users u ON u.id = a.actor_id` +
		where + ` ORDER BY a.created_at DESC LIMIT $` + string(rune('0'+argIdx)) + ` OFFSET $` + string(rune('0'+argIdx+1))
	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var list []domain.AuditLog
	for rows.Next() {
		var it domain.AuditLog
		var rawDetails []byte
		if err := rows.Scan(&it.ID, &it.ActorID, &it.ActorName, &it.Action, &it.Entity, &it.EntityID, &rawDetails, &it.CreatedAt); err != nil {
			return nil, 0, err
		}
		if len(rawDetails) > 0 {
			_ = json.Unmarshal(rawDetails, &it.Details)
		}
		list = append(list, it)
	}

	return list, total, rows.Err()
}

func (r *ExportAuditRepo) GetAuditLogByID(ctx context.Context, id uuid.UUID) (*domain.AuditLog, error) {
	query := `SELECT a.id, a.actor_id, COALESCE(u.name, ''), a.action, a.entity, a.entity_id, COALESCE(a.details, '{}'::jsonb), a.created_at
		FROM audit_events a
		LEFT JOIN users u ON u.id = a.actor_id
		WHERE a.id = $1`

	var it domain.AuditLog
	var rawDetails []byte
	err := r.pool.QueryRow(ctx, query, id).Scan(&it.ID, &it.ActorID, &it.ActorName, &it.Action, &it.Entity, &it.EntityID, &rawDetails, &it.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if len(rawDetails) > 0 {
		_ = json.Unmarshal(rawDetails, &it.Details)
	}
	return &it, nil
}

func (r *ExportAuditRepo) CreateExportJob(ctx context.Context, in domain.CreateExportInput, actorID uuid.UUID) (*domain.ExportJob, error) {
	jobID := uuid.New()
	filterMap := make(map[string]any)
	if in.ClassID != nil {
		filterMap["class_id"] = in.ClassID.String()
	}
	if in.SubjectID != nil {
		filterMap["subject_id"] = in.SubjectID.String()
	}
	if in.FromDate != "" {
		filterMap["from_date"] = in.FromDate
	}
	if in.ToDate != "" {
		filterMap["to_date"] = in.ToDate
	}
	filterJSON, _ := json.Marshal(filterMap)

	expType := in.ExportType
	if strings.TrimSpace(expType) == "" {
		expType = "ATTENDANCE"
	}
	format := strings.ToUpper(strings.TrimSpace(in.FileFormat))
	if format != "CSV" && format != "XLSX" && format != "PDF" {
		format = "CSV"
	}

	storageKey := fmt.Sprintf("exports/%s/%s.%s", actorID.String(), jobID.String(), strings.ToLower(format))
	downloadURL := fmt.Sprintf("/api/v1/exports/%s", jobID.String())

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	insertQuery := `INSERT INTO export_jobs (id, user_id, export_type, file_format, status, filter_params, storage_key, download_url, expires_at, created_at, updated_at)
		VALUES ($1, $2, $3, $4, 'COMPLETED', $5, $6, $7, NOW() + INTERVAL '24 hours', NOW(), NOW())
		RETURNING id, user_id, export_type, file_format, status, expires_at, created_at, updated_at`

	var job domain.ExportJob
	err = tx.QueryRow(ctx, insertQuery, jobID, actorID, expType, format, filterJSON, storageKey, downloadURL).
		Scan(&job.ID, &job.UserID, &job.ExportType, &job.FileFormat, &job.Status, &job.ExpiresAt, &job.CreatedAt, &job.UpdatedAt)
	if err != nil {
		return nil, err
	}
	job.FilterParams = filterMap
	job.StorageKey = storageKey
	job.DownloadURL = downloadURL

	auditDetails, _ := json.Marshal(map[string]any{
		"format": format,
		"type":   expType,
	})
	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id, details) VALUES ($1, 'CREATE', 'EXPORT_JOB', $2, $3)`, actorID, jobID, auditDetails)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &job, nil
}

func (r *ExportAuditRepo) GetExportJobByID(ctx context.Context, id uuid.UUID) (*domain.ExportJob, error) {
	query := `SELECT id, user_id, export_type, file_format, status, filter_params, storage_key, download_url, error_message, expires_at, created_at, updated_at
		FROM export_jobs WHERE id = $1`

	var job domain.ExportJob
	var rawFilter []byte
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&job.ID, &job.UserID, &job.ExportType, &job.FileFormat, &job.Status, &rawFilter,
		&job.StorageKey, &job.DownloadURL, &job.ErrorMessage, &job.ExpiresAt, &job.CreatedAt, &job.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	if len(rawFilter) > 0 {
		_ = json.Unmarshal(rawFilter, &job.FilterParams)
	}
	return &job, nil
}

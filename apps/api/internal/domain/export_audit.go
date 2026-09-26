package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type AuditLog struct {
	ID        uuid.UUID      `json:"id"`
	ActorID   *uuid.UUID     `json:"actor_id,omitempty"`
	ActorName string         `json:"actor_name,omitempty"`
	Action    string         `json:"action"`
	Entity    string         `json:"entity"`
	EntityID  uuid.UUID      `json:"entity_id"`
	Details   map[string]any `json:"details,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
}

type AuditLogFilter struct {
	ActorID  uuid.UUID
	Entity   string
	EntityID uuid.UUID
	Action   string
	FromDate string
	ToDate   string
	Page     int32
	PerPage  int32
}

type ExportJob struct {
	ID           uuid.UUID      `json:"id"`
	UserID       uuid.UUID      `json:"user_id"`
	ExportType   string         `json:"export_type"` // ATTENDANCE
	FileFormat   string         `json:"file_format"` // CSV, XLSX, PDF
	Status       string         `json:"status"`      // PENDING, PROCESSING, COMPLETED, FAILED
	FilterParams map[string]any `json:"filter_params,omitempty"`
	StorageKey   string         `json:"storage_key,omitempty"`
	DownloadURL  string         `json:"download_url,omitempty"`
	ErrorMessage *string        `json:"error_message,omitempty"`
	ExpiresAt    time.Time      `json:"expires_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

type CreateExportInput struct {
	ExportType string     `json:"export_type"` // default ATTENDANCE
	FileFormat string     `json:"file_format"` // CSV, XLSX, PDF
	ClassID    *uuid.UUID `json:"class_id,omitempty"`
	SubjectID  *uuid.UUID `json:"subject_id,omitempty"`
	FromDate   string     `json:"from_date,omitempty"`
	ToDate     string     `json:"to_date,omitempty"`
}

type ExportAuditRepository interface {
	ListAuditLogs(ctx context.Context, filter AuditLogFilter) ([]AuditLog, int64, error)
	GetAuditLogByID(ctx context.Context, id uuid.UUID) (*AuditLog, error)
	CreateExportJob(ctx context.Context, in CreateExportInput, actorID uuid.UUID) (*ExportJob, error)
	GetExportJobByID(ctx context.Context, id uuid.UUID) (*ExportJob, error)
}

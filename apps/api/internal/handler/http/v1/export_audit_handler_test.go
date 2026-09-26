package v1

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/service"
)

type mockExportAuditRepoForHandler struct {
	log  *domain.AuditLog
	jobs map[uuid.UUID]*domain.ExportJob
}

func (m *mockExportAuditRepoForHandler) ListAuditLogs(_ context.Context, _ domain.AuditLogFilter) ([]domain.AuditLog, int64, error) {
	if m.log == nil {
		return nil, 0, nil
	}
	return []domain.AuditLog{*m.log}, 1, nil
}

func (m *mockExportAuditRepoForHandler) GetAuditLogByID(_ context.Context, id uuid.UUID) (*domain.AuditLog, error) {
	if m.log != nil && m.log.ID == id {
		return m.log, nil
	}
	return nil, domain.ErrNotFound
}

func (m *mockExportAuditRepoForHandler) CreateExportJob(_ context.Context, in domain.CreateExportInput, actorID uuid.UUID) (*domain.ExportJob, error) {
	id := uuid.New()
	job := &domain.ExportJob{
		ID:          id,
		UserID:      actorID,
		ExportType:  in.ExportType,
		FileFormat:  in.FileFormat,
		Status:      "COMPLETED",
		DownloadURL: "/api/v1/exports/" + id.String(),
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}
	if m.jobs == nil {
		m.jobs = make(map[uuid.UUID]*domain.ExportJob)
	}
	m.jobs[id] = job
	return job, nil
}

func (m *mockExportAuditRepoForHandler) GetExportJobByID(_ context.Context, id uuid.UUID) (*domain.ExportJob, error) {
	if m.jobs != nil {
		if job, ok := m.jobs[id]; ok {
			return job, nil
		}
	}
	return nil, domain.ErrNotFound
}

func TestExportAuditHandlerHTTP(t *testing.T) {
	adminID := uuid.New()
	logID := uuid.New()
	jobID := uuid.New()

	repo := &mockExportAuditRepoForHandler{
		log: &domain.AuditLog{
			ID:        logID,
			Action:    "CREATE",
			Entity:    "ATTENDANCE",
			CreatedAt: time.Now(),
		},
		jobs: map[uuid.UUID]*domain.ExportJob{
			jobID: {
				ID:          jobID,
				UserID:      adminID,
				ExportType:  "ATTENDANCE",
				FileFormat:  "CSV",
				Status:      "COMPLETED",
				DownloadURL: "/api/v1/exports/" + jobID.String(),
				CreatedAt:   time.Now(),
				UpdatedAt:   time.Now(),
			},
		},
	}

	svc := service.NewExportAuditService(repo)
	handler := NewExportAuditHandler(svc)

	r := chi.NewRouter()
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			user := &domain.User{
				ID:       adminID,
				IsActive: true,
				Roles:    []domain.Role{domain.RoleSuperAdmin},
			}
			ctx := context.WithValue(req.Context(), middleware.AuthenticatedUserContextKey, user)
			next.ServeHTTP(w, req.WithContext(ctx))
		})
	})

	r.Post("/exports/attendance", handler.CreateExport)
	r.Get("/exports/{job_id}", handler.GetExportJob)
	r.Get("/audit-logs", handler.ListAuditLogs)
	r.Get("/audit-logs/{audit_log_id}", handler.GetAuditLog)

	// 1. List audit logs
	req := httptest.NewRequest(http.MethodGet, "/audit-logs", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 2. Get audit log
	req = httptest.NewRequest(http.MethodGet, "/audit-logs/"+logID.String(), nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 3. Create export
	createBody, _ := json.Marshal(domain.CreateExportInput{FileFormat: "CSV"})
	req = httptest.NewRequest(http.MethodPost, "/exports/attendance", bytes.NewReader(createBody))
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusAccepted {
		t.Fatalf("expected 202, got %d: %s", rec.Code, rec.Body.String())
	}

	// 4. Get export job
	req = httptest.NewRequest(http.MethodGet, "/exports/"+jobID.String(), nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

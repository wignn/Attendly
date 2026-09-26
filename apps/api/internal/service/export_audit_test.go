package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type mockExportAuditRepo struct {
	logs []domain.AuditLog
	jobs map[uuid.UUID]*domain.ExportJob
}

func newMockExportAuditRepo() *mockExportAuditRepo {
	return &mockExportAuditRepo{
		jobs: make(map[uuid.UUID]*domain.ExportJob),
	}
}

func (m *mockExportAuditRepo) ListAuditLogs(_ context.Context, f domain.AuditLogFilter) ([]domain.AuditLog, int64, error) {
	var list []domain.AuditLog
	for _, l := range m.logs {
		if f.Entity != "" && l.Entity != f.Entity {
			continue
		}
		if f.Action != "" && l.Action != f.Action {
			continue
		}
		list = append(list, l)
	}
	return list, int64(len(list)), nil
}

func (m *mockExportAuditRepo) GetAuditLogByID(_ context.Context, id uuid.UUID) (*domain.AuditLog, error) {
	for _, l := range m.logs {
		if l.ID == id {
			return &l, nil
		}
	}
	return nil, domain.ErrNotFound
}

func (m *mockExportAuditRepo) CreateExportJob(_ context.Context, in domain.CreateExportInput, actorID uuid.UUID) (*domain.ExportJob, error) {
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
	m.jobs[id] = job
	return job, nil
}

func (m *mockExportAuditRepo) GetExportJobByID(_ context.Context, id uuid.UUID) (*domain.ExportJob, error) {
	job, ok := m.jobs[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return job, nil
}

func TestExportAuditService(t *testing.T) {
	ctx := context.Background()
	repo := newMockExportAuditRepo()
	svc := NewExportAuditService(repo)

	admin := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleSuperAdmin}}
	teacher := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}

	logID := uuid.New()
	repo.logs = append(repo.logs, domain.AuditLog{
		ID:        logID,
		Action:    "CREATE",
		Entity:    "ATTENDANCE_SESSION",
		CreatedAt: time.Now(),
	})

	// 1. Teacher cannot view audit logs
	_, _, err := svc.ListAuditLogs(ctx, teacher, domain.AuditLogFilter{})
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden for teacher viewing audit logs, got %v", err)
	}

	// 2. Admin can view audit logs
	logs, total, err := svc.ListAuditLogs(ctx, admin, domain.AuditLogFilter{})
	if err != nil || total != 1 || len(logs) != 1 {
		t.Fatalf("failed listing audit logs: %v", err)
	}

	gotLog, err := svc.GetAuditLogByID(ctx, admin, logID)
	if err != nil || gotLog.ID != logID {
		t.Fatalf("failed getting audit log: %v", err)
	}

	// 3. Invalid format export rejected
	_, err = svc.CreateExportJob(ctx, teacher, domain.CreateExportInput{
		FileFormat: "EXE",
	})
	if err != domain.ErrValidation {
		t.Fatalf("expected ErrValidation for invalid format, got %v", err)
	}

	// 4. Valid export created
	job, err := svc.CreateExportJob(ctx, teacher, domain.CreateExportInput{
		FileFormat: "CSV",
	})
	if err != nil {
		t.Fatalf("failed to create export job: %v", err)
	}

	// 5. Teacher gets own export job
	gotJob, err := svc.GetExportJobByID(ctx, teacher, job.ID)
	if err != nil || gotJob.ID != job.ID {
		t.Fatalf("failed to get export job: %v", err)
	}

	// 6. Other teacher cannot access export job
	otherTeacher := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}
	_, err = svc.GetExportJobByID(ctx, otherTeacher, job.ID)
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden for other teacher, got %v", err)
	}
}

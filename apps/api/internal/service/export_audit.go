package service

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type ExportAuditService struct {
	repo domain.ExportAuditRepository
}

func NewExportAuditService(repo domain.ExportAuditRepository) *ExportAuditService {
	return &ExportAuditService{repo: repo}
}

func (s *ExportAuditService) ListAuditLogs(ctx context.Context, user *domain.User, f domain.AuditLogFilter) ([]domain.AuditLog, int64, error) {
	if !exportAuditAdmin(user) {
		return nil, 0, domain.ErrForbidden
	}
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PerPage < 1 || f.PerPage > 100 {
		f.PerPage = 20
	}
	return s.repo.ListAuditLogs(ctx, f)
}

func (s *ExportAuditService) GetAuditLogByID(ctx context.Context, user *domain.User, id uuid.UUID) (*domain.AuditLog, error) {
	if !exportAuditAdmin(user) {
		return nil, domain.ErrForbidden
	}
	return s.repo.GetAuditLogByID(ctx, id)
}

func (s *ExportAuditService) CreateExportJob(ctx context.Context, user *domain.User, in domain.CreateExportInput) (*domain.ExportJob, error) {
	if !exportAuditUser(user) {
		return nil, domain.ErrForbidden
	}
	format := strings.ToUpper(strings.TrimSpace(in.FileFormat))
	if format != "CSV" && format != "XLSX" && format != "PDF" {
		return nil, domain.ErrValidation
	}
	in.FileFormat = format
	return s.repo.CreateExportJob(ctx, in, user.ID)
}

func (s *ExportAuditService) GetExportJobByID(ctx context.Context, user *domain.User, id uuid.UUID) (*domain.ExportJob, error) {
	if !exportAuditUser(user) {
		return nil, domain.ErrForbidden
	}
	job, err := s.repo.GetExportJobByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if !exportAuditAdmin(user) && job.UserID != user.ID {
		return nil, domain.ErrForbidden
	}
	return job, nil
}

func exportAuditUser(user *domain.User) bool {
	return user != nil && user.IsActive && (user.HasRole(domain.RoleSuperAdmin) || user.HasRole(domain.RoleTeacher) || user.HasRole(domain.RoleHomeroomTeacher))
}

func exportAuditAdmin(user *domain.User) bool {
	return user != nil && user.IsActive && user.HasRole(domain.RoleSuperAdmin)
}

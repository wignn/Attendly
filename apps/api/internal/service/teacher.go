package service

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type TeacherService struct {
	repo domain.TeacherRepository
}

func NewTeacherService(repo domain.TeacherRepository) *TeacherService {
	return &TeacherService{repo: repo}
}

func (s *TeacherService) List(ctx context.Context, user *domain.User, f domain.TeacherFilter) ([]domain.TeacherRecord, int64, error) {
	if !teacherReader(user) {
		return nil, 0, domain.ErrForbidden
	}
	if f.Page < 1 {
		f.Page = 1
	}
	if f.PerPage < 1 || f.PerPage > 100 {
		f.PerPage = 20
	}
	return s.repo.List(ctx, f)
}

func (s *TeacherService) GetByID(ctx context.Context, user *domain.User, id uuid.UUID) (*domain.TeacherRecord, error) {
	if !teacherReader(user) {
		return nil, domain.ErrForbidden
	}
	return s.repo.GetByID(ctx, id)
}

func (s *TeacherService) Create(ctx context.Context, user *domain.User, input domain.TeacherCreateInput) (*domain.TeacherRecord, error) {
	if !teacherAdmin(user) {
		return nil, domain.ErrForbidden
	}
	nip := strings.TrimSpace(input.NIP)
	name := strings.TrimSpace(input.FullName)
	email := strings.TrimSpace(input.Email)
	if nip == "" || name == "" || email == "" {
		return nil, domain.ErrValidation
	}
	return s.repo.Create(ctx, input, user.ID)
}

func (s *TeacherService) Update(ctx context.Context, user *domain.User, id uuid.UUID, input domain.TeacherUpdateInput) (*domain.TeacherRecord, error) {
	if !teacherAdmin(user) {
		return nil, domain.ErrForbidden
	}
	if input.NIP != nil && strings.TrimSpace(*input.NIP) == "" {
		return nil, domain.ErrValidation
	}
	if input.FullName != nil && strings.TrimSpace(*input.FullName) == "" {
		return nil, domain.ErrValidation
	}
	if input.Email != nil && strings.TrimSpace(*input.Email) == "" {
		return nil, domain.ErrValidation
	}
	if input.Status != nil && *input.Status != "ACTIVE" && *input.Status != "INACTIVE" {
		return nil, domain.ErrValidation
	}
	return s.repo.Update(ctx, id, input, user.ID)
}

func (s *TeacherService) Delete(ctx context.Context, user *domain.User, id uuid.UUID) error {
	if !teacherAdmin(user) {
		return domain.ErrForbidden
	}
	return s.repo.Delete(ctx, id, user.ID)
}

func teacherReader(user *domain.User) bool {
	return user != nil && user.IsActive && (user.HasRole(domain.RoleSuperAdmin) || user.HasRole(domain.RoleTeacher) || user.HasRole(domain.RoleHomeroomTeacher))
}

func teacherAdmin(user *domain.User) bool {
	return user != nil && user.IsActive && user.HasRole(domain.RoleSuperAdmin)
}

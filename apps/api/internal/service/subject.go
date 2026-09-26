package service

import (
	"context"
	"strings"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type SubjectService struct {
	repo domain.SubjectRepository
}

func NewSubjectService(repo domain.SubjectRepository) *SubjectService {
	return &SubjectService{repo: repo}
}

func (s *SubjectService) List(ctx context.Context, user *domain.User, f domain.SubjectFilter) ([]domain.SubjectRecord, int64, error) {
	if !subjectReader(user) {
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

func (s *SubjectService) GetByID(ctx context.Context, user *domain.User, id uuid.UUID) (*domain.SubjectRecord, error) {
	if !subjectReader(user) {
		return nil, domain.ErrForbidden
	}
	return s.repo.GetByID(ctx, id)
}

func (s *SubjectService) Create(ctx context.Context, user *domain.User, input domain.SubjectCreateInput) (*domain.SubjectRecord, error) {
	if !subjectAdmin(user) {
		return nil, domain.ErrForbidden
	}
	code := strings.TrimSpace(input.Code)
	name := strings.TrimSpace(input.Name)
	if code == "" || name == "" {
		return nil, domain.ErrValidation
	}
	return s.repo.Create(ctx, domain.SubjectRecord{Code: code, Name: name}, user.ID)
}

func (s *SubjectService) Update(ctx context.Context, user *domain.User, id uuid.UUID, input domain.SubjectUpdateInput) (*domain.SubjectRecord, error) {
	if !subjectAdmin(user) {
		return nil, domain.ErrForbidden
	}
	if input.Code != nil && strings.TrimSpace(*input.Code) == "" {
		return nil, domain.ErrValidation
	}
	if input.Name != nil && strings.TrimSpace(*input.Name) == "" {
		return nil, domain.ErrValidation
	}
	return s.repo.Update(ctx, id, input, user.ID)
}

func (s *SubjectService) Delete(ctx context.Context, user *domain.User, id uuid.UUID) error {
	if !subjectAdmin(user) {
		return domain.ErrForbidden
	}
	return s.repo.Delete(ctx, id, user.ID)
}

func subjectReader(user *domain.User) bool {
	return user != nil && user.IsActive && (user.HasRole(domain.RoleSuperAdmin) || user.HasRole(domain.RoleTeacher) || user.HasRole(domain.RoleHomeroomTeacher))
}

func subjectAdmin(user *domain.User) bool {
	return user != nil && user.IsActive && user.HasRole(domain.RoleSuperAdmin)
}

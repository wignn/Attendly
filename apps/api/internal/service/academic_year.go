package service

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type AcademicYearService struct {
	repo domain.AcademicYearRepository
}

func NewAcademicYearService(repo domain.AcademicYearRepository) *AcademicYearService {
	return &AcademicYearService{repo: repo}
}

func (s *AcademicYearService) List(ctx context.Context, user *domain.User, f domain.AcademicYearFilter) ([]domain.AcademicYearRecord, int64, error) {
	if !academicYearReader(user) {
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

func (s *AcademicYearService) GetByID(ctx context.Context, user *domain.User, id uuid.UUID) (*domain.AcademicYearRecord, error) {
	if !academicYearReader(user) {
		return nil, domain.ErrForbidden
	}
	return s.repo.GetByID(ctx, id)
}

func (s *AcademicYearService) Create(ctx context.Context, user *domain.User, in domain.AcademicYearCreateInput) (*domain.AcademicYearRecord, error) {
	if !academicYearAdmin(user) {
		return nil, domain.ErrForbidden
	}
	name := strings.TrimSpace(in.Name)
	if name == "" || (in.Semester != 1 && in.Semester != 2) {
		return nil, domain.ErrValidation
	}
	start, err := time.Parse("2006-01-02", in.StartsOn)
	if err != nil {
		return nil, domain.ErrValidation
	}
	end, err := time.Parse("2006-01-02", in.EndsOn)
	if err != nil {
		return nil, domain.ErrValidation
	}
	if start.After(end) {
		return nil, domain.ErrValidation
	}

	item := domain.AcademicYearRecord{
		Name:     name,
		Semester: in.Semester,
		StartsOn: in.StartsOn,
		EndsOn:   in.EndsOn,
		Active:   in.Active,
	}
	return s.repo.Create(ctx, item, user.ID)
}

func (s *AcademicYearService) Update(ctx context.Context, user *domain.User, id uuid.UUID, in domain.AcademicYearUpdateInput) (*domain.AcademicYearRecord, error) {
	if !academicYearAdmin(user) {
		return nil, domain.ErrForbidden
	}
	if in.Name != nil && strings.TrimSpace(*in.Name) == "" {
		return nil, domain.ErrValidation
	}
	if in.Semester != nil && *in.Semester != 1 && *in.Semester != 2 {
		return nil, domain.ErrValidation
	}
	if in.StartsOn != nil {
		if _, err := time.Parse("2006-01-02", *in.StartsOn); err != nil {
			return nil, domain.ErrValidation
		}
	}
	if in.EndsOn != nil {
		if _, err := time.Parse("2006-01-02", *in.EndsOn); err != nil {
			return nil, domain.ErrValidation
		}
	}
	return s.repo.Update(ctx, id, in, user.ID)
}

func (s *AcademicYearService) Delete(ctx context.Context, user *domain.User, id uuid.UUID) error {
	if !academicYearAdmin(user) {
		return domain.ErrForbidden
	}
	return s.repo.Delete(ctx, id, user.ID)
}

func (s *AcademicYearService) Activate(ctx context.Context, user *domain.User, id uuid.UUID) (*domain.AcademicYearRecord, error) {
	if !academicYearAdmin(user) {
		return nil, domain.ErrForbidden
	}
	return s.repo.Activate(ctx, id, user.ID)
}

func academicYearReader(user *domain.User) bool {
	return user != nil && user.IsActive && (user.HasRole(domain.RoleSuperAdmin) || user.HasRole(domain.RoleTeacher) || user.HasRole(domain.RoleHomeroomTeacher))
}

func academicYearAdmin(user *domain.User) bool {
	return user != nil && user.IsActive && user.HasRole(domain.RoleSuperAdmin)
}

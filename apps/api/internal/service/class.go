package service

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type ClassService struct {
	repo domain.ClassRepository
	now  func() time.Time
}

func NewClassService(repo domain.ClassRepository) *ClassService {
	return &ClassService{
		repo: repo,
		now:  time.Now,
	}
}

func (s *ClassService) List(ctx context.Context, user *domain.User, f domain.ClassFilter) ([]domain.ClassDetail, int64, error) {
	if !classReader(user) {
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

func (s *ClassService) GetByID(ctx context.Context, user *domain.User, id uuid.UUID) (*domain.ClassDetail, error) {
	if !classReader(user) {
		return nil, domain.ErrForbidden
	}
	return s.repo.GetByID(ctx, id)
}

func (s *ClassService) Create(ctx context.Context, user *domain.User, in domain.ClassCreateInput) (*domain.ClassDetail, error) {
	if !classAdmin(user) {
		return nil, domain.ErrForbidden
	}
	code := strings.TrimSpace(in.Code)
	name := strings.TrimSpace(in.Name)
	if code == "" || name == "" {
		return nil, domain.ErrValidation
	}
	return s.repo.Create(ctx, in, user.ID)
}

func (s *ClassService) Update(ctx context.Context, user *domain.User, id uuid.UUID, in domain.ClassUpdateInput) (*domain.ClassDetail, error) {
	if !classAdmin(user) {
		return nil, domain.ErrForbidden
	}
	if in.Code != nil && strings.TrimSpace(*in.Code) == "" {
		return nil, domain.ErrValidation
	}
	if in.Name != nil && strings.TrimSpace(*in.Name) == "" {
		return nil, domain.ErrValidation
	}
	return s.repo.Update(ctx, id, in, user.ID)
}

func (s *ClassService) Delete(ctx context.Context, user *domain.User, id uuid.UUID) error {
	if !classAdmin(user) {
		return domain.ErrForbidden
	}
	return s.repo.Delete(ctx, id, user.ID)
}

func (s *ClassService) ListStudents(ctx context.Context, user *domain.User, classID uuid.UUID, page, perPage int32) ([]domain.ClassStudentItem, int64, error) {
	if !classReader(user) {
		return nil, 0, domain.ErrForbidden
	}
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	return s.repo.ListStudents(ctx, classID, page, perPage)
}

func (s *ClassService) AddStudent(ctx context.Context, user *domain.User, classID uuid.UUID, in domain.AddStudentToClassInput) error {
	if !classAdmin(user) {
		return domain.ErrForbidden
	}
	if in.StudentID == uuid.Nil {
		return domain.ErrValidation
	}
	effectiveDate := s.now().UTC()
	if strings.TrimSpace(in.EffectiveDate) != "" {
		parsed, err := time.Parse("2006-01-02", in.EffectiveDate)
		if err != nil {
			return domain.ErrValidation
		}
		effectiveDate = parsed
	}
	return s.repo.AddStudent(ctx, classID, in.StudentID, effectiveDate, user.ID)
}

func (s *ClassService) RemoveStudent(ctx context.Context, user *domain.User, classID, studentID uuid.UUID, dateStr string) error {
	if !classAdmin(user) {
		return domain.ErrForbidden
	}
	effectiveDate := s.now().UTC()
	if strings.TrimSpace(dateStr) != "" {
		parsed, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			return domain.ErrValidation
		}
		effectiveDate = parsed
	}
	return s.repo.RemoveStudent(ctx, classID, studentID, effectiveDate, user.ID)
}

func classReader(user *domain.User) bool {
	return user != nil && user.IsActive && (user.HasRole(domain.RoleSuperAdmin) || user.HasRole(domain.RoleTeacher) || user.HasRole(domain.RoleHomeroomTeacher))
}

func classAdmin(user *domain.User) bool {
	return user != nil && user.IsActive && user.HasRole(domain.RoleSuperAdmin)
}

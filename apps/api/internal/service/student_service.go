package service

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

const (
	studentDefaultPage    int32 = 1
	studentDefaultPerPage int32 = 20
	studentMaxPerPage     int32 = 100
)

type StudentCreateInput struct {
	NIS         string
	NISN        *string
	FullName    string
	ClassID     uuid.UUID
	EffectiveOn *time.Time
}

type StudentUpdateInput struct {
	NIS      *string
	NISN     *string
	FullName *string
	Active   *bool
	ClassID  *uuid.UUID
}

type StudentTransferInput struct {
	ClassID     uuid.UUID
	EffectiveOn *time.Time
}

type StudentService struct{ repo domain.StudentRepository }

func NewStudentService(repo domain.StudentRepository) *StudentService {
	return &StudentService{repo: repo}
}

func (s *StudentService) List(ctx context.Context, user *domain.User, filter domain.StudentListFilter) ([]domain.StudentRecord, int64, error) {
	if err := requireStudentAdmin(user); err != nil {
		return nil, 0, err
	}
	filter.Search = strings.TrimSpace(filter.Search)
	if filter.SortBy == "" {
		filter.SortBy = "created_at"
	}
	switch filter.SortBy {
	case "nis", "full_name", "class_name", "created_at":
	default:
		return nil, 0, domain.ErrValidation
	}
	if filter.SortOrder == "" {
		filter.SortOrder = "asc"
	}
	filter.SortOrder = strings.ToLower(strings.TrimSpace(filter.SortOrder))
	if filter.SortOrder != "asc" && filter.SortOrder != "desc" {
		return nil, 0, domain.ErrValidation
	}
	if filter.ClassID != nil && *filter.ClassID == uuid.Nil {
		return nil, 0, domain.ErrValidation
	}
	if filter.Page < 0 || filter.PerPage < 0 {
		return nil, 0, domain.ErrValidation
	}
	if filter.Page < 1 {
		filter.Page = studentDefaultPage
	}
	if filter.PerPage < 1 {
		filter.PerPage = studentDefaultPerPage
	}
	if filter.PerPage > studentMaxPerPage {
		filter.PerPage = studentMaxPerPage
	}
	return s.repo.List(ctx, filter)
}

func (s *StudentService) Get(ctx context.Context, user *domain.User, id uuid.UUID) (domain.StudentRecord, error) {
	if err := requireStudentAdmin(user); err != nil {
		return domain.StudentRecord{}, err
	}
	return s.repo.Get(ctx, id, false)
}

func (s *StudentService) Create(ctx context.Context, user *domain.User, input StudentCreateInput) (domain.StudentRecord, error) {
	if err := requireStudentAdmin(user); err != nil {
		return domain.StudentRecord{}, err
	}
	input.NIS = strings.TrimSpace(input.NIS)
	input.FullName = strings.TrimSpace(input.FullName)
	if input.NIS == "" || len(input.NIS) > 50 || input.FullName == "" || len(input.FullName) > 255 || input.ClassID == uuid.Nil {
		return domain.StudentRecord{}, domain.ErrValidation
	}
	nisn, err := normalizeOptionalIdentifier(input.NISN)
	if err != nil {
		return domain.StudentRecord{}, err
	}
	effectiveOn, err := schoolDate(input.EffectiveOn)
	if err != nil {
		return domain.StudentRecord{}, err
	}
	return s.repo.Create(ctx, domain.StudentRecord{NIS: input.NIS, NISN: nisn, FullName: input.FullName, CurrentClassID: input.ClassID, Active: true}, effectiveOn, user.ID)
}

func (s *StudentService) Update(ctx context.Context, user *domain.User, id uuid.UUID, input StudentUpdateInput) (domain.StudentRecord, error) {
	if err := requireStudentAdmin(user); err != nil {
		return domain.StudentRecord{}, err
	}
	if input.ClassID != nil {
		return domain.StudentRecord{}, domain.ErrValidation
	}
	if input.NIS == nil && input.NISN == nil && input.FullName == nil && input.Active == nil {
		return domain.StudentRecord{}, domain.ErrValidation
	}
	current, err := s.repo.Get(ctx, id, true)
	if err != nil {
		return domain.StudentRecord{}, err
	}
	if current.DeletedAt != nil {
		if input.Active != nil && *input.Active {
			return domain.StudentRecord{}, domain.ErrValidation
		}
		return domain.StudentRecord{}, domain.ErrNotFound
	}
	patch := domain.StudentUpdate{Active: input.Active}
	if input.NIS != nil {
		value := strings.TrimSpace(*input.NIS)
		if value == "" || len(value) > 50 {
			return domain.StudentRecord{}, domain.ErrValidation
		}
		patch.NIS = &value
	}
	if input.NISN != nil {
		nisn, err := normalizeOptionalIdentifier(input.NISN)
		if err != nil {
			return domain.StudentRecord{}, err
		}
		if nisn == nil {
			patch.ClearNISN = true
		} else {
			patch.NISN = nisn
		}
	}
	if input.FullName != nil {
		value := strings.TrimSpace(*input.FullName)
		if value == "" || len(value) > 255 {
			return domain.StudentRecord{}, domain.ErrValidation
		}
		patch.FullName = &value
	}
	return s.repo.Update(ctx, id, patch, user.ID)
}

func (s *StudentService) SoftDelete(ctx context.Context, user *domain.User, id uuid.UUID) error {
	if err := requireStudentAdmin(user); err != nil {
		return err
	}
	student, err := s.repo.Get(ctx, id, true)
	if err != nil {
		return err
	}
	if student.DeletedAt != nil {
		return nil
	}
	return s.repo.SoftDelete(ctx, id, user.ID)
}

func (s *StudentService) Enrollments(ctx context.Context, user *domain.User, id uuid.UUID) ([]domain.StudentEnrollment, error) {
	if err := requireStudentAdmin(user); err != nil {
		return nil, err
	}
	return s.repo.Enrollments(ctx, id)
}

func (s *StudentService) Transfer(ctx context.Context, user *domain.User, id uuid.UUID, input StudentTransferInput) (domain.StudentRecord, error) {
	if err := requireStudentAdmin(user); err != nil {
		return domain.StudentRecord{}, err
	}
	if input.ClassID == uuid.Nil {
		return domain.StudentRecord{}, domain.ErrValidation
	}
	student, err := s.repo.Get(ctx, id, true)
	if err != nil {
		return domain.StudentRecord{}, err
	}
	if student.DeletedAt != nil {
		return domain.StudentRecord{}, domain.ErrNotFound
	}
	if student.CurrentClassID == input.ClassID {
		return domain.StudentRecord{}, domain.ErrEnrollmentConflict
	}
	effectiveOn, err := schoolDate(input.EffectiveOn)
	if err != nil {
		return domain.StudentRecord{}, err
	}
	location, _ := time.LoadLocation("Asia/Jakarta")
	today := time.Now().In(location)
	if dateBefore(time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, location), effectiveOn) {
		return domain.StudentRecord{}, domain.ErrValidation
	}
	history, err := s.repo.Enrollments(ctx, id)
	if err != nil {
		return domain.StudentRecord{}, err
	}
	for _, enrollment := range history {
		if enrollment.ValidTo == nil && dateBefore(effectiveOn, enrollment.ValidFrom) {
			return domain.StudentRecord{}, domain.ErrEnrollmentConflict
		}
	}
	return s.repo.Transfer(ctx, id, input.ClassID, effectiveOn, user.ID)
}

func requireStudentAdmin(user *domain.User) error {
	if user == nil || !user.HasRole(domain.RoleSuperAdmin) {
		return domain.ErrForbidden
	}
	return nil
}

func normalizeOptionalIdentifier(value *string) (*string, error) {
	if value == nil {
		return nil, nil
	}
	normalized := strings.TrimSpace(*value)
	if normalized == "" {
		return nil, nil
	}
	if len(normalized) > 50 {
		return nil, domain.ErrValidation
	}
	return &normalized, nil
}

func schoolDate(value *time.Time) (time.Time, error) {
	location, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		return time.Time{}, err
	}
	if value == nil {
		now := time.Now().In(location)
		return time.Date(now.Year(), now.Month(), now.Day(), 12, 0, 0, 0, location), nil
	}
	if value.IsZero() || value.Year() < 1900 || value.Year() > 2100 {
		return time.Time{}, domain.ErrValidation
	}
	// Use midday so the repository's UTC date serialization preserves the
	// Asia/Jakarta calendar date instead of moving it back to the prior day.
	return time.Date(value.Year(), value.Month(), value.Day(), 12, 0, 0, 0, location), nil
}

func dateBefore(left, right time.Time) bool {
	ly, lm, ld := left.Date()
	ry, rm, rd := right.Date()
	return ly < ry || (ly == ry && (lm < rm || (lm == rm && ld < rd)))
}

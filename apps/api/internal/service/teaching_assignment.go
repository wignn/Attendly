package service

import (
	"context"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type TeachingAssignmentService struct {
	repo domain.TeachingAssignmentRepository
}

func NewTeachingAssignmentService(repo domain.TeachingAssignmentRepository) *TeachingAssignmentService {
	return &TeachingAssignmentService{repo: repo}
}

func (s *TeachingAssignmentService) Create(ctx context.Context, actor *domain.User, input domain.TeachingAssignmentInput) (domain.TeachingAssignmentRecord, error) {
	if !assignmentAdmin(actor) {
		return domain.TeachingAssignmentRecord{}, domain.ErrForbidden
	}
	if err := validateAssignmentInput(input); err != nil {
		return domain.TeachingAssignmentRecord{}, err
	}
	return s.repo.CreateAssignment(ctx, actor.ID, input)
}

func (s *TeachingAssignmentService) Get(ctx context.Context, actor *domain.User, id uuid.UUID) (domain.TeachingAssignmentRecord, error) {
	if !assignmentReader(actor) {
		return domain.TeachingAssignmentRecord{}, domain.ErrForbidden
	}
	if id == uuid.Nil {
		return domain.TeachingAssignmentRecord{}, domain.ErrValidation
	}
	record, err := s.repo.GetAssignment(ctx, id)
	if err != nil {
		return record, err
	}
	if !assignmentAdmin(actor) && record.TeacherID != actor.ID {
		return domain.TeachingAssignmentRecord{}, domain.ErrForbidden
	}
	return record, nil
}

func (s *TeachingAssignmentService) List(ctx context.Context, actor *domain.User, filter domain.TeachingAssignmentFilter) ([]domain.TeachingAssignmentRecord, int64, error) {
	if !assignmentReader(actor) {
		return nil, 0, domain.ErrForbidden
	}
	if filter.Page < 1 || filter.PerPage < 1 || filter.PerPage > 100 {
		return nil, 0, domain.ErrValidation
	}
	if !assignmentAdmin(actor) {
		if filter.TeacherID != uuid.Nil && filter.TeacherID != actor.ID {
			return nil, 0, domain.ErrForbidden
		}
		filter.TeacherID = actor.ID
	}
	return s.repo.ListAssignments(ctx, filter)
}

func (s *TeachingAssignmentService) Update(ctx context.Context, actor *domain.User, id uuid.UUID, input domain.TeachingAssignmentInput) (domain.TeachingAssignmentRecord, error) {
	if !assignmentAdmin(actor) {
		return domain.TeachingAssignmentRecord{}, domain.ErrForbidden
	}
	if id == uuid.Nil {
		return domain.TeachingAssignmentRecord{}, domain.ErrValidation
	}
	if err := validateAssignmentInput(input); err != nil {
		return domain.TeachingAssignmentRecord{}, err
	}
	return s.repo.UpdateAssignment(ctx, actor.ID, id, input)
}

func (s *TeachingAssignmentService) Delete(ctx context.Context, actor *domain.User, id uuid.UUID) error {
	if !assignmentAdmin(actor) {
		return domain.ErrForbidden
	}
	if id == uuid.Nil {
		return domain.ErrValidation
	}
	return s.repo.DeactivateAssignment(ctx, actor.ID, id)
}

func assignmentAdmin(actor *domain.User) bool {
	return actor != nil && actor.IsActive && actor.HasRole(domain.RoleSuperAdmin)
}

func assignmentReader(actor *domain.User) bool {
	return actor != nil && actor.IsActive && (actor.HasRole(domain.RoleSuperAdmin) || actor.HasRole(domain.RoleTeacher) || actor.HasRole(domain.RoleHomeroomTeacher))
}

func validateAssignmentInput(input domain.TeachingAssignmentInput) error {
	if input.TeacherID == uuid.Nil || input.ClassID == uuid.Nil || input.SubjectID == uuid.Nil || input.AcademicYearID == uuid.Nil {
		return domain.ErrValidation
	}
	return nil
}

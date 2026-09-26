package service

import (
	"context"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type assignmentRepoStub struct {
	created int
	listed  domain.TeachingAssignmentFilter
	item    domain.TeachingAssignmentRecord
}

func (r *assignmentRepoStub) CreateAssignment(_ context.Context, _ uuid.UUID, input domain.TeachingAssignmentInput) (domain.TeachingAssignmentRecord, error) {
	r.created++
	return domain.TeachingAssignmentRecord{TeacherID: input.TeacherID}, nil
}
func (r *assignmentRepoStub) GetAssignment(_ context.Context, _ uuid.UUID) (domain.TeachingAssignmentRecord, error) {
	return r.item, nil
}
func (r *assignmentRepoStub) ListAssignments(_ context.Context, filter domain.TeachingAssignmentFilter) ([]domain.TeachingAssignmentRecord, int64, error) {
	r.listed = filter
	return []domain.TeachingAssignmentRecord{}, 0, nil
}
func (r *assignmentRepoStub) UpdateAssignment(_ context.Context, _, _ uuid.UUID, _ domain.TeachingAssignmentInput) (domain.TeachingAssignmentRecord, error) {
	return r.item, nil
}
func (r *assignmentRepoStub) DeactivateAssignment(_ context.Context, _, _ uuid.UUID) error {
	return nil
}

func assignmentInput() domain.TeachingAssignmentInput {
	return domain.TeachingAssignmentInput{TeacherID: uuid.New(), ClassID: uuid.New(), SubjectID: uuid.New(), AcademicYearID: uuid.New()}
}

func TestTeachingAssignmentTeacherScope(t *testing.T) {
	repo := &assignmentRepoStub{}
	svc := NewTeachingAssignmentService(repo)
	teacher := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleTeacher}
	_, _, err := svc.List(context.Background(), teacher, domain.TeachingAssignmentFilter{Page: 1, PerPage: 20, TeacherID: uuid.New()})
	if !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("cross-teacher list should be forbidden, got %v", err)
	}
	_, _, err = svc.List(context.Background(), teacher, domain.TeachingAssignmentFilter{Page: 1, PerPage: 20})
	if err != nil || repo.listed.TeacherID != teacher.ID {
		t.Fatalf("teacher scope not enforced: filter=%+v, err=%v", repo.listed, err)
	}
	repo.item = domain.TeachingAssignmentRecord{TeacherID: uuid.New()}
	_, err = svc.Get(context.Background(), teacher, uuid.New())
	if !errors.Is(err, domain.ErrForbidden) {
		t.Fatalf("cross-teacher get should be forbidden, got %v", err)
	}
}

func TestTeachingAssignmentWritesRequireAdminAndCompleteInput(t *testing.T) {
	repo := &assignmentRepoStub{}
	svc := NewTeachingAssignmentService(repo)
	input := assignmentInput()
	teacher := &domain.User{ID: input.TeacherID, IsActive: true, Role: domain.RoleTeacher}
	_, err := svc.Create(context.Background(), teacher, input)
	if !errors.Is(err, domain.ErrForbidden) || repo.created != 0 {
		t.Fatalf("teacher write should be forbidden without repo call: %v", err)
	}
	admin := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleSuperAdmin}
	_, err = svc.Create(context.Background(), admin, domain.TeachingAssignmentInput{})
	if !errors.Is(err, domain.ErrValidation) || repo.created != 0 {
		t.Fatalf("incomplete assignment should be rejected: %v", err)
	}
	_, err = svc.Create(context.Background(), admin, input)
	if err != nil || repo.created != 1 {
		t.Fatalf("valid admin write should reach repo: %v", err)
	}
}

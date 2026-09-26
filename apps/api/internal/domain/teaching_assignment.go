package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// TeachingAssignmentRecord is the persisted, academic-year-scoped assignment.
// The older TeachingAssignment projection in attendance.go remains for reports.
type TeachingAssignmentRecord struct {
	ID             uuid.UUID `json:"id"`
	TeacherID      uuid.UUID `json:"teacher_id"`
	ClassID        uuid.UUID `json:"class_id"`
	SubjectID      uuid.UUID `json:"subject_id"`
	AcademicYearID uuid.UUID `json:"academic_year_id"`
	Active         bool      `json:"active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type TeachingAssignmentInput struct {
	TeacherID      uuid.UUID `json:"teacher_id"`
	ClassID        uuid.UUID `json:"class_id"`
	SubjectID      uuid.UUID `json:"subject_id"`
	AcademicYearID uuid.UUID `json:"academic_year_id"`
}

type TeachingAssignmentFilter struct {
	TeacherID      uuid.UUID
	ClassID        uuid.UUID
	SubjectID      uuid.UUID
	AcademicYearID uuid.UUID
	Page           int32
	PerPage        int32
}

type TeachingAssignmentRepository interface {
	CreateAssignment(ctx context.Context, actorID uuid.UUID, input TeachingAssignmentInput) (TeachingAssignmentRecord, error)
	GetAssignment(ctx context.Context, id uuid.UUID) (TeachingAssignmentRecord, error)
	ListAssignments(ctx context.Context, filter TeachingAssignmentFilter) ([]TeachingAssignmentRecord, int64, error)
	UpdateAssignment(ctx context.Context, actorID, id uuid.UUID, input TeachingAssignmentInput) (TeachingAssignmentRecord, error)
	DeactivateAssignment(ctx context.Context, actorID, id uuid.UUID) error
}

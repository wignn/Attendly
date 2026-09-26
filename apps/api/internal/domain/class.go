package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type ClassDetail struct {
	ID                  uuid.UUID  `json:"id"`
	Code                string     `json:"code"`
	Name                string     `json:"name"`
	Grade               string     `json:"grade"`
	Section             string     `json:"section"`
	AcademicYearID      *uuid.UUID `json:"academic_year_id,omitempty"`
	AcademicYearName    string     `json:"academic_year_name,omitempty"`
	HomeroomTeacherID   *uuid.UUID `json:"homeroom_teacher_id,omitempty"`
	HomeroomTeacherName string     `json:"homeroom_teacher_name,omitempty"`
	TotalStudents       int        `json:"total_students"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
	DeletedAt           *time.Time `json:"deleted_at,omitempty"`
}

type ClassCreateInput struct {
	Code              string     `json:"code"`
	Name              string     `json:"name"`
	Grade             string     `json:"grade"`
	Section           string     `json:"section"`
	AcademicYearID    *uuid.UUID `json:"academic_year_id,omitempty"`
	HomeroomTeacherID *uuid.UUID `json:"homeroom_teacher_id,omitempty"`
}

type ClassUpdateInput struct {
	Code                *string    `json:"code,omitempty"`
	Name                *string    `json:"name,omitempty"`
	Grade               *string    `json:"grade,omitempty"`
	Section             *string    `json:"section,omitempty"`
	AcademicYearID      *uuid.UUID `json:"academic_year_id,omitempty"`
	HomeroomTeacherID   *uuid.UUID `json:"homeroom_teacher_id,omitempty"`
	ClearHomeroomTeacher bool       `json:"clear_homeroom_teacher,omitempty"`
}

type ClassFilter struct {
	AcademicYearID    uuid.UUID
	HomeroomTeacherID uuid.UUID
	Search            string
	Page              int32
	PerPage           int32
}

type ClassStudentItem struct {
	StudentID  uuid.UUID `json:"student_id"`
	NIS        string    `json:"nis"`
	NISN       *string   `json:"nisn,omitempty"`
	FullName   string    `json:"full_name"`
	Active     bool      `json:"active"`
	ValidFrom  time.Time `json:"valid_from"`
	EnrolledAt time.Time `json:"enrolled_at"`
}

type AddStudentToClassInput struct {
	StudentID     uuid.UUID `json:"student_id"`
	EffectiveDate string    `json:"effective_date"` // YYYY-MM-DD
}

type ClassRepository interface {
	List(ctx context.Context, filter ClassFilter) ([]ClassDetail, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*ClassDetail, error)
	Create(ctx context.Context, input ClassCreateInput, actorID uuid.UUID) (*ClassDetail, error)
	Update(ctx context.Context, id uuid.UUID, input ClassUpdateInput, actorID uuid.UUID) (*ClassDetail, error)
	Delete(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error
	ListStudents(ctx context.Context, classID uuid.UUID, page, perPage int32) ([]ClassStudentItem, int64, error)
	AddStudent(ctx context.Context, classID uuid.UUID, studentID uuid.UUID, effectiveDate time.Time, actorID uuid.UUID) error
	RemoveStudent(ctx context.Context, classID uuid.UUID, studentID uuid.UUID, effectiveDate time.Time, actorID uuid.UUID) error
}

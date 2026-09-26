package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// Schedule describes a recurring class meeting. Attendance sessions retain their
// own class, subject, teacher and held_at snapshots independently of this record.
type Schedule struct {
	ID                   uuid.UUID `json:"id"`
	TeachingAssignmentID uuid.UUID `json:"teaching_assignment_id"`
	TeacherID            uuid.UUID `json:"teacher_id"`
	ClassID              uuid.UUID `json:"class_id"`
	SubjectID            uuid.UUID `json:"subject_id"`
	AcademicYearID       uuid.UUID `json:"academic_year_id"`
	DayOfWeek            int       `json:"day_of_week"`
	StartsAt             string    `json:"starts_at"`
	EndsAt               string    `json:"ends_at"`
	EffectiveFrom        string    `json:"effective_from"`
	EffectiveUntil       *string   `json:"effective_until,omitempty"`
	Active               bool      `json:"active"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

type ScheduleCreateInput struct {
	TeachingAssignmentID uuid.UUID `json:"teaching_assignment_id"`
	DayOfWeek            int       `json:"day_of_week"`
	StartsAt             string    `json:"starts_at"`
	EndsAt               string    `json:"ends_at"`
	EffectiveFrom        string    `json:"effective_from"`
	EffectiveUntil       *string   `json:"effective_until,omitempty"`
}

type ScheduleUpdateInput struct {
	TeachingAssignmentID *uuid.UUID `json:"teaching_assignment_id,omitempty"`
	DayOfWeek            *int       `json:"day_of_week,omitempty"`
	StartsAt             *string    `json:"starts_at,omitempty"`
	EndsAt               *string    `json:"ends_at,omitempty"`
	EffectiveFrom        *string    `json:"effective_from,omitempty"`
	EffectiveUntil       *string    `json:"effective_until,omitempty"`
	ClearEffectiveUntil  bool       `json:"-"`
}

type ScheduleFilter struct {
	TeacherID      uuid.UUID
	ClassID        uuid.UUID
	SubjectID      uuid.UUID
	AcademicYearID uuid.UUID
	DayOfWeek      int
	OnDate         string
	CurrentOnly    bool
	Active         *bool
	Page           int32
	PerPage        int32
}

type ScheduleRepository interface {
	List(context.Context, ScheduleFilter) ([]Schedule, int64, error)
	Get(context.Context, uuid.UUID) (*Schedule, error)
	Create(context.Context, *Schedule, uuid.UUID) error
	Update(context.Context, *Schedule, uuid.UUID) error
	Delete(context.Context, uuid.UUID, uuid.UUID) error
}

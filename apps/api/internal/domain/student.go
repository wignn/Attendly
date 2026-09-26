package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

// StudentRecord is the management representation of a student. The older
// Student type remains dedicated to attendance summary payloads.
type StudentRecord struct {
	ID               uuid.UUID  `json:"id"`
	NIS              string     `json:"nis"`
	NISN             *string    `json:"nisn,omitempty"`
	FullName         string     `json:"full_name"`
	CurrentClassID   uuid.UUID  `json:"class_id"`
	CurrentClassName string     `json:"current_class_name"`
	Active           bool       `json:"active"`
	DeletedAt        *time.Time `json:"deleted_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

type StudentEnrollment struct {
	ID        uuid.UUID  `json:"id"`
	StudentID uuid.UUID  `json:"student_id"`
	ClassID   uuid.UUID  `json:"class_id"`
	ClassName string     `json:"class_name"`
	ValidFrom time.Time  `json:"valid_from"`
	ValidTo   *time.Time `json:"valid_to,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

// StudentListFilter controls student management listing and pagination.
type StudentListFilter struct {
	Search         string
	ClassID        *uuid.UUID
	Active         *bool
	IncludeDeleted bool
	SortBy         string
	SortOrder      string
	Page           int32
	PerPage        int32
}

// StudentRepository owns student lifecycle and class enrollment history.
type StudentRepository interface {
	List(context.Context, StudentListFilter) ([]StudentRecord, int64, error)
	Get(context.Context, uuid.UUID, bool) (StudentRecord, error)
	Create(context.Context, StudentRecord, time.Time, uuid.UUID) (StudentRecord, error)
	Update(context.Context, StudentRecord, uuid.UUID) (StudentRecord, error)
	SoftDelete(context.Context, uuid.UUID, uuid.UUID) error
	Enrollments(context.Context, uuid.UUID) ([]StudentEnrollment, error)
	Transfer(context.Context, uuid.UUID, uuid.UUID, time.Time, uuid.UUID) (StudentRecord, error)
}

package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type TeacherRecord struct {
	ID        uuid.UUID  `json:"id"`
	UserID    uuid.UUID  `json:"user_id"`
	NIP       string     `json:"nip"`
	FullName  string     `json:"full_name"`
	Email     string     `json:"email"`
	Phone     string     `json:"phone,omitempty"`
	Status    string     `json:"status"` // ACTIVE, INACTIVE
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

type TeacherCreateInput struct {
	NIP      string `json:"nip"`
	FullName string `json:"full_name"`
	Email    string `json:"email"`
	Phone    string `json:"phone,omitempty"`
	Password string `json:"password,omitempty"`
}

type TeacherUpdateInput struct {
	NIP      *string `json:"nip,omitempty"`
	FullName *string `json:"full_name,omitempty"`
	Email    *string `json:"email,omitempty"`
	Phone    *string `json:"phone,omitempty"`
	Status   *string `json:"status,omitempty"`
}

type TeacherFilter struct {
	Search         string
	Status         string
	IncludeDeleted bool
	Page           int32
	PerPage        int32
}

type TeacherRepository interface {
	List(ctx context.Context, filter TeacherFilter) ([]TeacherRecord, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*TeacherRecord, error)
	Create(ctx context.Context, input TeacherCreateInput, actorID uuid.UUID) (*TeacherRecord, error)
	Update(ctx context.Context, id uuid.UUID, input TeacherUpdateInput, actorID uuid.UUID) (*TeacherRecord, error)
	Delete(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error
}

package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type SubjectRecord struct {
	ID        uuid.UUID  `json:"id"`
	Code      string     `json:"code"`
	Name      string     `json:"name"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
	DeletedAt *time.Time `json:"deleted_at,omitempty"`
}

type SubjectCreateInput struct {
	Code string `json:"code"`
	Name string `json:"name"`
}

type SubjectUpdateInput struct {
	Code *string `json:"code,omitempty"`
	Name *string `json:"name,omitempty"`
}

type SubjectFilter struct {
	Search  string
	Page    int32
	PerPage int32
}

type SubjectRepository interface {
	List(ctx context.Context, filter SubjectFilter) ([]SubjectRecord, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*SubjectRecord, error)
	Create(ctx context.Context, item SubjectRecord, actorID uuid.UUID) (*SubjectRecord, error)
	Update(ctx context.Context, id uuid.UUID, input SubjectUpdateInput, actorID uuid.UUID) (*SubjectRecord, error)
	Delete(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error
}

type AcademicYearRecord struct {
	ID        uuid.UUID `json:"id"`
	Name      string    `json:"name"`
	Semester  int       `json:"semester"`
	StartsOn  string    `json:"starts_on"`
	EndsOn    string    `json:"ends_on"`
	Active    bool      `json:"active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type AcademicYearCreateInput struct {
	Name     string `json:"name"`
	Semester int    `json:"semester"`
	StartsOn string `json:"starts_on"`
	EndsOn   string `json:"ends_on"`
	Active   bool   `json:"active"`
}

type AcademicYearUpdateInput struct {
	Name     *string `json:"name,omitempty"`
	Semester *int    `json:"semester,omitempty"`
	StartsOn *string `json:"starts_on,omitempty"`
	EndsOn   *string `json:"ends_on,omitempty"`
}

type AcademicYearFilter struct {
	Active  *bool
	Page    int32
	PerPage int32
}

type AcademicYearRepository interface {
	List(ctx context.Context, filter AcademicYearFilter) ([]AcademicYearRecord, int64, error)
	GetByID(ctx context.Context, id uuid.UUID) (*AcademicYearRecord, error)
	Create(ctx context.Context, item AcademicYearRecord, actorID uuid.UUID) (*AcademicYearRecord, error)
	Update(ctx context.Context, id uuid.UUID, input AcademicYearUpdateInput, actorID uuid.UUID) (*AcademicYearRecord, error)
	Delete(ctx context.Context, id uuid.UUID, actorID uuid.UUID) error
	Activate(ctx context.Context, id uuid.UUID, actorID uuid.UUID) (*AcademicYearRecord, error)
}

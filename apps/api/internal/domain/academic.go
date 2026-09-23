package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)


// Class (kelas)
type Class struct {
	ID                uuid.UUID  `json:"id"`
	Name              string     `json:"name"`
	GradeLevel        string     `json:"grade_level"`
	AcademicYear      string     `json:"academic_year"`
	HomeroomTeacherID *uuid.UUID `json:"homeroom_teacher_id,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
}

// Subject (mata pelajaran)
type Subject struct {
	ID        uuid.UUID `json:"id"`
	Code      string    `json:"code"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Student (siswa)
type Student struct {
	ID        uuid.UUID  `json:"id"`
	UserID    *uuid.UUID `json:"user_id,omitempty"`
	ClassID   *uuid.UUID `json:"class_id,omitempty"`
	NIS       string     `json:"nis"`
	FullName  string     `json:"full_name"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

type ClassSubject struct {
	ID        uuid.UUID  `json:"id"`
	ClassID   uuid.UUID  `json:"class_id"`
	SubjectID uuid.UUID  `json:"subject_id"`
	TeacherID *uuid.UUID `json:"teacher_id,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`


	ClassName   string `json:"class_name,omitempty"`
	SubjectName string `json:"subject_name,omitempty"`
	TeacherName string `json:"teacher_name,omitempty"`
}


type ClassRepository interface {
	Create(ctx context.Context, c *Class) error
	GetByID(ctx context.Context, id uuid.UUID) (*Class, error)
	List(ctx context.Context, offset, limit int32) ([]*Class, int64, error)
	Update(ctx context.Context, c *Class) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type SubjectRepository interface {
	Create(ctx context.Context, s *Subject) error
	GetByID(ctx context.Context, id uuid.UUID) (*Subject, error)
	GetByCode(ctx context.Context, code string) (*Subject, error)
	List(ctx context.Context, offset, limit int32) ([]*Subject, int64, error)
	Update(ctx context.Context, s *Subject) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type StudentRepository interface {
	Create(ctx context.Context, s *Student) error
	GetByID(ctx context.Context, id uuid.UUID) (*Student, error)
	ListByClass(ctx context.Context, classID uuid.UUID) ([]*Student, error)
	List(ctx context.Context, offset, limit int32) ([]*Student, int64, error)
	Update(ctx context.Context, s *Student) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type ClassSubjectRepository interface {
	Create(ctx context.Context, cs *ClassSubject) error
	GetByID(ctx context.Context, id uuid.UUID) (*ClassSubject, error)
	ListByClass(ctx context.Context, classID uuid.UUID) ([]*ClassSubject, error)
	ListByTeacher(ctx context.Context, teacherID uuid.UUID) ([]*ClassSubject, error)
	Delete(ctx context.Context, id uuid.UUID) error
}

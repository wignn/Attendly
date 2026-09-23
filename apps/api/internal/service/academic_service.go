package service

import (
	"context"
	"strings"
	"time"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/google/uuid"
)


type AcademicService struct {
	classes       domain.ClassRepository
	subjects      domain.SubjectRepository
	students      domain.StudentRepository
	classSubjects domain.ClassSubjectRepository
}

func NewAcademicService(
	classes domain.ClassRepository,
	subjects domain.SubjectRepository,
	students domain.StudentRepository,
	classSubjects domain.ClassSubjectRepository,
) *AcademicService {
	return &AcademicService{
		classes:       classes,
		subjects:      subjects,
		students:      students,
		classSubjects: classSubjects,
	}
}

func normalizePage(page, perPage int32) (offset, limit int32) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	return (page - 1) * perPage, perPage
}


func (s *AcademicService) CreateClass(ctx context.Context, name, gradeLevel, academicYear string, homeroomTeacherID *uuid.UUID) (*domain.Class, error) {
	if strings.TrimSpace(name) == "" {
		return nil, domain.ErrValidation
	}
	now := time.Now()
	c := &domain.Class{
		ID:                uuid.New(),
		Name:              name,
		GradeLevel:        gradeLevel,
		AcademicYear:      academicYear,
		HomeroomTeacherID: homeroomTeacherID,
		CreatedAt:         now,
		UpdatedAt:         now,
	}
	if err := s.classes.Create(ctx, c); err != nil {
		return nil, err
	}
	return c, nil
}

func (s *AcademicService) GetClass(ctx context.Context, id uuid.UUID) (*domain.Class, error) {
	return s.classes.GetByID(ctx, id)
}

func (s *AcademicService) ListClasses(ctx context.Context, page, perPage int32) ([]*domain.Class, int64, error) {
	offset, limit := normalizePage(page, perPage)
	return s.classes.List(ctx, offset, limit)
}

func (s *AcademicService) UpdateClass(ctx context.Context, c *domain.Class) error {
	return s.classes.Update(ctx, c)
}

func (s *AcademicService) DeleteClass(ctx context.Context, id uuid.UUID) error {
	return s.classes.Delete(ctx, id)
}

func (s *AcademicService) CreateSubject(ctx context.Context, code, name string) (*domain.Subject, error) {
	if strings.TrimSpace(code) == "" || strings.TrimSpace(name) == "" {
		return nil, domain.ErrValidation
	}
	if existing, _ := s.subjects.GetByCode(ctx, code); existing != nil {
		return nil, domain.ErrConflict
	}
	now := time.Now()
	sub := &domain.Subject{
		ID:        uuid.New(),
		Code:      code,
		Name:      name,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.subjects.Create(ctx, sub); err != nil {
		return nil, err
	}
	return sub, nil
}

func (s *AcademicService) ListSubjects(ctx context.Context, page, perPage int32) ([]*domain.Subject, int64, error) {
	offset, limit := normalizePage(page, perPage)
	return s.subjects.List(ctx, offset, limit)
}

func (s *AcademicService) DeleteSubject(ctx context.Context, id uuid.UUID) error {
	return s.subjects.Delete(ctx, id)
}

func (s *AcademicService) CreateStudent(ctx context.Context, nis, fullName string, classID, userID *uuid.UUID) (*domain.Student, error) {
	if strings.TrimSpace(nis) == "" || strings.TrimSpace(fullName) == "" {
		return nil, domain.ErrValidation
	}
	now := time.Now()
	st := &domain.Student{
		ID:        uuid.New(),
		UserID:    userID,
		ClassID:   classID,
		NIS:       nis,
		FullName:  fullName,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.students.Create(ctx, st); err != nil {
		return nil, err
	}
	return st, nil
}

func (s *AcademicService) GetStudent(ctx context.Context, id uuid.UUID) (*domain.Student, error) {
	return s.students.GetByID(ctx, id)
}

func (s *AcademicService) ListStudents(ctx context.Context, page, perPage int32) ([]*domain.Student, int64, error) {
	offset, limit := normalizePage(page, perPage)
	return s.students.List(ctx, offset, limit)
}

func (s *AcademicService) ListStudentsByClass(ctx context.Context, classID uuid.UUID) ([]*domain.Student, error) {
	return s.students.ListByClass(ctx, classID)
}

func (s *AcademicService) UpdateStudent(ctx context.Context, st *domain.Student) error {
	return s.students.Update(ctx, st)
}

func (s *AcademicService) DeleteStudent(ctx context.Context, id uuid.UUID) error {
	return s.students.Delete(ctx, id)
}


func (s *AcademicService) AssignSubjectToClass(ctx context.Context, classID, subjectID uuid.UUID, teacherID *uuid.UUID) (*domain.ClassSubject, error) {
	if _, err := s.classes.GetByID(ctx, classID); err != nil {
		return nil, err
	}
	if _, err := s.subjects.GetByID(ctx, subjectID); err != nil {
		return nil, err
	}
	now := time.Now()
	cs := &domain.ClassSubject{
		ID:        uuid.New(),
		ClassID:   classID,
		SubjectID: subjectID,
		TeacherID: teacherID,
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.classSubjects.Create(ctx, cs); err != nil {
		return nil, err
	}
	if full, err := s.classSubjects.GetByID(ctx, cs.ID); err == nil {
		return full, nil
	}
	return cs, nil
}

func (s *AcademicService) GetClassSubject(ctx context.Context, id uuid.UUID) (*domain.ClassSubject, error) {
	return s.classSubjects.GetByID(ctx, id)
}

func (s *AcademicService) ListClassSubjectsByClass(ctx context.Context, classID uuid.UUID) ([]*domain.ClassSubject, error) {
	return s.classSubjects.ListByClass(ctx, classID)
}

func (s *AcademicService) ListClassSubjectsByTeacher(ctx context.Context, teacherID uuid.UUID) ([]*domain.ClassSubject, error) {
	return s.classSubjects.ListByTeacher(ctx, teacherID)
}

func (s *AcademicService) UnassignSubjectFromClass(ctx context.Context, id uuid.UUID) error {
	return s.classSubjects.Delete(ctx, id)
}

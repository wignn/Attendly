package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type mockClassRepo struct {
	classes  map[uuid.UUID]*domain.ClassDetail
	students map[uuid.UUID]uuid.UUID // studentID -> classID
}

func newMockClassRepo() *mockClassRepo {
	return &mockClassRepo{
		classes:  make(map[uuid.UUID]*domain.ClassDetail),
		students: make(map[uuid.UUID]uuid.UUID),
	}
}

func (m *mockClassRepo) List(_ context.Context, f domain.ClassFilter) ([]domain.ClassDetail, int64, error) {
	var list []domain.ClassDetail
	for _, c := range m.classes {
		if c.DeletedAt != nil {
			continue
		}
		if f.AcademicYearID != uuid.Nil && (c.AcademicYearID == nil || *c.AcademicYearID != f.AcademicYearID) {
			continue
		}
		list = append(list, *c)
	}
	return list, int64(len(list)), nil
}

func (m *mockClassRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.ClassDetail, error) {
	c, ok := m.classes[id]
	if !ok || c.DeletedAt != nil {
		return nil, domain.ErrNotFound
	}
	return c, nil
}

func (m *mockClassRepo) Create(_ context.Context, in domain.ClassCreateInput, _ uuid.UUID) (*domain.ClassDetail, error) {
	for _, c := range m.classes {
		if c.DeletedAt == nil && (c.Code == in.Code || c.Name == in.Name) {
			return nil, domain.ErrConflict
		}
	}
	id := uuid.New()
	detail := &domain.ClassDetail{
		ID:                id,
		Code:              in.Code,
		Name:              in.Name,
		Grade:             in.Grade,
		Section:           in.Section,
		AcademicYearID:    in.AcademicYearID,
		HomeroomTeacherID: in.HomeroomTeacherID,
		CreatedAt:         time.Now(),
		UpdatedAt:         time.Now(),
	}
	m.classes[id] = detail
	return detail, nil
}

func (m *mockClassRepo) Update(_ context.Context, id uuid.UUID, in domain.ClassUpdateInput, _ uuid.UUID) (*domain.ClassDetail, error) {
	c, ok := m.classes[id]
	if !ok || c.DeletedAt != nil {
		return nil, domain.ErrNotFound
	}
	if in.Code != nil {
		c.Code = *in.Code
	}
	if in.Name != nil {
		c.Name = *in.Name
	}
	if in.Grade != nil {
		c.Grade = *in.Grade
	}
	if in.Section != nil {
		c.Section = *in.Section
	}
	if in.ClearHomeroomTeacher {
		c.HomeroomTeacherID = nil
	} else if in.HomeroomTeacherID != nil {
		c.HomeroomTeacherID = in.HomeroomTeacherID
	}
	c.UpdatedAt = time.Now()
	return c, nil
}

func (m *mockClassRepo) Delete(_ context.Context, id uuid.UUID, _ uuid.UUID) error {
	c, ok := m.classes[id]
	if !ok || c.DeletedAt != nil {
		return domain.ErrNotFound
	}
	now := time.Now()
	c.DeletedAt = &now
	return nil
}

func (m *mockClassRepo) ListStudents(_ context.Context, classID uuid.UUID, _, _ int32) ([]domain.ClassStudentItem, int64, error) {
	var list []domain.ClassStudentItem
	for sID, cID := range m.students {
		if cID == classID {
			list = append(list, domain.ClassStudentItem{
				StudentID: sID,
				NIS:       "1001",
				FullName:  "Siswa Test",
				Active:    true,
			})
		}
	}
	return list, int64(len(list)), nil
}

func (m *mockClassRepo) AddStudent(_ context.Context, classID uuid.UUID, studentID uuid.UUID, _ time.Time, _ uuid.UUID) error {
	m.students[studentID] = classID
	return nil
}

func (m *mockClassRepo) RemoveStudent(_ context.Context, classID uuid.UUID, studentID uuid.UUID, _ time.Time, _ uuid.UUID) error {
	if m.students[studentID] != classID {
		return domain.ErrNotFound
	}
	delete(m.students, studentID)
	return nil
}

func TestClassService(t *testing.T) {
	ctx := context.Background()
	repo := newMockClassRepo()
	svc := NewClassService(repo)

	admin := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleSuperAdmin}}
	teacher := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}

	// 1. Teacher cannot create
	_, err := svc.Create(ctx, teacher, domain.ClassCreateInput{Code: "X-A", Name: "Kelas 10-A"})
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden for teacher create, got %v", err)
	}

	// 2. Admin creates with validation
	_, err = svc.Create(ctx, admin, domain.ClassCreateInput{Code: "", Name: "Kelas 10-A"})
	if err != domain.ErrValidation {
		t.Fatalf("expected ErrValidation for empty code, got %v", err)
	}

	created, err := svc.Create(ctx, admin, domain.ClassCreateInput{
		Code:    "X-A",
		Name:    "Kelas 10-A",
		Grade:   "10",
		Section: "A",
	})
	if err != nil {
		t.Fatalf("failed to create class: %v", err)
	}

	// 3. Add student to class
	studentID := uuid.New()
	err = svc.AddStudent(ctx, admin, created.ID, domain.AddStudentToClassInput{
		StudentID: studentID,
	})
	if err != nil {
		t.Fatalf("failed to add student: %v", err)
	}

	// 4. List students in class
	stList, total, err := svc.ListStudents(ctx, teacher, created.ID, 1, 20)
	if err != nil || total != 1 || len(stList) != 1 {
		t.Fatalf("expected 1 student in class, got %v, %d", err, total)
	}

	// 5. Remove student
	err = svc.RemoveStudent(ctx, admin, created.ID, studentID, "")
	if err != nil {
		t.Fatalf("failed to remove student: %v", err)
	}
	stList2, total2, _ := svc.ListStudents(ctx, teacher, created.ID, 1, 20)
	if total2 != 0 || len(stList2) != 0 {
		t.Fatalf("expected 0 students after removal, got %d", total2)
	}
}

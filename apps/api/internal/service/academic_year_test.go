package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type mockAcademicYearRepo struct {
	items map[uuid.UUID]*domain.AcademicYearRecord
}

func newMockAcademicYearRepo() *mockAcademicYearRepo {
	return &mockAcademicYearRepo{items: make(map[uuid.UUID]*domain.AcademicYearRecord)}
}

func (m *mockAcademicYearRepo) List(_ context.Context, f domain.AcademicYearFilter) ([]domain.AcademicYearRecord, int64, error) {
	var list []domain.AcademicYearRecord
	for _, it := range m.items {
		if f.Active != nil && it.Active != *f.Active {
			continue
		}
		list = append(list, *it)
	}
	return list, int64(len(list)), nil
}

func (m *mockAcademicYearRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.AcademicYearRecord, error) {
	it, ok := m.items[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	return it, nil
}

func (m *mockAcademicYearRepo) Create(_ context.Context, item domain.AcademicYearRecord, _ uuid.UUID) (*domain.AcademicYearRecord, error) {
	if item.Active {
		for _, it := range m.items {
			it.Active = false
		}
	}
	item.ID = uuid.New()
	item.CreatedAt = time.Now()
	item.UpdatedAt = time.Now()
	m.items[item.ID] = &item
	return &item, nil
}

func (m *mockAcademicYearRepo) Update(_ context.Context, id uuid.UUID, input domain.AcademicYearUpdateInput, _ uuid.UUID) (*domain.AcademicYearRecord, error) {
	it, ok := m.items[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	if input.Name != nil {
		it.Name = *input.Name
	}
	if input.Semester != nil {
		it.Semester = *input.Semester
	}
	if input.StartsOn != nil {
		it.StartsOn = *input.StartsOn
	}
	if input.EndsOn != nil {
		it.EndsOn = *input.EndsOn
	}
	it.UpdatedAt = time.Now()
	return it, nil
}

func (m *mockAcademicYearRepo) Delete(_ context.Context, id uuid.UUID, _ uuid.UUID) error {
	it, ok := m.items[id]
	if !ok {
		return domain.ErrNotFound
	}
	if it.Active {
		return domain.ErrConflict
	}
	delete(m.items, id)
	return nil
}

func (m *mockAcademicYearRepo) Activate(_ context.Context, id uuid.UUID, _ uuid.UUID) (*domain.AcademicYearRecord, error) {
	it, ok := m.items[id]
	if !ok {
		return nil, domain.ErrNotFound
	}
	for _, o := range m.items {
		o.Active = false
	}
	it.Active = true
	it.UpdatedAt = time.Now()
	return it, nil
}

func TestAcademicYearService(t *testing.T) {
	ctx := context.Background()
	repo := newMockAcademicYearRepo()
	svc := NewAcademicYearService(repo)

	admin := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleSuperAdmin}}
	teacher := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}

	// 1. Teacher cannot create
	_, err := svc.Create(ctx, teacher, domain.AcademicYearCreateInput{
		Name:     "2026/2027",
		Semester: 1,
		StartsOn: "2026-07-01",
		EndsOn:   "2026-12-31",
	})
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden for teacher create, got %v", err)
	}

	// 2. Admin creates with validation checks
	_, err = svc.Create(ctx, admin, domain.AcademicYearCreateInput{
		Name:     "2026/2027",
		Semester: 3, // invalid semester
		StartsOn: "2026-07-01",
		EndsOn:   "2026-12-31",
	})
	if err != domain.ErrValidation {
		t.Fatalf("expected ErrValidation for invalid semester, got %v", err)
	}

	created1, err := svc.Create(ctx, admin, domain.AcademicYearCreateInput{
		Name:     "2026/2027",
		Semester: 1,
		StartsOn: "2026-07-01",
		EndsOn:   "2026-12-31",
		Active:   true,
	})
	if err != nil || !created1.Active {
		t.Fatalf("expected active created1, got %v, %v", err, created1)
	}

	created2, err := svc.Create(ctx, admin, domain.AcademicYearCreateInput{
		Name:     "2026/2027",
		Semester: 2,
		StartsOn: "2027-01-01",
		EndsOn:   "2027-06-30",
		Active:   false,
	})
	if err != nil {
		t.Fatalf("failed to create created2: %v", err)
	}

	// 3. Activate created2
	activated, err := svc.Activate(ctx, admin, created2.ID)
	if err != nil || !activated.Active {
		t.Fatalf("expected created2 active, got %v, %v", err, activated)
	}
	got1, _ := svc.GetByID(ctx, teacher, created1.ID)
	if got1.Active {
		t.Fatalf("expected created1 to be deactivated")
	}

	// 4. Deleting active academic year is rejected
	err = svc.Delete(ctx, admin, created2.ID)
	if err != domain.ErrConflict {
		t.Fatalf("expected ErrConflict when deleting active academic year, got %v", err)
	}
}

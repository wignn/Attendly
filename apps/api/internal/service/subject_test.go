package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type mockSubjectRepo struct {
	items map[uuid.UUID]*domain.SubjectRecord
}

func newMockSubjectRepo() *mockSubjectRepo {
	return &mockSubjectRepo{items: make(map[uuid.UUID]*domain.SubjectRecord)}
}

func (m *mockSubjectRepo) List(_ context.Context, _ domain.SubjectFilter) ([]domain.SubjectRecord, int64, error) {
	var list []domain.SubjectRecord
	for _, it := range m.items {
		if it.DeletedAt == nil {
			list = append(list, *it)
		}
	}
	return list, int64(len(list)), nil
}

func (m *mockSubjectRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.SubjectRecord, error) {
	it, ok := m.items[id]
	if !ok || it.DeletedAt != nil {
		return nil, domain.ErrNotFound
	}
	return it, nil
}

func (m *mockSubjectRepo) Create(_ context.Context, item domain.SubjectRecord, _ uuid.UUID) (*domain.SubjectRecord, error) {
	for _, it := range m.items {
		if it.DeletedAt == nil && (it.Code == item.Code || it.Name == item.Name) {
			return nil, domain.ErrConflict
		}
	}
	item.ID = uuid.New()
	item.CreatedAt = time.Now()
	item.UpdatedAt = time.Now()
	m.items[item.ID] = &item
	return &item, nil
}

func (m *mockSubjectRepo) Update(_ context.Context, id uuid.UUID, input domain.SubjectUpdateInput, _ uuid.UUID) (*domain.SubjectRecord, error) {
	it, ok := m.items[id]
	if !ok || it.DeletedAt != nil {
		return nil, domain.ErrNotFound
	}
	if input.Code != nil {
		it.Code = *input.Code
	}
	if input.Name != nil {
		it.Name = *input.Name
	}
	it.UpdatedAt = time.Now()
	return it, nil
}

func (m *mockSubjectRepo) Delete(_ context.Context, id uuid.UUID, _ uuid.UUID) error {
	it, ok := m.items[id]
	if !ok || it.DeletedAt != nil {
		return domain.ErrNotFound
	}
	now := time.Now()
	it.DeletedAt = &now
	return nil
}

func TestSubjectService(t *testing.T) {
	ctx := context.Background()
	repo := newMockSubjectRepo()
	svc := NewSubjectService(repo)

	admin := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleSuperAdmin}}
	teacher := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}

	// 1. Teacher cannot create
	_, err := svc.Create(ctx, teacher, domain.SubjectCreateInput{Code: "MATH", Name: "Matematika"})
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden for teacher create, got %v", err)
	}

	// 2. Admin creates with validation check
	_, err = svc.Create(ctx, admin, domain.SubjectCreateInput{Code: "", Name: "Matematika"})
	if err != domain.ErrValidation {
		t.Fatalf("expected ErrValidation for empty code, got %v", err)
	}

	created, err := svc.Create(ctx, admin, domain.SubjectCreateInput{Code: "MATH", Name: "Matematika"})
	if err != nil {
		t.Fatalf("failed to create subject: %v", err)
	}
	if created.Code != "MATH" || created.Name != "Matematika" {
		t.Fatalf("unexpected created subject: %+v", created)
	}

	// 3. Unique check (conflict)
	_, err = svc.Create(ctx, admin, domain.SubjectCreateInput{Code: "MATH", Name: "Matematika Lain"})
	if err != domain.ErrConflict {
		t.Fatalf("expected ErrConflict, got %v", err)
	}

	// 4. Teacher can list and get
	list, total, err := svc.List(ctx, teacher, domain.SubjectFilter{})
	if err != nil || total != 1 || len(list) != 1 {
		t.Fatalf("expected 1 subject in list, got %v, %d", err, total)
	}

	got, err := svc.GetByID(ctx, teacher, created.ID)
	if err != nil || got.ID != created.ID {
		t.Fatalf("expected to get created subject, got %v", err)
	}

	// 5. Admin updates
	newName := "Matematika Wajib"
	updated, err := svc.Update(ctx, admin, created.ID, domain.SubjectUpdateInput{Name: &newName})
	if err != nil || updated.Name != newName {
		t.Fatalf("failed to update subject: %v", err)
	}

	// 6. Admin deletes
	if err := svc.Delete(ctx, admin, created.ID); err != nil {
		t.Fatalf("failed to delete subject: %v", err)
	}
	_, err = svc.GetByID(ctx, teacher, created.ID)
	if err != domain.ErrNotFound {
		t.Fatalf("expected ErrNotFound after deletion, got %v", err)
	}
}

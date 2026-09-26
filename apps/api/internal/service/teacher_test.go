package service

import (
	"context"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

type mockTeacherRepo struct {
	items map[uuid.UUID]*domain.TeacherRecord
}

func newMockTeacherRepo() *mockTeacherRepo {
	return &mockTeacherRepo{items: make(map[uuid.UUID]*domain.TeacherRecord)}
}

func (m *mockTeacherRepo) List(_ context.Context, f domain.TeacherFilter) ([]domain.TeacherRecord, int64, error) {
	var list []domain.TeacherRecord
	for _, it := range m.items {
		if !f.IncludeDeleted && it.DeletedAt != nil {
			continue
		}
		if f.Status != "" && it.Status != f.Status {
			continue
		}
		list = append(list, *it)
	}
	return list, int64(len(list)), nil
}

func (m *mockTeacherRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.TeacherRecord, error) {
	it, ok := m.items[id]
	if !ok || it.DeletedAt != nil {
		return nil, domain.ErrNotFound
	}
	return it, nil
}

func (m *mockTeacherRepo) Create(_ context.Context, input domain.TeacherCreateInput, _ uuid.UUID) (*domain.TeacherRecord, error) {
	for _, it := range m.items {
		if it.DeletedAt == nil && (it.Email == input.Email || it.NIP == input.NIP) {
			return nil, domain.ErrConflict
		}
	}
	id := uuid.New()
	rec := &domain.TeacherRecord{
		ID:        id,
		UserID:    id,
		NIP:       input.NIP,
		FullName:  input.FullName,
		Email:     input.Email,
		Phone:     input.Phone,
		Status:    "ACTIVE",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	m.items[id] = rec
	return rec, nil
}

func (m *mockTeacherRepo) Update(_ context.Context, id uuid.UUID, input domain.TeacherUpdateInput, _ uuid.UUID) (*domain.TeacherRecord, error) {
	it, ok := m.items[id]
	if !ok || it.DeletedAt != nil {
		return nil, domain.ErrNotFound
	}
	if input.NIP != nil {
		it.NIP = *input.NIP
	}
	if input.FullName != nil {
		it.FullName = *input.FullName
	}
	if input.Email != nil {
		it.Email = *input.Email
	}
	if input.Phone != nil {
		it.Phone = *input.Phone
	}
	if input.Status != nil {
		it.Status = *input.Status
	}
	it.UpdatedAt = time.Now()
	return it, nil
}

func (m *mockTeacherRepo) Delete(_ context.Context, id uuid.UUID, _ uuid.UUID) error {
	it, ok := m.items[id]
	if !ok || it.DeletedAt != nil {
		return domain.ErrNotFound
	}
	now := time.Now()
	it.DeletedAt = &now
	it.Status = "INACTIVE"
	return nil
}

func TestTeacherService(t *testing.T) {
	ctx := context.Background()
	repo := newMockTeacherRepo()
	svc := NewTeacherService(repo)

	admin := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleSuperAdmin}}
	teacher := &domain.User{ID: uuid.New(), IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}

	// 1. Teacher cannot list or read all teacher accounts.
	if _, _, err := svc.List(ctx, teacher, domain.TeacherFilter{}); err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden for teacher list, got %v", err)
	}
	if _, err := svc.GetByID(ctx, teacher, uuid.New()); err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden for teacher get, got %v", err)
	}

	// 2. Teacher cannot create
	_, err := svc.Create(ctx, teacher, domain.TeacherCreateInput{
		NIP:      "198501012010011001",
		FullName: "Guru Budi",
		Email:    "budi@school.id",
		Password: "ValidTeacherPass123!",
	})
	if err != domain.ErrForbidden {
		t.Fatalf("expected ErrForbidden for teacher create, got %v", err)
	}

	// 2. Admin creates with validation
	_, err = svc.Create(ctx, admin, domain.TeacherCreateInput{
		NIP:      "",
		FullName: "Guru Budi",
		Email:    "budi@school.id",
		Password: "ValidTeacherPass123!",
	})
	if err != domain.ErrValidation {
		t.Fatalf("expected ErrValidation for empty NIP, got %v", err)
	}

	created, err := svc.Create(ctx, admin, domain.TeacherCreateInput{
		NIP:      "198501012010011001",
		FullName: "Guru Budi",
		Email:    "budi@school.id",
		Phone:    "08123456789",
		Password: "ValidTeacherPass123!",
	})
	if err != nil {
		t.Fatalf("failed to create teacher: %v", err)
	}

	// 3. Duplicate conflict
	_, err = svc.Create(ctx, admin, domain.TeacherCreateInput{
		NIP:      "198501012010011001",
		FullName: "Guru Budi 2",
		Email:    "budi2@school.id",
		Password: "ValidTeacherPass123!",
	})
	if err != domain.ErrConflict {
		t.Fatalf("expected ErrConflict for duplicate NIP, got %v", err)
	}

	// 4. Update
	newName := "Drs. Budi Santoso"
	updated, err := svc.Update(ctx, admin, created.ID, domain.TeacherUpdateInput{FullName: &newName})
	if err != nil || updated.FullName != newName {
		t.Fatalf("failed to update teacher: %v", err)
	}

	// 5. Delete (soft delete)
	if err := svc.Delete(ctx, admin, created.ID); err != nil {
		t.Fatalf("failed to delete teacher: %v", err)
	}
	_, err = svc.GetByID(ctx, admin, created.ID)
	if err != domain.ErrNotFound {
		t.Fatalf("expected ErrNotFound after soft deletion, got %v", err)
	}
}

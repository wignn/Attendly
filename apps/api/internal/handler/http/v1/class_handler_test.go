package v1

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/service"
)

type mockClassRepoForHandler struct {
	item *domain.ClassDetail
}

func (m *mockClassRepoForHandler) List(_ context.Context, _ domain.ClassFilter) ([]domain.ClassDetail, int64, error) {
	if m.item == nil {
		return nil, 0, nil
	}
	return []domain.ClassDetail{*m.item}, 1, nil
}

func (m *mockClassRepoForHandler) GetByID(_ context.Context, id uuid.UUID) (*domain.ClassDetail, error) {
	if m.item != nil && m.item.ID == id {
		return m.item, nil
	}
	return nil, domain.ErrNotFound
}

func (m *mockClassRepoForHandler) Create(_ context.Context, in domain.ClassCreateInput, _ uuid.UUID) (*domain.ClassDetail, error) {
	id := uuid.New()
	rec := &domain.ClassDetail{
		ID:        id,
		Code:      in.Code,
		Name:      in.Name,
		Grade:     in.Grade,
		Section:   in.Section,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	m.item = rec
	return rec, nil
}

func (m *mockClassRepoForHandler) Update(_ context.Context, id uuid.UUID, in domain.ClassUpdateInput, _ uuid.UUID) (*domain.ClassDetail, error) {
	if m.item == nil || m.item.ID != id {
		return nil, domain.ErrNotFound
	}
	if in.Name != nil {
		m.item.Name = *in.Name
	}
	return m.item, nil
}

func (m *mockClassRepoForHandler) Delete(_ context.Context, id uuid.UUID, _ uuid.UUID) error {
	if m.item == nil || m.item.ID != id {
		return domain.ErrNotFound
	}
	m.item = nil
	return nil
}

func (m *mockClassRepoForHandler) ListStudents(_ context.Context, classID uuid.UUID, _, _ int32) ([]domain.ClassStudentItem, int64, error) {
	return []domain.ClassStudentItem{
		{StudentID: uuid.New(), FullName: "Siswa 1", NIS: "1001", Active: true},
	}, 1, nil
}

func (m *mockClassRepoForHandler) AddStudent(_ context.Context, _, _ uuid.UUID, _ time.Time, _ uuid.UUID) error {
	return nil
}

func (m *mockClassRepoForHandler) RemoveStudent(_ context.Context, _, _ uuid.UUID, _ time.Time, _ uuid.UUID) error {
	return nil
}

func TestClassHandlerHTTP(t *testing.T) {
	adminID := uuid.New()
	classID := uuid.New()
	repo := &mockClassRepoForHandler{
		item: &domain.ClassDetail{
			ID:        classID,
			Code:      "XI-IPA-1",
			Name:      "Kelas XI IPA 1",
			Grade:     "XI",
			Section:   "IPA 1",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}
	svc := service.NewClassService(repo)
	handler := NewClassHandler(svc)

	r := chi.NewRouter()
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			user := &domain.User{
				ID:       adminID,
				IsActive: true,
				Roles:    []domain.Role{domain.RoleSuperAdmin},
			}
			ctx := context.WithValue(req.Context(), middleware.AuthenticatedUserContextKey, user)
			next.ServeHTTP(w, req.WithContext(ctx))
		})
	})

	r.Get("/classes", handler.List)
	r.Post("/classes", handler.Create)
	r.Get("/classes/{class_id}", handler.Get)
	r.Patch("/classes/{class_id}", handler.Update)
	r.Delete("/classes/{class_id}", handler.Delete)
	r.Get("/classes/{class_id}/students", handler.ListStudents)
	r.Post("/classes/{class_id}/students", handler.AddStudent)
	r.Delete("/classes/{class_id}/students/{student_id}", handler.RemoveStudent)

	// 1. List
	req := httptest.NewRequest(http.MethodGet, "/classes", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 2. Get
	req = httptest.NewRequest(http.MethodGet, "/classes/"+classID.String(), nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 3. Create
	createBody, _ := json.Marshal(domain.ClassCreateInput{
		Code:    "XII-IPS-2",
		Name:    "Kelas XII IPS 2",
		Grade:   "XII",
		Section: "IPS 2",
	})
	req = httptest.NewRequest(http.MethodPost, "/classes", bytes.NewReader(createBody))
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	// 4. List students in class
	req = httptest.NewRequest(http.MethodGet, "/classes/"+classID.String()+"/students", nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 5. Add student
	addBody, _ := json.Marshal(domain.AddStudentToClassInput{
		StudentID: uuid.New(),
	})
	req = httptest.NewRequest(http.MethodPost, "/classes/"+classID.String()+"/students", bytes.NewReader(addBody))
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 6. Delete
	req = httptest.NewRequest(http.MethodDelete, "/classes/"+repo.item.ID.String(), nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
}

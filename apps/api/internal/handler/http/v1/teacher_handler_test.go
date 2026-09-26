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

type mockTeacherRepoForHandler struct {
	item        *domain.TeacherRecord
	createInput domain.TeacherCreateInput
}

func (m *mockTeacherRepoForHandler) List(_ context.Context, _ domain.TeacherFilter) ([]domain.TeacherRecord, int64, error) {
	if m.item == nil {
		return nil, 0, nil
	}
	return []domain.TeacherRecord{*m.item}, 1, nil
}

func (m *mockTeacherRepoForHandler) GetByID(_ context.Context, id uuid.UUID) (*domain.TeacherRecord, error) {
	if m.item != nil && (m.item.ID == id || m.item.UserID == id) {
		return m.item, nil
	}
	return nil, domain.ErrNotFound
}

func (m *mockTeacherRepoForHandler) Create(_ context.Context, in domain.TeacherCreateInput, _ uuid.UUID) (*domain.TeacherRecord, error) {
	m.createInput = in
	id := uuid.New()
	rec := &domain.TeacherRecord{
		ID:        id,
		UserID:    id,
		NIP:       in.NIP,
		FullName:  in.FullName,
		Email:     in.Email,
		Phone:     in.Phone,
		Status:    "ACTIVE",
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	m.item = rec
	return rec, nil
}

func (m *mockTeacherRepoForHandler) Update(_ context.Context, id uuid.UUID, in domain.TeacherUpdateInput, _ uuid.UUID) (*domain.TeacherRecord, error) {
	if m.item == nil || (m.item.ID != id && m.item.UserID != id) {
		return nil, domain.ErrNotFound
	}
	if in.FullName != nil {
		m.item.FullName = *in.FullName
	}
	return m.item, nil
}

func (m *mockTeacherRepoForHandler) Delete(_ context.Context, id uuid.UUID, _ uuid.UUID) error {
	if m.item == nil || (m.item.ID != id && m.item.UserID != id) {
		return domain.ErrNotFound
	}
	m.item = nil
	return nil
}

func TestTeacherHandlerHTTP(t *testing.T) {
	adminID := uuid.New()
	teacherID := uuid.New()
	repo := &mockTeacherRepoForHandler{
		item: &domain.TeacherRecord{
			ID:        teacherID,
			UserID:    teacherID,
			NIP:       "198501012010011001",
			FullName:  "Dra. Siti Aminah",
			Email:     "siti@school.id",
			Status:    "ACTIVE",
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}
	svc := service.NewTeacherService(repo)
	handler := NewTeacherHandler(svc)

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

	r.Get("/teachers", handler.List)
	r.Post("/teachers", handler.Create)
	r.Get("/teachers/{teacher_id}", handler.Get)
	r.Patch("/teachers/{teacher_id}", handler.Update)
	r.Delete("/teachers/{teacher_id}", handler.Delete)

	// 1. List
	req := httptest.NewRequest(http.MethodGet, "/teachers", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 2. Get
	req = httptest.NewRequest(http.MethodGet, "/teachers/"+teacherID.String(), nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 3. Create
	createBody, _ := json.Marshal(domain.TeacherCreateInput{
		NIP:      "199002022015012002",
		FullName: "Ahmad Fauzi",
		Email:    "ahmad@school.id",
		Password: "ValidTeacherPass123!",
	})
	req = httptest.NewRequest(http.MethodPost, "/teachers", bytes.NewReader(createBody))
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	// 4. Update
	newName := "Ahmad Fauzi, M.Pd"
	updateBody, _ := json.Marshal(domain.TeacherUpdateInput{FullName: &newName})
	req = httptest.NewRequest(http.MethodPatch, "/teachers/"+repo.item.ID.String(), bytes.NewReader(updateBody))
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 5. Delete
	req = httptest.NewRequest(http.MethodDelete, "/teachers/"+repo.item.ID.String(), nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
}

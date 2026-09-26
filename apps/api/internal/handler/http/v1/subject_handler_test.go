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

type mockSubjectRepoForHandler struct {
	subject *domain.SubjectRecord
}

func (m *mockSubjectRepoForHandler) List(_ context.Context, _ domain.SubjectFilter) ([]domain.SubjectRecord, int64, error) {
	if m.subject == nil {
		return nil, 0, nil
	}
	return []domain.SubjectRecord{*m.subject}, 1, nil
}

func (m *mockSubjectRepoForHandler) GetByID(_ context.Context, id uuid.UUID) (*domain.SubjectRecord, error) {
	if m.subject != nil && m.subject.ID == id {
		return m.subject, nil
	}
	return nil, domain.ErrNotFound
}

func (m *mockSubjectRepoForHandler) Create(_ context.Context, item domain.SubjectRecord, _ uuid.UUID) (*domain.SubjectRecord, error) {
	item.ID = uuid.New()
	item.CreatedAt = time.Now()
	item.UpdatedAt = time.Now()
	m.subject = &item
	return &item, nil
}

func (m *mockSubjectRepoForHandler) Update(_ context.Context, id uuid.UUID, input domain.SubjectUpdateInput, _ uuid.UUID) (*domain.SubjectRecord, error) {
	if m.subject == nil || m.subject.ID != id {
		return nil, domain.ErrNotFound
	}
	if input.Name != nil {
		m.subject.Name = *input.Name
	}
	return m.subject, nil
}

func (m *mockSubjectRepoForHandler) Delete(_ context.Context, id uuid.UUID, _ uuid.UUID) error {
	if m.subject == nil || m.subject.ID != id {
		return domain.ErrNotFound
	}
	m.subject = nil
	return nil
}

func TestSubjectHandlerHTTP(t *testing.T) {
	adminID := uuid.New()
	subjID := uuid.New()
	repo := &mockSubjectRepoForHandler{
		subject: &domain.SubjectRecord{
			ID:   subjID,
			Code: "BIO",
			Name: "Biologi",
		},
	}
	svc := service.NewSubjectService(repo)
	handler := NewSubjectHandler(svc)

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

	r.Get("/subjects", handler.List)
	r.Post("/subjects", handler.Create)
	r.Get("/subjects/{id}", handler.Get)
	r.Patch("/subjects/{id}", handler.Update)
	r.Delete("/subjects/{id}", handler.Delete)

	// 1. List
	req := httptest.NewRequest(http.MethodGet, "/subjects", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 2. Get
	req = httptest.NewRequest(http.MethodGet, "/subjects/"+subjID.String(), nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 3. Create
	createBody, _ := json.Marshal(domain.SubjectCreateInput{Code: "CHEM", Name: "Kimia"})
	req = httptest.NewRequest(http.MethodPost, "/subjects", bytes.NewReader(createBody))
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	// 4. Update
	newName := "Kimia Terapan"
	updateBody, _ := json.Marshal(domain.SubjectUpdateInput{Name: &newName})
	req = httptest.NewRequest(http.MethodPatch, "/subjects/"+repo.subject.ID.String(), bytes.NewReader(updateBody))
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 5. Delete
	req = httptest.NewRequest(http.MethodDelete, "/subjects/"+repo.subject.ID.String(), nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected 204, got %d", rec.Code)
	}
}

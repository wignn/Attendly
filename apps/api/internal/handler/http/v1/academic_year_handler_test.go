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

type mockAcademicYearRepoForHandler struct {
	item *domain.AcademicYearRecord
}

func (m *mockAcademicYearRepoForHandler) List(_ context.Context, _ domain.AcademicYearFilter) ([]domain.AcademicYearRecord, int64, error) {
	if m.item == nil {
		return nil, 0, nil
	}
	return []domain.AcademicYearRecord{*m.item}, 1, nil
}

func (m *mockAcademicYearRepoForHandler) GetByID(_ context.Context, id uuid.UUID) (*domain.AcademicYearRecord, error) {
	if m.item != nil && m.item.ID == id {
		return m.item, nil
	}
	return nil, domain.ErrNotFound
}

func (m *mockAcademicYearRepoForHandler) Create(_ context.Context, item domain.AcademicYearRecord, _ uuid.UUID) (*domain.AcademicYearRecord, error) {
	item.ID = uuid.New()
	item.CreatedAt = time.Now()
	item.UpdatedAt = time.Now()
	m.item = &item
	return &item, nil
}

func (m *mockAcademicYearRepoForHandler) Update(_ context.Context, id uuid.UUID, input domain.AcademicYearUpdateInput, _ uuid.UUID) (*domain.AcademicYearRecord, error) {
	if m.item == nil || m.item.ID != id {
		return nil, domain.ErrNotFound
	}
	if input.Name != nil {
		m.item.Name = *input.Name
	}
	return m.item, nil
}

func (m *mockAcademicYearRepoForHandler) Delete(_ context.Context, id uuid.UUID, _ uuid.UUID) error {
	if m.item == nil || m.item.ID != id {
		return domain.ErrNotFound
	}
	m.item = nil
	return nil
}

func (m *mockAcademicYearRepoForHandler) Activate(_ context.Context, id uuid.UUID, _ uuid.UUID) (*domain.AcademicYearRecord, error) {
	if m.item == nil || m.item.ID != id {
		return nil, domain.ErrNotFound
	}
	m.item.Active = true
	return m.item, nil
}

func TestAcademicYearHandlerHTTP(t *testing.T) {
	adminID := uuid.New()
	ayID := uuid.New()
	repo := &mockAcademicYearRepoForHandler{
		item: &domain.AcademicYearRecord{
			ID:       ayID,
			Name:     "2026/2027",
			Semester: 1,
			StartsOn: "2026-07-01",
			EndsOn:   "2026-12-31",
			Active:   false,
		},
	}
	svc := service.NewAcademicYearService(repo)
	handler := NewAcademicYearHandler(svc)

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

	r.Get("/academic-years", handler.List)
	r.Post("/academic-years", handler.Create)
	r.Get("/academic-years/{id}", handler.Get)
	r.Patch("/academic-years/{id}", handler.Update)
	r.Delete("/academic-years/{id}", handler.Delete)
	r.Post("/academic-years/{id}/activate", handler.Activate)

	// 1. List
	req := httptest.NewRequest(http.MethodGet, "/academic-years", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 2. Get
	req = httptest.NewRequest(http.MethodGet, "/academic-years/"+ayID.String(), nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}

	// 3. Create
	createBody, _ := json.Marshal(domain.AcademicYearCreateInput{
		Name:     "2026/2027",
		Semester: 2,
		StartsOn: "2027-01-01",
		EndsOn:   "2027-06-30",
	})
	req = httptest.NewRequest(http.MethodPost, "/academic-years", bytes.NewReader(createBody))
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d", rec.Code)
	}

	// 4. Activate
	req = httptest.NewRequest(http.MethodPost, "/academic-years/"+repo.item.ID.String()+"/activate", nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rec.Code)
	}
}

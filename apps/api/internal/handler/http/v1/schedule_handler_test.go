package v1

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/service"
)

type scheduleHandlerRepoStub struct{ created int }

func (r *scheduleHandlerRepoStub) List(context.Context, domain.ScheduleFilter) ([]domain.Schedule, int64, error) {
	return []domain.Schedule{}, 0, nil
}
func (r *scheduleHandlerRepoStub) Get(context.Context, uuid.UUID) (*domain.Schedule, error) {
	return nil, domain.ErrNotFound
}
func (r *scheduleHandlerRepoStub) Create(_ context.Context, _ *domain.Schedule, _ uuid.UUID) error {
	r.created++
	return nil
}
func (r *scheduleHandlerRepoStub) Update(context.Context, *domain.Schedule, uuid.UUID) error {
	return nil
}
func (r *scheduleHandlerRepoStub) Delete(context.Context, uuid.UUID, uuid.UUID) error { return nil }

func TestScheduleHandlerRejectsMalformedCreateBeforeWriting(t *testing.T) {
	repo := &scheduleHandlerRepoStub{}
	h := NewScheduleHandler(service.NewScheduleService(repo))
	user := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleSuperAdmin}
	req := httptest.NewRequest(http.MethodPost, "/schedules", strings.NewReader(`{"teaching_assignment_id":"bad","day_of_week":1}`))
	req = req.WithContext(context.WithValue(req.Context(), middleware.AuthenticatedUserContextKey, user))
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("want 400, got %d: %s", w.Code, w.Body.String())
	}
	if repo.created != 0 {
		t.Fatalf("invalid payload wrote %d schedules", repo.created)
	}
}

func TestScheduleHandlerForbidsTeacherCreate(t *testing.T) {
	repo := &scheduleHandlerRepoStub{}
	h := NewScheduleHandler(service.NewScheduleService(repo))
	user := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleTeacher}
	req := httptest.NewRequest(http.MethodPost, "/schedules", strings.NewReader(`{"teaching_assignment_id":"d9d84e11-43f6-4227-8710-5dbe9f18b33c","day_of_week":1,"starts_at":"08:00","ends_at":"09:00","effective_from":"2026-09-01"}`))
	req = req.WithContext(context.WithValue(req.Context(), middleware.AuthenticatedUserContextKey, user))
	w := httptest.NewRecorder()
	h.Create(w, req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("want 403, got %d: %s", w.Code, w.Body.String())
	}
	if repo.created != 0 {
		t.Fatalf("teacher wrote %d schedules", repo.created)
	}
}

func TestSchedulePatchRejectsNullWeekday(t *testing.T) {
	h := NewScheduleHandler(service.NewScheduleService(&scheduleHandlerRepoStub{}))
	router := chi.NewRouter()
	router.Patch("/schedules/{schedule_id}", h.Update)
	user := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleSuperAdmin}
	req := httptest.NewRequest(http.MethodPatch, "/schedules/"+uuid.NewString(), strings.NewReader(`{"day_of_week":null}`))
	req = req.WithContext(context.WithValue(req.Context(), middleware.AuthenticatedUserContextKey, user))
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)
	if w.Code != http.StatusBadRequest {
		t.Fatalf("null weekday returned %d, want 400: %s", w.Code, w.Body.String())
	}
}

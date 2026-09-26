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

type mockAttendanceRepoForHandler struct {
	session *domain.AttendanceSessionDetail
}

func (m *mockAttendanceRepoForHandler) CanTeachClassSubject(context.Context, uuid.UUID, uuid.UUID, uuid.UUID) (bool, error) {
	return true, nil
}

func (m *mockAttendanceRepoForHandler) GetScheduleByID(_ context.Context, _ uuid.UUID) (*domain.Schedule, error) {
	return &domain.Schedule{
		ID:        uuid.New(),
		TeacherID: uuid.MustParse("00000000-0000-0000-0000-000000000001"),
	}, nil
}

func (m *mockAttendanceRepoForHandler) CreateOrGetFromSchedule(_ context.Context, schedID uuid.UUID, heldAt time.Time, _ uuid.UUID) (*domain.AttendanceSessionDetail, bool, error) {
	return m.session, true, nil
}

func (m *mockAttendanceRepoForHandler) CreateOrGetManual(_ context.Context, _, _, _ uuid.UUID, _ time.Time, _ uuid.UUID) (*domain.AttendanceSessionDetail, bool, error) {
	return m.session, true, nil
}

func (m *mockAttendanceRepoForHandler) GetByID(_ context.Context, id uuid.UUID) (*domain.AttendanceSessionDetail, error) {
	if m.session != nil && m.session.ID == id {
		return m.session, nil
	}
	return nil, domain.ErrNotFound
}

func (m *mockAttendanceRepoForHandler) List(_ context.Context, _ domain.AttendanceSessionFilter) ([]domain.AttendanceSessionDetail, int64, error) {
	return []domain.AttendanceSessionDetail{*m.session}, 1, nil
}

func (m *mockAttendanceRepoForHandler) UpdateRecords(_ context.Context, _ uuid.UUID, _ int, _ []domain.RecordUpdateItem, _ uuid.UUID) (*domain.AttendanceSessionDetail, error) {
	m.session.Version++
	return m.session, nil
}

func (m *mockAttendanceRepoForHandler) Submit(_ context.Context, _ uuid.UUID, _ int, _ uuid.UUID) (*domain.AttendanceSessionDetail, error) {
	m.session.Status = domain.SessionStatusSubmitted
	return m.session, nil
}

func (m *mockAttendanceRepoForHandler) Reopen(_ context.Context, _ uuid.UUID, _ uuid.UUID, reason string) (*domain.AttendanceSessionDetail, error) {
	m.session.Status = domain.SessionStatusReopened
	m.session.ReopenReason = &reason
	return m.session, nil
}

func TestAttendanceSessionHandlerHTTP(t *testing.T) {
	teacherID := uuid.MustParse("00000000-0000-0000-0000-000000000001")
	sessID := uuid.MustParse("00000000-0000-0000-0000-000000000010")

	repo := &mockAttendanceRepoForHandler{
		session: &domain.AttendanceSessionDetail{
			ID:        sessID,
			TeacherID: teacherID,
			Status:    domain.SessionStatusDraft,
			Version:   1,
		},
	}
	svc := service.NewAttendanceSessionService(repo)
	handler := NewAttendanceSessionHandler(svc)

	r := chi.NewRouter()
	r.Use(func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
			user := &domain.User{
				ID:       teacherID,
				IsActive: true,
				Roles:    []domain.Role{domain.RoleTeacher},
			}
			ctx := context.WithValue(req.Context(), middleware.AuthenticatedUserContextKey, user)
			next.ServeHTTP(w, req.WithContext(ctx))
		})
	})

	r.Post("/attendance-sessions", handler.CreateOrGet)
	r.Get("/attendance-sessions", handler.List)
	r.Get("/attendance-sessions/{id}", handler.Get)
	r.Put("/attendance-sessions/{id}/records", handler.UpdateRecords)
	r.Post("/attendance-sessions/{id}/submit", handler.Submit)
	r.Post("/attendance-sessions/{id}/reopen", handler.Reopen)

	// 1. Create or get session
	createBody, _ := json.Marshal(domain.CreateAttendanceSessionInput{
		ScheduleID: &sessID,
		Date:       "2026-09-26",
	})
	req := httptest.NewRequest(http.MethodPost, "/attendance-sessions", bytes.NewReader(createBody))
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusCreated && rec.Code != http.StatusOK {
		t.Fatalf("expected 200 or 201, got %d: %s", rec.Code, rec.Body.String())
	}

	// 2. Get session detail
	req = httptest.NewRequest(http.MethodGet, "/attendance-sessions/"+sessID.String(), nil)
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	// 3. Update records
	updateBody, _ := json.Marshal(domain.UpdateAttendanceRecordsInput{
		Version: 1,
		Records: []domain.RecordUpdateItem{
			{StudentID: uuid.New(), Status: domain.AttendancePresent},
		},
	})
	req = httptest.NewRequest(http.MethodPut, "/attendance-sessions/"+sessID.String()+"/records", bytes.NewReader(updateBody))
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	// 4. Submit session
	submitBody, _ := json.Marshal(domain.SubmitSessionInput{Version: 2})
	req = httptest.NewRequest(http.MethodPost, "/attendance-sessions/"+sessID.String()+"/submit", bytes.NewReader(submitBody))
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}

	// 5. Reopen session without admin role -> Forbidden
	reopenBody, _ := json.Marshal(domain.ReopenSessionInput{Reason: "Salah"})
	req = httptest.NewRequest(http.MethodPost, "/attendance-sessions/"+sessID.String()+"/reopen", bytes.NewReader(reopenBody))
	rec = httptest.NewRecorder()
	r.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for teacher reopening, got %d: %s", rec.Code, rec.Body.String())
	}
}

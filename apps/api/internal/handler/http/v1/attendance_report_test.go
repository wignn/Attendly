package v1

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/service"
)

type handlerReportRepo struct {
	admin      domain.AdminDashboard
	studentErr error
	teacher    domain.TeacherDashboard
	homeroom   domain.TeacherDashboard
	student    domain.StudentAttendanceSummary
	classes    []domain.SubjectClassReport
	class      domain.ClassAttendanceReport
	activities []domain.Activity
	allowed    bool
}

func (r handlerReportRepo) AdminDashboard(context.Context) (domain.AdminDashboard, error) {
	return r.admin, nil
}
func (r handlerReportRepo) TeacherDashboard(context.Context, uuid.UUID) (domain.TeacherDashboard, error) {
	return r.teacher, nil
}
func (r handlerReportRepo) HomeroomDashboard(context.Context, uuid.UUID) (domain.TeacherDashboard, error) {
	return r.homeroom, nil
}
func (r handlerReportRepo) StudentSummary(context.Context, uuid.UUID) (domain.StudentAttendanceSummary, error) {
	return r.student, r.studentErr
}
func (r handlerReportRepo) SubjectClasses(context.Context, uuid.UUID, uuid.UUID, int32, int32) ([]domain.SubjectClassReport, int64, error) {
	return r.classes, int64(len(r.classes)), nil
}
func (r handlerReportRepo) ClassAttendance(context.Context, uuid.UUID, uuid.UUID, int32, int32) (domain.ClassAttendanceReport, int64, error) {
	return r.class, 1, nil
}
func (r handlerReportRepo) HomeroomReport(context.Context, uuid.UUID, uuid.UUID, int32, int32) (domain.ClassAttendanceReport, int64, error) {
	return r.class, 1, nil
}
func (r handlerReportRepo) Activities(context.Context, int32, int32) ([]domain.Activity, int64, error) {
	return r.activities, int64(len(r.activities)), nil
}
func (handlerReportRepo) RecordActivity(context.Context, uuid.UUID, string, string, uuid.UUID) error {
	return nil
}
func (r handlerReportRepo) CanAccessSubject(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return r.allowed, nil
}
func (r handlerReportRepo) IsAssignedToClassSubject(context.Context, uuid.UUID, uuid.UUID, uuid.UUID) (bool, error) {
	return r.allowed, nil
}
func (r handlerReportRepo) IsHomeroomOfStudent(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return r.allowed, nil
}
func (r handlerReportRepo) IsHomeroomOfClass(context.Context, uuid.UUID, uuid.UUID) (bool, error) {
	return r.allowed, nil
}

func TestStudentSummaryForMissingStudentReturnsNotFound(t *testing.T) {
	handler := NewAttendanceReportHandler(service.NewAttendanceReportService(handlerReportRepo{studentErr: pgx.ErrNoRows}))
	router := chi.NewRouter()
	router.Get("/api/v1/students/{student_id}/attendance-summary", handler.StudentSummary)
	user := &domain.User{ID: uuid.New(), Roles: []domain.Role{domain.RoleSuperAdmin}}
	req := httptest.NewRequest(http.MethodGet, "/api/v1/students/"+uuid.NewString()+"/attendance-summary", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.AuthenticatedUserContextKey, user))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d: %s", rec.Code, rec.Body.String())
	}
}

func TestTeacherDashboardReturnsComputedRate(t *testing.T) {
	repo := handlerReportRepo{teacher: domain.TeacherDashboard{Attendance: domain.AttendanceCounts{Present: 8, Excused: 1, Sick: 1, UnexcusedAbsent: 2}}}
	handler := NewAttendanceReportHandler(service.NewAttendanceReportService(repo))
	router := chi.NewRouter()
	router.Get("/api/v1/teachers/me/dashboard", handler.TeacherDashboard)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/teachers/me/dashboard", nil)
	req = req.WithContext(context.WithValue(req.Context(), middleware.AuthenticatedUserContextKey, &domain.User{ID: uuid.New(), Roles: []domain.Role{domain.RoleTeacher}}))
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var envelope struct {
		Data domain.TeacherDashboard `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &envelope); err != nil {
		t.Fatal(err)
	}
	expectedRate := 8.0 / 12.0 * 100
	if difference := envelope.Data.Rate - expectedRate; difference < -1e-9 || difference > 1e-9 {
		t.Fatalf("expected attendance rate %v, got %v", expectedRate, envelope.Data.Rate)
	}
}

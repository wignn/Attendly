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

type assignmentHandlerRepo struct {
	created bool
	filter  domain.TeachingAssignmentFilter
}

func (r *assignmentHandlerRepo) CreateAssignment(_ context.Context, _ uuid.UUID, input domain.TeachingAssignmentInput) (domain.TeachingAssignmentRecord, error) {
	r.created = true
	return domain.TeachingAssignmentRecord{ID: uuid.New(), TeacherID: input.TeacherID, ClassID: input.ClassID, SubjectID: input.SubjectID, AcademicYearID: input.AcademicYearID, Active: true}, nil
}
func (r *assignmentHandlerRepo) GetAssignment(context.Context, uuid.UUID) (domain.TeachingAssignmentRecord, error) {
	return domain.TeachingAssignmentRecord{}, domain.ErrNotFound
}
func (r *assignmentHandlerRepo) ListAssignments(_ context.Context, f domain.TeachingAssignmentFilter) ([]domain.TeachingAssignmentRecord, int64, error) {
	r.filter = f
	return []domain.TeachingAssignmentRecord{}, 0, nil
}
func (r *assignmentHandlerRepo) UpdateAssignment(context.Context, uuid.UUID, uuid.UUID, domain.TeachingAssignmentInput) (domain.TeachingAssignmentRecord, error) {
	return domain.TeachingAssignmentRecord{}, nil
}
func (r *assignmentHandlerRepo) DeactivateAssignment(context.Context, uuid.UUID, uuid.UUID) error {
	return nil
}

func assignmentRequest(req *http.Request, user *domain.User) *http.Request {
	return req.WithContext(context.WithValue(req.Context(), middleware.AuthenticatedUserContextKey, user))
}

func TestTeachingAssignmentListForTeacherEnforcesRouteScope(t *testing.T) {
	repo := &assignmentHandlerRepo{}
	handler := NewTeachingAssignmentHandler(service.NewTeachingAssignmentService(repo))
	router := chi.NewRouter()
	router.Get("/teachers/{teacher_id}/assignments", handler.ListForTeacher)
	user := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleTeacher}
	other := uuid.New()
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, assignmentRequest(httptest.NewRequest(http.MethodGet, "/teachers/"+other.String()+"/assignments", nil), user))
	if rec.Code != http.StatusForbidden {
		t.Fatalf("cross-teacher route returned %d, want 403", rec.Code)
	}
	rec = httptest.NewRecorder()
	router.ServeHTTP(rec, assignmentRequest(httptest.NewRequest(http.MethodGet, "/teachers/"+user.ID.String()+"/assignments?page=2", nil), user))
	if rec.Code != http.StatusOK || repo.filter.TeacherID != user.ID || repo.filter.Page != 2 {
		t.Fatalf("own-teacher route returned %d, filter=%+v", rec.Code, repo.filter)
	}
}

func TestTeachingAssignmentCreateRejectsIncompleteBody(t *testing.T) {
	repo := &assignmentHandlerRepo{}
	handler := NewTeachingAssignmentHandler(service.NewTeachingAssignmentService(repo))
	router := chi.NewRouter()
	router.Post("/teaching-assignments", handler.Create)
	admin := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleSuperAdmin}
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, assignmentRequest(httptest.NewRequest(http.MethodPost, "/teaching-assignments", strings.NewReader(`{"teacher_id":"`+uuid.NewString()+`"}`)), admin))
	if rec.Code != http.StatusUnprocessableEntity || repo.created {
		t.Fatalf("incomplete body returned %d, created=%v", rec.Code, repo.created)
	}
}

func TestTeachingAssignmentPatchRejectsEmptyAndNull(t *testing.T) {
	handler := NewTeachingAssignmentHandler(service.NewTeachingAssignmentService(&assignmentHandlerRepo{}))
	router := chi.NewRouter()
	router.Patch("/teaching-assignments/{assignment_id}", handler.Update)
	admin := &domain.User{ID: uuid.New(), IsActive: true, Role: domain.RoleSuperAdmin}
	for _, body := range []string{`{}`, `{"class_id":null}`} {
		rec := httptest.NewRecorder()
		req := assignmentRequest(httptest.NewRequest(http.MethodPatch, "/teaching-assignments/"+uuid.NewString(), strings.NewReader(body)), admin)
		router.ServeHTTP(rec, req)
		if rec.Code != http.StatusBadRequest {
			t.Errorf("body %s: got %d, want 400", body, rec.Code)
		}
	}
}

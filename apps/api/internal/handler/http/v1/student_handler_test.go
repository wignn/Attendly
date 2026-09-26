package v1

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/service"
	"github.com/wignn/komas-api/pkg/token"
)

type studentServiceStub struct {
	list        func(context.Context, *domain.User, domain.StudentListFilter) ([]domain.StudentRecord, int64, error)
	get         func(context.Context, *domain.User, uuid.UUID) (domain.StudentRecord, error)
	create      func(context.Context, *domain.User, service.StudentCreateInput) (domain.StudentRecord, error)
	update      func(context.Context, *domain.User, uuid.UUID, service.StudentUpdateInput) (domain.StudentRecord, error)
	delete      func(context.Context, *domain.User, uuid.UUID) error
	enrollments func(context.Context, *domain.User, uuid.UUID) ([]domain.StudentEnrollment, error)
	transfer    func(context.Context, *domain.User, uuid.UUID, service.StudentTransferInput) (domain.StudentRecord, error)
}

func (s studentServiceStub) List(c context.Context, u *domain.User, f domain.StudentListFilter) ([]domain.StudentRecord, int64, error) {
	return s.list(c, u, f)
}
func (s studentServiceStub) Get(c context.Context, u *domain.User, id uuid.UUID) (domain.StudentRecord, error) {
	return s.get(c, u, id)
}
func (s studentServiceStub) Create(c context.Context, u *domain.User, i service.StudentCreateInput) (domain.StudentRecord, error) {
	return s.create(c, u, i)
}
func (s studentServiceStub) Update(c context.Context, u *domain.User, id uuid.UUID, i service.StudentUpdateInput) (domain.StudentRecord, error) {
	return s.update(c, u, id, i)
}
func (s studentServiceStub) SoftDelete(c context.Context, u *domain.User, id uuid.UUID) error {
	return s.delete(c, u, id)
}
func (s studentServiceStub) Enrollments(c context.Context, u *domain.User, id uuid.UUID) ([]domain.StudentEnrollment, error) {
	return s.enrollments(c, u, id)
}
func (s studentServiceStub) Transfer(c context.Context, u *domain.User, id uuid.UUID, i service.StudentTransferInput) (domain.StudentRecord, error) {
	return s.transfer(c, u, id, i)
}

func studentRecord() domain.StudentRecord {
	return domain.StudentRecord{ID: uuid.MustParse("65c33d29-65e2-4d1b-9a82-d814f9c19426"), NIS: "N-1", FullName: "A Student", CurrentClassID: uuid.MustParse("f0fd2655-74e3-4b47-9c89-2ff2f21d9c8f"), Active: true}
}
func studentRequest(method, path, body string) *http.Request {
	r := httptest.NewRequest(method, path, strings.NewReader(body))
	rctx := chi.NewRouteContext()
	parts := strings.Split(strings.Trim(path, "/"), "/")
	if len(parts) > 1 {
		rctx.URLParams.Add("student_id", parts[1])
	}
	ctx := context.WithValue(r.Context(), chi.RouteCtxKey, rctx)
	return r.WithContext(context.WithValue(ctx, middleware.AuthenticatedUserContextKey, &domain.User{ID: uuid.New(), Role: domain.RoleSuperAdmin}))
}
func assertStudentStatus(t *testing.T, handler http.HandlerFunc, method, path, body string, want int) *httptest.ResponseRecorder {
	t.Helper()
	rec := httptest.NewRecorder()
	handler(rec, studentRequest(method, path, body))
	if rec.Code != want {
		t.Fatalf("status=%d want %d body=%s", rec.Code, want, rec.Body.String())
	}
	return rec
}
func TestStudentHandlerCRUDHistoryAndTransferEnvelopes(t *testing.T) {
	rec := studentRecord()
	date := time.Date(2026, 9, 26, 0, 0, 0, 0, time.UTC)
	stub := studentServiceStub{
		list: func(_ context.Context, _ *domain.User, f domain.StudentListFilter) ([]domain.StudentRecord, int64, error) {
			if f.Page != 2 || f.PerPage != 10 || f.Search != "mia" || f.SortBy != "nis" || f.SortOrder != "desc" {
				t.Errorf("unexpected filter: %+v", f)
			}
			return []domain.StudentRecord{rec}, 11, nil
		},
		get: func(context.Context, *domain.User, uuid.UUID) (domain.StudentRecord, error) { return rec, nil },
		create: func(_ context.Context, _ *domain.User, i service.StudentCreateInput) (domain.StudentRecord, error) {
			if i.NIS != "N-1" || i.ClassID != rec.CurrentClassID || i.EffectiveOn == nil || !i.EffectiveOn.Equal(date) {
				t.Errorf("unexpected create input: %+v", i)
			}
			return rec, nil
		},
		update: func(context.Context, *domain.User, uuid.UUID, service.StudentUpdateInput) (domain.StudentRecord, error) {
			return rec, nil
		},
		delete: func(context.Context, *domain.User, uuid.UUID) error { return nil },
		enrollments: func(context.Context, *domain.User, uuid.UUID) ([]domain.StudentEnrollment, error) {
			return []domain.StudentEnrollment{{ID: uuid.New(), StudentID: rec.ID, ClassID: rec.CurrentClassID, ClassName: "Class A", ValidFrom: date}}, nil
		},
		transfer: func(_ context.Context, _ *domain.User, _ uuid.UUID, i service.StudentTransferInput) (domain.StudentRecord, error) {
			if i.ClassID == uuid.Nil || i.EffectiveOn == nil || !i.EffectiveOn.Equal(date) {
				t.Errorf("unexpected transfer input: %+v", i)
			}
			return rec, nil
		},
	}
	h := NewStudentHandler(stub)
	id := rec.ID.String()
	list := assertStudentStatus(t, h.List, "GET", "/students?page=2&per_page=10&search=mia&sort_by=nis&sort_order=desc", "", http.StatusOK)
	for _, s := range []string{`"success":true`, `"page":2`, `"per_page":10`, `"total":11`, `"total_pages":2`, `"message":"Students retrieved"`} {
		if !strings.Contains(list.Body.String(), s) {
			t.Errorf("list response missing %s: %s", s, list.Body.String())
		}
	}
	for _, tc := range []struct {
		name, method, path, body string
		handler                  http.HandlerFunc
		status                   int
		message                  string
	}{
		{"detail", "GET", "/students/" + id, "", h.Get, http.StatusOK, "Student retrieved"},
		{"create", "POST", "/students", `{"nis":"N-1","full_name":"A Student","class_id":"f0fd2655-74e3-4b47-9c89-2ff2f21d9c8f","effective_on":"2026-09-26"}`, h.Create, http.StatusCreated, "Student created"},
		{"update", "PATCH", "/students/" + id, `{"full_name":"Updated"}`, h.Update, http.StatusOK, "Student updated"},
		{"delete", "DELETE", "/students/" + id, "", h.Delete, http.StatusOK, "Student deleted"},
		{"history", "GET", "/students/" + id + "/enrollments", "", h.Enrollments, http.StatusOK, "Student enrollments retrieved"},
		{"transfer", "POST", "/students/" + id + "/enrollments", `{"class_id":"f0fd2655-74e3-4b47-9c89-2ff2f21d9c8f","effective_on":"2026-09-26"}`, h.Transfer, http.StatusCreated, "Student enrollment transferred"},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r := assertStudentStatus(t, tc.handler, tc.method, tc.path, tc.body, tc.status)
			if !strings.Contains(r.Body.String(), `"success":true`) || !strings.Contains(r.Body.String(), `"message":"`+tc.message+`"`) {
				t.Errorf("unexpected success envelope: %s", r.Body.String())
			}
		})
	}
}

func TestStudentHandlerRejectsMalformedIDsFiltersBodiesAndDates(t *testing.T) {
	stub := studentServiceStub{
		list: func(context.Context, *domain.User, domain.StudentListFilter) ([]domain.StudentRecord, int64, error) {
			t.Fatal("service called for invalid list filter")
			return nil, 0, nil
		},
		get: func(context.Context, *domain.User, uuid.UUID) (domain.StudentRecord, error) {
			t.Fatal("service called for invalid id")
			return domain.StudentRecord{}, nil
		},
		create: func(context.Context, *domain.User, service.StudentCreateInput) (domain.StudentRecord, error) {
			t.Fatal("service called for invalid body")
			return domain.StudentRecord{}, nil
		},
		update: func(context.Context, *domain.User, uuid.UUID, service.StudentUpdateInput) (domain.StudentRecord, error) {
			t.Fatal("service called for invalid body")
			return domain.StudentRecord{}, nil
		},
		transfer: func(context.Context, *domain.User, uuid.UUID, service.StudentTransferInput) (domain.StudentRecord, error) {
			t.Fatal("service called for invalid body")
			return domain.StudentRecord{}, nil
		},
	}
	h := NewStudentHandler(stub)
	for _, tc := range []struct {
		name, method, path, body, code string
		fn                             http.HandlerFunc
	}{
		{"invalid id", "GET", "/students/nope", "", "INVALID_ID", h.Get},
		{"invalid page", "GET", "/students?page=0", "", "INVALID_FILTER", h.List},
		{"invalid class filter", "GET", "/students?class_id=nope", "", "INVALID_FILTER", h.List},
		{"malformed json", "POST", "/students", "{", "INVALID_PAYLOAD", h.Create},
		{"unknown update class", "PATCH", "/students/65c33d29-65e2-4d1b-9a82-d814f9c19426", `{"class_id":"f0fd2655-74e3-4b47-9c89-2ff2f21d9c8f"}`, "INVALID_PAYLOAD", h.Update},
		{"invalid effective date", "POST", "/students", `{"nis":"N","full_name":"Name","class_id":"f0fd2655-74e3-4b47-9c89-2ff2f21d9c8f","effective_on":"26-09-2026"}`, "INVALID_PAYLOAD", h.Create},
	} {
		t.Run(tc.name, func(t *testing.T) {
			r := assertStudentStatus(t, tc.fn, tc.method, tc.path, tc.body, http.StatusBadRequest)
			if !strings.Contains(r.Body.String(), `"code":"`+tc.code+`"`) {
				t.Errorf("expected %s: %s", tc.code, r.Body.String())
			}
		})
	}
}

func TestStudentHandlerMapsDomainErrorsWithoutLeakingInternalDetails(t *testing.T) {
	boom := errors.New("pq: SELECT password FROM secrets")
	mk := func(err error) *StudentHandler {
		return NewStudentHandler(studentServiceStub{
			get: func(context.Context, *domain.User, uuid.UUID) (domain.StudentRecord, error) {
				return domain.StudentRecord{}, err
			},
			create: func(context.Context, *domain.User, service.StudentCreateInput) (domain.StudentRecord, error) {
				return domain.StudentRecord{}, err
			},
			update: func(context.Context, *domain.User, uuid.UUID, service.StudentUpdateInput) (domain.StudentRecord, error) {
				return domain.StudentRecord{}, err
			},
			delete:      func(context.Context, *domain.User, uuid.UUID) error { return err },
			enrollments: func(context.Context, *domain.User, uuid.UUID) ([]domain.StudentEnrollment, error) { return nil, err },
			transfer: func(context.Context, *domain.User, uuid.UUID, service.StudentTransferInput) (domain.StudentRecord, error) {
				return domain.StudentRecord{}, err
			},
		})
	}
	for _, tc := range []struct {
		name   string
		err    error
		status int
		code   string
	}{{"duplicate NIS", domain.ErrDuplicateNIS, http.StatusConflict, "DUPLICATE_NIS"}, {"duplicate NISN", domain.ErrDuplicateNISN, http.StatusConflict, "DUPLICATE_NISN"}, {"missing", domain.ErrNotFound, http.StatusNotFound, "NOT_FOUND"}, {"forbidden", domain.ErrForbidden, http.StatusForbidden, "FORBIDDEN"}, {"invalid", domain.ErrValidation, http.StatusBadRequest, "VALIDATION_FAILED"}, {"unexpected", boom, http.StatusInternalServerError, "INTERNAL_ERROR"}} {
		t.Run(tc.name, func(t *testing.T) {
			h := mk(tc.err)
			r := assertStudentStatus(t, h.Get, "GET", "/students/65c33d29-65e2-4d1b-9a82-d814f9c19426", "", tc.status)
			if !strings.Contains(r.Body.String(), `"code":"`+tc.code+`"`) {
				t.Errorf("expected %s: %s", tc.code, r.Body.String())
			}
			if strings.Contains(r.Body.String(), "password") || strings.Contains(r.Body.String(), "pq:") {
				t.Errorf("internal error leaked: %s", r.Body.String())
			}
		})
	}
}

func TestStudentRoutesRequireSuperAdmin(t *testing.T) {
	h := NewStudentHandler(studentServiceStub{list: func(context.Context, *domain.User, domain.StudentListFilter) ([]domain.StudentRecord, int64, error) {
		return nil, 0, nil
	}})
	r := chi.NewRouter()
	r.Group(func(r chi.Router) {
		r.Use(func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
				ctx := context.WithValue(req.Context(), middleware.UserContextKey, &token.Claims{})
				ctx = context.WithValue(ctx, middleware.AuthenticatedUserContextKey, &domain.User{Role: domain.RoleTeacher})
				next.ServeHTTP(w, req.WithContext(ctx))
			})
		})
		r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Get("/students", h.List)
	})
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/students", nil))
	if rec.Code != http.StatusForbidden {
		t.Fatalf("non-admin status=%d, want 403", rec.Code)
	}
}

package middleware

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/pkg/token"
)

func TestRequireRoleRejectsUnassignedRole(t *testing.T) {
	maker := token.NewMaker("secret-32-character-key-for-test-12345")
	access, err := maker.GenerateToken(uuid.New(), "teacher@example.com", domain.RoleTeacher, time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	claims, err := maker.VerifyAccessToken(access)
	if err != nil {
		t.Fatal(err)
	}

	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	handler := RequireRole(domain.RoleSuperAdmin)(next)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin", nil)
	req = req.WithContext(context.WithValue(req.Context(), UserContextKey, claims))
	req = req.WithContext(context.WithValue(req.Context(), AuthenticatedUserContextKey, &domain.User{Roles: []domain.Role{domain.RoleTeacher}}))
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected unassigned super-admin role to be rejected, got %d", rec.Code)
	}
}

func TestRequireRoleAcceptsAnyAssignedRole(t *testing.T) {
	maker := token.NewMaker("secret-32-character-key-for-test-12345")
	access, err := maker.GenerateToken(uuid.New(), "teacher@example.com", domain.RoleTeacher, time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	claims, err := maker.VerifyAccessToken(access)
	if err != nil {
		t.Fatal(err)
	}
	claims.Roles = []domain.Role{domain.RoleTeacher, domain.RoleHomeroomTeacher}

	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	handler := RequireRole(domain.RoleHomeroomTeacher)(next)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/classes", nil)
	req = req.WithContext(context.WithValue(req.Context(), UserContextKey, claims))
	req = req.WithContext(context.WithValue(req.Context(), AuthenticatedUserContextKey, &domain.User{Roles: []domain.Role{domain.RoleTeacher, domain.RoleHomeroomTeacher}}))
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusNoContent {
		t.Fatalf("expected assigned homeroom-teacher role to be accepted, got %d", rec.Code)
	}
}

type authMiddlewareUserRepo struct {
	user *domain.User
}

func (r authMiddlewareUserRepo) Create(context.Context, *domain.User) error { return nil }
func (r authMiddlewareUserRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.User, error) {
	if r.user == nil || r.user.ID != id {
		return nil, domain.ErrNotFound
	}
	return r.user, nil
}
func (r authMiddlewareUserRepo) GetByEmail(context.Context, string) (*domain.User, error) {
	return nil, domain.ErrNotFound
}
func (r authMiddlewareUserRepo) List(context.Context, int32, int32) ([]*domain.User, int64, error) {
	return nil, 0, nil
}
func (r authMiddlewareUserRepo) Update(context.Context, *domain.User) error { return nil }
func (r authMiddlewareUserRepo) Delete(context.Context, uuid.UUID) error    { return nil }

func TestAuthenticateRejectsInactiveUser(t *testing.T) {
	maker := token.NewMaker("secret-32-character-key-for-test-12345")
	user := &domain.User{ID: uuid.New(), Email: "inactive@example.com", IsActive: false}
	access, err := maker.GenerateToken(user.ID, user.Email, domain.RoleTeacher, time.Minute)
	if err != nil {
		t.Fatal(err)
	}

	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	handler := Authenticate(maker, authMiddlewareUserRepo{user: user})(next)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer "+access)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected inactive account to be rejected with 401, got %d", rec.Code)
	}
}

func TestRequireRoleUsesCurrentPersistedRoles(t *testing.T) {
	maker := token.NewMaker("secret-32-character-key-for-test-12345")
	user := &domain.User{ID: uuid.New(), Email: "teacher@example.com", IsActive: true, Roles: []domain.Role{domain.RoleTeacher}}
	access, err := maker.GenerateToken(user.ID, user.Email, domain.RoleSuperAdmin, time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) })
	handler := Authenticate(maker, authMiddlewareUserRepo{user: user})(RequireRole(domain.RoleSuperAdmin)(next))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/admin", nil)
	req.Header.Set("Authorization", "Bearer "+access)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusForbidden {
		t.Fatalf("expected revoked role in JWT to be denied, got %d", rec.Code)
	}
}

func TestAuthenticateRequiresRepository(t *testing.T) {
	maker := token.NewMaker("secret-32-character-key-for-test-12345")
	access, err := maker.GenerateToken(uuid.New(), "teacher@example.com", domain.RoleTeacher, time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	handler := Authenticate(maker, nil)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(http.StatusNoContent) }))
	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer "+access)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusInternalServerError {
		t.Fatalf("expected missing repository to fail closed, got %d", rec.Code)
	}
}

func TestAuthenticateRejectsRefreshToken(t *testing.T) {
	maker := token.NewMaker("secret-32-character-key-for-test-12345")
	refresh, err := maker.GenerateRefreshToken(uuid.New(), "teacher@example.com", domain.RoleTeacher, time.Minute, uuid.New())
	if err != nil {
		t.Fatal(err)
	}

	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	handler := Authenticate(maker, authMiddlewareUserRepo{})(next)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer "+refresh)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected refresh token to be rejected with 401, got %d", rec.Code)
	}
}

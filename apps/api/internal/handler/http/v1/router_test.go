package v1

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/service"
	"github.com/wignn/komas-api/pkg/token"
)

type routeUserRepository struct{}

func (routeUserRepository) Create(context.Context, *domain.User) error { return nil }
func (routeUserRepository) GetByID(context.Context, uuid.UUID) (*domain.User, error) {
	return nil, domain.ErrNotFound
}
func (routeUserRepository) GetByEmail(context.Context, string) (*domain.User, error) {
	return nil, domain.ErrNotFound
}
func (routeUserRepository) List(context.Context, int32, int32) ([]*domain.User, int64, error) {
	return nil, 0, nil
}
func (routeUserRepository) Update(context.Context, *domain.User) error { return nil }
func (routeUserRepository) Delete(context.Context, uuid.UUID) error    { return nil }

func TestPublicRegistrationRouteIsUnavailable(t *testing.T) {
	router := chi.NewRouter()
	users := routeUserRepository{}
	handler := NewAuthHandler(service.NewAuthService(users, token.NewMaker("secret-32-character-key-for-test-12345"), nil))
	RegisterRoutes(router, Handlers{Auth: handler}, token.NewMaker("secret-32-character-key-for-test-12345"), nil, users)

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", nil)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotFound && rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected registration route to be unavailable, got %d: %s", rec.Code, rec.Body.String())
	}
}

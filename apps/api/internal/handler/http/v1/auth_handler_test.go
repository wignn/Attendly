package v1

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/wignn/komas-api/internal/config"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/service"
	"github.com/wignn/komas-api/pkg/token"
	"github.com/google/uuid"
)

type mockUserRepo struct {
	users map[string]*domain.User
}

func (m *mockUserRepo) Create(ctx context.Context, u *domain.User) error {
	m.users[u.Email] = u
	return nil
}
func (m *mockUserRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.User, error) {
	for _, u := range m.users {
		if u.ID == id {
			return u, nil
		}
	}
	return nil, domain.ErrNotFound
}
func (m *mockUserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	if u, ok := m.users[email]; ok {
		return u, nil
	}
	return nil, domain.ErrNotFound
}
func (m *mockUserRepo) List(ctx context.Context, offset, limit int32) ([]*domain.User, int64, error) {
	var list []*domain.User
	for _, u := range m.users {
		list = append(list, u)
	}
	return list, int64(len(list)), nil
}
func (m *mockUserRepo) Update(ctx context.Context, u *domain.User) error { return nil }
func (m *mockUserRepo) Delete(ctx context.Context, id uuid.UUID) error   { return nil }

func TestRegisterAndLoginHandler(t *testing.T) {
	repo := &mockUserRepo{users: make(map[string]*domain.User)}
	cfg := &config.Config{
		JWTSecret:     "secret-32-character-key-for-test-12345",
		JWTAccessTTL:  15 * time.Minute,
		JWTRefreshTTL: 7 * 24 * time.Hour,
	}
	maker := token.NewMaker(cfg.JWTSecret)
	authSvc := service.NewAuthService(repo, maker, cfg, nil)
	handler := NewAuthHandler(authSvc)

	// 1. Test Register
	regPayload := RegisterRequest{
		Name:     "Alice Test",
		Email:    "alice@enterprise.com",
		Password: "strongpassword123",
		Role:     "ADMIN",
	}
	body, _ := json.Marshal(regPayload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(body))
	rec := httptest.NewRecorder()

	handler.Register(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected register status 201, got %d: %s", rec.Code, rec.Body.String())
	}

	// 2. Test Login
	loginPayload := LoginRequest{
		Email:    "alice@enterprise.com",
		Password: "strongpassword123",
	}
	body, _ = json.Marshal(loginPayload)
	req = httptest.NewRequest(http.MethodPost, "/api/v1/auth/login", bytes.NewBuffer(body))
	rec = httptest.NewRecorder()

	handler.Login(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected login status 200, got %d: %s", rec.Code, rec.Body.String())
	}
}

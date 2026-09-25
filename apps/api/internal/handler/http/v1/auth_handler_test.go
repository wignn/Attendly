package v1

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/config"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/service"
	"github.com/wignn/komas-api/pkg/token"
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

func TestRegisterRejectsCallerSelectedRole(t *testing.T) {
	repo := &mockUserRepo{users: make(map[string]*domain.User)}
	cfg := &config.Config{
		JWTSecret:     "secret-32-character-key-for-test-12345",
		JWTAccessTTL:  15 * time.Minute,
		JWTRefreshTTL: 7 * 24 * time.Hour,
	}
	handler := NewAuthHandler(service.NewAuthService(repo, token.NewMaker(cfg.JWTSecret), cfg))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBufferString(`{"name":"Alice Test","email":"alice@enterprise.com","password":"strongpassword123","role":"SUPER_ADMIN"}`))
	rec := httptest.NewRecorder()
	handler.Register(rec, req)

	if rec.Code != http.StatusCreated {
		t.Fatalf("expected register status 201, got %d: %s", rec.Code, rec.Body.String())
	}
	var response struct {
		Data struct {
			TokenType string `json:"token_type"`
			User      struct {
				Roles       []domain.Role `json:"roles"`
				Permissions []string      `json:"permissions"`
				Role        string        `json:"role"`
				Password    string        `json:"password"`
			} `json:"user"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response.Data.TokenType != "Bearer" {
		t.Fatalf("expected token_type Bearer, got %q", response.Data.TokenType)
	}
	if len(response.Data.User.Roles) != 1 || response.Data.User.Roles[0] != domain.RoleTeacher {
		t.Fatalf("expected sanitized user roles to contain TEACHER, got %#v", response.Data.User.Roles)
	}
	if response.Data.User.Role != "" || response.Data.User.Password != "" {
		t.Fatal("auth response must not expose the raw user role or password")
	}
	if len(response.Data.User.Permissions) == 0 {
		t.Fatal("expected current user permissions in auth response")
	}
	if got := repo.users["alice@enterprise.com"].Role; got != domain.RoleTeacher {
		t.Fatalf("expected role %s, got %s", domain.RoleTeacher, got)
	}
}

func TestLogoutHandlerReturnsNoContentAndRevokesToken(t *testing.T) {
	repo := &mockUserRepo{users: make(map[string]*domain.User)}
	cfg := &config.Config{
		JWTSecret:     "secret-32-character-key-for-test-12345",
		JWTAccessTTL:  time.Minute,
		JWTRefreshTTL: time.Hour,
	}
	sessions := &handlerSessionMemory{active: make(map[string]domain.RefreshSession)}
	handler := NewAuthHandler(service.NewAuthService(repo, token.NewMaker(cfg.JWTSecret), cfg, sessions))
	registerReq := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBufferString(`{"name":"Alice Test","email":"alice@enterprise.com","password":"strongpassword123"}`))
	registerRec := httptest.NewRecorder()
	handler.Register(registerRec, registerReq)
	if registerRec.Code != http.StatusCreated {
		t.Fatalf("expected registration 201, got %d: %s", registerRec.Code, registerRec.Body.String())
	}
	var authResponse struct {
		Data struct {
			RefreshToken string `json:"refresh_token"`
		} `json:"data"`
	}
	if err := json.Unmarshal(registerRec.Body.Bytes(), &authResponse); err != nil {
		t.Fatal(err)
	}
	body, err := json.Marshal(RefreshTokenRequest{RefreshToken: authResponse.Data.RefreshToken})
	if err != nil {
		t.Fatal(err)
	}
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/logout", bytes.NewReader(body))
	rec := httptest.NewRecorder()
	handler.Logout(rec, req)
	if rec.Code != http.StatusNoContent || rec.Body.Len() != 0 {
		t.Fatalf("expected empty 204 response, got %d: %s", rec.Code, rec.Body.String())
	}
	req = httptest.NewRequest(http.MethodPost, "/api/v1/auth/refresh", bytes.NewBufferString(`{"refresh_token":"`+authResponse.Data.RefreshToken+`"}`))
	rec = httptest.NewRecorder()
	handler.RefreshToken(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected revoked refresh token to return 401, got %d", rec.Code)
	}
}

type handlerSessionMemory struct {
	active map[string]domain.RefreshSession
}

func (s *handlerSessionMemory) Create(_ context.Context, session domain.RefreshSession) error {
	s.active[session.TokenID] = session
	return nil
}
func (s *handlerSessionMemory) Rotate(_ context.Context, tokenID string, next domain.RefreshSession) (bool, error) {
	if _, ok := s.active[tokenID]; !ok {
		return false, nil
	}
	delete(s.active, tokenID)
	s.active[next.TokenID] = next
	return true, nil
}
func (s *handlerSessionMemory) Revoke(_ context.Context, tokenID, familyID string, userID uuid.UUID) error {
	if session, ok := s.active[tokenID]; ok && session.FamilyID == familyID && session.UserID == userID {
		delete(s.active, tokenID)
	}
	return nil
}
func (s *handlerSessionMemory) RevokeFamily(_ context.Context, familyID string) error {
	for id, session := range s.active {
		if session.FamilyID == familyID {
			delete(s.active, id)
		}
	}
	return nil
}

func TestRefreshRejectsAccessToken(t *testing.T) {
	repo := &mockUserRepo{users: make(map[string]*domain.User)}
	cfg := &config.Config{
		JWTSecret:     "secret-32-character-key-for-test-12345",
		JWTAccessTTL:  15 * time.Minute,
		JWTRefreshTTL: 7 * 24 * time.Hour,
	}
	maker := token.NewMaker(cfg.JWTSecret)
	userID := uuid.New()
	repo.users["alice@enterprise.com"] = &domain.User{ID: userID, Email: "alice@enterprise.com", Role: domain.RoleTeacher}
	access, err := maker.GenerateToken(userID, "alice@enterprise.com", domain.RoleTeacher, time.Minute)
	if err != nil {
		t.Fatal(err)
	}

	_, err = service.NewAuthService(repo, maker, cfg).RefreshToken(context.Background(), access)
	if err == nil {
		t.Fatal("expected access token to be rejected as a refresh token")
	}
}

func TestGetMeReturnsCurrentUserContract(t *testing.T) {
	userID := uuid.New()
	repo := &mockUserRepo{users: map[string]*domain.User{
		"alice@enterprise.com": {ID: userID, Email: "alice@enterprise.com", Name: "Alice", Password: "do-not-return", Role: domain.RoleHomeroomTeacher},
	}}
	maker := token.NewMaker("secret-32-character-key-for-test-12345")
	accessToken, err := maker.GenerateToken(userID, "alice@enterprise.com", domain.RoleTeacher, time.Minute)
	if err != nil {
		t.Fatal(err)
	}
	router := chi.NewRouter()
	RegisterRoutes(router, Handlers{User: NewUserHandler(service.NewUserService(repo))}, maker, nil)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected /me status 200, got %d: %s", rec.Code, rec.Body.String())
	}
	var response struct {
		Data struct {
			ID          string        `json:"id"`
			Email       string        `json:"email"`
			Name        string        `json:"name"`
			Roles       []domain.Role `json:"roles"`
			Permissions []string      `json:"permissions"`
			Password    string        `json:"password"`
			Role        string        `json:"role"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &response); err != nil {
		t.Fatal(err)
	}
	if response.Data.ID != userID.String() || response.Data.Email != "alice@enterprise.com" || response.Data.Name != "Alice" {
		t.Fatalf("unexpected current user identity: %#v", response.Data)
	}
	if len(response.Data.Roles) != 1 || response.Data.Roles[0] != domain.RoleHomeroomTeacher {
		t.Fatalf("/me did not use the role currently stored in the repository: %#v", response.Data.Roles)
	}
	if len(response.Data.Permissions) == 0 || response.Data.Password != "" || response.Data.Role != "" {
		t.Fatalf("/me response missing permissions or exposing internal fields: %#v", response.Data)
	}
	if strings.Contains(rec.Body.String(), "do-not-return") {
		t.Fatal("/me response exposed password data")
	}
}

func TestRegisterAndLoginHandler(t *testing.T) {
	repo := &mockUserRepo{users: make(map[string]*domain.User)}
	cfg := &config.Config{
		JWTSecret:     "secret-32-character-key-for-test-12345",
		JWTAccessTTL:  15 * time.Minute,
		JWTRefreshTTL: 7 * 24 * time.Hour,
	}
	maker := token.NewMaker(cfg.JWTSecret)
	authSvc := service.NewAuthService(repo, maker, cfg)
	handler := NewAuthHandler(authSvc)

	// 1. Test Register
	regPayload := map[string]string{
		"name":     "Alice Test",
		"email":    "alice@enterprise.com",
		"password": "strongpassword123",
		"role":     "SUPER_ADMIN",
	}
	body, _ := json.Marshal(regPayload)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/auth/register", bytes.NewBuffer(body))
	rec := httptest.NewRecorder()

	handler.Register(rec, req)
	if rec.Code != http.StatusCreated {
		t.Fatalf("expected register status 201, got %d: %s", rec.Code, rec.Body.String())
	}
	if got := repo.users[regPayload["email"]].Role; got != domain.RoleTeacher {
		t.Fatalf("expected public registration to assign TEACHER, got %s", got)
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
	var loginResponse struct {
		Data struct {
			TokenType string `json:"token_type"`
			User      struct {
				Roles []domain.Role `json:"roles"`
			} `json:"user"`
		} `json:"data"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &loginResponse); err != nil {
		t.Fatal(err)
	}
	if loginResponse.Data.TokenType != "Bearer" || len(loginResponse.Data.User.Roles) != 1 || loginResponse.Data.User.Roles[0] != domain.RoleTeacher {
		t.Fatalf("login response does not match sanitized auth token contract: %#v", loginResponse.Data)
	}
}

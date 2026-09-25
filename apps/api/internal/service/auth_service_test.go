package service

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"io"
	"net/http"
	"strings"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/config"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/pkg/token"
	"golang.org/x/crypto/bcrypt"
)

type authUserRepo struct {
	user *domain.User
}

func (r *authUserRepo) Create(_ context.Context, user *domain.User) error {
	r.user = user
	return nil
}
func (r *authUserRepo) GetByID(_ context.Context, id uuid.UUID) (*domain.User, error) {
	if r.user == nil || r.user.ID != id {
		return nil, domain.ErrNotFound
	}
	return r.user, nil
}
func (r *authUserRepo) GetByEmail(_ context.Context, email string) (*domain.User, error) {
	if r.user == nil || r.user.Email != email {
		return nil, domain.ErrNotFound
	}
	return r.user, nil
}
func (r *authUserRepo) List(context.Context, int32, int32) ([]*domain.User, int64, error) {
	return nil, 0, nil
}
func (r *authUserRepo) Update(context.Context, *domain.User) error { return nil }
func (r *authUserRepo) Delete(context.Context, uuid.UUID) error    { return nil }

type refreshSessionMemory struct {
	active map[string]domain.RefreshSession
}

type googleKeyRoundTripper struct {
	body string
}

func (rt googleKeyRoundTripper) RoundTrip(*http.Request) (*http.Response, error) {
	return &http.Response{
		StatusCode: http.StatusOK,
		Header:     http.Header{"Cache-Control": []string{"max-age=60"}},
		Body:       io.NopCloser(strings.NewReader(rt.body)),
	}, nil
}

func (s *refreshSessionMemory) Create(_ context.Context, session domain.RefreshSession) error {
	s.active[session.TokenID] = session
	return nil
}
func (s *refreshSessionMemory) Rotate(_ context.Context, tokenID string, next domain.RefreshSession) (bool, error) {
	if _, ok := s.active[tokenID]; !ok {
		return false, nil
	}
	delete(s.active, tokenID)
	s.active[next.TokenID] = next
	return true, nil
}
func (s *refreshSessionMemory) Revoke(_ context.Context, tokenID, familyID string, userID uuid.UUID) error {
	if session, ok := s.active[tokenID]; ok && session.FamilyID == familyID && session.UserID == userID {
		delete(s.active, tokenID)
	}
	return nil
}
func (s *refreshSessionMemory) RevokeFamily(_ context.Context, familyID string) error {
	for id, session := range s.active {
		if session.FamilyID == familyID {
			delete(s.active, id)
		}
	}
	return nil
}

func googleTestToken(t *testing.T, key *rsa.PrivateKey, kid, audience string, emailVerified bool) string {
	t.Helper()
	claims := jwt.MapClaims{
		"iss":            "https://accounts.google.com",
		"aud":            audience,
		"exp":            time.Now().Add(time.Hour).Unix(),
		"iat":            time.Now().Unix(),
		"email":          "teacher@example.com",
		"email_verified": emailVerified,
		"sub":            "google-subject",
	}
	jws := jwt.NewWithClaims(jwt.SigningMethodRS256, claims)
	jws.Header["kid"] = kid
	raw, err := jws.SignedString(key)
	if err != nil {
		t.Fatal(err)
	}
	return raw
}

func googleTestService(t *testing.T, user *domain.User) (*AuthService, *rsa.PrivateKey) {
	t.Helper()
	privateKey, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	modulus := base64.RawURLEncoding.EncodeToString(privateKey.PublicKey.N.Bytes())
	exponent := base64.RawURLEncoding.EncodeToString([]byte{
		byte(privateKey.PublicKey.E >> 16),
		byte(privateKey.PublicKey.E >> 8),
		byte(privateKey.PublicKey.E),
	})
	jwks, err := json.Marshal(map[string]any{"keys": []map[string]string{{"kid": "test-key", "n": modulus, "e": exponent}}})
	if err != nil {
		t.Fatal(err)
	}
	repo := &authUserRepo{user: user}
	cfg := &config.Config{GoogleClientID: "attendly-client", JWTAccessTTL: time.Minute, JWTRefreshTTL: time.Hour}
	svc := NewAuthService(repo, token.NewMaker("secret-32-character-key-for-test-12345"), cfg, &refreshSessionMemory{active: make(map[string]domain.RefreshSession)}).(*AuthService)
	svc.httpClient = &http.Client{Transport: googleKeyRoundTripper{body: string(jwks)}}
	return svc, privateKey
}

func TestRegisterAlwaysAssignsTeacherRole(t *testing.T) {
	for _, requestedRole := range []domain.Role{domain.RoleSuperAdmin, domain.RoleHomeroomTeacher, domain.RoleTeacher} {
		t.Run(string(requestedRole), func(t *testing.T) {
			repo := &authUserRepo{}
			cfg := &config.Config{JWTAccessTTL: time.Minute, JWTRefreshTTL: time.Hour}
			svc := NewAuthService(repo, token.NewMaker("secret-32-character-key-for-test-12345"), cfg)

			result, err := svc.Register(context.Background(), "Teacher", "teacher@example.com", "strongpassword123", requestedRole)
			if err != nil {
				t.Fatal(err)
			}
			if result.User.Role != domain.RoleTeacher {
				t.Fatalf("public registration assigned %s when caller requested %s", result.User.Role, requestedRole)
			}
		})
	}
}

func TestGoogleLoginRejectsWhenClientIDIsMissing(t *testing.T) {
	repo := &authUserRepo{}
	svc := NewAuthService(repo, token.NewMaker("secret-32-character-key-for-test-12345"), &config.Config{}, &refreshSessionMemory{active: make(map[string]domain.RefreshSession)})
	if _, err := svc.LoginWithGoogle(context.Background(), "untrusted-token"); err == nil {
		t.Fatal("expected Google login to fail when client ID is not configured")
	}
	if repo.user != nil {
		t.Fatal("Google login must not create or mutate users")
	}
}

func TestGoogleLoginRejectsInvalidClaimsAndUnknownEmail(t *testing.T) {
	tests := []struct {
		name          string
		audience      string
		emailVerified bool
		user          *domain.User
	}{
		{name: "wrong audience", audience: "another-client", emailVerified: true, user: &domain.User{ID: uuid.New(), Email: "teacher@example.com", Role: domain.RoleTeacher}},
		{name: "unverified email", audience: "attendly-client", emailVerified: false, user: &domain.User{ID: uuid.New(), Email: "teacher@example.com", Role: domain.RoleTeacher}},
		{name: "unknown email", audience: "attendly-client", emailVerified: true},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			svc, key := googleTestService(t, tt.user)
			idToken := googleTestToken(t, key, "test-key", tt.audience, tt.emailVerified)
			if _, err := svc.LoginWithGoogle(context.Background(), idToken); err == nil {
				t.Fatal("expected Google login to reject token or unknown email")
			}
		})
	}
}

func TestGoogleLoginAcceptsRegisteredVerifiedUser(t *testing.T) {
	user := &domain.User{ID: uuid.New(), Email: "teacher@example.com", Name: "Teacher", Role: domain.RoleTeacher}
	svc, key := googleTestService(t, user)
	idToken := googleTestToken(t, key, "test-key", "attendly-client", true)
	tokens, err := svc.LoginWithGoogle(context.Background(), idToken)
	if err != nil {
		t.Fatalf("expected registered verified Google login to succeed: %v", err)
	}
	if tokens.User.ID != user.ID {
		t.Fatalf("expected existing user %s, got %s", user.ID, tokens.User.ID)
	}
}

func TestLogoutRevokesRefreshSession(t *testing.T) {
	password, err := bcrypt.GenerateFromPassword([]byte("strongpassword123"), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	repo := &authUserRepo{user: &domain.User{ID: uuid.New(), Email: "teacher@example.com", Name: "Teacher", Password: string(password), Role: domain.RoleTeacher}}
	sessions := &refreshSessionMemory{active: make(map[string]domain.RefreshSession)}
	maker := token.NewMaker("secret-32-character-key-for-test-12345")
	cfg := &config.Config{JWTAccessTTL: time.Minute, JWTRefreshTTL: time.Hour}
	authService := NewAuthService(repo, maker, cfg, sessions)
	login, err := authService.Login(context.Background(), repo.user.Email, "strongpassword123")
	if err != nil {
		t.Fatal(err)
	}

	if err := authService.Logout(context.Background(), login.RefreshToken); err != nil {
		t.Fatalf("logout should revoke the refresh session: %v", err)
	}
	if _, err := authService.RefreshToken(context.Background(), login.RefreshToken); err == nil {
		t.Fatal("expected logged-out refresh token to be rejected")
	}
}

func TestRefreshRejectsRevokedToken(t *testing.T) {
	password, err := bcrypt.GenerateFromPassword([]byte("strongpassword123"), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	repo := &authUserRepo{user: &domain.User{ID: uuid.New(), Email: "teacher@example.com", Name: "Teacher", Password: string(password), Role: domain.RoleTeacher}}
	sessions := &refreshSessionMemory{active: make(map[string]domain.RefreshSession)}
	maker := token.NewMaker("secret-32-character-key-for-test-12345")
	cfg := &config.Config{JWTAccessTTL: time.Minute, JWTRefreshTTL: time.Hour}
	service := NewAuthService(repo, maker, cfg, sessions)
	login, err := service.Login(context.Background(), repo.user.Email, "strongpassword123")
	if err != nil {
		t.Fatal(err)
	}

	if _, err := service.RefreshToken(context.Background(), login.RefreshToken); err != nil {
		t.Fatalf("first refresh should be accepted: %v", err)
	}
	if _, err := service.RefreshToken(context.Background(), login.RefreshToken); err == nil {
		t.Fatal("expected reused refresh token to be rejected")
	}

	if _, err := service.RefreshToken(context.Background(), ""); err == nil {
		t.Fatal("expected invalid refresh token to be rejected")
	}
	for _, session := range sessions.active {
		if session.FamilyID == uuid.Nil.String() {
			t.Fatal("unexpected session family")
		}
	}
	if len(sessions.active) != 0 {
		t.Fatal("expected reuse to revoke every session in the family")
	}
}

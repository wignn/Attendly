package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/pkg/token"
)

func TestAuthenticateRejectsRefreshToken(t *testing.T) {
	maker := token.NewMaker("secret-32-character-key-for-test-12345")
	refresh, err := maker.GenerateRefreshToken(uuid.New(), "teacher@example.com", domain.RoleTeacher, time.Minute, uuid.New())
	if err != nil {
		t.Fatal(err)
	}

	next := http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNoContent)
	})
	handler := Authenticate(maker)(next)
	req := httptest.NewRequest(http.MethodGet, "/api/v1/me", nil)
	req.Header.Set("Authorization", "Bearer "+refresh)
	rec := httptest.NewRecorder()

	handler.ServeHTTP(rec, req)
	if rec.Code != http.StatusUnauthorized {
		t.Fatalf("expected refresh token to be rejected with 401, got %d", rec.Code)
	}
}

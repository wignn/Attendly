package token

import (
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

func TestRefreshTokensCannotBeVerifiedAsAccessTokens(t *testing.T) {
	maker := NewMaker("secret-key-that-is-at-least-32-bytes-long")
	refresh, err := maker.GenerateRefreshToken(uuid.New(), "user@example.com", domain.RoleTeacher, time.Minute, uuid.New())
	if err != nil {
		t.Fatal(err)
	}
	if _, err := maker.VerifyAccessToken(refresh); err == nil {
		t.Fatal("expected refresh token to be rejected as access token")
	}
	if _, err := maker.VerifyRefreshToken(refresh); err != nil {
		t.Fatalf("expected refresh token verification to succeed: %v", err)
	}
}

package token

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

func TestVerifierRejectsDifferentHMACAlgorithm(t *testing.T) {
	maker := NewMaker("secret-key-that-is-at-least-32-bytes-long")
	claims := Claims{UserID: uuid.New(), Email: "user@example.com", Type: AccessTokenType}
	for _, algorithm := range []*jwt.SigningMethodHMAC{jwt.SigningMethodHS384, jwt.SigningMethodHS512} {
		t.Run(algorithm.Alg(), func(t *testing.T) {
			raw, err := jwt.NewWithClaims(algorithm, claims).SignedString([]byte("secret-key-that-is-at-least-32-bytes-long"))
			if err != nil {
				t.Fatal(err)
			}
			if _, err := maker.VerifyAccessToken(raw); err == nil {
				t.Fatalf("expected %s token to be rejected", algorithm.Alg())
			}
		})
	}
}

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

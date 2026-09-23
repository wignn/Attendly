package token

import (
	"testing"
	"time"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/google/uuid"
)

func TestTokenGenerationAndVerification(t *testing.T) {
	maker := NewMaker("secret-key-that-is-at-least-32-bytes-long")
	userID := uuid.New()
	email := "user@enterprise.com"
	role := domain.RoleAdmin

	tokenStr, err := maker.GenerateToken(userID, email, role, time.Minute)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	claims, err := maker.VerifyToken(tokenStr)
	if err != nil {
		t.Fatalf("failed to verify token: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected user ID %v, got %v", userID, claims.UserID)
	}
	if claims.Email != email {
		t.Errorf("expected email %s, got %s", email, claims.Email)
	}
	if claims.Role != role {
		t.Errorf("expected role %s, got %s", role, claims.Role)
	}
}

func TestExpiredToken(t *testing.T) {
	maker := NewMaker("secret-key-that-is-at-least-32-bytes-long")
	userID := uuid.New()
	email := "user@enterprise.com"
	role := domain.RoleUser

	tokenStr, err := maker.GenerateToken(userID, email, role, -time.Minute)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	claims, err := maker.VerifyToken(tokenStr)
	if err == nil || claims != nil {
		t.Fatalf("expected error for expired token, got claims: %v", claims)
	}
}

func TestInvalidSecret(t *testing.T) {
	maker1 := NewMaker("secret-key-1-at-least-32-bytes-long")
	maker2 := NewMaker("secret-key-2-at-least-32-bytes-long")
	userID := uuid.New()
	email := "user@enterprise.com"
	role := domain.RoleUser

	tokenStr, err := maker1.GenerateToken(userID, email, role, time.Minute)
	if err != nil {
		t.Fatalf("failed to generate token: %v", err)
	}

	claims, err := maker2.VerifyToken(tokenStr)
	if err == nil || claims != nil {
		t.Fatalf("expected error for invalid secret verification, got claims: %v", claims)
	}
}

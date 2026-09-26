package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type TokenClaims struct {
	UserID uuid.UUID `json:"user_id"`
	Email  string    `json:"email"`
	Role   Role      `json:"role"`
}

type AuthTokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	User         *User  `json:"user"`
}

type RefreshSession struct {
	TokenID   string
	FamilyID  string
	UserID    uuid.UUID
	ExpiresAt time.Time
}

type RefreshSessionRepository interface {
	Create(ctx context.Context, session RefreshSession) error
	Rotate(ctx context.Context, tokenID string, next RefreshSession) (bool, error)
	Revoke(ctx context.Context, tokenID, familyID string, userID uuid.UUID) error
	RevokeFamily(ctx context.Context, familyID string) error
}

type AuthService interface {
	Login(ctx context.Context, email, password string) (*AuthTokens, error)
	RefreshToken(ctx context.Context, refreshToken string) (*AuthTokens, error)
	Logout(ctx context.Context, refreshToken string) error
	LoginWithGoogle(ctx context.Context, idToken string) (*AuthTokens, error)
}

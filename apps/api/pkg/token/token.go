package token

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

var (
	ErrInvalidToken = errors.New("token is invalid or expired")
)

type Claims struct {
	UserID uuid.UUID   `json:"user_id"`
	Email  string      `json:"email"`
	Role   domain.Role `json:"role"`
	Type   string      `json:"type"`
	jwt.RegisteredClaims
}

const (
	AccessTokenType  = "access"
	RefreshTokenType = "refresh"
)

type Maker struct {
	secretKey string
}

func NewMaker(secretKey string) *Maker {
	return &Maker{secretKey: secretKey}
}

func (m *Maker) GenerateToken(userID uuid.UUID, email string, role domain.Role, duration time.Duration) (string, error) {
	return m.generateToken(userID, email, role, duration, AccessTokenType, "")
}

func (m *Maker) GenerateRefreshToken(userID uuid.UUID, email string, role domain.Role, duration time.Duration, familyID uuid.UUID) (string, error) {
	return m.generateToken(userID, email, role, duration, RefreshTokenType, familyID.String())
}

func (m *Maker) generateToken(userID uuid.UUID, email string, role domain.Role, duration time.Duration, tokenType, familyID string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		Type:   tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.New().String(),
			Audience:  []string{tokenType},
			Issuer:    familyID,
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(m.secretKey))
}

func (m *Maker) VerifyToken(tokenString string) (*Claims, error) {
	return m.verifyToken(tokenString, "")
}

func (m *Maker) VerifyAccessToken(tokenString string) (*Claims, error) {
	return m.verifyToken(tokenString, AccessTokenType)
}

func (m *Maker) VerifyRefreshToken(tokenString string) (*Claims, error) {
	return m.verifyToken(tokenString, RefreshTokenType)
}

func (m *Maker) verifyToken(tokenString, expectedType string) (*Claims, error) {
	keyFunc := func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(m.secretKey), nil
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, keyFunc)
	if err != nil {
		return nil, ErrInvalidToken
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid || (expectedType != "" && claims.Type != expectedType) {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

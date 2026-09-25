package service

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"math/big"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/config"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/pkg/token"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo         domain.UserRepository
	tokenMaker       *token.Maker
	cfg              *config.Config
	sessions         domain.RefreshSessionRepository
	googleMu         sync.RWMutex
	googleKeys       map[string]*rsa.PublicKey
	googleKeysExpiry time.Time
	httpClient       *http.Client
}

func NewAuthService(
	userRepo domain.UserRepository,
	tokenMaker *token.Maker,
	cfg *config.Config,
	sessions ...domain.RefreshSessionRepository,
) domain.AuthService {
	var sessionRepo domain.RefreshSessionRepository
	if len(sessions) > 0 {
		sessionRepo = sessions[0]
	}
	return &AuthService{
		userRepo:   userRepo,
		tokenMaker: tokenMaker,
		cfg:        cfg,
		sessions:   sessionRepo,
		googleKeys: make(map[string]*rsa.PublicKey),
		httpClient: &http.Client{Timeout: 5 * time.Second},
	}
}

func (s *AuthService) Register(ctx context.Context, name, email, password string, _ domain.Role) (*domain.AuthTokens, error) {
	existing, _ := s.userRepo.GetByEmail(ctx, email)
	if existing != nil {
		return nil, domain.ErrConflict
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	user := &domain.User{
		ID:        uuid.New(),
		Email:     email,
		Password:  string(hashedPassword),
		Name:      name,
		Role:      domain.RoleTeacher,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	return s.issueTokens(ctx, user, uuid.New())
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*domain.AuthTokens, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	return s.issueTokens(ctx, user, uuid.New())
}

func (s *AuthService) issueTokens(ctx context.Context, user *domain.User, familyID uuid.UUID) (*domain.AuthTokens, error) {
	accessToken, err := s.tokenMaker.GenerateToken(user.ID, user.Email, user.Role, s.cfg.JWTAccessTTL)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.tokenMaker.GenerateRefreshToken(user.ID, user.Email, user.Role, s.cfg.JWTRefreshTTL, familyID)
	if err != nil {
		return nil, err
	}
	claims, err := s.tokenMaker.VerifyRefreshToken(refreshToken)
	if err != nil {
		return nil, err
	}
	if s.sessions != nil {
		if err := s.sessions.Create(ctx, domain.RefreshSession{
			TokenID: claims.ID, FamilyID: familyID.String(), UserID: user.ID, ExpiresAt: claims.ExpiresAt.Time,
		}); err != nil {
			return nil, err
		}
	}

	return &domain.AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.cfg.JWTAccessTTL.Seconds()),
		User:         user,
	}, nil
}

func (s *AuthService) Logout(ctx context.Context, refreshToken string) error {
	claims, err := s.tokenMaker.VerifyRefreshToken(refreshToken)
	if err != nil || s.sessions == nil {
		return domain.ErrUnauthorized
	}
	familyID, err := uuid.Parse(claims.Issuer)
	if err != nil {
		return domain.ErrUnauthorized
	}
	return s.sessions.Revoke(ctx, claims.ID, familyID.String(), claims.UserID)
}

func (s *AuthService) LoginWithGoogle(ctx context.Context, idToken string) (*domain.AuthTokens, error) {
	if strings.TrimSpace(s.cfg.GoogleClientID) == "" {
		return nil, domain.ErrUnauthorized
	}
	claims, err := s.verifyGoogleIDToken(ctx, idToken)
	if err != nil || !claims.EmailVerified || claims.Email == "" {
		return nil, domain.ErrUnauthorized
	}
	user, err := s.userRepo.GetByEmail(ctx, claims.Email)
	if err != nil {
		return nil, domain.ErrInvalidCredentials
	}
	return s.issueTokens(ctx, user, uuid.New())
}

type googleIDClaims struct {
	Email         string `json:"email"`
	EmailVerified bool   `json:"email_verified"`
	jwt.RegisteredClaims
}

type googleJWKSet struct {
	Keys []struct {
		KID string `json:"kid"`
		N   string `json:"n"`
		E   string `json:"e"`
	} `json:"keys"`
}

func (s *AuthService) verifyGoogleIDToken(ctx context.Context, rawToken string) (*googleIDClaims, error) {
	claims := &googleIDClaims{}
	parsed, err := jwt.ParseWithClaims(rawToken, claims, func(parsed *jwt.Token) (any, error) {
		if parsed.Method.Alg() != jwt.SigningMethodRS256.Alg() {
			return nil, errors.New("unexpected Google signing algorithm")
		}
		kid, _ := parsed.Header["kid"].(string)
		if kid == "" {
			return nil, errors.New("missing Google key ID")
		}
		key, err := s.googleSigningKey(ctx, kid)
		if err != nil {
			return nil, err
		}
		return key, nil
	}, jwt.WithAudience(s.cfg.GoogleClientID), jwt.WithExpirationRequired())
	if err != nil || !parsed.Valid || (claims.Issuer != "https://accounts.google.com" && claims.Issuer != "accounts.google.com") {
		return nil, domain.ErrUnauthorized
	}
	return claims, nil
}

func (s *AuthService) googleSigningKey(ctx context.Context, kid string) (*rsa.PublicKey, error) {
	s.googleMu.RLock()
	key, ok := s.googleKeys[kid]
	valid := time.Now().Before(s.googleKeysExpiry)
	s.googleMu.RUnlock()
	if ok && valid {
		return key, nil
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://www.googleapis.com/oauth2/v3/certs", nil)
	if err != nil {
		return nil, err
	}
	res, err := s.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, domain.ErrUnauthorized
	}
	var set googleJWKSet
	if err := json.NewDecoder(res.Body).Decode(&set); err != nil {
		return nil, err
	}
	keys := make(map[string]*rsa.PublicKey, len(set.Keys))
	for _, jwk := range set.Keys {
		if jwk.KID == "" || jwk.N == "" || jwk.E == "" {
			continue
		}
		key, err := parseGoogleRSAKey(jwk.N, jwk.E)
		if err != nil {
			continue
		}
		keys[jwk.KID] = key
	}
	cacheFor := 10 * time.Minute
	if value := res.Header.Get("Cache-Control"); value != "" {
		for _, directive := range strings.Split(value, ",") {
			parts := strings.SplitN(strings.TrimSpace(directive), "=", 2)
			if len(parts) == 2 && parts[0] == "max-age" {
				if seconds, err := strconv.Atoi(parts[1]); err == nil && seconds > 0 {
					cacheFor = time.Duration(seconds) * time.Second
				}
			}
		}
	}
	s.googleMu.Lock()
	s.googleKeys = keys
	s.googleKeysExpiry = time.Now().Add(cacheFor)
	key = keys[kid]
	s.googleMu.Unlock()
	if key == nil {
		return nil, domain.ErrUnauthorized
	}
	return key, nil
}

func parseGoogleRSAKey(modulus, exponent string) (*rsa.PublicKey, error) {
	nBytes, err := decodeBase64URL(modulus)
	if err != nil {
		return nil, err
	}
	eBytes, err := decodeBase64URL(exponent)
	if err != nil || len(eBytes) == 0 || len(eBytes) > 4 {
		return nil, errors.New("invalid Google RSA exponent")
	}
	exponentValue := 0
	for _, b := range eBytes {
		exponentValue = exponentValue<<8 | int(b)
	}
	if exponentValue < 3 {
		return nil, errors.New("invalid Google RSA exponent")
	}
	return &rsa.PublicKey{N: new(big.Int).SetBytes(nBytes), E: exponentValue}, nil
}

func decodeBase64URL(value string) ([]byte, error) {
	return base64.RawURLEncoding.DecodeString(value)
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthTokens, error) {
	claims, err := s.tokenMaker.VerifyRefreshToken(refreshToken)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}
	if s.sessions == nil {
		return nil, domain.ErrUnauthorized
	}

	familyID, err := uuid.Parse(claims.Issuer)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}

	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, domain.ErrUnauthorized
	}

	accessToken, err := s.tokenMaker.GenerateToken(user.ID, user.Email, user.Role, s.cfg.JWTAccessTTL)
	if err != nil {
		return nil, err
	}
	newRefreshToken, err := s.tokenMaker.GenerateRefreshToken(user.ID, user.Email, user.Role, s.cfg.JWTRefreshTTL, familyID)
	if err != nil {
		return nil, err
	}
	newClaims, err := s.tokenMaker.VerifyRefreshToken(newRefreshToken)
	if err != nil {
		return nil, err
	}

	rotated, err := s.sessions.Rotate(ctx, claims.ID, domain.RefreshSession{
		TokenID: newClaims.ID, FamilyID: familyID.String(), UserID: user.ID, ExpiresAt: newClaims.ExpiresAt.Time,
	})
	if err != nil {
		return nil, err
	}
	if !rotated {
		if err := s.sessions.RevokeFamily(ctx, familyID.String()); err != nil {
			return nil, err
		}
		return nil, domain.ErrUnauthorized
	}

	return &domain.AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    int64(s.cfg.JWTAccessTTL.Seconds()),
		User:         user,
	}, nil
}

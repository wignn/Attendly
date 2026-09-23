package service

import (
	"context"
	"time"

	"github.com/wignn/komas-api/internal/config"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/pkg/token"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	userRepo   domain.UserRepository
	tokenMaker *token.Maker
	cfg        *config.Config
}

func NewAuthService(
	userRepo domain.UserRepository,
	tokenMaker *token.Maker,
	cfg *config.Config,
) domain.AuthService {
	return &AuthService{
		userRepo:   userRepo,
		tokenMaker: tokenMaker,
		cfg:        cfg,
	}
}

func (s *AuthService) Register(ctx context.Context, name, email, password string, role domain.Role) (*domain.AuthTokens, error) {
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
		Role:      role,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.userRepo.Create(ctx, user); err != nil {
		return nil, err
	}

	accessToken, err := s.tokenMaker.GenerateToken(user.ID, user.Email, user.Role, s.cfg.JWTAccessTTL)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.tokenMaker.GenerateToken(user.ID, user.Email, user.Role, s.cfg.JWTRefreshTTL)
	if err != nil {
		return nil, err
	}

	return &domain.AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.cfg.JWTAccessTTL.Seconds()),
		User:         user,
	}, nil
}

func (s *AuthService) Login(ctx context.Context, email, password string) (*domain.AuthTokens, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, domain.ErrInvalidCredentials
	}

	accessToken, err := s.tokenMaker.GenerateToken(user.ID, user.Email, user.Role, s.cfg.JWTAccessTTL)
	if err != nil {
		return nil, err
	}

	refreshToken, err := s.tokenMaker.GenerateToken(user.ID, user.Email, user.Role, s.cfg.JWTRefreshTTL)
	if err != nil {
		return nil, err
	}

	return &domain.AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.cfg.JWTAccessTTL.Seconds()),
		User:         user,
	}, nil
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthTokens, error) {
	claims, err := s.tokenMaker.VerifyToken(refreshToken)
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

	newRefreshToken, err := s.tokenMaker.GenerateToken(user.ID, user.Email, user.Role, s.cfg.JWTRefreshTTL)
	if err != nil {
		return nil, err
	}

	return &domain.AuthTokens{
		AccessToken:  accessToken,
		RefreshToken: newRefreshToken,
		ExpiresIn:    int64(s.cfg.JWTAccessTTL.Seconds()),
		User:         user,
	}, nil
}

package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/pkg/response"
	"github.com/wignn/komas-api/pkg/token"
)

type contextKey string

const UserContextKey contextKey = "user_claims"
const AuthenticatedUserContextKey contextKey = "authenticated_user"

func Authenticate(maker *token.Maker, repository domain.UserRepository) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing authorization header", nil)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid authorization header format", nil)
				return
			}

			claims, err := maker.VerifyAccessToken(parts[1])
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired token", nil)
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims)
			if repository == nil {
				response.Error(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Authentication user repository is unavailable", nil)
				return
			}
			user, err := repository.GetByID(r.Context(), claims.UserID)
			if err != nil || user == nil || !user.IsActive {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or inactive account", nil)
				return
			}
			ctx = context.WithValue(ctx, AuthenticatedUserContextKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserClaims(ctx context.Context) *token.Claims {
	claims, ok := ctx.Value(UserContextKey).(*token.Claims)
	if !ok {
		return nil
	}
	return claims
}

func GetAuthenticatedUser(ctx context.Context) *domain.User {
	user, ok := ctx.Value(AuthenticatedUserContextKey).(*domain.User)
	if !ok {
		return nil
	}
	return user
}

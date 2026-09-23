package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/wignn/komas-api/pkg/response"
	"github.com/wignn/komas-api/pkg/token"
)

type contextKey string

const UserContextKey contextKey = "user_claims"

func Authenticate(maker *token.Maker) func(http.Handler) http.Handler {
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

			claims, err := maker.VerifyToken(parts[1])
			if err != nil {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Invalid or expired token", nil)
				return
			}

			ctx := context.WithValue(r.Context(), UserContextKey, claims)
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

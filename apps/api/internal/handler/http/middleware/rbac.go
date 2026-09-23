package middleware

import (
	"net/http"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/pkg/response"
)

func RequireRole(allowedRoles ...domain.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims := GetUserClaims(r.Context())
			if claims == nil {
				response.Error(w, http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized", nil)
				return
			}

			for _, role := range allowedRoles {
				if claims.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}

			response.Error(w, http.StatusForbidden, "FORBIDDEN", "You do not have permission to access this resource", nil)
		})
	}
}

package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/wignn/komas-api/internal/repository/redis"
	"github.com/wignn/komas-api/pkg/response"
)

// RateLimit creates a middleware that restricts requests based on IP and URL path.
func RateLimit(client *redis.Client, limit int64, window time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if client == nil {
				next.ServeHTTP(w, r)
				return
			}

			ip := r.RemoteAddr
			key := fmt.Sprintf("rl:%s:%s", r.URL.Path, ip)

			allowed, err := client.Allow(r.Context(), key, limit, window)
			if err != nil {
				// Fail open on Redis error so auth is not completely blocked
				next.ServeHTTP(w, r)
				return
			}

			if !allowed {
				response.Error(w, http.StatusTooManyRequests, "RATE_LIMIT_EXCEEDED", "Too many requests. Please try again later.", nil)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

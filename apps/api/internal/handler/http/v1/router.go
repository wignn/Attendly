package v1

import (
	"time"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/repository/redis"
	"github.com/wignn/komas-api/pkg/token"
	"github.com/go-chi/chi/v5"
)

type Handlers struct {
	Auth *AuthHandler
	User *UserHandler
}

func RegisterRoutes(
	r chi.Router,
	h Handlers,
	tokenMaker *token.Maker,
	redisClient *redis.Client,
) {
	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			if redisClient != nil {
				r.Use(middleware.RateLimit(redisClient, 15, time.Minute))
			}
			r.Post("/register", h.Auth.Register)
			r.Post("/login", h.Auth.Login)
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticate(tokenMaker))

			r.Get("/users/me", h.User.GetMe)
			r.With(middleware.RequireRole(domain.RoleAdmin)).Get("/users", h.User.ListUsers)
		})
	})
}

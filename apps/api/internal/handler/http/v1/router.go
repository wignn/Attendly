package v1

import (
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/pkg/token"
	"github.com/go-chi/chi/v5"
)

type Handlers struct {
	Auth       *AuthHandler
	User       *UserHandler
	Academic   *AcademicHandler
	Attendance *AttendanceHandler
}

func RegisterRoutes(
	r chi.Router,
	h Handlers,
	tokenMaker *token.Maker,
) {
	staff := []domain.Role{domain.RoleAdmin, domain.RoleTeacher}

	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			r.Post("/register", h.Auth.Register)
			r.Post("/login", h.Auth.Login)
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticate(tokenMaker))

			r.Get("/users/me", h.User.GetMe)
			r.With(middleware.RequireRole(domain.RoleAdmin)).Get("/users", h.User.ListUsers)
			r.Route("/classes", func(r chi.Router) {
				r.Get("/", h.Academic.ListClasses)
				r.Get("/{classID}", h.Academic.GetClass)
				r.Get("/{classID}/subjects", h.Academic.ListClassSubjects)

				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole(domain.RoleAdmin))
					r.Post("/", h.Academic.CreateClass)
					r.Delete("/{classID}", h.Academic.DeleteClass)
				})
			})

			r.Route("/subjects", func(r chi.Router) {
				r.Get("/", h.Academic.ListSubjects)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole(domain.RoleAdmin))
					r.Post("/", h.Academic.CreateSubject)
					r.Delete("/{subjectID}", h.Academic.DeleteSubject)
				})
			})

			r.Route("/students", func(r chi.Router) {
				r.Get("/", h.Academic.ListStudents)
				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole(staff...))
					r.Post("/", h.Academic.CreateStudent)
					r.Delete("/{studentID}", h.Academic.DeleteStudent)
				})
			})

			r.Route("/class-subjects", func(r chi.Router) {
				r.Get("/", h.Academic.ListClassSubjects)
				r.With(middleware.RequireRole(domain.RoleAdmin)).Post("/", h.Academic.AssignSubject)
				r.With(middleware.RequireRole(domain.RoleAdmin)).Delete("/{classSubjectID}", h.Academic.UnassignSubject)
				r.Get("/{classSubjectID}/attendance/summary", h.Attendance.Summary)
				r.Get("/{classSubjectID}/sessions", h.Attendance.ListSessions)
			})
			r.Route("/attendance/sessions", func(r chi.Router) {
				r.Get("/{sessionID}", h.Attendance.GetSession)

				r.Group(func(r chi.Router) {
					r.Use(middleware.RequireRole(staff...))
					r.Post("/", h.Attendance.CreateSession)
					r.Post("/{sessionID}/records", h.Attendance.MarkAttendance)
					r.Delete("/{sessionID}", h.Attendance.DeleteSession)
				})
			})
		})
	})
}

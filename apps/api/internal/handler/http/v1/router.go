package v1

import (
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	"github.com/wignn/komas-api/internal/repository/redis"
	"github.com/wignn/komas-api/pkg/token"
)

type Handlers struct {
	Auth              *AuthHandler
	User              *UserHandler
	Attendance        *AttendanceReportHandler
	Assignments       *TeachingAssignmentHandler
	Schedules         *ScheduleHandler
	Student           *StudentHandler
	AttendanceSession *AttendanceSessionHandler
	Subject           *SubjectHandler
	AcademicYear      *AcademicYearHandler
	Teacher           *TeacherHandler
	Class             *ClassHandler
	ExportAudit       *ExportAuditHandler
}

func RegisterRoutes(r chi.Router, h Handlers, tokenMaker *token.Maker, redisClient *redis.Client, userRepository domain.UserRepository) {
	r.Route("/api/v1", func(r chi.Router) {
		r.Route("/auth", func(r chi.Router) {
			if redisClient != nil {
				r.Use(middleware.RateLimit(redisClient, 15, time.Minute))
			}
			r.Post("/login", h.Auth.Login)
			r.Post("/google", h.Auth.LoginWithGoogle)
			r.Post("/refresh", h.Auth.RefreshToken)
			r.Post("/logout", h.Auth.Logout)
		})

		r.Group(func(r chi.Router) {
			r.Use(middleware.Authenticate(tokenMaker, userRepository))
			r.Get("/me", h.User.GetMe)
			r.Get("/users/me", h.User.GetMe)
			r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Get("/users", h.User.ListUsers)
			if h.Teacher != nil {
				r.Get("/teachers", h.Teacher.List)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Post("/teachers", h.Teacher.Create)
				r.Get("/teachers/{teacher_id}", h.Teacher.Get)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Patch("/teachers/{teacher_id}", h.Teacher.Update)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Delete("/teachers/{teacher_id}", h.Teacher.Delete)
			}
			if h.Class != nil {
				r.Get("/classes", h.Class.List)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Post("/classes", h.Class.Create)
				r.Get("/classes/{class_id}", h.Class.Get)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Patch("/classes/{class_id}", h.Class.Update)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Delete("/classes/{class_id}", h.Class.Delete)
				r.Get("/classes/{class_id}/students", h.Class.ListStudents)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Post("/classes/{class_id}/students", h.Class.AddStudent)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Delete("/classes/{class_id}/students/{student_id}", h.Class.RemoveStudent)
			}
			if h.Assignments != nil {
				r.Get("/teaching-assignments", h.Assignments.List)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Post("/teaching-assignments", h.Assignments.Create)
				r.Get("/teaching-assignments/{assignment_id}", h.Assignments.Get)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Patch("/teaching-assignments/{assignment_id}", h.Assignments.Update)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Delete("/teaching-assignments/{assignment_id}", h.Assignments.Delete)
				r.Get("/teachers/{teacher_id}/assignments", h.Assignments.ListForTeacher)
			}
			if h.Schedules != nil {
				r.Get("/schedules/today", h.Schedules.Today)
				r.Get("/schedules", h.Schedules.List)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Post("/schedules", h.Schedules.Create)
				r.Get("/schedules/{schedule_id}", h.Schedules.Get)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Patch("/schedules/{schedule_id}", h.Schedules.Update)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Delete("/schedules/{schedule_id}", h.Schedules.Delete)
			}
			if h.Student != nil {
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Get("/students", h.Student.List)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Post("/students", h.Student.Create)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Get("/students/{student_id}", h.Student.Get)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Patch("/students/{student_id}", h.Student.Update)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Delete("/students/{student_id}", h.Student.Delete)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Get("/students/{student_id}/enrollments", h.Student.Enrollments)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Post("/students/{student_id}/enrollments", h.Student.Transfer)
			}
			if h.Subject != nil {
				r.Get("/subjects", h.Subject.List)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Post("/subjects", h.Subject.Create)
				r.Get("/subjects/{id}", h.Subject.Get)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Patch("/subjects/{id}", h.Subject.Update)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Delete("/subjects/{id}", h.Subject.Delete)
			}
			if h.AcademicYear != nil {
				r.Get("/academic-years", h.AcademicYear.List)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Post("/academic-years", h.AcademicYear.Create)
				r.Get("/academic-years/{id}", h.AcademicYear.Get)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Patch("/academic-years/{id}", h.AcademicYear.Update)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Delete("/academic-years/{id}", h.AcademicYear.Delete)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Post("/academic-years/{id}/activate", h.AcademicYear.Activate)
			}
			if h.AttendanceSession != nil {
				r.Get("/attendance-sessions", h.AttendanceSession.List)
				r.Post("/attendance-sessions", h.AttendanceSession.CreateOrGet)
				r.Get("/attendance-sessions/{id}", h.AttendanceSession.Get)
				r.Put("/attendance-sessions/{id}/records", h.AttendanceSession.UpdateRecords)
				r.Post("/attendance-sessions/{id}/submit", h.AttendanceSession.Submit)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Post("/attendance-sessions/{id}/reopen", h.AttendanceSession.Reopen)
			}
			if h.ExportAudit != nil {
				r.Post("/exports/attendance", h.ExportAudit.CreateExport)
				r.Get("/exports/{job_id}", h.ExportAudit.GetExportJob)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Get("/audit-logs", h.ExportAudit.ListAuditLogs)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Get("/audit-logs/{audit_log_id}", h.ExportAudit.GetAuditLog)
			}
			if h.Attendance != nil {
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Get("/admin/dashboard", h.Attendance.AdminDashboard)
				r.With(middleware.RequireRole(domain.RoleSuperAdmin)).Get("/admin/activities", h.Attendance.Activities)
				r.With(middleware.RequireRole(domain.RoleTeacher)).Get("/teachers/me/dashboard", h.Attendance.TeacherDashboard)
				r.With(middleware.RequireRole(domain.RoleHomeroomTeacher)).Get("/teachers/me/homeroom-dashboard", h.Attendance.HomeroomDashboard)
				r.Get("/students/{student_id}/attendance-summary", h.Attendance.StudentSummary)
				r.Get("/reports/subject-attendance", h.Attendance.SubjectAttendance)
				r.Get("/reports/classes/{class_id}/attendance", h.Attendance.ClassAttendance)
				r.With(middleware.RequireRole(domain.RoleHomeroomTeacher)).Get("/reports/homeroom/{class_id}", h.Attendance.HomeroomReport)
			}
		})
	})
}

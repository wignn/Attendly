package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	httpSwagger "github.com/swaggo/http-swagger"
	"github.com/wignn/komas-api/docs"
	"github.com/wignn/komas-api/internal/config"
	"github.com/wignn/komas-api/internal/domain"
	"github.com/wignn/komas-api/internal/handler/http/middleware"
	v1 "github.com/wignn/komas-api/internal/handler/http/v1"
	"github.com/wignn/komas-api/internal/repository/postgres"
	"github.com/wignn/komas-api/internal/repository/redis"
	"github.com/wignn/komas-api/internal/service"
	"github.com/wignn/komas-api/pkg/logger"
	"github.com/wignn/komas-api/pkg/token"
)

func main() {
	cfg := config.Load()
	appLogger := logger.New(cfg.Env)

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	dbPool, err := postgres.NewPool(ctx, cfg.DatabaseURL)
	if err != nil {
		appLogger.Warn("Database connection failed (running in offline mode)", "error", err)
	} else {
		defer dbPool.Close()
		appLogger.Info("PostgreSQL connection pool established")
	}

	redisClient, err := redis.New(cfg.RedisURL, cfg.RedisAddr, cfg.RedisPass)
	if err != nil {
		appLogger.Warn("Redis connection failed (rate limiting / caching running in fallback mode)", "error", err)
	} else {
		defer redisClient.Close()
		appLogger.Info("Redis client connected")
	}

	tokenMaker := token.NewMaker(cfg.JWTSecret)
	userRepo := postgres.NewUserRepo(dbPool)
	var refreshSessionRepo domain.RefreshSessionRepository
	if dbPool != nil {
		refreshSessionRepo = postgres.NewRefreshSessionRepo(dbPool)
	}

	authService := service.NewAuthService(userRepo, tokenMaker, cfg, refreshSessionRepo)
	userService := service.NewUserService(userRepo)
	reportService := service.NewAttendanceReportService(postgres.NewAttendanceReportRepo(dbPool))
	assignmentService := service.NewTeachingAssignmentService(postgres.NewTeachingAssignmentRepo(dbPool))
	scheduleService := service.NewScheduleService(postgres.NewScheduleRepo(dbPool))
	studentService := service.NewStudentService(postgres.NewStudentRepo(dbPool))
	attendanceSessionService := service.NewAttendanceSessionService(postgres.NewAttendanceSessionRepo(dbPool))
	subjectService := service.NewSubjectService(postgres.NewSubjectRepo(dbPool))
	academicYearService := service.NewAcademicYearService(postgres.NewAcademicYearRepo(dbPool))
	teacherService := service.NewTeacherService(postgres.NewTeacherRepo(dbPool))
	classService := service.NewClassService(postgres.NewClassRepo(dbPool))
	exportAuditService := service.NewExportAuditService(postgres.NewExportAuditRepo(dbPool))

	handlers := v1.Handlers{
		Auth:              v1.NewAuthHandler(authService),
		User:              v1.NewUserHandler(userService),
		Attendance:        v1.NewAttendanceReportHandler(reportService),
		Assignments:       v1.NewTeachingAssignmentHandler(assignmentService),
		Schedules:         v1.NewScheduleHandler(scheduleService),
		Student:           v1.NewStudentHandler(studentService),
		AttendanceSession: v1.NewAttendanceSessionHandler(attendanceSessionService),
		Subject:           v1.NewSubjectHandler(subjectService),
		AcademicYear:      v1.NewAcademicYearHandler(academicYearService),
		Teacher:           v1.NewTeacherHandler(teacherService),
		Class:             v1.NewClassHandler(classService),
		ExportAudit:       v1.NewExportAuditHandler(exportAuditService),
	}
	healthHandler := v1.NewHealthHandler()

	r := chi.NewRouter()
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(chimw.Recoverer)
	r.Use(middleware.StructuredLogger(appLogger))
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000", "http://localhost:8080", "https://attendly-api-three.vercel.app", "https://attendly-web-six.vercel.app", "*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))
	r.Get("/healthz", healthHandler.HealthCheck)
	r.Get("/swagger/openapi.yaml", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/yaml; charset=utf-8")
		_, _ = w.Write(docs.OpenAPI)
	})
	r.Get("/swagger/*", httpSwagger.Handler(httpSwagger.URL("/swagger/openapi.yaml")))
	r.Get("/redoc", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		_, _ = w.Write([]byte(`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>AbsenKu API Reference</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><redoc spec-url="/swagger/openapi.yaml"></redoc><script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script></body></html>`))
	})
	v1.RegisterRoutes(r, handlers, tokenMaker, redisClient, userRepo)

	server := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		appLogger.Info(fmt.Sprintf("Server started on port %s", cfg.Port))
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			appLogger.Error("Server error", "error", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	appLogger.Info("Shutting down server gracefully...")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		appLogger.Error("Server forced to shutdown", "error", err)
	}

	appLogger.Info("Server stopped cleanly")
}
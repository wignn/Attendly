package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/config"
)

func findSeedFile(customPath string) (string, error) {
	if customPath != "" {
		if _, err := os.Stat(customPath); err == nil {
			return customPath, nil
		}
		return "", fmt.Errorf("seed file not found at %s", customPath)
	}

	candidates := []string{
		"db/seeds/comprehensive_seed.sql",
		"apps/api/db/seeds/comprehensive_seed.sql",
		"db/seeds/seed.sql",
		"../apps/api/db/seeds/comprehensive_seed.sql",
	}

	for _, p := range candidates {
		if _, err := os.Stat(p); err == nil {
			return p, nil
		}
	}

	// Try relative to executable or working directory search
	cwd, err := os.Getwd()
	if err == nil {
		for dir := cwd; ; dir = filepath.Dir(dir) {
			target := filepath.Join(dir, "apps", "api", "db", "seeds", "comprehensive_seed.sql")
			if _, err := os.Stat(target); err == nil {
				return target, nil
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
		}
	}

	return "", fmt.Errorf("could not find comprehensive_seed.sql in default search paths")
}

func main() {
	var customPath string
	if len(os.Args) > 1 {
		customPath = os.Args[1]
	}

	seedPath, err := findSeedFile(customPath)
	if err != nil {
		log.Fatalf("failed to locate seed file: %v", err)
	}

	sqlContent, err := os.ReadFile(seedPath)
	if err != nil {
		log.Fatalf("failed to read seed file %s: %v", seedPath, err)
	}

	cfg := config.Load()
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	pool, err := pgxpool.New(ctx, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer pool.Close()

	if err := pool.Ping(ctx); err != nil {
		log.Fatalf("database ping failed: %v", err)
	}

	fmt.Printf("Applying seed data from %s...\n", seedPath)
	if _, err := pool.Exec(ctx, string(sqlContent)); err != nil {
		log.Fatalf("failed to execute seed script: %v", err)
	}

	// Fetch summary stats
	var (
		usersCount       int64
		teachersCount    int64
		classesCount     int64
		subjectsCount    int64
		studentsCount    int64
		schedulesCount   int64
		sessionsCount    int64
		recordsCount     int64
		auditEventsCount int64
	)

	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM users").Scan(&usersCount)
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM teachers").Scan(&teachersCount)
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM classes").Scan(&classesCount)
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM subjects").Scan(&subjectsCount)
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM students").Scan(&studentsCount)
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM class_schedules").Scan(&schedulesCount)
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM attendance_sessions").Scan(&sessionsCount)
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM attendance_records").Scan(&recordsCount)
	_ = pool.QueryRow(ctx, "SELECT COUNT(*) FROM audit_events").Scan(&auditEventsCount)

	fmt.Println("Seed data applied successfully!")
	fmt.Println("-------------------------------------------")
	fmt.Printf("Users              : %d\n", usersCount)
	fmt.Printf("Teachers           : %d\n", teachersCount)
	fmt.Printf("Classes            : %d\n", classesCount)
	fmt.Printf("Subjects           : %d\n", subjectsCount)
	fmt.Printf("Students           : %d\n", studentsCount)
	fmt.Printf("Class Schedules    : %d\n", schedulesCount)
	fmt.Printf("Attendance Sessions: %d\n", sessionsCount)
	fmt.Printf("Attendance Records : %d\n", recordsCount)
	fmt.Printf("Audit Events       : %d\n", auditEventsCount)
	fmt.Println("-------------------------------------------")
}

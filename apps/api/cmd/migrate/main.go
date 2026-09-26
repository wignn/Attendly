package main

import (
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	"github.com/wignn/komas-api/internal/config"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run cmd/migrate/main.go [up|down|version]")
	}

	cfg := config.Load()
	m, err := migrate.New("file://db/migrations", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to init migrate: %v", err)
	}
	defer m.Close()

	cmd := os.Args[1]
	switch cmd {
	case "up":
		if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			log.Fatalf("migrate up failed: %v", err)
		}
		fmt.Println("Migrations applied successfully!")
	case "down":
		if err := m.Down(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
			log.Fatalf("migrate down failed: %v", err)
		}
		fmt.Println("Migrations rolled back successfully!")
	case "version":
		v, dirty, err := m.Version()
		if err != nil {
			log.Fatalf("get version failed: %v", err)
		}
		fmt.Printf("Version: %d, Dirty: %t\n", v, dirty)
	case "force":
		if len(os.Args) < 3 {
			log.Fatal("Usage: go run cmd/migrate/main.go force <version>")
		}
		v, err := strconv.Atoi(os.Args[2])
		if err != nil {
			log.Fatalf("invalid version: %v", err)
		}
		if err := m.Force(v); err != nil {
			log.Fatalf("force failed: %v", err)
		}
		fmt.Printf("Forced version to %d\n", v)
	default:
		log.Fatalf("unknown command: %s", cmd)
	}
}

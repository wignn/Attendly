package config

import (
	"os"
	"testing"
)

func TestConfigLoad(t *testing.T) {
	t.Setenv("PORT", "9090")
	t.Setenv("SUPER_ADMIN_EMAIL", "  ADMIN@school.example ")

	cfg := Load()
	if cfg.Port != "9090" {
		t.Errorf("expected PORT=9090, got %s", cfg.Port)
	}
	if cfg.AppName != "komas-api" {
		t.Errorf("expected AppName=komas-api, got %s", cfg.AppName)
	}
	if cfg.SuperAdminEmail != "admin@school.example" {
		t.Errorf("expected normalized SUPER_ADMIN_EMAIL, got %q", cfg.SuperAdminEmail)
	}
}

func TestLoadEnvFilePopulatesUnsetEnvironment(t *testing.T) {
	envFile := t.TempDir() + "/.env"
	if err := os.WriteFile(envFile, []byte("DATABASE_URL=postgres://env-file/db\n"), 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("DATABASE_URL", "temporary")
	if err := os.Unsetenv("DATABASE_URL"); err != nil {
		t.Fatal(err)
	}
	if err := loadEnvFile(envFile); err != nil {
		t.Fatal(err)
	}
	if got := os.Getenv("DATABASE_URL"); got != "postgres://env-file/db" {
		t.Fatalf("expected DATABASE_URL from env file, got %q", got)
	}
}

func TestLoadLoadsProjectEnvFile(t *testing.T) {
	projectDir := t.TempDir()
	appDir := projectDir + "/apps/api"
	if err := os.MkdirAll(appDir, 0700); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(projectDir+"/.env", []byte("DATABASE_URL=postgres://project-env/db\n"), 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("DATABASE_URL", "temporary")
	if err := os.Unsetenv("DATABASE_URL"); err != nil {
		t.Fatal(err)
	}
	t.Chdir(appDir)

	if got := Load().DatabaseURL; got != "postgres://project-env/db" {
		t.Fatalf("expected Load to read project .env, got %q", got)
	}
}

func TestLoadEnvFilePreservesExistingEnvironment(t *testing.T) {
	envFile := t.TempDir() + "/.env"
	if err := os.WriteFile(envFile, []byte("DATABASE_URL=postgres://env-file/db\n"), 0600); err != nil {
		t.Fatal(err)
	}
	t.Setenv("DATABASE_URL", "postgres://process-env/db")
	if err := loadEnvFile(envFile); err != nil {
		t.Fatal(err)
	}
	if got := os.Getenv("DATABASE_URL"); got != "postgres://process-env/db" {
		t.Fatalf("expected process environment to take precedence, got %q", got)
	}
}

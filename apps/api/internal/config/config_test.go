package config

import (
	"os"
	"testing"
)

func TestConfigLoad(t *testing.T) {
	os.Setenv("PORT", "9090")
	defer os.Unsetenv("PORT")

	cfg := Load()
	if cfg.Port != "9090" {
		t.Errorf("expected PORT=9090, got %s", cfg.Port)
	}
	if cfg.AppName != "komas-api" {
		t.Errorf("expected AppName=komas-api, got %s", cfg.AppName)
	}
}

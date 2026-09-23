package logger

import (
	"bytes"
	"log/slog"
	"strings"
	"testing"
)

func TestLoggerNew(t *testing.T) {
	prodLogger := New("production")
	if prodLogger == nil {
		t.Fatal("expected production logger to not be nil")
	}

	devLogger := New("development")
	if devLogger == nil {
		t.Fatal("expected development logger to not be nil")
	}

	// Test production JSON format handler
	var buf bytes.Buffer
	jsonHandler := slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: slog.LevelInfo})
	l := slog.New(jsonHandler)
	l.Info("test json log", "key", "value")

	output := buf.String()
	if !strings.Contains(output, `"msg":"test json log"`) || !strings.Contains(output, `"key":"value"`) {
		t.Errorf("expected json log formatted output, got: %s", output)
	}
}

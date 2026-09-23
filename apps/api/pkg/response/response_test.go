package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/wignn/komas-api/internal/domain"
)

func TestSuccessResponse(t *testing.T) {
	rec := httptest.NewRecorder()
	Success(rec, http.StatusOK, "User retrieved", map[string]string{"name": "John"})

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var env Envelope
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if !env.Success {
		t.Errorf("expected success true, got %t", env.Success)
	}
	if env.Message != "User retrieved" {
		t.Errorf("expected message 'User retrieved', got '%s'", env.Message)
	}
	if dataMap, ok := env.Data.(map[string]any); !ok || dataMap["name"] != "John" {
		t.Errorf("expected data.name 'John', got %v", env.Data)
	}
}

func TestPaginatedResponse(t *testing.T) {
	rec := httptest.NewRecorder()
	items := []string{"item1", "item2"}
	Paginated(rec, http.StatusOK, "Items listed", items, 1, 10, 25)

	if rec.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rec.Code)
	}

	var env Envelope
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if !env.Success {
		t.Errorf("expected success true, got %t", env.Success)
	}
	if env.Meta == nil {
		t.Fatalf("expected meta to not be nil")
	}
	if env.Meta.Page != 1 || env.Meta.PerPage != 10 || env.Meta.Total != 25 || env.Meta.TotalPages != 3 {
		t.Errorf("unexpected meta values: %+v", env.Meta)
	}
}

func TestErrorResponse(t *testing.T) {
	rec := httptest.NewRecorder()
	details := []domain.FieldError{
		{Field: "email", Issue: "required"},
	}
	Error(rec, http.StatusBadRequest, "VALIDATION_FAILED", "Invalid payload", details)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rec.Code)
	}

	var env Envelope
	if err := json.NewDecoder(rec.Body).Decode(&env); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if env.Success {
		t.Errorf("expected success false, got %t", env.Success)
	}
	if env.Error == nil {
		t.Fatalf("expected error details to not be nil")
	}
	if env.Error.Code != "VALIDATION_FAILED" || env.Error.Message != "Invalid payload" {
		t.Errorf("unexpected error details: %+v", env.Error)
	}
	if len(env.Error.Details) != 1 || env.Error.Details[0].Field != "email" {
		t.Errorf("unexpected field errors: %+v", env.Error.Details)
	}
}

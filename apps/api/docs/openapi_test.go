package docs_test

import (
	"encoding/json"
	"testing"

	"github.com/wignn/komas-api/docs"
)

func TestOpenAPIValidity(t *testing.T) {
	if len(docs.OpenAPI) == 0 {
		t.Fatal("docs.OpenAPI is empty")
	}

	jsonBytes, err := docs.OpenAPIJSON()
	if err != nil {
		t.Fatalf("OpenAPIJSON failed: %v", err)
	}

	var parsed map[string]interface{}
	if err := json.Unmarshal(jsonBytes, &parsed); err != nil {
		t.Fatalf("json.Unmarshal failed: %v", err)
	}

	version, ok := parsed["openapi"].(string)
	if !ok || version != "3.0.3" {
		t.Fatalf("expected openapi version 3.0.3, got %v", parsed["openapi"])
	}

	paths, ok := parsed["paths"].(map[string]interface{})
	if !ok || len(paths) == 0 {
		t.Fatalf("expected valid paths map, got %v", parsed["paths"])
	}
}

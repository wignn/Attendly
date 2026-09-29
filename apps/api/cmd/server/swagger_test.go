package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/go-chi/chi/v5"
	httpSwagger "github.com/swaggo/http-swagger"
	"github.com/wignn/komas-api/docs"
)

func TestSwaggerEndpoints(t *testing.T) {
	r := chi.NewRouter()

	openAPIJSON, err := docs.OpenAPIJSON()
	if err != nil {
		t.Fatalf("OpenAPIJSON failed: %v", err)
	}

	r.Get("/swagger/openapi.yaml", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/yaml; charset=utf-8")
		_, _ = w.Write(docs.OpenAPI)
	})
	r.Get("/swagger/openapi.json", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_, _ = w.Write(openAPIJSON)
	})
	r.Get("/swagger/doc.json", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		_, _ = w.Write(openAPIJSON)
	})
	r.Get("/swagger/*", httpSwagger.Handler(httpSwagger.URL("/swagger/doc.json")))

	// Test 1: GET /swagger/doc.json
	req1 := httptest.NewRequest("GET", "/swagger/doc.json", nil)
	w1 := httptest.NewRecorder()
	r.ServeHTTP(w1, req1)
	if w1.Code != http.StatusOK {
		t.Errorf("expected 200 for /swagger/doc.json, got %d", w1.Code)
	}
	var docMap map[string]interface{}
	if err := json.Unmarshal(w1.Body.Bytes(), &docMap); err != nil {
		t.Errorf("expected valid JSON for /swagger/doc.json, got: %v", err)
	}
	if docMap["openapi"] != "3.0.3" {
		t.Errorf("expected openapi: 3.0.3, got %v", docMap["openapi"])
	}

	// Test 2: GET /swagger/openapi.yaml
	req2 := httptest.NewRequest("GET", "/swagger/openapi.yaml", nil)
	w2 := httptest.NewRecorder()
	r.ServeHTTP(w2, req2)
	if w2.Code != http.StatusOK {
		t.Errorf("expected 200 for /swagger/openapi.yaml, got %d", w2.Code)
	}

	// Test 3: GET /swagger/index.html
	req3 := httptest.NewRequest("GET", "/swagger/index.html", nil)
	w3 := httptest.NewRecorder()
	r.ServeHTTP(w3, req3)
	if w3.Code != http.StatusOK {
		t.Errorf("expected 200 for /swagger/index.html, got %d", w3.Code)
	}
}

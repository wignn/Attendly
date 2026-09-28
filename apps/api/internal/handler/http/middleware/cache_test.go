package middleware

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/wignn/komas-api/internal/domain"
)

var errCacheMiss = errors.New("cache miss")

type fakeResponseCache struct {
	values  map[string]string
	version int64
}

func (f *fakeResponseCache) Get(_ context.Context, key string) (string, error) {
	value, ok := f.values[key]
	if !ok {
		return "", errCacheMiss
	}
	return value, nil
}
func (f *fakeResponseCache) Set(_ context.Context, key string, value any, _ time.Duration) error {
	f.values[key] = value.(string)
	return nil
}
func (f *fakeResponseCache) Incr(_ context.Context, _ string) (int64, error) {
	f.version++
	return f.version, nil
}
func (f *fakeResponseCache) Version(context.Context, string) (int64, error) { return f.version, nil }

func TestResponseCacheCachesGETAndInvalidatesAfterWrite(t *testing.T) {
	cache := &fakeResponseCache{values: map[string]string{}}
	calls := 0
	handler := ResponseCache(cache, time.Minute)(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		calls++
		w.Header().Set("Content-Type", "application/json")
		_, _ = io.WriteString(w, `{"call":`+string(rune('0'+calls))+`}`)
	}))

	request := func(method string) *httptest.ResponseRecorder {
		recorder := httptest.NewRecorder()
		req := httptest.NewRequest(method, "/api/v1/classes?page=1", nil)
		user := &domain.User{ID: uuid.MustParse("00000000-0000-0000-0000-000000000001"), IsActive: true}
		req = req.WithContext(context.WithValue(req.Context(), AuthenticatedUserContextKey, user))
		handler.ServeHTTP(recorder, req)
		return recorder
	}
	if got := request(http.MethodGet).Body.String(); got != `{"call":1}` {
		t.Fatalf("first response = %s", got)
	}
	if got := request(http.MethodGet).Body.String(); got != `{"call":1}` {
		t.Fatalf("cached response = %s", got)
	}
	if calls != 1 {
		t.Fatalf("handler calls before write = %d, want 1", calls)
	}
	request(http.MethodPost)
	if got := request(http.MethodGet).Body.String(); got != `{"call":3}` {
		t.Fatalf("response after invalidation = %s", got)
	}
	if calls != 3 {
		t.Fatalf("handler calls = %d, want 3", calls)
	}
	if strings.TrimSpace(request(http.MethodGet).Body.String()) != `{"call":3}` {
		t.Fatal("new response was not cached")
	}
}

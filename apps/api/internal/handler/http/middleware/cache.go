package middleware

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"io"
	"net/http"
	"strconv"
	"time"
)

type responseCacheStore interface {
	Get(context.Context, string) (string, error)
	Set(context.Context, string, any, time.Duration) error
	Incr(context.Context, string) (int64, error)
	Version(context.Context, string) (int64, error)
}

const responseCacheGenerationKey = "attendly:response-cache:generation"

// ResponseCache caches successful JSON GET responses and invalidates all entries
// after any mutating API request. Cache failures fall back to the source handler.
func ResponseCache(store responseCacheStore, ttl time.Duration) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if store == nil || r.Method != http.MethodGet {
				if store != nil && r.Method != http.MethodGet && r.Method != http.MethodHead && r.Method != http.MethodOptions {
					defer func() { _, _ = store.Incr(context.Background(), responseCacheGenerationKey) }()
				}
				next.ServeHTTP(w, r)
				return
			}

			user := GetAuthenticatedUser(r.Context())
			if user == nil {
				next.ServeHTTP(w, r)
				return
			}

			generation, err := store.Version(r.Context(), responseCacheGenerationKey)
			if err != nil {
				next.ServeHTTP(w, r)
				return
			}
			digest := sha256.Sum256([]byte(r.URL.RequestURI()))
			key := "attendly:response-cache:" + user.ID.String() + ":" + strconv.FormatInt(generation, 10) + ":" + hex.EncodeToString(digest[:])
			if cached, err := store.Get(r.Context(), key); err == nil {
				w.Header().Set("Content-Type", "application/json")
				w.Header().Set("X-Cache", "HIT")
				w.WriteHeader(http.StatusOK)
				_, _ = io.WriteString(w, cached)
				return
			}

			capture := &cacheResponseWriter{header: make(http.Header), status: http.StatusOK}
			next.ServeHTTP(capture, r)
			for name, values := range capture.header {
				for _, value := range values {
					w.Header().Add(name, value)
				}
			}
			w.Header().Set("X-Cache", "MISS")
			w.WriteHeader(capture.status)
			_, _ = w.Write(capture.body.Bytes())
			if capture.status >= 200 && capture.status < 300 && bytes.Contains(bytes.ToLower([]byte(capture.header.Get("Content-Type"))), []byte("application/json")) {
				_ = store.Set(r.Context(), key, capture.body.String(), ttl)
			}
		})
	}
}

type cacheResponseWriter struct {
	header http.Header
	status int
	body   bytes.Buffer
}

func (w *cacheResponseWriter) Header() http.Header            { return w.header }
func (w *cacheResponseWriter) WriteHeader(status int)         { w.status = status }
func (w *cacheResponseWriter) Write(body []byte) (int, error) { return w.body.Write(body) }

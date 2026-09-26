# Task 4 report: HTTP handlers, routes, and server wiring

## Result

Implemented `StudentHandler` for student list/detail/create/update/soft-delete and enrollment history/transfer. All handlers use the authenticated user and standardized response envelopes. Lists return pagination metadata. The decoder rejects unknown fields and trailing JSON, including an attempted `class_id` update. Invalid IDs and filters are rejected before service calls. Domain errors map to stable 400/403/404/409 responses; unexpected errors return a generic 500 message without underlying SQL/repository details.

Registered collection and item routes in the authenticated `/api/v1` group, each with `RequireRole(SUPER_ADMIN)`. Existing attendance summary registration is untouched. Server startup now builds `StudentRepo -> StudentService -> StudentHandler`.

## TDD evidence

- Before implementation, `go test ./internal/handler/http/v1 -run 'TestStudentHandler|TestStudentRoutes' -count=1` failed to compile because `NewStudentHandler` and `StudentHandler` did not exist (expected RED).
- After implementation, the same focused command passed.

## Verification

Run from `apps/api`:

- `go test ./internal/handler/http/v1 -run 'TestStudentHandler|TestStudentRoutes' -count=1` — PASS.
- `go test ./...` — PASS.
- `go vet ./...` — PASS.
- `git diff --check` — PASS (Git printed only line-ending conversion notices for the two modified existing files).

## Scope notes

The handler uses the current service API and existing response envelope. Collection requests default to page 1, 20 per page, `created_at` ascending; `per_page` is constrained to 1–100. Effective dates accept ISO `YYYY-MM-DD`; omitted dates remain nil for the service's Asia/Jakarta default.

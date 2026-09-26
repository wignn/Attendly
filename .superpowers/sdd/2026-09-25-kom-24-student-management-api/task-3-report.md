# Task 3 report: student service and business rules

## Implemented

- Added the student management service and its create, update, and transfer input types.
- All seven service operations check for `SUPER_ADMIN` before touching the repository.
- Create and update trim NIS, NISN, and names; validate required identifiers, name, and class; and pass duplicate-identifier errors through unchanged. Update preserves omitted NISN and clears it when the provided value is empty after trimming.
- Student updates reject `class_id`, preserve unspecified fields, support deactivation/reactivation for non-deleted students, and reject reactivation after soft deletion.
- Soft delete is idempotent for a student already marked deleted. Create, update, delete, and transfer propagate the authenticated actor ID to the repository.
- Listing validates the sort allowlist, sort direction, class filter, and negative pagination; trims search; defaults page/per-page to 1/20; and caps per-page at 100.
- Create and transfer dates default to the current Asia/Jakarta day. Dates are passed at Jakarta noon because the repository serializes through UTC; this preserves the intended date. Transfers reject nil/same class, deleted students, zero/unsupported dates, and dates before the current enrollment start.
- Enrollment-history lookup delegates to the repository, which supports retained deleted identities.

## Validation

- TDD red phase: before `student_service.go` existed, `go test ./internal/service -run '^TestStudentService' -count=1` failed to compile because the service constructor and input types were undefined.
- Focused service tests: from `apps/api`, `go test ./internal/service -run '^TestStudentService' -count=1` passed.
- Full API suite: from `apps/api`, `go test ./...` passed across all packages. The PostgreSQL integration tests remain skipped unless `TEST_DATABASE_URL` is set; see Task 2 report.
- `gofmt` completed for both service files. `git diff --check` passed.

## Review notes

- No live database was needed for these service tests.
- No blockers or known service-test failures remain.

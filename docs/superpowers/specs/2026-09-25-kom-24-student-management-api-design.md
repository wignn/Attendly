# KOM-24 Student Management API Design

## Goal

Deliver the student master-data API and enrollment history required by KOM-24 while keeping existing attendance records attached to the same student identities.

## Requirements and context

- Linear KOM-24 calls for student CRUD, activation/deactivation, unique student identifiers, class transfer history, attendance preservation on deletion, searchable and filterable pagination, RBAC, audit logging, and matching API documentation.
- The linked Figma file places student management in the Super Admin area and shows a student data tab alongside attendance recap. The ticket is backend API work; this change will not build a new frontend screen.
- The current API already has a `students` table with `student_number`, `full_name`, `class_id`, and `active`, and attendance records reference the student row. The current OpenAPI student contract only describes list/create and omits enrollment history and the existing database class requirement.

## Data model and migrations

- Keep `students.id` stable so `attendance_records.student_id` continues to reference the same student through transfers and removal.
- Expose `student_number` as `nis`, add optional unique `nisn`, and retain `full_name` and active status in API responses.
- Add a `student_enrollments` table with a stable ID, `student_id`, `class_id`, `valid_from`, `valid_to`, and `created_at`. Enrollment date ranges are start-inclusive and end-exclusive. A partial unique constraint permits only one current enrollment per student (`valid_to IS NULL`). Index student/date and class/current enrollment lookups.
- Backfill each existing student's current `class_id` into one open enrollment, using the student's `created_at` date as the start date.
- Keep `students.class_id` as the current-class compatibility field used by existing attendance reports. Writes to it and enrollment history happen together in one transaction; reads for student management use the same current class.
- Add `deleted_at` to distinguish soft deletion from ordinary deactivation. Change the student foreign key from attendance records to `ON DELETE RESTRICT` so an accidental hard delete cannot erase attendance. The API never hard-deletes students.

## HTTP API

All student management operations require authentication and the `SUPER_ADMIN` role, matching the Figma management area.

- `GET /students`: paginated list. Supports `page`, `per_page`, `search` (NIS, NISN, or name), `class_id`, `status`, `sort_by`, and `sort_order`. Defaults to excluding soft-deleted rows; a status filter selects active or inactive students. `sort_by` is allowlisted to `nis`, `full_name`, `class_name`, or `created_at`; `sort_order` is `asc` or `desc`.
- `POST /students`: create a student with required `nis`, `full_name`, and initial `class_id`; accepts optional `nisn` and `effective_on`. Creation inserts the initial open enrollment in the same transaction; `effective_on` defaults to today's date in `Asia/Jakarta`.
- `GET /students/{student_id}`: retrieve a non-deleted student and current enrollment.
- `PATCH /students/{student_id}`: update NIS, NISN, name, or active status. Class changes are rejected here and must go through enrollment history.
- `DELETE /students/{student_id}`: soft-delete by setting `deleted_at` and `active = false`; return success for an already soft-deleted student. Existing attendance and enrollment rows remain.
- `GET /students/{student_id}/enrollments`: return enrollment history in chronological order, including for a soft-deleted student whose identity row remains.
- `POST /students/{student_id}/enrollments`: transfer to a class by closing the current enrollment and inserting a new open enrollment atomically. Requires `class_id`; accepts `effective_on` (defaults to today's date in `Asia/Jakarta`). Reject the current class, unknown classes, deleted students, and dates earlier than the current enrollment start.

Student responses include current `class_id`, current class name, `nis`, optional `nisn`, `full_name`, `status` (`ACTIVE` or `INACTIVE`), timestamps, and enrollment dates where relevant. List responses use the existing success envelope and pagination metadata. Invalid inputs use the existing error envelope; duplicate NIS/NISN return `409 CONFLICT`, invalid IDs or filters return `400`, missing resources return `404`, and authorization failures return `403`.

## Business rules and audit

- NIS is required and unique. NISN is optional and unique when present. Trim identifiers and names before validation and persistence.
- A student has at most one open enrollment. Transfer closes the existing row and inserts the next row in one database transaction; a failed insert rolls back both operations.
- Ordinary deactivation preserves enrollments and attendance. Reactivation is allowed only for a non-deleted student. Soft deletion is terminal through this API.
- Record audit events for student creation, update, activation/deactivation, soft deletion, and enrollment transfer, with the authenticated actor, action, entity type, and entity ID.
- Existing attendance summaries continue to work from the stable student row and current `students.class_id` field.

## OpenAPI and compatibility

- Extend the existing Students tag with the detail, update, delete, and enrollment-history operations; document RBAC, filters, sort fields, pagination, status codes, and examples.
- Align `Student` and `StudentCreate` with actual API/database fields and define request, response, enrollment, and paginated-list schemas without duplicate `operationId` values.
- Move the existing OpenAPI declaration from 3.0.3 to the KOM-5 target 3.1.0 while keeping the rest of the contract intact.
- `apps/api/docs/openapi.go` embeds `openapi.yaml` directly, so the served Swagger contract updates with the YAML file and needs no separate generation step.

## Verification

- Unit tests cover identifier conflicts, activation/deactivation, transfer rules, invalid dates, and soft deletion semantics.
- Repository or handler tests cover pagination and filters, RBAC, expected error statuses, and that deleting a student does not remove attendance rows.
- Validate the OpenAPI document, operation ID uniqueness, and correspondence between contract and handler behavior.
- Run the backend test suite and relevant web type checks only if the implementation changes shared frontend types or APIs.

## Out of scope

- Building or restyling the student-management UI.
- Hard deleting a student or rewriting attendance reports to expose historical classes in old class reports.
- Adding student fields beyond NIS, optional NISN, full name, status, and enrollment data.

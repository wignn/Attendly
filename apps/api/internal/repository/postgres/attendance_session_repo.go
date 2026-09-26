package postgres

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/wignn/komas-api/internal/domain"
)

type AttendanceSessionRepo struct {
	pool *pgxpool.Pool
}

func NewAttendanceSessionRepo(pool *pgxpool.Pool) domain.AttendanceSessionRepository {
	return &AttendanceSessionRepo{pool: pool}
}

func (r *AttendanceSessionRepo) CanTeachClassSubject(ctx context.Context, teacherID, classID, subjectID uuid.UUID) (bool, error) {
	var allowed bool
	err := r.pool.QueryRow(ctx, `SELECT EXISTS (
		SELECT 1 FROM teaching_assignments
		WHERE teacher_id=$1 AND class_id=$2 AND subject_id=$3 AND active
	)`, teacherID, classID, subjectID).Scan(&allowed)
	return allowed, err
}

func (r *AttendanceSessionRepo) GetScheduleByID(ctx context.Context, scheduleID uuid.UUID) (*domain.Schedule, error) {
	query := `SELECT s.id, s.teaching_assignment_id, s.teacher_id, s.class_id, ta.subject_id, s.academic_year_id,
		s.day_of_week, s.starts_at::text, s.ends_at::text, s.effective_from::text, s.effective_until::text,
		s.active, s.created_at, s.updated_at
		FROM class_schedules s
		JOIN teaching_assignments ta ON ta.id = s.teaching_assignment_id
		WHERE s.id = $1`
	var item domain.Schedule
	err := r.pool.QueryRow(ctx, query, scheduleID).Scan(
		&item.ID, &item.TeachingAssignmentID, &item.TeacherID, &item.ClassID,
		&item.SubjectID, &item.AcademicYearID, &item.DayOfWeek, &item.StartsAt, &item.EndsAt,
		&item.EffectiveFrom, &item.EffectiveUntil, &item.Active, &item.CreatedAt, &item.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	return &item, nil
}

func (r *AttendanceSessionRepo) CreateOrGetFromSchedule(ctx context.Context, scheduleID uuid.UUID, heldAt time.Time, actorID uuid.UUID) (*domain.AttendanceSessionDetail, bool, error) {
	// 1. Check if session already exists for schedule on that date
	var existingID uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT id FROM attendance_sessions WHERE schedule_id = $1 AND held_at::date = $2::date`, scheduleID, heldAt.Format("2006-01-02")).Scan(&existingID)
	if err == nil {
		sess, err := r.GetByID(ctx, existingID)
		return sess, false, err
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, false, err
	}

	// 2. Fetch schedule info
	sched, err := r.GetScheduleByID(ctx, scheduleID)
	if err != nil {
		return nil, false, err
	}

	// 3. Insert in transaction
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, false, err
	}
	defer tx.Rollback(ctx)

	var sessionID uuid.UUID
	insertSessionQuery := `INSERT INTO attendance_sessions (id, schedule_id, class_id, subject_id, teacher_id, held_at, status, version, created_at, updated_at)
		VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, 'DRAFT', 1, NOW(), NOW())
		ON CONFLICT (schedule_id, (held_at::date)) WHERE schedule_id IS NOT NULL
		DO UPDATE SET updated_at = attendance_sessions.updated_at
		RETURNING id`
	if err := tx.QueryRow(ctx, insertSessionQuery, sched.ID, sched.ClassID, sched.SubjectID, sched.TeacherID, heldAt).Scan(&sessionID); err != nil {
		return nil, false, err
	}

	// 4. Fetch students in class and populate records
	studentRows, err := tx.Query(ctx, `SELECT id FROM students WHERE class_id = $1 AND active = true AND deleted_at IS NULL`, sched.ClassID)
	if err != nil {
		return nil, false, err
	}
	var studentIDs []uuid.UUID
	for studentRows.Next() {
		var sID uuid.UUID
		if err := studentRows.Scan(&sID); err != nil {
			studentRows.Close()
			return nil, false, err
		}
		studentIDs = append(studentIDs, sID)
	}
	studentRows.Close()

	for _, sID := range studentIDs {
		_, err := tx.Exec(ctx, `INSERT INTO attendance_records (session_id, student_id, status, remarks, recorded_at, updated_at)
			VALUES ($1, $2, 'PRESENT', '', NOW(), NOW())
			ON CONFLICT (session_id, student_id) DO NOTHING`, sessionID, sID)
		if err != nil {
			return nil, false, err
		}
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'CREATE', 'ATTENDANCE_SESSION', $2)`, actorID, sessionID)

	if err := tx.Commit(ctx); err != nil {
		return nil, false, err
	}

	sess, err := r.GetByID(ctx, sessionID)
	return sess, true, err
}

func (r *AttendanceSessionRepo) CreateOrGetManual(ctx context.Context, classID, subjectID, teacherID uuid.UUID, heldAt time.Time, actorID uuid.UUID) (*domain.AttendanceSessionDetail, bool, error) {
	var existingID uuid.UUID
	err := r.pool.QueryRow(ctx, `SELECT id FROM attendance_sessions WHERE class_id = $1 AND subject_id = $2 AND teacher_id = $3 AND held_at::date = $4::date AND schedule_id IS NULL`,
		classID, subjectID, teacherID, heldAt.Format("2006-01-02")).Scan(&existingID)
	if err == nil {
		sess, err := r.GetByID(ctx, existingID)
		return sess, false, err
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, false, err
	}

	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, false, err
	}
	defer tx.Rollback(ctx)

	var sessionID uuid.UUID
	insertQuery := `INSERT INTO attendance_sessions (id, schedule_id, class_id, subject_id, teacher_id, held_at, status, version, created_at, updated_at)
		VALUES (uuid_generate_v4(), NULL, $1, $2, $3, $4, 'DRAFT', 1, NOW(), NOW())
		RETURNING id`
	if err := tx.QueryRow(ctx, insertQuery, classID, subjectID, teacherID, heldAt).Scan(&sessionID); err != nil {
		return nil, false, err
	}

	studentRows, err := tx.Query(ctx, `SELECT id FROM students WHERE class_id = $1 AND active = true AND deleted_at IS NULL`, classID)
	if err != nil {
		return nil, false, err
	}
	var studentIDs []uuid.UUID
	for studentRows.Next() {
		var sID uuid.UUID
		if err := studentRows.Scan(&sID); err != nil {
			studentRows.Close()
			return nil, false, err
		}
		studentIDs = append(studentIDs, sID)
	}
	studentRows.Close()

	for _, sID := range studentIDs {
		_, err := tx.Exec(ctx, `INSERT INTO attendance_records (session_id, student_id, status, remarks, recorded_at, updated_at)
			VALUES ($1, $2, 'PRESENT', '', NOW(), NOW())
			ON CONFLICT (session_id, student_id) DO NOTHING`, sessionID, sID)
		if err != nil {
			return nil, false, err
		}
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'CREATE', 'ATTENDANCE_SESSION', $2)`, actorID, sessionID)

	if err := tx.Commit(ctx); err != nil {
		return nil, false, err
	}

	sess, err := r.GetByID(ctx, sessionID)
	return sess, true, err
}

func (r *AttendanceSessionRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.AttendanceSessionDetail, error) {
	query := `SELECT s.id, s.schedule_id, s.class_id, c.name, s.subject_id, sub.name, s.teacher_id, u.name,
		s.held_at, s.status, s.version, s.submitted_by, s.submitted_at, s.reopened_by, s.reopened_at,
		s.reopen_reason, s.created_at, s.updated_at
		FROM attendance_sessions s
		JOIN classes c ON c.id = s.class_id
		JOIN subjects sub ON sub.id = s.subject_id
		JOIN users u ON u.id = s.teacher_id
		WHERE s.id = $1`

	var sess domain.AttendanceSessionDetail
	var statusStr string
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&sess.ID, &sess.ScheduleID, &sess.ClassID, &sess.ClassName,
		&sess.SubjectID, &sess.SubjectName, &sess.TeacherID, &sess.TeacherName,
		&sess.HeldAt, &statusStr, &sess.Version, &sess.SubmittedBy, &sess.SubmittedAt,
		&sess.ReopenedBy, &sess.ReopenedAt, &sess.ReopenReason, &sess.CreatedAt, &sess.UpdatedAt,
	)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	sess.Status = domain.AttendanceSessionStatus(statusStr)

	// Fetch records
	recQuery := `SELECT ar.student_id, st.student_number, st.full_name, ar.status, ar.remarks, ar.recorded_at, ar.updated_at
		FROM attendance_records ar
		JOIN students st ON st.id = ar.student_id
		WHERE ar.session_id = $1
		ORDER BY st.full_name ASC`

	rows, err := r.pool.Query(ctx, recQuery, id)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var rec domain.AttendanceRecordItem
		var recStatus string
		if err := rows.Scan(&rec.StudentID, &rec.StudentNIS, &rec.StudentName, &recStatus, &rec.Remarks, &rec.RecordedAt, &rec.UpdatedAt); err != nil {
			return nil, err
		}
		rec.Status = domain.AttendanceStatus(recStatus)
		sess.Records = append(sess.Records, rec)
		sess.TotalStudents++
		switch rec.Status {
		case domain.AttendancePresent:
			sess.PresentCount++
		case domain.AttendanceExcused:
			sess.ExcusedCount++
		case domain.AttendanceSick:
			sess.SickCount++
		case domain.AttendanceUnexcusedAbsent:
			sess.AbsentCount++
		}
	}

	return &sess, rows.Err()
}

func (r *AttendanceSessionRepo) List(ctx context.Context, f domain.AttendanceSessionFilter) ([]domain.AttendanceSessionDetail, int64, error) {
	where := ` WHERE ($1::uuid IS NULL OR s.class_id = $1)
		AND ($2::uuid IS NULL OR s.subject_id = $2)
		AND ($3::uuid IS NULL OR s.teacher_id = $3)
		AND ($4::varchar IS NULL OR s.status = $4)
		AND ($5::date IS NULL OR s.held_at::date = $5)
		AND ($6::date IS NULL OR s.held_at::date >= $6)
		AND ($7::date IS NULL OR s.held_at::date <= $7)`

	var classID, subjectID, teacherID any
	if f.ClassID != uuid.Nil {
		classID = f.ClassID
	}
	if f.SubjectID != uuid.Nil {
		subjectID = f.SubjectID
	}
	if f.TeacherID != uuid.Nil {
		teacherID = f.TeacherID
	}
	var status, date, fromDate, toDate any
	if f.Status != "" {
		status = f.Status
	}
	if f.Date != "" {
		date = f.Date
	}
	if f.FromDate != "" {
		fromDate = f.FromDate
	}
	if f.ToDate != "" {
		toDate = f.ToDate
	}

	args := []any{classID, subjectID, teacherID, status, date, fromDate, toDate}

	countQuery := `SELECT COUNT(*) FROM attendance_sessions s` + where
	var total int64
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, err
	}

	limit := int(f.PerPage)
	if limit <= 0 {
		limit = 20
	}
	offset := (int(f.Page) - 1) * limit
	if offset < 0 {
		offset = 0
	}

	listQuery := `SELECT s.id, s.schedule_id, s.class_id, c.name, s.subject_id, sub.name, s.teacher_id, u.name,
		s.held_at, s.status, s.version, s.submitted_by, s.submitted_at, s.reopened_by, s.reopened_at,
		s.reopen_reason, s.created_at, s.updated_at,
		COUNT(ar.student_id)::int AS total_students,
		COUNT(CASE WHEN ar.status = 'PRESENT' THEN 1 END)::int AS present_count,
		COUNT(CASE WHEN ar.status = 'EXCUSED' THEN 1 END)::int AS excused_count,
		COUNT(CASE WHEN ar.status = 'SICK' THEN 1 END)::int AS sick_count,
		COUNT(CASE WHEN ar.status = 'UNEXCUSED_ABSENT' THEN 1 END)::int AS absent_count
		FROM attendance_sessions s
		JOIN classes c ON c.id = s.class_id
		JOIN subjects sub ON sub.id = s.subject_id
		JOIN users u ON u.id = s.teacher_id
		LEFT JOIN attendance_records ar ON ar.session_id = s.id` +
		where +
		` GROUP BY s.id, c.name, sub.name, u.name
		ORDER BY s.held_at DESC, s.created_at DESC
		LIMIT $8 OFFSET $9`

	listArgs := append(args, limit, offset)
	rows, err := r.pool.Query(ctx, listQuery, listArgs...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var sessions []domain.AttendanceSessionDetail
	for rows.Next() {
		var sess domain.AttendanceSessionDetail
		var statusStr string
		err := rows.Scan(
			&sess.ID, &sess.ScheduleID, &sess.ClassID, &sess.ClassName,
			&sess.SubjectID, &sess.SubjectName, &sess.TeacherID, &sess.TeacherName,
			&sess.HeldAt, &statusStr, &sess.Version, &sess.SubmittedBy, &sess.SubmittedAt,
			&sess.ReopenedBy, &sess.ReopenedAt, &sess.ReopenReason, &sess.CreatedAt, &sess.UpdatedAt,
			&sess.TotalStudents, &sess.PresentCount, &sess.ExcusedCount, &sess.SickCount, &sess.AbsentCount,
		)
		if err != nil {
			return nil, 0, err
		}
		sess.Status = domain.AttendanceSessionStatus(statusStr)
		sessions = append(sessions, sess)
	}

	return sessions, total, rows.Err()
}

func (r *AttendanceSessionRepo) UpdateRecords(ctx context.Context, sessionID uuid.UUID, expectedVersion int, records []domain.RecordUpdateItem, actorID uuid.UUID) (*domain.AttendanceSessionDetail, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var currentStatus string
	var currentVersion int
	query := `SELECT status, version FROM attendance_sessions WHERE id = $1 FOR UPDATE`
	err = tx.QueryRow(ctx, query, sessionID).Scan(&currentStatus, &currentVersion)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if currentStatus == string(domain.SessionStatusSubmitted) {
		return nil, domain.ErrSessionLocked
	}
	if expectedVersion > 0 && currentVersion != expectedVersion {
		return nil, domain.ErrSessionVersionMismatch
	}

	for _, rec := range records {
		_, err := tx.Exec(ctx, `INSERT INTO attendance_records (session_id, student_id, status, remarks, updated_at)
			VALUES ($1, $2, $3, $4, NOW())
			ON CONFLICT (session_id, student_id) DO UPDATE
			SET status = EXCLUDED.status, remarks = EXCLUDED.remarks, updated_at = NOW()`,
			sessionID, rec.StudentID, rec.Status, rec.Remarks)
		if err != nil {
			return nil, fmt.Errorf("failed updating record for student %s: %w", rec.StudentID, err)
		}
	}

	_, err = tx.Exec(ctx, `UPDATE attendance_sessions SET version = version + 1, updated_at = NOW() WHERE id = $1`, sessionID)
	if err != nil {
		return nil, err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'UPDATE_RECORDS', 'ATTENDANCE_SESSION', $2)`, actorID, sessionID)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetByID(ctx, sessionID)
}

func (r *AttendanceSessionRepo) Submit(ctx context.Context, sessionID uuid.UUID, expectedVersion int, actorID uuid.UUID) (*domain.AttendanceSessionDetail, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var currentStatus string
	var currentVersion int
	err = tx.QueryRow(ctx, `SELECT status, version FROM attendance_sessions WHERE id = $1 FOR UPDATE`, sessionID).Scan(&currentStatus, &currentVersion)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if currentStatus == string(domain.SessionStatusSubmitted) {
		return nil, domain.ErrSessionLocked
	}
	if expectedVersion > 0 && currentVersion != expectedVersion {
		return nil, domain.ErrSessionVersionMismatch
	}

	_, err = tx.Exec(ctx, `UPDATE attendance_sessions
		SET status = 'SUBMITTED', submitted_by = $2, submitted_at = NOW(), version = version + 1, updated_at = NOW()
		WHERE id = $1`, sessionID, actorID)
	if err != nil {
		return nil, err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'SUBMIT', 'ATTENDANCE_SESSION', $2)`, actorID, sessionID)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetByID(ctx, sessionID)
}

func (r *AttendanceSessionRepo) Reopen(ctx context.Context, sessionID uuid.UUID, actorID uuid.UUID, reason string) (*domain.AttendanceSessionDetail, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var currentStatus string
	err = tx.QueryRow(ctx, `SELECT status FROM attendance_sessions WHERE id = $1 FOR UPDATE`, sessionID).Scan(&currentStatus)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, domain.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	if currentStatus != string(domain.SessionStatusSubmitted) {
		return nil, domain.ErrInvalidSessionStatus
	}

	_, err = tx.Exec(ctx, `UPDATE attendance_sessions
		SET status = 'REOPENED', reopened_by = $2, reopened_at = NOW(), reopen_reason = $3, version = version + 1, updated_at = NOW()
		WHERE id = $1`, sessionID, actorID, reason)
	if err != nil {
		return nil, err
	}

	_, _ = tx.Exec(ctx, `INSERT INTO audit_events (actor_id, action, entity, entity_id) VALUES ($1, 'REOPEN', 'ATTENDANCE_SESSION', $2)`, actorID, sessionID)

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return r.GetByID(ctx, sessionID)
}

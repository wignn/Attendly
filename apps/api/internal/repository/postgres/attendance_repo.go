package postgres

import (
	"context"
	"errors"

	"github.com/wignn/komas-api/internal/domain"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AttendanceRepo struct {
	pool *pgxpool.Pool
}

func NewAttendanceRepo(pool *pgxpool.Pool) domain.AttendanceRepository {
	return &AttendanceRepo{pool: pool}
}

const sessionCols = `id, class_subject_id, session_date, topic, created_by, created_at, updated_at`

func scanSession(row pgx.Row) (*domain.AttendanceSession, error) {
	var s domain.AttendanceSession
	err := row.Scan(&s.ID, &s.ClassSubjectID, &s.SessionDate, &s.Topic, &s.CreatedBy, &s.CreatedAt, &s.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return &s, nil
}

func (r *AttendanceRepo) CreateSession(ctx context.Context, s *domain.AttendanceSession) error {
	query := `INSERT INTO attendance_sessions (id, class_subject_id, session_date, topic, created_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`
	_, err := r.pool.Exec(ctx, query, s.ID, s.ClassSubjectID, s.SessionDate, s.Topic, s.CreatedBy, s.CreatedAt, s.UpdatedAt)
	return err
}

func (r *AttendanceRepo) GetSessionByID(ctx context.Context, id uuid.UUID) (*domain.AttendanceSession, error) {
	return scanSession(r.pool.QueryRow(ctx, `SELECT `+sessionCols+` FROM attendance_sessions WHERE id = $1`, id))
}

func (r *AttendanceRepo) ListSessionsByClassSubject(ctx context.Context, classSubjectID uuid.UUID) ([]*domain.AttendanceSession, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT `+sessionCols+` FROM attendance_sessions WHERE class_subject_id = $1 ORDER BY session_date DESC`,
		classSubjectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []*domain.AttendanceSession
	for rows.Next() {
		s, err := scanSession(rows)
		if err != nil {
			return nil, err
		}
		sessions = append(sessions, s)
	}
	return sessions, rows.Err()
}

func (r *AttendanceRepo) DeleteSession(ctx context.Context, id uuid.UUID) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM attendance_sessions WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}


func (r *AttendanceRepo) UpsertRecords(ctx context.Context, sessionID uuid.UUID, records []*domain.AttendanceRecord) error {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)
	const upsert = `
		INSERT INTO attendance_records (id, session_id, student_id, status, note, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (session_id, student_id)
		DO UPDATE SET status = EXCLUDED.status, note = EXCLUDED.note, updated_at = NOW()`

	for _, rec := range records {
		if _, err := tx.Exec(ctx, upsert, uuid.New(), sessionID, rec.StudentID, string(rec.Status), rec.Note); err != nil {
			return err
		}
	}

	return tx.Commit(ctx)
}

func (r *AttendanceRepo) ListRecordsBySession(ctx context.Context, sessionID uuid.UUID) ([]*domain.AttendanceRecord, error) {
	query := `
		SELECT ar.id, ar.session_id, ar.student_id, ar.status, ar.note, ar.created_at, ar.updated_at,
		       st.full_name, st.nis
		FROM attendance_records ar
		JOIN students st ON st.id = ar.student_id
		WHERE ar.session_id = $1
		ORDER BY st.full_name ASC`
	rows, err := r.pool.Query(ctx, query, sessionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var records []*domain.AttendanceRecord
	for rows.Next() {
		var rec domain.AttendanceRecord
		var status string
		if err := rows.Scan(&rec.ID, &rec.SessionID, &rec.StudentID, &status, &rec.Note,
			&rec.CreatedAt, &rec.UpdatedAt, &rec.StudentName, &rec.StudentNIS); err != nil {
			return nil, err
		}
		rec.Status = domain.AttendanceStatus(status)
		records = append(records, &rec)
	}
	return records, rows.Err()
}


func (r *AttendanceRepo) SummaryByClassSubject(ctx context.Context, classSubjectID uuid.UUID) ([]*domain.AttendanceSummary, error) {
	query := `
		SELECT st.id, st.full_name,
		       COUNT(*) FILTER (WHERE ar.status = 'PRESENT') AS present,
		       COUNT(*) FILTER (WHERE ar.status = 'ABSENT')  AS absent,
		       COUNT(*) FILTER (WHERE ar.status = 'LATE')    AS late,
		       COUNT(*) FILTER (WHERE ar.status = 'SICK')    AS sick,
		       COUNT(*) FILTER (WHERE ar.status = 'EXCUSED') AS excused,
		       COUNT(ar.id) AS total
		FROM attendance_records ar
		JOIN attendance_sessions ses ON ses.id = ar.session_id
		JOIN students st ON st.id = ar.student_id
		WHERE ses.class_subject_id = $1
		GROUP BY st.id, st.full_name
		ORDER BY st.full_name ASC`
	rows, err := r.pool.Query(ctx, query, classSubjectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var summaries []*domain.AttendanceSummary
	for rows.Next() {
		var s domain.AttendanceSummary
		if err := rows.Scan(&s.StudentID, &s.StudentName,
			&s.Present, &s.Absent, &s.Late, &s.Sick, &s.Excused, &s.Total); err != nil {
			return nil, err
		}
		summaries = append(summaries, &s)
	}
	return summaries, rows.Err()
}

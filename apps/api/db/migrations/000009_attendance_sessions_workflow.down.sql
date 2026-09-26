ALTER TABLE attendance_records
    DROP COLUMN IF EXISTS remarks,
    DROP COLUMN IF EXISTS updated_at;

DROP INDEX IF EXISTS idx_attendance_sessions_schedule_id;
DROP INDEX IF EXISTS idx_attendance_sessions_held_at;
DROP INDEX IF EXISTS idx_attendance_sessions_status;
DROP INDEX IF EXISTS idx_attendance_sessions_schedule_date;
DROP FUNCTION IF EXISTS attendance_session_date(TIMESTAMPTZ);

ALTER TABLE attendance_sessions
    DROP COLUMN IF EXISTS schedule_id,
    DROP COLUMN IF EXISTS status,
    DROP COLUMN IF EXISTS version,
    DROP COLUMN IF EXISTS submitted_by,
    DROP COLUMN IF EXISTS submitted_at,
    DROP COLUMN IF EXISTS reopened_by,
    DROP COLUMN IF EXISTS reopened_at,
    DROP COLUMN IF EXISTS reopen_reason,
    DROP COLUMN IF EXISTS updated_at;

ALTER TABLE attendance_sessions
    ADD COLUMN schedule_id UUID REFERENCES class_schedules(id) ON DELETE SET NULL,
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'REOPENED')),
    ADD COLUMN version INT NOT NULL DEFAULT 1,
    ADD COLUMN submitted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN submitted_at TIMESTAMPTZ,
    ADD COLUMN reopened_by UUID REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN reopened_at TIMESTAMPTZ,
    ADD COLUMN reopen_reason TEXT,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX idx_attendance_sessions_schedule_date
    ON attendance_sessions (schedule_id, (held_at::date))
    WHERE schedule_id IS NOT NULL;

CREATE INDEX idx_attendance_sessions_status ON attendance_sessions(status);
CREATE INDEX idx_attendance_sessions_held_at ON attendance_sessions(held_at);
CREATE INDEX idx_attendance_sessions_schedule_id ON attendance_sessions(schedule_id);

ALTER TABLE attendance_records
    ADD COLUMN remarks TEXT NOT NULL DEFAULT '',
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

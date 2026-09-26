ALTER TABLE audit_events
    ADD COLUMN details JSONB NOT NULL DEFAULT '{}';

CREATE TABLE export_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    export_type VARCHAR(50) NOT NULL,
    file_format VARCHAR(10) NOT NULL CHECK (file_format IN ('CSV', 'XLSX', 'PDF')),
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
    filter_params JSONB NOT NULL DEFAULT '{}',
    storage_key TEXT NOT NULL DEFAULT '',
    download_url TEXT NOT NULL DEFAULT '',
    error_message TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_export_jobs_user_id ON export_jobs(user_id);
CREATE INDEX idx_export_jobs_status ON export_jobs(status);
CREATE INDEX idx_audit_events_entity ON audit_events(entity, entity_id);
CREATE INDEX idx_audit_events_actor ON audit_events(actor_id);

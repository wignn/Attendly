CREATE TABLE refresh_sessions (
    token_id UUID PRIMARY KEY,
    family_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_sessions_family_id ON refresh_sessions(family_id);
CREATE INDEX idx_refresh_sessions_user_id ON refresh_sessions(user_id);

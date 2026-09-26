CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nip VARCHAR(50) UNIQUE,
    phone VARCHAR(50) NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_teachers_user_id ON teachers(user_id);
CREATE INDEX idx_teachers_status ON teachers(status);

-- Backfill any existing users with TEACHER or HOMEROOM_TEACHER role
INSERT INTO teachers (id, user_id, nip, status)
SELECT u.id, u.id, 'NIP-' || SUBSTRING(u.id::text FROM 1 FOR 8),
       CASE WHEN u.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.role_id = ur.role_id
WHERE r.name IN ('TEACHER', 'HOMEROOM_TEACHER')
ON CONFLICT (user_id) DO NOTHING;

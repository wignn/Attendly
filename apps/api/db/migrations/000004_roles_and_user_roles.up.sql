CREATE TABLE roles (
    role_id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT ''
);

INSERT INTO roles (name, description) VALUES
    ('SUPER_ADMIN', 'Full system administration'),
    ('TEACHER', 'Teacher account'),
    ('HOMEROOM_TEACHER', 'Homeroom teacher responsibilities');

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
    granted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_granted_by ON user_roles(granted_by);

INSERT INTO user_roles (user_id, role_id)
SELECT users.id, roles.role_id
FROM users
JOIN roles ON roles.name = users.role::text;

ALTER TABLE users DROP COLUMN role;

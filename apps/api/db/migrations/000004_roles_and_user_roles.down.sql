DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM user_roles
        GROUP BY user_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'cannot restore single user_role enum while users have multiple roles';
    END IF;
END $$;

ALTER TABLE users ADD COLUMN role user_role;

UPDATE users
SET role = CASE roles.name
    WHEN 'SUPER_ADMIN' THEN 'SUPER_ADMIN'
    WHEN 'TEACHER' THEN 'TEACHER'
    WHEN 'HOMEROOM_TEACHER' THEN 'HOMEROOM_TEACHER'
END::user_role
FROM user_roles
JOIN roles ON roles.role_id = user_roles.role_id
WHERE users.id = user_roles.user_id;

ALTER TABLE users ALTER COLUMN role SET DEFAULT 'TEACHER';
ALTER TABLE users ALTER COLUMN role SET NOT NULL;

DROP TABLE user_roles;
DROP TABLE roles;

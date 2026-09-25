ALTER TYPE user_role RENAME TO user_role_old;

CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'TEACHER', 'HOMEROOM_TEACHER');

ALTER TABLE users
    ALTER COLUMN role DROP DEFAULT,
    ALTER COLUMN role TYPE user_role USING (
        CASE role::text
            WHEN 'ADMIN' THEN 'SUPER_ADMIN'
            WHEN 'MEMBER' THEN 'TEACHER'
            WHEN 'USER' THEN 'TEACHER'
        END
    )::user_role,
    ALTER COLUMN role SET DEFAULT 'TEACHER';

DROP TYPE user_role_old;

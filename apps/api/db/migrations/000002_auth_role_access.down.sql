ALTER TYPE user_role RENAME TO user_role_new;

CREATE TYPE user_role AS ENUM ('ADMIN', 'MEMBER', 'USER');

ALTER TABLE users
    ALTER COLUMN role DROP DEFAULT,
    ALTER COLUMN role TYPE user_role USING (
        CASE role::text
            WHEN 'SUPER_ADMIN' THEN 'ADMIN'
            WHEN 'TEACHER' THEN 'USER'
            WHEN 'HOMEROOM_TEACHER' THEN 'MEMBER'
        END
    )::user_role,
    ALTER COLUMN role SET DEFAULT 'USER';

DROP TYPE user_role_new;

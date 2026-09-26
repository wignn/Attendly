DROP INDEX IF EXISTS idx_classes_homeroom_teacher_id;
DROP INDEX IF EXISTS idx_classes_academic_year_id;
DROP INDEX IF EXISTS idx_classes_name_unique;
DROP INDEX IF EXISTS idx_classes_code_unique;

ALTER TABLE classes
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS academic_year_id,
    DROP COLUMN IF EXISTS section,
    DROP COLUMN IF EXISTS grade,
    DROP COLUMN IF EXISTS code;

CREATE UNIQUE INDEX IF NOT EXISTS classes_name_key ON classes(name);

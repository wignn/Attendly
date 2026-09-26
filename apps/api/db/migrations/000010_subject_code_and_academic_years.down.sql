DROP INDEX IF EXISTS idx_subjects_name_unique;
DROP INDEX IF EXISTS idx_subjects_code_unique;

ALTER TABLE subjects
    DROP COLUMN IF EXISTS deleted_at,
    DROP COLUMN IF EXISTS updated_at,
    DROP COLUMN IF EXISTS code;

CREATE UNIQUE INDEX IF NOT EXISTS subjects_name_key ON subjects(name);

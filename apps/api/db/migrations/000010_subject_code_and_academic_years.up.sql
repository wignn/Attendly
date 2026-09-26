ALTER TABLE subjects
    ADD COLUMN code VARCHAR(50),
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN deleted_at TIMESTAMPTZ;

UPDATE subjects
SET code = 'SUBJ-' || SUBSTRING(id::text FROM 1 FOR 8)
WHERE code IS NULL;

ALTER TABLE subjects
    ALTER COLUMN code SET NOT NULL;

DROP INDEX IF EXISTS subjects_name_key;

CREATE UNIQUE INDEX idx_subjects_code_unique ON subjects (code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_subjects_name_unique ON subjects (name) WHERE deleted_at IS NULL;

ALTER TABLE classes
    ADD COLUMN code VARCHAR(50),
    ADD COLUMN grade VARCHAR(20) NOT NULL DEFAULT '',
    ADD COLUMN section VARCHAR(20) NOT NULL DEFAULT '',
    ADD COLUMN academic_year_id UUID REFERENCES academic_years(id) ON DELETE SET NULL,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN deleted_at TIMESTAMPTZ;

UPDATE classes
SET code = 'CLS-' || SUBSTRING(id::text FROM 1 FOR 8)
WHERE code IS NULL;

ALTER TABLE classes ALTER COLUMN code SET NOT NULL;

DROP INDEX IF EXISTS classes_name_key;

CREATE UNIQUE INDEX idx_classes_code_unique ON classes (code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_classes_name_unique ON classes (name) WHERE deleted_at IS NULL;
CREATE INDEX idx_classes_academic_year_id ON classes (academic_year_id);
CREATE INDEX idx_classes_homeroom_teacher_id ON classes (homeroom_teacher_id);

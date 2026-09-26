ALTER TABLE students
    ADD COLUMN nisn VARCHAR(50),
    ADD COLUMN deleted_at TIMESTAMPTZ,
    ADD COLUMN updated_at TIMESTAMPTZ;
UPDATE students SET updated_at = created_at;
ALTER TABLE students
    ALTER COLUMN updated_at SET DEFAULT NOW(),
    ALTER COLUMN updated_at SET NOT NULL;

CREATE UNIQUE INDEX idx_students_nisn_unique
    ON students (nisn)
    WHERE nisn IS NOT NULL;

ALTER TABLE attendance_records
    DROP CONSTRAINT attendance_records_student_id_fkey;
ALTER TABLE attendance_records
    ADD CONSTRAINT attendance_records_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE RESTRICT;

CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    valid_from DATE NOT NULL,
    valid_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT student_enrollments_valid_range CHECK (valid_to IS NULL OR valid_to > valid_from)
);

INSERT INTO student_enrollments (student_id, class_id, valid_from)
SELECT id, class_id, created_at::date
FROM students;

CREATE UNIQUE INDEX idx_student_enrollments_one_open
    ON student_enrollments (student_id)
    WHERE valid_to IS NULL;
CREATE INDEX idx_student_enrollments_history
    ON student_enrollments (student_id, valid_from DESC, id);
CREATE INDEX idx_student_enrollments_current_class
    ON student_enrollments (class_id, student_id)
    WHERE valid_to IS NULL;

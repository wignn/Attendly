DROP TABLE student_enrollments;

ALTER TABLE attendance_records
    DROP CONSTRAINT attendance_records_student_id_fkey;
ALTER TABLE attendance_records
    ADD CONSTRAINT attendance_records_student_id_fkey
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE;

DROP INDEX idx_students_nisn_unique;
ALTER TABLE students
    DROP COLUMN deleted_at,
    DROP COLUMN updated_at,
    DROP COLUMN nisn;

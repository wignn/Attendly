ALTER TABLE students
    ALTER COLUMN student_number SET NOT NULL;

COMMENT ON COLUMN students.student_number IS NULL;

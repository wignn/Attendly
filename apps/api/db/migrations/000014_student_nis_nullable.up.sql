ALTER TABLE students
    ALTER COLUMN student_number DROP NOT NULL;

COMMENT ON COLUMN students.student_number IS
    'Optional school-issued NIS; NULL means no NIS has been assigned.';

DROP TABLE IF EXISTS grades;
DROP TABLE IF EXISTS schedules;
DROP TABLE IF EXISTS attendance_records;
DROP TABLE IF EXISTS attendance_sessions;
DROP TABLE IF EXISTS class_subjects;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS subjects;
DROP TABLE IF EXISTS classes;

-- Note: enum values added to user_role (TEACHER, STUDENT) are intentionally not
-- removed. PostgreSQL cannot drop enum values, and doing so would require
-- recreating the type; leaving them is harmless.

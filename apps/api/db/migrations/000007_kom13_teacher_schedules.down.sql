-- Refuse to discard year-specific assignment history if it cannot fit the old
-- unique teacher/class/subject key.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM class_schedules) THEN
        RAISE EXCEPTION 'cannot roll back KOM-13 while schedules exist';
    END IF;
    IF EXISTS (
        SELECT 1 FROM teaching_assignments
        GROUP BY teacher_id, class_id, subject_id
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'cannot roll back KOM-13: multiple assignment periods share one teacher/class/subject';
    END IF;
END;
$$;

DROP TABLE IF EXISTS class_schedules;
DROP TRIGGER IF EXISTS teaching_assignments_protect_scope ON teaching_assignments;
DROP FUNCTION IF EXISTS kom13_assignment_protect_scope();
DROP TRIGGER IF EXISTS academic_years_protect_dates ON academic_years;
DROP FUNCTION IF EXISTS kom13_academic_year_protect_dates();
DROP FUNCTION IF EXISTS kom13_schedule_set_scope();

DROP INDEX IF EXISTS teaching_assignments_teacher_year_idx;
DROP INDEX IF EXISTS teaching_assignments_active_scope_idx;
ALTER TABLE teaching_assignments
    DROP CONSTRAINT IF EXISTS teaching_assignments_teacher_id_fkey,
    DROP CONSTRAINT IF EXISTS teaching_assignments_class_id_fkey,
    DROP CONSTRAINT IF EXISTS teaching_assignments_subject_id_fkey,
    ADD CONSTRAINT teaching_assignments_teacher_id_fkey
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
    ADD CONSTRAINT teaching_assignments_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    ADD CONSTRAINT teaching_assignments_subject_id_fkey
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    ADD CONSTRAINT teaching_assignments_teacher_id_class_id_subject_id_key
        UNIQUE (teacher_id, class_id, subject_id),
    DROP COLUMN academic_year_id,
    DROP COLUMN active,
    DROP COLUMN updated_at;

DROP TABLE IF EXISTS academic_years;

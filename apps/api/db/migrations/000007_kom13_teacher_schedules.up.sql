CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    semester SMALLINT NOT NULL CHECK (semester IN (1, 2)),
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT academic_years_dates_check CHECK (starts_on <= ends_on),
    CONSTRAINT academic_years_name_semester_key UNIQUE (name, semester),
    CONSTRAINT academic_years_dates_excl EXCLUDE USING gist (
        daterange(starts_on, ends_on + 1, '[)') WITH &&
    )
);

CREATE UNIQUE INDEX academic_years_one_active_idx ON academic_years (active) WHERE active;

-- Make a usable school term available on both fresh and existing databases.
-- Pre-KOM-13 assignments are associated with this Jakarta term; attendance
-- sessions retain their own historical teacher/class/subject snapshot.
WITH school_clock AS (
    SELECT (NOW() AT TIME ZONE 'Asia/Jakarta')::date AS today
), term AS (
    SELECT EXTRACT(YEAR FROM today)::int AS calendar_year,
           EXTRACT(MONTH FROM today)::int AS calendar_month
    FROM school_clock
)
INSERT INTO academic_years (id, name, semester, starts_on, ends_on, active)
SELECT '00000000-0000-4000-8000-000000000013'::uuid,
       (calendar_year - CASE WHEN calendar_month < 7 THEN 1 ELSE 0 END)::text
           || '/' || (calendar_year + CASE WHEN calendar_month >= 7 THEN 1 ELSE 0 END)::text,
       CASE WHEN calendar_month >= 7 THEN 1 ELSE 2 END,
       CASE WHEN calendar_month >= 7 THEN make_date(calendar_year, 7, 1)
            ELSE make_date(calendar_year, 1, 1) END,
       CASE WHEN calendar_month >= 7 THEN make_date(calendar_year, 12, 31)
            ELSE make_date(calendar_year, 6, 30) END,
       TRUE
FROM term;

ALTER TABLE teaching_assignments
    ADD COLUMN academic_year_id UUID REFERENCES academic_years(id) ON DELETE RESTRICT,
    ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE teaching_assignments
SET academic_year_id = '00000000-0000-4000-8000-000000000013'::uuid
WHERE academic_year_id IS NULL;

ALTER TABLE teaching_assignments
    ALTER COLUMN academic_year_id SET NOT NULL,
    DROP CONSTRAINT IF EXISTS teaching_assignments_teacher_id_class_id_subject_id_key,
    DROP CONSTRAINT IF EXISTS teaching_assignments_teacher_id_fkey,
    DROP CONSTRAINT IF EXISTS teaching_assignments_class_id_fkey,
    DROP CONSTRAINT IF EXISTS teaching_assignments_subject_id_fkey,
    ADD CONSTRAINT teaching_assignments_teacher_id_fkey
        FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE RESTRICT,
    ADD CONSTRAINT teaching_assignments_class_id_fkey
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE RESTRICT,
    ADD CONSTRAINT teaching_assignments_subject_id_fkey
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX teaching_assignments_active_scope_idx
    ON teaching_assignments (teacher_id, class_id, subject_id, academic_year_id)
    WHERE active;
CREATE INDEX teaching_assignments_teacher_year_idx
    ON teaching_assignments (teacher_id, academic_year_id, active);

CREATE TABLE class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teaching_assignment_id UUID NOT NULL REFERENCES teaching_assignments(id) ON DELETE RESTRICT,
    -- The trigger fills these from the assignment. They make concurrent overlap
    -- checks enforceable by exclusion constraints rather than application locks.
    teacher_id UUID NOT NULL,
    class_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    starts_at TIME NOT NULL,
    ends_at TIME NOT NULL,
    effective_from DATE NOT NULL,
    effective_until DATE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT class_schedules_times_check CHECK (starts_at < ends_at),
    CONSTRAINT class_schedules_dates_check
        CHECK (effective_until IS NULL OR effective_until >= effective_from),
    CONSTRAINT class_schedules_teacher_no_overlap EXCLUDE USING gist (
        teacher_id WITH =,
        academic_year_id WITH =,
        day_of_week WITH =,
        daterange(effective_from, effective_until + 1, '[)') WITH &&,
        numrange(EXTRACT(EPOCH FROM starts_at), EXTRACT(EPOCH FROM ends_at), '[)') WITH &&
    ) WHERE (active),
    CONSTRAINT class_schedules_class_no_overlap EXCLUDE USING gist (
        class_id WITH =,
        academic_year_id WITH =,
        day_of_week WITH =,
        daterange(effective_from, effective_until + 1, '[)') WITH &&,
        numrange(EXTRACT(EPOCH FROM starts_at), EXTRACT(EPOCH FROM ends_at), '[)') WITH &&
    ) WHERE (active)
);

CREATE INDEX class_schedules_assignment_idx ON class_schedules (teaching_assignment_id);
CREATE INDEX class_schedules_day_active_idx
    ON class_schedules (day_of_week, active, effective_from, effective_until);

CREATE FUNCTION kom13_schedule_set_scope() RETURNS TRIGGER AS $$
DECLARE
    assignment RECORD;
BEGIN
    SELECT ta.teacher_id, ta.class_id, ta.academic_year_id, ta.active AS assignment_active,
           ay.starts_on, ay.ends_on
    INTO assignment
    FROM teaching_assignments ta
    JOIN academic_years ay ON ay.id = ta.academic_year_id
    WHERE ta.id = NEW.teaching_assignment_id
    FOR SHARE OF ta;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'teaching assignment does not exist'
            USING ERRCODE = '23503', CONSTRAINT = 'class_schedules_teaching_assignment_id_fkey';
    END IF;
    IF NEW.active AND NOT assignment.assignment_active THEN
        RAISE EXCEPTION 'active schedule requires an active teaching assignment'
            USING ERRCODE = '23514', CONSTRAINT = 'class_schedules_active_assignment_check';
    END IF;
    IF NEW.effective_from < assignment.starts_on OR NEW.effective_from > assignment.ends_on
       OR (NEW.effective_until IS NOT NULL AND NEW.effective_until > assignment.ends_on) THEN
        RAISE EXCEPTION 'schedule dates must lie within its academic period'
            USING ERRCODE = '23514', CONSTRAINT = 'class_schedules_academic_dates_check';
    END IF;

    NEW.teacher_id := assignment.teacher_id;
    NEW.class_id := assignment.class_id;
    NEW.academic_year_id := assignment.academic_year_id;
    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at := NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER class_schedules_set_scope
    BEFORE INSERT OR UPDATE ON class_schedules
    FOR EACH ROW EXECUTE FUNCTION kom13_schedule_set_scope();

-- A schedule describes a fixed assignment. Reassigning its teacher, class,
-- subject or period in place would silently rewrite what the schedule means.
CREATE FUNCTION kom13_assignment_protect_scope() RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.teacher_id, OLD.class_id, OLD.subject_id, OLD.academic_year_id)
       IS DISTINCT FROM (NEW.teacher_id, NEW.class_id, NEW.subject_id, NEW.academic_year_id)
       AND EXISTS (SELECT 1 FROM class_schedules WHERE teaching_assignment_id = OLD.id) THEN
        RAISE EXCEPTION 'assignment with schedules cannot change teacher, class, subject or academic period'
            USING ERRCODE = '23514', CONSTRAINT = 'teaching_assignments_scheduled_scope_check';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER teaching_assignments_protect_scope
    BEFORE UPDATE ON teaching_assignments
    FOR EACH ROW EXECUTE FUNCTION kom13_assignment_protect_scope();

-- Changing term boundaries after assignments exist could invalidate their
-- schedules and the database overlap guarantees.
CREATE FUNCTION kom13_academic_year_protect_dates() RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.starts_on, OLD.ends_on) IS DISTINCT FROM (NEW.starts_on, NEW.ends_on)
       AND EXISTS (SELECT 1 FROM teaching_assignments WHERE academic_year_id = OLD.id) THEN
        RAISE EXCEPTION 'academic period with assignments cannot change dates'
            USING ERRCODE = '23514', CONSTRAINT = 'academic_years_assigned_dates_check';
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER academic_years_protect_dates
    BEFORE UPDATE ON academic_years
    FOR EACH ROW EXECUTE FUNCTION kom13_academic_year_protect_dates();

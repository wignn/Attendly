BEGIN;

ALTER TABLE public.class_schedules
  ADD COLUMN IF NOT EXISTS period_no smallint;

ALTER TABLE public.class_schedules
  ALTER COLUMN starts_at DROP NOT NULL;

ALTER TABLE public.class_schedules
  ALTER COLUMN ends_at DROP NOT NULL;

ALTER TABLE public.class_schedules
  DROP CONSTRAINT IF EXISTS class_schedules_period_mode_check;

ALTER TABLE public.class_schedules
  ADD CONSTRAINT class_schedules_period_mode_check
  CHECK (
    (starts_at IS NULL AND ends_at IS NULL AND period_no IS NOT NULL)
    OR
    (starts_at IS NOT NULL AND ends_at IS NOT NULL AND starts_at < ends_at)
  );

ALTER TABLE public.class_schedules
  DROP CONSTRAINT IF EXISTS class_schedules_period_no_check;

ALTER TABLE public.class_schedules
  ADD CONSTRAINT class_schedules_period_no_check
  CHECK (period_no IS NULL OR period_no BETWEEN 1 AND 9);

ALTER TABLE public.class_schedules
  DROP CONSTRAINT IF EXISTS class_schedules_class_no_overlap;

ALTER TABLE public.class_schedules
  DROP CONSTRAINT IF EXISTS class_schedules_teacher_no_overlap;

ALTER TABLE public.class_schedules
  ADD CONSTRAINT class_schedules_class_no_overlap
  EXCLUDE USING gist (
    class_id WITH =,
    academic_year_id WITH =,
    day_of_week WITH =,
    daterange(effective_from, effective_until + 1, '[)') WITH &&,
    numrange(
      EXTRACT(epoch FROM starts_at),
      EXTRACT(epoch FROM ends_at),
      '[)'
    ) WITH &&
  )
  WHERE (active AND starts_at IS NOT NULL AND ends_at IS NOT NULL);

ALTER TABLE public.class_schedules
  ADD CONSTRAINT class_schedules_teacher_no_overlap
  EXCLUDE USING gist (
    teacher_id WITH =,
    academic_year_id WITH =,
    day_of_week WITH =,
    daterange(effective_from, effective_until + 1, '[)') WITH &&,
    numrange(
      EXTRACT(epoch FROM starts_at),
      EXTRACT(epoch FROM ends_at),
      '[)'
    ) WITH &&
  )
  WHERE (active AND starts_at IS NOT NULL AND ends_at IS NOT NULL);

ALTER TABLE public.class_schedules
  DROP CONSTRAINT IF EXISTS class_schedules_class_period_no_overlap;

ALTER TABLE public.class_schedules
  DROP CONSTRAINT IF EXISTS class_schedules_teacher_period_no_overlap;

ALTER TABLE public.class_schedules
  ADD CONSTRAINT class_schedules_class_period_no_overlap
  EXCLUDE USING gist (
    class_id WITH =,
    academic_year_id WITH =,
    day_of_week WITH =,
    period_no WITH =,
    daterange(effective_from, effective_until + 1, '[)') WITH &&
  )
  WHERE (active AND period_no IS NOT NULL);

ALTER TABLE public.class_schedules
  ADD CONSTRAINT class_schedules_teacher_period_no_overlap
  EXCLUDE USING gist (
    teacher_id WITH =,
    academic_year_id WITH =,
    day_of_week WITH =,
    period_no WITH =,
    daterange(effective_from, effective_until + 1, '[)') WITH &&
  )
  WHERE (active AND period_no IS NOT NULL);

COMMIT;
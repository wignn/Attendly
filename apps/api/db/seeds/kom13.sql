-- Optional development period. Running this file again leaves existing data
-- unchanged and never creates placeholder teachers, classes or subjects.
INSERT INTO academic_years (id, name, semester, starts_on, ends_on, active)
SELECT '00000000-0000-4000-8000-000000000026'::uuid,
       '2026/2027', 1, DATE '2026-07-01', DATE '2026-12-31',
       NOT EXISTS (SELECT 1 FROM academic_years WHERE active)
WHERE NOT EXISTS (
    SELECT 1 FROM academic_years
    WHERE daterange(starts_on, ends_on + 1, '[)')
          && daterange(DATE '2026-07-01', DATE '2027-01-01', '[)')
)
ON CONFLICT DO NOTHING;

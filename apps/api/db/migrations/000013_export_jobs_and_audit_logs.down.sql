DROP TABLE IF EXISTS export_jobs;
DROP INDEX IF EXISTS idx_audit_events_actor;
DROP INDEX IF EXISTS idx_audit_events_entity;
ALTER TABLE audit_events DROP COLUMN IF EXISTS details;

import { describe, it, expect } from "vitest";
import {
  AuditLogRecordSchema,
  AuditLogFilterSchema,
  CreateExportInputSchema,
  ExportJobSchema,
} from "./audit-export";

describe("Audit Log and Export Schemas", () => {
  it("should validate valid audit log record", () => {
    const record = {
      id: "11111111-1111-4111-8111-111111111111",
      actor_id: "22222222-2222-4222-8222-222222222222",
      actor_name: "Admin Utama",
      action: "CREATE",
      entity: "ATTENDANCE_SESSION",
      entity_id: "33333333-3333-4333-8333-333333333333",
      details: { class_id: "7A", count: 30 },
      created_at: "2026-09-27T08:00:00Z",
    };
    const parsed = AuditLogRecordSchema.safeParse(record);
    expect(parsed.success).toBe(true);
  });

  it("should validate audit log record with null actor_id and details", () => {
    const record = {
      id: "11111111-1111-4111-8111-111111111111",
      actor_id: null,
      actor_name: null,
      action: "SYSTEM_JOB",
      entity: "EXPORT",
      entity_id: "33333333-3333-4333-8333-333333333333",
      details: null,
      created_at: "2026-09-27T08:00:00Z",
    };
    const parsed = AuditLogRecordSchema.safeParse(record);
    expect(parsed.success).toBe(true);
  });

  it("should validate audit log filter params", () => {
    const filter = {
      action: "UPDATE",
      entity: "STUDENT",
      from_date: "2026-09-01",
      to_date: "2026-09-30",
      page: 1,
      per_page: 20,
    };
    const parsed = AuditLogFilterSchema.safeParse(filter);
    expect(parsed.success).toBe(true);
  });

  it("should validate export create input with required file format", () => {
    const input = {
      file_format: "XLSX",
      from_date: "2026-09-01",
      to_date: "2026-09-27",
    };
    const parsed = CreateExportInputSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.file_format).toBe("XLSX");
      expect(parsed.data.export_type).toBe("ATTENDANCE");
    }
  });

  it("should reject export create input with invalid format", () => {
    const input = {
      file_format: "DOCX",
    };
    const parsed = CreateExportInputSchema.safeParse(input);
    expect(parsed.success).toBe(false);
  });

  it("should validate export job response schema", () => {
    const job = {
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "22222222-2222-4222-8222-222222222222",
      export_type: "ATTENDANCE",
      file_format: "CSV",
      status: "COMPLETED",
      filter_params: { from_date: "2026-09-01" },
      download_url: "/api/v1/exports/11111111-1111-4111-8111-111111111111",
      expires_at: "2026-09-28T08:00:00Z",
      created_at: "2026-09-27T08:00:00Z",
      updated_at: "2026-09-27T08:00:00Z",
    };
    const parsed = ExportJobSchema.safeParse(job);
    expect(parsed.success).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import {
  SubjectRecordSchema,
  SubjectCreateSchema,
  SubjectUpdateSchema,
  SubjectFilterSchema,
} from "./subject";
import { SubjectOptionSchema } from "./attendance";

describe("Subject Types Validation", () => {
  it("should validate a valid subject record", () => {
    const validSubject = {
      id: "12345678-1234-4234-8234-123456789012",
      code: "MAT",
      name: "Matematika",
      created_at: "2026-09-01T08:00:00Z",
      updated_at: "2026-09-01T08:00:00Z",
      deleted_at: null,
    };
    const result = SubjectRecordSchema.safeParse(validSubject);
    expect(result.success).toBe(true);
  });

  it("should validate subject create payload", () => {
    const payload = {
      code: "IPA",
      name: "Ilmu Pengetahuan Alam",
    };
    const result = SubjectCreateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject subject create with empty code or name", () => {
    const payload = {
      code: "   ",
      name: "",
    };
    const result = SubjectCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate subject update payload", () => {
    const payload = {
      name: "Matematika Tingkat Lanjut",
    };
    const result = SubjectUpdateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject subject update with empty string if provided", () => {
    const payload = {
      name: "   ",
    };
    const result = SubjectUpdateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate subject filter options", () => {
    const filter = {
      q: "matematika",
      page: 1,
      per_page: 20,
    };
    const result = SubjectFilterSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });

  it("should validate subject option item", () => {
    const option = {
      id: "12345678-1234-4234-8234-123456789012",
      code: "BIN",
      name: "Bahasa Indonesia",
    };
    const result = SubjectOptionSchema.safeParse(option);
    expect(result.success).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import {
  StudentRecordSchema,
  StudentCreateSchema,
  StudentUpdateSchema,
  StudentTransferSchema,
  StudentEnrollmentSchema,
} from "./student";

describe("Student Types Validation", () => {
  it("should validate a valid student record", () => {
    const validStudent = {
      id: "11111111-1111-4111-8111-111111111111",
      nis: "20260701",
      nisn: "0081234567",
      full_name: "Aditya Pratama",
      class_id: "22222222-2222-4222-8222-222222222222",
      current_class_name: "7A",
      status: "ACTIVE",
      created_at: "2026-09-26T10:00:00Z",
      updated_at: "2026-09-26T10:00:00Z",
      deleted_at: null,
    };
    const result = StudentRecordSchema.safeParse(validStudent);
    expect(result.success).toBe(true);
  });

  it("should validate student create payload", () => {
    const payload = {
      nis: "20260701",
      nisn: "0081234567",
      full_name: "Aditya Pratama",
      class_id: "22222222-2222-4222-8222-222222222222",
      effective_on: "2026-09-01",
    };
    const result = StudentCreateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should allow student create with null or omitted NIS", () => {
    const base = {
      full_name: "Aditya Pratama",
      class_id: "22222222-2222-4222-8222-222222222222",
    };
    expect(StudentCreateSchema.safeParse({ ...base, nis: null }).success).toBe(true);
    expect(StudentCreateSchema.safeParse(base).success).toBe(true);
  });

  it("should allow null NIS on student records", () => {
    const result = StudentRecordSchema.safeParse({
      id: "11111111-1111-4111-8111-111111111111",
      nis: null,
      full_name: "Aditya Pratama",
      class_id: "22222222-2222-4222-8222-222222222222",
      current_class_name: "7A",
      status: "ACTIVE",
      created_at: "2026-09-26T10:00:00Z",
      updated_at: "2026-09-26T10:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("should reject student create with invalid class_id uuid", () => {
    const payload = {
      nis: "20260701",
      full_name: "Aditya Pratama",
      class_id: "invalid-uuid",
    };
    const result = StudentCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate student update payload", () => {
    const payload = {
      full_name: "Aditya Pratama Updated",
      status: "INACTIVE",
    };
    const result = StudentUpdateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate student transfer payload", () => {
    const payload = {
      class_id: "33333333-3333-4333-8333-333333333333",
      effective_on: "2026-09-27",
    };
    const result = StudentTransferSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate student enrollment history item", () => {
    const enrollment = {
      id: "44444444-4444-4444-8444-444444444444",
      student_id: "11111111-1111-4111-8111-111111111111",
      class_id: "22222222-2222-4222-8222-222222222222",
      class_name: "7A",
      valid_from: "2026-07-15",
      valid_to: "2026-09-27",
      created_at: "2026-07-15T08:00:00Z",
    };
    const result = StudentEnrollmentSchema.safeParse(enrollment);
    expect(result.success).toBe(true);
  });
});

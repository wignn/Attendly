import { describe, it, expect } from "vitest";
import {
  TeacherRecordSchema,
  TeacherCreateSchema,
  TeacherUpdateSchema,
  TeachingAssignmentRecordSchema,
} from "./teacher";

describe("Teacher Types Validation", () => {
  it("should validate a valid teacher record", () => {
    const validTeacher = {
      id: "11111111-1111-4111-8111-111111111111",
      user_id: "22222222-2222-4222-8222-222222222222",
      nip: "198504122010012004",
      full_name: "Siti Rahmawati, S.Pd.",
      email: "siti@smpn1tirtajaya.sch.id",
      phone: "081234567890",
      status: "ACTIVE",
      created_at: "2026-09-26T10:00:00Z",
      updated_at: "2026-09-26T10:00:00Z",
      deleted_at: null,
    };
    const result = TeacherRecordSchema.safeParse(validTeacher);
    expect(result.success).toBe(true);
  });

  it("should validate teacher create payload", () => {
    const payload = {
      nip: "198504122010012004",
      full_name: "Siti Rahmawati, S.Pd.",
      email: "siti@smpn1tirtajaya.sch.id",
      phone: "081234567890",
    };
    const result = TeacherCreateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject teacher create payload with invalid email", () => {
    const payload = {
      nip: "198504122010012004",
      full_name: "Siti Rahmawati, S.Pd.",
      email: "not-an-email",
    };
    const result = TeacherCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should reject teacher create payload with missing nip", () => {
    const payload = {
      nip: "",
      full_name: "Siti Rahmawati, S.Pd.",
      email: "siti@example.com",
    };
    const result = TeacherCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate teacher update payload with status toggle", () => {
    const payload = {
      status: "INACTIVE",
    };
    const result = TeacherUpdateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate a valid teaching assignment record", () => {
    const payload = {
      id: "11111111-1111-4111-8111-111111111111",
      teacher_id: "22222222-2222-4222-8222-222222222222",
      class_id: "33333333-3333-4333-8333-333333333333",
      subject_id: "44444444-4444-4444-8444-444444444444",
      academic_year_id: "55555555-5555-4555-8555-555555555555",
      active: true,
      created_at: "2026-09-26T10:00:00Z",
      updated_at: "2026-09-26T10:00:00Z",
    };
    const result = TeachingAssignmentRecordSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});


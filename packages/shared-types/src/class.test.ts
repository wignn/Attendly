import { describe, it, expect } from "vitest";
import {
  ClassDetailSchema,
  ClassCreateSchema,
  ClassUpdateSchema,
  ClassStudentItemSchema,
  AddStudentToClassSchema,
  AcademicYearRecordSchema,
} from "./class";

describe("Class Types Validation", () => {
  it("should validate a valid class detail record", () => {
    const validClass = {
      id: "11111111-1111-4111-8111-111111111111",
      code: "7A",
      name: "Kelas 7A",
      grade: "7",
      section: "A",
      academic_year_id: "22222222-2222-4222-8222-222222222222",
      academic_year_name: "2026/2027 Ganjil",
      homeroom_teacher_id: "33333333-3333-4333-8333-333333333333",
      homeroom_teacher_name: "Budi Santoso, S.Pd",
      total_students: 32,
      created_at: "2026-09-01T08:00:00Z",
      updated_at: "2026-09-01T08:00:00Z",
      deleted_at: null,
    };
    const result = ClassDetailSchema.safeParse(validClass);
    expect(result.success).toBe(true);
  });

  it("should validate class create payload", () => {
    const payload = {
      code: "8B",
      name: "Kelas 8B",
      grade: "8",
      section: "B",
      academic_year_id: "22222222-2222-4222-8222-222222222222",
      homeroom_teacher_id: "33333333-3333-4333-8333-333333333333",
    };
    const result = ClassCreateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject class create when missing code or name", () => {
    const payload = {
      code: "",
      name: "",
      grade: "7",
      section: "A",
    };
    const result = ClassCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate class update payload with clear_homeroom_teacher", () => {
    const payload = {
      name: "Kelas 7A Unggulan",
      clear_homeroom_teacher: true,
    };
    const result = ClassUpdateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate class student roster item", () => {
    const student = {
      student_id: "44444444-4444-4444-8444-444444444444",
      nis: "20260701",
      nisn: "0081234567",
      full_name: "Muhammad Rizki",
      active: true,
      valid_from: "2026-07-15T00:00:00Z",
      enrolled_at: "2026-07-15T08:00:00Z",
    };
    const result = ClassStudentItemSchema.safeParse(student);
    expect(result.success).toBe(true);
  });

  it("should validate add student to class payload", () => {
    const payload = {
      student_id: "44444444-4444-4444-8444-444444444444",
      effective_date: "2026-09-27",
    };
    const result = AddStudentToClassSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate academic year record", () => {
    const record = {
      id: "22222222-2222-4222-8222-222222222222",
      name: "2026/2027 Ganjil",
      semester: 1,
      starts_on: "2026-07-15",
      ends_on: "2026-12-20",
      active: true,
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-01T00:00:00Z",
    };
    const result = AcademicYearRecordSchema.safeParse(record);
    expect(result.success).toBe(true);
  });
});

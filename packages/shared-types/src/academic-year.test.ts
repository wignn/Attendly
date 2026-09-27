import { describe, it, expect } from "vitest";
import {
  AcademicYearRecordSchema,
  AcademicYearCreateSchema,
  AcademicYearUpdateSchema,
  AcademicYearFilterSchema,
} from "./academic-year";

describe("Academic Year Types Validation", () => {
  it("should validate a valid academic year record", () => {
    const valid = {
      id: "22222222-2222-4222-8222-222222222222",
      name: "2026/2027 Ganjil",
      semester: 1,
      starts_on: "2026-07-15",
      ends_on: "2026-12-20",
      active: true,
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-01T00:00:00Z",
    };
    const result = AcademicYearRecordSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should validate academic year create payload", () => {
    const payload = {
      name: "2026/2027 Genap",
      semester: 2,
      starts_on: "2027-01-05",
      ends_on: "2027-06-25",
      active: false,
    };
    const result = AcademicYearCreateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject academic year create when start date is after end date", () => {
    const payload = {
      name: "2026/2027 Ganjil",
      semester: 1,
      starts_on: "2026-12-25",
      ends_on: "2026-07-01",
      active: false,
    };
    const result = AcademicYearCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should reject academic year create when semester is not 1 or 2", () => {
    const payload = {
      name: "2026/2027 Pendek",
      semester: 3,
      starts_on: "2026-07-01",
      ends_on: "2026-08-01",
      active: false,
    };
    const result = AcademicYearCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate academic year update payload", () => {
    const payload = {
      name: "2026/2027 Semester 1 Revisi",
      ends_on: "2026-12-30",
    };
    const result = AcademicYearUpdateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate academic year filter options", () => {
    const filter = {
      active: true,
      page: 1,
      per_page: 20,
    };
    const result = AcademicYearFilterSchema.safeParse(filter);
    expect(result.success).toBe(true);
  });
});

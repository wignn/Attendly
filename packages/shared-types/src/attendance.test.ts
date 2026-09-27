import { describe, it, expect } from "vitest";
import {
  AttendanceSessionDetailSchema,
  AttendanceRecordItemSchema,
  CreateAttendanceSessionSchema,
  UpdateAttendanceRecordsSchema,
  SubmitSessionSchema,
  ReopenSessionSchema,
  ScheduleItemSchema,
  ClassOptionSchema,
  SubjectOptionSchema,
} from "./attendance";

describe("Attendance Shared Types Validation", () => {
  it("should validate a valid attendance record item", () => {
    const payload = {
      student_id: "44444444-4444-4444-8444-444444444444",
      student_nis: "20260701",
      student_name: "Aditya Pratama",
      status: "PRESENT",
      remarks: "Hadir tepat waktu",
    };

    const result = AttendanceRecordItemSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate a valid attendance session detail payload", () => {
    const payload = {
      id: "11111111-1111-4111-8111-111111111111",
      schedule_id: "22222222-2222-4222-8222-222222222222",
      class_id: "33333333-3333-4333-8333-333333333333",
      class_name: "Kelas 7A",
      subject_id: "44444444-4444-4444-8444-444444444444",
      subject_name: "Bahasa Indonesia",
      teacher_id: "55555555-5555-4555-8555-555555555555",
      teacher_name: "Budi Santoso, M.Pd",
      held_at: "2026-09-27T07:30:00Z",
      status: "DRAFT",
      version: 1,
      submitted_by: null,
      submitted_at: null,
      reopened_by: null,
      reopened_at: null,
      reopen_reason: null,
      total_students: 28,
      present_count: 26,
      excused_count: 1,
      sick_count: 1,
      absent_count: 0,
      records: [
        {
          student_id: "66666666-6666-4666-8666-666666666666",
          student_nis: "20260701",
          student_name: "Aditya Pratama",
          status: "PRESENT",
          remarks: "",
        },
      ],
      created_at: "2026-09-27T07:30:00Z",
      updated_at: "2026-09-27T07:30:00Z",
    };

    const result = AttendanceSessionDetailSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate create attendance session input", () => {
    const payload = {
      schedule_id: "22222222-2222-4222-8222-222222222222",
      date: "2026-09-27",
    };

    const result = CreateAttendanceSessionSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject invalid date format in create session", () => {
    const payload = {
      schedule_id: "22222222-2222-4222-8222-222222222222",
      date: "27-09-2026",
    };

    const result = CreateAttendanceSessionSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate update attendance records payload", () => {
    const payload = {
      version: 1,
      records: [
        {
          student_id: "66666666-6666-4666-8666-666666666666",
          status: "EXCUSED",
          remarks: "Izin lomba sains",
        },
      ],
    };

    const result = UpdateAttendanceRecordsSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject invalid status in update attendance records", () => {
    const payload = {
      version: 1,
      records: [
        {
          student_id: "66666666-6666-4666-8666-666666666666",
          status: "INVALID_STATUS",
          remarks: "",
        },
      ],
    };

    const result = UpdateAttendanceRecordsSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate submit session payload", () => {
    const payload = { version: 2 };
    const result = SubmitSessionSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate reopen session payload", () => {
    const payload = { reason: "Koreksi data siswa sakit" };
    const result = ReopenSessionSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject empty reopen reason", () => {
    const payload = { reason: "" };
    const result = ReopenSessionSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate schedule item payload", () => {
    const payload = {
      id: "11111111-1111-4111-8111-111111111111",
      teaching_assignment_id: "22222222-2222-4222-8222-222222222222",
      teacher_id: "33333333-3333-4333-8333-333333333333",
      class_id: "44444444-4444-4444-8444-444444444444",
      subject_id: "55555555-5555-4555-8555-555555555555",
      academic_year_id: "66666666-6666-4666-8666-666666666666",
      day_of_week: 3,
      starts_at: "07:30",
      ends_at: "09:00",
      effective_from: "2026-07-01",
      effective_until: null,
      active: true,
      created_at: "2026-07-01T00:00:00Z",
      updated_at: "2026-07-01T00:00:00Z",
    };

    const result = ScheduleItemSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate class option schema", () => {
    const payload = {
      id: "11111111-1111-4111-8111-111111111111",
      code: "7A",
      name: "Kelas 7A",
      grade: "7",
      section: "A",
    };
    const result = ClassOptionSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate subject option schema", () => {
    const payload = {
      id: "22222222-2222-4222-8222-222222222222",
      code: "BINDO",
      name: "Bahasa Indonesia",
    };
    const result = SubjectOptionSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

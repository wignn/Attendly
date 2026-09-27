import { describe, it, expect } from "vitest";
import {
  HomeroomDashboardSchema,
  ClassAttendanceReportSchema,
  StudentAttendanceSummarySchema,
} from "./homeroom";

describe("Homeroom Shared Types Validation", () => {
  it("should validate a valid homeroom dashboard payload", () => {
    const payload = {
      attendance: {
        present: 25,
        excused: 2,
        sick: 1,
        unexcused_absent: 0,
        total_recorded_sessions: 28,
      },
      attendance_rate: 89.28,
      classes: [
        {
          class: {
            id: "11111111-1111-4111-8111-111111111111",
            name: "Kelas 7A",
            homeroom_teacher_id: "22222222-2222-4222-8222-222222222222",
          },
          subject: {
            id: "33333333-3333-4333-8333-333333333333",
            name: "Bahasa Indonesia",
          },
          counts: {
            present: 25,
            excused: 2,
            sick: 1,
            unexcused_absent: 0,
            total_recorded_sessions: 28,
          },
          attendance_rate: 89.28,
        },
      ],
    };

    const result = HomeroomDashboardSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate a valid class attendance report payload", () => {
    const payload = {
      class: {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Kelas 7A",
        homeroom_teacher_id: "22222222-2222-4222-8222-222222222222",
      },
      subject: null,
      counts: {
        present: 25,
        excused: 2,
        sick: 1,
        unexcused_absent: 0,
        total_recorded_sessions: 28,
      },
      attendance_rate: 89.28,
      students: [
        {
          student: {
            id: "44444444-4444-4444-8444-444444444444",
            student_number: "20260701",
            full_name: "Aditya Pratama",
            class_id: "11111111-1111-4111-8111-111111111111",
            active: true,
          },
          counts: {
            present: 24,
            excused: 0,
            sick: 0,
            unexcused_absent: 0,
            total_recorded_sessions: 24,
          },
          attendance_rate: 100,
        },
      ],
    };

    const result = ClassAttendanceReportSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate a valid student attendance summary payload", () => {
    const payload = {
      student: {
        id: "44444444-4444-4444-8444-444444444444",
        student_number: "20260701",
        full_name: "Aditya Pratama",
        class_id: "11111111-1111-4111-8111-111111111111",
        active: true,
      },
      counts: {
        present: 22,
        excused: 1,
        sick: 1,
        unexcused_absent: 0,
        total_recorded_sessions: 24,
      },
      attendance_rate: 91.67,
    };

    const result = StudentAttendanceSummarySchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject payload when student UUID is invalid", () => {
    const invalidPayload = {
      student: {
        id: "not-a-uuid",
        student_number: "20260701",
        full_name: "Aditya Pratama",
        class_id: "11111111-1111-4111-8111-111111111111",
        active: true,
      },
      counts: {
        present: 20,
        excused: 0,
        sick: 0,
        unexcused_absent: 0,
        total_recorded_sessions: 20,
      },
      attendance_rate: 100,
    };

    const result = StudentAttendanceSummarySchema.safeParse(invalidPayload);
    expect(result.success).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  AdminDashboardSchema,
  AdminActivitySchema,
  AttendanceCountsSchema,
} from "./dashboard";

describe("Dashboard Types Validation", () => {
  it("should validate attendance counts payload", () => {
    const validCounts = {
      present: 120,
      excused: 5,
      sick: 3,
      unexcused_absent: 2,
      total_recorded_sessions: 130,
    };
    const result = AttendanceCountsSchema.safeParse(validCounts);
    expect(result.success).toBe(true);
  });

  it("should validate admin dashboard payload from backend", () => {
    const validDashboard = {
      date: "2026-09-26",
      total_students: 1248,
      total_teachers: 56,
      attendance: {
        present: 1100,
        excused: 40,
        sick: 25,
        unexcused_absent: 10,
        total_recorded_sessions: 1175,
      },
      attendance_rate_today: 93.6,
      active_classes: 36,
    };
    const result = AdminDashboardSchema.safeParse(validDashboard);
    expect(result.success).toBe(true);
  });

  it("should reject admin dashboard payload with invalid field types", () => {
    const invalidDashboard = {
      date: 12345, // must be string
      total_students: "lots",
      total_teachers: 56,
      attendance: null,
      attendance_rate_today: 93.6,
    };
    const result = AdminDashboardSchema.safeParse(invalidDashboard);
    expect(result.success).toBe(false);
  });

  it("should validate admin activity payload", () => {
    const validActivity = {
      id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      actor_id: "00000000-0000-4000-8000-000000000000",
      action: "VIEW",
      entity: "ADMIN_DASHBOARD",
      entity_id: "00000000-0000-4000-8000-000000000000",
      created_at: "2026-09-26T08:30:00Z",
    };
    const result = AdminActivitySchema.safeParse(validActivity);
    expect(result.success).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import {
  ScheduleCreateSchema,
  ScheduleUpdateSchema,
  ScheduleFilterSchema,
} from "./schedule";
import {
  TeachingAssignmentCreateSchema,
  TeachingAssignmentUpdateSchema,
  TeachingAssignmentFilterSchema,
} from "./teacher";

describe("Teaching Assignment and Schedule Validation", () => {
  it("should validate teaching assignment create payload", () => {
    const payload = {
      teacher_id: "11111111-1111-4111-8111-111111111111",
      class_id: "22222222-2222-4222-8222-222222222222",
      subject_id: "33333333-3333-4333-8333-333333333333",
      academic_year_id: "44444444-4444-4444-8444-444444444444",
    };
    const result = TeachingAssignmentCreateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject teaching assignment create payload with invalid uuid", () => {
    const payload = {
      teacher_id: "not-a-uuid",
      class_id: "22222222-2222-4222-8222-222222222222",
      subject_id: "33333333-3333-4333-8333-333333333333",
      academic_year_id: "44444444-4444-4444-8444-444444444444",
    };
    const result = TeachingAssignmentCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate teaching assignment update payload", () => {
    const payload = {
      teacher_id: "11111111-1111-4111-8111-111111111111",
    };
    const result = TeachingAssignmentUpdateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate schedule create payload", () => {
    const payload = {
      teaching_assignment_id: "11111111-1111-4111-8111-111111111111",
      day_of_week: 1,
      starts_at: "07:30",
      ends_at: "09:00",
      effective_from: "2026-07-01",
      effective_until: null,
    };
    const result = ScheduleCreateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should reject schedule create payload with invalid day_of_week", () => {
    const payload = {
      teaching_assignment_id: "11111111-1111-4111-8111-111111111111",
      day_of_week: 8,
      starts_at: "07:30",
      ends_at: "09:00",
      effective_from: "2026-07-01",
    };
    const result = ScheduleCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should reject schedule create payload with invalid time format", () => {
    const payload = {
      teaching_assignment_id: "11111111-1111-4111-8111-111111111111",
      day_of_week: 1,
      starts_at: "7:30",
      ends_at: "09:00",
      effective_from: "2026-07-01",
    };
    const result = ScheduleCreateSchema.safeParse(payload);
    expect(result.success).toBe(false);
  });

  it("should validate schedule update payload", () => {
    const payload = {
      day_of_week: 2,
      starts_at: "08:00",
      ends_at: "09:30",
    };
    const result = ScheduleUpdateSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("should validate schedule filter payload", () => {
    const payload = {
      day_of_week: 3,
      page: 1,
      per_page: 20,
    };
    const result = ScheduleFilterSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});

import { z } from "zod";

export const AttendanceCountsSchema = z.object({
  present: z.number(),
  excused: z.number(),
  sick: z.number(),
  unexcused_absent: z.number(),
  total_recorded_sessions: z.number(),
});
export type AttendanceCountsDto = z.infer<typeof AttendanceCountsSchema>;

export const AdminDashboardSchema = z.object({
  date: z.string(),
  total_students: z.number(),
  total_teachers: z.number(),
  attendance: AttendanceCountsSchema,
  attendance_rate_today: z.number(),
  active_classes: z.number().optional(),
});
export type AdminDashboardDto = z.infer<typeof AdminDashboardSchema>;

export const AdminActivitySchema = z.object({
  id: z.string(),
  actor_id: z.string(),
  action: z.string(),
  entity: z.string(),
  entity_id: z.string(),
  created_at: z.string(),
});
export type AdminActivityDto = z.infer<typeof AdminActivitySchema>;

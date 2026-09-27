import { z } from "zod";
import { AttendanceCountsSchema } from "./dashboard";

export const SchoolClassSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  homeroom_teacher_id: z.string().uuid(),
});
export type SchoolClassSummaryDto = z.infer<typeof SchoolClassSummarySchema>;

export const SubjectSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});
export type SubjectSummaryDto = z.infer<typeof SubjectSummarySchema>;

export const SubjectClassReportSchema = z.object({
  class: SchoolClassSummarySchema,
  subject: SubjectSummarySchema,
  counts: AttendanceCountsSchema,
  attendance_rate: z.number(),
});
export type SubjectClassReportDto = z.infer<typeof SubjectClassReportSchema>;

export const HomeroomDashboardSchema = z.object({
  attendance: AttendanceCountsSchema,
  attendance_rate: z.number(),
  classes: z.array(SubjectClassReportSchema),
});
export type HomeroomDashboardDto = z.infer<typeof HomeroomDashboardSchema>;

export const StudentSummaryRecordSchema = z.object({
  id: z.string().uuid(),
  student_number: z.string(),
  full_name: z.string(),
  class_id: z.string().uuid(),
  active: z.boolean(),
});
export type StudentSummaryRecordDto = z.infer<typeof StudentSummaryRecordSchema>;

export const StudentAttendanceSummarySchema = z.object({
  student: StudentSummaryRecordSchema,
  counts: AttendanceCountsSchema,
  attendance_rate: z.number(),
});
export type StudentAttendanceSummaryDto = z.infer<typeof StudentAttendanceSummarySchema>;

export const ClassAttendanceReportSchema = z.object({
  class: SchoolClassSummarySchema,
  subject: SubjectSummarySchema.optional().nullable(),
  counts: AttendanceCountsSchema,
  attendance_rate: z.number(),
  students: z.array(StudentAttendanceSummarySchema),
});
export type ClassAttendanceReportDto = z.infer<typeof ClassAttendanceReportSchema>;

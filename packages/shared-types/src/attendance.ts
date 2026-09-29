import { z } from "zod";

export const AttendanceStatusEnum = z.enum([
  "PRESENT",
  "EXCUSED",
  "SICK",
  "UNEXCUSED_ABSENT",
]);
export type AttendanceStatus = z.infer<typeof AttendanceStatusEnum>;

export const AttendanceSessionStatusEnum = z.enum([
  "DRAFT",
  "SUBMITTED",
  "REOPENED",
]);
export type AttendanceSessionStatus = z.infer<
  typeof AttendanceSessionStatusEnum
>;

export const AttendanceRecordItemSchema = z.object({
  student_id: z.string().uuid(),
  student_nis: z.string(),
  student_name: z.string(),
  status: AttendanceStatusEnum,
  remarks: z.string().default(""),
  recorded_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type AttendanceRecordItemDto = z.infer<
  typeof AttendanceRecordItemSchema
>;

export const AttendanceSessionDetailSchema = z.object({
  id: z.string().uuid(),
  schedule_id: z.string().uuid().optional().nullable(),
  class_id: z.string().uuid(),
  class_name: z.string(),
  subject_id: z.string().uuid(),
  subject_name: z.string(),
  teacher_id: z.string().uuid(),
  teacher_name: z.string(),
  held_at: z.string(),
  status: AttendanceSessionStatusEnum,
  version: z.number().int(),
  submitted_by: z.string().uuid().optional().nullable(),
  submitted_at: z.string().optional().nullable(),
  reopened_by: z.string().uuid().optional().nullable(),
  reopened_at: z.string().optional().nullable(),
  reopen_reason: z.string().optional().nullable(),
  total_students: z.number().int(),
  present_count: z.number().int(),
  excused_count: z.number().int(),
  sick_count: z.number().int(),
  absent_count: z.number().int(),
  records: z.array(AttendanceRecordItemSchema).default([]),
  created_at: z.string(),
  updated_at: z.string(),
});
export type AttendanceSessionDetailDto = z.infer<
  typeof AttendanceSessionDetailSchema
>;

export const CreateAttendanceSessionSchema = z.object({
  schedule_id: z.string().uuid().optional().nullable(),
  class_id: z.string().uuid().optional().nullable(),
  subject_id: z.string().uuid().optional().nullable(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
    .optional(),
});
export type CreateAttendanceSessionDto = z.infer<
  typeof CreateAttendanceSessionSchema
>;

export const RecordUpdateItemSchema = z.object({
  student_id: z.string().uuid(),
  status: AttendanceStatusEnum,
  remarks: z.string().default(""),
});
export type RecordUpdateItemDto = z.infer<typeof RecordUpdateItemSchema>;

export const UpdateAttendanceRecordsSchema = z.object({
  version: z.number().int(),
  records: z.array(RecordUpdateItemSchema),
});
export type UpdateAttendanceRecordsDto = z.infer<
  typeof UpdateAttendanceRecordsSchema
>;

export const SubmitSessionSchema = z.object({
  version: z.number().int(),
});
export type SubmitSessionDto = z.infer<typeof SubmitSessionSchema>;

export const ReopenSessionSchema = z.object({
  reason: z.string().min(1, "Alasan pembukaan kembali wajib diisi"),
});
export type ReopenSessionDto = z.infer<typeof ReopenSessionSchema>;

export const ScheduleItemSchema = z.object({
  id: z.string().uuid(),
  teaching_assignment_id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  class_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
  day_of_week: z.number().int(),
  period_no: z.number().int().nullable().optional(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  effective_from: z.string(),
  effective_until: z.string().optional().nullable(),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ScheduleItemDto = z.infer<typeof ScheduleItemSchema>;

export interface AttendanceSessionFilterDto {
  class_id?: string;
  subject_id?: string;
  teacher_id?: string;
  status?: string;
  date?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  per_page?: number;
}

export const ClassOptionSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  grade: z.string().optional(),
  section: z.string().optional(),
});
export type ClassOptionDto = z.infer<typeof ClassOptionSchema>;

export const SubjectOptionSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
});
export type SubjectOptionDto = z.infer<typeof SubjectOptionSchema>;


import { z } from "zod";

export const TeacherStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);
export type TeacherStatus = z.infer<typeof TeacherStatusEnum>;

export const TeacherRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  nip: z.string(),
  full_name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  status: TeacherStatusEnum,
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});
export type TeacherRecordDto = z.infer<typeof TeacherRecordSchema>;

export const TeacherCreateSchema = z.object({
  nip: z.string().min(1, { message: "NIP wajib diisi" }),
  full_name: z.string().min(1, { message: "Nama lengkap wajib diisi" }),
  email: z.string().email({ message: "Format email tidak valid" }),
  phone: z.string().optional(),
});
export type TeacherCreateDto = z.infer<typeof TeacherCreateSchema>;

export const TeacherUpdateSchema = z.object({
  nip: z.string().min(1).optional(),
  full_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: TeacherStatusEnum.optional(),
});
export type TeacherUpdateDto = z.infer<typeof TeacherUpdateSchema>;

export const TeacherFilterSchema = z.object({
  q: z.string().optional(),
  status: z.string().optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
});
export type TeacherFilterDto = z.infer<typeof TeacherFilterSchema>;

export const TeachingAssignmentRecordSchema = z.object({
  id: z.string().uuid(),
  teacher_id: z.string().uuid(),
  class_id: z.string().uuid(),
  subject_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type TeachingAssignmentRecordDto = z.infer<
  typeof TeachingAssignmentRecordSchema
>;

export const TeachingAssignmentCreateSchema = z.object({
  teacher_id: z.string().uuid({ message: "Guru wajib dipilih" }),
  class_id: z.string().uuid({ message: "Kelas wajib dipilih" }),
  subject_id: z.string().uuid({ message: "Mata pelajaran wajib dipilih" }),
  academic_year_id: z.string().uuid({ message: "Tahun ajaran wajib dipilih" }),
});
export type TeachingAssignmentCreateDto = z.infer<
  typeof TeachingAssignmentCreateSchema
>;

export const TeachingAssignmentUpdateSchema = z.object({
  teacher_id: z.string().uuid().optional(),
  class_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  academic_year_id: z.string().uuid().optional(),
});
export type TeachingAssignmentUpdateDto = z.infer<
  typeof TeachingAssignmentUpdateSchema
>;

export const TeachingAssignmentFilterSchema = z.object({
  teacher_id: z.string().optional(),
  class_id: z.string().optional(),
  subject_id: z.string().optional(),
  academic_year_id: z.string().optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
});
export type TeachingAssignmentFilterDto = z.infer<
  typeof TeachingAssignmentFilterSchema
>;



import { z } from "zod";

export const StudentStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);
export type StudentStatus = z.infer<typeof StudentStatusEnum>;

export const StudentRecordSchema = z.object({
  id: z.string().uuid(),
  nis: z.string(),
  nisn: z.string().nullable().optional(),
  full_name: z.string(),
  class_id: z.string().uuid(),
  current_class_name: z.string(),
  status: StudentStatusEnum,
  deleted_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type StudentRecordDto = z.infer<typeof StudentRecordSchema>;

export const StudentCreateSchema = z.object({
  nis: z.string().min(1, { message: "NIS wajib diisi" }),
  nisn: z.string().nullable().optional(),
  full_name: z.string().min(1, { message: "Nama lengkap wajib diisi" }),
  class_id: z.string().uuid({ message: "Kelas wajib dipilih" }),
  effective_on: z.string().optional(),
});
export type StudentCreateDto = z.infer<typeof StudentCreateSchema>;

export const StudentUpdateSchema = z.object({
  nis: z.string().min(1).optional(),
  nisn: z.string().nullable().optional(),
  full_name: z.string().min(1).optional(),
  status: StudentStatusEnum.optional(),
});
export type StudentUpdateDto = z.infer<typeof StudentUpdateSchema>;

export const StudentTransferSchema = z.object({
  class_id: z.string().uuid({ message: "Kelas tujuan wajib dipilih" }),
  effective_on: z.string().optional(),
});
export type StudentTransferDto = z.infer<typeof StudentTransferSchema>;

export const StudentEnrollmentSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  class_id: z.string().uuid(),
  class_name: z.string(),
  valid_from: z.string(),
  valid_to: z.string().nullable().optional(),
  created_at: z.string(),
});
export type StudentEnrollmentDto = z.infer<typeof StudentEnrollmentSchema>;

export const StudentFilterSchema = z.object({
  search: z.string().optional(),
  class_id: z.string().optional(),
  status: z.string().optional(),
  include_deleted: z.boolean().optional(),
  sort_by: z.enum(["nis", "full_name", "class_name", "created_at"]).optional(),
  sort_order: z.enum(["asc", "desc"]).optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
});
export type StudentFilterDto = z.infer<typeof StudentFilterSchema>;

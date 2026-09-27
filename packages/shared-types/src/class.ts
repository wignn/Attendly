import { z } from "zod";

export const ClassDetailSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  grade: z.string(),
  section: z.string(),
  academic_year_id: z.string().uuid().nullable().optional(),
  academic_year_name: z.string().optional(),
  homeroom_teacher_id: z.string().uuid().nullable().optional(),
  homeroom_teacher_name: z.string().optional(),
  total_students: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});
export type ClassDetailDto = z.infer<typeof ClassDetailSchema>;

export const ClassCreateSchema = z.object({
  code: z.string().min(1, { message: "Kode kelas wajib diisi" }),
  name: z.string().min(1, { message: "Nama kelas wajib diisi" }),
  grade: z.string().min(1, { message: "Tingkat kelas wajib diisi" }),
  section: z.string().min(1, { message: "Rombel / seksi wajib diisi" }),
  academic_year_id: z.string().uuid().nullable().optional(),
  homeroom_teacher_id: z.string().uuid().nullable().optional(),
});
export type ClassCreateDto = z.infer<typeof ClassCreateSchema>;

export const ClassUpdateSchema = z.object({
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  grade: z.string().min(1).optional(),
  section: z.string().min(1).optional(),
  academic_year_id: z.string().uuid().nullable().optional(),
  homeroom_teacher_id: z.string().uuid().nullable().optional(),
  clear_homeroom_teacher: z.boolean().optional(),
});
export type ClassUpdateDto = z.infer<typeof ClassUpdateSchema>;

export const ClassFilterSchema = z.object({
  academic_year_id: z.string().optional(),
  homeroom_teacher_id: z.string().optional(),
  q: z.string().optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
});
export type ClassFilterDto = z.infer<typeof ClassFilterSchema>;

export const ClassStudentItemSchema = z.object({
  student_id: z.string().uuid(),
  nis: z.string(),
  nisn: z.string().nullable().optional(),
  full_name: z.string(),
  active: z.boolean(),
  valid_from: z.string(),
  enrolled_at: z.string(),
});
export type ClassStudentItemDto = z.infer<typeof ClassStudentItemSchema>;

export const AddStudentToClassSchema = z.object({
  student_id: z.string().uuid({ message: "Siswa wajib dipilih" }),
  effective_date: z.string().optional(),
});
export type AddStudentToClassDto = z.infer<typeof AddStudentToClassSchema>;

import { z } from "zod";

export const AcademicYearRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, { message: "Nama tahun ajaran wajib diisi" }),
  semester: z.number().int().min(1).max(2, { message: "Semester harus 1 atau 2" }),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal mulai harus YYYY-MM-DD" }),
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Format tanggal selesai harus YYYY-MM-DD" }),
  active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type AcademicYearRecordDto = z.infer<typeof AcademicYearRecordSchema>;

export const AcademicYearCreateSchema = z.object({
  name: z.string().trim().min(1, { message: "Nama tahun ajaran wajib diisi" }),
  semester: z.number().int().min(1).max(2, { message: "Semester harus 1 (Ganjil) atau 2 (Genap)" }),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Tanggal mulai harus valid (YYYY-MM-DD)" }),
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: "Tanggal selesai harus valid (YYYY-MM-DD)" }),
  active: z.boolean().default(false),
}).refine(
  (data) => data.starts_on <= data.ends_on,
  {
    message: "Tanggal mulai tidak boleh lebih lambat dari tanggal selesai",
    path: ["ends_on"],
  }
);
export type AcademicYearCreateDto = z.infer<typeof AcademicYearCreateSchema>;

export const AcademicYearUpdateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  semester: z.number().int().min(1).max(2).optional(),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(
  (data) => {
    if (data.starts_on && data.ends_on) {
      return data.starts_on <= data.ends_on;
    }
    return true;
  },
  {
    message: "Tanggal mulai tidak boleh lebih lambat dari tanggal selesai",
    path: ["ends_on"],
  }
);
export type AcademicYearUpdateDto = z.infer<typeof AcademicYearUpdateSchema>;

export const AcademicYearFilterSchema = z.object({
  active: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
});
export type AcademicYearFilterDto = z.infer<typeof AcademicYearFilterSchema>;

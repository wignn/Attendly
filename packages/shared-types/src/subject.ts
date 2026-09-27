import { z } from "zod";

export const SubjectRecordSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1, { message: "Kode mata pelajaran wajib diisi" }),
  name: z.string().min(1, { message: "Nama mata pelajaran wajib diisi" }),
  created_at: z.string(),
  updated_at: z.string(),
  deleted_at: z.string().nullable().optional(),
});
export type SubjectRecordDto = z.infer<typeof SubjectRecordSchema>;

export const SubjectCreateSchema = z.object({
  code: z.string().trim().min(1, { message: "Kode mata pelajaran wajib diisi" }),
  name: z.string().trim().min(1, { message: "Nama mata pelajaran wajib diisi" }),
});
export type SubjectCreateDto = z.infer<typeof SubjectCreateSchema>;

export const SubjectUpdateSchema = z.object({
  code: z.string().trim().min(1, { message: "Kode mata pelajaran tidak boleh kosong" }).optional(),
  name: z.string().trim().min(1, { message: "Nama mata pelajaran tidak boleh kosong" }).optional(),
});
export type SubjectUpdateDto = z.infer<typeof SubjectUpdateSchema>;

export const SubjectFilterSchema = z.object({
  q: z.string().optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
});
export type SubjectFilterDto = z.infer<typeof SubjectFilterSchema>;

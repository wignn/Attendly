import { z } from "zod";

export const ScheduleCreateSchema = z.object({
  teaching_assignment_id: z
    .string()
    .uuid({ message: "Penugasan mengajar wajib dipilih" }),
  day_of_week: z
    .number()
    .int()
    .min(1)
    .max(7, { message: "Hari wajib antara 1 (Senin) hingga 7 (Minggu)" }),
  starts_at: z
    .string()
    .regex(/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
      message: "Format jam mulai tidak valid (HH:MM)",
    }),
  ends_at: z
    .string()
    .regex(/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/, {
      message: "Format jam selesai tidak valid (HH:MM)",
    }),
  effective_from: z
    .string()
    .min(1, { message: "Tanggal mulai berlaku wajib diisi" }),
  effective_until: z.string().nullable().optional(),
});
export type ScheduleCreateDto = z.infer<typeof ScheduleCreateSchema>;

export const ScheduleUpdateSchema = z.object({
  teaching_assignment_id: z.string().uuid().optional(),
  day_of_week: z.number().int().min(1).max(7).optional(),
  starts_at: z
    .string()
    .regex(/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .optional(),
  ends_at: z
    .string()
    .regex(/^([01][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .optional(),
  effective_from: z.string().optional(),
  effective_until: z.string().nullable().optional(),
});
export type ScheduleUpdateDto = z.infer<typeof ScheduleUpdateSchema>;

export const ScheduleFilterSchema = z.object({
  teacher_id: z.string().optional(),
  class_id: z.string().optional(),
  subject_id: z.string().optional(),
  academic_year_id: z.string().optional(),
  day_of_week: z.number().int().min(1).max(7).optional(),
  on_date: z.string().optional(),
  active: z.boolean().optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
});
export type ScheduleFilterDto = z.infer<typeof ScheduleFilterSchema>;

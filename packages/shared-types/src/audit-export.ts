import { z } from "zod";

export const AuditLogRecordSchema = z.object({
  id: z.string().uuid(),
  actor_id: z.string().uuid().nullable().optional(),
  actor_name: z.string().nullable().optional(),
  actor_role: z.string().optional(),
  action: z.string(),
  entity: z.string(),
  entity_id: z.string().uuid(),
  details: z.record(z.unknown()).nullable().optional(),
  ip_address: z.string().optional(),
  created_at: z.string(),
});
export type AuditLogRecordDto = z.infer<typeof AuditLogRecordSchema>;

export const AuditLogFilterSchema = z.object({
  actor_id: z.string().optional(),
  entity: z.string().optional(),
  entity_id: z.string().optional(),
  action: z.string().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
  page: z.number().int().positive().optional(),
  per_page: z.number().int().positive().optional(),
});
export type AuditLogFilterDto = z.infer<typeof AuditLogFilterSchema>;

export const ExportFormatEnum = z.enum(["CSV", "XLSX", "PDF"]);
export type ExportFormat = z.infer<typeof ExportFormatEnum>;

export const ExportStatusEnum = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
]);
export type ExportStatus = z.infer<typeof ExportStatusEnum>;

export const CreateExportInputSchema = z.object({
  export_type: z.string().default("ATTENDANCE"),
  file_format: ExportFormatEnum,
  class_id: z.string().uuid().optional(),
  subject_id: z.string().uuid().optional(),
  from_date: z.string().optional(),
  to_date: z.string().optional(),
});
export type CreateExportInputDto = z.infer<typeof CreateExportInputSchema>;

export const ExportJobSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  export_type: z.string(),
  file_format: ExportFormatEnum,
  status: ExportStatusEnum,
  filter_params: z.record(z.unknown()).nullable().optional(),
  storage_key: z.string().optional(),
  download_url: z.string().optional(),
  error_message: z.string().nullable().optional(),
  expires_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type ExportJobDto = z.infer<typeof ExportJobSchema>;

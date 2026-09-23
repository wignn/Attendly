import { z } from "zod";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiErrorDetail {
  field: string;
  issue: string;
  code?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
}

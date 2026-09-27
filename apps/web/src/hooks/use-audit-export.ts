import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, fetchPaginatedApi, PaginatedResult } from "@/lib/api-client";
import {
  AuditLogRecordDto,
  AuditLogFilterDto,
  CreateExportInputDto,
  ExportJobDto,
} from "@komas/shared-types";

export function useAuditLogs(filter: AuditLogFilterDto = {}) {
  const {
    actor_id = "",
    entity = "",
    entity_id = "",
    action = "",
    from_date = "",
    to_date = "",
    page = 1,
    per_page = 20,
  } = filter;

  return useQuery({
    queryKey: [
      "audit-logs",
      { actor_id, entity, entity_id, action, from_date, to_date, page, per_page },
    ],
    queryFn: async (): Promise<PaginatedResult<AuditLogRecordDto[]>> => {
      const searchParams = new URLSearchParams();
      if (actor_id && actor_id !== "ALL") {
        searchParams.set("actor_id", actor_id);
      }
      if (entity && entity !== "ALL") {
        searchParams.set("entity", entity);
      }
      if (entity_id && entity_id !== "ALL") {
        searchParams.set("entity_id", entity_id);
      }
      if (action && action !== "ALL") {
        searchParams.set("action", action);
      }
      if (from_date.trim()) {
        searchParams.set("from_date", from_date.trim());
      }
      if (to_date.trim()) {
        searchParams.set("to_date", to_date.trim());
      }
      if (page) searchParams.set("page", page.toString());
      if (per_page) searchParams.set("per_page", per_page.toString());

      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/audit-logs${queryStr ? `?${queryStr}` : ""}`;
      return fetchPaginatedApi<AuditLogRecordDto[]>(endpoint);
    },
    staleTime: 1000 * 20, // 20s
    retry: 1,
  });
}

export function useAuditLog(id: string | null) {
  return useQuery({
    queryKey: ["audit-log", id],
    queryFn: () => fetchApi<AuditLogRecordDto>(`/api/v1/audit-logs/${id}`),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useCreateExport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExportInputDto) =>
      fetchApi<ExportJobDto>("/api/v1/exports/attendance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (job) => {
      queryClient.setQueryData(["export-job", job.id], job);
    },
  });
}

export function useExportJob(
  id: string | null,
  options?: { enabled?: boolean; refetchInterval?: number | false }
) {
  return useQuery({
    queryKey: ["export-job", id],
    queryFn: () => fetchApi<ExportJobDto>(`/api/v1/exports/${id}`),
    enabled: Boolean(id) && (options?.enabled ?? true),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === "COMPLETED" || data.status === "FAILED")) {
        return false;
      }
      return options?.refetchInterval ?? 2000; // Poll every 2s while in progress
    },
  });
}

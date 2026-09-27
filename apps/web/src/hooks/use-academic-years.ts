import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, fetchPaginatedApi, PaginatedResult } from "@/lib/api-client";
import {
  AcademicYearRecordDto,
  AcademicYearCreateDto,
  AcademicYearUpdateDto,
  AcademicYearFilterDto,
} from "@komas/shared-types";

export function useAcademicYears(filter: AcademicYearFilterDto = {}) {
  const { active, page = 1, per_page = 20 } = filter;

  return useQuery({
    queryKey: ["academic-years", { active, page, per_page }],
    queryFn: async (): Promise<PaginatedResult<AcademicYearRecordDto[]>> => {
      const searchParams = new URLSearchParams();
      if (typeof active === "boolean") {
        searchParams.set("active", active.toString());
      }
      if (page) searchParams.set("page", page.toString());
      if (per_page) searchParams.set("per_page", per_page.toString());

      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/academic-years${queryStr ? `?${queryStr}` : ""}`;
      return fetchPaginatedApi<AcademicYearRecordDto[]>(endpoint);
    },
    staleTime: 1000 * 30, // 30s
    retry: 1,
  });
}

export function useAcademicYear(id: string | null) {
  return useQuery({
    queryKey: ["academic-year", id],
    queryFn: () => fetchApi<AcademicYearRecordDto>(`/api/v1/academic-years/${id}`),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useCreateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AcademicYearCreateDto) =>
      fetchApi<AcademicYearRecordDto>("/api/v1/academic-years", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      queryClient.invalidateQueries({ queryKey: ["academic-years", "options"] });
    },
  });
}

export function useUpdateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AcademicYearUpdateDto }) =>
      fetchApi<AcademicYearRecordDto>(`/api/v1/academic-years/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      queryClient.invalidateQueries({ queryKey: ["academic-years", "options"] });
      queryClient.invalidateQueries({ queryKey: ["academic-year", id] });
    },
  });
}

export function useDeleteAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<void>(`/api/v1/academic-years/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      queryClient.invalidateQueries({ queryKey: ["academic-years", "options"] });
    },
  });
}

export function useActivateAcademicYear() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<AcademicYearRecordDto>(`/api/v1/academic-years/${id}/activate`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      queryClient.invalidateQueries({ queryKey: ["academic-years", "options"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

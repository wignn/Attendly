import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, fetchPaginatedApi, PaginatedResult } from "@/lib/api-client";
import {
  StudentRecordDto,
  StudentCreateDto,
  StudentUpdateDto,
  StudentTransferDto,
  StudentEnrollmentDto,
  StudentFilterDto,
} from "@komas/shared-types";

export function useStudents(filter: StudentFilterDto = {}) {
  const {
    search = "",
    class_id = "",
    status = "",
    include_deleted = false,
    sort_by = "created_at",
    sort_order = "asc",
    page = 1,
    per_page = 20,
  } = filter;

  return useQuery({
    queryKey: [
      "students",
      { search, class_id, status, include_deleted, sort_by, sort_order, page, per_page },
    ],
    queryFn: async (): Promise<PaginatedResult<StudentRecordDto[]>> => {
      const searchParams = new URLSearchParams();
      if (search.trim()) searchParams.set("search", search.trim());
      if (class_id && class_id !== "ALL") searchParams.set("class_id", class_id);
      if (status && status !== "ALL") searchParams.set("status", status);
      if (include_deleted) searchParams.set("include_deleted", "true");
      if (sort_by) searchParams.set("sort_by", sort_by);
      if (sort_order) searchParams.set("sort_order", sort_order);
      if (page) searchParams.set("page", page.toString());
      if (per_page) searchParams.set("per_page", per_page.toString());

      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/students${queryStr ? `?${queryStr}` : ""}`;
      return fetchPaginatedApi<StudentRecordDto[]>(endpoint);
    },
    staleTime: 1000 * 30, // 30s
    retry: 1,
  });
}

export function useStudent(id: string | null) {
  return useQuery({
    queryKey: ["student", id],
    queryFn: () => fetchApi<StudentRecordDto>(`/api/v1/students/${id}`),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useStudentEnrollments(id: string | null) {
  return useQuery({
    queryKey: ["student", id, "enrollments"],
    queryFn: () => fetchApi<StudentEnrollmentDto[]>(`/api/v1/students/${id}/enrollments`),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StudentCreateDto) =>
      fetchApi<StudentRecordDto>("/api/v1/students", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentUpdateDto }) =>
      fetchApi<StudentRecordDto>(`/api/v1/students/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useDeleteStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ id: string }>(`/api/v1/students/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useTransferStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StudentTransferDto }) =>
      fetchApi<StudentRecordDto>(`/api/v1/students/${id}/enrollments`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      queryClient.invalidateQueries({ queryKey: ["student", id] });
      queryClient.invalidateQueries({ queryKey: ["student", id, "enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, fetchPaginatedApi, PaginatedResult } from "@/lib/api-client";
import {
  SubjectRecordDto,
  SubjectCreateDto,
  SubjectUpdateDto,
  SubjectFilterDto,
} from "@komas/shared-types";

export interface TeachingAssignmentItemDto {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  class_id: string;
  class_name?: string;
  subject_id: string;
  subject_name?: string;
  academic_year_id: string;
  academic_year_name?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSubjects(filter: SubjectFilterDto = {}) {
  const { q = "", page = 1, per_page = 20 } = filter;

  return useQuery({
    queryKey: ["subjects", { q, page, per_page }],
    queryFn: async (): Promise<PaginatedResult<SubjectRecordDto[]>> => {
      const searchParams = new URLSearchParams();
      if (q.trim()) searchParams.set("q", q.trim());
      if (page) searchParams.set("page", page.toString());
      if (per_page) searchParams.set("per_page", per_page.toString());

      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/subjects${queryStr ? `?${queryStr}` : ""}`;
      return fetchPaginatedApi<SubjectRecordDto[]>(endpoint);
    },
    staleTime: 1000 * 30, // 30s
    retry: 1,
  });
}

export function useSubject(id: string | null) {
  return useQuery({
    queryKey: ["subject", id],
    queryFn: () => fetchApi<SubjectRecordDto>(`/api/v1/subjects/${id}`),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubjectCreateDto) =>
      fetchApi<SubjectRecordDto>("/api/v1/subjects", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubjectUpdateDto }) =>
      fetchApi<SubjectRecordDto>(`/api/v1/subjects/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["subject", id] });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<void>(`/api/v1/subjects/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
  });
}

export function useSubjectAssignments(subjectId: string | null) {
  return useQuery({
    queryKey: ["teaching-assignments", { subjectId }],
    queryFn: async (): Promise<PaginatedResult<TeachingAssignmentItemDto[]>> => {
      const searchParams = new URLSearchParams();
      if (subjectId) searchParams.set("subject_id", subjectId);
      searchParams.set("per_page", "50");

      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/teaching-assignments${queryStr ? `?${queryStr}` : ""}`;
      return fetchPaginatedApi<TeachingAssignmentItemDto[]>(endpoint);
    },
    enabled: Boolean(subjectId),
    staleTime: 1000 * 30,
  });
}

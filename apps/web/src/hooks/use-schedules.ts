import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, fetchPaginatedApi, PaginatedResult } from "@/lib/api-client";
import {
  ScheduleItemDto,
  ScheduleCreateDto,
  ScheduleUpdateDto,
  ScheduleFilterDto,
  TeachingAssignmentRecordDto,
  TeachingAssignmentCreateDto,
  TeachingAssignmentUpdateDto,
  TeachingAssignmentFilterDto,
} from "@komas/shared-types";

// --- Teaching Assignment Hooks ---

export function useTeachingAssignments(
  filter: TeachingAssignmentFilterDto = {}
) {
  const {
    teacher_id = "",
    class_id = "",
    subject_id = "",
    academic_year_id = "",
    page = 1,
    per_page = 50,
  } = filter;

  return useQuery({
    queryKey: [
      "teaching-assignments",
      { teacher_id, class_id, subject_id, academic_year_id, page, per_page },
    ],
    queryFn: async (): Promise<
      PaginatedResult<TeachingAssignmentRecordDto[]>
    > => {
      const searchParams = new URLSearchParams();
      if (teacher_id && teacher_id !== "ALL") {
        searchParams.set("teacher_id", teacher_id);
      }
      if (class_id && class_id !== "ALL") {
        searchParams.set("class_id", class_id);
      }
      if (subject_id && subject_id !== "ALL") {
        searchParams.set("subject_id", subject_id);
      }
      if (academic_year_id && academic_year_id !== "ALL") {
        searchParams.set("academic_year_id", academic_year_id);
      }
      if (page) searchParams.set("page", page.toString());
      if (per_page) searchParams.set("per_page", per_page.toString());

      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/teaching-assignments${
        queryStr ? `?${queryStr}` : ""
      }`;
      return fetchPaginatedApi<TeachingAssignmentRecordDto[]>(endpoint);
    },
    staleTime: 1000 * 30, // 30s
    retry: 1,
  });
}

export function useTeachingAssignment(id: string | null) {
  return useQuery({
    queryKey: ["teaching-assignment", id],
    queryFn: () =>
      fetchApi<TeachingAssignmentRecordDto>(
        `/api/v1/teaching-assignments/${id}`
      ),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useCreateTeachingAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TeachingAssignmentCreateDto) =>
      fetchApi<TeachingAssignmentRecordDto>("/api/v1/teaching-assignments", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaching-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

export function useUpdateTeachingAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: TeachingAssignmentUpdateDto;
    }) =>
      fetchApi<TeachingAssignmentRecordDto>(
        `/api/v1/teaching-assignments/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["teaching-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["teaching-assignment", id] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

export function useDeleteTeachingAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<void>(`/api/v1/teaching-assignments/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teaching-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

// --- Schedule Hooks ---

export function useSchedules(filter: ScheduleFilterDto = {}) {
  const {
    teacher_id = "",
    class_id = "",
    subject_id = "",
    academic_year_id = "",
    day_of_week,
    on_date = "",
    active,
    page = 1,
    per_page = 50,
  } = filter;

  return useQuery({
    queryKey: [
      "schedules",
      {
        teacher_id,
        class_id,
        subject_id,
        academic_year_id,
        day_of_week,
        on_date,
        active,
        page,
        per_page,
      },
    ],
    queryFn: async (): Promise<PaginatedResult<ScheduleItemDto[]>> => {
      const searchParams = new URLSearchParams();
      if (teacher_id && teacher_id !== "ALL") {
        searchParams.set("teacher_id", teacher_id);
      }
      if (class_id && class_id !== "ALL") {
        searchParams.set("class_id", class_id);
      }
      if (subject_id && subject_id !== "ALL") {
        searchParams.set("subject_id", subject_id);
      }
      if (academic_year_id && academic_year_id !== "ALL") {
        searchParams.set("academic_year_id", academic_year_id);
      }
      if (day_of_week && day_of_week >= 1 && day_of_week <= 7) {
        searchParams.set("day_of_week", day_of_week.toString());
      }
      if (on_date.trim()) {
        searchParams.set("on_date", on_date.trim());
      }
      if (typeof active === "boolean") {
        searchParams.set("active", active.toString());
      }
      if (page) searchParams.set("page", page.toString());
      if (per_page) searchParams.set("per_page", per_page.toString());

      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/schedules${queryStr ? `?${queryStr}` : ""}`;
      return fetchPaginatedApi<ScheduleItemDto[]>(endpoint);
    },
    staleTime: 1000 * 30, // 30s
    retry: 1,
  });
}

export function useTodaySchedules(page: number = 1, perPage: number = 50) {
  return useQuery({
    queryKey: ["schedules", "today", { page, perPage }],
    queryFn: async (): Promise<PaginatedResult<ScheduleItemDto[]>> => {
      const searchParams = new URLSearchParams();
      if (page) searchParams.set("page", page.toString());
      if (perPage) searchParams.set("per_page", perPage.toString());

      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/schedules/today${
        queryStr ? `?${queryStr}` : ""
      }`;
      return fetchPaginatedApi<ScheduleItemDto[]>(endpoint);
    },
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useSchedule(id: string | null) {
  return useQuery({
    queryKey: ["schedule", id],
    queryFn: () => fetchApi<ScheduleItemDto>(`/api/v1/schedules/${id}`),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ScheduleCreateDto) =>
      fetchApi<ScheduleItemDto>("/api/v1/schedules", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ScheduleUpdateDto }) =>
      fetchApi<ScheduleItemDto>(`/api/v1/schedules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
      queryClient.invalidateQueries({ queryKey: ["schedule", id] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<void>(`/api/v1/schedules/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedules"] });
    },
  });
}

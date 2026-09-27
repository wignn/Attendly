import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, fetchPaginatedApi, PaginatedResult } from "@/lib/api-client";
import {
  AttendanceSessionDetailDto,
  AttendanceSessionFilterDto,
  CreateAttendanceSessionDto,
  UpdateAttendanceRecordsDto,
  SubmitSessionDto,
  ScheduleItemDto,
} from "@komas/shared-types";

export function useAttendanceSessions(filter: AttendanceSessionFilterDto = {}) {
  const {
    date = "",
    class_id = "",
    subject_id = "",
    teacher_id = "",
    status = "",
    from_date = "",
    to_date = "",
    page = 1,
    per_page = 20,
  } = filter;

  return useQuery({
    queryKey: [
      "attendance-sessions",
      {
        date,
        class_id,
        subject_id,
        teacher_id,
        status,
        from_date,
        to_date,
        page,
        per_page,
      },
    ],
    queryFn: async (): Promise<PaginatedResult<AttendanceSessionDetailDto[]>> => {
      const searchParams = new URLSearchParams();
      if (date) searchParams.set("date", date);
      if (class_id) searchParams.set("class_id", class_id);
      if (subject_id) searchParams.set("subject_id", subject_id);
      if (teacher_id) searchParams.set("teacher_id", teacher_id);
      if (status && status !== "ALL") searchParams.set("status", status);
      if (from_date) searchParams.set("from_date", from_date);
      if (to_date) searchParams.set("to_date", to_date);
      if (page) searchParams.set("page", page.toString());
      if (per_page) searchParams.set("per_page", per_page.toString());

      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/attendance-sessions${
        queryStr ? `?${queryStr}` : ""
      }`;
      return fetchPaginatedApi<AttendanceSessionDetailDto[]>(endpoint);
    },
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useAttendanceSession(id: string | null) {
  return useQuery({
    queryKey: ["attendance-sessions", id],
    queryFn: () =>
      fetchApi<AttendanceSessionDetailDto>(`/api/v1/attendance-sessions/${id}`),
    enabled: Boolean(id),
    staleTime: 1000 * 10,
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
    staleTime: 1000 * 60,
    retry: 1,
  });
}

export function useCreateOrGetSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAttendanceSessionDto) =>
      fetchApi<AttendanceSessionDetailDto>("/api/v1/attendance-sessions", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["teachers", "me", "dashboard"] });
    },
  });
}

export function useUpdateAttendanceRecords() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAttendanceRecordsDto;
    }) =>
      fetchApi<AttendanceSessionDetailDto>(
        `/api/v1/attendance-sessions/${id}/records`,
        {
          method: "PUT",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions", id] });
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["teachers", "me", "dashboard"] });
    },
  });
}

export function useSubmitAttendanceSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SubmitSessionDto }) =>
      fetchApi<AttendanceSessionDetailDto>(
        `/api/v1/attendance-sessions/${id}/submit`,
        {
          method: "POST",
          body: JSON.stringify(data),
        }
      ),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions", id] });
      queryClient.invalidateQueries({ queryKey: ["attendance-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["teachers", "me", "dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

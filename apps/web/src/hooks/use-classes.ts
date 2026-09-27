import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi, fetchPaginatedApi, PaginatedResult } from "@/lib/api-client";
import {
  ClassDetailDto,
  ClassCreateDto,
  ClassUpdateDto,
  ClassFilterDto,
  ClassStudentItemDto,
  AddStudentToClassDto,
  AcademicYearRecordDto,
} from "@komas/shared-types";

export function useClasses(filter: ClassFilterDto = {}) {
  const {
    academic_year_id = "",
    homeroom_teacher_id = "",
    q = "",
    page = 1,
    per_page = 20,
  } = filter;

  return useQuery({
    queryKey: [
      "classes",
      { academic_year_id, homeroom_teacher_id, q, page, per_page },
    ],
    queryFn: async (): Promise<PaginatedResult<ClassDetailDto[]>> => {
      const searchParams = new URLSearchParams();
      if (q.trim()) searchParams.set("q", q.trim());
      if (academic_year_id && academic_year_id !== "ALL") {
        searchParams.set("academic_year_id", academic_year_id);
      }
      if (homeroom_teacher_id && homeroom_teacher_id !== "ALL") {
        searchParams.set("homeroom_teacher_id", homeroom_teacher_id);
      }
      if (page) searchParams.set("page", page.toString());
      if (per_page) searchParams.set("per_page", per_page.toString());

      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/classes${queryStr ? `?${queryStr}` : ""}`;
      return fetchPaginatedApi<ClassDetailDto[]>(endpoint);
    },
    staleTime: 1000 * 30, // 30s
    retry: 1,
  });
}

export function useClass(id: string | null) {
  return useQuery({
    queryKey: ["class", id],
    queryFn: () => fetchApi<ClassDetailDto>(`/api/v1/classes/${id}`),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

export function useClassStudents(
  classId: string | null,
  page: number = 1,
  perPage: number = 20
) {
  return useQuery({
    queryKey: ["classes", classId, "students", { page, perPage }],
    queryFn: async (): Promise<PaginatedResult<ClassStudentItemDto[]>> => {
      const searchParams = new URLSearchParams();
      if (page) searchParams.set("page", page.toString());
      if (perPage) searchParams.set("per_page", perPage.toString());

      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/classes/${classId}/students${
        queryStr ? `?${queryStr}` : ""
      }`;
      return fetchPaginatedApi<ClassStudentItemDto[]>(endpoint);
    },
    enabled: Boolean(classId),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useCreateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClassCreateDto) =>
      fetchApi<ClassDetailDto>("/api/v1/classes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useUpdateClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClassUpdateDto }) =>
      fetchApi<ClassDetailDto>(`/api/v1/classes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["class", id] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useDeleteClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<void>(`/api/v1/classes/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });
}

export function useAddStudentToClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      data,
    }: {
      classId: string;
      data: AddStudentToClassDto;
    }) =>
      fetchApi<void>(`/api/v1/classes/${classId}/students`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({ queryKey: ["classes", classId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["class", classId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useRemoveStudentFromClass() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      classId,
      studentId,
      effectiveDate,
    }: {
      classId: string;
      studentId: string;
      effectiveDate?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (effectiveDate) searchParams.set("effective_date", effectiveDate);
      const queryStr = searchParams.toString();
      const endpoint = `/api/v1/classes/${classId}/students/${studentId}${
        queryStr ? `?${queryStr}` : ""
      }`;
      return fetchApi<void>(endpoint, {
        method: "DELETE",
      });
    },
    onSuccess: (_, { classId }) => {
      queryClient.invalidateQueries({ queryKey: ["classes", classId, "students"] });
      queryClient.invalidateQueries({ queryKey: ["class", classId] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
}

export function useAcademicYearsOptions() {
  return useQuery({
    queryKey: ["academic-years", "options"],
    queryFn: async (): Promise<AcademicYearRecordDto[]> => {
      const result = await fetchPaginatedApi<AcademicYearRecordDto[]>(
        "/api/v1/academic-years?per_page=100"
      );
      return result.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 mins
  });
}

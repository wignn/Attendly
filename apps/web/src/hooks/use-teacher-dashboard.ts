import { useQuery } from "@tanstack/react-query";
import { fetchApi, fetchPaginatedApi, PaginatedResult } from "@/lib/api-client";
import {
  TeacherDashboardDto,
  SubjectClassReportDto,
  TeachingAssignmentRecordDto,
} from "@komas/shared-types";

export function useTeacherDashboard() {
  return useQuery({
    queryKey: ["teachers", "me", "dashboard"],
    queryFn: () =>
      fetchApi<TeacherDashboardDto>("/api/v1/teachers/me/dashboard"),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useSubjectAttendanceReport(
  subjectId: string | null,
  page: number = 1,
  perPage: number = 10
) {
  return useQuery({
    queryKey: ["reports", "subject-attendance", { subjectId, page, perPage }],
    queryFn: async (): Promise<PaginatedResult<SubjectClassReportDto[]>> => {
      const searchParams = new URLSearchParams();
      if (subjectId) searchParams.set("subject_id", subjectId);
      if (page) searchParams.set("page", page.toString());
      if (perPage) searchParams.set("per_page", perPage.toString());

      const queryStr = searchParams.toString();
      return fetchPaginatedApi<SubjectClassReportDto[]>(
        `/api/v1/reports/subject-attendance${queryStr ? `?${queryStr}` : ""}`
      );
    },
    enabled: Boolean(subjectId),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useTeacherAssignments(
  page: number = 1,
  perPage: number = 50
) {
  return useQuery({
    queryKey: ["teaching-assignments", { page, perPage }],
    queryFn: async (): Promise<PaginatedResult<TeachingAssignmentRecordDto[]>> => {
      const searchParams = new URLSearchParams();
      if (page) searchParams.set("page", page.toString());
      if (perPage) searchParams.set("per_page", perPage.toString());

      const queryStr = searchParams.toString();
      return fetchPaginatedApi<TeachingAssignmentRecordDto[]>(
        `/api/v1/teaching-assignments${queryStr ? `?${queryStr}` : ""}`
      );
    },
    staleTime: 1000 * 60,
    retry: 1,
  });
}


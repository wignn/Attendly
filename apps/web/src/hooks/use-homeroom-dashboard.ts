import { useQuery } from "@tanstack/react-query";
import { fetchApi, fetchPaginatedApi, PaginatedResult } from "@/lib/api-client";
import {
  HomeroomDashboardDto,
  ClassAttendanceReportDto,
  StudentAttendanceSummaryDto,
} from "@komas/shared-types";

export function useHomeroomDashboard() {
  return useQuery({
    queryKey: ["teachers", "me", "homeroom-dashboard"],
    queryFn: () =>
      fetchApi<HomeroomDashboardDto>("/api/v1/teachers/me/homeroom-dashboard"),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useHomeroomReport(
  classId: string | null,
  page: number = 1,
  perPage: number = 20
) {
  return useQuery({
    queryKey: ["reports", "homeroom", classId, { page, perPage }],
    queryFn: (): Promise<PaginatedResult<ClassAttendanceReportDto>> => {
      const searchParams = new URLSearchParams();
      if (page) searchParams.set("page", page.toString());
      if (perPage) searchParams.set("per_page", perPage.toString());
      const queryStr = searchParams.toString();
      return fetchPaginatedApi<ClassAttendanceReportDto>(
        `/api/v1/reports/homeroom/${classId}${queryStr ? `?${queryStr}` : ""}`
      );
    },
    enabled: Boolean(classId),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useStudentAttendanceSummary(studentId: string | null) {
  return useQuery({
    queryKey: ["students", studentId, "attendance-summary"],
    queryFn: () =>
      fetchApi<StudentAttendanceSummaryDto>(
        `/api/v1/students/${studentId}/attendance-summary`
      ),
    enabled: Boolean(studentId),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

export function useClassAttendanceReport(
  classId: string | null,
  subjectId: string | null = null,
  page: number = 1,
  perPage: number = 20
) {
  return useQuery({
    queryKey: [
      "reports",
      "classes",
      classId,
      "attendance",
      { subjectId, page, perPage },
    ],
    queryFn: async (): Promise<PaginatedResult<ClassAttendanceReportDto>> => {
      const searchParams = new URLSearchParams();
      if (subjectId && subjectId !== "ALL") searchParams.set("subject_id", subjectId);
      if (page) searchParams.set("page", page.toString());
      if (perPage) searchParams.set("per_page", perPage.toString());

      const queryStr = searchParams.toString();
      const endpoint =
        subjectId && subjectId !== "ALL"
          ? `/api/v1/reports/classes/${classId}/attendance?${queryStr}`
          : `/api/v1/reports/homeroom/${classId}?${queryStr}`;

      return fetchPaginatedApi<ClassAttendanceReportDto>(endpoint);
    },
    enabled: Boolean(classId),
    staleTime: 1000 * 30,
    retry: 1,
  });
}

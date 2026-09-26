import { useQuery } from "@tanstack/react-query";
import { fetchApi, fetchPaginatedApi } from "@/lib/api-client";
import { AdminDashboardDto, AdminActivityDto } from "@komas/shared-types";

export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => fetchApi<AdminDashboardDto>("/api/v1/admin/dashboard"),
    staleTime: 1000 * 60, // 1 minute
    retry: 1,
  });
}

export function useAdminActivities(page = 1, perPage = 5) {
  return useQuery({
    queryKey: ["admin", "activities", page, perPage],
    queryFn: () =>
      fetchPaginatedApi<AdminActivityDto[]>(
        `/api/v1/admin/activities?page=${page}&per_page=${perPage}`
      ),
    staleTime: 1000 * 30, // 30 seconds
    retry: 1,
  });
}

export function useActiveClassesCount() {
  return useQuery({
    queryKey: ["admin", "classes-count"],
    queryFn: async () => {
      const res = await fetchPaginatedApi<unknown[]>("/api/v1/classes?page=1&per_page=1");
      return res.meta?.total ?? 0;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

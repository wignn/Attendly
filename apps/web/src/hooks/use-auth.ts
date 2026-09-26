import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import {
  AuthTokenResponseDto,
  LoginRequestDto,
  RegisterRequestDto,
  UserProfileDto,
} from "@komas/shared-types";

export function useAuth() {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => fetchApi<UserProfileDto>("/api/v1/me"),
    retry: false,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequestDto) =>
      fetchApi<AuthTokenResponseDto>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        localStorage.setItem("attendly_is_auth", "true");
      }
      queryClient.setQueryData(["user", "me"], data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterRequestDto) =>
      fetchApi<AuthTokenResponseDto>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.access_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        localStorage.setItem("attendly_is_auth", "true");
      }
      queryClient.setQueryData(["user", "me"], data.user);
    },
  });

  const logout = () => {
    if (typeof window !== "undefined") {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        fetchApi("/api/v1/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        }).catch(() => {});
      }
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.setItem("attendly_is_auth", "false");
    }
    queryClient.clear();
  };

  return {
    user: userQuery.data,
    isLoading: userQuery.isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
  };
}

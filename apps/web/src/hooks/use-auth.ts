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
    queryFn: () => fetchApi<UserProfileDto>("/api/v1/users/me"),
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
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
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
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      queryClient.setQueryData(["user", "me"], data.user);
    },
  });

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
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

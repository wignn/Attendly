import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api-client";
import { AuthTokenResponseDto, LoginRequestDto, UserProfileDto } from "@komas/shared-types";

export function useAuth() {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => fetchApi<UserProfileDto>("/api/v1/users/me"),
    retry: false,
    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const persistSession = (data: AuthTokenResponseDto) => {
    localStorage.setItem("token", data.access_token);
    localStorage.setItem("refresh_token", data.refresh_token);
    queryClient.setQueryData(["user", "me"], data.user);
  };

  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequestDto) =>
      fetchApi<AuthTokenResponseDto>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: persistSession,
  });

  const googleLoginMutation = useMutation({
    mutationFn: (idToken: string) =>
      fetchApi<AuthTokenResponseDto>("/api/v1/auth/google", {
        method: "POST",
        body: JSON.stringify({ id_token: idToken }),
      }),
    onSuccess: persistSession,
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
    loginWithGoogle: googleLoginMutation.mutateAsync,
    logout,
  };
}

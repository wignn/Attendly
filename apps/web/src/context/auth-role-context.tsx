"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-client";
import { AuthTokenResponseDto } from "@komas/shared-types";

export type UserRole = "SUPER_ADMIN" | "TEACHER" | "HOMEROOM_TEACHER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roles: string[];
  nip: string;
  roleLabel: string;
  subject?: string;
  homeroomClass?: string;
  avatar?: string;
}

const EMPTY_USER: AuthUser = {
  id: "",
  name: "",
  email: "",
  role: "TEACHER",
  roles: [],
  nip: "",
  roleLabel: "",
};

function determinePrimaryRole(roles?: string[]): UserRole {
  if (roles?.includes("SUPER_ADMIN")) return "SUPER_ADMIN";
  if (roles?.includes("HOMEROOM_TEACHER")) return "HOMEROOM_TEACHER";
  return "TEACHER";
}

function getRoleLabel(role: UserRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "Super Admin";
    case "HOMEROOM_TEACHER":
      return "Guru & Wali Kelas";
    default:
      return "Guru Mata Pelajaran";
  }
}

interface AuthRoleContextType {
  currentUser: AuthUser;
  activeRole: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthRoleContext = React.createContext<AuthRoleContextType | undefined>(undefined);

export function AuthRoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<AuthUser>(EMPTY_USER);
  const [activeRole, setActiveRole] = React.useState<UserRole>("TEACHER");
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  const acceptSession = React.useCallback((userData: AuthTokenResponseDto["user"]) => {
    const role = determinePrimaryRole(userData.roles);
    const user: AuthUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role,
      roles: userData.roles ?? [],
      nip: "",
      roleLabel: getRoleLabel(role),
    };
    setCurrentUser(user);
    setActiveRole(role);
    setIsAuthenticated(true);
    try {
      localStorage.setItem("attendly_active_role", role);
      localStorage.setItem("attendly_is_auth", "true");
      localStorage.setItem("attendly_user", JSON.stringify(user));
    } catch {
      // Session remains active in memory when browser storage is unavailable.
    }
  }, []);

  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchApi<AuthTokenResponseDto["user"]>("/api/v1/me")
      .then((user) => acceptSession(user))
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("attendly_user");
        localStorage.removeItem("attendly_active_role");
        localStorage.setItem("attendly_is_auth", "false");
        setIsAuthenticated(false);
        setCurrentUser(EMPTY_USER);
      })
      .finally(() => setIsLoading(false));
  }, [acceptSession]);

  const finishLogin = React.useCallback((user: AuthRoleContextType["currentUser"]) => {
    if (user.role === "SUPER_ADMIN") router.push("/dashboard");
    else router.push("/portal-guru");
  }, [router]);

  const login = React.useCallback(async (email: string, password?: string): Promise<boolean> => {
    const res = await fetchApi<AuthTokenResponseDto>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem("token", res.access_token);
    if (res.refresh_token) localStorage.setItem("refresh_token", res.refresh_token);
    acceptSession(res.user);
    finishLogin({ ...EMPTY_USER, ...res.user, role: determinePrimaryRole(res.user.roles), roles: res.user.roles ?? [], roleLabel: getRoleLabel(determinePrimaryRole(res.user.roles)) });
    return true;
  }, [acceptSession, finishLogin]);

  const loginWithGoogle = React.useCallback(async (idToken: string): Promise<boolean> => {
    const res = await fetchApi<AuthTokenResponseDto>("/api/v1/auth/google", {
      method: "POST",
      body: JSON.stringify({ id_token: idToken }),
    });
    localStorage.setItem("token", res.access_token);
    if (res.refresh_token) localStorage.setItem("refresh_token", res.refresh_token);
    acceptSession(res.user);
    const role = determinePrimaryRole(res.user.roles);
    finishLogin({ ...EMPTY_USER, ...res.user, role, roles: res.user.roles ?? [], roleLabel: getRoleLabel(role) });
    return true;
  }, [acceptSession, finishLogin]);

  const logout = React.useCallback(async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (refreshToken) {
      try {
        await fetchApi("/api/v1/auth/logout", {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch {
        // Clear the local session even when the API is unreachable.
      }
    }
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("attendly_user");
    localStorage.removeItem("attendly_active_role");
    localStorage.setItem("attendly_is_auth", "false");
    setCurrentUser(EMPTY_USER);
    setActiveRole("TEACHER");
    setIsAuthenticated(false);
    router.push("/login");
  }, [router]);

  return (
    <AuthRoleContext.Provider value={{ currentUser, activeRole, isAuthenticated, isLoading, login, loginWithGoogle, logout }}>
      {children}
    </AuthRoleContext.Provider>
  );
}

export function useAuthRole() {
  const context = React.useContext(AuthRoleContext);
  if (!context) throw new Error("useAuthRole must be used within an AuthRoleProvider");
  return context;
}

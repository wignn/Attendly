"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { fetchApi } from "@/lib/api-client";

export type UserRole = "SUPER_ADMIN" | "TEACHER" | "HOMEROOM_TEACHER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  permissions?: string[];
  nip?: string;
  roleLabel?: string;
  subject?: string;
  homeroomClass?: string;
  avatar?: string;
}

interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    roles: UserRole[];
    permissions?: string[];
  };
}

interface AuthRoleContextType {
  currentUser: AuthUser;
  activeRole: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: (idToken: string) => Promise<boolean>;
  logout: () => void;
}

const EMPTY_USER: AuthUser = {
  id: "",
  name: "",
  email: "",
  roles: [],
};

const AuthRoleContext = React.createContext<AuthRoleContextType | undefined>(
  undefined
);

export function AuthRoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<AuthUser>(EMPTY_USER);
  const [activeRole, setActiveRole] = React.useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const applySession = React.useCallback((session: AuthTokenResponse) => {
    localStorage.setItem("token", session.access_token);
    localStorage.setItem("refresh_token", session.refresh_token);
    const user = { ...session.user, roles: session.user.roles || [] };
    setCurrentUser(user);
    setActiveRole(user.roles.includes("SUPER_ADMIN") ? "SUPER_ADMIN" : user.roles[0] ?? null);
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchApi<AuthUser>("/api/v1/users/me")
      .then((user) => {
        if (!cancelled) {
          const roles = user.roles || [];
          setCurrentUser({ ...user, roles });
          setActiveRole(roles.includes("SUPER_ADMIN") ? "SUPER_ADMIN" : roles[0] ?? null);
        }
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        if (!cancelled) {
          setCurrentUser(EMPTY_USER);
          setActiveRole(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const authenticate = React.useCallback(
    async (endpoint: string, payload: Record<string, string>) => {
      const session = await fetchApi<AuthTokenResponse>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      applySession(session);
      router.push("/dashboard");
      return true;
    },
    [applySession, router]
  );

  const login = React.useCallback(
    (email: string, password: string) =>
      authenticate("/api/v1/auth/login", { email, password }),
    [authenticate]
  );

  const loginWithGoogle = React.useCallback(
    (idToken: string) =>
      authenticate("/api/v1/auth/google", { id_token: idToken }),
    [authenticate]
  );

  const logout = React.useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refresh_token");
    setCurrentUser(EMPTY_USER);
    setActiveRole(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthRoleContext.Provider
      value={{
        currentUser,
        activeRole,
        isAuthenticated: !!currentUser.id,
        isLoading,
        login,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthRoleContext.Provider>
  );
}

export function useAuthRole() {
  const context = React.useContext(AuthRoleContext);
  if (!context) {
    throw new Error("useAuthRole must be used within an AuthRoleProvider");
  }
  return context;
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export type UserRole = "SUPER_ADMIN" | "TEACHER" | "HOMEROOM_TEACHER";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  nip: string;
  roleLabel: string;
  subject?: string;
  homeroomClass?: string;
  avatar?: string;
}

export const DEMO_PROFILES: Record<UserRole, AuthUser> = {
  SUPER_ADMIN: {
    id: "usr-admin-1",
    name: "Admin Utama",
    email: "admin@smpn1tirtajaya.sch.id",
    role: "SUPER_ADMIN",
    nip: "197905102005011003",
    roleLabel: "Super Admin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
  },
  TEACHER: {
    id: "usr-guru-1",
    name: "Siti Rahmawati, S.Pd.",
    email: "siti.rahmawati@smpn1tirtajaya.sch.id",
    role: "TEACHER",
    nip: "198503152010012015",
    roleLabel: "Guru Mata Pelajaran",
    subject: "Bahasa Indonesia",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80",
  },
  HOMEROOM_TEACHER: {
    id: "usr-wali-1",
    name: "Budi Santoso, M.Pd.",
    email: "budi.santoso@smpn1tirtajaya.sch.id",
    role: "HOMEROOM_TEACHER",
    nip: "198207122008011009",
    roleLabel: "Guru Mapel & Wali Kelas",
    subject: "Matematika",
    homeroomClass: "7A",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
  },
};

interface AuthRoleContextType {
  currentUser: AuthUser;
  activeRole: UserRole;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  loginAsDemo: (role: UserRole) => void;
  login: (email: string, password?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthRoleContext = React.createContext<AuthRoleContextType | undefined>(
  undefined
);

export function AuthRoleProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [activeRole, setActiveRole] = React.useState<UserRole>("SUPER_ADMIN");
  const [currentUser, setCurrentUser] = React.useState<AuthUser>(
    DEMO_PROFILES.SUPER_ADMIN
  );
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(true);
  const [isMounted, setIsMounted] = React.useState(false);

  // Load persisted session from localStorage
  React.useEffect(() => {
    setIsMounted(true);
    try {
      const savedRole = localStorage.getItem("attendly_active_role") as UserRole;
      const savedAuth = localStorage.getItem("attendly_is_auth");

      if (savedRole && DEMO_PROFILES[savedRole]) {
        setActiveRole(savedRole);
        setCurrentUser(DEMO_PROFILES[savedRole]);
      }
      if (savedAuth === "false") {
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(true);
      }
    } catch {
      // Fallback to default SUPER_ADMIN
    }
  }, []);

  const switchRole = React.useCallback((role: UserRole) => {
    const profile = DEMO_PROFILES[role];
    if (profile) {
      setActiveRole(role);
      setCurrentUser(profile);
      setIsAuthenticated(true);
      try {
        localStorage.setItem("attendly_active_role", role);
        localStorage.setItem("attendly_is_auth", "true");
      } catch {}
    }
  }, []);

  const loginAsDemo = React.useCallback(
    (role: UserRole) => {
      switchRole(role);
      if (role === "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/portal-guru");
      }
    },
    [switchRole, router]
  );

  const login = React.useCallback(
    async (email: string, _password?: string): Promise<boolean> => {
      // Check if email matches any demo profile
      const foundRole = (Object.keys(DEMO_PROFILES) as UserRole[]).find(
        (r) => DEMO_PROFILES[r].email.toLowerCase() === email.toLowerCase()
      );

      const targetRole = foundRole || "SUPER_ADMIN";
      switchRole(targetRole);
      if (targetRole === "SUPER_ADMIN") {
        router.push("/dashboard");
      } else {
        router.push("/portal-guru");
      }
      return true;
    },
    [switchRole, router]
  );

  const logout = React.useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem("attendly_is_auth", "false");
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
    } catch {}
    router.push("/login");
  }, [router]);

  return (
    <AuthRoleContext.Provider
      value={{
        currentUser: isMounted ? currentUser : DEMO_PROFILES.SUPER_ADMIN,
        activeRole: isMounted ? activeRole : "SUPER_ADMIN",
        isAuthenticated: isMounted ? isAuthenticated : true,
        switchRole,
        loginAsDemo,
        login,
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

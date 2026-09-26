"use client";

import * as React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AttendanceDateProvider } from "@/context/attendance-date-context";
import { useAuthRole } from "@/context/auth-role-context";
import { usePathname, useRouter } from "next/navigation";
import { TeachingSessionsProvider } from "@/context/teaching-sessions-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const { currentUser, isAuthenticated, isLoading } = useAuthRole();
  const pathname = usePathname();
  const router = useRouter();
  const teacherRoutes = ["/guru", "/kelas", "/mapel", "/tahun-ajaran", "/jadwal", "/audit", "/siswa"];
  const requiresAdmin = teacherRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
  const isSuperAdmin = currentUser.roles.includes("SUPER_ADMIN");

  React.useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (requiresAdmin && !isSuperAdmin) {
      router.replace(currentUser.roles.includes("TEACHER") || currentUser.roles.includes("HOMEROOM_TEACHER") ? "/portal-guru" : "/login");
    }
  }, [currentUser.roles, isAuthenticated, isLoading, requiresAdmin, router, isSuperAdmin]);

  if (isLoading || !isAuthenticated || (requiresAdmin && !isSuperAdmin)) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Memeriksa akses akun…</div>;
  }

  return (
    <AttendanceDateProvider>
      <TeachingSessionsProvider>
        <div className="min-h-screen flex flex-col md:flex-row bg-[#fbf5e6] text-slate-800 antialiased overflow-x-hidden">
        {/* Sidebar Navigasi Kiri */}
        <Sidebar
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />

        {/* Konten Utama */}
        <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          <Topbar onOpenMobile={() => setMobileSidebarOpen(true)} />
          <main className="p-4 sm:p-8 flex-1 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
      </TeachingSessionsProvider>
    </AttendanceDateProvider>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthRole } from "@/context/auth-role-context";
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  Shapes,
  BookOpen,
  CalendarDays,
  Clock,
  ClipboardCheck,
  ShieldCheck,
  School,
  X,
  CalendarCheck,
  BarChart3,
  UsersRound,
  History,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { currentUser, activeRole, logout } = useAuthRole();

  // Navigation Items according to Active Role & Assignment
  const navSections = React.useMemo(() => {
    if (activeRole === "TEACHER" || activeRole === "HOMEROOM_TEACHER") {
      const sections = [
        {
          heading: "TUGAS GURU MAPEL",
          items: [
            { href: "/portal-guru", label: "Jadwal Mengajar", icon: CalendarCheck },
            { href: "/absensi", label: "Presensi Mengajar", icon: ClipboardCheck },
            { href: "/dashboard", label: "Statistik Kehadiran Mapel", icon: BarChart3 },
          ],
        },
      ];

      // Fitur Wali Kelas HANYA tampil jika guru ditugaskan sebagai Wali Kelas
      if (currentUser.homeroomClass) {
        sections.push({
          heading: "TUGAS WALI KELAS",
          items: [
            {
              href: "/siswa",
              label: `Wali Kelas (${currentUser.homeroomClass})`,
              icon: UsersRound,
            },
            {
              href: "/audit",
              label: "Riwayat Sesi Selesai",
              icon: History,
            },
          ],
        });
      }

      return sections;
    }

    // Default: SUPER_ADMIN
    return [
      {
        heading: "MENU UTAMA",
        items: [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/guru", label: "Manajemen Guru", icon: GraduationCap },
          { href: "/siswa", label: "Manajemen Siswa", icon: Users },
          { href: "/kelas", label: "Manajemen Kelas", icon: Shapes },
          { href: "/mapel", label: "Manajemen Mapel", icon: BookOpen },
          { href: "/tahun-ajaran", label: "Tahun Ajaran", icon: CalendarDays },
          { href: "/jadwal", label: "Jadwal Kelas", icon: Clock },
          { href: "/absensi", label: "Manajemen Absensi", icon: ClipboardCheck },
          { href: "/portal-guru", label: "Portal Guru Mapel & Wali", icon: School },
          { href: "/audit", label: "Audit Log", icon: ShieldCheck },
        ],
      },
    ];
  }, [activeRole]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`w-64 bg-[#0c3960] text-slate-300 flex flex-col shrink-0 min-h-screen z-50 transition-transform duration-300 fixed md:static inset-y-0 left-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } shadow-xl md:shadow-none`}
      >
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow">
              <School className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">
                SMPN 1 Tirtajaya
              </h1>
              <p className="text-[11px] text-slate-400">
                {activeRole === "SUPER_ADMIN"
                  ? "Sistem Absensi Murid"
                  : activeRole === "TEACHER"
                  ? "Portal Presensi Guru"
                  : "Portal Wali Kelas"}
              </p>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* User Identity / Role Pill */}
        <div className="px-5 py-3.5 bg-white/5 border-b border-white/10 flex items-center gap-3">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-10 h-10 rounded-full object-cover border border-amber-300 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-400 text-[#0c3960] font-bold flex items-center justify-center text-xs shrink-0">
              {currentUser.name
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")}
            </div>
          )}
          <div className="overflow-hidden min-w-0">
            <h4 className="text-xs font-bold text-white truncate">
              {currentUser.name}
            </h4>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {activeRole === "SUPER_ADMIN" && (
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  Super Admin
                </span>
              )}
              {currentUser.subject && (
                <span className="px-1.5 py-0.5 rounded bg-blue-500/30 text-blue-300 text-[10px] font-bold">
                  {currentUser.subject.includes("(")
                    ? currentUser.subject.split("(")[1].replace(")", "")
                    : currentUser.subject.slice(0, 3).toUpperCase()}
                </span>
              )}
              {currentUser.homeroomClass && (
                <span className="px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-300 text-[10px] font-bold">
                  Wali {currentUser.homeroomClass}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 py-4 px-3 space-y-4 text-sm font-medium overflow-y-auto">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              <div className="px-3 pt-1 pb-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                {section.heading}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition cursor-pointer ${
                      isActive
                        ? "bg-white/10 text-white border-l-4 border-amber-400 font-semibold shadow-xs"
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 transition shrink-0 ${
                        isActive ? "text-amber-400" : "text-slate-400"
                      }`}
                    />
                    <span className="text-xs truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer & Logout */}
        <div className="p-4 border-t border-white/10 text-[11px] text-slate-400 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span>Semester Ganjil 26/27</span>
              <div className="font-bold text-slate-300">SMPN 1 Tirtajaya</div>
            </div>
            <span
              className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"
              title="Sistem Online"
            />
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-rose-300 hover:bg-rose-500/20 text-xs font-semibold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Keluar Sistem</span>
          </button>
        </div>
      </aside>
    </>
  );
}

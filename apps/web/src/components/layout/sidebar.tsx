"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const navItems = [
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
];

export function Sidebar({ mobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

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
              <h1 className="text-sm font-bold text-white tracking-wide">SMPN 1 Tirtajaya</h1>
              <p className="text-[11px] text-slate-400">Sistem Absensi Murid</p>
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

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 text-sm font-medium overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

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
                  className={`w-5 h-5 transition ${
                    isActive ? "text-amber-400" : "text-slate-400"
                  }`}
                />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Info */}
        <div className="p-4 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
          <div>
            <span>Semester Ganjil 2026/2027</span>
            <div className="font-bold text-slate-300">Super Admin Panel</div>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" title="Sistem Aktif" />
        </div>
      </aside>
    </>
  );
}

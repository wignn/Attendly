"use client";

import * as React from "react";
import { useAttendanceDate } from "@/context/attendance-date-context";
import { useAuthRole } from "@/context/auth-role-context";
import {
  Menu,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ShieldCheck,
  GraduationCap,
  Users,
  ChevronDown,
  LogOut,
} from "lucide-react";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onOpenMobile?: () => void;
}

export function Topbar({
  title,
  subtitle,
  onOpenMobile,
}: TopbarProps) {
  const {
    activeDate,
    activeDayName,
    changeActiveDate,
    changeDayRelative,
    resetDateToToday,
  } = useAttendanceDate();

  const { currentUser, activeRole, logout } = useAuthRole();
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);

  // Close dropdown on outside click
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute dynamic topbar titles based on role if not explicitly provided
  const displayTitle =
    title ||
    (activeRole === "SUPER_ADMIN"
      ? "Dashboard Administrator"
      : activeRole === "TEACHER"
      ? "Jadwal Mengajar Hari Ini"
      : "Monitoring Kehadiran Rombel 7A");

  const displaySubtitle =
    subtitle ||
    (activeRole === "SUPER_ADMIN"
      ? "Sistem Absensi SMPN 1 Tirtajaya"
      : activeRole === "TEACHER"
      ? `${currentUser.name} • ${currentUser.subject || "Guru Mata Pelajaran"}`
      : `${currentUser.name} • Wali Kelas ${currentUser.homeroomClass || "7A"}`);

  return (
    <header className="bg-white border-b border-amber-100/70 px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs sticky top-0 z-30">
      {/* Title & Mobile Toggle */}
      <div className="flex items-center gap-3">
        {onOpenMobile && (
          <button
            onClick={onOpenMobile}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
            {displayTitle}
          </h2>
          <p className="text-[11px] text-slate-500 hidden sm:block">
            {displaySubtitle}
          </p>
        </div>
      </div>

      {/* Center & Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4 flex-wrap" ref={dropdownRef}>
        {/* KALENDER PER HARI (DATE PICKER & QUICK DAY NAVIGATOR) */}
        <div className="flex items-center gap-1.5 sm:gap-2 bg-amber-50/70 border border-amber-200/80 rounded-2xl px-2.5 py-1.5 shadow-xs">
          {/* Tombol Hari Sebelumnya */}
          <button
            onClick={() => changeDayRelative(-1)}
            title="Hari Sebelumnya"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Input Tanggal & Nama Hari */}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-[#0c3960]" />
            <input
              type="date"
              value={activeDate}
              onChange={(e) => changeActiveDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 cursor-pointer focus:outline-hidden"
            />
            <span className="px-2 py-0.5 rounded-md bg-[#0c3960] text-white text-[10px] font-extrabold uppercase tracking-wide">
              {activeDayName}
            </span>
          </div>

          {/* Tombol Hari Berikutnya */}
          <button
            onClick={() => changeDayRelative(1)}
            title="Hari Berikutnya"
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Tombol Reset Hari Ini */}
          <button
            onClick={resetDateToToday}
            title="Kembali ke Hari Ini"
            className="text-[11px] font-bold text-blue-700 hover:underline px-1 border-l border-amber-200 pl-2 cursor-pointer"
          >
            Hari Ini
          </button>
        </div>

        {/* Current assigned role */}
        <div className="px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/50 text-xs font-bold text-[#0c3960]">
          {activeRole === "SUPER_ADMIN" ? "Super Admin" : activeRole === "HOMEROOM_TEACHER" ? "Wali Kelas" : "Guru Mapel"}
        </div>


        {/* Profile Avatar & Details Header */}
        <div className="relative">
          <button
            onClick={() => {
              setProfileDropdownOpen(!profileDropdownOpen);
            }}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-85 transition cursor-pointer"
          >
            {currentUser.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-full object-cover border border-amber-300 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0c3960] text-amber-300 font-bold flex items-center justify-center text-xs shadow-xs">
                {currentUser.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </div>
            )}
            <div className="text-left hidden lg:block">
              <h4 className="text-xs font-bold text-slate-800 leading-tight">
                {currentUser.name}
              </h4>
              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                {activeRole === "SUPER_ADMIN" ? (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> Super Admin
                  </>
                ) : activeRole === "TEACHER" ? (
                  <>
                    <GraduationCap className="w-3 h-3 text-blue-600" /> Guru Mapel
                  </>
                ) : (
                  <>
                    <Users className="w-3 h-3 text-amber-600" /> Wali Kelas
                  </>
                )}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 hidden lg:block" />
          </button>

          {/* Profile Menu Dropdown */}
          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100">
                <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500">{currentUser.email}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">NIP: {currentUser.nip}</div>
              </div>

              <div className="px-2 pt-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar / Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

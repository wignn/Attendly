"use client";

import * as React from "react";
import { useAttendanceDate } from "@/context/attendance-date-context";
import { Menu, ChevronLeft, ChevronRight, CalendarDays, ShieldCheck } from "lucide-react";

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onOpenMobile?: () => void;
}

export function Topbar({
  title = "Dashboard",
  subtitle = "Sistem Absensi SMPN 1 Tirtajaya",
  onOpenMobile,
}: TopbarProps) {
  const {
    activeDate,
    activeDayName,
    changeActiveDate,
    changeDayRelative,
    resetDateToToday,
  } = useAttendanceDate();

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
            {title}
          </h2>
          <p className="text-[11px] text-slate-400 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* KALENDER PER HARI (DATE PICKER & QUICK DAY NAVIGATOR) */}
      <div className="flex items-center gap-2 sm:gap-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl px-3 py-1.5 shadow-xs">
        {/* Tombol Hari Sebelumnya */}
        <button
          onClick={() => changeDayRelative(-1)}
          title="Hari Sebelumnya"
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white text-slate-600 transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Input Tanggal & Nama Hari */}
        <div className="flex items-center gap-2">
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

      {/* Profile Badge Header */}
      <div className="flex items-center gap-3 pl-3 border-l border-slate-200 hidden sm:flex">
        <div className="w-9 h-9 rounded-full bg-[#0c3960] text-amber-300 font-bold flex items-center justify-center text-xs shadow-xs">
          AU
        </div>
        <div className="text-left">
          <h4 className="text-xs font-bold text-slate-800 leading-tight">Admin Utama</h4>
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> Super Admin
          </span>
        </div>
      </div>
    </header>
  );
}

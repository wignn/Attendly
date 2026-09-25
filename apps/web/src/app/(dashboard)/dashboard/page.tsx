"use client";

import * as React from "react";
import Link from "next/link";
import { useAttendanceDate } from "@/context/attendance-date-context";
import {
  initialDashboardMetrics,
  weeklyTrends,
  initialRecentActivities,
} from "@/data/mock-data";
import {
  CalendarCheck,
  Users,
  GraduationCap,
  Percent,
  Shapes,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const { fullDisplayDate, activeDayName } = useAttendanceDate();

  return (
    <div className="space-y-6">
      {/* 1. Baris Info Tanggal Aktif Terpilih */}
      <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs text-slate-400 font-medium uppercase tracking-wider">
              Pemantauan Hari Aktif
            </h3>
            <p className="text-sm font-bold text-slate-900">{fullDisplayDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Sesi Presensi Aktif</span>
          </span>
        </div>
      </div>

      {/* 2. Empat Kotak Metrik Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Siswa */}
        <div className="bg-white rounded-xl p-5 border-t-4 border-blue-500 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <p className="text-xs font-medium">Total Siswa</p>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
            {initialDashboardMetrics.totalStudents.toLocaleString("id-ID")}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Siswa Terdaftar Aktif</p>
        </div>

        {/* Total Guru */}
        <div className="bg-white rounded-xl p-5 border-t-4 border-emerald-500 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <p className="text-xs font-medium">Total Guru</p>
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
            {initialDashboardMetrics.totalTeachers}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Guru & Wali Kelas</p>
        </div>

        {/* Kehadiran Hari Aktif */}
        <div className="bg-white rounded-xl p-5 border-t-4 border-amber-400 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <p className="text-xs font-medium">Kehadiran ({activeDayName})</p>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
            {initialDashboardMetrics.attendanceToday}%
          </h3>
          <p className="text-[11px] text-emerald-600 font-semibold mt-1">Status Optimal</p>
        </div>

        {/* Kelas Aktif */}
        <div className="bg-white rounded-xl p-5 border-t-4 border-purple-500 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <p className="text-xs font-medium">Kelas Aktif</p>
            <Shapes className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
            {initialDashboardMetrics.activeClasses}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Jenjang 7, 8, & 9</p>
        </div>
      </div>

      {/* 3. Tren Kehadiran & Aktivitas Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Grafik Tren Mingguan */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Tren Kehadiran Mingguan</h3>
              <span className="text-[11px] text-slate-400">Pekan Berjalan</span>
            </div>
            <div className="h-60 flex items-end justify-between px-6 pb-4 pt-4 border-b border-slate-100">
              {weeklyTrends.map((item) => (
                <div key={item.day} className="flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition">
                    {item.rate}
                  </span>
                  <div
                    className={`w-10 rounded-md transition-all ${
                      item.isHighlight
                        ? "bg-amber-400 shadow-xs"
                        : "bg-[#0c3960] hover:bg-[#092b49]"
                    } ${item.heightClass}`}
                  />
                  <span className={`text-xs ${item.isHighlight ? "text-slate-800 font-bold" : "text-slate-500 font-medium"}`}>
                    {item.day}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 mt-4 px-2">
            <span>* Dipantau realtime per sesi kelas</span>
            <Link
              href="/absensi"
              className="text-blue-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Buka Manajemen Absensi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Kolom Aktivitas Terbaru */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-5">Aktivitas Terbaru</h3>
            <div className="space-y-4 text-xs">
              {initialRecentActivities.map((act) => (
                <div key={act.id} className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-800">{act.type}</p>
                      <p className="text-slate-400">{act.user}</p>
                    </div>
                  </div>
                  <span className="text-slate-400 font-mono text-[11px]">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 text-right">
            <Link href="/audit" className="text-xs text-blue-700 font-semibold hover:underline">
              Lihat seluruh jejak audit &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

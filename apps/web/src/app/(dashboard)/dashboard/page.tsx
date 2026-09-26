"use client";

import * as React from "react";
import Link from "next/link";
import { useAuthRole } from "@/context/auth-role-context";
import { useAttendanceDate } from "@/context/attendance-date-context";
import { TeacherMapelStatistics } from "@/components/dashboard/teacher-mapel-statistics";
import {
  useAdminDashboard,
  useAdminActivities,
  useActiveClassesCount,
} from "@/hooks/use-admin-dashboard";
import {
  CalendarCheck,
  Users,
  GraduationCap,
  Percent,
  Shapes,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Activity as ActivityIcon,
} from "lucide-react";

function formatActivityAction(action: string, entity: string): string {
  const entityLabels: Record<string, string> = {
    ADMIN_DASHBOARD: "Dashboard Admin",
    TEACHER_DASHBOARD: "Dashboard Guru",
    HOMEROOM_DASHBOARD: "Dashboard Wali Kelas",
    ATTENDANCE_SESSION: "Sesi Absensi",
    ATTENDANCE_RECORD: "Rekap Presensi",
    STUDENT: "Data Siswa",
    TEACHER: "Data Guru",
    CLASS: "Data Kelas",
    SUBJECT: "Mata Pelajaran",
    USER: "Pengguna",
  };
  const label = entityLabels[entity] || entity;
  switch (action.toUpperCase()) {
    case "VIEW":
      return `Akses ${label}`;
    case "CREATE":
      return `Penambahan ${label}`;
    case "UPDATE":
      return `Pembaruan ${label}`;
    case "DELETE":
      return `Penghapusan ${label}`;
    case "SUBMIT":
      return `Submit ${label}`;
    default:
      return `${action} ${label}`;
  }
}

function formatActivityTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return isoString;
  }
}

export default function DashboardPage() {
  const { activeRole } = useAuthRole();
  const { fullDisplayDate, activeDayName } = useAttendanceDate();

  // Jika user adalah Guru Mapel atau Wali Kelas, tampilkan Dashboard Statistik Mapel Sesuai Referensi Pengguna
  if (activeRole === "TEACHER" || activeRole === "HOMEROOM_TEACHER") {
    return <TeacherMapelStatistics />;
  }

  return <SuperAdminDashboardView fullDisplayDate={fullDisplayDate} activeDayName={activeDayName} />;
}

function SuperAdminDashboardView({
  fullDisplayDate,
  activeDayName,
}: {
  fullDisplayDate: string;
  activeDayName: string;
}) {
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
    isFetching: isDashboardFetching,
  } = useAdminDashboard();

  const {
    data: activitiesResult,
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
    refetch: refetchActivities,
  } = useAdminActivities(5);

  const { data: classesCount, isLoading: isClassesLoading } = useActiveClassesCount();

  // Error State
  if (isDashboardError) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-red-900">Gagal Memuat Data Dashboard</h3>
              <p className="text-xs text-red-700 mt-1">
                {(dashboardError as Error)?.message ||
                  "Terjadi kesalahan saat mengambil ringkasan dashboard Super Admin dari server."}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              refetchDashboard();
              refetchActivities();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Coba Lagi</span>
          </button>
        </div>
      </div>
    );
  }

  // Loading State
  if (isDashboardLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton Topbar Info */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 h-18" />

        {/* Skeleton Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-slate-200 h-28 space-y-3">
              <div className="h-4 bg-slate-200 rounded-md w-1/2" />
              <div className="h-7 bg-slate-200 rounded-md w-3/4" />
            </div>
          ))}
        </div>

        {/* Skeleton Bottom Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
          <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 h-80" />
          <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200 h-80" />
        </div>
      </div>
    );
  }

  const attendance = dashboard?.attendance;
  const attendanceRate = dashboard?.attendance_rate_today ?? 0;
  const totalStudents = dashboard?.total_students ?? 0;
  const totalTeachers = dashboard?.total_teachers ?? 0;
  const activeClasses = dashboard?.active_classes ?? classesCount ?? 0;
  const activities = activitiesResult?.data ?? [];

  const totalRecorded = attendance?.total_recorded_sessions ?? 0;
  const presentCount = attendance?.present ?? 0;
  const excusedCount = attendance?.excused ?? 0;
  const sickCount = attendance?.sick ?? 0;
  const unexcusedCount = attendance?.unexcused_absent ?? 0;

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
          <button
            onClick={() => {
              refetchDashboard();
              refetchActivities();
            }}
            disabled={isDashboardFetching}
            className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            title="Muat ulang data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isDashboardFetching ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>
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
            {totalStudents.toLocaleString("id-ID")}
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
            {totalTeachers.toLocaleString("id-ID")}
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
            {attendanceRate.toFixed(1)}%
          </h3>
          <p
            className={`text-[11px] font-semibold mt-1 ${
              attendanceRate >= 90
                ? "text-emerald-600"
                : attendanceRate >= 75
                ? "text-amber-600"
                : "text-rose-600"
            }`}
          >
            {attendanceRate >= 90
              ? "Status Optimal"
              : attendanceRate >= 75
              ? "Cukup Baik"
              : "Perlu Perhatian"}
          </p>
        </div>

        {/* Kelas Aktif */}
        <div className="bg-white rounded-xl p-5 border-t-4 border-purple-500 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <p className="text-xs font-medium">Kelas Aktif</p>
            <Shapes className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
            {isClassesLoading ? "..." : activeClasses.toLocaleString("id-ID")}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Kelas Terdaftar Aktif</p>
        </div>
      </div>

      {/* 3. Distribusi Kehadiran Hari Ini & Aktivitas Terbaru */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Rincian Kehadiran Sesi Hari Ini */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Rincian Presensi Hari Ini
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Berdasarkan seluruh sesi absensi yang tercatat
                </p>
              </div>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                Total Record: {totalRecorded.toLocaleString("id-ID")}
              </span>
            </div>

            {totalRecorded === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-200 rounded-xl my-4">
                <CheckCircle2 className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">
                  Belum ada presensi tercatat untuk hari ini.
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Data akan terisi otomatis saat guru melakukan absensi kelas.
                </p>
              </div>
            ) : (
              <div className="space-y-4 my-4">
                {/* Visual Bar Presensi */}
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                  {presentCount > 0 && (
                    <div
                      style={{ width: `${(presentCount / totalRecorded) * 100}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Hadir: ${presentCount}`}
                    />
                  )}
                  {excusedCount > 0 && (
                    <div
                      style={{ width: `${(excusedCount / totalRecorded) * 100}%` }}
                      className="bg-blue-500 h-full"
                      title={`Izin: ${excusedCount}`}
                    />
                  )}
                  {sickCount > 0 && (
                    <div
                      style={{ width: `${(sickCount / totalRecorded) * 100}%` }}
                      className="bg-amber-400 h-full"
                      title={`Sakit: ${sickCount}`}
                    />
                  )}
                  {unexcusedCount > 0 && (
                    <div
                      style={{ width: `${(unexcusedCount / totalRecorded) * 100}%` }}
                      className="bg-rose-500 h-full"
                      title={`Alpa: ${unexcusedCount}`}
                    />
                  )}
                </div>

                {/* 4 Kartu Breakdown Status */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                    <p className="text-[11px] font-medium text-emerald-800">Hadir</p>
                    <p className="text-lg font-bold text-emerald-900 mt-0.5">
                      {presentCount.toLocaleString("id-ID")}
                    </p>
                    <p className="text-[10px] text-emerald-600">
                      {((presentCount / totalRecorded) * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                    <p className="text-[11px] font-medium text-blue-800">Izin</p>
                    <p className="text-lg font-bold text-blue-900 mt-0.5">
                      {excusedCount.toLocaleString("id-ID")}
                    </p>
                    <p className="text-[10px] text-blue-600">
                      {((excusedCount / totalRecorded) * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
                    <p className="text-[11px] font-medium text-amber-800">Sakit</p>
                    <p className="text-lg font-bold text-amber-900 mt-0.5">
                      {sickCount.toLocaleString("id-ID")}
                    </p>
                    <p className="text-[10px] text-amber-600">
                      {((sickCount / totalRecorded) * 100).toFixed(1)}%
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                    <p className="text-[11px] font-medium text-rose-800">Alpa</p>
                    <p className="text-lg font-bold text-rose-900 mt-0.5">
                      {unexcusedCount.toLocaleString("id-ID")}
                    </p>
                    <p className="text-[10px] text-rose-600">
                      {((unexcusedCount / totalRecorded) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center text-xs text-slate-500 mt-4 px-2 pt-3 border-t border-slate-100">
            <span>* Data sinkron dengan backend realtime</span>
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
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800">Aktivitas Terbaru</h3>
              <ActivityIcon className="w-4 h-4 text-slate-400" />
            </div>

            {isActivitiesLoading ? (
              <div className="space-y-3 py-2 animate-pulse">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded-lg w-full" />
                ))}
              </div>
            ) : isActivitiesError ? (
              <div className="py-6 text-center text-xs text-slate-400 space-y-2">
                <p>Gagal memuat jejak aktivitas.</p>
                <button
                  onClick={() => refetchActivities()}
                  className="text-blue-600 font-bold hover:underline text-[11px] cursor-pointer"
                >
                  Muat ulang
                </button>
              </div>
            ) : activities.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                <p>Belum ada aktivitas tercatat pada sistem.</p>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 truncate">
                          {formatActivityAction(act.action, act.entity)}
                        </p>
                        <p className="text-slate-400 text-[11px] font-mono truncate">
                          ID: {act.entity_id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px] shrink-0">
                      {formatActivityTime(act.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-right mt-4">
            <Link href="/audit" className="text-xs text-blue-700 font-semibold hover:underline">
              Lihat seluruh jejak audit &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

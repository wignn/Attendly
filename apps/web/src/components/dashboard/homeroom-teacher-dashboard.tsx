"use client";

import * as React from "react";
import {
  TrendingUp,
  ChevronRight,
  X,
  AlertTriangle,
  CheckCircle2,
  Users,
  CalendarCheck,
  Search,
  Download,
  AlertCircle,
  FileSpreadsheet,
  RefreshCw,
  Clock,
  BookOpen,
  GraduationCap,
  ShieldAlert,
  ArrowRight,
  UserCheck,
  UserX,
  HeartPulse,
} from "lucide-react";
import { useAuthRole } from "@/context/auth-role-context";
import { useAttendanceDate } from "@/context/attendance-date-context";
import {
  useHomeroomDashboard,
  useHomeroomReport,
  useStudentAttendanceSummary,
} from "@/hooks/use-homeroom-dashboard";
import {
  StudentAttendanceSummaryDto,
  SubjectClassReportDto,
} from "@komas/shared-types";

export function HomeroomTeacherDashboard() {
  const { currentUser } = useAuthRole();
  const { fullDisplayDate, activeDayName } = useAttendanceDate();

  // 1. Fetch Homeroom Dashboard Overview
  const {
    data: dashboardData,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
    isFetching: isDashboardFetching,
  } = useHomeroomDashboard();

  // Extract classes from dashboard
  const classes = dashboardData?.classes || [];
  const primaryClass = classes[0]?.class;
  const classId = primaryClass?.id || null;
  const className = primaryClass?.name || currentUser.homeroomClass || "Kelas Binaan";

  // 2. Pagination & Search State for Class Report
  const [page, setPage] = React.useState(1);
  const perPage = 20;
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ATTENTION" | "EXCUSED_OR_SICK">("ALL");

  // 3. Fetch Class Student Attendance Report
  const {
    data: reportResult,
    isLoading: isReportLoading,
    isError: isReportError,
    error: reportError,
    refetch: refetchReport,
    isFetching: isReportFetching,
  } = useHomeroomReport(classId, page, perPage);

  const reportData = reportResult?.data;
  const paginationMeta = reportResult?.meta;
  const rawStudents = reportData?.students || [];

  // Filter students based on search and status tabs
  const filteredStudents = React.useMemo(() => {
    return rawStudents.filter((item) => {
      const nameMatch =
        item.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.student_number.toLowerCase().includes(searchQuery.toLowerCase());

      if (!nameMatch) return false;

      if (statusFilter === "ATTENTION") {
        return item.counts.unexcused_absent > 0 || item.attendance_rate < 85;
      }
      if (statusFilter === "EXCUSED_OR_SICK") {
        return item.counts.excused > 0 || item.counts.sick > 0;
      }

      return true;
    });
  }, [rawStudents, searchQuery, statusFilter]);

  // 4. Student Drill-down Modal State
  const [selectedStudentId, setSelectedStudentId] = React.useState<string | null>(null);

  // 5. Export CSV
  const handleExportCsv = () => {
    if (!rawStudents.length) return;
    const headers = [
      "NO",
      "NIS",
      "NAMA SISWA",
      "HADIR",
      "IZIN",
      "SAKIT",
      "ALPA",
      "PERSENTASE",
      "STATUS",
    ];
    const rows = rawStudents.map((s, idx) => {
      let statusStr = "Aman";
      if (s.counts.unexcused_absent >= 3 || s.attendance_rate < 75) {
        statusStr = "Kritis";
      } else if (s.counts.unexcused_absent > 0 || s.attendance_rate < 90) {
        statusStr = "Perlu Perhatian";
      }

      return [
        idx + 1,
        `'${s.student.student_number}`,
        `"${s.student.full_name}"`,
        s.counts.present,
        s.counts.excused,
        s.counts.sick,
        s.counts.unexcused_absent,
        `${s.attendance_rate.toFixed(1)}%`,
        `"${statusStr}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,﻿" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Rekap_Absensi_${className.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading skeleton
  if (isDashboardLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto py-2 animate-pulse">
        <div className="h-28 bg-white rounded-3xl border border-slate-200" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 bg-white rounded-2xl border border-slate-200" />
          <div className="h-32 bg-white rounded-2xl border border-slate-200" />
          <div className="h-32 bg-white rounded-2xl border border-slate-200" />
          <div className="h-32 bg-white rounded-2xl border border-slate-200" />
        </div>
        <div className="h-80 bg-white rounded-3xl border border-slate-200" />
      </div>
    );
  }

  // Error state
  if (isDashboardError) {
    return (
      <div className="max-w-6xl mx-auto py-6">
        <div className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-red-900">
              Gagal Memuat Dashboard Wali Kelas
            </h3>
            <p className="text-sm text-red-600 mt-1 max-w-md mx-auto">
              {dashboardError instanceof Error
                ? dashboardError.message
                : "Terjadi kesalahan saat berkomunikasi dengan server backend."}
            </p>
          </div>
          <button
            onClick={() => refetchDashboard()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Muat Ulang</span>
          </button>
        </div>
      </div>
    );
  }

  const attendance = dashboardData?.attendance || {
    present: 0,
    excused: 0,
    sick: 0,
    unexcused_absent: 0,
    total_recorded_sessions: 0,
  };
  const attendanceRate = dashboardData?.attendance_rate ?? 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* 1. Header Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Wali {className}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Rekapitulasi Kehadiran Kelas Wali
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Pantau ringkasan kehadiran harian dan perkembangan presensi siswa binaan Anda pada <strong>{fullDisplayDate}</strong>.
          </p>
        </div>

        <button
          onClick={() => {
            refetchDashboard();
            refetchReport();
          }}
          disabled={isDashboardFetching || isReportFetching}
          className="self-start md:self-center inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition shadow-2xs cursor-pointer disabled:opacity-60"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${
              isDashboardFetching || isReportFetching ? "animate-spin text-blue-600" : ""
            }`}
          />
          <span>Perbarui Data</span>
        </button>
      </div>

      {/* 2. Top Metric Cards (KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Tingkat Kehadiran Hari Ini */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                PERSENTASE KEHADIRAN
              </span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  attendanceRate >= 95
                    ? "bg-emerald-100 text-emerald-800"
                    : attendanceRate >= 85
                    ? "bg-blue-100 text-blue-800"
                    : "bg-amber-100 text-amber-900"
                }`}
              >
                {attendanceRate >= 95
                  ? "Sangat Baik"
                  : attendanceRate >= 85
                  ? "Baik"
                  : "Perlu Perhatian"}
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
              {attendanceRate.toFixed(1)}%
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100">
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  attendanceRate >= 95
                    ? "bg-emerald-500"
                    : attendanceRate >= 85
                    ? "bg-blue-500"
                    : "bg-amber-500"
                }`}
                style={{ width: `${Math.min(100, Math.max(0, attendanceRate))}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Berdasarkan sesi tanggal {activeDayName}
            </span>
          </div>
        </div>

        {/* Card 2: Siswa Hadir Hari Ini */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              SISWA HADIR
            </span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 mt-2 flex items-baseline gap-1.5">
              <span>{attendance.present}</span>
              <span className="text-sm font-semibold text-slate-400">Siswa</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 font-medium">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span>Tercatat hadir di kelas</span>
          </div>
        </div>

        {/* Card 3: Izin & Sakit */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              IZIN & SAKIT
            </span>
            <div className="text-3xl sm:text-4xl font-black text-blue-600 mt-2 flex items-baseline gap-2">
              <span>{attendance.excused + attendance.sick}</span>
              <span className="text-xs font-semibold text-slate-400">
                ({attendance.excused} Izin, {attendance.sick} Sakit)
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 font-medium">
            <HeartPulse className="w-4 h-4 text-blue-500" />
            <span>Ketidakhadiran berizin resmi</span>
          </div>
        </div>

        {/* Card 4: Alpa / Tanpa Keterangan */}
        <div
          className={`bg-white rounded-2xl p-5 sm:p-6 border shadow-xs flex flex-col justify-between ${
            attendance.unexcused_absent > 0
              ? "border-amber-300 bg-amber-50/20"
              : "border-slate-200"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                TANPA KETERANGAN (ALPA)
              </span>
              {attendance.unexcused_absent > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                  Tindak Lanjut!
                </span>
              )}
            </div>
            <div
              className={`text-3xl sm:text-4xl font-black mt-2 flex items-baseline gap-1.5 ${
                attendance.unexcused_absent > 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              <span>{attendance.unexcused_absent}</span>
              <span className="text-sm font-semibold text-slate-400">Siswa</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 font-medium">
            <UserX
              className={`w-4 h-4 ${
                attendance.unexcused_absent > 0 ? "text-red-500" : "text-slate-400"
              }`}
            />
            <span>
              {attendance.unexcused_absent > 0
                ? "Perlu konfirmasi orang tua"
                : "Tidak ada alpa tercatat"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Mata Pelajaran di Kelas Wali */}
      {classes.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Aktivitas Mata Pelajaran di {className}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Statistik presensi per mata pelajaran yang diajarkan pada rombel kelas ini.
              </p>
            </div>
            <span className="text-xs font-bold text-slate-500 px-3 py-1 bg-slate-100 rounded-full">
              {classes.length} Mapel Terjadwal
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {classes.map((cls, idx) => (
              <div
                key={`${cls.class.id}-${cls.subject.id}-${idx}`}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition bg-slate-50/40 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#0c3960] flex items-center justify-center font-bold text-xs shrink-0">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 leading-tight">
                        {cls.subject.name}
                      </h4>
                      <span className="text-[11px] text-slate-500">
                        {cls.class.name}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-slate-900">
                    {cls.attendance_rate.toFixed(0)}%
                  </span>
                </div>

                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#0c3960] h-full rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, cls.attendance_rate))}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                  <span>Hadir: {cls.counts.present}</span>
                  <span>Izin/Sakit: {cls.counts.excused + cls.counts.sick}</span>
                  <span className={cls.counts.unexcused_absent > 0 ? "text-red-600 font-bold" : ""}>
                    Alpa: {cls.counts.unexcused_absent}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tabel Rekap Kehadiran Siswa Rombel */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Daftar Presensi Siswa {className}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik nama atau baris siswa untuk melihat detail riwayat kehadiran penuh (Drill-Down).
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            <button
              onClick={handleExportCsv}
              disabled={!rawStudents.length}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama atau NIS siswa..."
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:bg-white focus:border-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setStatusFilter("ATTENTION")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                statusFilter === "ATTENTION"
                  ? "bg-white text-amber-700 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Perlu Perhatian
            </button>
            <button
              onClick={() => setStatusFilter("EXCUSED_OR_SICK")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                statusFilter === "EXCUSED_OR_SICK"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Izin / Sakit
            </button>
          </div>
        </div>

        {/* Table Content */}
        {isReportLoading ? (
          <div className="space-y-3 py-8 animate-pulse">
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
            <div className="h-10 bg-slate-100 rounded-xl" />
          </div>
        ) : isReportError ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
            <p className="text-xs font-bold text-slate-700">
              Gagal memuat rekap presensi kelas wali.
            </p>
            <button
              onClick={() => refetchReport()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-12 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">
              Tidak Ada Siswa yang Sesuai
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {searchQuery
                ? `Tidak ada siswa yang cocok dengan pencarian "${searchQuery}".`
                : "Belum ada data absensi untuk filter ini."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 sm:mx-0">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                  <th className="py-3 px-4 rounded-l-xl">No</th>
                  <th className="py-3 px-4">NIS</th>
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-3 text-center">Hadir</th>
                  <th className="py-3 px-3 text-center">Izin</th>
                  <th className="py-3 px-3 text-center">Sakit</th>
                  <th className="py-3 px-3 text-center">Alpa</th>
                  <th className="py-3 px-4 text-center">Kehadiran</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStudents.map((item, index) => {
                  const rate = item.attendance_rate;
                  const isCritical = item.counts.unexcused_absent >= 3 || rate < 75;
                  const isAttention = item.counts.unexcused_absent > 0 || rate < 90;

                  return (
                    <tr
                      key={item.student.id}
                      onClick={() => setSelectedStudentId(item.student.id)}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4 text-slate-400 font-medium">
                        {(page - 1) * perPage + index + 1}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600">
                        {item.student.student_number}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-blue-700 transition">
                        {item.student.full_name}
                      </td>
                      <td className="py-3 px-3 text-center font-semibold text-emerald-600">
                        {item.counts.present}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-blue-600">
                        {item.counts.excused}
                      </td>
                      <td className="py-3 px-3 text-center font-medium text-amber-600">
                        {item.counts.sick}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-red-600">
                        {item.counts.unexcused_absent}
                      </td>
                      <td className="py-3 px-4 text-center font-black text-slate-900">
                        {rate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isCritical
                              ? "bg-red-100 text-red-800"
                              : isAttention
                              ? "bg-amber-100 text-amber-900"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isCritical
                            ? "Kritis"
                            : isAttention
                            ? "Perlu Perhatian"
                            : "Aman"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudentId(item.student.id);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-[#0c3960] text-slate-700 hover:text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {paginationMeta && paginationMeta.total_pages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
            <span>
              Menampilkan Halaman <strong>{paginationMeta.page}</strong> dari{" "}
              <strong>{paginationMeta.total_pages}</strong> ({paginationMeta.total} Total Siswa)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={paginationMeta.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer font-bold"
              >
                Sebelumnya
              </button>
              <button
                disabled={paginationMeta.page >= paginationMeta.total_pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 cursor-pointer font-bold"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Student Drill-Down Modal */}
      {selectedStudentId && (
        <StudentDrillDownModal
          studentId={selectedStudentId}
          onClose={() => setSelectedStudentId(null)}
        />
      )}
    </div>
  );
}

function StudentDrillDownModal({
  studentId,
  onClose,
}: {
  studentId: string;
  onClose: () => void;
}) {
  const {
    data: summaryData,
    isLoading,
    isError,
    error,
    refetch,
  } = useStudentAttendanceSummary(studentId);

  // Close modal on escape
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#0c3960] text-white flex items-center justify-center font-bold text-xs">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Detail Kehadiran Siswa
              </h3>
              <p className="text-[11px] text-slate-500">
                Data resmi dari riwayat absensi kelas wali
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4 py-8 animate-pulse">
              <div className="h-12 bg-slate-100 rounded-xl" />
              <div className="grid grid-cols-4 gap-2">
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
              </div>
              <div className="h-20 bg-slate-100 rounded-xl" />
            </div>
          ) : isError ? (
            <div className="p-6 text-center space-y-3 bg-red-50 rounded-2xl border border-red-200">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-xs font-bold text-red-800">
                {error instanceof Error
                  ? error.message
                  : "Gagal memuat rekap kehadiran siswa."}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : summaryData ? (
            <div className="space-y-5">
              {/* Student Identity Card */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div>
                  <h4 className="text-base font-extrabold text-slate-900">
                    {summaryData.student.full_name}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>NIS: <strong>{summaryData.student.student_number}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      Status:{" "}
                      <strong className={summaryData.student.active ? "text-emerald-700" : "text-slate-500"}>
                        {summaryData.student.active ? "Aktif" : "Nonaktif"}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                    PERSENTASE
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    {summaryData.attendance_rate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Attendance Counts Breakdown */}
              <div className="grid grid-cols-4 gap-2.5">
                <div className="p-3 bg-emerald-50 border border-emerald-200/60 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                    Hadir
                  </span>
                  <span className="text-xl font-black text-emerald-700 mt-1 block">
                    {summaryData.counts.present}
                  </span>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200/60 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-blue-800 uppercase block">
                    Izin
                  </span>
                  <span className="text-xl font-black text-blue-700 mt-1 block">
                    {summaryData.counts.excused}
                  </span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200/60 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-amber-800 uppercase block">
                    Sakit
                  </span>
                  <span className="text-xl font-black text-amber-700 mt-1 block">
                    {summaryData.counts.sick}
                  </span>
                </div>
                <div className="p-3 bg-red-50 border border-red-200/60 rounded-xl text-center">
                  <span className="text-[10px] font-bold text-red-800 uppercase block">
                    Alpa
                  </span>
                  <span className="text-xl font-black text-red-700 mt-1 block">
                    {summaryData.counts.unexcused_absent}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Akumulasi Sesi: {summaryData.counts.total_recorded_sessions} Sesi</span>
                  <span>Target Minimum: 85%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      summaryData.attendance_rate >= 90
                        ? "bg-emerald-500"
                        : summaryData.attendance_rate >= 75
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                    style={{
                      width: `${Math.min(100, Math.max(0, summaryData.attendance_rate))}%`,
                    }}
                  />
                </div>
              </div>

              {/* Guidance / Recommendation */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
                <span className="font-bold text-slate-800 block">
                  Catatan Pembinaan Wali Kelas:
                </span>
                {summaryData.counts.unexcused_absent >= 3 ? (
                  <p className="text-red-700 leading-relaxed">
                    Siswa ini memiliki <strong>{summaryData.counts.unexcused_absent} alpa</strong> tanpa keterangan. Disarankan segera berkoordinasi dengan Guru BK dan memanggil orang tua / wali siswa untuk tindak lanjut.
                  </p>
                ) : summaryData.counts.unexcused_absent > 0 ? (
                  <p className="text-amber-800 leading-relaxed">
                    Siswa memiliki {summaryData.counts.unexcused_absent} catatan alpa. Mohon ingatkan siswa agar selalu menyerahkan surat keterangan saat berhalangan hadir.
                  </p>
                ) : (
                  <p className="text-emerald-800 leading-relaxed">
                    Kehadiran siswa sangat baik tanpa catatan alpa. Terus berikan apresiasi untuk menjaga kedisiplinan belajar.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

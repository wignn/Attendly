"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Users,
  CheckCircle2,
  AlertTriangle,
  X,
  FileSpreadsheet,
} from "lucide-react";
import {
  useClassAttendanceReport,
  useStudentAttendanceSummary,
} from "@/hooks/use-homeroom-dashboard";
import { useSubjectsOptions } from "@/hooks/use-attendance-sessions";
import { StudentAttendanceSummaryDto } from "@komas/shared-types";

export default function ClassAttendanceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const classId = (params?.classId as string) || null;
  const currentSubjectId = searchParams.get("subject_id") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const [page, setPage] = React.useState(isNaN(pageParam) ? 1 : pageParam);
  const perPage = 20;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<
    "ALL" | "ATTENTION" | "CRITICAL" | "PERFECT"
  >("ALL");

  // Fetch subjects options for context dropdown
  const { data: subjectsOptions = [] } = useSubjectsOptions();

  // Fetch Class Attendance Report
  const {
    data: reportResult,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClassAttendanceReport(
    classId,
    currentSubjectId || null,
    page,
    perPage
  );

  const reportData = reportResult?.data;
  const paginationMeta = reportResult?.meta;
  const rawStudents = reportData?.students || [];

  // Update query params when subject is changed
  const handleSubjectChange = (newSubjectId: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (!newSubjectId || newSubjectId === "ALL") {
      nextParams.delete("subject_id");
    } else {
      nextParams.set("subject_id", newSubjectId);
    }
    nextParams.set("page", "1");
    setPage(1);
    router.push(`/kelas/${classId}?${nextParams.toString()}`);
  };

  // Filter students locally for search & tab status
  const filteredStudents = React.useMemo(() => {
    return rawStudents.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch =
        !q ||
        item.student.full_name.toLowerCase().includes(q) ||
        item.student.student_number.toLowerCase().includes(q);

      if (!nameMatch) return false;

      if (statusFilter === "ATTENTION") {
        return item.counts.unexcused_absent > 0 || item.attendance_rate < 85;
      }
      if (statusFilter === "CRITICAL") {
        return item.counts.unexcused_absent >= 3 || item.attendance_rate < 75;
      }
      if (statusFilter === "PERFECT") {
        return item.attendance_rate === 100;
      }

      return true;
    });
  }, [rawStudents, searchQuery, statusFilter]);

  // Student Drill-down Modal State
  const [selectedStudent, setSelectedStudent] =
    React.useState<StudentAttendanceSummaryDto | null>(null);

  // Export CSV
  const handleExportCsv = () => {
    if (!rawStudents.length) return;
    const headers = [
      "NO",
      "NIS",
      "NAMA SISWA",
      "STATUS SISWA",
      "HADIR",
      "IZIN",
      "SAKIT",
      "ALPA",
      "TOTAL SESI",
      "PERSENTASE",
      "KATEGORI",
    ];

    const rows = rawStudents.map((s, idx) => {
      let statusStr = "Aman";
      if (s.counts.unexcused_absent >= 3 || s.attendance_rate < 75) {
        statusStr = "Kritis";
      } else if (s.counts.unexcused_absent > 0 || s.attendance_rate < 85) {
        statusStr = "Perlu Perhatian";
      }

      return [
        idx + 1,
        `'${s.student.student_number}`,
        `"${s.student.full_name}"`,
        s.student.active ? "Aktif" : "Nonaktif",
        s.counts.present,
        s.counts.excused,
        s.counts.sick,
        s.counts.unexcused_absent,
        s.counts.total_recorded_sessions,
        `${s.attendance_rate.toFixed(1)}%`,
        statusStr,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,﻿" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `Rekap_Presensi_${reportData?.class.name || "Kelas"}_${
      reportData?.subject?.name || "Semua_Mapel"
    }.csv`.replace(/\s+/g, "_");
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const className = reportData?.class.name || "Detail Kelas";
  const subjectName = reportData?.subject?.name || "Semua Mata Pelajaran";

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* 1. Header Navigation & Filter Bar */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/kelas"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0c3960] transition mb-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Kelas</span>
            </Link>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {className}
              </h1>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0c3960] text-xs font-extrabold uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                {subjectName}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Laporan statistik kehadiran kumulatif siswa untuk kelas ini. Gunakan pemilih mata pelajaran di samping untuk melihat perincian spesifik.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-slate-500 ${
                  isFetching ? "animate-spin" : ""
                }`}
              />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              disabled={rawStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Subject Filter Dropdown Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-bold">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Konteks Mata Pelajaran:</span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={currentSubjectId}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-hidden focus:ring-2 focus:ring-[#0c3960]/20 cursor-pointer min-w-[220px]"
            >
              <option value="">Semua Mata Pelajaran (Rekap Wali)</option>
              {subjectsOptions.map((subj) => (
                <option key={subj.id} value={subj.id}>
                  {subj.name} ({subj.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Loading Skeleton */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs animate-pulse space-y-2"
              >
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="h-6 bg-slate-100 rounded w-3/4" />
              </div>
            ))}
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs animate-pulse h-64" />
        </div>
      )}

      {/* 3. Error Alert */}
      {isError && !isLoading && (
        <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-rose-500" />
          <div className="space-y-2">
            <h4 className="text-base font-bold">
              Gagal Memuat Detail Kehadiran Kelas
            </h4>
            <p className="text-xs sm:text-sm text-rose-600">
              {error instanceof Error
                ? error.message
                : "Terjadi kesalahan saat memuat data laporan dari backend."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Content when Loaded */}
      {!isLoading && !isError && reportData && (
        <>
          {/* KPI Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Card 1: Attendance Rate */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Rata-Rata Kehadiran
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-black text-slate-900">
                  {reportData.attendance_rate.toFixed(1)}%
                </span>
              </div>
              <div className="mt-2">
                {reportData.attendance_rate >= 85 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>Kategori Baik</span>
                  </span>
                ) : reportData.attendance_rate >= 75 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                    <span>Perlu Perhatian</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600">
                    <AlertCircle className="w-3 h-3 text-rose-500" />
                    <span>Kategori Kritis</span>
                  </span>
                )}
              </div>
            </div>

            {/* Card 2: Total Recorded Sessions */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                Total Sesi Terlaksana
              </span>
              <div className="text-2xl font-black text-slate-900 mt-1">
                {reportData.counts.total_recorded_sessions}
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                Pertemuan Presensi
              </span>
            </div>

            {/* Card 3: Hadir */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">
                Hadir (H)
              </span>
              <div className="text-2xl font-black text-emerald-700 mt-1">
                {reportData.counts.present}
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                Total Catatan Hadir
              </span>
            </div>

            {/* Card 4: Izin */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 block">
                Izin (I)
              </span>
              <div className="text-2xl font-black text-blue-700 mt-1">
                {reportData.counts.excused}
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                Dispensasi / Surat Izin
              </span>
            </div>

            {/* Card 5: Sakit */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600 block">
                Sakit (S)
              </span>
              <div className="text-2xl font-black text-amber-700 mt-1">
                {reportData.counts.sick}
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                Keterangan Dokter / UKS
              </span>
            </div>

            {/* Card 6: Alpa */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block">
                Alpa (A)
              </span>
              <div className="text-2xl font-black text-rose-700 mt-1">
                {reportData.counts.unexcused_absent}
              </div>
              <span className="text-[10px] font-bold text-slate-400 mt-2 block">
                Tanpa Keterangan
              </span>
            </div>
          </div>

          {/* Student Roster Table Card */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            {/* Table Filters Bar */}
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl overflow-x-auto text-xs font-bold">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                    statusFilter === "ALL"
                      ? "bg-white text-slate-900 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Semua Siswa ({rawStudents.length})
                </button>
                <button
                  onClick={() => setStatusFilter("ATTENTION")}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                    statusFilter === "ATTENTION"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-amber-700"
                  }`}
                >
                  Perlu Perhatian
                </button>
                <button
                  onClick={() => setStatusFilter("CRITICAL")}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                    statusFilter === "CRITICAL"
                      ? "bg-rose-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-rose-700"
                  }`}
                >
                  Kritis (&lt;75% / Alpa &ge;3)
                </button>
                <button
                  onClick={() => setStatusFilter("PERFECT")}
                  className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                    statusFilter === "PERFECT"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 hover:text-emerald-700"
                  }`}
                >
                  Hadir 100%
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari NIS atau nama siswa..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#0c3960]/20"
                />
              </div>
            </div>

            {/* Empty State */}
            {filteredStudents.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Users className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-700">
                  Tidak Ada Data Siswa
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ada siswa yang cocok dengan pencarian "${searchQuery}".`
                    : "Belum ada siswa yang tercatat di kelas ini atau sesuai filter aktif."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4 w-28">NIS</th>
                      <th className="py-3 px-4 min-w-[180px]">Nama Siswa</th>
                      <th className="py-3 px-3 text-center">Hadir</th>
                      <th className="py-3 px-3 text-center">Izin</th>
                      <th className="py-3 px-3 text-center">Sakit</th>
                      <th className="py-3 px-3 text-center">Alpa</th>
                      <th className="py-3 px-3 text-center">Total</th>
                      <th className="py-3 px-4 text-center min-w-[110px]">
                        Persentase
                      </th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredStudents.map((item, idx) => {
                      const rate = item.attendance_rate;
                      const alpa = item.counts.unexcused_absent;

                      let statusBadge = (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                          Aman
                        </span>
                      );

                      if (alpa >= 3 || rate < 75) {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                            Kritis
                          </span>
                        );
                      } else if (alpa > 0 || rate < 85) {
                        statusBadge = (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                            Perhatian
                          </span>
                        );
                      }

                      return (
                        <tr
                          key={item.student.id}
                          className="hover:bg-slate-50/70 transition-colors"
                        >
                          <td className="py-3 px-4 text-center text-slate-400 text-xs">
                            {(page - 1) * perPage + idx + 1}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600 font-bold">
                            {item.student.student_number}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">
                              {item.student.full_name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {item.student.active ? "Siswa Aktif" : "Nonaktif"}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-emerald-600">
                            {item.counts.present}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-blue-600">
                            {item.counts.excused}
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-amber-600">
                            {item.counts.sick}
                          </td>
                          <td className="py-3 px-3 text-center font-bold">
                            <span
                              className={
                                alpa > 0
                                  ? "text-rose-600 px-1.5 py-0.5 rounded-md bg-rose-50 font-black"
                                  : "text-slate-400"
                              }
                            >
                              {alpa}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center text-slate-600 font-bold">
                            {item.counts.total_recorded_sessions}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <span className="font-bold text-slate-800 text-xs w-11 text-right">
                                {rate.toFixed(0)}%
                              </span>
                              <div className="w-12 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    rate >= 85
                                      ? "bg-emerald-500"
                                      : rate >= 75
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${Math.min(rate, 100)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {statusBadge}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedStudent(item)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-[#0c3960] text-slate-700 hover:text-white text-[11px] font-bold transition shadow-2xs cursor-pointer"
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

            {/* Pagination Controls */}
            {paginationMeta && paginationMeta.total_pages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Halaman {paginationMeta.page} dari {paginationMeta.total_pages}{" "}
                  (Total {paginationMeta.total} siswa)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const prevPage = Math.max(page - 1, 1);
                      setPage(prevPage);
                      const nextParams = new URLSearchParams(
                        searchParams.toString()
                      );
                      nextParams.set("page", prevPage.toString());
                      router.push(
                        `/kelas/${classId}?${nextParams.toString()}`
                      );
                    }}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const nextPage = Math.min(
                        page + 1,
                        paginationMeta.total_pages
                      );
                      setPage(nextPage);
                      const nextParams = new URLSearchParams(
                        searchParams.toString()
                      );
                      nextParams.set("page", nextPage.toString());
                      router.push(
                        `/kelas/${classId}?${nextParams.toString()}`
                      );
                    }}
                    disabled={page >= paginationMeta.total_pages}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 5. Student Drill-Down Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal
          studentSummary={selectedStudent}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  );
}

function StudentDetailModal({
  studentSummary,
  onClose,
}: {
  studentSummary: StudentAttendanceSummaryDto;
  onClose: () => void;
}) {
  const { student, counts, attendance_rate } = studentSummary;

  // Query individual student summary endpoint for fresh detail
  const { data: freshSummary, isLoading: isSummaryLoading } =
    useStudentAttendanceSummary(student.id);

  const activeCounts = freshSummary?.counts || counts;
  const activeRate = freshSummary?.attendance_rate ?? attendance_rate;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#0c3960] bg-blue-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
              Profil Kehadiran Siswa
            </span>
            <h3 className="text-lg font-black text-slate-900">
              {student.full_name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              NIS: {student.student_number} • {student.active ? "Siswa Aktif" : "Nonaktif"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metric Highlight Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
              Tingkat Kehadiran Kumulatif
            </span>
            <div className="text-3xl font-black text-slate-900 mt-1">
              {activeRate.toFixed(1)}%
            </div>
          </div>
          <div>
            {activeRate >= 85 ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Status Aman</span>
              </div>
            ) : activeRate >= 75 ? (
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Perlu Perhatian</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-xl border border-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Kategori Kritis</span>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Counts Grid */}
        <div className="grid grid-cols-4 gap-2.5 text-center">
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
            <span className="text-[10px] font-black uppercase text-emerald-700 block">
              Hadir (H)
            </span>
            <div className="text-xl font-black text-emerald-800 mt-1">
              {activeCounts.present}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
            <span className="text-[10px] font-black uppercase text-blue-700 block">
              Izin (I)
            </span>
            <div className="text-xl font-black text-blue-800 mt-1">
              {activeCounts.excused}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
            <span className="text-[10px] font-black uppercase text-amber-700 block">
              Sakit (S)
            </span>
            <div className="text-xl font-black text-amber-800 mt-1">
              {activeCounts.sick}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
            <span className="text-[10px] font-black uppercase text-rose-700 block">
              Alpa (A)
            </span>
            <div className="text-xl font-black text-rose-800 mt-1">
              {activeCounts.unexcused_absent}
            </div>
          </div>
        </div>

        {/* Total Sessions Note */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex items-center justify-between font-bold">
            <span>Total Pertemuan Tercatat:</span>
            <span className="text-slate-900 font-black">
              {activeCounts.total_recorded_sessions} Sesi
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-200">
            {activeCounts.unexcused_absent >= 3
              ? "Perhatian: Siswa telah mengumpulkan 3 atau lebih ketidakhadiran tanpa keterangan (Alpa). Disarankan koordinasi dengan Guru BK dan wali murid."
              : activeCounts.unexcused_absent > 0
              ? "Catatan: Terdapat alpa yang tercatat. Pantau kepatuhan kehadiran pada sesi pertemuan berikutnya."
              : "Kehadiran siswa ini memenuhi standar regulasi kehadiran sekolah."}
          </p>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#0c3960] hover:bg-[#0a2e4e] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

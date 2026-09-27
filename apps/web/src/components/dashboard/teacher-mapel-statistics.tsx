"use client";

import * as React from "react";
import Link from "next/link";
import {
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  Users,
  Search,
  AlertCircle,
  RefreshCw,
  BookOpen,
  ChevronLeft,
  CalendarCheck,
  CheckCircle2,
} from "lucide-react";
import { useAuthRole } from "@/context/auth-role-context";
import {
  useTeacherDashboard,
  useSubjectAttendanceReport,
} from "@/hooks/use-teacher-dashboard";
import { useSubjectsOptions } from "@/hooks/use-attendance-sessions";
import { SubjectClassReportDto } from "@komas/shared-types";

export function TeacherMapelStatistics() {
  const { currentUser } = useAuthRole();
  const [selectedSubjectId, setSelectedSubjectId] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [page, setPage] = React.useState<number>(1);
  const perPage = 10;

  // 1. Fetch Teacher Dashboard summary (all assigned classes & overall metrics)
  const {
    data: dashboard,
    isLoading: isDashboardLoading,
    isError: isDashboardError,
    error: dashboardError,
    refetch: refetchDashboard,
    isFetching: isDashboardFetching,
  } = useTeacherDashboard();

  // 2. Fetch available subjects
  const { data: subjectsOptions = [] } = useSubjectsOptions();

  // Extract distinct subjects available from dashboard classes or options
  const availableSubjects = React.useMemo(() => {
    if (dashboard?.classes && dashboard.classes.length > 0) {
      const map = new Map<string, { id: string; name: string }>();
      dashboard.classes.forEach((c) => {
        if (c.subject && !map.has(c.subject.id)) {
          map.set(c.subject.id, { id: c.subject.id, name: c.subject.name });
        }
      });
      if (map.size > 0) {
        return Array.from(map.values());
      }
    }
    return subjectsOptions;
  }, [dashboard?.classes, subjectsOptions]);

  // Set default subject if not selected
  React.useEffect(() => {
    if (!selectedSubjectId && availableSubjects.length > 0) {
      // Prefer subject matching current user's profile subject if available
      const matching = availableSubjects.find(
        (s) =>
          currentUser.subject &&
          s.name.toLowerCase().includes(currentUser.subject.toLowerCase())
      );
      if (matching) {
        setSelectedSubjectId(matching.id);
      }
    }
  }, [availableSubjects, selectedSubjectId, currentUser.subject]);

  // 3. Fetch paginated subject report if a subject is selected
  const {
    data: subjectReportResult,
    isLoading: isReportLoading,
    isError: isReportError,
    error: reportError,
    refetch: refetchReport,
    isFetching: isReportFetching,
  } = useSubjectAttendanceReport(
    selectedSubjectId || null,
    page,
    perPage
  );

  const activeSubjectName = React.useMemo(() => {
    if (!selectedSubjectId) return "Semua Mata Pelajaran";
    const found = availableSubjects.find((s) => s.id === selectedSubjectId);
    return found ? found.name : currentUser.subject || "Mata Pelajaran";
  }, [selectedSubjectId, availableSubjects, currentUser.subject]);

  // Classes list to display: use paginated report if subject is selected, else fallback to dashboard classes
  const rawClassesList: SubjectClassReportDto[] = React.useMemo(() => {
    if (selectedSubjectId && subjectReportResult?.data) {
      return subjectReportResult.data;
    }
    return dashboard?.classes || [];
  }, [selectedSubjectId, subjectReportResult?.data, dashboard?.classes]);

  // Filter classes by search query
  const filteredClasses = React.useMemo(() => {
    if (!searchQuery.trim()) return rawClassesList;
    const q = searchQuery.toLowerCase();
    return rawClassesList.filter(
      (c) =>
        c.class.name.toLowerCase().includes(q) ||
        (c.subject && c.subject.name.toLowerCase().includes(q))
    );
  }, [rawClassesList, searchQuery]);

  // Pagination meta
  const totalItems = selectedSubjectId && subjectReportResult?.meta
    ? subjectReportResult.meta.total
    : filteredClasses.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  // Compute aggregate statistics
  const aggregateStats = React.useMemo(() => {
    if (dashboard?.attendance) {
      return {
        rate: dashboard.attendance_rate ?? 0,
        totalSessions: dashboard.attendance.total_recorded_sessions ?? 0,
        present: dashboard.attendance.present ?? 0,
        excused: dashboard.attendance.excused ?? 0,
        sick: dashboard.attendance.sick ?? 0,
        unexcused_absent: dashboard.attendance.unexcused_absent ?? 0,
      };
    }

    // Fallback: aggregate from classes list
    let present = 0;
    let excused = 0;
    let sick = 0;
    let unexcused_absent = 0;
    let totalSessions = 0;

    rawClassesList.forEach((c) => {
      present += c.counts.present;
      excused += c.counts.excused;
      sick += c.counts.sick;
      unexcused_absent += c.counts.unexcused_absent;
      totalSessions += c.counts.total_recorded_sessions;
    });

    const total = present + excused + sick + unexcused_absent;
    const rate = total > 0 ? (present / total) * 100 : 0;

    return {
      rate,
      totalSessions,
      present,
      excused,
      sick,
      unexcused_absent,
    };
  }, [dashboard, rawClassesList]);

  const handleRefresh = () => {
    refetchDashboard();
    if (selectedSubjectId) {
      refetchReport();
    }
  };

  const isFetching = isDashboardFetching || isReportFetching;
  const isLoading = isDashboardLoading || (Boolean(selectedSubjectId) && isReportLoading);
  const isError = isDashboardError || (Boolean(selectedSubjectId) && isReportError);
  const errorMessage =
    (dashboardError instanceof Error ? dashboardError.message : null) ||
    (reportError instanceof Error ? reportError.message : null) ||
    "Terjadi kesalahan saat memuat data statistik kehadiran.";

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* 1. Header Card with Subject Switcher */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0c3960] text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#0c3960]" />
              Statistik Mata Pelajaran
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Statistik Kehadiran Mata Pelajaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Analisis keaktifan siswa pada kelas <strong>{activeSubjectName}</strong> yang diampu.
            Klik kelas di bawah untuk melihat rincian presensi detail per siswa.
          </p>
        </div>

        {/* Subject Filter & Actions */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {availableSubjects.length > 0 && (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 shadow-xs">
              <BookOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-hidden cursor-pointer"
              >
                <option value="">Semua Mata Pelajaran</option>
                {availableSubjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${isFetching ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {isError && !isLoading && (
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Gagal Memuat Statistik Kehadiran</h4>
            <p className="text-xs text-rose-600">{errorMessage}</p>
            <button
              onClick={handleRefresh}
              className="mt-2 text-xs font-bold text-rose-700 underline cursor-pointer"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Rata-Rata Kehadiran */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              RATA-RATA KEHADIRAN
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
              {isLoading ? (
                <div className="h-9 w-24 bg-slate-100 rounded-md animate-pulse mt-1" />
              ) : (
                `${aggregateStats.rate.toFixed(1)}%`
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold mt-3 pt-2 border-t border-slate-100">
            {aggregateStats.rate >= 85 ? (
              <>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-emerald-600">Kehadiran Optimal (&ge; 85%)</span>
              </>
            ) : aggregateStats.rate >= 75 ? (
              <>
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-amber-600">Perlu Perhatian (75% - 84%)</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-rose-500" />
                <span className="text-rose-600">Tingkat Kehadiran Rendah (&lt; 75%)</span>
              </>
            )}
          </div>
        </div>

        {/* Card 2: Total Sesi Mengajar */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              TOTAL SESI MENGAJAR
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
              {isLoading ? (
                <div className="h-9 w-24 bg-slate-100 rounded-md animate-pulse mt-1" />
              ) : (
                `${aggregateStats.totalSessions} Sesi`
              )}
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 font-medium flex items-center gap-1.5">
            <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Sesi presensi aktif tercatat</span>
          </div>
        </div>

        {/* Card 3: Rekap Siswa Hadir / Alpa */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                REKAP STATUS KEHADIRAN
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Akumulasi
              </span>
            </div>
            {isLoading ? (
              <div className="h-9 w-32 bg-slate-100 rounded-md animate-pulse mt-2" />
            ) : (
              <div className="grid grid-cols-4 gap-2 text-center mt-3">
                <div className="p-1.5 rounded-xl bg-emerald-50 border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-800">Hadir</div>
                  <div className="text-sm font-black text-emerald-700">{aggregateStats.present}</div>
                </div>
                <div className="p-1.5 rounded-xl bg-amber-50 border border-amber-100">
                  <div className="text-[10px] font-bold text-amber-800">Izin</div>
                  <div className="text-sm font-black text-amber-700">{aggregateStats.excused}</div>
                </div>
                <div className="p-1.5 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-800">Sakit</div>
                  <div className="text-sm font-black text-blue-700">{aggregateStats.sick}</div>
                </div>
                <div className="p-1.5 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="text-[10px] font-bold text-rose-800">Alpa</div>
                  <div className="text-sm font-black text-rose-700">{aggregateStats.unexcused_absent}</div>
                </div>
              </div>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100 font-medium">
            Status presensi kumulatif seluruh kelas
          </div>
        </div>
      </div>

      {/* 3. Class List Section: Rekap Persentase Kehadiran per Kelas Ajar */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        {/* Header & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900">
              Rekap Persentase Kehadiran per Kelas Ajar
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Pilih kelas untuk membuka laporan kehadiran detail per siswa dan ekspor data
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kelas (contoh: 7A, 8B)..."
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] w-48 sm:w-56"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-xs text-slate-400 hover:text-slate-600 px-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 animate-pulse space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-20" />
                </div>
                <div className="h-3 bg-slate-200 rounded-full w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredClasses.length === 0 && (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">Tidak Ada Kelas Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {searchQuery
                ? `Tidak ada kelas yang cocok dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                : "Belum ada kelas ajar atau sesi presensi tercatat untuk mata pelajaran ini."}
            </p>
          </div>
        )}

        {/* Class Bars List */}
        {!isLoading && filteredClasses.length > 0 && (
          <div className="space-y-4">
            {filteredClasses.map((item) => {
              const rate = item.attendance_rate;
              const rateFormatted = rate.toFixed(1);
              const subjectId = item.subject?.id || selectedSubjectId;
              const classUrl = subjectId
                ? `/kelas/${item.class.id}?subject_id=${subjectId}`
                : `/kelas/${item.class.id}`;

              // Color scheme according to attendance rate
              const isGood = rate >= 85;
              const isWarning = rate >= 75 && rate < 85;

              return (
                <div
                  key={`${item.class.id}-${item.subject?.id || "default"}`}
                  className="group p-4 sm:p-5 rounded-2xl border border-slate-200 hover:border-[#0c3960]/30 hover:bg-slate-50/70 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 group-hover:text-[#0c3960] transition-colors">
                          {item.class.name}
                        </span>
                        {item.subject && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-[#0c3960] text-[10px] font-bold">
                            {item.subject.name}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Hadir: <strong className="text-emerald-700">{item.counts.present}</strong></span>
                        <span>•</span>
                        <span>Izin: <strong className="text-amber-700">{item.counts.excused}</strong></span>
                        <span>•</span>
                        <span>Sakit: <strong className="text-blue-700">{item.counts.sick}</strong></span>
                        <span>•</span>
                        <span>Alpa: <strong className="text-rose-700">{item.counts.unexcused_absent}</strong></span>
                        <span>•</span>
                        <span>Total Sesi: {item.counts.total_recorded_sessions}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="font-extrabold text-slate-800 text-sm">
                          {rateFormatted}%
                        </span>
                        <span
                          className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold inline-block ${
                            isGood
                              ? "bg-emerald-100 text-emerald-800"
                              : isWarning
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isGood ? "Baik" : isWarning ? "Perhatian" : "Kritis"}
                        </span>
                      </div>

                      <Link
                        href={classUrl}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 group-hover:bg-[#0c3960] text-slate-700 group-hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                      >
                        <span>Detail Presensi</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-3 sm:h-3.5 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${
                        isGood
                          ? "bg-emerald-600 group-hover:bg-emerald-500"
                          : isWarning
                          ? "bg-amber-500 group-hover:bg-amber-400"
                          : "bg-rose-500 group-hover:bg-rose-400"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 4. Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Halaman <span className="font-bold text-slate-800">{page}</span> dari{" "}
              <span className="font-bold text-slate-800">{totalPages}</span> ({totalItems} total kelas)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isFetching}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isFetching}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-bold flex items-center gap-1 cursor-pointer transition shadow-xs"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation Link to /kelas */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Data tersinkronisasi langsung dengan server presensi</span>
          </span>
          <Link
            href="/kelas"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
          >
            <span>Lihat Semua Rekap Rombel</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

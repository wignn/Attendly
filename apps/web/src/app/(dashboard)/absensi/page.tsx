"use client";

import * as React from "react";
import Link from "next/link";
import { useAuthRole } from "@/context/auth-role-context";
import { useAttendanceDate } from "@/context/attendance-date-context";
import {
  useAttendanceSessions,
  useAttendanceSession,
  useReopenAttendanceSession,
  useClassesOptions,
  useSubjectsOptions,
} from "@/hooks/use-attendance-sessions";
import { useTeachers } from "@/hooks/use-teachers";
import {
  AttendanceSessionDetailDto,
  AttendanceStatus,
} from "@komas/shared-types";
import {
  ClipboardCheck,
  CalendarDays,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Filter,
  Eye,
  RotateCcw,
  X,
  Lock,
  Unlock,
  Check,
  ChevronLeft,
  ChevronRight,
  School,
  AlertTriangle,
} from "lucide-react";

export default function AbsensiPage() {
  const { currentUser, activeRole } = useAuthRole();
  const { activeDate, activeDayName, changeActiveDate } = useAttendanceDate();

  // Filter state for Super Admin Attendance Management
  const [filterClassId, setFilterClassId] = React.useState<string>("");
  const [filterSubjectId, setFilterSubjectId] = React.useState<string>("");
  const [filterTeacherId, setFilterTeacherId] = React.useState<string>("");
  const [filterStatus, setFilterStatus] = React.useState<string>("");
  const [filterDate, setFilterDate] = React.useState<string>(activeDate);
  const [page, setPage] = React.useState<number>(1);
  const perPage = 15;

  // Selected session for Detail Modal and Reopen Modal
  const [selectedSessionId, setSelectedSessionId] = React.useState<string | null>(
    null
  );
  const [reopenTargetSession, setReopenTargetSession] =
    React.useState<AttendanceSessionDetailDto | null>(null);
  const [reopenReason, setReopenReason] = React.useState<string>("");
  const [reopenError, setReopenError] = React.useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Queries for Super Admin View
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isError: isErrorSessions,
    error: sessionsError,
    refetch: refetchSessions,
  } = useAttendanceSessions({
    date: filterDate,
    class_id: filterClassId || undefined,
    subject_id: filterSubjectId || undefined,
    teacher_id: filterTeacherId || undefined,
    status: filterStatus || undefined,
    page,
    per_page: perPage,
  });

  // Query for Selected Session Detail (when modal open)
  const {
    data: sessionDetail,
    isLoading: isLoadingDetail,
  } = useAttendanceSession(selectedSessionId);

  // Options for Dropdowns
  const { data: classesList = [] } = useClassesOptions();
  const { data: subjectsList = [] } = useSubjectsOptions();
  const { data: teachersData } = useTeachers({ per_page: 100 });
  const teachersList = teachersData?.data || [];

  // Mutation to Reopen Session
  const reopenMutation = useReopenAttendanceSession();

  const handleOpenReopenModal = (session: AttendanceSessionDetailDto) => {
    setReopenTargetSession(session);
    setReopenReason("");
    setReopenError(null);
  };

  const handleConfirmReopen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reopenTargetSession) return;
    if (!reopenReason.trim()) {
      setReopenError("Alasan pembukaan kembali sesi wajib diisi.");
      return;
    }

    try {
      await reopenMutation.mutateAsync({
        id: reopenTargetSession.id,
        data: { reason: reopenReason.trim() },
      });
      setReopenTargetSession(null);
      setReopenReason("");
      setReopenError(null);
      showToast("Sesi presensi berhasil dibuka kembali (REOPENED)!");
      refetchSessions();
    } catch (err: any) {
      setReopenError(
        err?.message || "Gagal membuka kembali sesi presensi."
      );
    }
  };

  const handleResetFilters = () => {
    setFilterClassId("");
    setFilterSubjectId("");
    setFilterTeacherId("");
    setFilterStatus("");
    setFilterDate(activeDate);
    setPage(1);
  };

  // If active user is Teacher or Homeroom Teacher, show personalized teacher view
  if (activeRole === "TEACHER" || activeRole === "HOMEROOM_TEACHER") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
              <span>Presensi Sesi Tatap Muka Mapel</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Presensi Siswa Jam Pelajaran
            </h1>
            <p className="text-xs text-slate-500">
              Anda sedang login sebagai{" "}
              <strong className="text-slate-800">{currentUser.name}</strong>{" "}
              ({currentUser.subject || "Guru Mapel"}
              {currentUser.homeroomClass
                ? ` • Wali Kelas ${currentUser.homeroomClass}`
                : ""}
              ).
            </p>
          </div>

          <Link
            href="/portal-guru"
            className="px-6 py-3.5 bg-[#0c3960] hover:bg-[#0a2e4e] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-900/15 transition cursor-pointer"
          >
            <span>Buka Lembar Presensi di Portal Guru</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </Link>
        </div>

        {/* Banner Tambahan Wali Kelas */}
        {currentUser.homeroomClass && (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="w-10 h-10 rounded-xl bg-amber-400 text-[#0c3960] font-black text-sm flex items-center justify-center shrink-0">
                {currentUser.homeroomClass}
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Laporan Rekap Absensi Kelas Binaan ({currentUser.homeroomClass})
                </h4>
                <p className="text-[11px] text-slate-500">
                  Lihat rincian kehadiran siswa rombel Anda di seluruh mata pelajaran semester ini
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-[#0c3960] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#092b49] transition shrink-0"
            >
              <span>Buka Dashboard Wali Kelas</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Super Admin Attendance Management View
  const sessions = sessionsData?.data || [];
  const meta = sessionsData?.meta;
  const totalCount = meta?.total || 0;
  const totalPages = meta?.total_pages || 1;

  // Compute live aggregates from sessions on current page
  const submittedCount = sessions.filter((s) => s.status === "SUBMITTED").length;
  const draftCount = sessions.filter((s) => s.status === "DRAFT").length;
  const reopenedCount = sessions.filter((s) => s.status === "REOPENED").length;
  const totalStudentsEnrolled = sessions.reduce(
    (acc, curr) => acc + curr.total_students,
    0
  );
  const totalStudentsPresent = sessions.reduce(
    (acc, curr) => acc + curr.present_count,
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${
            toastMessage.type === "error"
              ? "bg-rose-900 text-white border-rose-400"
              : "bg-[#0c3960] text-white border-amber-300"
          }`}
        >
          {toastMessage.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* =========================================================================
          1. HEADER CARD SUPER ADMIN
      ========================================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Monitoring & Kontrol Presensi Terpadu
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Manajemen Sesi Presensi Siswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pantau seluruh sesi tatap muka kelas, periksa rincian absensi, dan buka kembali sesi yang memerlukan koreksi.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => refetchSessions()}
            disabled={isLoadingSessions}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoadingSessions ? "animate-spin" : ""}`}
            />
            <span>Segarkan</span>
          </button>

          <Link
            href="/portal-guru"
            className="px-4 py-2.5 bg-[#0c3960] hover:bg-[#0a2e4e] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <School className="w-3.5 h-3.5 text-amber-300" />
            <span>Portal Input Guru</span>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          2. SUMMARY STAT CARDS (LIVE BACKEND DATA)
      ========================================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">
            Total Sesi Terdata
          </span>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
          <span className="text-[11px] text-slate-500 block">
            {sessions.length} sesi di halaman ini
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">
            Selesai / Terkunci
          </span>
          <div className="text-2xl font-black text-emerald-700">
            {submittedCount}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Status SUBMITTED
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-amber-600 uppercase">
            Draf Aktif
          </span>
          <div className="text-2xl font-black text-amber-700">{draftCount}</div>
          <span className="text-[11px] text-slate-500 block">
            Sedang diinput guru
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-blue-600 uppercase">
            Dibuka Kembali
          </span>
          <div className="text-2xl font-black text-blue-700">
            {reopenedCount}
          </div>
          <span className="text-[11px] text-slate-500 block">
            Perlu revisi / audit
          </span>
        </div>
      </div>

      {/* =========================================================================
          3. FILTER BAR DENGAN BACKEND QUERY (ACCEPTANCE CRITERIA 1)
      ========================================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-[#0c3960]" />
            <span>Filter Pencarian Sesi Presensi</span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Tanggal */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">
              Tanggal Sesi:
            </label>
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={(e) => {
                  setFilterDate(e.target.value);
                  setPage(1);
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Status Sesi */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">
              Status Sesi:
            </label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden"
            >
              <option value="">Semua Status</option>
              <option value="SUBMITTED">SUBMITTED (Terkunci)</option>
              <option value="DRAFT">DRAFT (Draf Aktif)</option>
              <option value="REOPENED">REOPENED (Dibuka Kembali)</option>
            </select>
          </div>

          {/* Kelas */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">
              Rombel Kelas:
            </label>
            <select
              value={filterClassId}
              onChange={(e) => {
                setFilterClassId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden"
            >
              <option value="">Semua Kelas</option>
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mata Pelajaran */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">
              Mata Pelajaran:
            </label>
            <select
              value={filterSubjectId}
              onChange={(e) => {
                setFilterSubjectId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden"
            >
              <option value="">Semua Mapel</option>
              {subjectsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Guru Pengajar */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500">
              Guru Pengajar:
            </label>
            <select
              value={filterTeacherId}
              onChange={(e) => {
                setFilterTeacherId(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden"
            >
              <option value="">Semua Guru</option>
              {teachersList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. TABEL DAFTAR SESI PRESENSI
      ========================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Error state */}
        {isErrorSessions && (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900">
              Gagal Memuat Sesi Presensi
            </h3>
            <p className="text-xs text-rose-600 max-w-md mx-auto">
              {(sessionsError as Error)?.message ||
                "Terjadi kesalahan saat memuat data sesi presensi dari backend."}
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {isLoadingSessions && (
          <div className="p-6 space-y-4 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl" />
            ))}
          </div>
        )}

        {/* Data Table */}
        {!isLoadingSessions && !isErrorSessions && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Tanggal / Jam</th>
                    <th className="px-5 py-3.5">Kelas & Mata Pelajaran</th>
                    <th className="px-5 py-3.5">Guru Pengajar</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Kehadiran (H / I / S / A)</th>
                    <th className="px-5 py-3.5 text-center">Versi</th>
                    <th className="px-5 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {sessions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-12 text-center text-slate-400 space-y-2"
                      >
                        <CalendarDays className="w-8 h-8 mx-auto text-slate-300" />
                        <p className="text-xs font-medium">
                          Tidak ada sesi presensi yang sesuai dengan filter.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    sessions.map((sess) => {
                      const isSubmitted = sess.status === "SUBMITTED";
                      const isReopened = sess.status === "REOPENED";

                      const badgeClass = isSubmitted
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                        : isReopened
                        ? "bg-blue-100 text-blue-800 border-blue-300"
                        : "bg-amber-100 text-amber-900 border-amber-300";

                      const badgeLabel = isSubmitted
                        ? "Terkunci"
                        : isReopened
                        ? "Dibuka Kembali"
                        : "Draf Aktif";

                      const dateFormatted = new Date(
                        sess.held_at
                      ).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });

                      const percent =
                        sess.total_students > 0
                          ? Math.round(
                              (sess.present_count / sess.total_students) * 100
                            )
                          : 0;

                      return (
                        <tr
                          key={sess.id}
                          className="hover:bg-amber-50/20 transition"
                        >
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900">
                              {dateFormatted}
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(sess.held_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB</span>
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 text-sm">
                              {sess.class_name}
                            </div>
                            <div className="text-xs text-slate-500 font-medium">
                              {sess.subject_name}
                            </div>
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-800">
                              {sess.teacher_name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {sess.teacher_id.slice(0, 8)}...
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badgeClass}`}
                            >
                              {isSubmitted ? (
                                <Lock className="w-3 h-3 text-emerald-700" />
                              ) : isReopened ? (
                                <Unlock className="w-3 h-3 text-blue-700" />
                              ) : (
                                <Clock className="w-3 h-3 text-amber-700" />
                              )}
                              <span>{badgeLabel}</span>
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <div className="font-bold text-slate-900 text-xs">
                              {percent}% Hadir ({sess.present_count}/{sess.total_students})
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                              <span className="text-emerald-700 font-bold">
                                H:{sess.present_count}
                              </span>{" "}
                              •{" "}
                              <span className="text-amber-700">
                                I:{sess.excused_count}
                              </span>{" "}
                              •{" "}
                              <span className="text-blue-700">
                                S:{sess.sick_count}
                              </span>{" "}
                              •{" "}
                              <span className="text-rose-700">
                                A:{sess.absent_count}
                              </span>
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center font-mono text-xs text-slate-500">
                            v{sess.version}
                          </td>

                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Detail Sesi Button */}
                              <button
                                type="button"
                                onClick={() => setSelectedSessionId(sess.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                title="Lihat Detail Presensi Siswa"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                <span>Detail</span>
                              </button>

                              {/* Reopen Button (Super Admin Only on SUBMITTED sessions) */}
                              {isSubmitted && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenReopenModal(sess)}
                                  className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                                  title="Buka Kembali Sesi Presensi"
                                >
                                  <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                                  <span>Buka Sesi</span>
                                </button>
                              )}

                              {/* Direct Link to Sheet */}
                              <Link
                                href={`/portal-guru/${sess.id}`}
                                className="px-2.5 py-1.5 rounded-lg bg-[#0c3960] hover:bg-[#0a2e4e] text-white text-xs font-bold transition flex items-center gap-1"
                                title="Buka Lembar Presensi Guru"
                              >
                                <span>Lembar</span>
                                <ArrowRight className="w-3 h-3 text-amber-300" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Menampilkan halaman <strong>{page}</strong> dari{" "}
                  <strong>{totalPages}</strong> ({totalCount} total sesi)
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="px-3 py-1 font-bold text-slate-800">
                    {page}
                  </span>

                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* =========================================================================
          5. MODAL DETAIL SESI PRESENSI (ACCEPTANCE CRITERIA 2)
      ========================================================================== */}
      {selectedSessionId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Rincian Sesi Presensi:{" "}
                    {sessionDetail ? sessionDetail.class_name : "Memuat..."}
                  </h3>
                  {sessionDetail && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        sessionDetail.status === "SUBMITTED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : sessionDetail.status === "REOPENED"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : "bg-amber-100 text-amber-900 border-amber-300"
                      }`}
                    >
                      {sessionDetail.status}
                    </span>
                  )}
                </div>
                {sessionDetail && (
                  <p className="text-xs text-slate-500">
                    {sessionDetail.subject_name} • Pengajar:{" "}
                    {sessionDetail.teacher_name} • Versi: v{sessionDetail.version}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedSessionId(null)}
                className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
              {isLoadingDetail || !sessionDetail ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#0c3960]" />
                  <p className="text-xs">Memuat detail siswa dari server...</p>
                </div>
              ) : (
                <>
                  {/* Reopen Reason Banner if Reopened */}
                  {sessionDetail.status === "REOPENED" && sessionDetail.reopen_reason && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900 space-y-1">
                      <div className="font-extrabold flex items-center gap-1.5">
                        <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                        <span>Alasan Sesi Dibuka Kembali:</span>
                      </div>
                      <p className="italic text-blue-800">
                        &quot;{sessionDetail.reopen_reason}&quot;
                      </p>
                      {sessionDetail.reopened_at && (
                        <span className="text-[10px] text-blue-600 block mt-1">
                          Waktu dibuka:{" "}
                          {new Date(sessionDetail.reopened_at).toLocaleString("id-ID")}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Submission Audit Info if Submitted */}
                  {sessionDetail.status === "SUBMITTED" && sessionDetail.submitted_at && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-center justify-between">
                      <span className="font-medium">
                        Dikunci & disubmit pada:{" "}
                        <strong>
                          {new Date(sessionDetail.submitted_at).toLocaleString("id-ID")}
                        </strong>
                      </span>
                      <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[10px] font-bold">
                        Locked
                      </span>
                    </div>
                  )}

                  {/* Aggregate Pills */}
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                      <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                        Hadir
                      </span>
                      <span className="text-base font-black text-emerald-700">
                        {sessionDetail.present_count}
                      </span>
                    </div>
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                      <span className="text-[10px] font-bold text-amber-800 uppercase block">
                        Izin
                      </span>
                      <span className="text-base font-black text-amber-700">
                        {sessionDetail.excused_count}
                      </span>
                    </div>
                    <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                      <span className="text-[10px] font-bold text-blue-800 uppercase block">
                        Sakit
                      </span>
                      <span className="text-base font-black text-blue-700">
                        {sessionDetail.sick_count}
                      </span>
                    </div>
                    <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100">
                      <span className="text-[10px] font-bold text-rose-800 uppercase block">
                        Alpa
                      </span>
                      <span className="text-base font-black text-rose-700">
                        {sessionDetail.absent_count}
                      </span>
                    </div>
                  </div>

                  {/* Table Roster Siswa */}
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-100">
                        <tr>
                          <th className="px-3 py-2.5 text-center w-10">No</th>
                          <th className="px-3 py-2.5">NIS & Nama Siswa</th>
                          <th className="px-3 py-2.5 text-center">Status</th>
                          <th className="px-3 py-2.5">Catatan Pengajar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {sessionDetail.records.map((rec, idx) => {
                          const statusColor =
                            rec.status === "PRESENT"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : rec.status === "EXCUSED"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : rec.status === "SICK"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-rose-100 text-rose-800 border-rose-200";

                          const statusLabel =
                            rec.status === "PRESENT"
                              ? "Hadir"
                              : rec.status === "EXCUSED"
                              ? "Izin"
                              : rec.status === "SICK"
                              ? "Sakit"
                              : "Alpa";

                          return (
                            <tr key={rec.student_id} className="hover:bg-slate-50">
                              <td className="px-3 py-2.5 text-center text-slate-400 font-bold">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2.5">
                                <div className="font-bold text-slate-900">
                                  {rec.student_name}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  NIS: {rec.student_nis}
                                </div>
                              </td>
                              <td className="px-3 py-2.5 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusColor}`}
                                >
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-slate-500 text-[11px]">
                                {rec.remarks || "-"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedSessionId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Tutup
              </button>

              {sessionDetail && (
                <Link
                  href={`/portal-guru/${sessionDetail.id}`}
                  className="px-4 py-2 rounded-xl bg-[#0c3960] hover:bg-[#0a2e4e] text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <span>Buka di Lembar Guru</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. MODAL BUKA KEMBALI SESI / REOPEN (ACCEPTANCE CRITERIA 3)
      ========================================================================== */}
      {reopenTargetSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Buka Kembali Sesi Presensi?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Sesi kelas <strong>{reopenTargetSession.class_name}</strong> (
                {reopenTargetSession.subject_name}) akan dialihkan ke status{" "}
                <strong className="text-blue-700">REOPENED</strong>. Guru mata
                pelajaran akan dapat mengoreksi kembali data kehadiran siswa.
              </p>
            </div>

            {reopenError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{reopenError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmReopen} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Alasan Pembukaan Kembali (Wajib Diisi untuk Audit Log):
                </label>
                <textarea
                  required
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => {
                    setReopenReason(e.target.value);
                    setReopenError(null);
                  }}
                  placeholder="Contoh: Koreksi absensi siswa atas nama Budi (surat dokter baru diterima)..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setReopenTargetSession(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={reopenMutation.isPending || !reopenReason.trim()}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                >
                  <RotateCcw
                    className={`w-3.5 h-3.5 ${
                      reopenMutation.isPending ? "animate-spin" : ""
                    }`}
                  />
                  <span>
                    {reopenMutation.isPending
                      ? "Membuka Kembali..."
                      : "Konfirmasi Buka Kembali"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

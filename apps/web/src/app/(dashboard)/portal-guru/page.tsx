"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthRole } from "@/context/auth-role-context";
import { useAttendanceDate } from "@/context/attendance-date-context";
import {
  useAttendanceSessions,
  useSchedulesForDate,
  useCreateOrGetSession,
  useClassesOptions,
  useSubjectsOptions,
} from "@/hooks/use-attendance-sessions";
import { useTeacherAssignments } from "@/hooks/use-teacher-dashboard";
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  PlusCircle,
  Check,
  BookOpen,
  GraduationCap,
} from "lucide-react";

export default function PortalGuruPage() {
  const router = useRouter();
  const { currentUser } = useAuthRole();
  const { activeDate, fullDisplayDate, changeActiveDate } = useAttendanceDate();

  // Queries
  const {
    data: sessionsData,
    isLoading: isLoadingSessions,
    isError: isErrorSessions,
    error: sessionsError,
    refetch: refetchSessions,
  } = useAttendanceSessions({ date: activeDate });

  const {
    data: schedulesData,
    isLoading: isLoadingSchedules,
    isError: isErrorSchedules,
    error: schedulesError,
    refetch: refetchSchedules,
  } = useSchedulesForDate(activeDate);

  const { data: classesOptions = [] } = useClassesOptions();
  const { data: subjectsOptions = [] } = useSubjectsOptions();
  const {
    data: assignmentsData,
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments,
  } = useTeacherAssignments();

  const createOrGetMutation = useCreateOrGetSession();
  const [sessionStartError, setSessionStartError] = React.useState<string | null>(null);

  const sessions = sessionsData?.data || [];
  const dateSchedules = schedulesData?.data || [];
  const assignments = assignmentsData?.data || [];

  const classMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of classesOptions) {
      map[c.id] = c.name;
    }
    return map;
  }, [classesOptions]);

  const subjectMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const s of subjectsOptions) {
      map[s.id] = s.name;
    }
    return map;
  }, [subjectsOptions]);

  // Identify schedules that don't have an active session created yet for this date
  const existingScheduleIds = new Set(
    sessions.map((s) => s.schedule_id).filter(Boolean)
  );

  const uninitiatedSchedules = dateSchedules.filter(
    (sched) => !existingScheduleIds.has(sched.id)
  );

  const handleStartSessionFromSchedule = async (scheduleId: string) => {
    setSessionStartError(null);
    try {
      const result = await createOrGetMutation.mutateAsync({
        schedule_id: scheduleId,
        date: activeDate,
      });
      router.push(`/portal-guru/${result.id}`);
    } catch (err) {
      setSessionStartError(err instanceof Error ? err.message : "Gagal memulai sesi presensi. Coba lagi.");
    }
  };

  const handleStartSessionFromAssignment = async (classId: string, subjectId: string) => {
    setSessionStartError(null);
    try {
      const result = await createOrGetMutation.mutateAsync({
        class_id: classId,
        subject_id: subjectId,
        date: activeDate,
      });
      router.push(`/portal-guru/${result.id}`);
    } catch (err) {
      setSessionStartError(err instanceof Error ? err.message : "Gagal memulai sesi presensi. Coba lagi.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {sessionStartError && (
        <div role="alert" className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="flex-1">Gagal memulai sesi presensi: {sessionStartError}</div>
          <button type="button" onClick={() => setSessionStartError(null)} aria-label="Tutup pesan error" className="font-bold">×</button>
        </div>
      )}
      {isErrorSchedules && (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span>Gagal memuat jadwal untuk tanggal ini: {schedulesError instanceof Error ? schedulesError.message : "Terjadi kesalahan."}</span>
          <button type="button" onClick={() => refetchSchedules()} className="font-bold underline">Coba lagi</button>
        </div>
      )}
      {/* =========================================================================
          1. HEADER CARD
      ========================================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Jadwal & Presensi Mata Pelajaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pilih tanggal dan klik salah satu kartu kelas di bawah untuk langsung mengabsen siswa.
          </p>
        </div>

        {/* Input Tanggal Sesi */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 shadow-xs self-start md:self-auto shrink-0">
          <span className="text-xs text-slate-500 font-semibold">
            Tanggal Sesi:
          </span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={activeDate}
              onChange={(e) => changeActiveDate(e.target.value)}
              className="text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer bg-transparent"
            />
            <CalendarDays className="w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. BANNER NOTIFIKASI TANGGAL & STATUS
      ========================================================================== */}
      <div className="bg-[#eefcf5] border border-[#a3e6cd] rounded-2xl p-4 sm:px-5 sm:py-3.5 flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-xs sm:text-sm text-slate-700 leading-normal">
            <strong className="text-emerald-900">
              Sesi Presensi Aktif:
            </strong>{" "}
            Tanggal <strong>{fullDisplayDate || activeDate}</strong> memuat{" "}
            <strong>{sessions.length} sesi presensi tercatat</strong> di bawah ini.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetchSessions()}
          disabled={isLoadingSessions}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-emerald-200 text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition shrink-0 cursor-pointer shadow-2xs"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isLoadingSessions ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Perbarui</span>
        </button>
      </div>

      {/* Opsional: Tugas Tambahan Wali Kelas */}
      {(currentUser.homeroomClass ||
        currentUser.roles.includes("HOMEROOM_TEACHER")) && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-700">
            <span className="w-6 h-6 rounded-lg bg-amber-400 text-[#0c3960] font-black flex items-center justify-center text-[10px]">
              WK
            </span>
            <span>
              Anda juga bertugas sebagai <strong>Wali Kelas</strong> binaan.
            </span>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-bold text-[#0c3960] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Buka Portal Wali Kelas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* =========================================================================
          3. ERROR BANNER
      ========================================================================== */}
      {isErrorSessions && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-900">
              Gagal Memuat Data Sesi Presensi
            </h3>
            <p className="text-xs text-rose-700">
              {(sessionsError as Error)?.message ||
                "Terjadi kesalahan saat memuat data sesi presensi dari backend."}
            </p>
            <button
              type="button"
              onClick={() => refetchSessions()}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          4. SKELETON LOADING
      ========================================================================== */}
      {isLoadingSessions && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 bg-slate-200/70 rounded-2xl border border-slate-200"
            />
          ))}
        </div>
      )}

      {/* =========================================================================
          5. KARTU SESI PRESENSI AKTIF (DARI BACKEND API)
      ========================================================================== */}
      {!isLoadingSessions && !isErrorSessions && (
        <div className="space-y-6">
          {sessions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {sessions.map((sess) => {
                const isSubmitted = sess.status === "SUBMITTED";
                const isReopened = sess.status === "REOPENED";

                const badgeBg = isSubmitted
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                  : isReopened
                  ? "bg-blue-500/20 text-blue-300 border-blue-400/40"
                  : "bg-amber-500/20 text-amber-300 border-amber-400/40";

                const badgeLabel = isSubmitted
                  ? "Selesai (Terkunci)"
                  : isReopened
                  ? "Dibuka Kembali"
                  : "Draf Aktif";

                return (
                  <Link
                    key={sess.id}
                    href={`/portal-guru/${sess.id}`}
                    className="rounded-2xl overflow-hidden border border-slate-200 hover:border-[#0c3960] hover:ring-2 hover:ring-[#0c3960]/10 transition duration-200 cursor-pointer group shadow-xs hover:shadow-md hover:-translate-y-1 block"
                  >
                    {/* Bagian Atas: Dark Navy Header */}
                    <div className="bg-[#1e293b] p-5 text-white space-y-2.5 group-hover:bg-[#0c3960] transition-colors">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                          {sess.class_name}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition ${badgeBg}`}
                        >
                          {badgeLabel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-medium">
                        {sess.subject_name}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Pengajar: {sess.teacher_name}</span>
                      </div>
                    </div>

                    {/* Bagian Bawah: Putih Bersih */}
                    <div className="bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{sess.total_students} Siswa Terdaftar</span>
                        </div>
                        <span
                          className={`font-semibold ${
                            isSubmitted
                              ? "text-emerald-600 font-bold"
                              : "text-slate-400"
                          }`}
                        >
                          Hadir: {sess.present_count} / {sess.total_students}
                        </span>
                      </div>

                      {/* Mini Attendance Breakdown */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                        <span className="text-emerald-700 font-bold">
                          H: {sess.present_count}
                        </span>
                        <span>•</span>
                        <span className="text-amber-700 font-semibold">
                          I: {sess.excused_count}
                        </span>
                        <span>•</span>
                        <span className="text-blue-700 font-semibold">
                          S: {sess.sick_count}
                        </span>
                        <span>•</span>
                        <span className="text-rose-700 font-semibold">
                          A: {sess.absent_count}
                        </span>
                      </div>

                      <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition">
                        <span>Buka Lembar Presensi</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* =========================================================================
              6. SECTION: JADWAL HARI INI YANG BELUM DIMULAI SESINYA
          ========================================================================== */}
          {uninitiatedSchedules.length > 0 && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#0c3960]" />
                    <span>Jadwal Tersedia Hari Ini</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mulai sesi presensi baru dari jadwal kelas yang terdaftar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uninitiatedSchedules.map((sched) => {
                  const clsName =
                    classMap[sched.class_id] || `Kelas #${sched.class_id.slice(0, 8)}`;
                  const subName =
                    subjectMap[sched.subject_id] ||
                    `Mata Pelajaran #${sched.subject_id.slice(0, 8)}`;

                  return (
                    <div
                      key={sched.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0c3960]/10 text-[#0c3960]">
                            Jam: {sched.starts_at} - {sched.ends_at}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            Sesi Belum Dibuat
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800">
                          {clsName}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{subName}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={createOrGetMutation.isPending}
                        onClick={() => handleStartSessionFromSchedule(sched.id)}
                        className="w-full py-2 bg-[#0c3960] hover:bg-[#0a2e4e] text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
                        <span>
                          {createOrGetMutation.isPending
                            ? "Membuat Sesi..."
                            : "Mulai Presensi Kelas"}
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              7. SECTION: PENUGASAN MENGAJAR (KELAS & MAPEL DIAMPU)
          ========================================================================== */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#0c3960]" />
                  <span>Kelas & Mata Pelajaran Diampu</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daftar kelas dan mata pelajaran resmi yang ditugaskan kepada Anda pada tahun ajaran aktif.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto">
                {assignments.length} Penugasan Aktif
              </span>
            </div>

            {isLoadingAssignments ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-slate-100 rounded-2xl border border-slate-200"
                  />
                ))}
              </div>
            ) : assignments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assignments.map((assign) => {
                  const clsName =
                    classMap[assign.class_id] || `Kelas #${assign.class_id.slice(0, 8)}`;
                  const subName =
                    subjectMap[assign.subject_id] ||
                    `Mapel #${assign.subject_id.slice(0, 8)}`;

                  return (
                    <div
                      key={assign.id}
                      className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-[#0c3960]/30 hover:shadow-xs transition space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Aktif
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5" />
                            Pengajar Resmi
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900">{clsName}</h4>
                        <p className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                          <span>{subName}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          disabled={createOrGetMutation.isPending}
                          onClick={() =>
                            handleStartSessionFromAssignment(
                              assign.class_id,
                              assign.subject_id
                            )
                          }
                          className="w-full py-1.5 px-2 bg-[#0c3960] hover:bg-[#0a2e4e] text-white rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          <PlusCircle className="w-3 h-3 text-amber-300" />
                          <span>Presensi Hari Ini</span>
                        </button>

                        <Link
                          href={`/kelas/${assign.class_id}?subject_id=${assign.subject_id}`}
                          className="w-full py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1 text-center"
                        >
                          <span>Rekap Kelas</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                <p className="text-xs text-slate-500">
                  Belum ada kelas atau mata pelajaran yang ditugaskan ke akun Anda.
                </p>
              </div>
            )}
          </div>

          {/* Empty State when no sessions and no uninitiated schedules */}
          {sessions.length === 0 && uninitiatedSchedules.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
              <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <CalendarDays className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-800">
                  Tidak Ada Jadwal / Sesi Presensi Aktif Hari Ini
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Belum ada sesi presensi yang tercatat untuk tanggal{" "}
                  <strong>{fullDisplayDate || activeDate}</strong>. Anda dapat
                  memilih tanggal lain atau membuat sesi langsung melalui kartu penugasan kelas di atas.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

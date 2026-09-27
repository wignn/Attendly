"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  useAttendanceSession,
  useUpdateAttendanceRecords,
  useSubmitAttendanceSession,
} from "@/hooks/use-attendance-sessions";
import {
  AttendanceStatus,
  AttendanceRecordItemDto,
  RecordUpdateItemDto,
} from "@komas/shared-types";
import { ApiError } from "@/lib/api-client";
import {
  ArrowLeft,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Search,
  Send,
  CalendarDays,
  Save,
  Lock,
  RefreshCw,
  Info,
} from "lucide-react";

export default function SessionAttendanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = Array.isArray(params?.sessionId)
    ? params.sessionId[0]
    : (params?.sessionId as string);

  // Queries & Mutations
  const {
    data: session,
    isLoading,
    isError,
    error,
    refetch,
  } = useAttendanceSession(sessionId);

  const updateRecordsMutation = useUpdateAttendanceRecords();
  const submitSessionMutation = useSubmitAttendanceSession();

  // Local state for interactive editing
  const [localRecords, setLocalRecords] = React.useState<
    Record<string, { status: AttendanceStatus; remarks: string }>
  >({});
  const [isDirty, setIsDirty] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Concurrency conflict state
  const [conflictError, setConflictError] = React.useState<{
    message: string;
  } | null>(null);

  // Confirmation dialog before locking
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false);

  // Sync local records when session loads or updates from server
  React.useEffect(() => {
    if (session?.records) {
      // If we don't have local uncommitted edits or conflict, sync from server
      if (!isDirty && !conflictError) {
        const initialMap: Record<
          string,
          { status: AttendanceStatus; remarks: string }
        > = {};
        session.records.forEach((rec) => {
          initialMap[rec.student_id] = {
            status: rec.status,
            remarks: rec.remarks || "",
          };
        });
        setLocalRecords(initialMap);
      }
    }
  }, [session, isDirty, conflictError]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 space-y-6 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 rounded-2xl" />
        <div className="h-44 bg-slate-200 rounded-3xl" />
        <div className="h-96 bg-slate-200 rounded-3xl" />
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-800 flex items-center justify-center mx-auto shadow-xs border border-rose-200">
          <AlertCircle className="w-8 h-8 text-rose-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">
            Sesi Kelas Tidak Ditemukan
          </h2>
          <p className="text-sm text-slate-600">
            {(error as Error)?.message ||
              `ID Sesi presensi ${sessionId} tidak ditemukan atau Anda tidak memiliki hak akses.`}
          </p>
        </div>
        <Link
          href="/portal-guru"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0c3960] hover:bg-[#0a2e4e] text-white text-xs font-bold shadow-md transition"
        >
          <ArrowLeft className="w-4 h-4 text-amber-300" />
          <span>Kembali ke Jadwal Mengajar</span>
        </Link>
      </div>
    );
  }

  const isSubmitted = session.status === "SUBMITTED";
  const recordsList: AttendanceRecordItemDto[] = session.records || [];

  // Computed counts from local interactive state
  const totalStudents = recordsList.length;
  let hadirCount = 0;
  let izinCount = 0;
  let sakitCount = 0;
  let alpaCount = 0;

  recordsList.forEach((rec) => {
    const current = localRecords[rec.student_id] || {
      status: rec.status,
      remarks: rec.remarks,
    };
    if (current.status === "PRESENT") hadirCount++;
    else if (current.status === "EXCUSED") izinCount++;
    else if (current.status === "SICK") sakitCount++;
    else if (current.status === "UNEXCUSED_ABSENT") alpaCount++;
  });

  const attendancePercentage =
    totalStudents > 0 ? Math.round((hadirCount / totalStudents) * 100) : 0;

  // Handlers for student status and remarks
  const handleStatusChange = (
    studentId: string,
    newStatus: AttendanceStatus
  ) => {
    if (isSubmitted) return;
    setLocalRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: newStatus,
        remarks: prev[studentId]?.remarks || "",
      },
    }));
    setIsDirty(true);
    setConflictError(null);
  };

  const handleRemarksChange = (studentId: string, remarks: string) => {
    if (isSubmitted) return;
    setLocalRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: prev[studentId]?.status || "PRESENT",
        remarks,
      },
    }));
    setIsDirty(true);
    setConflictError(null);
  };

  const handleMarkAllPresent = () => {
    if (isSubmitted) return;
    const updated: Record<string, { status: AttendanceStatus; remarks: string }> =
      {};
    recordsList.forEach((rec) => {
      updated[rec.student_id] = {
        status: "PRESENT",
        remarks: localRecords[rec.student_id]?.remarks || "",
      };
    });
    setLocalRecords(updated);
    setIsDirty(true);
    setConflictError(null);
    showToast("Semua siswa berhasil ditandai Hadir di form!");
  };

  // Build payload for updating records
  const buildRecordsPayload = (): RecordUpdateItemDto[] => {
    return recordsList.map((rec) => {
      const current = localRecords[rec.student_id] || {
        status: rec.status,
        remarks: rec.remarks,
      };
      return {
        student_id: rec.student_id,
        status: current.status,
        remarks: current.remarks || "",
      };
    });
  };

  // Save Draft (PUT /attendance-sessions/{id}/records)
  const handleSaveDraft = async () => {
    try {
      const payload = {
        version: session.version,
        records: buildRecordsPayload(),
      };
      await updateRecordsMutation.mutateAsync({
        id: session.id,
        data: payload,
      });
      setIsDirty(false);
      setConflictError(null);
      showToast("Draf presensi berhasil disimpan ke backend!");
    } catch (err: any) {
      if (err instanceof ApiError && err.code === "CONFLICT") {
        setConflictError({
          message:
            "Terjadi konflik versi: Sesi presensi telah diperbarui oleh pengguna lain atau tab lain. Input perubahan Anda tetap tersimpan di form ini.",
        });
      } else {
        showToast(err?.message || "Gagal menyimpan draf presensi.", "error");
      }
    }
  };

  // Force Apply Local Changes over latest server version
  const handleResolveConflictApply = async () => {
    try {
      // 1. Fetch fresh session to obtain the current server version
      const freshResult = await refetch();
      const freshVersion = freshResult.data?.version;
      if (!freshVersion) {
        showToast("Gagal mengambil versi terbaru dari server.", "error");
        return;
      }

      // 2. Retry update with the fresh version number using the preserved local edits
      const payload = {
        version: freshVersion,
        records: buildRecordsPayload(),
      };
      await updateRecordsMutation.mutateAsync({
        id: session.id,
        data: payload,
      });

      setIsDirty(false);
      setConflictError(null);
      showToast("Perubahan Anda berhasil diterapkan ke versi terbaru!");
    } catch (err: any) {
      showToast(err?.message || "Gagal menerapkan perubahan.", "error");
    }
  };

  // Discard local changes and reload from server
  const handleResolveConflictDiscard = async () => {
    setIsDirty(false);
    setConflictError(null);
    await refetch();
    showToast("Data form telah disinkronkan ulang dengan server.");
  };

  // Submit and Lock Session (POST /attendance-sessions/{id}/submit)
  const handleConfirmSubmit = async () => {
    try {
      // 1. If dirty, save records first
      let currentVersion = session.version;
      if (isDirty) {
        const updateRes = await updateRecordsMutation.mutateAsync({
          id: session.id,
          data: {
            version: currentVersion,
            records: buildRecordsPayload(),
          },
        });
        currentVersion = updateRes.version;
        setIsDirty(false);
      }

      // 2. Submit session
      await submitSessionMutation.mutateAsync({
        id: session.id,
        data: {
          version: currentVersion,
        },
      });

      setShowSubmitConfirm(false);
      setConflictError(null);
      showToast("Presensi berhasil dikunci dan disimpan!");
    } catch (err: any) {
      setShowSubmitConfirm(false);
      if (err instanceof ApiError && err.code === "CONFLICT") {
        setConflictError({
          message:
            "Terjadi konflik versi saat submit: Sesi presensi telah diperbarui sebelumnya. Perubahan Anda tetap aman di halaman ini.",
        });
      } else {
        showToast(err?.message || "Gagal mengunci sesi presensi.", "error");
      }
    }
  };

  const filteredRecords = recordsList.filter((rec) => {
    const s = search.toLowerCase();
    return (
      rec.student_name.toLowerCase().includes(s) ||
      rec.student_nis.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
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

      {/* Confirmation Modal Submit */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                Kunci & Simpan Presensi?
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setelah disubmit, sesi presensi <strong>{session.class_name}</strong>{" "}
                akan dikunci (SUBMITTED) dan tidak dapat diubah lagi oleh guru
                mata pelajaran.
              </p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Total Siswa:</span>
                <span className="font-bold">{totalStudents}</span>
              </div>
              <div className="flex justify-between">
                <span>Hadir:</span>
                <span className="font-bold text-emerald-700">{hadirCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Izin / Sakit / Alpa:</span>
                <span className="font-bold text-amber-700">
                  {izinCount} / {sakitCount} / {alpaCount}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submitSessionMutation.isPending}
                onClick={handleConfirmSubmit}
                className="px-5 py-2.5 rounded-xl bg-[#0c3960] hover:bg-[#0a2e4e] text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5 text-amber-300" />
                <span>
                  {submitSessionMutation.isPending
                    ? "Mengunci Sesi..."
                    : "Ya, Kunci Sekarang"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tombol Navigasi Kembali */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal-guru"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow transition"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Kembali ke Jadwal & Presensi Mapel</span>
        </Link>

        {isDirty && !isSubmitted && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Ada perubahan belum tersimpan</span>
          </span>
        )}
      </div>

      {/* =========================================================================
          CONCURRENCY CONFLICT ALERT BANNER (ACCEPTANCE CRITERIA 4)
      ========================================================================== */}
      {conflictError && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-3xl p-5 shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-amber-900">
                Peringatan: Konflik Versi Concurrency Terdeteksi
              </h3>
              <p className="text-xs text-amber-800 leading-relaxed">
                {conflictError.message}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 flex-wrap">
            <button
              type="button"
              onClick={handleResolveConflictApply}
              disabled={updateRecordsMutation.isPending}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  updateRecordsMutation.isPending ? "animate-spin" : ""
                }`}
              />
              <span>Terapkan Perubahan Saya ke Versi Terbaru</span>
            </button>

            <button
              type="button"
              onClick={handleResolveConflictDiscard}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <span>Muat Ulang Data Server (Batalkan Perubahan Lokal)</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          LOCKED SESSION BANNER
      ========================================================================== */}
      {isSubmitted && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-700 shrink-0" />
            <p className="text-xs sm:text-sm text-emerald-950 font-medium">
              Sesi presensi ini telah <strong>dikunci (SUBMITTED)</strong>. Data
              kehadiran bersifat final dan hanya dapat dibuka kembali oleh Super
              Admin.
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-600 text-white text-[11px] font-extrabold rounded-xl shrink-0">
            Terkunci
          </span>
        </div>
      )}

      {/* =========================================================================
          HEADER LEMBAR PRESENSI
      ========================================================================== */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0c3960] text-amber-300 font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
            {session.class_name.replace("Kelas ", "").slice(0, 3)}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Lembar Presensi {session.class_name}
              </h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-extrabold border ${
                  isSubmitted
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : session.status === "REOPENED"
                    ? "bg-blue-100 text-blue-800 border-blue-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}
              >
                {isSubmitted
                  ? "Selesai (Terkunci)"
                  : session.status === "REOPENED"
                  ? "Dibuka Kembali"
                  : "Draf Aktif"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
              <span className="font-semibold text-slate-700">
                {session.subject_name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Pengajar: {session.teacher_name}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                <span>{new Date(session.held_at).toLocaleDateString("id-ID", { dateStyle: "full" })}</span>
              </span>
              <span>•</span>
              <span className="text-[11px] text-slate-400 font-mono">
                v{session.version}
              </span>
            </div>
          </div>
        </div>

        {/* Live Attendance Counter Pill */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-center self-start md:self-auto shrink-0">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">
            Persentase Hadir
          </span>
          <span className="text-2xl font-black text-emerald-700">
            {attendancePercentage}%
          </span>
          <span className="text-[11px] text-slate-500 block">
            {hadirCount} dari {totalStudents} Siswa
          </span>
        </div>
      </div>

      {/* =========================================================================
          TOMBOL AKSI CEPAT & STATUS SINKRONISASI
      ========================================================================== */}
      {!isSubmitted && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllPresent}
              className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Tandai Semua Siswa Hadir</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={updateRecordsMutation.isPending || !isDirty}
              onClick={handleSaveDraft}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs disabled:opacity-40"
            >
              <Save className="w-4 h-4 text-slate-500" />
              <span>
                {updateRecordsMutation.isPending
                  ? "Menyimpan..."
                  : "Simpan Draf"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setShowSubmitConfirm(true)}
              className="px-5 py-2.5 bg-[#0c3960] hover:bg-[#0a2e4e] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4 text-amber-300" />
              <span>Kunci & Simpan Presensi</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          TABEL KEHADIRAN SISWA
      ========================================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        {/* Search & Counter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau NIS siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <span>Daftar Siswa Kelas:</span>
            <span className="font-bold text-slate-900">{totalStudents} Siswa</span>
          </div>
        </div>

        {/* Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-center w-12">No</th>
                  <th className="px-4 py-3">Nama Siswa & NIS</th>
                  <th className="px-4 py-3 text-center">
                    Pilihan Kehadiran (H / I / S / A)
                  </th>
                  <th className="px-4 py-3">Catatan Khusus Pengajar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada siswa yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((rec, index) => {
                    const studentState = localRecords[rec.student_id] || {
                      status: rec.status,
                      remarks: rec.remarks,
                    };
                    const status = studentState.status;

                    return (
                      <tr
                        key={rec.student_id}
                        className="hover:bg-amber-50/20 transition"
                      >
                        <td className="px-4 py-3 text-center font-bold text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">
                            {rec.student_name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            NIS: {rec.student_nis}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                            {/* HADIR (PRESENT) */}
                            <button
                              type="button"
                              disabled={isSubmitted}
                              onClick={() =>
                                handleStatusChange(rec.student_id, "PRESENT")
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed ${
                                status === "PRESENT"
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-slate-50 hover:bg-emerald-50 text-slate-600 border border-slate-200"
                              }`}
                            >
                              <span>H</span>
                              <span className="hidden sm:inline font-normal text-[10px]">
                                (Hadir)
                              </span>
                            </button>

                            {/* IZIN (EXCUSED) */}
                            <button
                              type="button"
                              disabled={isSubmitted}
                              onClick={() =>
                                handleStatusChange(rec.student_id, "EXCUSED")
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed ${
                                status === "EXCUSED"
                                  ? "bg-amber-500 text-white shadow-xs"
                                  : "bg-slate-50 hover:bg-amber-50 text-slate-600 border border-slate-200"
                              }`}
                            >
                              <span>I</span>
                              <span className="hidden sm:inline font-normal text-[10px]">
                                (Izin)
                              </span>
                            </button>

                            {/* SAKIT (SICK) */}
                            <button
                              type="button"
                              disabled={isSubmitted}
                              onClick={() =>
                                handleStatusChange(rec.student_id, "SICK")
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed ${
                                status === "SICK"
                                  ? "bg-blue-600 text-white shadow-xs"
                                  : "bg-slate-50 hover:bg-blue-50 text-slate-600 border border-slate-200"
                              }`}
                            >
                              <span>S</span>
                              <span className="hidden sm:inline font-normal text-[10px]">
                                (Sakit)
                              </span>
                            </button>

                            {/* ALPA (UNEXCUSED_ABSENT) */}
                            <button
                              type="button"
                              disabled={isSubmitted}
                              onClick={() =>
                                handleStatusChange(
                                  rec.student_id,
                                  "UNEXCUSED_ABSENT"
                                )
                              }
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed ${
                                status === "UNEXCUSED_ABSENT"
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-slate-50 hover:bg-rose-50 text-slate-600 border border-slate-200"
                              }`}
                            >
                              <span>A</span>
                              <span className="hidden sm:inline font-normal text-[10px]">
                                (Alpa)
                              </span>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            disabled={isSubmitted}
                            value={studentState.remarks || ""}
                            onChange={(e) =>
                              handleRemarksChange(
                                rec.student_id,
                                e.target.value
                              )
                            }
                            placeholder={
                              isSubmitted ? "-" : "Tulis catatan khusus..."
                            }
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden disabled:bg-slate-100 disabled:text-slate-400"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Bar Bawah */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="text-emerald-700 font-bold">
              Hadir: {hadirCount}
            </span>
            <span>•</span>
            <span className="text-amber-700 font-bold">
              Izin: {izinCount}
            </span>
            <span>•</span>
            <span className="text-blue-700 font-bold">
              Sakit: {sakitCount}
            </span>
            <span>•</span>
            <span className="text-rose-700 font-bold">
              Alpa: {alpaCount}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#0c3960] text-amber-300 text-[11px] font-extrabold ml-1">
              {attendancePercentage}% Hadir
            </span>
          </div>

          {!isSubmitted && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={updateRecordsMutation.isPending || !isDirty}
                onClick={handleSaveDraft}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {updateRecordsMutation.isPending
                    ? "Menyimpan..."
                    : "Simpan Draf"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowSubmitConfirm(true)}
                className="px-6 py-2.5 bg-[#0c3960] hover:bg-[#0a2e4e] text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-900/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4 text-amber-300" />
                <span>Kunci & Simpan Presensi</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

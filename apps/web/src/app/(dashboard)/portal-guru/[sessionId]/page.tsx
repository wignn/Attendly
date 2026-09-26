"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useAuthRole } from "@/context/auth-role-context";
import { useAttendanceDate } from "@/context/attendance-date-context";
import {
  useTeachingSessions,
  AttendanceStatus,
} from "@/context/teaching-sessions-context";
import {
  ArrowLeft,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Check,
  Search,
  Send,
  CalendarDays,
  FileCheck2,
} from "lucide-react";

export default function SessionAttendanceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = Array.isArray(params?.sessionId)
    ? params.sessionId[0]
    : (params?.sessionId as string);

  const { currentUser } = useAuthRole();
  const { fullDisplayDate, activeDate } = useAttendanceDate();
  const {
    getSessionById,
    updateStudentStatus,
    updateStudentNote,
    markAllPresent,
    submitSession,
  } = useTeachingSessions();

  const session = getSessionById(sessionId);

  const [topic, setTopic] = React.useState(session?.topic || "");
  const [search, setSearch] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Sync topic when session loads
  React.useEffect(() => {
    if (session?.topic) {
      setTopic(session.topic);
    }
  }, [session?.topic]);

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs border border-amber-200">
          <AlertCircle className="w-8 h-8 text-amber-600" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">
            Sesi Kelas Tidak Ditemukan
          </h2>
          <p className="text-sm text-slate-600">
            ID Sesi presensi <code>{sessionId}</code> tidak terdaftar pada jadwal Anda.
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

  const isDone = session.status === "Selesai";

  // Quick stats
  const total = session.students.length;
  const hadir = session.students.filter((s) => s.status === "Hadir").length;
  const izin = session.students.filter((s) => s.status === "Izin").length;
  const sakit = session.students.filter((s) => s.status === "Sakit").length;
  const alpa = session.students.filter((s) => s.status === "Alpa").length;
  const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;

  const handleMarkAll = () => {
    markAllPresent(session.id);
    setToastMessage("Semua siswa berhasil ditandai Hadir!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSession(session.id, topic);
    setToastMessage(
      `Presensi ${session.className} berhasil dikunci dan disimpan!`
    );
    setTimeout(() => {
      setToastMessage(null);
      router.push("/portal-guru");
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0c3960] text-white px-5 py-3 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Tombol Navigasi Kembali */}
      <div>
        <Link
          href="/portal-guru"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs hover:shadow transition"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Kembali ke Jadwal & Presensi Mapel</span>
        </Link>
      </div>

      {/* Header Lembar Presensi */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0c3960] text-amber-300 font-black text-xl flex items-center justify-center shrink-0 shadow-xs">
            {session.code.replace("Kelas ", "")}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Lembar Presensi {session.className}
              </h1>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-extrabold border ${
                  isDone
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : "bg-amber-100 text-amber-900 border-amber-300"
                }`}
              >
                {isDone ? `Selesai (${session.submitTime})` : "Belum Disubmit"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> {session.jam}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> {session.room}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5 text-slate-400" />{" "}
                {fullDisplayDate || activeDate}
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
            {percentage}%
          </span>
          <span className="text-[11px] text-slate-500 block">
            {hadir} dari {total} Siswa
          </span>
        </div>
      </div>

      {/* Form Topik Materi & Tombol Cepat Hadir */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1 space-y-1">
          <label className="text-xs font-bold text-slate-700 block">
            Topik / Materi Pokok Pembelajaran Sesi Ini:
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Contoh: Menelaah Struktur & Kaidah Kebahasaan Teks Deskripsi"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960]"
          />
        </div>

        <div className="md:self-end">
          <button
            type="button"
            onClick={handleMarkAll}
            className="w-full md:w-auto px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tandai Semua Siswa Hadir</span>
          </button>
        </div>
      </div>

      {/* Tabel Kehadiran Siswa */}
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
            <span className="font-bold text-slate-900">{total} Siswa</span>
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
                {session.students
                  .filter(
                    (st) =>
                      st.name.toLowerCase().includes(search.toLowerCase()) ||
                      st.nis.includes(search)
                  )
                  .map((st, index) => (
                    <tr key={st.id} className="hover:bg-amber-50/20 transition">
                      <td className="px-4 py-3 text-center font-bold text-slate-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <div className="text-[10px] text-slate-400">
                          NIS: {st.nis}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                          {/* HADIR */}
                          <button
                            type="button"
                            onClick={() =>
                              updateStudentStatus(session.id, st.id, "Hadir")
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              st.status === "Hadir"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-slate-50 hover:bg-emerald-50 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span>H</span>
                            <span className="hidden sm:inline font-normal text-[10px]">
                              (Hadir)
                            </span>
                          </button>

                          {/* IZIN */}
                          <button
                            type="button"
                            onClick={() =>
                              updateStudentStatus(session.id, st.id, "Izin")
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              st.status === "Izin"
                                ? "bg-amber-500 text-white shadow-xs"
                                : "bg-slate-50 hover:bg-amber-50 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span>I</span>
                            <span className="hidden sm:inline font-normal text-[10px]">
                              (Izin)
                            </span>
                          </button>

                          {/* SAKIT */}
                          <button
                            type="button"
                            onClick={() =>
                              updateStudentStatus(session.id, st.id, "Sakit")
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              st.status === "Sakit"
                                ? "bg-blue-600 text-white shadow-xs"
                                : "bg-slate-50 hover:bg-blue-50 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span>S</span>
                            <span className="hidden sm:inline font-normal text-[10px]">
                              (Sakit)
                            </span>
                          </button>

                          {/* ALPA */}
                          <button
                            type="button"
                            onClick={() =>
                              updateStudentStatus(session.id, st.id, "Alpa")
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              st.status === "Alpa"
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
                          defaultValue={st.note || ""}
                          onBlur={(e) =>
                            updateStudentNote(session.id, st.id, e.target.value)
                          }
                          placeholder="Catatan..."
                          className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 bg-slate-50 focus:bg-white focus:outline-hidden"
                        />
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Bar Bawah */}
        <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs flex-wrap">
            <span className="text-emerald-700 font-bold">Hadir: {hadir}</span>
            <span>•</span>
            <span className="text-amber-700 font-bold">Izin: {izin}</span>
            <span>•</span>
            <span className="text-blue-700 font-bold">Sakit: {sakit}</span>
            <span>•</span>
            <span className="text-rose-700 font-bold">Alpa: {alpa}</span>
            <span className="px-2.5 py-0.5 rounded-md bg-[#0c3960] text-amber-300 text-[11px] font-extrabold ml-1">
              {percentage}% Hadir
            </span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            className="px-6 py-3 bg-[#0c3960] hover:bg-[#0a2e4e] text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-900/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 text-amber-300" />
            <span>Kunci & Simpan Presensi</span>
          </button>
        </div>
      </div>
    </div>
  );
}

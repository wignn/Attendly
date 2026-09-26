"use client";

import * as React from "react";
import Link from "next/link";
import { useAuthRole } from "@/context/auth-role-context";
import { useAttendanceDate } from "@/context/attendance-date-context";
import { useTeachingSessions } from "@/context/teaching-sessions-context";
import {
  CalendarDays,
  Clock,
  Users,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

export default function PortalGuruPage() {
  const { currentUser } = useAuthRole();
  const { activeDate, activeDayName, fullDisplayDate, changeActiveDate } =
    useAttendanceDate();
  const { scheduleData } = useTeachingSessions();

  const activeSubject = currentUser.subject || "Bahasa Indonesia";

  // Get current day's sessions from shared context
  const currentDaySessions = React.useMemo(() => {
    return scheduleData[activeDayName] || scheduleData["Rabu"] || [];
  }, [scheduleData, activeDayName]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* =========================================================================
          1. HEADER CARD (SESUAI GAMBAR REFERENSI PENGGUNA)
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

        {/* Input Tanggal Sesi Minimalis */}
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
          2. BANNER NOTIFIKASI MINT (SESUAI GAMBAR REFERENSI PENGGUNA)
      ========================================================================== */}
      <div className="bg-[#eefcf5] border border-[#a3e6cd] rounded-2xl p-4 sm:px-5 sm:py-3.5 flex items-center gap-3 shadow-xs">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <p className="text-xs sm:text-sm text-slate-700 leading-normal">
          <strong className="text-emerald-900">
            Simulasi Jadwal Rotasi Mengajar:
          </strong>{" "}
          Tanggal <strong>{fullDisplayDate || activeDate}</strong> memuat{" "}
          <strong>
            {currentDaySessions.length} kelas aktif {activeSubject}
          </strong>{" "}
          di bawah ini.
        </p>
      </div>

      {/* Opsional: Tugas Tambahan Wali Kelas (HANYA tampil jika punya penugasan) */}
      {currentUser.homeroomClass && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-700">
            <span className="w-6 h-6 rounded-lg bg-amber-400 text-[#0c3960] font-black flex items-center justify-center text-[10px]">
              {currentUser.homeroomClass}
            </span>
            <span>
              Anda juga bertugas sebagai <strong>Wali Kelas {currentUser.homeroomClass}</strong>.
            </span>
          </div>
          <Link
            href="/siswa"
            className="text-xs font-bold text-[#0c3960] hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Buka Rekap Siswa Binaan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* =========================================================================
          3. KARTU SESI KELAS DUA-WARNA (KLIK LANGSUNG KE HALAMAN BARU)
      ========================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {currentDaySessions.map((sess) => {
          const isDone = sess.status === "Selesai";

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
                    {sess.code}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition ${
                      isDone
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                        : "bg-white/10 text-white border-white/20"
                    }`}
                  >
                    {isDone ? "Selesai" : "Belum Absen"}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium">
                  {sess.subject}
                </p>

                <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sess.jam}</span>
                </div>
              </div>

              {/* Bagian Bawah: Putih Bersih */}
              <div className="bg-white p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sess.students.length} Siswa Terdaftar</span>
                  </div>
                  <span
                    className={`font-semibold ${
                      isDone ? "text-emerald-600 font-bold" : "text-slate-400"
                    }`}
                  >
                    {isDone ? "Tersimpan" : "Draft Siap"}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between text-xs font-bold text-slate-700 group-hover:text-emerald-700 transition">
                  <span>Buka Tab Absensi</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

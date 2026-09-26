"use client";

import * as React from "react";
import Link from "next/link";
import { useAuthRole } from "@/context/auth-role-context";
import { useAttendanceDate } from "@/context/attendance-date-context";
import {
  ClipboardCheck,
  CalendarDays,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";

export default function AbsensiPage() {
  const { currentUser, activeRole } = useAuthRole();
  const { activeDate, activeDayName } = useAttendanceDate();

  // If active user is Teacher (with or without homeroom duty), show teacher presensi view
  if (activeRole === "TEACHER" || activeRole === "HOMEROOM_TEACHER") {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
              <span>Presensi Sesi Tatap Muka Mapel</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Presensi Siswa Jam Pelajaran
            </h1>
            <p className="text-xs text-slate-500">
              Anda sedang login sebagai <strong className="text-slate-800">{currentUser.name}</strong> ({currentUser.subject || "Guru Mapel"}{currentUser.homeroomClass ? ` • Wali Kelas ${currentUser.homeroomClass}` : ""}).
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

        {/* Quick Session Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { code: "7B", mapel: "Bahasa Indonesia", jam: "09.15 - 10.45 WIB", status: "Belum Disubmit", badge: "Sedang Berlangsung" },
            { code: "7A", mapel: "Bahasa Indonesia", jam: "07.40 - 09.00 WIB", status: "Selesai", badge: "Sesi 1" },
            { code: "7C", mapel: "Bahasa Indonesia", jam: "11.00 - 12.20 WIB", status: "Belum Disubmit", badge: "Sesi 3" },
          ].map((item) => (
            <div
              key={item.code}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-[#0c3960] font-bold text-xs">
                  Kelas {item.code}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  item.status === "Selesai" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                }`}>
                  {item.status}
                </span>
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{item.mapel}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{item.jam}</span>
                </div>
              </div>
              <Link
                href="/portal-guru"
                className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition"
              >
                <span>Input Absen</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          ))}
        </div>

        {/* Banner Tambahan Wali Kelas (HANYA MUNCUL JIKA PUNYA KELAS BINAAN) */}
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
              href="/siswa"
              className="px-4 py-2 bg-[#0c3960] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#092b49] transition shrink-0"
            >
              <span>Buka Rekap Siswa {currentUser.homeroomClass}</span>
              <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
            </Link>
          </div>
        )}
      </div>
    );
  }

  // Super Admin & Homeroom View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-amber-200/90 shadow-xs">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Monitoring Presensi Terpadu
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
            Manajemen Absensi Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekap kehadiran harian SMPN 1 Tirtajaya per tanggal: <strong className="text-slate-800">{activeDayName}, {activeDate}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/portal-guru"
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-[#0c3960] border border-amber-200 rounded-xl text-xs font-bold flex items-center gap-2 transition"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Simulasi Presensi Guru</span>
          </Link>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Hadir Lengkap</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">948 Siswa</div>
          <span className="text-[11px] text-emerald-700 font-semibold">96.7% dari total siswa</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Sakit (Dokter)</span>
          <div className="text-2xl font-extrabold text-blue-600 mt-1">14 Siswa</div>
          <span className="text-[11px] text-slate-400">Surat keterangan terlampir</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Izin Resmi</span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">11 Siswa</div>
          <span className="text-[11px] text-slate-400">Konfirmasi wali kelas</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Alpa / Tanpa Kabar</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">7 Siswa</div>
          <span className="text-[11px] text-rose-600 font-semibold">Perlu tindak lanjut BK</span>
        </div>
      </div>

      {/* Rekap per Jenjang Rombel */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">
          Ringkasan Kehadiran Rombel Hari Ini ({activeDate})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { tingkat: "Kelas 7", rombel: "8 Rombel (7A - 7H)", hadir: "97.2%", siswa: "256 Siswa" },
            { tingkat: "Kelas 8", rombel: "8 Rombel (8A - 8H)", hadir: "96.4%", siswa: "252 Siswa" },
            { tingkat: "Kelas 9", rombel: "8 Rombel (9A - 9H)", hadir: "95.8%", siswa: "248 Siswa" },
          ].map((item) => (
            <div
              key={item.tingkat}
              className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">{item.tingkat}</span>
                <span className="text-emerald-700 font-extrabold text-sm">{item.hadir}</span>
              </div>
              <p className="text-xs text-slate-500">{item.rombel}</p>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: item.hadir }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

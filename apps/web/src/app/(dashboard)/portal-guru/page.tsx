"use client";

import * as React from "react";
import Link from "next/link";
import { useAuthRole } from "@/context/auth-role-context";
import { useAttendanceDate } from "@/context/attendance-date-context";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Award,
  Sparkles,
} from "lucide-react";

export default function PortalGuruPage() {
  const { currentUser, activeRole } = useAuthRole();
  const { activeDate, activeDayName } = useAttendanceDate();

  const schedules = [
    {
      id: "sch-1",
      subject: currentUser.subject || "Bahasa Indonesia",
      classCode: "Kelas 7B",
      time: "07.40 - 09.00 WIB",
      room: "Ruang Kelas 7B (Lantai 2)",
      totalStudents: 32,
      attended: 30,
      status: "Berlangsung",
      statusColor: "emerald",
      badge: "Sesi Aktif",
    },
    {
      id: "sch-2",
      subject: currentUser.subject || "Bahasa Indonesia",
      classCode: "Kelas 8A",
      time: "09.15 - 10.45 WIB",
      room: "Ruang Kelas 8A (Lantai 1)",
      totalStudents: 30,
      attended: 0,
      status: "Mendatang",
      statusColor: "amber",
      badge: "Jam Ke-2",
    },
    {
      id: "sch-3",
      subject: currentUser.subject || "Bahasa Indonesia",
      classCode: "Kelas 9C",
      time: "10.45 - 12.05 WIB",
      room: "Ruang Kelas 9C (Lantai 2)",
      totalStudents: 31,
      attended: 0,
      status: "Mendatang",
      statusColor: "slate",
      badge: "Jam Ke-3",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0c3960] to-[#144f82] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-900/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold border border-white/15">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portal Presensi Guru & Wali Kelas</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Selamat Datang, {currentUser.name}!
          </h1>
          <p className="text-sm text-slate-300 max-w-xl">
            Hari ini <span className="font-bold text-amber-300">{activeDayName}, {activeDate}</span>. Anda memiliki <span className="font-bold text-white">3 jadwal tatap muka</span> di kelas.
          </p>
        </div>

        {currentUser.homeroomClass && (
          <div className="bg-white/10 backdrop-blur-xs border border-white/15 rounded-2xl p-4 shrink-0 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-400 text-[#0c3960] flex items-center justify-center font-bold text-xl shadow">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wide">
                Wali Kelas Binaan
              </div>
              <div className="text-base font-extrabold text-white">
                Kelas {currentUser.homeroomClass}
              </div>
              <div className="text-[11px] text-slate-300">
                32 Siswa • 94% Kehadiran Rombel
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sesi Mengajar Hari Ini */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Jadwal Mengajar Tatap Muka Hari Ini
            </h2>
            <p className="text-xs text-slate-500">
              Pilih kelas untuk memulai atau memeriksa presensi siswa per jam pelajaran
            </p>
          </div>
          <span className="text-xs font-bold text-[#0c3960] bg-amber-100/70 border border-amber-200 px-3 py-1 rounded-xl">
            {activeDayName}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {schedules.map((sch) => (
            <div
              key={sch.id}
              className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                    {sch.badge}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      sch.status === "Berlangsung"
                        ? "bg-emerald-100 text-emerald-800 animate-pulse"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {sch.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {sch.classCode}
                  </h3>
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                    <span>{sch.subject}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold">{sch.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sch.room}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{sch.totalStudents} Siswa Terdaftar</span>
                  </div>
                </div>
              </div>

              <Link
                href="/absensi"
                className="w-full py-2.5 px-3 rounded-xl bg-[#0c3960] hover:bg-[#0a2e4e] text-white text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>Input / Cek Presensi</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
} from "lucide-react";
import { useAuthRole } from "@/context/auth-role-context";

export interface SubjectClassStat {
  id: string;
  code: string;
  className: string;
  percentage: number;
  totalStudents: number;
  avgHadir: number;
  students: {
    id: number;
    name: string;
    nis: string;
    hadir: number;
    izin: number;
    sakit: number;
    alpa: number;
    percentage: number;
    status: "Aman" | "Perlu Perhatian" | "Kritis";
    note?: string;
  }[];
}

const DEFAULT_MAPEL_DATA: Record<string, SubjectClassStat[]> = {
  "Bahasa Indonesia": [
    {
      id: "7a",
      code: "7A",
      className: "Kelas 7A - Bahasa Indonesia",
      percentage: 96,
      totalStudents: 32,
      avgHadir: 31,
      students: [
        { id: 101, name: "Aditya Pratama", nis: "20260701", hadir: 22, izin: 0, sakit: 0, alpa: 2, percentage: 91, status: "Perlu Perhatian", note: "Sering izin ke toilet tapi tidak kembali" },
        { id: 102, name: "Alya Zahra", nis: "20260702", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 103, name: "Bagas Saputra", nis: "20260703", hadir: 23, izin: 1, sakit: 0, alpa: 0, percentage: 96, status: "Aman", note: "Izin acara keluarga" },
        { id: 104, name: "Citra Kirana", nis: "20260704", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 105, name: "Dimas Anggara", nis: "20260705", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 106, name: "Eka Rahayu", nis: "20260706", hadir: 23, izin: 0, sakit: 1, alpa: 0, percentage: 96, status: "Aman" },
        { id: 107, name: "Fajar Nugraha", nis: "20260707", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
      ],
    },
    {
      id: "7b",
      code: "7B",
      className: "Kelas 7B - Bahasa Indonesia",
      percentage: 94,
      totalStudents: 32,
      avgHadir: 30,
      students: [
        { id: 108, name: "Ahmad Fauzan", nis: "20260711", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 109, name: "Bella Safitri", nis: "20260712", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 110, name: "Candra Wijaya", nis: "20260713", hadir: 21, izin: 0, sakit: 0, alpa: 3, percentage: 87, status: "Kritis", note: "3x alpa di jam ke-3 (sering bolos setelah istirahat)" },
        { id: 111, name: "Dewi Lestari", nis: "20260714", hadir: 23, izin: 1, sakit: 0, alpa: 0, percentage: 96, status: "Aman" },
        { id: 112, name: "Ferry Irawan", nis: "20260715", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
      ],
    },
    {
      id: "7c",
      code: "7C",
      className: "Kelas 7C - Bahasa Indonesia",
      percentage: 91,
      totalStudents: 31,
      avgHadir: 28,
      students: [
        { id: 113, name: "Farhan Maulana", nis: "20260721", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 114, name: "Gita Permata", nis: "20260722", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 115, name: "Hendra Gunawan", nis: "20260723", hadir: 22, izin: 0, sakit: 0, alpa: 2, percentage: 91, status: "Perlu Perhatian", note: "2x alpa tanpa keterangan tertulis" },
        { id: 116, name: "Indah Puspita", nis: "20260724", hadir: 23, izin: 0, sakit: 1, alpa: 0, percentage: 96, status: "Aman" },
      ],
    },
    {
      id: "7d",
      code: "7D",
      className: "Kelas 7D - Bahasa Indonesia",
      percentage: 87,
      totalStudents: 30,
      avgHadir: 26,
      students: [
        { id: 117, name: "Joko Widodo", nis: "20260731", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 118, name: "Kartika Sari", nis: "20260732", hadir: 23, izin: 1, sakit: 0, alpa: 0, percentage: 96, status: "Aman" },
        { id: 119, name: "Lukman Hakim", nis: "20260733", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
      ],
    },
    {
      id: "7e",
      code: "7E",
      className: "Kelas 7E - Bahasa Indonesia",
      percentage: 83,
      totalStudents: 32,
      avgHadir: 27,
      students: [
        { id: 120, name: "Muhammad Rizky", nis: "20260741", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 121, name: "Nadia Safira", nis: "20260742", hadir: 23, izin: 1, sakit: 0, alpa: 0, percentage: 96, status: "Aman" },
        { id: 122, name: "Oki Setiawan", nis: "20260743", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
      ],
    },
  ],
  Matematika: [
    {
      id: "7a",
      code: "7A",
      className: "Kelas 7A - Matematika",
      percentage: 97,
      totalStudents: 32,
      avgHadir: 31,
      students: [
        { id: 201, name: "Aditya Pratama", nis: "20260701", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 202, name: "Alya Zahra", nis: "20260702", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 203, name: "Bagas Saputra", nis: "20260703", hadir: 23, izin: 1, sakit: 0, alpa: 0, percentage: 96, status: "Aman" },
      ],
    },
    {
      id: "7b",
      code: "7B",
      className: "Kelas 7B - Matematika",
      percentage: 95,
      totalStudents: 32,
      avgHadir: 30,
      students: [
        { id: 204, name: "Ahmad Fauzan", nis: "20260711", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 205, name: "Bella Safitri", nis: "20260712", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 206, name: "Candra Wijaya", nis: "20260713", hadir: 22, izin: 0, sakit: 0, alpa: 2, percentage: 91, status: "Perlu Perhatian", note: "Sering izin keluar saat kuis MTK" },
      ],
    },
    {
      id: "8a",
      code: "8A",
      className: "Kelas 8A - Matematika",
      percentage: 92,
      totalStudents: 30,
      avgHadir: 28,
      students: [
        { id: 207, name: "Salwa Alifa", nis: "20250801", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 208, name: "Taufik Hidayat", nis: "20250802", hadir: 23, izin: 1, sakit: 0, alpa: 0, percentage: 96, status: "Aman" },
        { id: 209, name: "Umar Bakri", nis: "20250803", hadir: 22, izin: 0, sakit: 0, alpa: 2, percentage: 91, status: "Perlu Perhatian", note: "Alpa 2x di jam pertama" },
      ],
    },
    {
      id: "8b",
      code: "8B",
      className: "Kelas 8B - Matematika",
      percentage: 89,
      totalStudents: 31,
      avgHadir: 27,
      students: [
        { id: 210, name: "Vina Panduwinata", nis: "20250811", hadir: 24, izin: 0, sakit: 0, alpa: 0, percentage: 100, status: "Aman" },
        { id: 211, name: "Wawan Gunawan", nis: "20250812", hadir: 21, izin: 0, sakit: 0, alpa: 3, percentage: 87, status: "Kritis", note: "3x alpa di jam pelajaran Matematika" },
      ],
    },
  ],
};

export function TeacherMapelStatistics() {
  const { currentUser } = useAuthRole();
  const activeSubject = currentUser.subject || "Bahasa Indonesia";

  // Data kelas untuk mapel ini
  const classStats: SubjectClassStat[] =
    DEFAULT_MAPEL_DATA[activeSubject] || DEFAULT_MAPEL_DATA["Bahasa Indonesia"];

  // Drill-down Modal State
  const [selectedClassDetail, setSelectedClassDetail] =
    React.useState<SubjectClassStat | null>(null);
  const [studentSearch, setStudentSearch] = React.useState("");

  // Modal Siswa Perlu Perhatian
  const [attentionModalOpen, setAttentionModalOpen] = React.useState(false);

  // Kumpulan siswa perlu perhatian di seluruh kelas yang diampu guru ini
  const attentionStudents = React.useMemo(() => {
    const list: {
      className: string;
      id: number;
      name: string;
      nis: string;
      alpa: number;
      percentage: number;
      status: "Perlu Perhatian" | "Kritis";
      note?: string;
    }[] = [];

    classStats.forEach((cls) => {
      cls.students.forEach((st) => {
        if (st.status === "Perlu Perhatian" || st.status === "Kritis") {
          list.push({
            className: cls.className,
            id: st.id,
            name: st.name,
            nis: st.nis,
            alpa: st.alpa,
            percentage: st.percentage,
            status: st.status,
            note: st.note,
          });
        }
      });
    });

    return list;
  }, [classStats]);

  // Export CSV for single class
  const handleDownloadClassCsv = (cls: SubjectClassStat) => {
    const headers = ["NO", "NAMA SISWA", "NIS", "HADIR", "IZIN", "SAKIT", "ALPA", "PERSENTASE", "STATUS", "CATATAN"];
    const rows = cls.students.map((s, idx) => [
      idx + 1,
      `"${s.name}"`,
      `'${s.nis}`,
      s.hadir,
      s.izin,
      s.sakit,
      s.alpa,
      `${s.percentage}%`,
      `"${s.status}"`,
      `"${s.note || "-"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Rekap_${cls.code}_${activeSubject.replace(/\s+/g, "_")}_Sept_2026.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* 1. Header Card (Sesuai Referensi Gambar Pengguna) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Statistik Kehadiran Mata Pelajaran
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
          Analisis keaktifan siswa pada seluruh kelas <strong>{activeSubject}</strong> yang diampu. Klik bar kelas di bawah untuk melihat detail per siswa secara penuh.
        </p>
      </div>

      {/* 2. Tiga Kotak Metrik Utama (Sesuai Referensi Gambar Pengguna) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Rata-Rata Kehadiran */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              RATA-RATA KEHADIRAN
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
              94.8%
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 mt-3 pt-1 border-t border-slate-100">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>+1.2% dari minggu lalu</span>
          </div>
        </div>

        {/* Card 2: Total Sesi Mengajar */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
              TOTAL SESI MENGAJAR
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-2">
              24 Sesi
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3 pt-1 border-t border-slate-100 font-medium">
            Bulan September 2026
          </div>
        </div>

        {/* Card 3: Siswa Perlu Perhatian */}
        <div
          onClick={() => setAttentionModalOpen(true)}
          className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition cursor-pointer group"
          title="Klik untuk melihat daftar 3 siswa ini"
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block">
                SISWA PERLU PERHATIAN
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 opacity-0 group-hover:opacity-100 transition">
                Lihat Detail 👁
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-500 mt-2">
              {attentionStudents.length} Siswa
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-3 pt-1 border-t border-slate-100 font-medium group-hover:text-amber-700 transition">
            Sering alpa di jam mapel
          </div>
        </div>
      </div>

      {/* 3. Bottom Card: Rekap Persentase Kehadiran per Kelas Ajar (Sesuai Referensi Gambar Pengguna) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
        {/* Header Bagian Rekap */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Rekap Persentase Kehadiran per Kelas Ajar
          </h2>
          <span className="text-xs text-slate-400 hidden sm:block font-medium">
            Klik bar kelas untuk lihat detail penuh
          </span>
        </div>

        {/* Daftar Bar Kelas Ajar */}
        <div className="space-y-6">
          {classStats.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelectedClassDetail(item);
                setStudentSearch("");
              }}
              className="group cursor-pointer p-3 sm:p-4 -mx-3 sm:-mx-4 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
            >
              {/* Baris Informasi Kelas & Tombol Detail */}
              <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="font-bold text-slate-800 group-hover:text-emerald-700 transition">
                  {item.className}
                </span>

                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-700">
                    {item.percentage}% Kehadiran Rata-rata
                  </span>
                  <button
                    type="button"
                    className="px-2.5 py-1 rounded-lg bg-slate-100 group-hover:bg-[#0c3960] text-slate-600 group-hover:text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    <span>Detail</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar Hijau Zamrud Tebal */}
              <div className="w-full bg-slate-100 rounded-full h-3 sm:h-3.5 overflow-hidden mt-3 shadow-inner">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500 ease-out group-hover:bg-emerald-500"
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: DRILL-DOWN RINCIAN PRESENSI KELAS SPESIFIK
      ========================================================================== */}
      {selectedClassDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0c3960] text-amber-300 font-extrabold flex items-center justify-center text-lg shrink-0 shadow-xs">
                  {selectedClassDetail.code}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {selectedClassDetail.className}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rata-rata Kehadiran: <strong className="text-emerald-600">{selectedClassDetail.percentage}%</strong> • Semester Ganjil 2026/2027
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClassDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics in Modal */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Kehadiran Kelas</span>
                <div className="text-xl font-black text-emerald-700 mt-0.5">{selectedClassDetail.percentage}%</div>
                <span className="text-[10px] text-emerald-800 font-medium">Optimal</span>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total Siswa</span>
                <div className="text-xl font-black text-blue-700 mt-0.5">{selectedClassDetail.totalStudents}</div>
                <span className="text-[10px] text-blue-800 font-medium">Siswa Terdaftar</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Rata-rata Hadir</span>
                <div className="text-xl font-black text-amber-700 mt-0.5">{selectedClassDetail.avgHadir} Siswa</div>
                <span className="text-[10px] text-amber-800 font-medium">Per Sesi Tatap Muka</span>
              </div>
            </div>

            {/* Filter Search Input & Download Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Cari siswa atau NIS..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960]"
                />
              </div>
              <button
                onClick={() => handleDownloadClassCsv(selectedClassDetail)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh CSV Kelas</span>
              </button>
            </div>

            {/* Tabel Siswa di Kelas Ini */}
            <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto max-h-72">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold sticky top-0 z-10 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-center w-10">No</th>
                      <th className="px-4 py-3">Nama Siswa & NIS</th>
                      <th className="px-3 py-3 text-center">Hadir</th>
                      <th className="px-3 py-3 text-center">Izin</th>
                      <th className="px-3 py-3 text-center">Sakit</th>
                      <th className="px-3 py-3 text-center">Alpa</th>
                      <th className="px-3 py-3 text-center">Tingkat Kehadiran</th>
                      <th className="px-4 py-3">Catatan Mapel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                    {selectedClassDetail.students
                      .filter(
                        (s) =>
                          s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
                          s.nis.includes(studentSearch)
                      )
                      .map((st, idx) => (
                        <tr key={st.id} className="hover:bg-slate-50/70 transition">
                          <td className="px-4 py-3 text-center font-bold text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{st.name}</div>
                            <div className="text-[10px] text-slate-400">NIS: {st.nis}</div>
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-emerald-600">{st.hadir}</td>
                          <td className="px-3 py-3 text-center font-bold text-amber-600">{st.izin}</td>
                          <td className="px-3 py-3 text-center font-bold text-blue-600">{st.sakit}</td>
                          <td className="px-3 py-3 text-center font-bold text-rose-600">{st.alpa}</td>
                          <td className="px-3 py-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                st.status === "Aman"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : st.status === "Perlu Perhatian"
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-rose-100 text-rose-800"
                              }`}
                            >
                              {st.percentage}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-500 max-w-xs">
                            {st.note ? (
                              <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded-md inline-block">
                                {st.note}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedClassDetail(null)}
                className="px-5 py-2.5 bg-[#0c3960] text-white rounded-xl text-xs font-bold hover:bg-[#0a2e4e] transition cursor-pointer"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: DAFTAR 3 SISWA PERLU PERHATIAN
      ========================================================================== */}
      {attentionModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Siswa Perlu Perhatian Khusus
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Daftar siswa yang sering alpa / membolos pada mata pelajaran <strong>{activeSubject}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAttentionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {attentionStudents.map((st) => (
                <div
                  key={`${st.className}-${st.id}`}
                  className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{st.name}</h4>
                      <span className="text-[11px] text-slate-500 font-mono">NIS: {st.nis} • {st.className}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-black text-[11px]">
                      {st.alpa}x Alpa
                    </span>
                  </div>
                  {st.note && (
                    <div className="p-2.5 rounded-xl bg-white border border-amber-200 text-xs text-slate-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{st.note}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-400">
                Data diteruskan ke Guru BK & Wali Kelas terkait
              </span>
              <button
                type="button"
                onClick={() => setAttentionModalOpen(false)}
                className="px-5 py-2.5 bg-[#0c3960] text-white rounded-xl text-xs font-bold hover:bg-[#0a2e4e] transition cursor-pointer"
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

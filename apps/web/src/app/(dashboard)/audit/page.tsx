"use client";

import * as React from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Trash2,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Laptop,
  Check,
} from "lucide-react";

export type AuditCategory = "SEMUA" | "PRESENSI" | "AUTENTIKASI" | "DATA_MASTER" | "OVERRIDE";

export interface AuditEntry {
  id: string;
  action: string;
  category: "PRESENSI" | "AUTENTIKASI" | "DATA_MASTER" | "OVERRIDE";
  user: string;
  role: string;
  roleType: "admin" | "guru" | "wali";
  details: string;
  timestamp: string;
  date: string;
  ip: string;
  device: string;
  status: "SUCCESS" | "WARNING" | "INFO";
}

const INITIAL_AUDIT_LOGS: AuditEntry[] = [
  {
    id: "log-1",
    action: "Presensi Sesi Disubmit",
    category: "PRESENSI",
    user: "Siti Rahmawati, S.Pd.",
    role: "Guru Bahasa Indonesia",
    roleType: "guru",
    details: "Mengunci presensi Sesi 2 Kelas 7B (Topik: Teks Deskripsi). Hadir: 30, Sakit: 1, Izin: 1, Alpa: 0.",
    timestamp: "09:45 WIB",
    date: "25 Sep 2026",
    ip: "192.168.1.42",
    device: "Chrome / Windows 11",
    status: "SUCCESS",
  },
  {
    id: "log-2",
    action: "Login Akun Berhasil",
    category: "AUTENTIKASI",
    user: "Siti Rahmawati, S.Pd.",
    role: "Guru Bahasa Indonesia",
    roleType: "guru",
    details: "Otentikasi sukses melalui Google Workspace Single Sign-On (SSO).",
    timestamp: "09:12 WIB",
    date: "25 Sep 2026",
    ip: "192.168.1.42",
    device: "Chrome / Windows 11",
    status: "SUCCESS",
  },
  {
    id: "log-3",
    action: "Admin Override Absensi",
    category: "OVERRIDE",
    user: "Admin Utama",
    role: "Super Admin",
    roleType: "admin",
    details: "Mengubah status presensi Bagas Saputra (Kelas 7A) dari Alpa menjadi Izin (Alasan: Surat izin menyusul).",
    timestamp: "09:00 WIB",
    date: "25 Sep 2026",
    ip: "192.168.1.10",
    device: "Chrome / Windows 11",
    status: "WARNING",
  },
  {
    id: "log-4",
    action: "Pembaruan Profil Siswa",
    category: "DATA_MASTER",
    user: "Admin Utama",
    role: "Super Admin",
    roleType: "admin",
    details: "Memperbarui data NIS dan penempatan rombel siswa Aditya Pratama (Kelas 7A).",
    timestamp: "08:45 WIB",
    date: "25 Sep 2026",
    ip: "192.168.1.10",
    device: "Chrome / Windows 11",
    status: "INFO",
  },
  {
    id: "log-5",
    action: "Presensi Sesi Disubmit",
    category: "PRESENSI",
    user: "Budi Santoso, M.Pd.",
    role: "Wali Kelas 7A & Guru MTK",
    roleType: "wali",
    details: "Menyimpan dan mengunci presensi Kelas 7A Sesi 1 Matematika (5 siswa).",
    timestamp: "08:30 WIB",
    date: "25 Sep 2026",
    ip: "192.168.1.68",
    device: "Mobile Safari / iOS",
    status: "SUCCESS",
  },
  {
    id: "log-6",
    action: "Login Akun Berhasil",
    category: "AUTENTIKASI",
    user: "Budi Santoso, M.Pd.",
    role: "Wali Kelas 7A",
    roleType: "wali",
    details: "Login berhasil menggunakan email dinas budi.santoso@smpn1tirtajaya.sch.id.",
    timestamp: "08:15 WIB",
    date: "25 Sep 2026",
    ip: "192.168.1.68",
    device: "Mobile Safari / iOS",
    status: "SUCCESS",
  },
  {
    id: "log-7",
    action: "Pembaruan Alokasi Mapel",
    category: "DATA_MASTER",
    user: "Admin Utama",
    role: "Super Admin",
    roleType: "admin",
    details: "Menambahkan alokasi mata pelajaran Bahasa Inggris di Kelas 7B untuk semester ganjil.",
    timestamp: "07:50 WIB",
    date: "25 Sep 2026",
    ip: "192.168.1.10",
    device: "Chrome / Windows 11",
    status: "INFO",
  },
];

export default function AuditPage() {
  const [logs, setLogs] = React.useState<AuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<AuditCategory>("SEMUA");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  // Filter logs by search and category
  const filteredLogs = React.useMemo(() => {
    return logs.filter((log) => {
      const matchCategory =
        selectedCategory === "SEMUA" || log.category === selectedCategory;
      const matchSearch =
        searchQuery === "" ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.ip.includes(searchQuery);

      return matchCategory && matchSearch;
    });
  }, [logs, selectedCategory, searchQuery]);

  // Handle Clear Logs
  const handleClearLog = () => {
    if (confirm("Apakah Anda yakin ingin mengosongkan riwayat audit log? Tindakan ini dicatat di log keamanan.")) {
      setLogs([]);
      setToastMessage("Riwayat audit log telah dibersihkan.");
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  // Handle Export Logs to CSV
  const handleExportCSV = () => {
    setIsExporting(true);
    setTimeout(() => {
      const header = "ID,Aksi,Kategori,Pengguna,Peran,Detail,Waktu,Tanggal,IP,Perangkat\n";
      const rows = filteredLogs
        .map(
          (l) =>
            `"${l.id}","${l.action}","${l.category}","${l.user}","${l.role}","${l.details}","${l.timestamp}","${l.date}","${l.ip}","${l.device}"`
        )
        .join("\n");

      const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `audit-log-smpn1tirtajaya-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
      setToastMessage("Laporan audit log berhasil diekspor ke CSV!");
      setTimeout(() => setToastMessage(null), 3000);
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0c3960] text-white px-5 py-3 rounded-2xl shadow-2xl border border-amber-300 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0c3960] text-amber-300 flex items-center justify-center text-2xl shadow-md border border-amber-300">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Keamanan & Kepatuhan Sistem
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              Audit Log & Riwayat Aktivitas
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Rekaman jejak aktivitas seluruh aksi penting di server SMPN 1 Tirtajaya
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            disabled={isExporting || filteredLogs.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? "Mengekspor..." : "Ekspor CSV / Excel"}</span>
          </button>

          <button
            onClick={handleClearLog}
            className="px-4 py-2.5 border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Bersihkan Log</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "SEMUA", label: "Semua Aktivitas" },
              { id: "PRESENSI", label: "Presensi Siswa" },
              { id: "OVERRIDE", label: "Override Admin" },
              { id: "AUTENTIKASI", label: "Login & Akses" },
              { id: "DATA_MASTER", label: "Perubahan Data" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as AuditCategory)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat.id
                    ? "bg-[#0c3960] text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Cari aksi, pengguna, atau IP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960]"
            />
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div className="space-y-3 pt-2">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Tidak ada log ditemukan</h4>
              <p className="text-xs text-slate-400">
                Coba ubah kata kunci pencarian atau pilih kategori lain
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isWarning = log.status === "WARNING";
              const isSuccess = log.status === "SUCCESS";

              return (
                <div
                  key={log.id}
                  className="bg-white hover:bg-amber-50/20 rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-2xs transition flex flex-col md:flex-row md:items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Status Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isWarning
                          ? "bg-amber-100 text-amber-800"
                          : isSuccess
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {isWarning ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : isSuccess ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    {/* Log Details */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900">
                          {log.action}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.category === "OVERRIDE"
                              ? "bg-rose-100 text-rose-800"
                              : log.category === "PRESENSI"
                              ? "bg-blue-100 text-blue-800"
                              : log.category === "AUTENTIKASI"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-purple-100 text-purple-800"
                          }`}
                        >
                          {log.category}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                        {log.details}
                      </p>

                      {/* Actor & Metadata */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.user}</span>
                          <span className="text-slate-400 font-normal">({log.role})</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Laptop className="w-3 h-3 text-slate-400" />
                          <span>{log.device}</span>
                        </span>
                        <span>•</span>
                        <span className="font-mono text-slate-500">IP: {log.ip}</span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp Right */}
                  <div className="text-right shrink-0 md:pl-4 self-end md:self-start">
                    <span className="text-xs font-mono font-bold text-slate-700 block">
                      {log.timestamp}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {log.date}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

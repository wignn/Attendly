"use client";

import * as React from "react";
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  RefreshCw,
  Laptop,
  Check,
  X,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  AlertCircle,
  Database,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  useAuditLogs,
  useAuditLog,
  useCreateExport,
  useExportJob,
} from "@/hooks/use-audit-export";
import { useClasses } from "@/hooks/use-classes";
import { useSubjects } from "@/hooks/use-subjects";
import { AuditLogRecordDto, ExportFormat, ExportJobDto } from "@komas/shared-types";
import { ApiError } from "@/lib/api-client";

const ENTITY_OPTIONS = [
  { value: "ALL", label: "Semua Entitas" },
  { value: "ATTENDANCE_SESSION", label: "Sesi Absensi" },
  { value: "STUDENT", label: "Siswa" },
  { value: "TEACHER", label: "Guru" },
  { value: "CLASS", label: "Kelas" },
  { value: "SUBJECT", label: "Mata Pelajaran" },
  { value: "TEACHING_ASSIGNMENT", label: "Penugasan Mengajar" },
  { value: "SCHEDULE", label: "Jadwal Pelajaran" },
  { value: "ACADEMIC_YEAR", label: "Tahun Ajaran" },
  { value: "EXPORT_JOB", label: "Pekerjaan Ekspor" },
];

const ACTION_OPTIONS = [
  { value: "ALL", label: "Semua Aksi" },
  { value: "CREATE", label: "Create (Buat)" },
  { value: "UPDATE", label: "Update (Ubah)" },
  { value: "DELETE", label: "Delete (Hapus)" },
  { value: "SUBMIT", label: "Submit (Kunci)" },
  { value: "REOPEN", label: "Reopen (Buka)" },
  { value: "TRANSFER", label: "Transfer (Pindah)" },
  { value: "ACTIVATE", label: "Activate (Aktifkan)" },
];

export default function AuditPage() {
  // Filters
  const [selectedEntity, setSelectedEntity] = React.useState<string>("ALL");
  const [selectedAction, setSelectedAction] = React.useState<string>("ALL");
  const [fromDate, setFromDate] = React.useState<string>("");
  const [toDate, setToDate] = React.useState<string>("");
  const [searchQuery, setSearchQuery] = React.useState<string>("");
  const [page, setPage] = React.useState(1);
  const perPage = 25;

  // Options for Export Modal
  const { data: classesData } = useClasses({ per_page: 100 });
  const classes = classesData?.data || [];

  const { data: subjectsData } = useSubjects({ per_page: 100 });
  const subjects = subjectsData?.data || [];

  // Query Audit Logs
  const {
    data: auditData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAuditLogs({
    entity: selectedEntity === "ALL" ? undefined : selectedEntity,
    action: selectedAction === "ALL" ? undefined : selectedAction,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    page,
    per_page: perPage,
  });

  const rawLogs = auditData?.data || [];
  const meta = auditData?.meta;
  const totalPages = meta?.total_pages || 1;

  // Client-side quick search filtering (actor_name, details, action, entity)
  const filteredLogs = React.useMemo(() => {
    if (!searchQuery.trim()) return rawLogs;
    const q = searchQuery.toLowerCase();
    return rawLogs.filter((log) => {
      const actor = (log.actor_name || "").toLowerCase();
      const action = log.action.toLowerCase();
      const entity = log.entity.toLowerCase();
      const details = JSON.stringify(log.details || {}).toLowerCase();
      const ip = (log.ip_address || "").toLowerCase();
      return (
        actor.includes(q) ||
        action.includes(q) ||
        entity.includes(q) ||
        details.includes(q) ||
        ip.includes(q)
      );
    });
  }, [rawLogs, searchQuery]);

  // Selected Log Detail Modal
  const [selectedLog, setSelectedLog] = React.useState<AuditLogRecordDto | null>(
    null
  );

  // Export Modal State
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<ExportFormat>("CSV");
  const [exportClassId, setExportClassId] = React.useState<string>("");
  const [exportSubjectId, setExportSubjectId] = React.useState<string>("");
  const [exportFromDate, setExportFromDate] = React.useState<string>("");
  const [exportToDate, setExportToDate] = React.useState<string>("");
  const [activeJobId, setActiveJobId] = React.useState<string | null>(null);
  const [exportError, setExportError] = React.useState<string | null>(null);

  // Export Mutations & Polling
  const createExportMutation = useCreateExport();
  const { data: polledJob, isFetching: isJobPolling } = useExportJob(
    activeJobId,
    {
      enabled: Boolean(activeJobId),
      refetchInterval: 2000,
    }
  );

  const currentJob: ExportJobDto | null = polledJob || null;

  // Toast State
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<"success" | "error">(
    "success"
  );

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Trigger Export Submission
  const handleStartExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setExportError(null);

    try {
      const res = await createExportMutation.mutateAsync({
        export_type: "ATTENDANCE",
        file_format: exportFormat,
        class_id: exportClassId ? exportClassId : undefined,
        subject_id: exportSubjectId ? exportSubjectId : undefined,
        from_date: exportFromDate ? exportFromDate : undefined,
        to_date: exportToDate ? exportToDate : undefined,
      });

      setActiveJobId(res.id);
      showToast("Pekerjaan ekspor berhasil dibuat dan sedang diproses.");
    } catch (err: any) {
      if (err instanceof ApiError) {
        setExportError(err.message || "Gagal membuat pekerjaan ekspor.");
      } else {
        setExportError("Terjadi kesalahan saat memulai ekspor data.");
      }
    }
  };

  // Helper formatting functions
  const formatDateWIB = (isoStr: string) => {
    if (!isoStr) return "-";
    try {
      const date = new Date(isoStr);
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(date) + " WIB";
    } catch {
      return isoStr;
    }
  };

  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes("CREATE")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
    if (act.includes("UPDATE") || act.includes("TRANSFER")) {
      return "bg-amber-50 text-amber-700 border-amber-200";
    }
    if (act.includes("DELETE")) {
      return "bg-rose-50 text-rose-700 border-rose-200";
    }
    if (act.includes("SUBMIT")) {
      return "bg-blue-50 text-blue-700 border-blue-200";
    }
    if (act.includes("REOPEN")) {
      return "bg-purple-50 text-purple-700 border-purple-200";
    }
    return "bg-slate-50 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border text-sm animate-in fade-in slide-in-from-top-4 duration-300 ${
            toastType === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {toastType === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0c3960] text-amber-300 flex items-center justify-center text-2xl shadow-md border border-amber-300">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>Keamanan & Kepatuhan Sistem</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-emerald-700 font-semibold lowercase">
                audit-trail aktif
              </span>
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5">
              Audit Log & Rekap Kehadiran
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Catatan jejak aktivitas seluruh aksi penting di server dan sarana
              ekspor rekap data kehadiran.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setActiveJobId(null);
              setExportError(null);
              setIsExportModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Rekap Kehadiran</span>
          </button>

          <button
            onClick={() => refetch()}
            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* Filter Bar & Search */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Entity Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Entitas
            </label>
            <select
              value={selectedEntity}
              onChange={(e) => {
                setSelectedEntity(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
            >
              {ENTITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Aksi
            </label>
            <select
              value={selectedAction}
              onChange={(e) => {
                setSelectedAction(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
            >
              {ACTION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tanggal Dari
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tanggal Sampai
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
            />
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Cari Cepat
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari aktor, aksi, detail..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
              />
            </div>
          </div>
        </div>

        {/* Filter Reset Button */}
        {(selectedEntity !== "ALL" ||
          selectedAction !== "ALL" ||
          fromDate !== "" ||
          toDate !== "" ||
          searchQuery !== "") && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Filter aktif:{" "}
              {selectedEntity !== "ALL" ? `Entitas: ${selectedEntity}, ` : ""}
              {selectedAction !== "ALL" ? `Aksi: ${selectedAction}, ` : ""}
              {fromDate ? `Dari: ${fromDate}, ` : ""}
              {toDate ? `Sampai: ${toDate}` : ""}
            </span>
            <button
              onClick={() => {
                setSelectedEntity("ALL");
                setSelectedAction("ALL");
                setFromDate("");
                setToDate("");
                setSearchQuery("");
                setPage(1);
              }}
              className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      {/* Audit Log Entries List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-800 text-sm">
              Rekaman Aktivitas Sistem
            </h2>
            {isFetching && (
              <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
            )}
          </div>
          <span className="text-xs text-slate-500">
            Menampilkan {filteredLogs.length} dari {meta?.total || 0} entri
          </span>
        </div>

        {/* Table Content */}
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-[#0c3960] animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Memuat audit log...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              Gagal memuat catatan audit log
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {(error as any)?.message || "Terjadi kesalahan server"}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-700">
              Tidak ada catatan audit log
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Tidak ditemukan data log yang sesuai dengan filter pencarian saat
              ini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredLogs.map((log) => {
              const actionBadge = getActionBadge(log.action);
              const detailsStr = log.details
                ? JSON.stringify(log.details)
                : "{}";

              return (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-4 sm:p-5 hover:bg-amber-50/20 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Status Icon */}
                    <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4 text-slate-600" />
                    </div>

                    {/* Log Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${actionBadge}`}
                        >
                          {log.action}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-800">
                          {log.entity}
                        </span>
                        <span className="text-xs text-slate-400 font-mono text-[10px]">
                          ID: {log.entity_id.slice(0, 8)}...
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-mono bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-3xl overflow-hidden text-ellipsis line-clamp-2">
                        {detailsStr}
                      </p>

                      {/* Actor & Metadata */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.actor_name || "Sistem Otomatis"}</span>
                          {log.actor_role && (
                            <span className="text-slate-400 font-normal">
                              ({log.actor_role})
                            </span>
                          )}
                        </span>
                        {log.ip_address && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-slate-500">
                              IP: {log.ip_address}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Timestamp Right */}
                  <div className="text-right shrink-0 md:pl-4 self-end md:self-start space-y-1">
                    <span className="text-xs font-mono font-bold text-slate-700 block">
                      {formatDateWIB(log.created_at)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLog(log);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-[#0c3960] hover:text-[#092b49] font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Detail
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs text-slate-500">
              Halaman {page} dari {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Detail Audit Log */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#0c3960]" />
                Detail Log Audit Aktivitas
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Aksi:</span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md font-bold border ${getActionBadge(
                      selectedLog.action
                    )}`}
                  >
                    {selectedLog.action}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Entitas:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedLog.entity}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">
                    Aktor (Pengguna):
                  </span>
                  <span className="font-semibold text-slate-800">
                    {selectedLog.actor_name || "Sistem"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Waktu Kejadian:</span>
                  <span className="font-mono text-slate-800">
                    {formatDateWIB(selectedLog.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">
                    ID Entitas:
                  </span>
                  <span className="font-mono text-slate-600 text-[11px] break-all">
                    {selectedLog.entity_id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">
                    Alamat IP:
                  </span>
                  <span className="font-mono text-slate-600 text-[11px]">
                    {selectedLog.ip_address || "Internal"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-1.5 font-semibold">
                  Payload & Perubahan (JSON Details):
                </span>
                <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-64 leading-relaxed">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Log audit ini bersifat permanen (immutable) dan tidak dapat
                  dihapus demi kepatuhan integritas data kehadiran sekolah.
                </span>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Ekspor Rekap Kehadiran */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Download className="w-5 h-5 text-[#0c3960]" />
                Ekspor Rekap Kehadiran
              </h3>
              <button
                onClick={() => {
                  setIsExportModalOpen(false);
                  setActiveJobId(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If there is an active job, show job status tracker */}
            {currentJob ? (
              <div className="p-6 space-y-5">
                <div className="text-center py-4">
                  {currentJob.status === "COMPLETED" ? (
                    <div className="space-y-3">
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900">
                        Ekspor Selesai!
                      </h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto">
                        File rekap kehadiran ({currentJob.file_format}) telah
                        siap diunduh.
                      </p>
                    </div>
                  ) : currentJob.status === "FAILED" ? (
                    <div className="space-y-3">
                      <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900">
                        Ekspor Gagal
                      </h4>
                      <p className="text-xs text-rose-600">
                        {currentJob.error_message ||
                          "Terjadi kesalahan saat mengekspor file."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 bg-[#0c3960]/10 text-[#0c3960] rounded-2xl flex items-center justify-center mx-auto">
                        <RefreshCw className="w-8 h-8 animate-spin" />
                      </div>
                      <h4 className="text-base font-bold text-slate-900">
                        Memproses Ekspor...
                      </h4>
                      <p className="text-xs text-slate-500">
                        Status saat ini:{" "}
                        <span className="font-semibold text-slate-800">
                          {currentJob.status}
                        </span>
                        . Sistem sedang mengumpulkan data kehadiran.
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Job ID:</span>
                    <span className="font-mono text-slate-700">
                      {currentJob.id.slice(0, 13)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Format:</span>
                    <span className="font-semibold text-slate-800">
                      {currentJob.file_format}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kedaluwarsa Pada:</span>
                    <span className="text-slate-700">
                      {formatDateWIB(currentJob.expires_at)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveJobId(null)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Ekspor Lain
                  </button>
                  {currentJob.status === "COMPLETED" && (
                    <a
                      href={currentJob.download_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      Unduh Berkas
                    </a>
                  )}
                </div>
              </div>
            ) : (
              /* Export Input Form */
              <form onSubmit={handleStartExport} className="p-6 space-y-4">
                {exportError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>{exportError}</div>
                  </div>
                )}

                {/* Format File */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Format Berkas <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["CSV", "XLSX", "PDF"] as ExportFormat[]).map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setExportFormat(fmt)}
                        className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                          exportFormat === fmt
                            ? "bg-[#0c3960] text-white border-[#0c3960] shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <FileSpreadsheet className="w-5 h-5" />
                        <span>{fmt}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Kelas */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filter Kelas (Opsional)
                  </label>
                  <select
                    value={exportClassId}
                    onChange={(e) => setExportClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  >
                    <option value="">Semua Kelas</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code}) - Tingkat {c.grade}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Filter Mata Pelajaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Filter Mata Pelajaran (Opsional)
                  </label>
                  <select
                    value={exportSubjectId}
                    onChange={(e) => setExportSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  >
                    <option value="">Semua Mata Pelajaran</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Rentang Tanggal */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Mulai
                    </label>
                    <input
                      type="date"
                      value={exportFromDate}
                      onChange={(e) => setExportFromDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Selesai
                    </label>
                    <input
                      type="date"
                      value={exportToDate}
                      onChange={(e) => setExportToDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsExportModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={createExportMutation.isPending}
                    className="px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {createExportMutation.isPending ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Membuat Pekerjaan...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Mulai Ekspor</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import {
  CalendarDays,
  Plus,
  Search,
  PenSquare,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Power,
  CalendarCheck,
  Check,
  Calendar,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  useAcademicYears,
  useCreateAcademicYear,
  useUpdateAcademicYear,
  useDeleteAcademicYear,
  useActivateAcademicYear,
} from "@/hooks/use-academic-years";
import { AcademicYearRecordDto } from "@komas/shared-types";
import { ApiError } from "@/lib/api-client";

export default function TahunAjaranPage() {
  // Query & Filter State
  const [filterActive, setFilterActive] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [searchInput, setSearchInput] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 10;

  // Server Queries
  const {
    data: yearsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAcademicYears({
    active: filterActive === "ALL" ? undefined : filterActive === "ACTIVE",
    page,
    per_page: perPage,
  });

  const academicYears = yearsData?.data || [];
  const meta = yearsData?.meta;
  const totalPages = meta?.total_pages || 1;
  const totalYears = meta?.total || 0;

  // Active Academic Year
  const currentActiveYear = React.useMemo(() => {
    return academicYears.find((y) => y.active);
  }, [academicYears]);

  // Mutations
  const createMutation = useCreateAcademicYear();
  const updateMutation = useUpdateAcademicYear();
  const deleteMutation = useDeleteAcademicYear();
  const activateMutation = useActivateAcademicYear();

  // Toast Notification
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<"success" | "error">("success");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingYear, setEditingYear] = React.useState<AcademicYearRecordDto | null>(null);
  const [name, setName] = React.useState("");
  const [semester, setSemester] = React.useState<number>(1);
  const [startsOn, setStartsOn] = React.useState("");
  const [endsOn, setEndsOn] = React.useState("");
  const [makeActive, setMakeActive] = React.useState(false);
  const [modalError, setModalError] = React.useState<string | null>(null);

  // Activate Confirmation Modal
  const [activatingYear, setActivatingYear] = React.useState<AcademicYearRecordDto | null>(null);
  const [activateError, setActivateError] = React.useState<string | null>(null);

  // Delete Confirmation Modal
  const [deletingYear, setDeletingYear] = React.useState<AcademicYearRecordDto | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Helper error message formatter
  const formatApiErrorMessage = (err: any, fallback: string): string => {
    if (err instanceof ApiError) {
      if (err.code === "CONFLICT") {
        return "Terjadi konflik: Nama tahun ajaran sudah ada, atau periode ini masih terikat dengan data kelas dan jadwal aktif.";
      }
      if (err.code === "VALIDATION_ERROR") {
        return "Validasi gagal: Pastikan nama diisi dan tanggal mulai tidak melebihi tanggal selesai.";
      }
      return err.message || fallback;
    }
    return fallback;
  };

  // Filtered by local search (if user types in search box)
  const displayedYears = React.useMemo(() => {
    if (!searchInput.trim()) return academicYears;
    const q = searchInput.toLowerCase();
    return academicYears.filter((y) => y.name.toLowerCase().includes(q));
  }, [academicYears, searchInput]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingYear(null);
    setName("");
    setSemester(1);
    const today = new Date();
    const year = today.getFullYear();
    setStartsOn(`${year}-07-15`);
    setEndsOn(`${year}-12-20`);
    setMakeActive(false);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: AcademicYearRecordDto) => {
    setEditingYear(item);
    setName(item.name);
    setSemester(item.semester);
    setStartsOn(item.starts_on);
    setEndsOn(item.ends_on);
    setMakeActive(item.active);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Save Academic Year
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setModalError("Nama tahun ajaran wajib diisi.");
      return;
    }
    if (!startsOn || !endsOn) {
      setModalError("Tanggal mulai dan tanggal selesai wajib diisi.");
      return;
    }
    if (startsOn > endsOn) {
      setModalError("Tanggal mulai tidak boleh lebih lambat dari tanggal selesai.");
      return;
    }

    try {
      if (editingYear) {
        await updateMutation.mutateAsync({
          id: editingYear.id,
          data: {
            name: trimmedName,
            semester,
            starts_on: startsOn,
            ends_on: endsOn,
          },
        });
        showToast(`Tahun ajaran ${trimmedName} berhasil diperbarui.`);
      } else {
        await createMutation.mutateAsync({
          name: trimmedName,
          semester,
          starts_on: startsOn,
          ends_on: endsOn,
          active: makeActive,
        });
        showToast(`Tahun ajaran ${trimmedName} berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(formatApiErrorMessage(err, "Gagal menyimpan tahun ajaran."));
    }
  };

  // Activate Academic Year Action
  const handleActivateConfirm = async () => {
    if (!activatingYear) return;
    setActivateError(null);

    try {
      await activateMutation.mutateAsync(activatingYear.id);
      showToast(`Tahun ajaran ${activatingYear.name} kini aktif sebagai periode utama sekolah.`);
      setActivatingYear(null);
    } catch (err: any) {
      setActivateError(
        formatApiErrorMessage(err, "Gagal mengaktifkan tahun ajaran.")
      );
    }
  };

  // Delete Academic Year Action
  const handleDeleteConfirm = async () => {
    if (!deletingYear) return;
    setDeleteError(null);

    if (deletingYear.active) {
      setDeleteError("Periode tahun ajaran yang sedang aktif tidak dapat dihapus.");
      return;
    }

    try {
      await deleteMutation.mutateAsync(deletingYear.id);
      showToast(`Tahun ajaran ${deletingYear.name} berhasil dihapus.`);
      setDeletingYear(null);
    } catch (err: any) {
      setDeleteError(
        formatApiErrorMessage(
          err,
          "Gagal menghapus tahun ajaran. Pastikan tidak ada kelas, jadwal, atau presensi yang masih terhubung ke periode ini."
        )
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-semibold animate-in fade-in slide-in-from-bottom-3 transition-all ${
            toastType === "success"
              ? "bg-slate-900 text-white border border-slate-700"
              : "bg-rose-600 text-white border border-rose-500"
          }`}
        >
          {toastType === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
          )}
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 hover:opacity-75 cursor-pointer text-slate-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0c3960] text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-[#0c3960]" />
              Konfigurasi Periode & Semester
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Tahun Ajaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Kelola periode akademik, rentang semester ganjil/genap, dan penetapan tahun ajaran aktif sekolah
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${isFetching ? "animate-spin" : ""}`}
            />
            <span>Segarkan</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tahun Ajaran</span>
          </button>
        </div>
      </div>

      {/* Hero / Active Academic Year Card */}
      <div className="bg-gradient-to-br from-[#0c3960] to-[#08223a] rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <CalendarDays className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Periode Akademik Aktif Saat Ini
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {currentActiveYear ? currentActiveYear.name : "Belum Ada Periode Aktif"}
              </h2>
              {currentActiveYear && (
                <p className="text-xs sm:text-sm text-blue-100/80 mt-1 flex flex-wrap items-center gap-2">
                  <span>
                    Semester:{" "}
                    <strong className="text-white">
                      {currentActiveYear.semester === 1 ? "1 (Ganjil)" : "2 (Genap)"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    Rentang:{" "}
                    <strong className="font-mono text-white">
                      {currentActiveYear.starts_on} s/d {currentActiveYear.ends_on}
                    </strong>
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 max-w-sm text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-200 font-bold">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Aturan Sistem Otomatis</span>
            </div>
            <p className="text-blue-100/70 text-[11px] leading-relaxed">
              Hanya satu tahun ajaran yang dapat berstatus aktif. Seluruh pencatatan absensi, jadwal mengajar, dan kelas rombel akan otomatis berpatokan pada periode ini.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama tahun ajaran (contoh: 2026/2027)..."
              className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter Status Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600">
            <button
              onClick={() => {
                setFilterActive("ALL");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterActive === "ALL" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => {
                setFilterActive("ACTIVE");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterActive === "ACTIVE" ? "bg-white text-emerald-700 shadow-xs font-bold" : "hover:text-slate-900"
              }`}
            >
              Aktif
            </button>
            <button
              onClick={() => {
                setFilterActive("INACTIVE");
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                filterActive === "INACTIVE" ? "bg-white text-slate-700 shadow-xs font-bold" : "hover:text-slate-900"
              }`}
            >
              Nonaktif / Arsip
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total: <strong className="text-slate-800">{totalYears}</strong> Periode Terdaftar
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-slate-100 rounded-xl w-full" />
          ))}
        </div>
      )}

      {/* Error Alert */}
      {isError && !isLoading && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Gagal Memuat Data Tahun Ajaran</h4>
            <p className="text-xs text-rose-600">
              {error instanceof Error ? error.message : "Terjadi kesalahan pada server API."}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-2 text-xs font-bold text-rose-700 underline cursor-pointer"
            >
              Coba lagi
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && displayedYears.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <CalendarDays className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Tahun Ajaran Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchInput || filterActive !== "ALL"
              ? "Tidak ada periode yang sesuai dengan filter pencarian."
              : "Belum ada tahun ajaran yang terdaftar. Buat periode tahun ajaran baru dengan menekan tombol Tambah Tahun Ajaran."}
          </p>
        </div>
      )}

      {/* Academic Years Table */}
      {!isLoading && !isError && displayedYears.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold">
                <th className="py-3 px-4 w-12 text-center">No</th>
                <th className="py-3 px-4">Nama Tahun Ajaran</th>
                <th className="py-3 px-4">Semester</th>
                <th className="py-3 px-4">Rentang Periode (Mulai - Selesai)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedYears.map((item, idx) => {
                const rowNo = (page - 1) * perPage + idx + 1;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      item.active ? "bg-emerald-50/30" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center text-slate-400 font-medium">
                      {rowNo}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-sm">{item.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {item.id.slice(0, 8)}...</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          item.semester === 1
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}
                      >
                        {item.semester === 1 ? "Semester 1 (Ganjil)" : "Semester 2 (Genap)"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-700">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.starts_on}</span>
                        <span className="text-slate-400">s/d</span>
                        <span>{item.ends_on}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {item.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-300 shadow-xs">
                          <Check className="w-3 h-3 text-emerald-700" />
                          Aktif
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Tombol Aktifkan (jika belum aktif) */}
                        {!item.active && (
                          <button
                            onClick={() => {
                              setActivatingYear(item);
                              setActivateError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[11px] font-bold transition border border-emerald-200 cursor-pointer"
                            title="Tetapkan sebagai Tahun Ajaran Aktif"
                          >
                            <Power className="w-3.5 h-3.5" />
                            <span>Aktifkan</span>
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 text-slate-400 hover:text-[#0c3960] hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Tahun Ajaran"
                        >
                          <PenSquare className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button (disabled jika aktif) */}
                        <button
                          onClick={() => {
                            setDeletingYear(item);
                            setDeleteError(null);
                          }}
                          disabled={item.active}
                          className={`p-1.5 rounded-lg transition ${
                            item.active
                              ? "text-slate-200 cursor-not-allowed"
                              : "text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                          }`}
                          title={item.active ? "Tahun ajaran aktif tidak dapat dihapus" : "Hapus Tahun Ajaran"}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
          <div className="text-slate-500">
            Menampilkan Halaman <strong className="text-slate-800">{page}</strong> dari{" "}
            <strong className="text-slate-800">{totalPages}</strong> ({totalYears} periode terdaftar)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isFetching}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                disabled={isFetching}
                className={`min-w-8 h-8 px-2.5 rounded-xl font-semibold transition cursor-pointer ${
                  pageNum === page
                    ? "bg-[#0c3960] text-white"
                    : "text-slate-600 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isFetching}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT TAHUN AJARAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {editingYear ? "Edit Tahun Ajaran" : "Tambah Tahun Ajaran Baru"}
                </h4>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{modalError}</div>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Periode Tahun Ajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 2026/2027 Ganjil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Semester <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSemester(1)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      semester === 1
                        ? "bg-blue-50 border-[#0c3960] text-[#0c3960]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Semester 1 (Ganjil)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSemester(2)}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
                      semester === 2
                        ? "bg-blue-50 border-[#0c3960] text-[#0c3960]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Semester 2 (Genap)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startsOn}
                    onChange={(e) => setStartsOn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Selesai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={endsOn}
                    onChange={(e) => setEndsOn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  />
                </div>
              </div>

              {!editingYear && (
                <div className="pt-2 border-t border-slate-100">
                  <label className="flex items-center gap-2.5 text-xs text-slate-700 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={makeActive}
                      onChange={(e) => setMakeActive(e.target.checked)}
                      className="w-4 h-4 text-[#0c3960] rounded border-slate-300 focus:ring-[#0c3960]"
                    />
                    <span>Langsung jadikan sebagai tahun ajaran aktif</span>
                  </label>
                  <p className="text-[11px] text-slate-400 mt-0.5 ml-6">
                    Akan menonaktifkan tahun ajaran aktif sebelumnya
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{editingYear ? "Simpan Perubahan" : "Simpan Tahun Ajaran"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI AKTIVASI TAHUN AJARAN */}
      {activatingYear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                <Power className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Aktifkan Tahun Ajaran?</h4>
                <p className="text-xs text-slate-500">Konfirmasi pergantian periode aktif sekolah</p>
              </div>
            </div>

            {activateError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{activateError}</div>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div>
                Periode yang akan diaktifkan:{" "}
                <strong className="text-slate-800">{activatingYear.name}</strong>
              </div>
              <div>
                Semester:{" "}
                <span className="font-semibold text-blue-700">
                  {activatingYear.semester === 1 ? "1 (Ganjil)" : "2 (Genap)"}
                </span>
              </div>
              <div>
                Rentang Tanggal:{" "}
                <span className="font-mono text-slate-700">
                  {activatingYear.starts_on} s/d {activatingYear.ends_on}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Mengaktifkan periode ini akan otomatis menonaktifkan periode sebelumnya. Seluruh jadwal pelajaran dan pengisian presensi siswa akan mengacu ke periode ini.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActivatingYear(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleActivateConfirm}
                disabled={activateMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {activateMutation.isPending && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Ya, Aktifkan Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS TAHUN AJARAN */}
      {deletingYear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hapus Tahun Ajaran?</h4>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan data periode</p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{deleteError}</div>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div>
                Nama Periode: <strong className="text-slate-800">{deletingYear.name}</strong>
              </div>
              <div>
                Semester: <span>{deletingYear.semester === 1 ? "1 (Ganjil)" : "2 (Genap)"}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Jika periode ini memiliki riwayat data rombel atau jadwal, sistem akan menolak penghapusan.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingYear(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleteMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {deleteMutation.isPending && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

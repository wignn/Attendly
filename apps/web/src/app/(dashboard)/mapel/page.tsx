"use client";

import * as React from "react";
import {
  BookOpen,
  Plus,
  Search,
  PenSquare,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  CalendarDays,
  Shapes,
  Info,
} from "lucide-react";
import {
  useSubjects,
  useSubject,
  useCreateSubject,
  useUpdateSubject,
  useDeleteSubject,
  useSubjectAssignments,
  TeachingAssignmentItemDto,
} from "@/hooks/use-subjects";
import { useClassesOptions } from "@/hooks/use-attendance-sessions";
import { useTeachers } from "@/hooks/use-teachers";
import { SubjectRecordDto } from "@komas/shared-types";
import { ApiError } from "@/lib/api-client";

export default function SubjectManagementPage() {
  // Query & Filter State
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 12;

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Server Queries
  const {
    data: subjectsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useSubjects({
    q: debouncedSearch,
    page,
    per_page: perPage,
  });

  const subjects = subjectsData?.data || [];
  const meta = subjectsData?.meta;
  const totalPages = meta?.total_pages || 1;
  const totalSubjects = meta?.total || 0;

  // Mutations
  const createSubjectMutation = useCreateSubject();
  const updateSubjectMutation = useUpdateSubject();
  const deleteSubjectMutation = useDeleteSubject();

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

  // Add / Edit Subject Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingSubject, setEditingSubject] = React.useState<SubjectRecordDto | null>(null);
  const [subjectCode, setSubjectCode] = React.useState("");
  const [subjectName, setSubjectName] = React.useState("");
  const [modalError, setModalError] = React.useState<string | null>(null);

  // Delete Subject Confirmation Modal
  const [deletingSubject, setDeletingSubject] = React.useState<SubjectRecordDto | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // View Subject Assignments Modal
  const [viewingAssignmentsSubject, setViewingAssignmentsSubject] =
    React.useState<SubjectRecordDto | null>(null);

  // Helper error message formatter
  const formatApiErrorMessage = (err: any, fallback: string): string => {
    if (err instanceof ApiError) {
      if (err.code === "CONFLICT") {
        return "Terjadi konflik: Kode atau nama mata pelajaran sudah digunakan di sekolah, atau masih terikat pada jadwal/penugasan mengajar aktif.";
      }
      if (err.code === "VALIDATION_ERROR") {
        return "Validasi gagal: Pastikan kode dan nama mata pelajaran tidak kosong.";
      }
      return err.message || fallback;
    }
    return fallback;
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingSubject(null);
    setSubjectCode("");
    setSubjectName("");
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (subj: SubjectRecordDto) => {
    setEditingSubject(subj);
    setSubjectCode(subj.code);
    setSubjectName(subj.name);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Save Subject
  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedCode = subjectCode.trim().toUpperCase();
    const trimmedName = subjectName.trim();

    if (!trimmedCode || !trimmedName) {
      setModalError("Kode dan Nama mata pelajaran wajib diisi.");
      return;
    }

    try {
      if (editingSubject) {
        await updateSubjectMutation.mutateAsync({
          id: editingSubject.id,
          data: {
            code: trimmedCode,
            name: trimmedName,
          },
        });
        showToast(`Mata pelajaran ${trimmedName} (${trimmedCode}) berhasil diperbarui.`);
      } else {
        await createSubjectMutation.mutateAsync({
          code: trimmedCode,
          name: trimmedName,
        });
        showToast(`Mata pelajaran ${trimmedName} (${trimmedCode}) berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(formatApiErrorMessage(err, "Gagal menyimpan mata pelajaran."));
    }
  };

  // Delete Subject Action
  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;
    setDeleteError(null);

    try {
      await deleteSubjectMutation.mutateAsync(deletingSubject.id);
      showToast(`Mata pelajaran ${deletingSubject.name} berhasil dihapus.`);
      setDeletingSubject(null);
    } catch (err: any) {
      setDeleteError(
        formatApiErrorMessage(
          err,
          "Gagal menghapus mata pelajaran. Pastikan mapel ini tidak sedang digunakan pada jadwal atau riwayat presensi siswa."
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
              <BookOpen className="w-3.5 h-3.5 text-[#0c3960]" />
              Master Kurikulum & Mapel
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Mata Pelajaran
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Kelola daftar mata pelajaran, kode unik kurikulum, serta pantau penugasan guru pengampu
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
            <span>Tambah Mapel</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0c3960] flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Mata Pelajaran</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalSubjects}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Shapes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Hasil Ditampilkan</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {subjects.length}{" "}
              <span className="text-xs font-medium text-slate-400">Mapel</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Integritas Kode</div>
            <div className="text-xs font-bold text-slate-800 mt-1">
              Kode Unik Terikat ke Jadwal & Presensi
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-56">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari kode atau nama mata pelajaran (contoh: MAT, IPA, Bahasa Indonesia)..."
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

        <div className="text-xs text-slate-500 font-medium">
          Menampilkan <strong className="text-slate-800">{subjects.length}</strong> dari{" "}
          <strong className="text-slate-800">{totalSubjects}</strong> mata pelajaran
        </div>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                </div>
              </div>
              <div className="h-8 bg-slate-100 rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error Alert */}
      {isError && !isLoading && (
        <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Gagal Memuat Data Mata Pelajaran</h4>
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
      {!isLoading && !isError && subjects.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Mata Pelajaran Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {debouncedSearch
              ? `Tidak ada mata pelajaran yang cocok dengan "${debouncedSearch}".`
              : "Belum ada mata pelajaran yang terdaftar. Klik tombol Tambah Mapel di atas untuk membuat mata pelajaran baru."}
          </p>
        </div>
      )}

      {/* Subjects Grid */}
      {!isLoading && !isError && subjects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {subjects.map((subj) => (
            <div
              key={subj.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#0c3960]/30 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Code badge & Actions */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0c3960] font-black text-sm flex items-center justify-center border border-blue-100 shadow-xs tracking-wider">
                      {subj.code}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0c3960] transition-colors leading-tight">
                        {subj.name}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Kode: {subj.code}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(subj)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                      title="Edit Mata Pelajaran"
                    >
                      <PenSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingSubject(subj);
                        setDeleteError(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Hapus Mata Pelajaran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      Dibuat Pada:
                    </span>
                    <span className="font-semibold text-slate-700 font-mono text-[11px]">
                      {new Date(subj.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      Status Sistem:
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                      Aktif Terdaftar
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Button Penugasan Guru */}
              <div className="mt-4 pt-1 flex items-center justify-between gap-2">
                <button
                  onClick={() => setViewingAssignmentsSubject(subj)}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-slate-600" />
                  <span>Lihat Penugasan Guru</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && !isError && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
          <div className="text-slate-500">
            Menampilkan Halaman <strong className="text-slate-800">{page}</strong> dari{" "}
            <strong className="text-slate-800">{totalPages}</strong> ({totalSubjects} mata pelajaran)
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

      {/* MODAL TAMBAH / EDIT MATA PELAJARAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {editingSubject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran Baru"}
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

            <form onSubmit={handleSaveSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: MAT, IPA, PJOK, BIN"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono uppercase focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Harus unik di sekolah (huruf kapital direkomendasikan)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Matematika, Ilmu Pengetahuan Alam"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                />
              </div>

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
                  disabled={createSubjectMutation.isPending || updateSubjectMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {(createSubjectMutation.isPending || updateSubjectMutation.isPending) && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{editingSubject ? "Simpan Perubahan" : "Simpan Mapel"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS MATA PELAJARAN */}
      {deletingSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hapus Mata Pelajaran?</h4>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan data mapel</p>
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
                Nama Mapel: <strong className="text-slate-800">{deletingSubject.name}</strong>
              </div>
              <div>
                Kode: <span className="font-mono text-slate-700">{deletingSubject.code}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tindakan ini akan menghapus mata pelajaran dari sistem. Sistem akan menolak penghapusan
              jika mata pelajaran ini telah memiliki jadwal mengajar atau riwayat absensi siswa.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingSubject(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteSubject}
                disabled={deleteSubjectMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {deleteSubjectMutation.isPending && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Ya, Hapus Mapel</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENUGASAN GURU UNTUK MAPEL INI */}
      {viewingAssignmentsSubject && (
        <SubjectAssignmentsModal
          subject={viewingAssignmentsSubject}
          onClose={() => setViewingAssignmentsSubject(null)}
        />
      )}
    </div>
  );
}

// Subcomponent: View Subject Assignments
interface SubjectAssignmentsModalProps {
  subject: SubjectRecordDto;
  onClose: () => void;
}

function SubjectAssignmentsModal({ subject, onClose }: SubjectAssignmentsModalProps) {
  const {
    data: assignmentsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useSubjectAssignments(subject.id);

  const { data: teachersData } = useTeachers({ per_page: 100 });
  const { data: classesData = [] } = useClassesOptions();

  const teachers = teachersData?.data || [];
  const assignments = assignmentsData?.data || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0c3960] font-black text-sm flex items-center justify-center tracking-wider">
              {subject.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{subject.name}</h3>
                {isFetching && (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                )}
              </div>
              <p className="text-xs text-slate-500">
                Daftar guru yang ditugaskan mengampu mata pelajaran ini di kelas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0c3960]" />
              <p className="text-xs">Memuat daftar penugasan guru...</p>
            </div>
          )}

          {isError && !isLoading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Gagal memuat penugasan mengajar</p>
                <p className="text-rose-600 mt-0.5">
                  {error instanceof Error ? error.message : "Kesalahan server."}
                </p>
              </div>
            </div>
          )}

          {!isLoading && !isError && assignments.length === 0 && (
            <div className="py-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">Belum Ada Guru Pengampu</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Mata pelajaran ini belum ditugaskan ke guru atau kelas manapun pada jadwal mengajar.
                </p>
              </div>
            </div>
          )}

          {!isLoading && !isError && assignments.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                    <th className="py-2.5 px-3">Guru Pengampu</th>
                    <th className="py-2.5 px-3">Kelas</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((asg, idx) => {
                    // Match teacher name from teachers options if not in assignment projection
                    const teacher = teachers.find((t) => t.id === asg.teacher_id);
                    const teacherName = asg.teacher_name || teacher?.full_name || asg.teacher_id;
                    const teacherNip = teacher?.nip;

                    // Match class name
                    const cls = classesData.find((c) => c.id === asg.class_id);
                    const className = asg.class_name || cls?.name || asg.class_id;

                    return (
                      <tr key={asg.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{teacherName}</div>
                          {teacherNip && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              NIP: {teacherNip}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {className}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              asg.active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {asg.active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

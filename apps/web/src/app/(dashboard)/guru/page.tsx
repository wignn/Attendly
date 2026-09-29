"use client";

import * as React from "react";
import {
  GraduationCap,
  Plus,
  PenSquare,
  Trash2,
  X,
  Search,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Power,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  User,
} from "lucide-react";
import {
  useTeachers,
  useCreateTeacher,
  useUpdateTeacher,
  useDeleteTeacher,
} from "@/hooks/use-teachers";
import { TeacherRecordDto, TeacherStatus } from "@komas/shared-types";
import { ApiError } from "@/lib/api-client";

export default function GuruPage() {
  // Query & Filter States
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [page, setPage] = React.useState(1);
  const perPage = 10;

  // Debounce search input
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1); // reset to page 1 on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Server state via React Query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useTeachers({
    q: debouncedSearch,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    page,
    per_page: perPage,
  });

  const teachers = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.total_pages ?? 1;
  const totalItems = meta?.total ?? 0;

  // Mutations
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const deleteMutation = useDeleteTeacher();

  // Toast Notification State
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
  const [editingTeacher, setEditingTeacher] = React.useState<TeacherRecordDto | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formNip, setFormNip] = React.useState("");
  const [formEmail, setFormEmail] = React.useState("");
  const [formPhone, setFormPhone] = React.useState("");
  const [formStatus, setFormStatus] = React.useState<TeacherStatus>("ACTIVE");
  const [modalError, setModalError] = React.useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = React.useState<TeacherRecordDto | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Quick Toggle Status State
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormName("");
    setFormNip("");
    setFormEmail("");
    setFormPhone("");
    setFormStatus("ACTIVE");
    setModalError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (t: TeacherRecordDto) => {
    setEditingTeacher(t);
    setFormName(t.full_name);
    setFormNip(t.nip);
    setFormEmail(t.email);
    setFormPhone(t.phone || "");
    setFormStatus(t.status);
    setModalError(null);
    setIsModalOpen(true);
  };

  // Handle Save Form (Add or Edit)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedName = formName.trim();
    const trimmedNip = formNip.trim();
    const trimmedEmail = formEmail.trim();
    const trimmedPhone = formPhone.trim();

    if (!trimmedName || !trimmedNip || !trimmedEmail) {
      setModalError("Nama lengkap, NIP, dan Email wajib diisi.");
      return;
    }

    try {
      if (editingTeacher) {
        // Edit Teacher
        await updateMutation.mutateAsync({
          id: editingTeacher.id,
          data: {
            full_name: trimmedName,
            nip: trimmedNip,
            email: trimmedEmail,
            phone: trimmedPhone || undefined,
            status: formStatus,
          },
        });
        showToast(`Data guru ${trimmedName} berhasil diperbarui.`);
      } else {
        // Create Teacher
        await createMutation.mutateAsync({
          full_name: trimmedName,
          nip: trimmedNip,
          email: trimmedEmail,
          phone: trimmedPhone || undefined,
        });
        showToast(`Guru ${trimmedName} berhasil ditambahkan.`);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === "CONFLICT" || err.message.toLowerCase().includes("conflict") || err.message.toLowerCase().includes("already exists")) {
          setModalError("Email atau NIP sudah terdaftar di sistem. Silakan periksa kembali.");
        } else if (err.code === "VALIDATION_ERROR" && err.details?.length) {
          const detailMsgs = err.details.map((d) => `${d.field}: ${d.issue}`).join(", ");
          setModalError(`Validasi gagal: ${detailMsgs}`);
        } else {
          setModalError(err.message || "Gagal menyimpan data guru.");
        }
      } else {
        setModalError("Terjadi kesalahan jaringan atau server.");
      }
    }
  };

  // Handle Quick Toggle Status
  const handleToggleStatus = async (t: TeacherRecordDto) => {
    const nextStatus: TeacherStatus = t.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setTogglingId(t.id);
    try {
      await updateMutation.mutateAsync({
        id: t.id,
        data: { status: nextStatus },
      });
      showToast(
        `Status ${t.full_name} berhasil diubah menjadi ${nextStatus === "ACTIVE" ? "Aktif" : "Nonaktif"}.`
      );
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Gagal mengubah status guru.";
      showToast(msg, "error");
    } finally {
      setTogglingId(null);
    }
  };

  // Handle Delete Confirmation
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError(null);

    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      showToast(`Guru ${deleteTarget.full_name} berhasil dihapus.`);
      setDeleteTarget(null);
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Gagal menghapus data guru.";
      setDeleteError(msg);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isDeleting = deleteMutation.isPending;

  return (
    <div className="space-y-6">
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

      {/* Container Tabel Utama */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Manajemen Guru</h3>
              {isFetching && !isLoading && (
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin ml-2" />
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kelola NIP, akun, data kontak, dan status keaktifan guru SMPN 1 Tirtajaya
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE");
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
            >
              <option value="ALL">Semua Status</option>
              <option value="ACTIVE">Aktif</option>
              <option value="INACTIVE">Nonaktif</option>
            </select>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari guru, NIP, email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] w-48 sm:w-60"
              />
              {searchInput && (
                <button
                  onClick={() => setSearchInput("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Tombol Tambah Guru */}
            <button
              onClick={handleOpenAdd}
              className="bg-[#0c3960] hover:bg-[#092b49] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Guru</span>
            </button>
          </div>
        </div>

        {/* State: Error */}
        {isError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-700">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>
                {error instanceof ApiError
                  ? error.message
                  : "Gagal memuat data guru dari backend API."}
              </span>
            </div>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs cursor-pointer transition shrink-0 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Coba Lagi
            </button>
          </div>
        )}

        {/* Tabel Data Guru */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Nama Guru</th>
                <th className="px-4 py-3.5">NIP</th>
                <th className="px-4 py-3.5">Email</th>
                <th className="px-4 py-3.5">No. Telepon</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {isLoading ? (
                // Skeletons
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                        <div className="space-y-1">
                          <div className="h-3.5 bg-slate-200 rounded-md w-36" />
                          <div className="h-2.5 bg-slate-100 rounded-md w-24" />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-3 bg-slate-200 rounded-md w-32" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-3 bg-slate-200 rounded-md w-40" />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="h-3 bg-slate-200 rounded-md w-24" />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="h-5 bg-slate-200 rounded-full w-16 mx-auto" />
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="h-6 bg-slate-200 rounded-lg w-20 mx-auto" />
                    </td>
                  </tr>
                ))
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <User className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">
                        Tidak ada data guru yang cocok.
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {debouncedSearch || statusFilter !== "ALL"
                          ? "Coba ubah kata kunci pencarian atau sesuaikan filter status."
                          : "Belum ada data guru terdaftar. Klik tombol Tambah Guru untuk menambahkan."}
                      </p>
                      {(debouncedSearch || statusFilter !== "ALL") && (
                        <button
                          onClick={() => {
                            setSearchInput("");
                            setStatusFilter("ALL");
                          }}
                          className="mt-2 text-xs font-bold text-[#0c3960] hover:underline cursor-pointer"
                        >
                          Reset Pencarian & Filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-800">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                          {t.full_name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[200px] sm:max-w-none">
                          {t.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                      {t.nip || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{t.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 text-xs">
                      {t.phone?.trim() ? (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{t.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleStatus(t)}
                        disabled={togglingId === t.id}
                        title="Klik untuk mengubah status"
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold text-[10px] cursor-pointer transition ${
                          t.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        } ${togglingId === t.id ? "opacity-50 cursor-wait" : ""}`}
                      >
                        {togglingId === t.id ? (
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                        ) : (
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              t.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                        )}
                        <span>{t.status === "ACTIVE" ? "Aktif" : "Nonaktif"}</span>
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Quick toggle status icon */}
                        <button
                          onClick={() => handleToggleStatus(t)}
                          disabled={togglingId === t.id}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            t.status === "ACTIVE"
                              ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50"
                              : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={t.status === "ACTIVE" ? "Nonaktifkan Guru" : "Aktifkan Guru"}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Data Guru"
                        >
                          <PenSquare className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={() => {
                            setDeleteTarget(t);
                            setDeleteError(null);
                          }}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Guru"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer: Pagination & Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 text-xs">
          <div className="text-slate-500 font-medium">
            {totalItems > 0 ? (
              <span>
                Menampilkan {(page - 1) * perPage + 1} -{" "}
                {Math.min(page * perPage, totalItems)} dari {totalItems} guru terdaftar
              </span>
            ) : (
              <span>0 guru terdaftar</span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Sebelumnya</span>
              </button>

              <span className="px-2 text-slate-600 font-semibold">
                Halaman {page} dari {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || isLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
              >
                <span>Selanjutnya</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT GURU */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingTeacher ? "Edit Data Guru" : "Tambah Guru Baru"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error Message Inside Modal */}
            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahmawati, S.Pd."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIP Guru <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 198504122010012004"
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden font-mono disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Akun Dinas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: siti@smpn1tirtajaya.sch.id"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  No. Telepon / WhatsApp (Opsional)
                </label>
                <input
                  type="tel"
                  placeholder="Contoh: 081234567890"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden disabled:bg-slate-50"
                />
              </div>

              {editingTeacher && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Keaktifan
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TeacherStatus)}
                    disabled={isSubmitting}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden bg-white disabled:bg-slate-50 cursor-pointer"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                </div>
              )}

              {!editingTeacher && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[#0c3960] text-[11px] leading-relaxed">
                  <span className="font-bold">Info Login:</span> Password default akun guru otomatis menggunakan <strong>NIP</strong> yang didaftarkan. Guru dapat langsung login menggunakan Email dan NIP mereka.
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl font-bold cursor-pointer transition shadow-xs flex items-center gap-1.5 disabled:opacity-70"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingTeacher ? "Perbarui Guru" : "Simpan Guru"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
              !
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Hapus Guru {deleteTarget.full_name}?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Data akun dan status keaktifan guru ini akan dinonaktifkan dari sistem.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 disabled:opacity-70"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Hapus</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import {
  Shapes,
  Plus,
  Search,
  PenSquare,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Users,
  School,
  ChevronRight,
  GraduationCap,
  CalendarDays,
  UserPlus,
  UserMinus,
  ArrowRightLeft,
  History,
  BookOpen,
  ChevronLeft,
  ShieldAlert,
} from "lucide-react";
import {
  useClasses,
  useClass,
  useClassStudents,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  useAddStudentToClass,
  useRemoveStudentFromClass,
  useAcademicYearsOptions,
} from "@/hooks/use-classes";
import { useTeachers } from "@/hooks/use-teachers";
import {
  useStudents,
  useStudentEnrollments,
  useTransferStudent,
} from "@/hooks/use-students";
import {
  ClassDetailDto,
  ClassStudentItemDto,
  StudentRecordDto,
} from "@komas/shared-types";
import { ApiError } from "@/lib/api-client";

export default function KelasManagementPage() {
  // Query & Filter State
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [selectedAcademicYearId, setSelectedAcademicYearId] = React.useState<string>("ALL");
  const [selectedTeacherId, setSelectedTeacherId] = React.useState<string>("ALL");
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
    data: classesData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClasses({
    q: debouncedSearch,
    academic_year_id: selectedAcademicYearId === "ALL" ? undefined : selectedAcademicYearId,
    homeroom_teacher_id: selectedTeacherId === "ALL" ? undefined : selectedTeacherId,
    page,
    per_page: perPage,
  });

  const { data: academicYears = [] } = useAcademicYearsOptions();
  const { data: teachersData } = useTeachers({ per_page: 100 });
  const teachers = teachersData?.data || [];

  const classes = classesData?.data || [];
  const meta = classesData?.meta;
  const totalPages = meta?.total_pages || 1;
  const totalClasses = meta?.total || 0;

  // Mutations
  const createClassMutation = useCreateClass();
  const updateClassMutation = useUpdateClass();
  const deleteClassMutation = useDeleteClass();

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

  // Add / Edit Class Modal State
  const [isClassModalOpen, setIsClassModalOpen] = React.useState(false);
  const [editingClass, setEditingClass] = React.useState<ClassDetailDto | null>(null);
  const [classCode, setClassCode] = React.useState("");
  const [className, setClassName] = React.useState("");
  const [classGrade, setClassGrade] = React.useState("7");
  const [classSection, setClassSection] = React.useState("A");
  const [classAcademicYearId, setClassAcademicYearId] = React.useState("");
  const [classHomeroomTeacherId, setClassHomeroomTeacherId] = React.useState("");
  const [classModalError, setClassModalError] = React.useState<string | null>(null);

  // Delete Class Confirmation Modal
  const [deletingClass, setDeletingClass] = React.useState<ClassDetailDto | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Roster / Enrollment Management Modal State
  const [managingClass, setManagingClass] = React.useState<ClassDetailDto | null>(null);

  // Helper error message formatter
  const formatApiErrorMessage = (err: any, fallback: string): string => {
    if (err instanceof ApiError) {
      if (err.code === "CONFLICT") {
        return "Terjadi konflik: Kode kelas sudah terdaftar, atau rombel masih memiliki data referensi terkait.";
      }
      if (err.code === "VALIDATION_ERROR") {
        return "Validasi gagal: Harap periksa kembali semua field yang wajib diisi.";
      }
      return err.message || fallback;
    }
    return fallback;
  };

  // Open Create Class Modal
  const handleOpenCreateClass = () => {
    setEditingClass(null);
    setClassCode("");
    setClassName("");
    setClassGrade("7");
    setClassSection("A");
    const activeYear = academicYears.find((y) => y.active) || academicYears[0];
    setClassAcademicYearId(activeYear ? activeYear.id : "");
    setClassHomeroomTeacherId("");
    setClassModalError(null);
    setIsClassModalOpen(true);
  };

  // Open Edit Class Modal
  const handleOpenEditClass = (cls: ClassDetailDto) => {
    setEditingClass(cls);
    setClassCode(cls.code);
    setClassName(cls.name);
    setClassGrade(cls.grade || "7");
    setClassSection(cls.section || "A");
    setClassAcademicYearId(cls.academic_year_id || "");
    setClassHomeroomTeacherId(cls.homeroom_teacher_id || "");
    setClassModalError(null);
    setIsClassModalOpen(true);
  };

  // Save Class (Create or Edit)
  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setClassModalError(null);

    const trimmedCode = classCode.trim();
    const trimmedName = className.trim();
    const trimmedGrade = classGrade.trim();
    const trimmedSection = classSection.trim();

    if (!trimmedCode || !trimmedName || !trimmedGrade || !trimmedSection) {
      setClassModalError("Kode, Nama, Tingkat, dan Seksi kelas wajib diisi.");
      return;
    }

    try {
      if (editingClass) {
        await updateClassMutation.mutateAsync({
          id: editingClass.id,
          data: {
            code: trimmedCode,
            name: trimmedName,
            grade: trimmedGrade,
            section: trimmedSection,
            academic_year_id: classAcademicYearId || null,
            homeroom_teacher_id: classHomeroomTeacherId || null,
            clear_homeroom_teacher: !classHomeroomTeacherId,
          },
        });
        showToast(`Kelas ${trimmedName} berhasil diperbarui.`);
      } else {
        await createClassMutation.mutateAsync({
          code: trimmedCode,
          name: trimmedName,
          grade: trimmedGrade,
          section: trimmedSection,
          academic_year_id: classAcademicYearId || null,
          homeroom_teacher_id: classHomeroomTeacherId || null,
        });
        showToast(`Kelas ${trimmedName} berhasil ditambahkan.`);
      }
      setIsClassModalOpen(false);
    } catch (err: any) {
      setClassModalError(formatApiErrorMessage(err, "Gagal menyimpan data kelas."));
    }
  };

  // Delete Class Action
  const handleDeleteClass = async () => {
    if (!deletingClass) return;
    setDeleteError(null);

    try {
      await deleteClassMutation.mutateAsync(deletingClass.id);
      showToast(`Kelas ${deletingClass.name} berhasil dihapus.`);
      setDeletingClass(null);
    } catch (err: any) {
      setDeleteError(
        formatApiErrorMessage(
          err,
          "Gagal menghapus kelas. Pastikan tidak ada jadwal atau riwayat absensi yang masih terhubung."
        )
      );
    }
  };

  // Aggregate stats
  const totalEnrolledStudents = React.useMemo(() => {
    return classes.reduce((sum, c) => sum + (c.total_students || 0), 0);
  }, [classes]);

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
              <Shapes className="w-3.5 h-3.5 text-[#0c3960]" />
              Master Rombel & Enrollment
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Kelas & Rombongan Belajar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Kelola data kelas, penugasan wali kelas, tahun ajaran aktif, serta daftar siswa per rombel
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
            onClick={handleOpenCreateClass}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Shapes className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Kelas Terdaftar</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalClasses}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Total Siswa Ter-enroll</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">{totalEnrolledStudents}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Tahun Ajaran Aktif</div>
            <div className="text-sm font-bold text-slate-900 mt-1 truncate max-w-44">
              {academicYears.find((y) => y.active)?.name || "Belum ada aktif"}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-52">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama kelas atau kode (contoh: 7A, 8B)..."
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

          {/* Filter Tahun Ajaran */}
          <select
            value={selectedAcademicYearId}
            onChange={(e) => {
              setSelectedAcademicYearId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
          >
            <option value="ALL">Semua Tahun Ajaran</option>
            {academicYears.map((ay) => (
              <option key={ay.id} value={ay.id}>
                {ay.name} {ay.active ? "(Aktif)" : ""}
              </option>
            ))}
          </select>

          {/* Filter Wali Kelas */}
          <select
            value={selectedTeacherId}
            onChange={(e) => {
              setSelectedTeacherId(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer max-w-48 truncate"
          >
            <option value="ALL">Semua Wali Kelas</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.full_name}
              </option>
            ))}
          </select>
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
            <h4 className="text-sm font-bold">Gagal Memuat Data Kelas</h4>
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
      {!isLoading && !isError && classes.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Shapes className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Tidak Ada Kelas Ditemukan</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {debouncedSearch || selectedAcademicYearId !== "ALL" || selectedTeacherId !== "ALL"
              ? "Tidak ada rombel yang cocok dengan filter pencarian yang diterapkan."
              : "Belum ada kelas yang terdaftar di sistem. Klik tombol Tambah Kelas di atas untuk membuat rombel baru."}
          </p>
        </div>
      )}

      {/* Classes Grid */}
      {!isLoading && !isError && classes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#0c3960]/30 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Code badge & Actions */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#0c3960] font-black text-base flex items-center justify-center border border-blue-100 shadow-xs">
                      {cls.code}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#0c3960] transition-colors leading-tight">
                        {cls.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                        <span>Tingkat {cls.grade}</span>
                        <span>•</span>
                        <span>Seksi {cls.section}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditClass(cls)}
                      className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                      title="Edit Kelas"
                    >
                      <PenSquare className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setDeletingClass(cls);
                        setDeleteError(null);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-2 py-3 border-y border-slate-100 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                      Wali Kelas:
                    </span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-44">
                      {cls.homeroom_teacher_name || (
                        <span className="text-slate-400 italic font-normal">Belum ditentukan</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      Tahun Ajaran:
                    </span>
                    <span className="font-semibold text-slate-800 text-right truncate max-w-44">
                      {cls.academic_year_name || (
                        <span className="text-slate-400 italic font-normal">Default</span>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Jumlah Siswa:
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                      {cls.total_students || 0} Siswa
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Action Buttons */}
              <div className="mt-4 pt-1 flex items-center justify-between gap-2">
                <button
                  onClick={() => setManagingClass(cls)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  <span>Kelola Siswa</span>
                </button>

                <Link
                  href={`/kelas/${cls.id}`}
                  className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  title="Lihat Detail Presensi Kelas"
                >
                  <span>Presensi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
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
            <strong className="text-slate-800">{totalPages}</strong> ({totalClasses} kelas terdaftar)
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

      {/* MODAL TAMBAH / EDIT KELAS */}
      {isClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <Shapes className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {editingClass ? "Edit Data Kelas" : "Tambah Rombel / Kelas Baru"}
                </h4>
              </div>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {classModalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{classModalError}</div>
              </div>
            )}

            <form onSubmit={handleSaveClass} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 7A"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Harus unik di sekolah</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap Rombel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Kelas 7A"
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={classGrade}
                    onChange={(e) => setClassGrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  >
                    <option value="7">Kelas 7 (Tujuh)</option>
                    <option value="8">Kelas 8 (Delapan)</option>
                    <option value="9">Kelas 9 (Sembilan)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Seksi / Bagian Rombel <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: A, B, C, atau Unggulan"
                    value={classSection}
                    onChange={(e) => setClassSection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tahun Ajaran
                  </label>
                  <select
                    value={classAcademicYearId}
                    onChange={(e) => setClassAcademicYearId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  >
                    <option value="">Pilih Tahun Ajaran</option>
                    {academicYears.map((ay) => (
                      <option key={ay.id} value={ay.id}>
                        {ay.name} {ay.active ? "(Aktif)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Wali Kelas
                  </label>
                  <select
                    value={classHomeroomTeacherId}
                    onChange={(e) => setClassHomeroomTeacherId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  >
                    <option value="">Tanpa Wali Kelas</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name} ({t.nip})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsClassModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createClassMutation.isPending || updateClassMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {(createClassMutation.isPending || updateClassMutation.isPending) && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{editingClass ? "Simpan Perubahan" : "Simpan Kelas"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS KELAS */}
      {deletingClass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hapus Kelas Rombel?</h4>
                <p className="text-xs text-slate-500">Konfirmasi penghapusan data rombel</p>
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
                Nama Kelas: <strong className="text-slate-800">{deletingClass.name}</strong>
              </div>
              <div>
                Kode: <span className="font-mono text-slate-700">{deletingClass.code}</span>
              </div>
              <div>
                Total Siswa Terdaftar:{" "}
                <span className="font-bold text-emerald-700">
                  {deletingClass.total_students || 0} Siswa
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Tindakan ini akan menghapus data kelas. Pastikan seluruh siswa sudah dipindahkan ke rombel lain sebelum menghapus kelas ini.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeletingClass(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteClass}
                disabled={deleteClassMutation.isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {deleteClassMutation.isPending && (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Ya, Hapus Kelas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MANAJEMEN SISWA & ENROLLMENT (ROSTER KELAS) */}
      {managingClass && (
        <ClassStudentsRosterModal
          classItem={managingClass}
          allClasses={classes}
          onClose={() => setManagingClass(null)}
          onSuccessMessage={(msg) => showToast(msg, "success")}
        />
      )}
    </div>
  );
}

// Subcomponent: Class Students Roster & Enrollment Management
interface ClassStudentsRosterModalProps {
  classItem: ClassDetailDto;
  allClasses: ClassDetailDto[];
  onClose: () => void;
  onSuccessMessage: (msg: string) => void;
}

function ClassStudentsRosterModal({
  classItem,
  allClasses,
  onClose,
  onSuccessMessage,
}: ClassStudentsRosterModalProps) {
  const [page, setPage] = React.useState(1);
  const perPage = 15;
  const [searchRoster, setSearchRoster] = React.useState("");

  // Server state for class students
  const {
    data: studentsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClassStudents(classItem.id, page, perPage);

  const students = studentsData?.data || [];
  const meta = studentsData?.meta;
  const totalPages = meta?.total_pages || 1;
  const totalStudents = meta?.total || 0;

  // Mutations
  const addStudentMutation = useAddStudentToClass();
  const removeStudentMutation = useRemoveStudentFromClass();
  const transferMutation = useTransferStudent();

  // Submodal State: Add Student to Class
  const [isAddStudentOpen, setIsAddStudentOpen] = React.useState(false);
  const [selectedStudentToAdd, setSelectedStudentToAdd] = React.useState<StudentRecordDto | null>(null);
  const [addEffectiveDate, setAddEffectiveDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [addStudentError, setAddStudentError] = React.useState<string | null>(null);

  // Available students to enroll
  const [studentSearchInput, setStudentSearchInput] = React.useState("");
  const { data: allStudentsData, isLoading: isLoadingAllStudents } = useStudents({
    search: studentSearchInput,
    status: "ACTIVE",
    per_page: 50,
  });
  const allStudents = allStudentsData?.data || [];

  // Submodal State: Remove Student from Class
  const [removingStudent, setRemovingStudent] = React.useState<ClassStudentItemDto | null>(null);
  const [removeEffectiveDate, setRemoveEffectiveDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [removeError, setRemoveError] = React.useState<string | null>(null);

  // Submodal State: Transfer Student
  const [transferringStudent, setTransferringStudent] = React.useState<ClassStudentItemDto | null>(null);
  const [transferTargetClassId, setTransferTargetClassId] = React.useState("");
  const [transferEffectiveDate, setTransferEffectiveDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [transferError, setTransferError] = React.useState<string | null>(null);

  // Submodal State: View Student Enrollment History
  const [viewHistoryStudentId, setViewHistoryStudentId] = React.useState<string | null>(null);
  const [viewHistoryStudentName, setViewHistoryStudentName] = React.useState<string>("");
  const { data: enrollmentHistory = [], isLoading: isLoadingHistory } = useStudentEnrollments(
    viewHistoryStudentId
  );

  // Local search filter inside current page
  const filteredStudents = React.useMemo(() => {
    if (!searchRoster.trim()) return students;
    const q = searchRoster.toLowerCase();
    return students.filter(
      (s) =>
        s.full_name.toLowerCase().includes(q) ||
        s.nis.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q))
    );
  }, [students, searchRoster]);

  // Handle Add Student Submit
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddStudentError(null);

    if (!selectedStudentToAdd) {
      setAddStudentError("Pilih siswa yang akan dimasukkan ke kelas.");
      return;
    }

    try {
      await addStudentMutation.mutateAsync({
        classId: classItem.id,
        data: {
          student_id: selectedStudentToAdd.id,
          effective_date: addEffectiveDate || undefined,
        },
      });
      onSuccessMessage(
        `Siswa ${selectedStudentToAdd.full_name} berhasil dimasukkan ke kelas ${classItem.name}.`
      );
      setIsAddStudentOpen(false);
      setSelectedStudentToAdd(null);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === "CONFLICT") {
          setAddStudentError(
            "Konflik enrollment: Siswa ini sudah memiliki pendaftaran aktif di kelas ini atau kelas lain."
          );
          return;
        }
        setAddStudentError(err.message || "Gagal memasukkan siswa ke kelas.");
      } else {
        setAddStudentError("Terjadi kesalahan jaringan atau server.");
      }
    }
  };

  // Handle Remove Student Submit
  const handleRemoveStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!removingStudent) return;
    setRemoveError(null);

    try {
      await removeStudentMutation.mutateAsync({
        classId: classItem.id,
        studentId: removingStudent.student_id,
        effectiveDate: removeEffectiveDate || undefined,
      });
      onSuccessMessage(
        `Siswa ${removingStudent.full_name} berhasil dikeluarkan dari kelas ${classItem.name}.`
      );
      setRemovingStudent(null);
    } catch (err: any) {
      setRemoveError(
        err instanceof ApiError
          ? err.message
          : "Gagal mengeluarkan siswa dari rombel."
      );
    }
  };

  // Handle Transfer Student Submit
  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent) return;
    setTransferError(null);

    if (!transferTargetClassId) {
      setTransferError("Pilih kelas tujuan baru.");
      return;
    }

    try {
      await transferMutation.mutateAsync({
        id: transferringStudent.student_id,
        data: {
          class_id: transferTargetClassId,
          effective_on: transferEffectiveDate || undefined,
        },
      });
      onSuccessMessage(
        `Siswa ${transferringStudent.full_name} berhasil dipindahkan ke kelas baru.`
      );
      setTransferringStudent(null);
      refetch();
    } catch (err: any) {
      setTransferError(
        err instanceof ApiError
          ? err.message
          : "Gagal memproses pemindahan kelas siswa."
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Header Modal */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0c3960] font-black text-sm flex items-center justify-center">
              {classItem.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Rombongan Belajar: {classItem.name}
                </h3>
                {isFetching && (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                )}
              </div>
              <p className="text-xs text-slate-500">
                Wali Kelas:{" "}
                <strong className="text-slate-700">
                  {classItem.homeroom_teacher_name || "Belum ditentukan"}
                </strong>{" "}
                • Tahun Ajaran:{" "}
                <strong className="text-slate-700">
                  {classItem.academic_year_name || "Standar"}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedStudentToAdd(null);
                setAddStudentError(null);
                setIsAddStudentOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Masukkan Siswa</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Toolbar & Search */}
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa dalam kelas ini..."
              value={searchRoster}
              onChange={(e) => setSearchRoster(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
            />
          </div>

          <div className="text-xs text-slate-500">
            Total Siswa Terdaftar:{" "}
            <strong className="text-slate-800 font-bold">{totalStudents} Orang</strong>
          </div>
        </div>

        {/* Body Roster Table */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin text-[#0c3960]" />
              <p className="text-xs">Memuat daftar siswa rombel...</p>
            </div>
          )}

          {isError && !isLoading && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Gagal memuat siswa di kelas ini</p>
                <p className="text-rose-600 mt-0.5">
                  {error instanceof Error ? error.message : "Kesalahan server."}
                </p>
              </div>
            </div>
          )}

          {!isLoading && !isError && filteredStudents.length === 0 && (
            <div className="py-14 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">Belum ada siswa di kelas ini</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchRoster
                    ? `Tidak ada siswa yang cocok dengan "${searchRoster}".`
                    : "Silakan klik tombol Masukkan Siswa untuk mendaftarkan siswa ke rombel ini."}
                </p>
              </div>
            </div>
          )}

          {!isLoading && !isError && filteredStudents.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                    <th className="py-2.5 px-3">NIS & NISN</th>
                    <th className="py-2.5 px-3">Nama Siswa</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Tanggal Mulai Masuk</th>
                    <th className="py-2.5 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.map((s, idx) => {
                    const rowNo = (page - 1) * perPage + idx + 1;
                    return (
                      <tr key={s.student_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-medium">
                          {rowNo}
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <div className="font-semibold text-slate-800">{s.nis}</div>
                          {s.nisn && (
                            <div className="text-[10px] text-slate-400">{s.nisn}</div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900">
                          {s.full_name}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              s.active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {s.active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {s.valid_from ? new Date(s.valid_from).toLocaleDateString("id-ID") : "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Riwayat Mutasi */}
                            <button
                              onClick={() => {
                                setViewHistoryStudentId(s.student_id);
                                setViewHistoryStudentName(s.full_name);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Riwayat Enrollment Siswa"
                            >
                              <History className="w-3.5 h-3.5" />
                            </button>

                            {/* Pindah Kelas (Mutasi) */}
                            <button
                              onClick={() => {
                                setTransferringStudent(s);
                                const other = allClasses.find((c) => c.id !== classItem.id);
                                setTransferTargetClassId(other ? other.id : "");
                                setTransferError(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Pindah Kelas (Mutasi)"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* Keluarkan Siswa */}
                            <button
                              onClick={() => {
                                setRemovingStudent(s);
                                setRemoveError(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Keluarkan dari Rombel"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
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

          {/* Roster Pagination */}
          {!isLoading && !isError && totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <div>
                Halaman {page} dari {totalPages}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg disabled:opacity-40 cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>

      {/* SUBMODAL: MASUKKAN SISWA KE KELAS */}
      {isAddStudentOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Masukkan Siswa ke {classItem.name}
                </h4>
              </div>
              <button
                onClick={() => setIsAddStudentOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addStudentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{addStudentError}</div>
              </div>
            )}

            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Siswa <span className="text-rose-500">*</span>
                </label>
                <div className="relative mb-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ketik untuk memfilter nama / NIS siswa..."
                    value={studentSearchInput}
                    onChange={(e) => setStudentSearchInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                  {isLoadingAllStudents && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Memuat daftar siswa...
                    </div>
                  )}
                  {!isLoadingAllStudents && allStudents.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Tidak ada siswa ditemukan.
                    </div>
                  )}
                  {allStudents.map((s) => {
                    const isSelected = selectedStudentToAdd?.id === s.id;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setSelectedStudentToAdd(s)}
                        className={`p-2.5 flex items-center justify-between text-xs cursor-pointer transition ${
                          isSelected ? "bg-blue-50/80" : "hover:bg-slate-50"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-900">{s.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            NIS: {s.nis} • Kelas Saat Ini:{" "}
                            <span className="text-blue-700 font-semibold">
                              {s.current_class_name || "Belum ada"}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-xs font-bold text-blue-700">Terpilih</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Efektif Masuk Rombel
                </label>
                <input
                  type="date"
                  value={addEffectiveDate}
                  onChange={(e) => setAddEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddStudentOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={addStudentMutation.isPending || !selectedStudentToAdd}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {addStudentMutation.isPending && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Tambahkan ke Rombel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL: KELUARKAN SISWA DARI KELAS */}
      {removingStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <UserMinus className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Keluarkan Siswa dari Rombel?</h4>
                <p className="text-xs text-slate-500">Konfirmasi pengeluaran siswa dari kelas</p>
              </div>
            </div>

            {removeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{removeError}</div>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div>
                Nama Siswa: <strong className="text-slate-800">{removingStudent.full_name}</strong>
              </div>
              <div>
                NIS: <span className="font-mono text-slate-700">{removingStudent.nis}</span>
              </div>
              <div>
                Kelas: <span className="font-bold text-blue-700">{classItem.name}</span>
              </div>
            </div>

            <form onSubmit={handleRemoveStudentSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Efektif Keluar
                </label>
                <input
                  type="date"
                  value={removeEffectiveDate}
                  onChange={(e) => setRemoveEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRemovingStudent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={removeStudentMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {removeStudentMutation.isPending && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Ya, Keluarkan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL: PINDAH KELAS (MUTASI ROMBEL) */}
      {transferringStudent && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Pindah Rombel Siswa</h4>
              </div>
              <button
                onClick={() => setTransferringStudent(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {transferError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>{transferError}</div>
              </div>
            )}

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                <div>
                  Nama Siswa:{" "}
                  <strong className="text-slate-800">{transferringStudent.full_name}</strong> (
                  {transferringStudent.nis})
                </div>
                <div>
                  Kelas Saat Ini: <strong className="text-blue-700">{classItem.name}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Kelas Tujuan Baru <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={transferTargetClassId}
                  onChange={(e) => setTransferTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                >
                  <option value="" disabled>
                    Pilih Kelas Baru
                  </option>
                  {allClasses
                    .filter((c) => c.id !== classItem.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Efektif Pemindahan
                </label>
                <input
                  type="date"
                  value={transferEffectiveDate}
                  onChange={(e) => setTransferEffectiveDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferringStudent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={transferMutation.isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {transferMutation.isPending && (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Proses Pemindahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUBMODAL: RIWAYAT ENROLLMENT SISWA */}
      {viewHistoryStudentId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Riwayat Enrollment</h4>
                  <p className="text-[11px] text-slate-500">{viewHistoryStudentName}</p>
                </div>
              </div>
              <button
                onClick={() => setViewHistoryStudentId(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isLoadingHistory && (
              <div className="py-8 text-center text-xs text-slate-400">
                Memuat riwayat enrollment...
              </div>
            )}

            {!isLoadingHistory && enrollmentHistory.length === 0 && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                Belum ada rekaman riwayat kelas untuk siswa ini.
              </div>
            )}

            {!isLoadingHistory && enrollmentHistory.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                      <th className="py-2.5 px-3">Kelas</th>
                      <th className="py-2.5 px-3">Mulai</th>
                      <th className="py-2.5 px-3">Selesai</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {enrollmentHistory.map((h) => {
                      const isCurrent = !h.valid_to;
                      return (
                        <tr
                          key={h.id}
                          className={isCurrent ? "bg-emerald-50/50" : "hover:bg-slate-50"}
                        >
                          <td className="py-2 px-3 font-bold text-slate-900">{h.class_name}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono">{h.valid_from}</td>
                          <td className="py-2 px-3 text-slate-600 font-mono">{h.valid_to || "-"}</td>
                          <td className="py-2 px-3">
                            {isCurrent ? (
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                Berjalan
                              </span>
                            ) : (
                              <span className="inline-flex px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                                Selesai
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewHistoryStudentId(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

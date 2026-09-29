"use client";

import * as React from "react";
import {
  Users,
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
  ArrowRightLeft,
  Eye,
  History,
  GraduationCap,
  Calendar,
  Layers,
  ArrowUpDown,
  BookOpen,
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
  Download,
  Upload,
  Sparkles,
  School,
  Check,
  UserPlus,
} from "lucide-react";
import {
  useStudents,
  useStudent,
  useStudentEnrollments,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
  useTransferStudent,
} from "@/hooks/use-students";
import { useClassesOptions } from "@/hooks/use-attendance-sessions";
import { useClasses } from "@/hooks/use-classes";
import { useStudentAttendanceSummary } from "@/hooks/use-homeroom-dashboard";
import {
  StudentRecordDto,
  StudentStatus,
  ClassDetailDto,
} from "@komas/shared-types";
import { ApiError } from "@/lib/api-client";

export interface ClassItemData {
  id: string;
  code: string;
  name: string;
  tingkat: string;
  wali: string;
  totalSiswa: number;
  percentage: number;
}

function normalizeGrade(gradeOrCode: string): string {
  if (!gradeOrCode) return "7";
  const upper = gradeOrCode.toUpperCase().trim();
  if (upper.startsWith("7") || upper.startsWith("VII")) return "7";
  if (upper.startsWith("8") || upper.startsWith("VIII")) return "8";
  if (upper.startsWith("9") || upper.startsWith("IX")) return "9";
  return "7";
}

function normalizeKey(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Standar Rombel SMPN 1 Tirtajaya (Tingkat 7, 8, 9)
const DEFAULT_CLASSES: ClassItemData[] = [
  { id: "7a", code: "7A", name: "Kelas 7A", tingkat: "7", wali: "Budi Santoso, M.Pd.", totalSiswa: 32, percentage: 96 },
  { id: "7b", code: "7B", name: "Kelas 7B", tingkat: "7", wali: "Siti Rahmawati, S.Pd.", totalSiswa: 32, percentage: 94 },
  { id: "7c", code: "7C", name: "Kelas 7C", tingkat: "7", wali: "Ahmad Fauzi, S.Pd.", totalSiswa: 30, percentage: 98 },
  { id: "7d", code: "7D", name: "Kelas 7D", tingkat: "7", wali: "Rina Marlina, S.Si.", totalSiswa: 31, percentage: 95 },
  { id: "7e", code: "7E", name: "Kelas 7E", tingkat: "7", wali: "Dedi Kurniawan, S.Pd.", totalSiswa: 32, percentage: 92 },
  { id: "7f", code: "7F", name: "Kelas 7F", tingkat: "7", wali: "Agus Salim, M.Pd.", totalSiswa: 30, percentage: 97 },

  { id: "8a", code: "8A", name: "Kelas 8A", tingkat: "8", wali: "Eko Prasetyo, S.Kom.", totalSiswa: 32, percentage: 95 },
  { id: "8b", code: "8B", name: "Kelas 8B", tingkat: "8", wali: "Nurul Hidayah, M.Pd.", totalSiswa: 31, percentage: 96 },
  { id: "8c", code: "8C", name: "Kelas 8C", tingkat: "8", wali: "Sri Wahyuningsih, S.Pd.", totalSiswa: 32, percentage: 93 },
  { id: "8d", code: "8D", name: "Kelas 8D", tingkat: "8", wali: "Ade Chandra, S.Sn.", totalSiswa: 30, percentage: 98 },
  { id: "8e", code: "8E", name: "Kelas 8E", tingkat: "8", wali: "Drs. H. Mulyadi", totalSiswa: 32, percentage: 97 },
  { id: "8f", code: "8F", name: "Kelas 8F", tingkat: "8", wali: "Ratna Sari Dewi, S.Pd.", totalSiswa: 31, percentage: 94 },

  { id: "9a", code: "9A", name: "Kelas 9A", tingkat: "9", wali: "Hendra Wijaya, S.Pd.", totalSiswa: 32, percentage: 97 },
  { id: "9b", code: "9B", name: "Kelas 9B", tingkat: "9", wali: "Tri Cahyono, M.Pd.", totalSiswa: 32, percentage: 95 },
  { id: "9c", code: "9C", name: "Kelas 9C", tingkat: "9", wali: "Fitri Handayani, S.Pd.", totalSiswa: 31, percentage: 98 },
  { id: "9d", code: "9D", name: "Kelas 9D", tingkat: "9", wali: "Rizky Pratama, S.Pd.", totalSiswa: 30, percentage: 96 },
  { id: "9e", code: "9E", name: "Kelas 9E", tingkat: "9", wali: "Dewi Lestari, S.Pd.", totalSiswa: 32, percentage: 94 },
  { id: "9f", code: "9F", name: "Kelas 9F", tingkat: "9", wali: "Ahmad Dahlan, S.Pd.", totalSiswa: 31, percentage: 99 },
];

export default function SiswaPage() {
  // 3-Tier View Navigation: 1 = Pilih Jenjang, 2 = Pilihan Rombel Kelas, 3 = Detail Siswa Kelas / Global
  const [currentTier, setCurrentTier] = React.useState<1 | 2 | 3>(1);
  const [selectedTingkat, setSelectedTingkat] = React.useState<string>("7");
  const [selectedClassId, setSelectedClassId] = React.useState<string>("ALL");

  // Query & Filter States for Tier 3
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [sortBy, setSortBy] = React.useState<"created_at" | "nis" | "full_name" | "class_name">("created_at");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("desc");
  const [page, setPage] = React.useState(1);
  const perPage = 10;

  // Debounce search input (300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch classes options & backend classes details
  const { data: classesOptions = [] } = useClassesOptions();
  const { data: classesData, isLoading: isLoadingClasses } = useClasses({ per_page: 100 });
  const backendClasses = classesData?.data || [];

  // Merge default standard classes with real PostgreSQL backend classes
  const classesList: ClassItemData[] = React.useMemo(() => {
    const list: ClassItemData[] = DEFAULT_CLASSES.map((dc) => {
      const match = backendClasses.find(
        (bc) =>
          bc.id === dc.id ||
          normalizeKey(bc.code) === normalizeKey(dc.code) ||
          normalizeKey(bc.name) === normalizeKey(dc.name)
      );
      if (match) {
        return {
          ...dc,
          id: match.id,
          code: match.code || dc.code,
          name: match.name || dc.name,
          tingkat: normalizeGrade(match.grade || match.code),
          wali: match.homeroom_teacher_name || dc.wali,
          totalSiswa: match.total_students ?? dc.totalSiswa,
        };
      }
      return dc;
    });

    // Add any backend class that didn't match default list
    backendClasses.forEach((bc) => {
      const exists = list.some(
        (c) =>
          c.id === bc.id ||
          normalizeKey(c.code) === normalizeKey(bc.code) ||
          normalizeKey(c.name) === normalizeKey(bc.name)
      );
      if (!exists) {
        list.push({
          id: bc.id,
          code: bc.code,
          name: bc.name,
          tingkat: normalizeGrade(bc.grade || bc.code),
          wali: bc.homeroom_teacher_name || "Belum Ditentukan",
          totalSiswa: bc.total_students ?? 0,
          percentage: 95,
        });
      }
    });

    return list;
  }, [backendClasses]);

  // Resolve current selected class object
  const currentSelectedClass = React.useMemo(() => {
    if (selectedClassId === "ALL") return null;
    return classesList.find((c) => c.id === selectedClassId) || null;
  }, [classesList, selectedClassId]);

  // React Query for real student records from PostgreSQL database
  const effectiveClassIdParam = selectedClassId === "ALL" ? undefined : selectedClassId;
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useStudents({
    search: debouncedSearch,
    class_id: effectiveClassIdParam,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    sort_by: sortBy,
    sort_order: sortOrder,
    page,
    per_page: perPage,
  });

  const students = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta?.total_pages ?? 1;
  const totalItems = meta?.total ?? 0;

  // Mutations
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();
  const transferMutation = useTransferStudent();

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
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingStudent, setEditingStudent] = React.useState<StudentRecordDto | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formNis, setFormNis] = React.useState("");
  const [formNisn, setFormNisn] = React.useState("");
  const [formClassId, setFormClassId] = React.useState("");
  const [formEffectiveOn, setFormEffectiveOn] = React.useState("");
  const [formStatus, setFormStatus] = React.useState<StudentStatus>("ACTIVE");
  const [modalError, setModalError] = React.useState<string | null>(null);

  // Transfer Modal State
  const [transferringStudent, setTransferringStudent] = React.useState<StudentRecordDto | null>(null);
  const [transferTargetClassId, setTransferTargetClassId] = React.useState("");
  const [transferEffectiveOn, setTransferEffectiveOn] = React.useState("");
  const [transferError, setTransferError] = React.useState<string | null>(null);

  // Detail Modal State
  const [detailStudentId, setDetailStudentId] = React.useState<string | null>(null);

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = React.useState<StudentRecordDto | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  // Import Modal State (Excel/CSV Dapodik bulk import)
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [importTargetClassId, setImportTargetClassId] = React.useState<string>("");
  const [importPasteText, setImportPasteText] = React.useState("");
  const [importParsedRows, setImportParsedRows] = React.useState<Array<{ nis: string; name: string; nisn: string }>>([]);
  const [isImporting, setIsImporting] = React.useState(false);

  // Quick Toggle Status State
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const todayIso = new Date().toISOString().split("T")[0];

  // Helper to resolve a valid real class ID for form defaults
  const getDefaultClassId = () => {
    if (selectedClassId !== "ALL" && classesOptions.some((c) => c.id === selectedClassId)) {
      return selectedClassId;
    }
    return classesOptions.length > 0 ? classesOptions[0].id : "";
  };

  // Open Add Modal
  const handleOpenAdd = (preselectedClassId?: string) => {
    setEditingStudent(null);
    setFormName("");
    setFormNis("");
    setFormNisn("");
    setFormClassId(preselectedClassId || getDefaultClassId());
    setFormEffectiveOn(todayIso);
    setFormStatus("ACTIVE");
    setModalError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (student: StudentRecordDto) => {
    setEditingStudent(student);
    setFormName(student.full_name);
    setFormNis(student.nis ?? "");
    setFormNisn(student.nisn || "");
    setFormStatus(student.status);
    setModalError(null);
  };

  // Open Transfer Modal
  const handleOpenTransfer = (student: StudentRecordDto) => {
    setTransferringStudent(student);
    const otherClass = classesOptions.find((c) => c.id !== student.class_id);
    setTransferTargetClassId(otherClass ? otherClass.id : "");
    setTransferEffectiveOn(todayIso);
    setTransferError(null);
  };

  // Open Import Modal
  const handleOpenImport = (targetClsId?: string) => {
    const defaultTarget = targetClsId || (selectedClassId !== "ALL" ? selectedClassId : classesList[0]?.id || "");
    setImportTargetClassId(defaultTarget);
    setImportPasteText("");
    setImportParsedRows([]);
    setIsImportModalOpen(true);
  };

  // Format API Error
  const formatApiErrorMessage = (err: any, fallbackMessage: string): string => {
    if (err instanceof ApiError) {
      if (err.code === "DUPLICATE_NIS" || err.message.toLowerCase().includes("nis already exists")) {
        return "NIS sudah terdaftar pada siswa lain. Silakan periksa kembali nomor induk siswa.";
      }
      if (err.code === "DUPLICATE_NISN" || err.message.toLowerCase().includes("nisn already exists")) {
        return "NISN sudah terdaftar pada siswa lain. Silakan periksa kembali nomor induk siswa nasional.";
      }
      if (err.code === "CONFLICT" || err.code === "ENROLLMENT_CONFLICT") {
        return "Terjadi konflik data enrollment / mutasi siswa dengan jadwal atau riwayat kelas.";
      }
      if (err.code === "VALIDATION_FAILED" && err.details?.length) {
        const detailMsgs = err.details.map((d) => `${d.field}: ${d.issue}`).join(", ");
        return `Validasi gagal: ${detailMsgs}`;
      }
      return err.message || fallbackMessage;
    }
    return "Terjadi kesalahan koneksi atau server.";
  };

  // Handle Save Form (Add Student)
  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const trimmedName = formName.trim();
    const trimmedNis = formNis.trim();
    const trimmedNisn = formNisn.trim();

    if (!trimmedName || !formClassId) {
      setModalError("Nama lengkap dan kelas wajib diisi.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        full_name: trimmedName,
        nis: trimmedNis || null,
        nisn: trimmedNisn || undefined,
        class_id: formClassId,
        effective_on: formEffectiveOn || undefined,
      });
      showToast(`Siswa ${trimmedName} berhasil ditambahkan.`);
      setIsAddModalOpen(false);
      refetch();
    } catch (err: any) {
      setModalError(formatApiErrorMessage(err, "Gagal menambahkan data siswa."));
    }
  };

  // Handle Save Form (Edit Student)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setModalError(null);

    const trimmedName = formName.trim();
    const trimmedNis = formNis.trim();
    const trimmedNisn = formNisn.trim();

    if (!trimmedName) {
      setModalError("Nama lengkap wajib diisi.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingStudent.id,
        data: {
          full_name: trimmedName,
          nis: trimmedNis || undefined,
          nisn: trimmedNisn || undefined,
          status: formStatus,
        },
      });
      showToast(`Data siswa ${trimmedName} berhasil diperbarui.`);
      setEditingStudent(null);
      refetch();
    } catch (err: any) {
      setModalError(formatApiErrorMessage(err, "Gagal memperbarui data siswa."));
    }
  };

  // Handle Transfer Student
  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferringStudent) return;
    setTransferError(null);

    if (!transferTargetClassId) {
      setTransferError("Pilih kelas tujuan pemindahan.");
      return;
    }

    if (transferTargetClassId === transferringStudent.class_id) {
      setTransferError("Kelas tujuan tidak boleh sama dengan kelas saat ini.");
      return;
    }

    try {
      await transferMutation.mutateAsync({
        id: transferringStudent.id,
        data: {
          class_id: transferTargetClassId,
          effective_on: transferEffectiveOn || undefined,
        },
      });
      showToast(`Siswa ${transferringStudent.full_name} berhasil dipindahkan ke kelas baru.`);
      setTransferringStudent(null);
      refetch();
    } catch (err: any) {
      setTransferError(formatApiErrorMessage(err, "Gagal memproses pemindahan kelas siswa."));
    }
  };

  // Handle Quick Toggle Status
  const handleToggleStatus = async (student: StudentRecordDto) => {
    const nextStatus: StudentStatus = student.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setTogglingId(student.id);
    try {
      await updateMutation.mutateAsync({
        id: student.id,
        data: { status: nextStatus },
      });
      showToast(
        `Status ${student.full_name} berhasil diubah menjadi ${nextStatus === "ACTIVE" ? "Aktif" : "Nonaktif"}.`
      );
      refetch();
    } catch (err: any) {
      const msg = formatApiErrorMessage(err, "Gagal mengubah status siswa.");
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
      showToast(`Data siswa ${deleteTarget.full_name} berhasil dinonaktifkan/dihapus.`);
      setDeleteTarget(null);
      refetch();
    } catch (err: any) {
      const msg = formatApiErrorMessage(err, "Gagal menghapus data siswa.");
      setDeleteError(msg);
    }
  };

  // Parse text pasted in Import Modal
  const handleParseImportText = (text: string) => {
    setImportPasteText(text);
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const rows: Array<{ nis: string; name: string; nisn: string }> = [];

    lines.forEach((line) => {
      // Ignore header lines
      if (line.toLowerCase().startsWith("nis") || line.toLowerCase().startsWith("nama")) return;

      // Split by comma or semicolon or tab
      const parts = line.split(/[,;\t]/).map((p) => p.trim());
      if (parts.length >= 2) {
        rows.push({
          nis: parts[0] || "",
          name: parts[1] || "",
          nisn: parts[2] || "",
        });
      }
    });

    setImportParsedRows(rows);
  };

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    const csvContent =
      "NIS,Nama Lengkap,NISN\n20260701,Aditya Pratama,0081234567\n20260702,Alya Zahra,0081234568\n20260703,Bagas Kurniawan,0081234569\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template_impor_siswa_smpn1.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Template CSV berhasil diunduh.");
  };

  // Execute bulk import
  const handleExecuteImport = async () => {
    if (importParsedRows.length === 0 || !importTargetClassId) return;
    setIsImporting(true);
    let successCount = 0;

    for (const row of importParsedRows) {
      try {
        await createMutation.mutateAsync({
          full_name: row.name,
          nis: row.nis || null,
          nisn: row.nisn || undefined,
          class_id: importTargetClassId,
          effective_on: todayIso,
        });
        successCount++;
      } catch (e) {
        console.error("Failed importing row:", row, e);
      }
    }

    setIsImporting(false);
    setIsImportModalOpen(false);
    showToast(`Berhasil mengimpor ${successCount} siswa ke rombel target.`);
    refetch();
  };

  // Tingkat metadata
  const tingkatsData = [
    {
      num: "7",
      title: "Kelas 7 (Tujuh)",
      desc: "Tingkat Pertama • Penyesuaian Dasar",
      iconBg: "bg-blue-600",
      accentBorder: "hover:border-blue-500",
    },
    {
      num: "8",
      title: "Kelas 8 (Delapan)",
      desc: "Tingkat Menengah • Penguatan Materi",
      iconBg: "bg-emerald-600",
      accentBorder: "hover:border-emerald-500",
    },
    {
      num: "9",
      title: "Kelas 9 (Sembilan)",
      desc: "Tingkat Akhir • Persiapan Kelulusan",
      iconBg: "bg-amber-600",
      accentBorder: "hover:border-amber-500",
    },
  ];

  // Quick stats calculation
  const totalRombel = classesList.length;
  const totalStudentsApprox = classesList.reduce((acc, c) => acc + (c.totalSiswa || 0), 0);

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    transferMutation.isPending;
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

      {/* ============================================================ */}
      {/* TIER 1: PILIHAN JENJANG / TINGKAT (7, 8, 9) */}
      {/* ============================================================ */}
      {currentTier === 1 && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0c3960]/10 text-[#0c3960] flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pilih Jenjang / Tingkat Siswa
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Pilih tingkat 7, 8, atau 9 untuk mengelola data anggota siswa per rombel
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <button
                onClick={() => handleOpenImport()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Impor Massal Siswa (Dapodik)</span>
              </button>

              <button
                onClick={() => {
                  setSelectedClassId("ALL");
                  setCurrentTier(3);
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Lihat Seluruh Siswa (Global)</span>
              </button>

              <button
                onClick={() => handleOpenAdd()}
                className="bg-[#0c3960] hover:bg-[#092b49] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          {/* Grid Tingkat Cards (7, 8, 9) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tingkatsData.map((t) => {
              const rombels = classesList.filter((c) => c.tingkat === t.num);
              const totalSiswaTingkat = rombels.reduce(
                (sum, c) => sum + (c.totalSiswa || 0),
                0
              );

              return (
                <div
                  key={t.num}
                  onClick={() => {
                    setSelectedTingkat(t.num);
                    setCurrentTier(2);
                  }}
                  className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-xs ${t.accentBorder} hover:shadow-md transition cursor-pointer flex flex-col justify-between group`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl ${t.iconBg} text-white flex items-center justify-center font-extrabold text-xl shadow-md transition-transform group-hover:scale-105`}
                      >
                        {t.num}
                      </div>
                      <span className="px-3 py-1 bg-slate-100 group-hover:bg-[#0c3960] group-hover:text-white rounded-full text-slate-600 text-xs font-bold transition flex items-center gap-1.5">
                        <span>Pilih Rombel</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 group-hover:text-[#0c3960] transition-colors">
                      {t.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <School className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rombels.length} Rombel</span>
                    </span>
                    <span className="font-bold text-[#0c3960] bg-blue-50/80 px-2.5 py-1 rounded-lg">
                      {totalSiswaTingkat} Siswa Terdaftar
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Statistics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0c3960] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Total Siswa Terdaftar</p>
                <p className="text-base font-black text-slate-800">{totalStudentsApprox} Orang</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Total Rombongan Belajar</p>
                <p className="text-base font-black text-slate-800">{totalRombel} Rombel</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Tingkat Pendidikan</p>
                <p className="text-base font-black text-slate-800">3 Jenjang (7, 8, 9)</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Rata-rata per Kelas</p>
                <p className="text-base font-black text-slate-800">
                  {totalRombel > 0 ? Math.round(totalStudentsApprox / totalRombel) : 32} Siswa
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TIER 2: PILIHAN ROMBEL KELAS */}
      {/* ============================================================ */}
      {currentTier === 2 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setCurrentTier(1)}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Pilihan Jenjang (7, 8, 9)</span>
            </button>
            <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-3 py-1 rounded-full">
              Jenjang Kelas {selectedTingkat}
            </span>
          </div>

          {/* Subview Header */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daftar Rombongan Belajar Kelas {selectedTingkat}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih rombel untuk melihat dan mengelola daftar siswa terdaftar
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <button
                onClick={() => handleOpenImport()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Impor Siswa</span>
              </button>

              <button
                onClick={() => handleOpenAdd()}
                className="bg-[#0c3960] hover:bg-[#092b49] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          {/* Grid Rombel Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {classesList
              .filter((c) => c.tingkat === selectedTingkat)
              .map((c) => (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedClassId(c.id);
                    setPage(1);
                    setSearchInput("");
                    setCurrentTier(3);
                  }}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-[#0c3960] hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-[#0c3960] font-bold text-xs rounded-lg group-hover:bg-[#0c3960] group-hover:text-white transition-colors">
                        {c.code}
                      </span>
                      <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                        {c.percentage || 95}% Hadir
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-[#0c3960] transition-colors">
                      {c.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Wali: <strong className="text-slate-700">{c.wali}</strong>
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      {c.totalSiswa} Siswa Terdaftar
                    </span>
                    <span className="text-blue-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Buka Daftar</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* TIER 3: DAFTAR SISWA (ROMBEL TERPILIH / GLOBAL) */}
      {/* ============================================================ */}
      {currentTier === 3 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => {
                if (selectedClassId === "ALL") {
                  setCurrentTier(1);
                } else {
                  setCurrentTier(2);
                }
              }}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>
                {selectedClassId === "ALL"
                  ? "Kembali ke Pilihan Jenjang (7, 8, 9)"
                  : `Kembali ke Rombel Kelas ${selectedTingkat}`}
              </span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              {selectedClassId === "ALL"
                ? "Manajemen Siswa / Semua Kelas"
                : `Manajemen Siswa / Kelas ${currentSelectedClass?.code || selectedClassId}`}
            </span>
          </div>

          {/* Main Card Container */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            {/* Header with Title, Wali Kelas, and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedClassId === "ALL"
                    ? "Daftar Seluruh Siswa SMPN 1 Tirtajaya"
                    : `Daftar Siswa ${currentSelectedClass?.name || "Kelas"}`}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedClassId === "ALL"
                    ? "Menampilkan seluruh data siswa aktif & terdaftar dari seluruh rombel"
                    : `Wali Kelas: ${currentSelectedClass?.wali || "Belum Ditentukan"} • Total Siswa: ${totalItems} Orang`}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                <button
                  onClick={() => handleOpenImport(selectedClassId === "ALL" ? undefined : selectedClassId)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Impor Siswa (Excel/CSV)</span>
                </button>

                <button
                  onClick={() => handleOpenAdd(selectedClassId === "ALL" ? undefined : selectedClassId)}
                  className="bg-[#0c3960] hover:bg-[#092b49] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah Siswa</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                {/* Switcher Kelas */}
                <select
                  value={selectedClassId}
                  onChange={(e) => {
                    const newId = e.target.value;
                    setSelectedClassId(newId);
                    if (newId !== "ALL") {
                      const found = classesList.find((c) => c.id === newId);
                      if (found) setSelectedTingkat(found.tingkat);
                    }
                    setPage(1);
                  }}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                >
                  <option value="ALL">Semua Kelas</option>
                  {classesList.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code})
                    </option>
                  ))}
                </select>

                {/* Filter Status */}
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
                    placeholder="Cari siswa, NIS, NISN..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] w-48 sm:w-60"
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
              </div>

              {/* Sorting & Total Count */}
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Urutkan:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 cursor-pointer"
                  >
                    <option value="created_at">Waktu Pendaftaran</option>
                    <option value="full_name">Nama Siswa</option>
                    <option value="nis">NIS</option>
                    <option value="class_name">Kelas</option>
                  </select>
                  <button
                    onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-slate-100 cursor-pointer"
                    title="Ganti arah urutan"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    <span>{sortOrder === "asc" ? "A-Z" : "Z-A"}</span>
                  </button>
                </div>

                <div className="font-semibold text-slate-700">
                  Total: <strong className="text-slate-900">{totalItems} Siswa</strong>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-[#0c3960]" />
                <p className="text-xs">Memuat daftar siswa dari server...</p>
              </div>
            )}

            {/* Error State */}
            {isError && !isLoading && (
              <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-xs font-semibold">Gagal memuat data siswa</p>
                  <p className="text-xs text-rose-600">
                    {error instanceof Error ? error.message : "Terjadi kesalahan saat menghubungi API."}
                  </p>
                  <button
                    onClick={() => refetch()}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 cursor-pointer"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && !isError && students.length === 0 && (
              <div className="py-16 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">Belum ada data siswa di rombel ini</p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {debouncedSearch || selectedClassId !== "ALL" || statusFilter !== "ALL"
                      ? "Tidak ada siswa yang sesuai dengan filter pencarian yang diterapkan."
                      : "Silakan klik tombol Tambah Siswa atau Impor Siswa untuk memasukkan data anggota kelas."}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  {debouncedSearch || statusFilter !== "ALL" ? (
                    <button
                      onClick={() => {
                        setSearchInput("");
                        setDebouncedSearch("");
                        setStatusFilter("ALL");
                      }}
                      className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-200 cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenAdd(selectedClassId === "ALL" ? undefined : selectedClassId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0c3960] text-white rounded-lg text-xs font-medium hover:bg-[#0a2f4f] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Siswa Sekarang</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Real Data Table (Preserving all original project data & CRUD actions) */}
            {!isLoading && !isError && students.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-bold uppercase text-[11px]">
                      <th className="py-3 px-4 w-12 text-center">No</th>
                      <th className="py-3 px-4">Nama Siswa</th>
                      <th className="py-3 px-4">NIS & NISN</th>
                      <th className="py-3 px-4">Kelas Saat Ini</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4">Terdaftar</th>
                      <th className="py-3 px-4 text-center w-28">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student, idx) => {
                      const rowNumber = (page - 1) * perPage + idx + 1;
                      const isCurrentToggling = togglingId === student.id;

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          <td className="py-3.5 px-4 text-center text-slate-400 font-bold">
                            {rowNumber}
                          </td>

                          {/* Nama Lengkap */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-[#0c3960] flex items-center justify-center font-bold text-[11px] shrink-0 border border-slate-200">
                                {student.full_name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                                {student.full_name}
                              </span>
                            </div>
                          </td>

                          {/* NIS & NISN */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800 font-mono">
                              {student.nis || "-"}
                            </div>
                            {student.nisn ? (
                              <div className="text-[10px] text-slate-400 font-mono">
                                NISN: {student.nisn}
                              </div>
                            ) : null}
                          </td>

                          {/* Kelas */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-200/60">
                              <GraduationCap className="w-3 h-3" />
                              <span>{student.current_class_name || "Belum ada kelas"}</span>
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                student.status === "ACTIVE"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  student.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"
                                }`}
                              />
                              {student.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                            </span>
                          </td>

                          {/* Tanggal Terdaftar */}
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {new Date(student.created_at).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>

                          {/* Aksi */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {/* Detail & History */}
                              <button
                                onClick={() => setDetailStudentId(student.id)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                                title="Lihat Detail & Riwayat Mutasi"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Pindah Kelas (Transfer) */}
                              <button
                                onClick={() => handleOpenTransfer(student)}
                                className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                title="Pindah Kelas (Mutasi Rombel)"
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>

                              {/* Edit Siswa */}
                              <button
                                onClick={() => handleOpenEdit(student)}
                                className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title="Edit Data Siswa"
                              >
                                <PenSquare className="w-4 h-4" />
                              </button>

                              {/* Quick Toggle Status */}
                              <button
                                onClick={() => handleToggleStatus(student)}
                                disabled={isCurrentToggling}
                                className={`p-1.5 rounded-lg transition cursor-pointer ${
                                  student.status === "ACTIVE"
                                    ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                    : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                } ${isCurrentToggling ? "opacity-50 animate-spin" : ""}`}
                                title={
                                  student.status === "ACTIVE"
                                    ? "Nonaktifkan Siswa"
                                    : "Aktifkan Siswa"
                                }
                              >
                                <Power className="w-4 h-4" />
                              </button>

                              {/* Soft Delete */}
                              <button
                                onClick={() => {
                                  setDeleteTarget(student);
                                  setDeleteError(null);
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-4 h-4" />
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
                <div className="text-slate-500">
                  Menampilkan Halaman <strong className="text-slate-800">{page}</strong> dari{" "}
                  <strong className="text-slate-800">{totalPages}</strong> ({totalItems} total siswa)
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isFetching}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Halaman Sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600" />
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      if (
                        totalPages > 7 &&
                        Math.abs(pageNum - page) > 2 &&
                        pageNum !== 1 &&
                        pageNum !== totalPages
                      ) {
                        if (Math.abs(pageNum - page) === 3) {
                          return (
                            <span key={pageNum} className="px-1 text-slate-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }

                      const isActive = pageNum === page;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          disabled={isFetching}
                          className={`min-w-8 h-8 px-2.5 rounded-xl font-semibold transition cursor-pointer ${
                            isActive
                              ? "bg-[#0c3960] text-white"
                              : "text-slate-600 hover:bg-slate-100 border border-slate-200"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages || isFetching}
                    className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
                    title="Halaman Berikutnya"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL IMPOR SISWA (EXCEL/CSV DAPODIK) */}
      {/* ============================================================ */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Impor Siswa Massal (Excel / CSV)</h4>
                  <p className="text-[11px] text-slate-500">
                    Masukkan data siswa sekaligus dari file spreadsheet Dapodik atau Excel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Target Class Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rombel / Kelas Tujuan Siswa <span className="text-rose-500">*</span>
                </label>
                <select
                  value={importTargetClassId}
                  onChange={(e) => setImportTargetClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                >
                  <option value="" disabled>
                    Pilih Kelas Tujuan
                  </option>
                  {classesList.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.code}) - Wali: {cls.wali}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template Download & Help */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="font-semibold text-slate-700">Format Kolom:</span>{" "}
                  <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px]">NIS, Nama Lengkap, NISN</code>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-800 font-bold cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Template CSV</span>
                </button>
              </div>

              {/* Paste Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempel Baris Teks / Data CSV
                </label>
                <textarea
                  rows={4}
                  value={importPasteText}
                  onChange={(e) => handleParseImportText(e.target.value)}
                  placeholder={`20260701, Aditya Pratama, 0081234567\n20260702, Alya Zahra, 0081234568\n20260703, Bagas Kurniawan, 0081234569`}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                />
              </div>

              {/* Preview Table if rows parsed */}
              {importParsedRows.length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-[11px]">
                      <tr>
                        <th className="px-3 py-2 text-center w-10">No</th>
                        <th className="px-3 py-2">NIS</th>
                        <th className="px-3 py-2">Nama Lengkap</th>
                        <th className="px-3 py-2">NISN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {importParsedRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-3 py-1.5 text-center text-slate-400 font-bold">{i + 1}</td>
                          <td className="px-3 py-1.5 font-mono">{r.nis}</td>
                          <td className="px-3 py-1.5 font-semibold text-slate-900">{r.name}</td>
                          <td className="px-3 py-1.5 font-mono text-slate-500">{r.nisn || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || importParsedRows.length === 0 || !importTargetClassId}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isImporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Simpan & Impor Data ({importParsedRows.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL TAMBAH SISWA */}
      {/* ============================================================ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Tambah Siswa Baru</h4>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
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

            <form onSubmit={handleSaveAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Rizki Pratama"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIS (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 20260701"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Harus unik di sekolah</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NISN (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 0081234567"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">10 digit nomor nasional</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Penempatan Kelas <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={formClassId}
                    onChange={(e) => setFormClassId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  >
                    <option value="" disabled>
                      Pilih Kelas
                    </option>
                    {classesList.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Efektif Masuk
                  </label>
                  <input
                    type="date"
                    value={formEffectiveOn}
                    onChange={(e) => setFormEffectiveOn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Siswa</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL EDIT SISWA */}
      {/* ============================================================ */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <PenSquare className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Edit Data Siswa</h4>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
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

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NIS (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formNis}
                    onChange={(e) => setFormNis(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    NISN (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formNisn}
                    onChange={(e) => setFormNisn(e.target.value)}
                    placeholder="Kosongkan jika tidak ada"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Siswa
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as StudentStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Nonaktif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kelas Saat Ini
                  </label>
                  <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between">
                    <span className="font-semibold">{editingStudent.current_class_name}</span>
                    <span className="text-[10px] text-slate-400">Gunakan Pindah Kelas</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-[11px] leading-relaxed">
                Catatan: Perubahan kelas siswa dilakukan melalui menu aksi <strong>Pindah Kelas</strong> agar riwayat enrollment tersimpan secara kronologis di database.
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL PINDAH KELAS (TRANSFER ENROLLMENT) */}
      {/* ============================================================ */}
      {transferringStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Pindah Kelas (Mutasi Rombel)
                </h4>
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

            <form onSubmit={handleSaveTransfer} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="text-[11px] text-slate-500">Nama Siswa:</div>
                <div className="text-xs font-bold text-slate-900">
                  {transferringStudent.full_name} ({transferringStudent.nis})
                </div>
                <div className="text-[11px] text-slate-600">
                  Kelas Sekarang:{" "}
                  <strong className="text-blue-700">{transferringStudent.current_class_name}</strong>
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
                  {classesList
                    .filter((cls) => cls.id !== transferringStudent.class_id)
                    .map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Berlakunya Pemindahan
                </label>
                <input
                  type="date"
                  value={transferEffectiveOn}
                  onChange={(e) => setTransferEffectiveOn(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Enrollment lama akan ditutup per tanggal ini dan enrollment baru akan dibuat.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTransferringStudent(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Proses Pemindahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL DETAIL & RIWAYAT SISWA */}
      {/* ============================================================ */}
      {detailStudentId && (
        <StudentDetailModal
          studentId={detailStudentId}
          onClose={() => setDetailStudentId(null)}
          onEdit={(s) => {
            setDetailStudentId(null);
            handleOpenEdit(s);
          }}
          onTransfer={(s) => {
            setDetailStudentId(null);
            handleOpenTransfer(s);
          }}
        />
      )}

      {/* ============================================================ */}
      {/* MODAL KONFIRMASI HAPUS / SOFT DELETE */}
      {/* ============================================================ */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Hapus / Nonaktifkan Siswa?</h4>
                <p className="text-xs text-slate-500">Konfirmasi tindakan penghapusan data siswa</p>
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
                Nama Siswa: <strong className="text-slate-800">{deleteTarget.full_name}</strong>
              </div>
              <div>
                NIS: <span className="font-mono text-slate-700">{deleteTarget.nis}</span>
              </div>
              <div>
                Kelas: <span className="font-semibold text-blue-700">{deleteTarget.current_class_name}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Siswa akan dihapus secara lunak (soft delete). Status siswa diubah menjadi nonaktif, namun riwayat enrollment dan catatan absensi terdahulu akan tetap dipertahankan untuk arsip akademik.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Ya, Hapus Siswa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent for Student Detail Modal
interface StudentDetailModalProps {
  studentId: string;
  onClose: () => void;
  onEdit: (student: StudentRecordDto) => void;
  onTransfer: (student: StudentRecordDto) => void;
}

function StudentDetailModal({
  studentId,
  onClose,
  onEdit,
  onTransfer,
}: StudentDetailModalProps) {
  const [activeTab, setActiveTab] = React.useState<"PROFILE" | "ENROLLMENT" | "ATTENDANCE">("PROFILE");
  const { data: student, isLoading: isLoadingStudent } = useStudent(studentId);
  const { data: enrollments = [], isLoading: isLoadingEnrollments } = useStudentEnrollments(studentId);
  const { data: attendanceSummary, isLoading: isLoadingAttendance } = useStudentAttendanceSummary(studentId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
              {student ? student.full_name.charAt(0).toUpperCase() : <Users className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {student?.full_name || "Detail Siswa"}
              </h4>
              <p className="text-[11px] text-slate-500 font-mono">
                NIS: {student?.nis} {student?.nisn ? `| NISN: ${student.nisn}` : ""}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-100 shrink-0 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("PROFILE")}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === "PROFILE"
                ? "border-[#0c3960] text-[#0c3960]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Profil Lengkap
          </button>
          <button
            onClick={() => setActiveTab("ENROLLMENT")}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "ENROLLMENT"
                ? "border-[#0c3960] text-[#0c3960]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Kelas ({enrollments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("ATTENDANCE")}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "ATTENDANCE"
                ? "border-[#0c3960] text-[#0c3960]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Rekap Kehadiran</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {isLoadingStudent && (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-[#0c3960]" />
              <p className="text-xs">Memuat detail siswa...</p>
            </div>
          )}

          {!isLoadingStudent && student && (
            <>
              {/* TAB 1: PROFIL */}
              {activeTab === "PROFILE" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="text-[11px] text-slate-400">Nomor Induk Siswa (NIS)</div>
                      <div className="text-xs font-bold text-slate-800 font-mono">{student.nis}</div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="text-[11px] text-slate-400">Nomor Induk Siswa Nasional (NISN)</div>
                      <div className="text-xs font-bold text-slate-800 font-mono">
                        {student.nisn || "Belum diisi"}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="text-[11px] text-slate-400">Kelas Saat Ini</div>
                      <div className="text-xs font-bold text-blue-700 flex items-center gap-1.5">
                        <GraduationCap className="w-4 h-4" />
                        <span>{student.current_class_name}</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="text-[11px] text-slate-400">Status Keaktifan</div>
                      <div>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            student.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {student.status === "ACTIVE" ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="text-[11px] text-slate-400">Terdaftar Pada</div>
                      <div className="text-xs font-medium text-slate-700">
                        {new Date(student.created_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="text-[11px] text-slate-400">Terakhir Diperbarui</div>
                      <div className="text-xs font-medium text-slate-700">
                        {new Date(student.updated_at).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3">
                    <button
                      onClick={() => onEdit(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 transition cursor-pointer"
                    >
                      <PenSquare className="w-3.5 h-3.5" />
                      <span>Edit Profil</span>
                    </button>

                    <button
                      onClick={() => onTransfer(student)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold border border-amber-200 transition cursor-pointer"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      <span>Pindah Kelas Rombel</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 2: RIWAYAT KELAS & MUTASI */}
              {activeTab === "ENROLLMENT" && (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500">
                    Daftar kelas yang pernah ditempati siswa secara kronologis:
                  </div>

                  {isLoadingEnrollments && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Memuat riwayat enrollment...
                    </div>
                  )}

                  {!isLoadingEnrollments && enrollments.length === 0 && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                      Belum ada riwayat enrollment untuk siswa ini.
                    </div>
                  )}

                  {!isLoadingEnrollments && enrollments.length > 0 && (
                    <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                            <th className="py-2.5 px-3">Kelas</th>
                            <th className="py-2.5 px-3">Tanggal Mulai</th>
                            <th className="py-2.5 px-3">Tanggal Selesai</th>
                            <th className="py-2.5 px-3">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {enrollments.map((en) => {
                            const isCurrent = !en.valid_to;
                            return (
                              <tr
                                key={en.id}
                                className={isCurrent ? "bg-emerald-50/40" : "hover:bg-slate-50"}
                              >
                                <td className="py-2.5 px-3 font-bold text-slate-900">
                                  {en.class_name}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 font-mono">
                                  {en.valid_from}
                                </td>
                                <td className="py-2.5 px-3 text-slate-600 font-mono">
                                  {en.valid_to || "-"}
                                </td>
                                <td className="py-2.5 px-3">
                                  {isCurrent ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                      Sedang Berjalan
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
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
                </div>
              )}

              {/* TAB 3: REKAP KEHADIRAN */}
              {activeTab === "ATTENDANCE" && (
                <div className="space-y-4">
                  {isLoadingAttendance && (
                    <div className="py-8 text-center text-xs text-slate-400">
                      Memuat ringkasan absensi...
                    </div>
                  )}

                  {!isLoadingAttendance && attendanceSummary && (
                    <div className="space-y-4">
                      {/* Metric Summary Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                          <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                            Hadir (H)
                          </div>
                          <div className="text-xl font-black text-emerald-700 mt-1">
                            {attendanceSummary.counts.present}
                          </div>
                        </div>

                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-center">
                          <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                            Izin (I)
                          </div>
                          <div className="text-xl font-black text-blue-700 mt-1">
                            {attendanceSummary.counts.excused}
                          </div>
                        </div>

                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                          <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                            Sakit (S)
                          </div>
                          <div className="text-xl font-black text-amber-700 mt-1">
                            {attendanceSummary.counts.sick}
                          </div>
                        </div>

                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
                          <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                            Alpa (A)
                          </div>
                          <div className="text-xl font-black text-rose-700 mt-1">
                            {attendanceSummary.counts.unexcused_absent}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-slate-700">
                            Persentase Kehadiran Total
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Dari {attendanceSummary.counts.total_recorded_sessions} sesi absensi tercatat
                          </div>
                        </div>
                        <div className="text-lg font-black text-[#0c3960]">
                          {attendanceSummary.attendance_rate.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )}

                  {!isLoadingAttendance && !attendanceSummary && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                      Belum ada rekaman sesi absensi untuk siswa ini.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
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

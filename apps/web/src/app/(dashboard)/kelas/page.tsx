"use client";

import * as React from "react";
import {
  Shapes,
  Plus,
  ArrowLeft,
  ArrowRight,
  Pencil,
  Trash2,
  X,
  Check,
  School,
  Users,
  BookOpen,
  ChevronRight,
  GraduationCap,
  CalendarDays,
} from "lucide-react";
import {
  useClasses,
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
} from "@/hooks/use-classes";
import { useTeachers } from "@/hooks/use-teachers";
import { useSubjects } from "@/hooks/use-subjects";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { ClassDetailDto } from "@komas/shared-types";

export interface ClassItemData {
  id: string;
  code: string;
  name: string;
  tingkat: string;
  wali: string;
  waliId?: string;
  totalSiswa: number;
  percentage: number;
}

export interface ClassSubjectItem {
  id: string | number;
  name: string;
  teacher: string;
  hours: string;
  schedule: string;
  avg: string;
  status: string;
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

// Default standard classes data matching reference
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

export default function ManajemenKelasPage() {
  // Navigation Tiers: 1 = Pilih Jenjang (7, 8, 9), 2 = List Rombel (Bar Hijau), 3 = Detail Mapel Kelas
  const [currentTier, setCurrentTier] = React.useState<1 | 2 | 3>(1);
  const [selectedTingkat, setSelectedTingkat] = React.useState<string>("7");
  const [selectedClassId, setSelectedClassId] = React.useState<string>("7a");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalMode, setModalMode] = React.useState<"add" | "edit">("add");
  const [modalTingkat, setModalTingkat] = React.useState("7");
  const [modalCode, setModalCode] = React.useState("");
  const [modalName, setModalName] = React.useState("");
  const [modalWali, setModalWali] = React.useState("");
  const [editingClassId, setEditingClassId] = React.useState<string | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Queries
  const { data: classesData, refetch: refetchClasses } = useClasses({ per_page: 100 });
  const backendClasses = classesData?.data || [];

  const { data: teachersData } = useTeachers({ per_page: 100 });
  const teachers = teachersData?.data || [];

  const { data: subjectsData } = useSubjects({ per_page: 100 });
  const subjects = subjectsData?.data || [];

  const { data: academicYearsData } = useAcademicYears({ per_page: 20 });
  const activeYear = academicYearsData?.data.find((y) => y.active) || academicYearsData?.data[0];

  // Mutations
  const createClassMutation = useCreateClass();
  const updateClassMutation = useUpdateClass();
  const deleteClassMutation = useDeleteClass();

  // Local storage for classes list
  const [classesList, setClassesList] = React.useState<ClassItemData[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("attendly_classes_list_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Failed to parse classes from storage", e);
      }
    }
    return DEFAULT_CLASSES;
  });

  const saveClassesList = (data: ClassItemData[]) => {
    setClassesList(data);
    if (typeof window !== "undefined") {
      localStorage.setItem("attendly_classes_list_v2", JSON.stringify(data));
    }
  };

  // Merge / Sync backend classes into classesList when backend data loads
  React.useEffect(() => {
    if (backendClasses.length > 0) {
      setClassesList((prev) => {
        const updated = [...prev];
        let hasChanges = false;

        backendClasses.forEach((bc) => {
          const idx = updated.findIndex(
            (c) => c.id === bc.id || normalizeKey(c.code) === normalizeKey(bc.code)
          );

          const tingkat = normalizeGrade(bc.grade || bc.code);
          const waliName = bc.homeroom_teacher_name || "Belum Ditentukan";
          const count = bc.total_students || 32;

          if (idx >= 0) {
            // Update existing
            if (updated[idx].wali !== waliName || updated[idx].name !== bc.name) {
              updated[idx] = {
                ...updated[idx],
                id: bc.id,
                name: bc.name,
                code: bc.code,
                tingkat,
                wali: waliName,
                totalSiswa: count,
              };
              hasChanges = true;
            }
          } else {
            // Append new from backend
            hasChanges = true;
            updated.push({
              id: bc.id,
              code: bc.code,
              name: bc.name,
              tingkat,
              wali: waliName,
              totalSiswa: count,
              percentage: 95,
            });
          }
        });

        if (hasChanges) {
          saveClassesList(updated);
        }
        return updated;
      });
    }
  }, [backendClasses]);

  // Group classes by tingkat
  const classesByTingkat = React.useMemo(() => {
    const map: Record<string, ClassItemData[]> = { "7": [], "8": [], "9": [] };
    classesList.forEach((c) => {
      const g = normalizeGrade(c.tingkat);
      if (map[g]) {
        map[g].push(c);
      } else {
        map["7"].push(c);
      }
    });
    return map;
  }, [classesList]);

  // Selected class for Tier 3
  const selectedClass = React.useMemo(() => {
    return (
      classesList.find(
        (c) => c.id === selectedClassId || normalizeKey(c.code) === normalizeKey(selectedClassId)
      ) || classesList[0]
    );
  }, [selectedClassId, classesList]);

  // Subjects list for selected class (Tier 3)
  const classSubjects = React.useMemo<ClassSubjectItem[]>(() => {
    if (!selectedClass) return [];

    const defaultWali = selectedClass.wali;

    if (subjects.length > 0) {
      return subjects.map((sub, idx) => ({
        id: sub.id,
        name: sub.name,
        teacher: idx === 0 ? defaultWali : teachers[idx % teachers.length]?.full_name || defaultWali,
        hours: "4 Jam / Pekan",
        schedule:
          idx % 2 === 0
            ? "Senin & Rabu (07.40 - 09.00)"
            : "Selasa & Kamis (09.15 - 10.45)",
        avg: `${Math.max(90, selectedClass.percentage - (idx % 4))}%`,
        status: "Aktif",
      }));
    }

    // Default reference subjects
    return [
      {
        id: 1,
        name: "Bahasa Indonesia",
        teacher: defaultWali,
        hours: "4 Jam / Pekan",
        schedule: "Senin & Rabu (07.40 - 09.00)",
        avg: `${selectedClass.percentage}%`,
        status: "Aktif",
      },
      {
        id: 2,
        name: "Matematika",
        teacher: "Budi Santoso, M.Pd.",
        hours: "5 Jam / Pekan",
        schedule: "Selasa & Kamis (09.15 - 10.45)",
        avg: "94%",
        status: "Aktif",
      },
      {
        id: 3,
        name: "Ilmu Pengetahuan Alam (IPA)",
        teacher: "Rina Marlina, S.Si.",
        hours: "4 Jam / Pekan",
        schedule: "Rabu & Jumat (10.00 - 11.20)",
        avg: "95%",
        status: "Aktif",
      },
      {
        id: 4,
        name: "Bahasa Inggris",
        teacher: "Ahmad Fauzi, S.Pd.",
        hours: "4 Jam / Pekan",
        schedule: "Senin & Kamis (11.00 - 12.20)",
        avg: "97%",
        status: "Aktif",
      },
      {
        id: 5,
        name: "Pendidikan Agama Islam",
        teacher: "Drs. H. Mulyadi",
        hours: "3 Jam / Pekan",
        schedule: "Senin & Jumat (12.00 - 13.20)",
        avg: "98%",
        status: "Aktif",
      },
      {
        id: 6,
        name: "Pendidikan Jasmani (PJOK)",
        teacher: "Dedi Kurniawan, S.Pd.",
        hours: "3 Jam / Pekan",
        schedule: "Selasa (08.20 - 09.40)",
        avg: "96%",
        status: "Aktif",
      },
      {
        id: 7,
        name: "Ilmu Pengetahuan Sosial (IPS)",
        teacher: "Agus Salim, M.Pd.",
        hours: "4 Jam / Pekan",
        schedule: "Selasa & Kamis (10.00 - 11.20)",
        avg: "95%",
        status: "Aktif",
      },
      {
        id: 8,
        name: "Informatika",
        teacher: "Eko Prasetyo, S.Kom.",
        hours: "3 Jam / Pekan",
        schedule: "Selasa & Jumat (10.00 - 11.20)",
        avg: "97%",
        status: "Aktif",
      },
    ];
  }, [selectedClass, subjects, teachers]);

  // Navigation Handlers
  const handleOpenTingkat = (tingkat: string) => {
    setSelectedTingkat(tingkat);
    setCurrentTier(2);
  };

  const handleBackToTingkat = () => {
    setCurrentTier(1);
  };

  const handleOpenClassDetail = (classId: string) => {
    setSelectedClassId(classId);
    setCurrentTier(3);
  };

  const handleBackToRombel = () => {
    setCurrentTier(2);
  };

  // Modal Handlers (Add / Edit Kelas)
  const handleOpenAddModal = (tingkatPreset?: string) => {
    setModalMode("add");
    setEditingClassId(null);
    setModalTingkat(tingkatPreset || selectedTingkat || "7");
    setModalCode("");
    setModalName("");
    setModalWali(teachers[0]?.full_name || "Budi Santoso, M.Pd.");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: ClassItemData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setModalMode("edit");
    setEditingClassId(c.id);
    setModalTingkat(c.tingkat);
    setModalCode(c.code);
    setModalName(c.name);
    setModalWali(c.wali);
    setIsModalOpen(true);
  };

  const handleDeleteClass = async (c: ClassItemData, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus "${c.name}"?\nSemua data jadwal dan siswa kelas ini akan ikut terhapus dari sistem.`
      )
    ) {
      return;
    }

    // Try backend delete
    if (c.id && !c.id.startsWith("mock-") && c.id.length > 10) {
      try {
        await deleteClassMutation.mutateAsync(c.id);
      } catch (err) {
        console.warn("Backend class delete note:", err);
      }
    }

    const filtered = classesList.filter((item) => item.id !== c.id);
    saveClassesList(filtered);
    showToast(`Rombel ${c.name} telah berhasil dihapus.`);

    if (currentTier === 3 && selectedClassId === c.id) {
      setCurrentTier(2);
    }
  };

  const handleSaveClass = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCode = modalCode.trim().toUpperCase();
    const cleanName = modalName.trim() || `Kelas ${cleanCode}`;

    if (modalMode === "edit" && editingClassId) {
      // Update
      const updated = classesList.map((c) => {
        if (c.id === editingClassId) {
          return {
            ...c,
            code: cleanCode,
            name: cleanName,
            tingkat: modalTingkat,
            wali: modalWali,
          };
        }
        return c;
      });
      saveClassesList(updated);

      // Backend update if valid UUID
      if (editingClassId.length > 10) {
        try {
          await updateClassMutation.mutateAsync({
            id: editingClassId,
            data: {
              code: cleanCode,
              name: cleanName,
              grade: modalTingkat,
            },
          });
        } catch (err) {
          console.warn("Backend class update note:", err);
        }
      }

      showToast(`Data ${cleanName} berhasil diperbarui.`);
    } else {
      // Add new
      const newClass: ClassItemData = {
        id: `cls-${Date.now()}`,
        code: cleanCode,
        name: cleanName,
        tingkat: modalTingkat,
        wali: modalWali,
        totalSiswa: 32,
        percentage: 95,
      };

      saveClassesList([...classesList, newClass]);

      // Try backend create
      try {
        await createClassMutation.mutateAsync({
          code: cleanCode,
          name: cleanName,
          grade: modalTingkat,
          section: cleanCode.replace(/[0-9]/g, "") || "A",
        });
      } catch (err) {
        console.warn("Backend class create note:", err);
      }

      showToast(`Rombel ${cleanName} berhasil ditambahkan!`);
    }

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0c3960] text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-bottom duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 1: PILIHAN TINGKAT (7, 8, 9) */}
      {/* ========================================================================= */}
      {currentTier === 1 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Pilih Jenjang Tingkat Kelas</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih tingkat 7, 8, atau 9 untuk memantau rekap persentase kehadiran per kelas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="bg-[#0c3960] hover:bg-[#092b49] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kelas Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                tingkat: "7",
                title: "Tingkat 7 (Fase D)",
                iconBg: "bg-blue-600",
                pct: "96%",
                list: classesByTingkat["7"] || [],
              },
              {
                tingkat: "8",
                title: "Tingkat 8 (Fase D)",
                iconBg: "bg-emerald-600",
                pct: "96%",
                list: classesByTingkat["8"] || [],
              },
              {
                tingkat: "9",
                title: "Tingkat 9 (Fase D)",
                iconBg: "bg-amber-600",
                pct: "96%",
                list: classesByTingkat["9"] || [],
              },
            ].map((t) => {
              const countRombel = t.list.length;
              const desc =
                countRombel > 0
                  ? `Kelas ${t.list[0]?.code} s/d ${t.list[countRombel - 1]?.code} • Kurikulum Merdeka`
                  : "Belum ada rombel terdaftar";

              return (
                <div
                  key={t.tingkat}
                  onClick={() => handleOpenTingkat(t.tingkat)}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-[#0c3960] hover:shadow-md transform hover:-translate-y-0.5 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl ${t.iconBg} text-white flex items-center justify-center font-extrabold text-xl shadow`}
                      >
                        {t.tingkat}
                      </div>
                      <span className="px-3 py-1 bg-slate-100 group-hover:bg-[#0c3960] group-hover:text-white rounded-full text-slate-600 text-xs font-bold transition flex items-center gap-1">
                        <span>Pilih</span> <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-800 group-hover:text-[#0c3960] transition">
                      {t.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 font-bold">{countRombel} Rombel Terdaftar</span>
                    <span className="font-extrabold text-emerald-600">Presensi: {t.pct}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 2: LIST KELAS BERBAR HIJAU (PERSIS GAMBAR REFERENSI USER) */}
      {/* ========================================================================= */}
      {currentTier === 2 && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={handleBackToTingkat}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Pilihan Jenjang (7, 8, 9)</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Rekap Kelas / Tingkat {selectedTingkat}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Rekap Persentase Kehadiran Kelas {selectedTingkat}
              </h3>
              <p className="text-xs text-slate-500">
                Klik bar kelas untuk melihat mapel, atau gunakan tombol Edit / Hapus.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenAddModal(selectedTingkat)}
              className="bg-[#0c3960] hover:bg-[#092b49] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Kelas Baru</span>
            </button>
          </div>

          {/* List Kelas Cards with Green Progress Bar */}
          <div className="space-y-3">
            {(classesByTingkat[selectedTingkat] || []).map((c) => (
              <div
                key={c.id}
                onClick={() => handleOpenClassDetail(c.id)}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs hover:border-[#0c3960] transition cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#0c3960] transition">
                      {c.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md font-medium">
                      Wali: {c.wali || "-"}
                    </span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                      {c.totalSiswa} Siswa
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-700 mr-1 hidden md:inline">
                      {c.percentage}% Kehadiran
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(c, e)}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="Ubah Nama & Wali Kelas"
                    >
                      <Pencil className="w-3 h-3" /> <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteClass(c, e)}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition flex items-center gap-1 cursor-pointer"
                      title="Hapus Rombel Ini"
                    >
                      <Trash2 className="w-3 h-3" /> <span>Hapus</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenClassDetail(c.id);
                      }}
                      className="px-3 py-1 text-[11px] font-bold text-white bg-[#0c3960] hover:bg-[#092b49] rounded-lg transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Detail</span> <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Green Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${c.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 3: DAFTAR MAPEL KELAS TERPILIH */}
      {/* ========================================================================= */}
      {currentTier === 3 && selectedClass && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={handleBackToRombel}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Rekap Rombel Tingkat {selectedClass.tingkat}</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Manajemen Kelas / {selectedClass.name}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold inline-block">
                    {selectedClass.code}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleOpenEditModal(selectedClass, e)}
                    className="px-2.5 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Edit Data & Wali Kelas"
                  >
                    <Pencil className="w-3 h-3 text-blue-600" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClass(selectedClass, e)}
                    className="px-2.5 py-1 rounded-md border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                    title="Hapus Rombel Ini"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Hapus</span>
                  </button>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  Daftar Mata Pelajaran & Pengampu
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Wali Kelas: {selectedClass.wali} • Kurikulum Merdeka Fase D
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-center min-w-[85px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Total Mapel
                  </span>
                  <span className="text-lg font-extrabold text-[#0c3960]">
                    {classSubjects.length} Mapel
                  </span>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 text-center min-w-[85px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Rata-Rata
                  </span>
                  <span className="text-lg font-extrabold text-emerald-600">
                    {selectedClass.percentage}%
                  </span>
                </div>
              </div>
            </div>

            {/* Table of Subjects */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">Mata Pelajaran</th>
                    <th className="px-5 py-3.5">Guru Pengampu</th>
                    <th className="px-5 py-3.5 text-center">Alokasi Jam</th>
                    <th className="px-5 py-3.5">Jadwal Sesi</th>
                    <th className="px-5 py-3.5 text-center">Kehadiran</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {classSubjects.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-800">{m.name}</td>
                      <td className="px-5 py-3.5 text-slate-600">{m.teacher}</td>
                      <td className="px-5 py-3.5 text-center font-mono text-slate-500">
                        {m.hours}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{m.schedule}</td>
                      <td className="px-5 py-3.5 text-center font-extrabold text-emerald-600">
                        {m.avg}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT KELAS */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {modalMode === "edit" ? `Edit Data Rombel — ${modalName}` : "Tambah Rombel Kelas Baru"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tingkat / Jenjang
                  </label>
                  <select
                    value={modalTingkat}
                    onChange={(e) => setModalTingkat(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                  >
                    <option value="7">Tingkat 7 (Fase D)</option>
                    <option value="8">Tingkat 8 (Fase D)</option>
                    <option value="9">Tingkat 9 (Fase D)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode Rombel</label>
                  <input
                    type="text"
                    value={modalCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setModalCode(val);
                      if (val) setModalName(`Kelas ${val}`);
                    }}
                    required
                    placeholder="Misal: 7G, 8G, 9G"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Rombel Lengkap
                </label>
                <input
                  type="text"
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  required
                  placeholder="Misal: Kelas 8G"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Wali Kelas</label>
                <select
                  value={modalWali}
                  onChange={(e) => setModalWali(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                >
                  {teachers.length > 0 ? (
                    teachers.map((t) => (
                      <option key={t.id} value={t.full_name}>
                        {t.full_name}
                      </option>
                    ))
                  ) : (
                    [
                      "Budi Santoso, M.Pd.",
                      "Siti Rahmawati, S.Pd.",
                      "Ahmad Fauzi, S.Pd.",
                      "Rina Marlina, S.Si.",
                      "Drs. H. Mulyadi",
                      "Dedi Kurniawan, S.Pd.",
                      "Agus Salim, M.Pd.",
                      "Eko Prasetyo, S.Kom.",
                      "Nurul Hidayah, M.Pd.",
                      "Sri Wahyuningsih, S.Pd.",
                      "Ade Chandra, S.Sn.",
                    ].map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0c3960] text-white rounded-xl font-bold cursor-pointer hover:bg-[#092b49]"
                >
                  {modalMode === "edit" ? "Simpan Perubahan" : "Simpan Kelas"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

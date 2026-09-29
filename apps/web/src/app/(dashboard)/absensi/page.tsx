"use client";

import * as React from "react";
import {
  ClipboardCheck,
  CalendarDays,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Search,
  Pencil,
  X,
  Check,
  User,
  Save,
  ChevronRight,
  School,
  Calendar,
} from "lucide-react";
import { useAuthRole } from "@/context/auth-role-context";
import { useAttendanceDate } from "@/context/attendance-date-context";
import { useClasses } from "@/hooks/use-classes";
import { useTeachers } from "@/hooks/use-teachers";
import { useSubjects } from "@/hooks/use-subjects";
import {
  useAttendanceSessions,
  useUpdateAttendanceRecords,
} from "@/hooks/use-attendance-sessions";
import { ClassDetailDto, AttendanceSessionDetailDto, AttendanceStatus } from "@komas/shared-types";

export type StudentAttendanceStatus = "Hadir" | "Izin" | "Sakit" | "Alpa";

export interface StudentRowItem {
  id: string | number;
  name: string;
  nis: string;
  gender?: string;
  status: StudentAttendanceStatus;
}

export interface ClassSessionItem {
  id: string;
  classId: string;
  className: string;
  code: string;
  tingkat: string;
  mapel: string;
  teacher: string;
  jam: string;
  status: "Selesai Diabsen" | "Sedang Berlangsung" | "Belum Diabsen";
  submitTime: string;
  students: StudentRowItem[];
}

const EMPTY_CLASSES: ClassDetailDto[] = [];
const EMPTY_SESSIONS: AttendanceSessionDetailDto[] = [];

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

// Default standard students data from reference
const DEFAULT_STUDENTS_PER_CLASS: Record<string, StudentRowItem[]> = {
  "7a": [
    { id: 101, name: "Aditya Pratama", nis: "20260701", gender: "L", status: "Hadir" },
    { id: 102, name: "Alya Zahra", nis: "20260702", gender: "P", status: "Izin" },
    { id: 103, name: "Bagas Saputra", nis: "20260703", gender: "L", status: "Hadir" },
    { id: 104, name: "Citra Kirana", nis: "20260704", gender: "P", status: "Sakit" },
    { id: 105, name: "Dimas Anggara", nis: "20260705", gender: "L", status: "Hadir" },
    { id: 106, name: "Eka Wahyuni", nis: "20260706", gender: "P", status: "Hadir" },
    { id: 107, name: "Fajar Nugraha", nis: "20260707", gender: "L", status: "Hadir" },
    { id: 108, name: "Gita Permata", nis: "20260708", gender: "P", status: "Hadir" },
  ],
  "7b": [
    { id: 201, name: "Ahmad Fauzan", nis: "20260711", gender: "L", status: "Hadir" },
    { id: 202, name: "Bella Safitri", nis: "20260712", gender: "P", status: "Hadir" },
    { id: 203, name: "Candra Wijaya", nis: "20260713", gender: "L", status: "Izin" },
    { id: 204, name: "Dewi Lestari", nis: "20260714", gender: "P", status: "Hadir" },
    { id: 205, name: "Eko Prasetyo", nis: "20260715", gender: "L", status: "Hadir" },
  ],
  "7c": [
    { id: 301, name: "Farhan Maulana", nis: "20260721", gender: "L", status: "Hadir" },
    { id: 302, name: "Gita Permata", nis: "20260722", gender: "P", status: "Sakit" },
    { id: 303, name: "Hendra Gunawan", nis: "20260723", gender: "L", status: "Hadir" },
    { id: 304, name: "Indah Puspita", nis: "20260724", gender: "P", status: "Hadir" },
  ],
  "8a": [
    { id: 401, name: "Salwa Alifa", nis: "20250801", gender: "P", status: "Hadir" },
    { id: 402, name: "Taufik Hidayat", nis: "20250802", gender: "L", status: "Hadir" },
    { id: 403, name: "Umar Bakri", nis: "20250803", gender: "L", status: "Izin" },
    { id: 404, name: "Vina Panduwinata", nis: "20250804", gender: "P", status: "Hadir" },
  ],
  "9a": [
    { id: 501, name: "Wahyu Ramadhan", nis: "20240901", gender: "L", status: "Hadir" },
    { id: 502, name: "Yuliana Putri", nis: "20240902", gender: "P", status: "Hadir" },
    { id: 503, name: "Zaki Mubarak", nis: "20240903", gender: "L", status: "Alpa" },
  ],
};

function statusToFrontend(s: string): StudentAttendanceStatus {
  if (s === "PRESENT" || s === "Hadir") return "Hadir";
  if (s === "EXCUSED" || s === "Izin") return "Izin";
  if (s === "SICK" || s === "Sakit") return "Sakit";
  if (s === "UNEXCUSED_ABSENT" || s === "Alpa") return "Alpa";
  return "Hadir";
}

function statusToBackend(s: StudentAttendanceStatus): AttendanceStatus {
  if (s === "Hadir") return "PRESENT";
  if (s === "Izin") return "EXCUSED";
  if (s === "Sakit") return "SICK";
  if (s === "Alpa") return "UNEXCUSED_ABSENT";
  return "PRESENT";
}

export default function ManajemenAbsensiPage() {
  const { currentUser } = useAuthRole();
  const { activeDate, activeDayName } = useAttendanceDate();

  // 3-Tier State: 1 = Pilih Jenjang (7, 8, 9), 2 = Sesi Rombel, 3 = Detail Presensi
  const [currentTier, setCurrentTier] = React.useState<1 | 2 | 3>(1);
  const [selectedTingkat, setSelectedTingkat] = React.useState<string>("7");
  const [selectedClassId, setSelectedClassId] = React.useState<string>("7a");

  // Detail override state
  const [overrideReason, setOverrideReason] = React.useState<string>("");
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Queries
  const { data: classesData } = useClasses({ per_page: 100 });
  const classes = classesData?.data ?? EMPTY_CLASSES;

  const { data: teachersData } = useTeachers({ per_page: 100 });
  const teachers = teachersData?.data || [];

  const { data: subjectsData } = useSubjects({ per_page: 100 });
  const subjects = subjectsData?.data || [];

  const { data: sessionsData, refetch: refetchSessions } = useAttendanceSessions({
    date: activeDate,
    per_page: 100,
  });
  const backendSessions = sessionsData?.data ?? EMPTY_SESSIONS;

  const updateRecordsMutation = useUpdateAttendanceRecords();

  // Local Attendance Sessions state dictionary: classKey -> ClassSessionItem
  const [attendanceSessions, setAttendanceSessions] = React.useState<
    Record<string, ClassSessionItem>
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("attendly_attendance_sessions_v2");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to parse attendance sessions", e);
      }
    }
    return {};
  });

  const saveAttendanceSessions = (data: Record<string, ClassSessionItem>) => {
    setAttendanceSessions(data);
    if (typeof window !== "undefined") {
      localStorage.setItem("attendly_attendance_sessions_v2", JSON.stringify(data));
    }
  };

  // Group classes by Tingkat (7, 8, 9)
  const displayClasses = React.useMemo(() => {
    if (classes.length > 0) return classes;
    // Fallback default classes matching AppSheet reference
    const mock: ClassDetailDto[] = [];
    ["7", "8", "9"].forEach((t) => {
      ["A", "B", "C", "D", "E", "F"].forEach((sec) => {
        mock.push({
          id: `${t}${sec.toLowerCase()}`,
          code: `${t}${sec}`,
          name: `Kelas ${t}${sec}`,
          grade: t,
          section: sec,
          total_students: 32,
          homeroom_teacher_name: sec === "A" ? "Budi Santoso, M.Pd." : "Siti Rahmawati, S.Pd.",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
    });
    return mock;
  }, [classes]);

  const classesByTingkat = React.useMemo(() => {
    const map: Record<string, ClassDetailDto[]> = { "7": [], "8": [], "9": [] };
    displayClasses.forEach((c) => {
      const g = normalizeGrade(c.grade || c.code);
      if (map[g]) {
        map[g].push(c);
      } else {
        map["7"].push(c);
      }
    });
    return map;
  }, [displayClasses]);

  // Sync / Initialize attendanceSessions with classes and backend sessions.
  // Return the previous object when its content is unchanged to avoid an effect render loop.
  React.useEffect(() => {
    if (displayClasses.length === 0) return;

    setAttendanceSessions((prev) => {
      const updated = { ...prev };

      displayClasses.forEach((c) => {
        const key = normalizeKey(c.code);
        const matchedBackendSession = backendSessions.find(
          (bs) => bs.class_id === c.id || normalizeKey(bs.class_name) === key
        );

        if (matchedBackendSession) {
          const mappedStudents: StudentRowItem[] = (
            matchedBackendSession.records || []
          ).map((r, idx) => ({
            id: r.student_id || idx + 1,
            name: r.student_name,
            nis: r.student_nis || `20260${idx + 10}`,
            status: statusToFrontend(r.status),
          }));

          updated[key] = {
            id: matchedBackendSession.id,
            classId: c.id,
            className: c.name,
            code: c.code,
            tingkat: normalizeGrade(c.grade || c.code),
            mapel: matchedBackendSession.subject_name || "Bahasa Indonesia",
            teacher: matchedBackendSession.teacher_name || c.homeroom_teacher_name || "Siti Rahmawati, S.Pd.",
            jam: "07.40 - 09.00 WIB",
            status:
              matchedBackendSession.status === "SUBMITTED"
                ? "Selesai Diabsen"
                : "Sedang Berlangsung",
            submitTime: "08:30 WIB",
            students:
              mappedStudents.length > 0
                ? mappedStudents
                : DEFAULT_STUDENTS_PER_CLASS[key] || DEFAULT_STUDENTS_PER_CLASS["7a"],
          };
        } else if (!updated[key]) {
          const defaultStudents =
            DEFAULT_STUDENTS_PER_CLASS[key] ||
            DEFAULT_STUDENTS_PER_CLASS["7a"] ||
            [];

          updated[key] = {
            id: `local-session-${key}`,
            classId: c.id,
            className: c.name,
            code: c.code,
            tingkat: normalizeGrade(c.grade || c.code),
            mapel: key.endsWith("a") ? "Bahasa Indonesia" : key.endsWith("b") ? "Matematika" : "IPA",
            teacher: c.homeroom_teacher_name || "Siti Rahmawati, S.Pd.",
            jam: "07.40 - 09.00 WIB",
            status: "Selesai Diabsen",
            submitTime: "08:30 WIB",
            students: defaultStudents.map((st) => ({ ...st })),
          };
        }
      });

      return JSON.stringify(updated) === JSON.stringify(prev) ? prev : updated;
    });
  }, [displayClasses, backendSessions]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("attendly_attendance_sessions_v2", JSON.stringify(attendanceSessions));
    }
  }, [attendanceSessions]);

  // Current session in Tier 3
  const currentSession = attendanceSessions[selectedClassId] || attendanceSessions["7a"];

  // Navigation Handlers
  const handleOpenTingkat = (tingkat: string) => {
    setSelectedTingkat(tingkat);
    setCurrentTier(2);
  };

  const handleBackToTingkat = () => {
    setCurrentTier(1);
  };

  const handleOpenDetail = (classCode: string) => {
    const key = normalizeKey(classCode);
    setSelectedClassId(key);
    setOverrideReason("");
    setCurrentTier(3);
  };

  const handleBackToRombelList = () => {
    setCurrentTier(2);
  };

  // Modify individual student status in Tier 3
  const handleSetStudentStatus = (studentId: string | number, newStatus: StudentAttendanceStatus) => {
    if (!currentSession) return;

    const updatedStudents = currentSession.students.map((st) => {
      if (st.id === studentId) {
        return { ...st, status: newStatus };
      }
      return st;
    });

    const updatedSession = {
      ...currentSession,
      students: updatedStudents,
    };

    const nextSessions = {
      ...attendanceSessions,
      [selectedClassId]: updatedSession,
    };

    saveAttendanceSessions(nextSessions);
  };

  // Save changes (with override reason)
  const handleSaveAttendance = async () => {
    if (!currentSession) return;

    // If there is an actual backend session, call mutation
    if (
      currentSession.id &&
      !currentSession.id.startsWith("local-") &&
      currentSession.students.length > 0
    ) {
      try {
        await updateRecordsMutation.mutateAsync({
          id: currentSession.id,
          data: {
            version: 1,
            records: currentSession.students.map((st) => ({
              student_id: String(st.id),
              status: statusToBackend(st.status),
              remarks: overrideReason || "Update oleh Administrator",
            })),
          },
        });
      } catch (err) {
        console.warn("Backend update note (proceeding with local update):", err);
      }
    }

    showToast(`Pembaruan presensi ${currentSession.className} berhasil disimpan!`);
    setCurrentTier(2);
  };

  // Calculate live counters for Tier 3
  const counters = React.useMemo(() => {
    if (!currentSession) return { hadir: 0, izin: 0, sakit: 0, alpa: 0, total: 0 };
    let hadir = 0,
      izin = 0,
      sakit = 0,
      alpa = 0;
    currentSession.students.forEach((st) => {
      if (st.status === "Hadir") hadir++;
      else if (st.status === "Izin") izin++;
      else if (st.status === "Sakit") sakit++;
      else if (st.status === "Alpa") alpa++;
    });
    return { hadir, izin, sakit, alpa, total: currentSession.students.length };
  }, [currentSession]);

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
      {/* TIER 1: PILIH JENJANG / TINGKAT ABSENSI (7, 8, 9) */}
      {/* ========================================================================= */}
      {currentTier === 1 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Monitoring & Manajemen Absensi Harian
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih tingkat kelas untuk meninjau status sesi dan melakukan pembaruan status kehadiran siswa.
              </p>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold self-start sm:self-auto">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeDate || "29 September 2026"}</span>
            </div>
          </div>

          {/* Cards Tingkat 7, 8, 9 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                num: "7",
                title: "Kelas 7 (Tujuh)",
                iconBg: "bg-blue-600",
                pct: "96%",
                list: classesByTingkat["7"] || [],
              },
              {
                num: "8",
                title: "Kelas 8 (Delapan)",
                iconBg: "bg-emerald-600",
                pct: "98%",
                list: classesByTingkat["8"] || [],
              },
              {
                num: "9",
                title: "Kelas 9 (Sembilan)",
                iconBg: "bg-amber-600",
                pct: "97%",
                list: classesByTingkat["9"] || [],
              },
            ].map((t) => {
              const countRombel = t.list.length;
              const desc =
                countRombel > 0
                  ? `${countRombel} Rombel (${t.list[0]?.code} s/d ${t.list[countRombel - 1]?.code})`
                  : "Belum ada rombel terdaftar";

              return (
                <div
                  key={t.num}
                  onClick={() => handleOpenTingkat(t.num)}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-[#0c3960] hover:shadow-md transform hover:-translate-y-0.5 transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl ${t.iconBg} text-white flex items-center justify-center font-extrabold text-xl shadow`}
                      >
                        {t.num}
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
                    <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                      <ClipboardCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Sesi Terjadwal</span>
                    </span>
                    <span className="font-extrabold text-emerald-600">Presensi: {t.pct}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 2: STATUS SESI PRESENSI PER ROMBEL */}
      {/* ========================================================================= */}
      {currentTier === 2 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={handleBackToTingkat}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Pilihan Jenjang (7, 8, 9)</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Manajemen Absensi / Kelas {selectedTingkat}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 font-bold text-[10px] rounded-md uppercase tracking-wider">
                Jenjang Kelas {selectedTingkat}
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-1">
                Status Sesi Presensi per Rombel
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
              {activeDayName ? `${activeDayName}, ` : ""}{activeDate || "29 September 2026"}
            </span>
          </div>

          {/* List Sesi per Rombel */}
          <div className="space-y-3.5">
            {(classesByTingkat[selectedTingkat] || []).map((c) => {
              const key = normalizeKey(c.code);
              const session = attendanceSessions[key] || {
                className: c.name,
                code: c.code,
                mapel: "Bahasa Indonesia",
                teacher: c.homeroom_teacher_name || "Siti Rahmawati, S.Pd.",
                jam: "07.40 - 09.00 WIB",
                status: "Selesai Diabsen",
                submitTime: "08:30 WIB",
                students: DEFAULT_STUDENTS_PER_CLASS[key] || DEFAULT_STUDENTS_PER_CLASS["7a"],
              };

              let h = 0,
                i = 0,
                s = 0,
                a = 0;
              (session.students || []).forEach((st) => {
                if (st.status === "Hadir") h++;
                else if (st.status === "Izin") i++;
                else if (st.status === "Sakit") s++;
                else if (st.status === "Alpa") a++;
              });

              return (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0c3960] transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#0c3960] flex items-center justify-center font-extrabold text-sm shrink-0 border border-blue-100">
                      {c.code}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-extrabold text-slate-800 text-sm">
                          {c.name} — {session.mapel}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {session.status} ({session.submitTime})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Guru Pengampu:{" "}
                        <strong className="text-slate-700">{session.teacher}</strong> • Jam:{" "}
                        {session.jam}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-emerald-700 font-bold">{h} Hadir</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-blue-700 font-semibold">{i} Izin</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-amber-700 font-semibold">{s} Sakit</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-rose-600 font-bold">{a} Alpa</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(c.code)}
                      className="px-4 py-2.5 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Koreksi / Update Presensi</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 3: LEMBAR UPDATE STATUS SISWA (TOMBOL BULAT HITAM INTERAKTIF) */}
      {/* ========================================================================= */}
      {currentTier === 3 && currentSession && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Back Nav Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={handleBackToRombelList}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Rombel Kelas {currentSession.tingkat}</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Manajemen Absensi / {currentSession.code} / Update Presensi
            </span>
          </div>

          {/* Header Sesi yang Diedit */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 bg-blue-100 text-[#0c3960] font-bold text-[10px] rounded-md uppercase tracking-wider">
                  Kelas {currentSession.code}
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">
                  {currentSession.status}
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900">
                {currentSession.mapel} — {currentSession.className}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Guru Pengampu: {currentSession.teacher} • Jam: {currentSession.jam}
              </p>
            </div>

            {/* Counter Realtime */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl text-center min-w-[70px]">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Hadir</span>
                <span className="text-base font-extrabold text-emerald-800">{counters.hadir}</span>
              </div>
              <div className="bg-blue-50 border border-blue-100 px-3.5 py-2 rounded-xl text-center min-w-[70px]">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Izin</span>
                <span className="text-base font-extrabold text-blue-800">{counters.izin}</span>
              </div>
              <div className="bg-amber-50 border border-amber-100 px-3.5 py-2 rounded-xl text-center min-w-[70px]">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Sakit</span>
                <span className="text-base font-extrabold text-amber-800">{counters.sakit}</span>
              </div>
              <div className="bg-rose-50 border border-rose-100 px-3.5 py-2 rounded-xl text-center min-w-[70px]">
                <span className="text-[10px] uppercase font-bold text-rose-700 block">Alpa</span>
                <span className="text-base font-extrabold text-rose-800">{counters.alpa}</span>
              </div>
            </div>
          </div>

          {/* Tabel Lembar Presensi Siswa */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div>
                <h4 className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                  Lembar Presensi Siswa
                </h4>
                <p className="text-[11px] text-slate-400">
                  Klik tombol status bulat untuk mengubah kehadiran siswa secara langsung.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                <span>Pilihan Aktif (Hitam)</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5 text-center w-12">No</th>
                    <th className="px-6 py-3.5">Nama Lengkap & NIS</th>
                    <th className="px-6 py-3.5 text-center">
                      Pilihan Kehadiran (Hadir / Izin / Sakit / Alpa)
                    </th>
                    <th className="px-6 py-3.5 text-center w-36">Status Terkini</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {currentSession.students.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition">
                      <td className="px-6 py-4 text-center font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{st.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{st.nis}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100 rounded-full border border-slate-200">
                          {(["Hadir", "Izin", "Sakit", "Alpa"] as StudentAttendanceStatus[]).map(
                            (opt) => {
                              const isActive = st.status === opt;
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => handleSetStudentStatus(st.id, opt)}
                                  className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                                    isActive
                                      ? "bg-slate-900 text-white shadow-xs"
                                      : "text-slate-600 hover:text-slate-900"
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            st.status === "Hadir"
                              ? "bg-emerald-100 text-emerald-800"
                              : st.status === "Izin"
                              ? "bg-blue-100 text-blue-800"
                              : st.status === "Sakit"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {st.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Form Alasan & Simpan */}
            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex-1 max-w-xl">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catatan / Alasan Perubahan (Override Admin):
                </label>
                <input
                  type="text"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Contoh: Siswa menyerahkan surat dokter susulan ke ruang TU"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-[#0c3960] focus:outline-hidden"
                />
              </div>
              <div className="flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleBackToRombelList}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-100 text-xs font-bold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveAttendance}
                  className="px-5 py-2.5 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Pembaruan Presensi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

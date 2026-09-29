"use client";

import * as React from "react";
import {
  Clock,
  Sparkles,
  Plus,
  ArrowLeft,
  ArrowRight,
  Pencil,
  Trash2,
  MapPin,
  User,
  Settings,
  X,
  Coffee,
  CalendarDays,
  Check,
  AlertCircle,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  FileCode,
  Copy,
  RefreshCw,
  Cloud,
  CloudUpload,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  useSchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useTeachingAssignments,
  useCreateTeachingAssignment,
} from "@/hooks/use-schedules";
import { useTeachers, useCreateTeacher } from "@/hooks/use-teachers";
import { useClasses, useCreateClass } from "@/hooks/use-classes";
import { useSubjects, useCreateSubject } from "@/hooks/use-subjects";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { ClassDetailDto } from "@komas/shared-types";

// Standard days of week for school schedule
const DAYS_OF_WEEK = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

// Map 1-7 numeric day to day name
const DAY_MAP_NUM_TO_NAME: Record<number, string> = {
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
  7: "Minggu",
};

const DAY_MAP_NAME_TO_NUM: Record<string, number> = {
  senin: 1,
  selasa: 2,
  rabu: 3,
  kamis: 4,
  jumat: 5,
  sabtu: 6,
  minggu: 7,
};

export interface TimeSlot {
  id: string;
  time: string;
  label: string;
  isBreak: boolean;
}

export interface ScheduleSlotItem {
  id: string | number;
  day: string;
  time: string;
  jamLabel?: string;
  subject: string;
  code: string;
  teacher: string;
  room: string;
}

// Standard time slots matching AppSheet reference
const DEFAULT_STANDARD_TIME_SLOTS: TimeSlot[] = [
  { id: "slot-1", time: "07.00 - 08.20", label: "Jam 1-2", isBreak: false },
  { id: "slot-2", time: "08.20 - 09.40", label: "Jam 3-4", isBreak: false },
  { id: "slot-3", time: "09.40 - 10.00", label: "Istirahat 1", isBreak: true },
  { id: "slot-4", time: "10.00 - 11.20", label: "Jam 5-6", isBreak: false },
  { id: "slot-5", time: "11.20 - 12.00", label: "Istirahat 2 (Dzuhur)", isBreak: true },
  { id: "slot-6", time: "12.00 - 13.20", label: "Jam 7-8", isBreak: false },
];

// Default standard roster schedule for Class 7A (exact data from reference)
const DEFAULT_7A_SCHEDULE: ScheduleSlotItem[] = [
  { id: 1, day: "Senin", time: "07.00 - 08.20", jamLabel: "Jam 1-2", subject: "Bahasa Indonesia", code: "BIN", teacher: "Siti Rahmawati, S.Pd.", room: "Ruang 7A" },
  { id: 2, day: "Senin", time: "08.20 - 09.40", jamLabel: "Jam 3-4", subject: "Matematika", code: "MTK", teacher: "Budi Santoso, M.Pd.", room: "Ruang 7A" },
  { id: 3, day: "Senin", time: "10.00 - 11.20", jamLabel: "Jam 5-6", subject: "Ilmu Pengetahuan Alam (IPA)", code: "IPA", teacher: "Rina Marlina, S.Si.", room: "Lab IPA" },
  { id: 4, day: "Senin", time: "12.00 - 13.20", jamLabel: "Jam 7-8", subject: "Pendidikan Agama Islam", code: "PAI", teacher: "Drs. H. Mulyadi", room: "Ruang 7A" },

  { id: 5, day: "Selasa", time: "07.00 - 08.20", jamLabel: "Jam 1-2", subject: "Bahasa Inggris", code: "BIG", teacher: "Ahmad Fauzi, S.Pd.", room: "Ruang 7A" },
  { id: 6, day: "Selasa", time: "08.20 - 09.40", jamLabel: "Jam 3-4", subject: "Pendidikan Jasmani (PJOK)", code: "PJOK", teacher: "Dedi Kurniawan, S.Pd.", room: "Lapangan Olahraga" },
  { id: 7, day: "Selasa", time: "10.00 - 11.20", jamLabel: "Jam 5-6", subject: "Ilmu Pengetahuan Sosial (IPS)", code: "IPS", teacher: "Agus Salim, M.Pd.", room: "Ruang 7A" },
  { id: 8, day: "Selasa", time: "12.00 - 13.20", jamLabel: "Jam 7-8", subject: "Informatika", code: "INF", teacher: "Eko Prasetyo, S.Kom.", room: "Lab Komputer" },

  { id: 9, day: "Rabu", time: "07.00 - 08.20", jamLabel: "Jam 1-2", subject: "Matematika", code: "MTK", teacher: "Budi Santoso, M.Pd.", room: "Ruang 7A" },
  { id: 10, day: "Rabu", time: "08.20 - 09.40", jamLabel: "Jam 3-4", subject: "Bahasa Indonesia", code: "BIN", teacher: "Siti Rahmawati, S.Pd.", room: "Ruang 7A" },
  { id: 11, day: "Rabu", time: "10.00 - 11.20", jamLabel: "Jam 5-6", subject: "Pendidikan Pancasila (PPKn)", code: "PPKn", teacher: "Nurul Hidayah, M.Pd.", room: "Ruang 7A" },
  { id: 12, day: "Rabu", time: "12.00 - 13.20", jamLabel: "Jam 7-8", subject: "Seni Budaya", code: "SNB", teacher: "Sri Wahyuningsih, S.Pd.", room: "Ruang Kesenian" },

  { id: 13, day: "Kamis", time: "07.00 - 08.20", jamLabel: "Jam 1-2", subject: "Ilmu Pengetahuan Alam (IPA)", code: "IPA", teacher: "Rina Marlina, S.Si.", room: "Lab IPA" },
  { id: 14, day: "Kamis", time: "08.20 - 09.40", jamLabel: "Jam 3-4", subject: "Bahasa Inggris", code: "BIG", teacher: "Ahmad Fauzi, S.Pd.", room: "Ruang 7A" },
  { id: 15, day: "Kamis", time: "10.00 - 11.20", jamLabel: "Jam 5-6", subject: "Prakarya", code: "PRA", teacher: "Ade Chandra, S.Sn.", room: "Ruang Prakarya" },
  { id: 16, day: "Kamis", time: "12.00 - 13.20", jamLabel: "Jam 7-8", subject: "Ilmu Pengetahuan Sosial (IPS)", code: "IPS", teacher: "Agus Salim, M.Pd.", room: "Ruang 7A" },

  { id: 17, day: "Jumat", time: "07.00 - 08.20", jamLabel: "Jam 1-2", subject: "Pendidikan Agama Islam", code: "PAI", teacher: "Drs. H. Mulyadi", room: "Ruang 7A" },
  { id: 18, day: "Jumat", time: "08.20 - 09.40", jamLabel: "Jam 3-4", subject: "Bahasa Indonesia", code: "BIN", teacher: "Siti Rahmawati, S.Pd.", room: "Ruang 7A" },
  { id: 19, day: "Jumat", time: "10.00 - 11.20", jamLabel: "Jam 5-6", subject: "Informatika", code: "INF", teacher: "Eko Prasetyo, S.Kom.", room: "Lab Komputer" },
];

function normalizeClassKey(str: string): string {
  if (!str) return "";
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normalizeGrade(gradeOrCode: string): string {
  if (!gradeOrCode) return "7";
  const upper = gradeOrCode.toUpperCase().trim();
  if (upper.startsWith("7") || upper.startsWith("VII")) return "7";
  if (upper.startsWith("8") || upper.startsWith("VIII")) return "8";
  if (upper.startsWith("9") || upper.startsWith("IX")) return "9";
  return "7";
}

function formatTimeDisplay(timeStr: string): string {
  if (!timeStr) return "";
  // If HH:MM:SS, turn into HH.MM
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[1]}`;
  }
  return timeStr.replace(":", ".");
}

export default function JadwalKelasPage() {
  // Navigation Tiers: 1 = Pilih Jenjang (7, 8, 9), 2 = Pilih Rombel, 3 = Detail Roster Mingguan
  const [currentTier, setCurrentTier] = React.useState<1 | 2 | 3>(1);
  const [selectedTingkat, setSelectedTingkat] = React.useState<string>("7");
  const [selectedClassId, setSelectedClassId] = React.useState<string>("");

  // Modals
  const [isSlotModalOpen, setIsSlotModalOpen] = React.useState(false);
  const [isManageTimeModalOpen, setIsManageTimeModalOpen] = React.useState(false);
  const [slotModalMode, setSlotModalMode] = React.useState<"add" | "edit">("add");
  const [editingSlotId, setEditingSlotId] = React.useState<string | number | null>(null);

  // Slot Form State
  const [slotDay, setSlotDay] = React.useState("Senin");
  const [slotTimeSelect, setSlotTimeSelect] = React.useState("07.00 - 08.20");
  const [customStartTime, setCustomStartTime] = React.useState("07:00");
  const [customEndTime, setCustomEndTime] = React.useState("08:20");
  const [slotSubject, setSlotSubject] = React.useState("");
  const [slotTeacher, setSlotTeacher] = React.useState("");
  const [slotRoom, setSlotRoom] = React.useState("");

  // Toast State
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Queries & Mutations
  const { data: academicYearsData } = useAcademicYears({ per_page: 20 });
  const activeYear = academicYearsData?.data.find((y) => y.active) || academicYearsData?.data[0];

  const { data: classesData, refetch: refetchClasses } = useClasses({ per_page: 100 });
  const classes = classesData?.data || [];
  const createClassMutation = useCreateClass();

  const { data: teachersData, refetch: refetchTeachers } = useTeachers({ per_page: 100 });
  const teachers = teachersData?.data || [];
  const createTeacherMutation = useCreateTeacher();

  const { data: subjectsData, refetch: refetchSubjects } = useSubjects({ per_page: 100 });
  const subjects = subjectsData?.data || [];
  const createSubjectMutation = useCreateSubject();

  const { data: schedulesData, refetch: refetchSchedules } = useSchedules({ per_page: 100 });
  const backendSchedules = schedulesData?.data || [];

  const createScheduleMutation = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();
  const { data: assignmentsData, refetch: refetchAssignments } = useTeachingAssignments({ per_page: 200 });
  const assignments = assignmentsData?.data || [];
  const createAssignmentMutation = useCreateTeachingAssignment();

  const [isSyncingServer, setIsSyncingServer] = React.useState(false);

  // Fallback classes if database has none
  const displayClasses = React.useMemo(() => {
    if (classes.length > 0) {
      return classes;
    }
    // Generate fallback classes matching 7A-7F, 8A-8F, 9A-9F
    const mock: ClassDetailDto[] = [];
    ["7", "8", "9"].forEach((t) => {
      ["A", "B", "C", "D", "E", "F"].forEach((sec) => {
        mock.push({
          id: `mock-${t}${sec.toLowerCase()}`,
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

  // Local storage for time slots
  const [standardTimeSlots, setStandardTimeSlots] = React.useState<TimeSlot[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("attendly_time_slots_v2");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error("Failed to parse time slots from storage", e);
      }
    }
    return DEFAULT_STANDARD_TIME_SLOTS;
  });

  const saveStandardTimeSlots = (slots: TimeSlot[]) => {
    setStandardTimeSlots(slots);
    if (typeof window !== "undefined") {
      localStorage.setItem("attendly_time_slots_v2", JSON.stringify(slots));
    }
  };

  // Local schedules dictionary by class identifier (class.id or normalized code)
  const [schedulesByClass, setSchedulesByClass] = React.useState<
    Record<string, ScheduleSlotItem[]>
  >(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("attendly_schedules_by_class_v2");
        if (saved) {
          return JSON.parse(saved);
        }
      } catch (e) {
        console.error("Failed to parse schedules from storage", e);
      }
    }
    return {
      "7a": DEFAULT_7A_SCHEDULE,
    };
  });

  const saveSchedulesByClass = (data: Record<string, ScheduleSlotItem[]>) => {
    setSchedulesByClass(data);
    if (typeof window !== "undefined") {
      localStorage.setItem("attendly_schedules_by_class_v2", JSON.stringify(data));
    }
  };

  // Sync / Merge backend schedules into schedulesByClass when backend data loads
  React.useEffect(() => {
    if (backendSchedules.length > 0) {
      setSchedulesByClass((prev) => {
        const updated = { ...prev };
        let hasChanges = false;

        // Group backend schedules by classKey
        const backendGrouped: Record<string, ScheduleSlotItem[]> = {};

        backendSchedules.forEach((bs) => {
          const matchedClass = displayClasses.find((c) => c.id === bs.class_id);
          const classKey = matchedClass ? normalizeClassKey(matchedClass.code) : bs.class_id;

          if (!backendGrouped[classKey]) {
            backendGrouped[classKey] = [];
          }

          const dayName = DAY_MAP_NUM_TO_NAME[bs.day_of_week] || "Senin";
          const startTime = formatTimeDisplay(bs.starts_at ?? "");
          const endTime = formatTimeDisplay(bs.ends_at ?? "");
          const formattedTime = (startTime && endTime)
            ? `${startTime} - ${endTime}`
            : (bs.period_no ? `Jam ke-${bs.period_no}` : "");

          const matchedSubject = subjects.find((s) => s.id === bs.subject_id);
          const matchedTeacher = teachers.find(
            (t) => t.user_id === bs.teacher_id || t.id === bs.teacher_id
          );

          backendGrouped[classKey].push({
            id: bs.id,
            day: dayName,
            time: formattedTime,
            subject: matchedSubject?.name || "Mata Pelajaran",
            code: matchedSubject?.code || (matchedSubject?.name ? matchedSubject.name.substring(0, 3).toUpperCase() : "MPL"),
            teacher: matchedTeacher?.full_name || "Guru Pengampu",
            room: matchedClass ? `Ruang ${matchedClass.code}` : "Ruang Kelas",
          });
        });

        // For classes with backend data, replace with server data
        Object.keys(backendGrouped).forEach((cKey) => {
          updated[cKey] = backendGrouped[cKey];
          hasChanges = true;
        });

        // Ensure default 7A schedule is always available if empty
        if (!updated["7a"] || updated["7a"].length === 0) {
          updated["7a"] = DEFAULT_7A_SCHEDULE;
          hasChanges = true;
        }

        if (hasChanges) {
          saveSchedulesByClass(updated);
        }
        return updated;
      });
    }
  }, [backendSchedules, displayClasses, subjects, teachers]);

  // Helper to parse time string "07.00 - 08.20" to HH:MM format
  const parseTimeRangeToHHMM = (timeRange: string): { starts_at: string; ends_at: string } => {
    const parts = timeRange.split("-").map((t) => t.trim().replace(".", ":"));
    let starts_at = parts[0] || "07:00";
    let ends_at = parts[1] || "08:20";
    if (starts_at.length === 5) starts_at = `${starts_at}:00`;
    if (ends_at.length === 5) ends_at = `${ends_at}:00`;
    return { starts_at, ends_at };
  };

  // Helper to ensure dependencies exist in database and return teaching_assignment_id
  const ensureTeachingAssignmentOnServer = async (
    targetClassObj: ClassDetailDto,
    subjectName: string,
    subjectCode: string,
    teacherName: string
  ): Promise<string | null> => {
    try {
      // 1. Ensure Active Academic Year
      const currentYearId = activeYear?.id;
      if (!currentYearId) {
        throw new Error("Tahun ajaran aktif tidak ditemukan di server");
      }

      // 2. Ensure Class exists on server
      let classId = targetClassObj.id;
      if (!classId || classId.startsWith("mock-")) {
        const existingClass = classes.find(
          (c) => c.code.toLowerCase() === targetClassObj.code.toLowerCase()
        );
        if (existingClass) {
          classId = existingClass.id;
        } else {
          const newClass = await createClassMutation.mutateAsync({
            code: targetClassObj.code,
            name: targetClassObj.name || `Kelas ${targetClassObj.code}`,
            grade: normalizeGrade(targetClassObj.grade || targetClassObj.code),
            section: targetClassObj.section || targetClassObj.code.slice(-1) || "A",
            academic_year_id: currentYearId,
          });
          classId = newClass.id;
        }
      }

      // 3. Ensure Subject exists on server
      let subjectId = "";
      const existingSub = subjects.find(
        (s) =>
          s.code.toLowerCase() === subjectCode.toLowerCase() ||
          s.name.toLowerCase() === subjectName.toLowerCase()
      );
      if (existingSub) {
        subjectId = existingSub.id;
      } else {
        const newSub = await createSubjectMutation.mutateAsync({
          code: subjectCode || subjectName.substring(0, 3).toUpperCase(),
          name: subjectName,
        });
        subjectId = newSub.id;
      }

      // 4. Ensure Teacher exists on server (requires user with role TEACHER)
      let teacherUserId = "";
      const existingTeacher = teachers.find(
        (t) =>
          t.full_name.toLowerCase() === teacherName.toLowerCase() ||
          t.full_name.toLowerCase().includes(teacherName.toLowerCase()) ||
          teacherName.toLowerCase().includes(t.full_name.toLowerCase())
      );
      if (existingTeacher) {
        teacherUserId = existingTeacher.user_id || existingTeacher.id;
      } else {
        const slug =
          teacherName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "")
            .substring(0, 15) || "guru";
        const randomNum = Math.floor(1000 + Math.random() * 9000);
        const newTeacher = await createTeacherMutation.mutateAsync({
          full_name: teacherName,
          nip: `198${Date.now().toString().slice(-10)}${randomNum}`,
          email: `${slug}_${randomNum}@smpn1tirtajaya.sch.id`,
        });
        teacherUserId = newTeacher.user_id || newTeacher.id;
      }

      // 5. Ensure Teaching Assignment exists
      const existingAssignment = assignments.find(
        (a) =>
          a.class_id === classId &&
          a.subject_id === subjectId &&
          a.teacher_id === teacherUserId &&
          a.academic_year_id === currentYearId
      );
      if (existingAssignment) {
        return existingAssignment.id;
      }

      const newAssignment = await createAssignmentMutation.mutateAsync({
        class_id: classId,
        subject_id: subjectId,
        teacher_id: teacherUserId,
        academic_year_id: currentYearId,
      });

      return newAssignment.id;
    } catch (err: any) {
      console.warn("Could not ensure server dependencies for assignment:", err);
      return null;
    }
  };

  // Active selected class object
  const selectedClass = React.useMemo(() => {
    if (!selectedClassId) return null;
    return (
      displayClasses.find(
        (c) => c.id === selectedClassId || normalizeClassKey(c.code) === selectedClassId
      ) || displayClasses[0]
    );
  }, [selectedClassId, displayClasses]);

  // Schedules for currently selected class
  const currentClassKey = selectedClass
    ? normalizeClassKey(selectedClass.code)
    : "7a";

  const currentClassSchedules = schedulesByClass[currentClassKey] || [];

  // Group classes by Tingkat (7, 8, 9)
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

  // Dynamic time slots that includes all standard slots plus any custom ones from currentClassSchedules
  const allRowSlots = React.useMemo(() => {
    const list = [...standardTimeSlots];
    currentClassSchedules.forEach((s) => {
      if (!list.some((slot) => slot.time === s.time)) {
        list.push({
          id: `custom-${s.time.replace(/[^a-zA-Z0-9]/g, "-")}`,
          time: s.time,
          label: s.jamLabel || "Jam Khusus",
          isBreak: false,
        });
      }
    });
    return list;
  }, [standardTimeSlots, currentClassSchedules]);

  // Handlers for Navigation
  const handleOpenTingkat = (tingkat: string) => {
    setSelectedTingkat(tingkat);
    setCurrentTier(2);
  };

  const handleOpenRoster = (cls: ClassDetailDto) => {
    setSelectedClassId(cls.id);
    setSelectedTingkat(normalizeGrade(cls.grade || cls.code));
    setCurrentTier(3);
  };

  const handleBackToTingkat = () => {
    setCurrentTier(1);
  };

  const handleBackToRombel = () => {
    setCurrentTier(2);
  };

  // Generate Default Jadwal for current class
  const handleGenerateDefaultJadwal = () => {
    if (!selectedClass) return;
    const classCode = selectedClass.code;

    const kbmSlots = standardTimeSlots.filter((s) => !s.isBreak);
    const slot1 = kbmSlots[0]?.time || "07.00 - 08.20";
    const slot2 = kbmSlots[1]?.time || "08.20 - 09.40";
    const slot3 = kbmSlots[2]?.time || "10.00 - 11.20";
    const slot4 = kbmSlots[3]?.time || "12.00 - 13.20";

    const defaultRoster: ScheduleSlotItem[] = [
      { id: Date.now() + 1, day: "Senin", time: slot1, subject: "Bahasa Indonesia", code: "BIN", teacher: "Siti Rahmawati, S.Pd.", room: `Ruang ${classCode}` },
      { id: Date.now() + 2, day: "Senin", time: slot2, subject: "Matematika", code: "MTK", teacher: "Budi Santoso, M.Pd.", room: `Ruang ${classCode}` },
      { id: Date.now() + 3, day: "Senin", time: slot3, subject: "Ilmu Pengetahuan Alam (IPA)", code: "IPA", teacher: "Rina Marlina, S.Si.", room: "Lab IPA" },
      { id: Date.now() + 4, day: "Senin", time: slot4, subject: "Pendidikan Agama Islam", code: "PAI", teacher: "Drs. H. Mulyadi", room: `Ruang ${classCode}` },

      { id: Date.now() + 5, day: "Selasa", time: slot1, subject: "Bahasa Inggris", code: "BIG", teacher: "Ahmad Fauzi, S.Pd.", room: `Ruang ${classCode}` },
      { id: Date.now() + 6, day: "Selasa", time: slot2, subject: "Pendidikan Jasmani (PJOK)", code: "PJOK", teacher: "Dedi Kurniawan, S.Pd.", room: "Lapangan Olahraga" },
      { id: Date.now() + 7, day: "Selasa", time: slot3, subject: "Ilmu Pengetahuan Sosial (IPS)", code: "IPS", teacher: "Agus Salim, M.Pd.", room: `Ruang ${classCode}` },
      { id: Date.now() + 8, day: "Selasa", time: slot4, subject: "Informatika", code: "INF", teacher: "Eko Prasetyo, S.Kom.", room: "Lab Komputer" },

      { id: Date.now() + 9, day: "Rabu", time: slot1, subject: "Matematika", code: "MTK", teacher: "Budi Santoso, M.Pd.", room: `Ruang ${classCode}` },
      { id: Date.now() + 10, day: "Rabu", time: slot2, subject: "Bahasa Indonesia", code: "BIN", teacher: "Siti Rahmawati, S.Pd.", room: `Ruang ${classCode}` },
      { id: Date.now() + 11, day: "Rabu", time: slot3, subject: "Pendidikan Pancasila (PPKn)", code: "PPKn", teacher: "Nurul Hidayah, M.Pd.", room: `Ruang ${classCode}` },
      { id: Date.now() + 12, day: "Rabu", time: slot4, subject: "Seni Budaya", code: "SNB", teacher: "Sri Wahyuningsih, S.Pd.", room: "Ruang Kesenian" },

      { id: Date.now() + 13, day: "Kamis", time: slot1, subject: "Ilmu Pengetahuan Alam (IPA)", code: "IPA", teacher: "Rina Marlina, S.Si.", room: "Lab IPA" },
      { id: Date.now() + 14, day: "Kamis", time: slot2, subject: "Bahasa Inggris", code: "BIG", teacher: "Ahmad Fauzi, S.Pd.", room: `Ruang ${classCode}` },
      { id: Date.now() + 15, day: "Kamis", time: slot3, subject: "Prakarya", code: "PRA", teacher: "Ade Chandra, S.Sn.", room: "Ruang Prakarya" },
      { id: Date.now() + 16, day: "Kamis", time: slot4, subject: "Ilmu Pengetahuan Sosial (IPS)", code: "IPS", teacher: "Agus Salim, M.Pd.", room: `Ruang ${classCode}` },

      { id: Date.now() + 17, day: "Jumat", time: slot1, subject: "Pendidikan Agama Islam", code: "PAI", teacher: "Drs. H. Mulyadi", room: `Ruang ${classCode}` },
      { id: Date.now() + 18, day: "Jumat", time: slot2, subject: "Bahasa Indonesia", code: "BIN", teacher: "Siti Rahmawati, S.Pd.", room: `Ruang ${classCode}` },
      { id: Date.now() + 19, day: "Jumat", time: slot3, subject: "Informatika", code: "INF", teacher: "Eko Prasetyo, S.Kom.", room: "Lab Komputer" },
    ];

    const updated = {
      ...schedulesByClass,
      [currentClassKey]: defaultRoster,
    };
    saveSchedulesByClass(updated);
    showToast(`Jadwal standar berhasil dimuat untuk ${selectedClass.name}`);
  };

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = React.useState(false);
  const [exportFormat, setExportFormat] = React.useState<"json" | "sql" | "csv">("json");
  const [exportScope, setExportScope] = React.useState<"current" | "all">("current");
  const [isExportCopied, setIsExportCopied] = React.useState(false);

  // Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [importMode, setImportMode] = React.useState<"replace" | "append">("replace");
  const [importTargetClassKey, setImportTargetClassKey] = React.useState<string>("");
  const [importPasteText, setImportPasteText] = React.useState("");
  const [importParsedItems, setImportParsedItems] = React.useState<ScheduleSlotItem[]>([]);
  const [importError, setImportError] = React.useState<string | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);

  // Export generator
  const generateExportContent = React.useCallback(() => {
    const isAll = exportScope === "all";

    if (exportFormat === "json") {
      if (isAll) {
        const allData: Record<string, { className: string; classCode: string; slots: ScheduleSlotItem[] }> = {};
        displayClasses.forEach((c) => {
          const key = normalizeClassKey(c.code);
          allData[key] = {
            className: c.name,
            classCode: c.code,
            slots: schedulesByClass[key] || [],
          };
        });
        return JSON.stringify(allData, null, 2);
      } else {
        const slots = currentClassSchedules.map((s) => ({
          hari: s.day,
          jam: s.time,
          jam_ke: s.jamLabel || "",
          mapel: s.subject,
          kode: s.code,
          guru: s.teacher,
          ruang: s.room,
          kelas: selectedClass ? selectedClass.code : "",
        }));
        return JSON.stringify(slots, null, 2);
      }
    }

    if (exportFormat === "csv") {
      const rows: string[] = ["Hari,Jam,Jam Ke,Mata Pelajaran,Kode,Guru Pengampu,Ruangan,Kelas"];
      if (isAll) {
        displayClasses.forEach((c) => {
          const key = normalizeClassKey(c.code);
          (schedulesByClass[key] || []).forEach((s) => {
            rows.push(
              `"${s.day}","${s.time}","${s.jamLabel || ""}","${s.subject}","${s.code}","${s.teacher}","${s.room}","${c.code}"`
            );
          });
        });
      } else {
        currentClassSchedules.forEach((s) => {
          rows.push(
            `"${s.day}","${s.time}","${s.jamLabel || ""}","${s.subject}","${s.code}","${s.teacher}","${s.room}","${selectedClass?.code || ""}"`
          );
        });
      }
      return rows.join("\n");
    }

    if (exportFormat === "sql") {
      const timestamp = new Date().toISOString();
      const classNameStr = selectedClass ? selectedClass.code : "SEMUA_KELAS";
      let sql = `-- ==========================================================================\n`;
      sql += `-- Attendly Database Seed / Import Script for Schedules\n`;
      sql += `-- Target: ${isAll ? "Semua Kelas" : `Kelas ${classNameStr}`}\n`;
      sql += `-- Generated: ${timestamp}\n`;
      sql += `-- ==========================================================================\n\n`;
      sql += `BEGIN;\n\n`;

      const classesToProcess = isAll ? displayClasses : selectedClass ? [selectedClass] : [];

      classesToProcess.forEach((c) => {
        const key = normalizeClassKey(c.code);
        const slots = schedulesByClass[key] || [];
        if (slots.length === 0) return;

        sql += `-- Jadwal untuk Kelas ${c.code} (${c.name})\n`;
        slots.forEach((s) => {
          const dayNum = DAY_MAP_NAME_TO_NUM[s.day.toLowerCase()] || 1;
          const timeParts = s.time.split("-").map((t) => t.trim().replace(".", ":"));
          const startsAt = timeParts[0] ? (timeParts[0].length === 5 ? `${timeParts[0]}:00` : timeParts[0]) : "07:30:00";
          const endsAt = timeParts[1] ? (timeParts[1].length === 5 ? `${timeParts[1]}:00` : timeParts[1]) : "08:50:00";

          sql += `INSERT INTO class_schedules (id, teaching_assignment_id, teacher_id, class_id, academic_year_id, day_of_week, starts_at, ends_at, effective_from, effective_until, active)\n`;
          sql += `SELECT uuid_generate_v4(), ta.id, ta.teacher_id, ta.class_id, ta.academic_year_id, ${dayNum}, '${startsAt}'::time, '${endsAt}'::time, ay.starts_on, ay.ends_on, TRUE\n`;
          sql += `FROM teaching_assignments ta\n`;
          sql += `JOIN classes c ON c.id = ta.class_id\n`;
          sql += `JOIN subjects s ON s.id = ta.subject_id\n`;
          sql += `JOIN academic_years ay ON ay.id = ta.academic_year_id AND ay.active\n`;
          sql += `WHERE c.code = '${c.code}' AND (s.code = '${s.code}' OR s.name ILIKE '%${s.subject}%')\n`;
          sql += `ON CONFLICT DO NOTHING;\n\n`;
        });
      });

      sql += `COMMIT;\n`;
      return sql;
    }

    return "";
  }, [exportFormat, exportScope, currentClassSchedules, displayClasses, schedulesByClass, selectedClass]);

  const handleDownloadExport = () => {
    const content = generateExportContent();
    const isAll = exportScope === "all";
    const baseName = isAll ? "jadwal_semua_kelas" : `jadwal_${selectedClass?.code || "kelas"}`;
    const ext = exportFormat === "json" ? "json" : exportFormat === "csv" ? "csv" : "sql";
    const mime =
      exportFormat === "json"
        ? "application/json"
        : exportFormat === "csv"
        ? "text/csv"
        : "application/sql";

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${baseName}_${new Date().toISOString().split("T")[0]}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`File ${ext.toUpperCase()} berhasil diunduh!`);
  };

  const handleCopyExport = () => {
    const content = generateExportContent();
    navigator.clipboard.writeText(content);
    setIsExportCopied(true);
    showToast("Berhasil disalin ke clipboard!");
    setTimeout(() => setIsExportCopied(false), 2000);
  };

  const handleParseImportText = (text: string) => {
    setImportPasteText(text);
    setImportError(null);

    const trimmed = text.trim();
    if (!trimmed) {
      setImportParsedItems([]);
      return;
    }

    try {
      // 1. Try parsing JSON
      if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        const parsed = JSON.parse(trimmed);
        let items: any[] = [];

        if (Array.isArray(parsed)) {
          items = parsed;
        } else if (typeof parsed === "object" && parsed !== null) {
          if (Array.isArray(parsed.slots)) {
            items = parsed.slots;
          } else if (Array.isArray(parsed.schedules)) {
            items = parsed.schedules;
          } else {
            const currentKey = importTargetClassKey || currentClassKey;
            if (Array.isArray(parsed[currentKey])) {
              items = parsed[currentKey];
            } else if (Array.isArray(parsed[currentKey.toLowerCase()])) {
              items = parsed[currentKey.toLowerCase()];
            } else {
              Object.values(parsed).forEach((val: any) => {
                if (Array.isArray(val)) {
                  items.push(...val);
                } else if (val && Array.isArray(val.slots)) {
                  items.push(...val.slots);
                }
              });
            }
          }
        }

        if (items.length === 0) {
          setImportError("JSON valid tetapi tidak menemukan daftar slot jadwal.");
          setImportParsedItems([]);
          return;
        }

        const normalized: ScheduleSlotItem[] = items.map((item: any, idx: number) => {
          const rawDay = String(item.day || item.hari || "Senin");
          const day = DAYS_OF_WEEK.find((d) => d.toLowerCase() === rawDay.toLowerCase()) || rawDay;
          const time = String(item.time || item.jam || item.waktu || "07.00 - 08.20");
          const subject = String(item.subject || item.mapel || item.mata_pelajaran || "Mata Pelajaran");
          const code = String(item.code || item.kode || item.kode_mapel || subject.substring(0, 3).toUpperCase());
          const teacher = String(item.teacher || item.guru || item.nama_guru || "Guru Pengampu");
          const room = String(item.room || item.ruang || item.ruangan || (selectedClass ? `Ruang ${selectedClass.code}` : "Ruang Kelas"));
          const jamLabel = item.jamLabel || item.jam_ke || undefined;

          return {
            id: item.id || Date.now() + idx,
            day,
            time,
            jamLabel,
            subject,
            code,
            teacher,
            room,
          };
        });

        setImportParsedItems(normalized);
        return;
      }

      // 2. Try parsing CSV
      const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length > 0) {
        const parsedCsvItems: ScheduleSlotItem[] = [];
        const isHeader = lines[0].toLowerCase().includes("hari") || lines[0].toLowerCase().includes("day") || lines[0].toLowerCase().includes("mapel");
        const dataLines = isHeader ? lines.slice(1) : lines;

        dataLines.forEach((line, idx) => {
          const rawCols = line.includes(";") ? line.split(";") : line.split(",");
          const cleanCols = rawCols.map((c) => c.trim().replace(/^"(.*)"$/, "$1").replace(/""/g, '"'));

          if (cleanCols.length >= 2) {
            const rawDay = cleanCols[0] || "Senin";
            const day = DAYS_OF_WEEK.find((d) => d.toLowerCase() === rawDay.toLowerCase()) || rawDay;
            const time = cleanCols[1] || "07.00 - 08.20";
            const jamLabel = cleanCols[2] && cleanCols[2].toLowerCase().startsWith("jam") ? cleanCols[2] : undefined;
            const subject = cleanCols[3] || cleanCols[2] || "Mata Pelajaran";
            const code = cleanCols[4] || subject.substring(0, 3).toUpperCase();
            const teacher = cleanCols[5] || "Guru Pengampu";
            const room = cleanCols[6] || (selectedClass ? `Ruang ${selectedClass.code}` : "Ruang Kelas");

            parsedCsvItems.push({
              id: Date.now() + idx,
              day,
              time,
              jamLabel,
              subject,
              code,
              teacher,
              room,
            });
          }
        });

        if (parsedCsvItems.length > 0) {
          setImportParsedItems(parsedCsvItems);
          return;
        }
      }

      setImportError("Format tidak dikenali. Gunakan format JSON atau CSV sesuai template.");
      setImportParsedItems([]);
    } catch (err: any) {
      setImportError(`Gagal membaca data: ${err.message || "Pastikan sintaks JSON/CSV benar"}`);
      setImportParsedItems([]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleParseImportText(content);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExecuteImport = async () => {
    if (importParsedItems.length === 0) return;
    setIsImporting(true);

    try {
      const targetKey = importTargetClassKey || currentClassKey;
      const targetClassObj =
        displayClasses.find(
          (c) => normalizeClassKey(c.code) === targetKey || c.id === targetKey
        ) || selectedClass;

      let targetList = importMode === "replace" ? [] : [...(schedulesByClass[targetKey] || [])];
      let serverCreatedCount = 0;

      for (const newItem of importParsedItems) {
        let finalSlotId: string | number = newItem.id;

        if (targetClassObj) {
          try {
            const assignmentId = await ensureTeachingAssignmentOnServer(
              targetClassObj,
              newItem.subject,
              newItem.code,
              newItem.teacher
            );

            if (assignmentId && activeYear) {
              const { starts_at, ends_at } = parseTimeRangeToHHMM(newItem.time);
              const dayNum = DAY_MAP_NAME_TO_NUM[newItem.day.toLowerCase()] || 1;

              const created = await createScheduleMutation.mutateAsync({
                teaching_assignment_id: assignmentId,
                day_of_week: dayNum,
                starts_at,
                ends_at,
                effective_from: activeYear.starts_on,
                effective_until: activeYear.ends_on || null,
              });

              if (created && created.id) {
                finalSlotId = created.id;
                serverCreatedCount++;
              }
            }
          } catch (serverErr) {
            console.warn("Gagal menyimpan slot ke server:", serverErr);
          }
        }

        const slotToSave: ScheduleSlotItem = {
          ...newItem,
          id: finalSlotId,
        };

        targetList = targetList.filter(
          (existing) => !(existing.day === slotToSave.day && existing.time === slotToSave.time)
        );
        targetList.push(slotToSave);
      }

      const updated = {
        ...schedulesByClass,
        [targetKey]: targetList,
      };

      saveSchedulesByClass(updated);
      refetchSchedules();
      refetchClasses();
      refetchSubjects();
      refetchTeachers();
      refetchAssignments();

      if (serverCreatedCount > 0) {
        showToast(
          `Berhasil mengimpor ${importParsedItems.length} slot (${serverCreatedCount} tersimpan ke server database)!`
        );
      } else {
        showToast(
          `Berhasil mengimpor ${importParsedItems.length} slot jadwal ke browser.`
        );
      }

      setIsImportModalOpen(false);
      setImportPasteText("");
      setImportParsedItems([]);
    } catch (err: any) {
      alert(`Terjadi kesalahan saat mengimpor: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadTemplate = (format: "json" | "csv") => {
    if (format === "json") {
      const sample = [
        {
          hari: "Senin",
          jam: "07.00 - 08.20",
          jam_ke: "Jam 1-2",
          mapel: "Bahasa Indonesia",
          kode: "BIN",
          guru: "Siti Rahmawati, S.Pd.",
          ruang: "Ruang 7A",
        },
        {
          hari: "Senin",
          jam: "08.20 - 09.40",
          jam_ke: "Jam 3-4",
          mapel: "Matematika",
          kode: "MTK",
          guru: "Budi Santoso, M.Pd.",
          ruang: "Ruang 7A",
        },
        {
          hari: "Selasa",
          jam: "07.00 - 08.20",
          jam_ke: "Jam 1-2",
          mapel: "Bahasa Inggris",
          kode: "BIG",
          guru: "Ahmad Fauzi, S.Pd.",
          ruang: "Ruang 7A",
        },
        {
          hari: "Rabu",
          jam: "10.00 - 11.20",
          jam_ke: "Jam 5-6",
          mapel: "Ilmu Pengetahuan Alam (IPA)",
          kode: "IPA",
          guru: "Rina Marlina, S.Si.",
          ruang: "Lab IPA",
        },
      ];
      const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_jadwal_sekolah.json";
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const csv = `hari,jam,jam_ke,mapel,kode,guru,ruang\nSenin,07.00 - 08.20,Jam 1-2,Bahasa Indonesia,BIN,Siti Rahmawati S.Pd.,Ruang 7A\nSenin,08.20 - 09.40,Jam 3-4,Matematika,MTK,Budi Santoso M.Pd.,Ruang 7A\nSelasa,07.00 - 08.20,Jam 1-2,Bahasa Inggris,BIG,Ahmad Fauzi S.Pd.,Ruang 7A\nRabu,10.00 - 11.20,Jam 5-6,Ilmu Pengetahuan Alam (IPA),IPA,Rina Marlina S.Si.,Lab IPA`;
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template_jadwal_sekolah.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Open Modal Slot
  const handleOpenAddSlot = (presetDay?: string, presetTime?: string) => {
    setSlotModalMode("add");
    setEditingSlotId(null);
    setSlotDay(presetDay || "Senin");
    setSlotTimeSelect(presetTime || standardTimeSlots[0]?.time || "07.00 - 08.20");

    const defaultSubject = subjects[0]?.name || "Bahasa Indonesia";
    setSlotSubject(defaultSubject);
    setSlotTeacher(teachers[0]?.full_name || "Siti Rahmawati, S.Pd.");
    setSlotRoom(selectedClass ? `Ruang ${selectedClass.code}` : "Ruang Kelas");

    setIsSlotModalOpen(true);
  };

  const handleOpenEditSlot = (slot: ScheduleSlotItem) => {
    setSlotModalMode("edit");
    setEditingSlotId(slot.id);
    setSlotDay(slot.day);

    const matchesPreset = standardTimeSlots.some((s) => s.time === slot.time);
    if (matchesPreset) {
      setSlotTimeSelect(slot.time);
    } else {
      setSlotTimeSelect("__custom__");
      const parts = slot.time.split("-").map((p) => p.trim().replace(".", ":"));
      setCustomStartTime(parts[0] || "07:00");
      setCustomEndTime(parts[1] || "08:20");
    }

    setSlotSubject(slot.subject);
    setSlotTeacher(slot.teacher);
    setSlotRoom(slot.room);

    setIsSlotModalOpen(true);
  };

  const handleDeleteSlot = async (slotId: string | number) => {
    if (!confirm("Hapus slot mata pelajaran ini dari jadwal?")) return;

    const isServerSlot =
      typeof slotId === "string" &&
      !slotId.startsWith("mock") &&
      !slotId.startsWith("slot-") &&
      slotId.length === 36;

    if (isServerSlot) {
      try {
        await deleteScheduleMutation.mutateAsync(slotId);
        showToast("Slot jadwal berhasil dihapus dari server database!");
        refetchSchedules();
      } catch (err: any) {
        console.error("Gagal menghapus slot dari server:", err);
        showToast("Gagal menghapus dari server: " + (err.message || "Terjadi kesalahan"));
      }
    } else {
      showToast("Slot jadwal lokal berhasil dihapus");
    }

    const filtered = currentClassSchedules.filter((s) => s.id !== slotId);
    const updated = {
      ...schedulesByClass,
      [currentClassKey]: filtered,
    };
    saveSchedulesByClass(updated);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalTime = slotTimeSelect;
    if (slotTimeSelect === "__custom__") {
      if (!customStartTime || !customEndTime) {
        alert("Silakan lengkapi jam mulai dan selesai");
        return;
      }
      finalTime = `${customStartTime.replace(":", ".")} - ${customEndTime.replace(":", ".")}`;
    }

    const { starts_at, ends_at } = parseTimeRangeToHHMM(finalTime);
    const dayNum = DAY_MAP_NAME_TO_NUM[slotDay.toLowerCase()] || 1;

    const matchedSub = subjects.find((s) => s.name === slotSubject);
    const subCode = matchedSub ? matchedSub.code : slotSubject.substring(0, 3).toUpperCase();

    let savedId: string | number = Date.now();
    let savedOnServer = false;

    if (slotModalMode === "edit" && editingSlotId) {
      savedId = editingSlotId;
      const isServerSlot =
        typeof editingSlotId === "string" &&
        !editingSlotId.startsWith("mock") &&
        !editingSlotId.startsWith("slot-") &&
        editingSlotId.length === 36;

      if (isServerSlot) {
        try {
          await updateScheduleMutation.mutateAsync({
            id: String(editingSlotId),
            data: {
              day_of_week: dayNum,
              starts_at,
              ends_at,
            },
          });
          savedOnServer = true;
          refetchSchedules();
        } catch (err: any) {
          console.warn("Gagal update jadwal di server:", err);
        }
      }
    } else {
      // Adding new slot: try saving to server if selectedClass exists
      if (selectedClass) {
        try {
          const assignmentId = await ensureTeachingAssignmentOnServer(
            selectedClass,
            slotSubject,
            subCode,
            slotTeacher
          );

          if (assignmentId && activeYear) {
            const created = await createScheduleMutation.mutateAsync({
              teaching_assignment_id: assignmentId,
              day_of_week: dayNum,
              starts_at,
              ends_at,
              effective_from: activeYear.starts_on,
              effective_until: activeYear.ends_on || null,
            });
            if (created && created.id) {
              savedId = created.id;
              savedOnServer = true;
              refetchSchedules();
            }
          }
        } catch (err: any) {
          console.warn("Gagal membuat jadwal di server:", err);
        }
      }
    }

    let updatedList = [...currentClassSchedules];

    if (slotModalMode === "edit" && editingSlotId) {
      updatedList = updatedList.map((s) => {
        if (s.id === editingSlotId) {
          return {
            ...s,
            day: slotDay,
            time: finalTime,
            subject: slotSubject,
            code: subCode,
            teacher: slotTeacher,
            room: slotRoom || (selectedClass ? `Ruang ${selectedClass.code}` : "Ruang Kelas"),
          };
        }
        return s;
      });
      showToast(
        savedOnServer
          ? "Slot jadwal berhasil diperbarui di server database!"
          : "Slot jadwal berhasil diperbarui (tersimpan di lokal)"
      );
    } else {
      // Add new
      // Remove conflict if any on same day and time
      updatedList = updatedList.filter(
        (s) => !(s.day === slotDay && s.time === finalTime)
      );

      updatedList.push({
        id: savedId,
        day: slotDay,
        time: finalTime,
        subject: slotSubject,
        code: subCode,
        teacher: slotTeacher,
        room: slotRoom || (selectedClass ? `Ruang ${selectedClass.code}` : "Ruang Kelas"),
      });
      showToast(
        savedOnServer
          ? `Slot ${slotSubject} hari ${slotDay} tersimpan ke server database!`
          : `Slot ${slotSubject} hari ${slotDay} tersimpan di browser`
      );
    }

    const updated = {
      ...schedulesByClass,
      [currentClassKey]: updatedList,
    };
    saveSchedulesByClass(updated);
    setIsSlotModalOpen(false);
  };

  const handleSyncClassToServer = async () => {
    if (!selectedClass) return;
    const slots = currentClassSchedules;
    if (slots.length === 0) {
      alert("Tidak ada slot jadwal untuk disinkronkan.");
      return;
    }

    if (!confirm(`Sinkronkan seluruh ${slots.length} slot jadwal ${selectedClass.name} ke server database PostgreSQL?`)) {
      return;
    }

    setIsSyncingServer(true);
    let successCount = 0;

    try {
      const updatedList: ScheduleSlotItem[] = [];

      for (const slot of slots) {
        let slotId = slot.id;
        const isAlreadyServerSlot =
          typeof slot.id === "string" &&
          !slot.id.startsWith("mock") &&
          !slot.id.startsWith("slot-") &&
          slot.id.length === 36;

        if (isAlreadyServerSlot) {
          updatedList.push(slot);
          successCount++;
          continue;
        }

        try {
          const assignmentId = await ensureTeachingAssignmentOnServer(
            selectedClass,
            slot.subject,
            slot.code,
            slot.teacher
          );

          if (assignmentId && activeYear) {
            const { starts_at, ends_at } = parseTimeRangeToHHMM(slot.time);
            const dayNum = DAY_MAP_NAME_TO_NUM[slot.day.toLowerCase()] || 1;

            const created = await createScheduleMutation.mutateAsync({
              teaching_assignment_id: assignmentId,
              day_of_week: dayNum,
              starts_at,
              ends_at,
              effective_from: activeYear.starts_on,
              effective_until: activeYear.ends_on || null,
            });

            if (created && created.id) {
              slotId = created.id;
              successCount++;
            }
          }
        } catch (slotErr) {
          console.warn("Gagal sinkronkan slot:", slotErr);
        }

        updatedList.push({
          ...slot,
          id: slotId,
        });
      }

      const updated = {
        ...schedulesByClass,
        [currentClassKey]: updatedList,
      };
      saveSchedulesByClass(updated);
      refetchSchedules();
      refetchClasses();
      refetchSubjects();
      refetchTeachers();
      refetchAssignments();

      if (successCount > 0) {
        showToast(`Berhasil menyinkronkan ${successCount} slot ke database server!`);
      } else {
        showToast("Gagal menyinkronkan ke server. Pastikan backend aktif.");
      }
    } catch (err: any) {
      alert(`Gagal sinkronisasi: ${err.message}`);
    } finally {
      setIsSyncingServer(false);
    }
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
      {/* TIER 1: PILIH JENJANG / TINGKAT JADWAL (7, 8, 9) */}
      {/* ========================================================================= */}
      {currentTier === 1 && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pilih Jenjang / Tingkat Jadwal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pilih tingkat 7, 8, atau 9 untuk melihat dan mengelola jadwal pelajaran roster mingguan (Senin s/d Jumat).
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setExportScope("all");
                  setIsExportModalOpen(true);
                }}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
                title="Ekspor seluruh jadwal sekolah ke format JSON, SQL, atau CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Ekspor Semua Jadwal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImportPasteText("");
                  setImportParsedItems([]);
                  setImportError(null);
                  setImportTargetClassKey(displayClasses[0] ? normalizeClassKey(displayClasses[0].code) : "7a");
                  setIsImportModalOpen(true);
                }}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
                title="Impor jadwal pelajaran dari file JSON atau CSV"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-700" />
                <span>Impor Jadwal</span>
              </button>

              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2.5 rounded-xl">
                {activeYear ? `Tahun Ajaran ${activeYear.name}` : "Tahun Ajaran 2026/2027"}
              </span>
            </div>
          </div>

          {/* Cards Tingkat 7, 8, 9 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                tingkat: "7",
                title: "Tingkat 7 (Fase D)",
                desc:
                  classesByTingkat["7"].length > 0
                    ? `Kelas ${classesByTingkat["7"][0]?.code} s/d ${classesByTingkat["7"][classesByTingkat["7"].length - 1]?.code} • Roster Kurikulum Merdeka`
                    : "Belum ada rombel kelas",
                totalRombel: classesByTingkat["7"].length,
                jamPekan: "40 Jam / Pekan",
              },
              {
                tingkat: "8",
                title: "Tingkat 8 (Fase D)",
                desc:
                  classesByTingkat["8"].length > 0
                    ? `Kelas ${classesByTingkat["8"][0]?.code} s/d ${classesByTingkat["8"][classesByTingkat["8"].length - 1]?.code} • Alokasi Jam Wajib & Mulok`
                    : "Belum ada rombel kelas",
                totalRombel: classesByTingkat["8"].length,
                jamPekan: "40 Jam / Pekan",
              },
              {
                tingkat: "9",
                title: "Tingkat 9 (Fase D)",
                desc:
                  classesByTingkat["9"].length > 0
                    ? `Kelas ${classesByTingkat["9"][0]?.code} s/d ${classesByTingkat["9"][classesByTingkat["9"].length - 1]?.code} • Pemantapan Ujian & Pembagian Jam`
                    : "Belum ada rombel kelas",
                totalRombel: classesByTingkat["9"].length,
                jamPekan: "40 Jam / Pekan",
              },
            ].map((t) => (
              <div
                key={t.tingkat}
                onClick={() => handleOpenTingkat(t.tingkat)}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0c3960] hover:shadow-md transform hover:-translate-y-0.5 transition cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-12 h-12 rounded-xl bg-blue-50 text-[#0c3960] group-hover:bg-[#0c3960] group-hover:text-white transition flex items-center justify-center font-extrabold text-lg">
                      {t.tingkat}
                    </span>
                    <span className="text-xs font-bold text-slate-400">{t.jamPekan}</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-[#0c3960] transition">
                    {t.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">
                    {t.totalRombel} Rombel Terdaftar
                  </span>
                  <span className="text-xs font-bold text-blue-700 group-hover:underline flex items-center gap-1">
                    <span>Pilih Rombel</span> <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 2: PILIHAN ROMBEL KELAS (MISAL KELAS TINGKAT 7) */}
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
              Jadwal Pelajaran / Tingkat {selectedTingkat}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {(classesByTingkat[selectedTingkat] || []).map((cls) => {
              const classKey = normalizeClassKey(cls.code);
              const countSlots = (schedulesByClass[classKey] || []).length;

              return (
                <div
                  key={cls.id}
                  onClick={() => handleOpenRoster(cls)}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-[#0c3960] hover:shadow-md transform hover:-translate-y-0.5 transition cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-[#0c3960] group-hover:bg-[#0c3960] group-hover:text-white transition font-black text-xs rounded-lg">
                        {cls.code}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">Senin - Jumat</span>
                    </div>
                    <h4 className="font-bold text-slate-800 text-sm group-hover:text-[#0c3960] transition">
                      {cls.name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Wali Kelas: {cls.homeroom_teacher_name || "Belum Ditentukan"}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-emerald-600 font-bold">
                      {countSlots > 0 ? `${countSlots} Slot Jam Terisi` : "Belum Ada Jadwal"}
                    </span>
                    <span className="text-xs font-bold text-blue-700 group-hover:underline flex items-center gap-1">
                      <span>Buka Roster</span> <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TIER 3: ROSTER SENIN - JUMAT UNTUK ROMBEL TERPILIH */}
      {/* ========================================================================= */}
      {currentTier === 3 && selectedClass && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Back Nav Bar */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={handleBackToRombel}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Rombel Tingkat {selectedTingkat}</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Jadwal Pelajaran / Tingkat {selectedTingkat} / {selectedClass.name}
            </span>
          </div>

          {/* Header Rombel Jadwal */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-[#0c3960] text-xs font-black tracking-wider">
                  {selectedClass.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  Kurikulum Merdeka Fase D
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-1">
                Jadwal Pelajaran — {selectedClass.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Wali Kelas: {selectedClass.homeroom_teacher_name || "Belum Ditentukan"} • 5 Hari Belajar (Senin s/d Jumat)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setExportScope("current");
                  setIsExportModalOpen(true);
                }}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
                title="Ekspor jadwal kelas ini ke format JSON, SQL, atau CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Ekspor Jadwal</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImportPasteText("");
                  setImportParsedItems([]);
                  setImportError(null);
                  setImportTargetClassKey(currentClassKey);
                  setIsImportModalOpen(true);
                }}
                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
                title="Impor jadwal kelas ini dari file JSON atau CSV"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-700" />
                <span>Impor Jadwal</span>
              </button>

              <button
                type="button"
                onClick={handleSyncClassToServer}
                disabled={isSyncingServer}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
                title="Simpan & sinkronkan seluruh jadwal kelas ini ke database server PostgreSQL agar tersinkron di semua device"
              >
                {isSyncingServer ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-700" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5 text-indigo-700" />
                )}
                <span>{isSyncingServer ? "Menyinkronkan..." : "Simpan ke Database Server"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsManageTimeModalOpen(true)}
                className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
                title="Sesuaikan daftar jam & waktu pelajaran sekolah"
              >
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Atur Jam Pelajaran</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateDefaultJadwal}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs"
                title="Muat jadwal default otomatis jika jadwal kosong"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Jadwal Standar</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddSlot()}
                className="bg-[#0c3960] hover:bg-[#092b49] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Slot Jadwal</span>
              </button>
            </div>
          </div>

          {/* Tabel Roster Mingguan (Senin - Jumat) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px]">
                  <tr>
                    <th className="px-3 py-3.5 text-center w-36 border-r border-slate-200 bg-slate-100/70">
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Waktu / Jam</span>
                        <button
                          type="button"
                          onClick={() => setIsManageTimeModalOpen(true)}
                          className="text-slate-400 hover:text-[#0c3960] transition cursor-pointer p-0.5"
                          title="Ubah Waktu & Jam Pelajaran Sekolah"
                        >
                          <Settings className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-center border-r border-slate-200 min-w-[155px]">
                      Senin
                    </th>
                    <th className="px-4 py-3.5 text-center border-r border-slate-200 min-w-[155px]">
                      Selasa
                    </th>
                    <th className="px-4 py-3.5 text-center border-r border-slate-200 min-w-[155px]">
                      Rabu
                    </th>
                    <th className="px-4 py-3.5 text-center border-r border-slate-200 min-w-[155px]">
                      Kamis
                    </th>
                    <th className="px-4 py-3.5 text-center min-w-[155px]">
                      Jumat
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {allRowSlots.map((slot) => {
                    if (slot.isBreak) {
                      return (
                        <tr
                          key={slot.id}
                          className="bg-amber-50/60 font-semibold text-amber-900 border-y border-amber-200 group/timeslot"
                        >
                          <td className="px-3 py-2.5 text-center font-bold border-r border-slate-200 bg-amber-100/50 relative">
                            <div className="text-amber-900 text-xs">{slot.label}</div>
                            <div className="text-[10px] text-amber-700 font-normal font-mono">
                              {slot.time}
                            </div>
                          </td>
                          <td
                            colSpan={5}
                            className="px-4 py-2.5 text-center text-xs tracking-wider uppercase text-amber-800 font-bold"
                          >
                            <span className="inline-flex items-center justify-center gap-1.5">
                              <Coffee className="w-3.5 h-3.5 text-amber-600" />
                              <span>
                                {slot.label} — WAKTU REHAT SISWA & GURU ({slot.time})
                              </span>
                            </span>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={slot.id} className="hover:bg-slate-50/50 transition group/timeslot">
                        {/* Slot Time Column */}
                        <td className="px-3 py-3 text-center border-r border-slate-200 bg-slate-50 font-bold text-slate-700 relative">
                          <div className="text-xs text-[#0c3960]">{slot.label}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            {slot.time}
                          </div>
                        </td>

                        {/* Days Columns */}
                        {DAYS_OF_WEEK.map((day) => {
                          const matchedSlot = currentClassSchedules.find(
                            (s) => s.day === day && s.time === slot.time
                          );

                          if (matchedSlot) {
                            return (
                              <td
                                key={`${slot.id}-${day}`}
                                className="px-3.5 py-3 border-r border-slate-200 align-top"
                              >
                                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-2.5 shadow-2xs hover:border-[#0c3960] hover:shadow-xs transition group">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="px-1.5 py-0.5 rounded bg-blue-100 text-[#0c3960] font-black text-[9px]">
                                        {matchedSlot.code}
                                      </span>
                                      {typeof matchedSlot.id === "string" && matchedSlot.id.length === 36 && (
                                        <span
                                          className="inline-flex items-center text-emerald-600"
                                          title="Tersimpan di Database Server PostgreSQL (Tersinkron antar device)"
                                        >
                                          <CheckCircle2 className="w-3 h-3" />
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                      <button
                                        type="button"
                                        onClick={() => handleOpenEditSlot(matchedSlot)}
                                        className="text-slate-400 hover:text-blue-700 transition p-0.5 cursor-pointer"
                                        title="Ubah Slot"
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSlot(matchedSlot.id)}
                                        className="text-slate-400 hover:text-rose-600 transition p-0.5 cursor-pointer"
                                        title="Hapus Slot"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                  <div
                                    className="font-bold text-slate-900 text-xs leading-snug cursor-pointer hover:text-blue-800 transition"
                                    onClick={() => handleOpenEditSlot(matchedSlot)}
                                    title="Klik untuk edit slot ini"
                                  >
                                    {matchedSlot.subject}
                                  </div>
                                  <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-1">
                                    <User className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                    <span className="truncate">{matchedSlot.teacher}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between font-mono">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5 shrink-0" />
                                      <span>{matchedSlot.room || "Ruang Kelas"}</span>
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-sans">
                                      {matchedSlot.time}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            );
                          }

                          return (
                            <td
                              key={`${slot.id}-${day}`}
                              className="px-3.5 py-3 border-r border-slate-200 text-center align-middle"
                            >
                              <button
                                type="button"
                                onClick={() => handleOpenAddSlot(day, slot.time)}
                                className="w-full py-3.5 rounded-xl border border-dashed border-slate-200 hover:border-[#0c3960] hover:bg-blue-50/30 text-slate-300 hover:text-[#0c3960] transition cursor-pointer text-[11px] flex flex-col items-center justify-center gap-1"
                                title="Tambah Mata Pelajaran di Jam Ini"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-semibold">Kosong</span>
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH / EDIT SLOT JADWAL */}
      {/* ========================================================================= */}
      {isSlotModalOpen && selectedClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {slotModalMode === "edit"
                  ? `Edit Slot Jadwal (${selectedClass.code}) — ${slotDay}`
                  : `Tambah Slot Jadwal (${selectedClass.code})`}
              </h3>
              <button
                type="button"
                onClick={() => setIsSlotModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSlot} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hari Pelajaran</label>
                  <select
                    value={slotDay}
                    onChange={(e) => setSlotDay(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700">Slot Waktu / Jam</label>
                    <button
                      type="button"
                      onClick={() => setIsManageTimeModalOpen(true)}
                      className="text-[10px] text-blue-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Settings className="w-2.5 h-2.5" /> Atur
                    </button>
                  </div>
                  <select
                    value={slotTimeSelect}
                    onChange={(e) => setSlotTimeSelect(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                  >
                    {standardTimeSlots.map((s) => (
                      <option key={s.id} value={s.time}>
                        {s.label} ({s.time}) {s.isBreak ? "[Istirahat]" : ""}
                      </option>
                    ))}
                    <option value="__custom__">⚙️ Waktu Kustom Lainnya...</option>
                  </select>
                </div>
              </div>

              {/* Custom Time Container */}
              {slotTimeSelect === "__custom__" && (
                <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-semibold text-slate-800 text-[11px]">
                      Kustom Jam Pelajaran Sendiri
                    </label>
                    <span className="text-[10px] text-blue-700 font-medium">Bebas diatur</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Waktu Mulai:</span>
                      <input
                        type="time"
                        value={customStartTime}
                        onChange={(e) => setCustomStartTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Waktu Selesai:</span>
                      <input
                        type="time"
                        value={customEndTime}
                        onChange={(e) => setCustomEndTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Mata Pelajaran
                </label>
                <select
                  value={slotSubject}
                  onChange={(e) => setSlotSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                >
                  {subjects.length > 0 ? (
                    subjects.map((sub) => (
                      <option key={sub.id} value={sub.name}>
                        {sub.name} ({sub.code})
                      </option>
                    ))
                  ) : (
                    [
                      "Bahasa Indonesia",
                      "Matematika",
                      "Ilmu Pengetahuan Alam (IPA)",
                      "Bahasa Inggris",
                      "Pendidikan Agama Islam",
                      "Pendidikan Jasmani (PJOK)",
                      "Ilmu Pengetahuan Sosial (IPS)",
                      "Informatika",
                      "Pendidikan Pancasila (PPKn)",
                      "Seni Budaya",
                      "Prakarya",
                    ].map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guru Pengampu</label>
                <select
                  value={slotTeacher}
                  onChange={(e) => setSlotTeacher(e.target.value)}
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
                      "Siti Rahmawati, S.Pd.",
                      "Budi Santoso, M.Pd.",
                      "Rina Marlina, S.Si.",
                      "Ahmad Fauzi, S.Pd.",
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ruangan / Tempat</label>
                <input
                  type="text"
                  value={slotRoom}
                  onChange={(e) => setSlotRoom(e.target.value)}
                  placeholder={`Contoh: Ruang ${selectedClass.code} / Lab IPA / Lapangan`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSlotModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl font-bold cursor-pointer shadow-xs"
                >
                  {slotModalMode === "edit" ? "Perbarui Jadwal" : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ATUR JAM PELAJARAN SEKOLAH */}
      {/* ========================================================================= */}
      {isManageTimeModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center text-sm font-bold">
                  <Clock className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Atur Jam & Waktu Pelajaran Sekolah
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Sesuaikan struktur jam ke-X dan jam istirahat untuk seluruh rombel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageTimeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-600">
                  Daftar Slot Jam Aktif ({standardTimeSlots.length} Slot)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const newSlot: TimeSlot = {
                      id: `slot-${Date.now()}`,
                      label: `Jam Baru`,
                      time: `13.30 - 14.50`,
                      isBreak: false,
                    };
                    saveStandardTimeSlots([...standardTimeSlots, newSlot]);
                  }}
                  className="px-2.5 py-1 bg-[#0c3960] text-white rounded-lg text-[10px] font-bold hover:bg-[#092b49] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Tambah Jam
                </button>
              </div>

              <div className="space-y-2">
                {standardTimeSlots.map((slot, idx) => (
                  <div
                    key={slot.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                      slot.isBreak
                        ? "bg-amber-50/70 border-amber-200"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={slot.label}
                        onChange={(e) => {
                          const updated = [...standardTimeSlots];
                          updated[idx].label = e.target.value;
                          saveStandardTimeSlots(updated);
                        }}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-hidden"
                        placeholder="Label Slot"
                      />
                      <input
                        type="text"
                        value={slot.time}
                        onChange={(e) => {
                          const updated = [...standardTimeSlots];
                          updated[idx].time = e.target.value;
                          saveStandardTimeSlots(updated);
                        }}
                        className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs font-mono focus:outline-hidden"
                        placeholder="07.00 - 08.20"
                      />
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={slot.isBreak}
                          onChange={(e) => {
                            const updated = [...standardTimeSlots];
                            updated[idx].isBreak = e.target.checked;
                            saveStandardTimeSlots(updated);
                          }}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                        <span>Waktu Istirahat</span>
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const updated = standardTimeSlots.filter((s) => s.id !== slot.id);
                        saveStandardTimeSlots(updated);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition"
                      title="Hapus Jam Ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (confirm("Reset ke daftar jam standar sekolah (default)?")) {
                    saveStandardTimeSlots(DEFAULT_STANDARD_TIME_SLOTS);
                  }
                }}
                className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold underline cursor-pointer"
              >
                Reset ke Default
              </button>
              <button
                type="button"
                onClick={() => setIsManageTimeModalOpen(false)}
                className="px-4 py-2 bg-[#0c3960] text-white rounded-xl font-bold cursor-pointer hover:bg-[#092b49]"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EKSPOR JADWAL */}
      {/* ========================================================================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0c3960] flex items-center justify-center">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ekspor Jadwal Pelajaran</h3>
                  <p className="text-[11px] text-slate-500">
                    Unduh data jadwal ke format JSON, SQL, atau CSV untuk backup atau database
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Scope & Format Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cakupan Data</label>
                  <select
                    value={exportScope}
                    onChange={(e) => setExportScope(e.target.value as "current" | "all")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden bg-slate-50 font-medium"
                  >
                    {selectedClass && (
                      <option value="current">
                        Hanya Kelas {selectedClass.code} ({currentClassSchedules.length} slot)
                      </option>
                    )}
                    <option value="all">Semua Rombel Kelas ({displayClasses.length} Kelas)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Format File Ekspor</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setExportFormat("json")}
                      className={`px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        exportFormat === "json"
                          ? "bg-blue-50 border-[#0c3960] text-[#0c3960]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <FileJson className="w-3.5 h-3.5" />
                      <span>JSON</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat("sql")}
                      className={`px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        exportFormat === "sql"
                          ? "bg-blue-50 border-[#0c3960] text-[#0c3960]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>SQL</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportFormat("csv")}
                      className={`px-3 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition cursor-pointer ${
                        exportFormat === "csv"
                          ? "bg-blue-50 border-[#0c3960] text-[#0c3960]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>CSV</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Code Preview Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">Pratinjau Data Ekspor</label>
                  <button
                    type="button"
                    onClick={handleCopyExport}
                    className="inline-flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-900 font-bold cursor-pointer"
                  >
                    {isExportCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Disalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin ke Clipboard</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  value={generateExportContent()}
                  className="w-full p-3 font-mono text-[11px] bg-slate-900 text-emerald-400 rounded-xl border border-slate-700 focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Tutup
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadExport}
                  className="px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File {exportFormat.toUpperCase()}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: IMPOR JADWAL */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Impor Jadwal Pelajaran</h3>
                  <p className="text-[11px] text-slate-500">
                    Masukkan data dari file JSON atau CSV untuk mengisi jadwal secara otomatis
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Target Class & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Target Kelas</label>
                  <select
                    value={importTargetClassKey || currentClassKey}
                    onChange={(e) => setImportTargetClassKey(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden bg-slate-50 font-medium"
                  >
                    {displayClasses.map((c) => (
                      <option key={c.id} value={normalizeClassKey(c.code)}>
                        Kelas {c.code} — {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Metode Pengisian</label>
                  <select
                    value={importMode}
                    onChange={(e) => setImportMode(e.target.value as "replace" | "append")}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden bg-slate-50 font-medium"
                  >
                    <option value="replace">Timpa Seluruh Jadwal Kelas Ini</option>
                    <option value="append">Gabungkan / Tambahkan ke Jadwal yang Ada</option>
                  </select>
                </div>
              </div>

              {/* Upload File and Sample Templates */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-semibold text-slate-700">Pilih File Jadwal (.json / .csv):</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate("json")}
                      className="text-[11px] text-blue-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Template JSON
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadTemplate("csv")}
                      className="text-[11px] text-blue-700 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Template CSV
                    </button>
                  </div>
                </div>

                <input
                  type="file"
                  accept=".json,.csv,.txt"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#0c3960] file:text-white hover:file:bg-[#092b49] cursor-pointer"
                />
              </div>

              {/* Paste Raw Textarea */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Atau Tempel (Paste) Raw JSON / CSV di Bawah:
                </label>
                <textarea
                  rows={4}
                  value={importPasteText}
                  onChange={(e) => handleParseImportText(e.target.value)}
                  placeholder={`Contoh JSON:\n[\n  { "hari": "Senin", "jam": "07.00 - 08.20", "mapel": "Matematika", "guru": "Budi Santoso, M.Pd." }\n]`}
                  className="w-full p-3 font-mono text-[11px] bg-white text-slate-800 rounded-xl border border-slate-300 focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                />
              </div>

              {/* Error Alert */}
              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Live Preview Table */}
              {importParsedItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Pratinjau Hasil Impor ({importParsedItems.length} Slot Terdeteksi)
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      Siap Dimasukkan
                    </span>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="px-3 py-2 w-10 text-center">No</th>
                          <th className="px-3 py-2">Hari</th>
                          <th className="px-3 py-2">Jam</th>
                          <th className="px-3 py-2">Mata Pelajaran</th>
                          <th className="px-3 py-2">Guru Pengampu</th>
                          <th className="px-3 py-2">Ruang</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {importParsedItems.map((slot, i) => (
                          <tr key={i} className="hover:bg-slate-50/80">
                            <td className="px-3 py-1.5 text-center text-slate-400 font-bold">{i + 1}</td>
                            <td className="px-3 py-1.5 font-bold text-blue-900">{slot.day}</td>
                            <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">{slot.time}</td>
                            <td className="px-3 py-1.5 font-semibold text-slate-900">
                              {slot.subject} <span className="text-[10px] text-slate-400 font-mono">({slot.code})</span>
                            </td>
                            <td className="px-3 py-1.5 text-slate-600">{slot.teacher}</td>
                            <td className="px-3 py-1.5 text-slate-500">{slot.room}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={isImporting || importParsedItems.length === 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-xs transition disabled:opacity-50"
              >
                {isImporting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Terapkan & Simpan ({importParsedItems.length} Slot)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import {
  Clock,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Shapes,
  Plus,
  PenSquare,
  Trash2,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import {
  useSchedules,
  useTodaySchedules,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useTeachingAssignments,
  useCreateTeachingAssignment,
  useUpdateTeachingAssignment,
  useDeleteTeachingAssignment,
} from "@/hooks/use-schedules";
import { useTeachers } from "@/hooks/use-teachers";
import { useClasses } from "@/hooks/use-classes";
import { useSubjects } from "@/hooks/use-subjects";
import { useAcademicYears } from "@/hooks/use-academic-years";
import {
  ScheduleItemDto,
  TeachingAssignmentRecordDto,
  TeacherRecordDto,
  ClassDetailDto,
  SubjectRecordDto,
  AcademicYearRecordDto,
} from "@komas/shared-types";
import { ApiError } from "@/lib/api-client";

const DAYS_OF_WEEK = [
  { value: 1, label: "Senin", short: "Sen" },
  { value: 2, label: "Selasa", short: "Sel" },
  { value: 3, label: "Rabu", short: "Rab" },
  { value: 4, label: "Kamis", short: "Kam" },
  { value: 5, label: "Jumat", short: "Jum" },
  { value: 6, label: "Sabtu", short: "Sab" },
  { value: 7, label: "Minggu", short: "Min" },
];

export default function JadwalPage() {
  // Tabs: 'schedules' | 'assignments' | 'today'
  const [activeTab, setActiveTab] = React.useState<
    "schedules" | "assignments" | "today"
  >("schedules");

  // Global Filter State
  const [selectedAcademicYearId, setSelectedAcademicYearId] =
    React.useState<string>("ALL");
  const [selectedTeacherId, setSelectedTeacherId] =
    React.useState<string>("ALL");
  const [selectedClassId, setSelectedClassId] = React.useState<string>("ALL");
  const [selectedSubjectId, setSelectedSubjectId] =
    React.useState<string>("ALL");
  const [selectedDayOfWeek, setSelectedDayOfWeek] = React.useState<number>(0); // 0 = all
  const [scheduleStatusFilter, setScheduleStatusFilter] = React.useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");

  // Pagination
  const [schedulePage, setSchedulePage] = React.useState(1);
  const [assignmentPage, setAssignmentPage] = React.useState(1);
  const [todayPage, setTodayPage] = React.useState(1);
  const perPage = 20;

  // Options / Lookups
  const { data: teachersData } = useTeachers({ per_page: 100 });
  const teachers = teachersData?.data || [];

  const { data: classesData } = useClasses({ per_page: 100 });
  const classes = classesData?.data || [];

  const { data: subjectsData } = useSubjects({ per_page: 100 });
  const subjects = subjectsData?.data || [];

  const { data: academicYearsData } = useAcademicYears({ per_page: 50 });
  const academicYears = academicYearsData?.data || [];

  // Set default active academic year if not yet selected
  React.useEffect(() => {
    if (selectedAcademicYearId === "ALL" && academicYears.length > 0) {
      const activeYear = academicYears.find((ay) => ay.active);
      if (activeYear) {
        setSelectedAcademicYearId(activeYear.id);
      }
    }
  }, [academicYears, selectedAcademicYearId]);

  // Lookup Maps
  const teacherMap = React.useMemo(() => {
    const map = new Map<string, TeacherRecordDto>();
    teachers.forEach((t) => {
      map.set(t.id, t);
      if (t.user_id) map.set(t.user_id, t);
    });
    return map;
  }, [teachers]);

  const classMap = React.useMemo(() => {
    const map = new Map<string, ClassDetailDto>();
    classes.forEach((c) => map.set(c.id, c));
    return map;
  }, [classes]);

  const subjectMap = React.useMemo(() => {
    const map = new Map<string, SubjectRecordDto>();
    subjects.forEach((s) => map.set(s.id, s));
    return map;
  }, [subjects]);

  const academicYearMap = React.useMemo(() => {
    const map = new Map<string, AcademicYearRecordDto>();
    academicYears.forEach((ay) => map.set(ay.id, ay));
    return map;
  }, [academicYears]);

  // Toast Notification
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [toastType, setToastType] = React.useState<"success" | "error">(
    "success"
  );

  const showToast = (
    message: string,
    type: "success" | "error" = "success"
  ) => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Queries
  const {
    data: assignmentsData,
    isLoading: isAssignmentsLoading,
    isError: isAssignmentsError,
    error: assignmentsError,
    refetch: refetchAssignments,
    isFetching: isAssignmentsFetching,
  } = useTeachingAssignments({
    teacher_id: selectedTeacherId === "ALL" ? undefined : selectedTeacherId,
    class_id: selectedClassId === "ALL" ? undefined : selectedClassId,
    subject_id: selectedSubjectId === "ALL" ? undefined : selectedSubjectId,
    academic_year_id:
      selectedAcademicYearId === "ALL" ? undefined : selectedAcademicYearId,
    page: assignmentPage,
    per_page: perPage,
  });

  const assignments = assignmentsData?.data || [];
  const assignmentMeta = assignmentsData?.meta;
  const assignmentTotalPages = assignmentMeta?.total_pages || 1;

  // Unfiltered active assignments for schedule creation dropdown
  const { data: allAssignmentsData } = useTeachingAssignments({
    academic_year_id:
      selectedAcademicYearId === "ALL" ? undefined : selectedAcademicYearId,
    page: 1,
    per_page: 100,
  });
  const assignableList = allAssignmentsData?.data || [];

  const assignmentLookupMap = React.useMemo(() => {
    const map = new Map<string, TeachingAssignmentRecordDto>();
    assignableList.forEach((a) => map.set(a.id, a));
    assignments.forEach((a) => map.set(a.id, a));
    return map;
  }, [assignableList, assignments]);

  const {
    data: schedulesData,
    isLoading: isSchedulesLoading,
    isError: isSchedulesError,
    error: schedulesError,
    refetch: refetchSchedules,
    isFetching: isSchedulesFetching,
  } = useSchedules({
    teacher_id: selectedTeacherId === "ALL" ? undefined : selectedTeacherId,
    class_id: selectedClassId === "ALL" ? undefined : selectedClassId,
    subject_id: selectedSubjectId === "ALL" ? undefined : selectedSubjectId,
    academic_year_id:
      selectedAcademicYearId === "ALL" ? undefined : selectedAcademicYearId,
    day_of_week: selectedDayOfWeek > 0 ? selectedDayOfWeek : undefined,
    active:
      scheduleStatusFilter === "ALL"
        ? undefined
        : scheduleStatusFilter === "ACTIVE",
    page: schedulePage,
    per_page: perPage,
  });

  const schedules = schedulesData?.data || [];
  const scheduleMeta = schedulesData?.meta;
  const scheduleTotalPages = scheduleMeta?.total_pages || 1;

  const {
    data: todaySchedulesData,
    isLoading: isTodayLoading,
    isError: isTodayError,
    error: todayError,
    refetch: refetchToday,
    isFetching: isTodayFetching,
  } = useTodaySchedules(todayPage, perPage);

  const todaySchedules = todaySchedulesData?.data || [];
  const todayMeta = todaySchedulesData?.meta;
  const todayTotalPages = todayMeta?.total_pages || 1;

  // Mutations
  const createAssignmentMutation = useCreateTeachingAssignment();
  const updateAssignmentMutation = useUpdateTeachingAssignment();
  const deleteAssignmentMutation = useDeleteTeachingAssignment();

  const createScheduleMutation = useCreateSchedule();
  const updateScheduleMutation = useUpdateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();

  // Modal: Assignment (Create / Edit)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] =
    React.useState(false);
  const [editingAssignment, setEditingAssignment] =
    React.useState<TeachingAssignmentRecordDto | null>(null);
  const [assignmentTeacherId, setAssignmentTeacherId] = React.useState("");
  const [assignmentClassId, setAssignmentClassId] = React.useState("");
  const [assignmentSubjectId, setAssignmentSubjectId] = React.useState("");
  const [assignmentAcademicYearId, setAssignmentAcademicYearId] =
    React.useState("");
  const [assignmentModalError, setAssignmentModalError] = React.useState<
    string | null
  >(null);

  // Modal: Delete Assignment
  const [deletingAssignment, setDeletingAssignment] =
    React.useState<TeachingAssignmentRecordDto | null>(null);
  const [deleteAssignmentError, setDeleteAssignmentError] = React.useState<
    string | null
  >(null);

  // Modal: Schedule (Create / Edit)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = React.useState(false);
  const [editingSchedule, setEditingSchedule] =
    React.useState<ScheduleItemDto | null>(null);
  const [scheduleAssignmentId, setScheduleAssignmentId] = React.useState("");
  const [scheduleDayOfWeek, setScheduleDayOfWeek] = React.useState<number>(1);
  const [scheduleStartsAt, setScheduleStartsAt] = React.useState("07:30");
  const [scheduleEndsAt, setScheduleEndsAt] = React.useState("09:00");
  const [scheduleEffectiveFrom, setScheduleEffectiveFrom] =
    React.useState("");
  const [scheduleEffectiveUntil, setScheduleEffectiveUntil] =
    React.useState("");
  const [scheduleModalError, setScheduleModalError] = React.useState<
    string | null
  >(null);

  // Modal: Delete Schedule
  const [deletingSchedule, setDeletingSchedule] =
    React.useState<ScheduleItemDto | null>(null);
  const [deleteScheduleError, setDeleteScheduleError] = React.useState<
    string | null
  >(null);

  // Handlers for Assignment Modal
  const openCreateAssignmentModal = () => {
    setEditingAssignment(null);
    setAssignmentTeacherId(
      selectedTeacherId !== "ALL" ? selectedTeacherId : ""
    );
    setAssignmentClassId(selectedClassId !== "ALL" ? selectedClassId : "");
    setAssignmentSubjectId(
      selectedSubjectId !== "ALL" ? selectedSubjectId : ""
    );
    setAssignmentAcademicYearId(
      selectedAcademicYearId !== "ALL"
        ? selectedAcademicYearId
        : academicYears.find((ay) => ay.active)?.id || ""
    );
    setAssignmentModalError(null);
    setIsAssignmentModalOpen(true);
  };

  const openEditAssignmentModal = (item: TeachingAssignmentRecordDto) => {
    setEditingAssignment(item);
    setAssignmentTeacherId(item.teacher_id);
    setAssignmentClassId(item.class_id);
    setAssignmentSubjectId(item.subject_id);
    setAssignmentAcademicYearId(item.academic_year_id);
    setAssignmentModalError(null);
    setIsAssignmentModalOpen(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignmentModalError(null);

    if (!assignmentTeacherId) {
      setAssignmentModalError("Guru pengampu wajib dipilih.");
      return;
    }
    if (!assignmentClassId) {
      setAssignmentModalError("Kelas wajib dipilih.");
      return;
    }
    if (!assignmentSubjectId) {
      setAssignmentModalError("Mata pelajaran wajib dipilih.");
      return;
    }
    if (!assignmentAcademicYearId) {
      setAssignmentModalError("Tahun ajaran wajib dipilih.");
      return;
    }

    try {
      if (editingAssignment) {
        await updateAssignmentMutation.mutateAsync({
          id: editingAssignment.id,
          data: {
            teacher_id: assignmentTeacherId,
            class_id: assignmentClassId,
            subject_id: assignmentSubjectId,
            academic_year_id: assignmentAcademicYearId,
          },
        });
        showToast("Penugasan mengajar berhasil diperbarui.");
      } else {
        await createAssignmentMutation.mutateAsync({
          teacher_id: assignmentTeacherId,
          class_id: assignmentClassId,
          subject_id: assignmentSubjectId,
          academic_year_id: assignmentAcademicYearId,
        });
        showToast("Penugasan mengajar berhasil ditambahkan.");
      }
      setIsAssignmentModalOpen(false);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === "CONFLICT") {
          setAssignmentModalError(
            "Konflik Penugasan: Penugasan guru, kelas, mapel, dan tahun ajaran ini sudah terdaftar atau terdapat riwayat aktif."
          );
        } else if (err.code === "VALIDATION_ERROR") {
          setAssignmentModalError(
            err.message ||
              "Data tidak valid. Pastikan guru, kelas, mapel, dan tahun ajaran dalam status aktif."
          );
        } else {
          setAssignmentModalError(err.message);
        }
      } else {
        setAssignmentModalError("Terjadi kesalahan saat menyimpan penugasan.");
      }
    }
  };

  const handleDeleteAssignment = async () => {
    if (!deletingAssignment) return;
    setDeleteAssignmentError(null);
    try {
      await deleteAssignmentMutation.mutateAsync(deletingAssignment.id);
      showToast("Penugasan mengajar berhasil dinonaktifkan.");
      setDeletingAssignment(null);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setDeleteAssignmentError(err.message);
      } else {
        setDeleteAssignmentError("Gagal menonaktifkan penugasan mengajar.");
      }
    }
  };

  // Handlers for Schedule Modal
  const openCreateScheduleModal = () => {
    setEditingSchedule(null);
    setScheduleAssignmentId("");
    setScheduleDayOfWeek(selectedDayOfWeek > 0 ? selectedDayOfWeek : 1);
    setScheduleStartsAt("07:30");
    setScheduleEndsAt("09:00");

    // Default effective from: today or start of current academic year
    const activeYear = academicYears.find(
      (ay) => ay.id === selectedAcademicYearId || ay.active
    );
    const todayStr = new Date().toISOString().split("T")[0];
    setScheduleEffectiveFrom(activeYear?.starts_on || todayStr);
    setScheduleEffectiveUntil(activeYear?.ends_on || "");
    setScheduleModalError(null);
    setIsScheduleModalOpen(true);
  };

  const openEditScheduleModal = (item: ScheduleItemDto) => {
    setEditingSchedule(item);
    setScheduleAssignmentId(item.teaching_assignment_id);
    setScheduleDayOfWeek(item.day_of_week);
    setScheduleStartsAt(item.starts_at.slice(0, 5));
    setScheduleEndsAt(item.ends_at.slice(0, 5));
    setScheduleEffectiveFrom(item.effective_from);
    setScheduleEffectiveUntil(item.effective_until || "");
    setScheduleModalError(null);
    setIsScheduleModalOpen(true);
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleModalError(null);

    if (!scheduleAssignmentId) {
      setScheduleModalError("Penugasan mengajar wajib dipilih.");
      return;
    }
    if (!scheduleStartsAt || !scheduleEndsAt) {
      setScheduleModalError("Jam mulai dan selesai wajib diisi.");
      return;
    }
    if (scheduleStartsAt >= scheduleEndsAt) {
      setScheduleModalError("Jam selesai harus lebih akhir dari jam mulai.");
      return;
    }
    if (!scheduleEffectiveFrom) {
      setScheduleModalError("Tanggal mulai berlaku wajib diisi.");
      return;
    }
    if (
      scheduleEffectiveUntil &&
      scheduleEffectiveUntil < scheduleEffectiveFrom
    ) {
      setScheduleModalError(
        "Tanggal berakhir harus setelah atau sama dengan tanggal mulai."
      );
      return;
    }

    try {
      if (editingSchedule) {
        await updateScheduleMutation.mutateAsync({
          id: editingSchedule.id,
          data: {
            teaching_assignment_id: scheduleAssignmentId,
            day_of_week: scheduleDayOfWeek,
            starts_at: scheduleStartsAt,
            ends_at: scheduleEndsAt,
            effective_from: scheduleEffectiveFrom,
            effective_until: scheduleEffectiveUntil || null,
          },
        });
        showToast("Jadwal kelas berhasil diperbarui.");
      } else {
        await createScheduleMutation.mutateAsync({
          teaching_assignment_id: scheduleAssignmentId,
          day_of_week: scheduleDayOfWeek,
          starts_at: scheduleStartsAt,
          ends_at: scheduleEndsAt,
          effective_from: scheduleEffectiveFrom,
          effective_until: scheduleEffectiveUntil || null,
        });
        showToast("Jadwal kelas berhasil ditambahkan.");
      }
      setIsScheduleModalOpen(false);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.code === "CONFLICT") {
          setScheduleModalError(
            "Konflik Jadwal: Guru atau kelas sudah memiliki jadwal mengajar pada hari dan rentang jam yang sama."
          );
        } else if (err.code === "VALIDATION_ERROR") {
          setScheduleModalError(
            err.message ||
              "Data jadwal tidak valid. Pastikan rentang jam dan tanggal sesuai periode tahun ajaran."
          );
        } else {
          setScheduleModalError(err.message);
        }
      } else {
        setScheduleModalError("Terjadi kesalahan saat menyimpan jadwal.");
      }
    }
  };

  const handleDeleteSchedule = async () => {
    if (!deletingSchedule) return;
    setDeleteScheduleError(null);
    try {
      await deleteScheduleMutation.mutateAsync(deletingSchedule.id);
      showToast("Jadwal kelas berhasil dinonaktifkan.");
      setDeletingSchedule(null);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setDeleteScheduleError(err.message);
      } else {
        setDeleteScheduleError("Gagal menonaktifkan jadwal.");
      }
    }
  };

  // Helper formatting functions
  const formatDayName = (dayNumber: number) => {
    return DAYS_OF_WEEK.find((d) => d.value === dayNumber)?.label || `Hari ${dayNumber}`;
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return "-";
    return timeStr.slice(0, 5);
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

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-7 h-7 text-[#0c3960]" />
            Jadwal & Penugasan Mengajar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola jadwal pelajaran kelas berulang dan penugasan guru per mata
            pelajaran serta tahun ajaran.
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {activeTab === "schedules" && (
            <button
              onClick={openCreateScheduleModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Jadwal
            </button>
          )}
          {activeTab === "assignments" && (
            <button
              onClick={openCreateAssignmentModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Tambah Penugasan
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-1 bg-slate-50/50 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab("schedules")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "schedules"
              ? "bg-white text-[#0c3960] shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-4 h-4" />
          Jadwal Pelajaran
          {scheduleMeta?.total !== undefined && (
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === "schedules"
                  ? "bg-[#0c3960]/10 text-[#0c3960]"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {scheduleMeta.total}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("assignments")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "assignments"
              ? "bg-white text-[#0c3960] shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Penugasan Guru
          {assignmentMeta?.total !== undefined && (
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === "assignments"
                  ? "bg-[#0c3960]/10 text-[#0c3960]"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {assignmentMeta.total}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("today")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "today"
              ? "bg-white text-emerald-800 shadow-xs"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          Jadwal Hari Ini
          {todayMeta?.total !== undefined && (
            <span
              className={`px-2 py-0.5 text-xs rounded-full ${
                activeTab === "today"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {todayMeta.total}
            </span>
          )}
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Filter: Academic Year */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Tahun Ajaran
            </label>
            <select
              value={selectedAcademicYearId}
              onChange={(e) => {
                setSelectedAcademicYearId(e.target.value);
                setSchedulePage(1);
                setAssignmentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
            >
              <option value="ALL">Semua Tahun Ajaran</option>
              {academicYears.map((ay) => (
                <option key={ay.id} value={ay.id}>
                  {ay.name} - Smst {ay.semester} {ay.active ? "(Aktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Guru */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Guru Pengampu
            </label>
            <select
              value={selectedTeacherId}
              onChange={(e) => {
                setSelectedTeacherId(e.target.value);
                setSchedulePage(1);
                setAssignmentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
            >
              <option value="ALL">Semua Guru</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.user_id || t.id}>
                  {t.full_name} ({t.nip})
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Kelas */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Kelas
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                setSchedulePage(1);
                setAssignmentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          {/* Filter: Mapel */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Mata Pelajaran
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSchedulePage(1);
                setAssignmentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
            >
              <option value="ALL">Semua Mapel</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab-Specific Secondary Filters */}
        {activeTab === "schedules" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <span>Hari:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => {
                    setSelectedDayOfWeek(0);
                    setSchedulePage(1);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    selectedDayOfWeek === 0
                      ? "bg-[#0c3960] text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  Semua
                </button>
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => {
                      setSelectedDayOfWeek(d.value);
                      setSchedulePage(1);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                      selectedDayOfWeek === d.value
                        ? "bg-[#0c3960] text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-slate-600 font-medium">Status:</span>
              <select
                value={scheduleStatusFilter}
                onChange={(e) => {
                  setScheduleStatusFilter(
                    e.target.value as "ALL" | "ACTIVE" | "INACTIVE"
                  );
                  setSchedulePage(1);
                }}
                className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Nonaktif</option>
              </select>

              {(selectedAcademicYearId !== "ALL" ||
                selectedTeacherId !== "ALL" ||
                selectedClassId !== "ALL" ||
                selectedSubjectId !== "ALL" ||
                selectedDayOfWeek !== 0 ||
                scheduleStatusFilter !== "ALL") && (
                <button
                  onClick={() => {
                    setSelectedTeacherId("ALL");
                    setSelectedClassId("ALL");
                    setSelectedSubjectId("ALL");
                    setSelectedDayOfWeek(0);
                    setScheduleStatusFilter("ALL");
                    setSchedulePage(1);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium cursor-pointer px-2 py-1"
                >
                  Reset Filter
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab 1: Jadwal Pelajaran (Schedules) */}
      {activeTab === "schedules" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Header / Action status */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-800 text-sm">
                Daftar Jadwal Kelas Berulang
              </h2>
              {isSchedulesFetching && (
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              )}
            </div>
            <span className="text-xs text-slate-500">
              Menampilkan {schedules.length} dari {scheduleMeta?.total || 0}{" "}
              jadwal
            </span>
          </div>

          {/* Table Content */}
          {isSchedulesLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-6 h-6 text-[#0c3960] animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat jadwal kelas...</p>
            </div>
          ) : isSchedulesError ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                Gagal memuat jadwal kelas
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {(schedulesError as any)?.message || "Terjadi kesalahan server"}
              </p>
              <button
                onClick={() => refetchSchedules()}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">
                Belum ada jadwal kelas
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Tambahkan jadwal pelajaran kelas berulang berdasarkan penugasan
                guru yang aktif.
              </p>
              <button
                onClick={openCreateScheduleModal}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c3960] text-white rounded-xl text-xs font-semibold hover:bg-[#092b49] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Jadwal Pertama
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Hari & Jam</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Mata Pelajaran</th>
                    <th className="px-4 py-3">Guru Pengampu</th>
                    <th className="px-4 py-3">Masa Berlaku</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schedules.map((schedule) => {
                    const cls = classMap.get(schedule.class_id);
                    const subj = subjectMap.get(schedule.subject_id);
                    const teacher = teacherMap.get(schedule.teacher_id);
                    const ay = academicYearMap.get(schedule.academic_year_id);

                    return (
                      <tr
                        key={schedule.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* Hari & Jam */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-slate-100 text-slate-800">
                              {formatDayName(schedule.day_of_week)}
                            </span>
                            <span className="font-semibold text-slate-900 font-mono">
                              {formatTime(schedule.starts_at)} -{" "}
                              {formatTime(schedule.ends_at)}
                            </span>
                          </div>
                        </td>

                        {/* Kelas */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {cls ? cls.name : "Kelas"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {cls?.code || "-"}
                          </div>
                        </td>

                        {/* Mata Pelajaran */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {subj ? subj.name : "Mata Pelajaran"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {subj?.code || "-"}
                          </div>
                        </td>

                        {/* Guru */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {teacher ? teacher.full_name : "Guru"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            NIP: {teacher?.nip || "-"}
                          </div>
                        </td>

                        {/* Masa Berlaku */}
                        <td className="px-4 py-3.5 text-slate-600">
                          <div>Mulai: {schedule.effective_from}</div>
                          <div className="text-[11px] text-slate-500">
                            Sampai: {schedule.effective_until || "Seterusnya"}
                          </div>
                          {ay && (
                            <div className="text-[10px] text-slate-400">
                              TA: {ay.name} (S{ay.semester})
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              schedule.active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                schedule.active
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {schedule.active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => openEditScheduleModal(schedule)}
                            className="p-1.5 text-slate-500 hover:text-[#0c3960] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Jadwal"
                          >
                            <PenSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingSchedule(schedule);
                              setDeleteScheduleError(null);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Nonaktifkan Jadwal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {scheduleTotalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Halaman {schedulePage} dari {scheduleTotalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={schedulePage <= 1}
                  onClick={() => setSchedulePage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={schedulePage >= scheduleTotalPages}
                  onClick={() =>
                    setSchedulePage((p) => Math.min(p + 1, scheduleTotalPages))
                  }
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Penugasan Guru (Teaching Assignments) */}
      {activeTab === "assignments" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-slate-800 text-sm">
                Daftar Penugasan Mengajar Guru
              </h2>
              {isAssignmentsFetching && (
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              )}
            </div>
            <span className="text-xs text-slate-500">
              Menampilkan {assignments.length} dari{" "}
              {assignmentMeta?.total || 0} penugasan
            </span>
          </div>

          {isAssignmentsLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-6 h-6 text-[#0c3960] animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Memuat data penugasan...</p>
            </div>
          ) : isAssignmentsError ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                Gagal memuat penugasan mengajar
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {(assignmentsError as any)?.message ||
                  "Terjadi kesalahan server"}
              </p>
              <button
                onClick={() => refetchAssignments()}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : assignments.length === 0 ? (
            <div className="p-12 text-center">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">
                Belum ada penugasan mengajar
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Tugaskan guru ke kelas dan mata pelajaran pada tahun ajaran aktif
                sebelum membuat jadwal kelas.
              </p>
              <button
                onClick={openCreateAssignmentModal}
                className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0c3960] text-white rounded-xl text-xs font-semibold hover:bg-[#092b49] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Penugasan
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Guru Pengampu</th>
                    <th className="px-4 py-3">Mata Pelajaran</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Tahun Ajaran</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.map((assignment) => {
                    const teacher = teacherMap.get(assignment.teacher_id);
                    const cls = classMap.get(assignment.class_id);
                    const subj = subjectMap.get(assignment.subject_id);
                    const ay = academicYearMap.get(assignment.academic_year_id);

                    return (
                      <tr
                        key={assignment.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {/* Guru */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {teacher ? teacher.full_name : "Guru"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            NIP: {teacher?.nip || "-"}
                          </div>
                        </td>

                        {/* Mapel */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {subj ? subj.name : "Mapel"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Kode: {subj?.code || "-"}
                          </div>
                        </td>

                        {/* Kelas */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {cls ? cls.name : "Kelas"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Tingkat {cls?.grade || "-"} - Rombel{" "}
                            {cls?.section || "-"}
                          </div>
                        </td>

                        {/* Tahun Ajaran */}
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {ay ? ay.name : "Tahun Ajaran"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Semester {ay?.semester || "-"}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                              assignment.active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                assignment.active
                                  ? "bg-emerald-500"
                                  : "bg-slate-400"
                              }`}
                            />
                            {assignment.active ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>

                        {/* Aksi */}
                        <td className="px-4 py-3.5 text-right space-x-1">
                          <button
                            onClick={() => openEditAssignmentModal(assignment)}
                            className="p-1.5 text-slate-500 hover:text-[#0c3960] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Penugasan"
                          >
                            <PenSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setDeletingAssignment(assignment);
                              setDeleteAssignmentError(null);
                            }}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Nonaktifkan Penugasan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {assignmentTotalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Halaman {assignmentPage} dari {assignmentTotalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={assignmentPage <= 1}
                  onClick={() => setAssignmentPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={assignmentPage >= assignmentTotalPages}
                  onClick={() =>
                    setAssignmentPage((p) =>
                      Math.min(p + 1, assignmentTotalPages)
                    )
                  }
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Jadwal Hari Ini (Today's Schedules) */}
      {activeTab === "today" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <h2 className="font-semibold text-slate-800 text-sm">
                Jadwal Hari Ini (Zona Waktu Asia/Jakarta)
              </h2>
              {isTodayFetching && (
                <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
              )}
            </div>
            <span className="text-xs text-slate-500">
              {todaySchedules.length} jadwal aktif hari ini
            </span>
          </div>

          {isTodayLoading ? (
            <div className="p-8 text-center">
              <RefreshCw className="w-6 h-6 text-[#0c3960] animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Memuat jadwal mengajar hari ini...
              </p>
            </div>
          ) : isTodayError ? (
            <div className="p-8 text-center">
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                Gagal memuat jadwal hari ini
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {(todayError as any)?.message || "Terjadi kesalahan server"}
              </p>
              <button
                onClick={() => refetchToday()}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : todaySchedules.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-700">
                Tidak ada jadwal pelajaran untuk hari ini
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Hari ini tidak ada sesi tatap muka terjadwal atau hari libur.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/75 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Jam Mengajar</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3">Mata Pelajaran</th>
                    <th className="px-4 py-3">Guru Pengampu</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todaySchedules.map((schedule) => {
                    const cls = classMap.get(schedule.class_id);
                    const subj = subjectMap.get(schedule.subject_id);
                    const teacher = teacherMap.get(schedule.teacher_id);

                    return (
                      <tr
                        key={schedule.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3.5">
                          <span className="font-semibold text-slate-900 font-mono text-xs bg-slate-100 px-2 py-1 rounded-md">
                            {formatTime(schedule.starts_at)} -{" "}
                            {formatTime(schedule.ends_at)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {cls ? cls.name : "Kelas"}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {subj ? subj.name : "Mapel"}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-slate-900">
                            {teacher ? teacher.full_name : "Guru"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            NIP: {teacher?.nip || "-"}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Aktif Hari Ini
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {todayTotalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Halaman {todayPage} dari {todayTotalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={todayPage <= 1}
                  onClick={() => setTodayPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={todayPage >= todayTotalPages}
                  onClick={() =>
                    setTodayPage((p) => Math.min(p + 1, todayTotalPages))
                  }
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: Tambah / Edit Penugasan Guru */}
      {isAssignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#0c3960]" />
                {editingAssignment
                  ? "Ubah Penugasan Mengajar"
                  : "Tambah Penugasan Mengajar"}
              </h3>
              <button
                onClick={() => setIsAssignmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="p-6 space-y-4">
              {/* Modal Error / Conflict Alert */}
              {assignmentModalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Perhatian: </span>
                    {assignmentModalError}
                  </div>
                </div>
              )}

              {/* Guru */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Guru Pengampu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignmentTeacherId}
                  onChange={(e) => setAssignmentTeacherId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Guru --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.user_id || t.id}>
                      {t.full_name} ({t.nip})
                    </option>
                  ))}
                </select>
              </div>

              {/* Kelas */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelas <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignmentClassId}
                  onChange={(e) => setAssignmentClassId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Kelas --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) - Tingkat {c.grade}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mata Pelajaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mata Pelajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignmentSubjectId}
                  onChange={(e) => setAssignmentSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Mata Pelajaran --</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tahun Ajaran */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tahun Ajaran <span className="text-rose-500">*</span>
                </label>
                <select
                  value={assignmentAcademicYearId}
                  onChange={(e) => setAssignmentAcademicYearId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Tahun Ajaran --</option>
                  {academicYears.map((ay) => (
                    <option key={ay.id} value={ay.id}>
                      {ay.name} (Semester {ay.semester}){" "}
                      {ay.active ? "- Aktif" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAssignmentModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    createAssignmentMutation.isPending ||
                    updateAssignmentMutation.isPending
                  }
                  className="px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {createAssignmentMutation.isPending ||
                  updateAssignmentMutation.isPending
                    ? "Menyimpan..."
                    : "Simpan Penugasan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Tambah / Edit Jadwal Pelajaran */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0c3960]" />
                {editingSchedule ? "Ubah Jadwal Kelas" : "Tambah Jadwal Kelas"}
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-4">
              {/* Modal Error / Conflict Alert */}
              {scheduleModalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Peringatan Bentrok: </span>
                    {scheduleModalError}
                  </div>
                </div>
              )}

              {/* Penugasan Mengajar */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Penugasan Mengajar (Guru - Mapel - Kelas){" "}
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  value={scheduleAssignmentId}
                  onChange={(e) => setScheduleAssignmentId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                  required
                >
                  <option value="">-- Pilih Penugasan Guru --</option>
                  {assignableList.map((a) => {
                    const t = teacherMap.get(a.teacher_id);
                    const s = subjectMap.get(a.subject_id);
                    const c = classMap.get(a.class_id);
                    const ay = academicYearMap.get(a.academic_year_id);
                    return (
                      <option key={a.id} value={a.id}>
                        {t?.full_name || "Guru"} - {s?.name || "Mapel"} (
                        {c?.name || "Kelas"}) [{ay?.name || "TA"}]
                      </option>
                    );
                  })}
                </select>
                {assignableList.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Belum ada penugasan guru yang terdaftar. Tambahkan penugasan
                    guru terlebih dahulu di tab &quot;Penugasan Guru&quot;.
                  </p>
                )}
              </div>

              {/* Hari & Jam */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hari <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={scheduleDayOfWeek}
                    onChange={(e) =>
                      setScheduleDayOfWeek(parseInt(e.target.value, 10))
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] cursor-pointer"
                    required
                  >
                    {DAYS_OF_WEEK.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={scheduleStartsAt}
                    onChange={(e) => setScheduleStartsAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Selesai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={scheduleEndsAt}
                    onChange={(e) => setScheduleEndsAt(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                    required
                  />
                </div>
              </div>

              {/* Rentang Tanggal Berlaku */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berlaku Mulai <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={scheduleEffectiveFrom}
                    onChange={(e) => setScheduleEffectiveFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Berlaku Sampai (Opsional)
                  </label>
                  <input
                    type="date"
                    value={scheduleEffectiveUntil}
                    onChange={(e) => setScheduleEffectiveUntil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    createScheduleMutation.isPending ||
                    updateScheduleMutation.isPending
                  }
                  className="px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {createScheduleMutation.isPending ||
                  updateScheduleMutation.isPending
                    ? "Menyimpan..."
                    : "Simpan Jadwal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Penugasan */}
      {deletingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Nonaktifkan Penugasan Guru?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menonaktifkan penugasan guru{" "}
              <span className="font-bold text-slate-900">
                {teacherMap.get(deletingAssignment.teacher_id)?.full_name ||
                  "Guru"}
              </span>{" "}
              untuk mata pelajaran{" "}
              <span className="font-bold text-slate-900">
                {subjectMap.get(deletingAssignment.subject_id)?.name || "Mapel"}
              </span>{" "}
              di kelas{" "}
              <span className="font-bold text-slate-900">
                {classMap.get(deletingAssignment.class_id)?.name || "Kelas"}
              </span>
              ? Riwayat absensi lampau akan tetap dipertahankan.
            </p>

            {deleteAssignmentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-4">
                {deleteAssignmentError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingAssignment(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteAssignment}
                disabled={deleteAssignmentMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteAssignmentMutation.isPending
                  ? "Menonaktifkan..."
                  : "Ya, Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Jadwal */}
      {deletingSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Nonaktifkan Jadwal Kelas?
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Apakah Anda yakin ingin menonaktifkan jadwal kelas pada hari{" "}
              <span className="font-bold text-slate-900">
                {formatDayName(deletingSchedule.day_of_week)} (
                {formatTime(deletingSchedule.starts_at)} -{" "}
                {formatTime(deletingSchedule.ends_at)})
              </span>{" "}
              untuk kelas{" "}
              <span className="font-bold text-slate-900">
                {classMap.get(deletingSchedule.class_id)?.name || "Kelas"}
              </span>
              ?
            </p>

            {deleteScheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-4">
                {deleteScheduleError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingSchedule(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSchedule}
                disabled={deleteScheduleMutation.isPending}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              >
                {deleteScheduleMutation.isPending
                  ? "Menonaktifkan..."
                  : "Ya, Nonaktifkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

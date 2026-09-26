"use client";

import * as React from "react";
import Link from "next/link";
import { useAuthRole } from "@/context/auth-role-context";
import {
  Download,
  X,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Clock,
  CalendarDays,
  ChevronRight,
  User,
  Info,
  Eye,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

export interface StudentAbsenceRecord {
  id: string;
  type: "ALPA" | "IZIN" | "SAKIT";
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  date: string;
  time: string;
  note: string;
}

export interface StudentSubjectBreakdown {
  subjectName: string;
  subjectCode: string;
  teacherName: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  total: number;
}

export interface RekapStudent {
  id: number;
  name: string;
  nis: string;
  hadir: number;
  izin: number;
  sakit: number;
  alpa: number;
  persentase: string;
  absences: StudentAbsenceRecord[];
  subjectBreakdown: StudentSubjectBreakdown[];
}

const REKAP_DATA_BY_CLASS: Record<string, RekapStudent[]> = {
  "7a": [
    {
      id: 101,
      name: "Aditya Pratama",
      nis: "20260701",
      hadir: 18,
      izin: 1,
      sakit: 0,
      alpa: 1,
      persentase: "90%",
      absences: [
        {
          id: "abs-1",
          type: "ALPA",
          subjectName: "Ilmu Pengetahuan Alam (IPA)",
          subjectCode: "IPA",
          teacherName: "Rina Marlina, S.Si.",
          date: "Rabu, 24 Sep 2026",
          time: "11:00 - 12:30 WIB",
          note: "Tidak hadir di ruang laboratorium IPA saat jam praktikum tanpa keterangan guru piket.",
        },
        {
          id: "abs-2",
          type: "IZIN",
          subjectName: "Bahasa Inggris",
          subjectCode: "BIG",
          teacherName: "Ahmad Fauzi, S.Pd.",
          date: "Senin, 22 Sep 2026",
          time: "07:30 - 09:00 WIB",
          note: "Dispensasi resmi mewakili sekolah dalam lomba cerdas cermat tingkat kecamatan.",
        },
      ],
      subjectBreakdown: [
        { subjectName: "Bahasa Indonesia", subjectCode: "BIN", teacherName: "Siti Rahmawati, S.Pd.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Matematika", subjectCode: "MTK", teacherName: "Budi Santoso, M.Pd.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Ilmu Pengetahuan Alam", subjectCode: "IPA", teacherName: "Rina Marlina, S.Si.", hadir: 3, izin: 0, sakit: 0, alpa: 1, total: 4 },
        { subjectName: "Pendidikan Jasmani (PJOK)", subjectCode: "PJOK", teacherName: "Dedi Kurniawan, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Bahasa Inggris", subjectCode: "BIG", teacherName: "Ahmad Fauzi, S.Pd.", hadir: 2, izin: 1, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Pendidikan Agama Islam", subjectCode: "PAI", teacherName: "Drs. H. Mulyadi", hadir: 2, izin: 0, sakit: 0, alpa: 0, total: 2 },
      ],
    },
    {
      id: 102,
      name: "Alya Zahra",
      nis: "20260702",
      hadir: 18,
      izin: 1,
      sakit: 0,
      alpa: 1,
      persentase: "90%",
      absences: [
        {
          id: "abs-3",
          type: "ALPA",
          subjectName: "Matematika",
          subjectCode: "MTK",
          teacherName: "Budi Santoso, M.Pd.",
          date: "Kamis, 25 Sep 2026",
          time: "09:15 - 10:45 WIB",
          note: "Terlambat dan tidak kembali ke kelas setelah jam istirahat pertama tanpa izin.",
        },
        {
          id: "abs-4",
          type: "IZIN",
          subjectName: "Pendidikan Jasmani (PJOK)",
          subjectCode: "PJOK",
          teacherName: "Dedi Kurniawan, S.Pd.",
          date: "Jumat, 19 Sep 2026",
          time: "07:30 - 09:00 WIB",
          note: "Izin tidak mengikuti latihan lari di lapangan karena masa pemulihan cedera kaki.",
        },
      ],
      subjectBreakdown: [
        { subjectName: "Bahasa Indonesia", subjectCode: "BIN", teacherName: "Siti Rahmawati, S.Pd.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Matematika", subjectCode: "MTK", teacherName: "Budi Santoso, M.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 1, total: 4 },
        { subjectName: "Ilmu Pengetahuan Alam", subjectCode: "IPA", teacherName: "Rina Marlina, S.Si.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Pendidikan Jasmani (PJOK)", subjectCode: "PJOK", teacherName: "Dedi Kurniawan, S.Pd.", hadir: 2, izin: 1, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Bahasa Inggris", subjectCode: "BIG", teacherName: "Ahmad Fauzi, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Pendidikan Agama Islam", subjectCode: "PAI", teacherName: "Drs. H. Mulyadi", hadir: 2, izin: 0, sakit: 0, alpa: 0, total: 2 },
      ],
    },
    {
      id: 103,
      name: "Bagas Saputra",
      nis: "20260703",
      hadir: 18,
      izin: 1,
      sakit: 0,
      alpa: 1,
      persentase: "90%",
      absences: [
        {
          id: "abs-5",
          type: "ALPA",
          subjectName: "Bahasa Inggris",
          subjectCode: "BIG",
          teacherName: "Ahmad Fauzi, S.Pd.",
          date: "Jumat, 26 Sep 2026",
          time: "13:15 - 14:45 WIB",
          note: "Tidak berada di kelas pada jam pelajaran terakhir tanpa keterangan konfirmasi.",
        },
        {
          id: "abs-6",
          type: "IZIN",
          subjectName: "Bahasa Indonesia",
          subjectCode: "BIN",
          teacherName: "Siti Rahmawati, S.Pd.",
          date: "Selasa, 16 Sep 2026",
          time: "07:30 - 09:00 WIB",
          note: "Izin acara keluarga ke luar kota (surat pemberitahuan orang tua diserahkan ke wali kelas).",
        },
      ],
      subjectBreakdown: [
        { subjectName: "Bahasa Indonesia", subjectCode: "BIN", teacherName: "Siti Rahmawati, S.Pd.", hadir: 3, izin: 1, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Matematika", subjectCode: "MTK", teacherName: "Budi Santoso, M.Pd.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Ilmu Pengetahuan Alam", subjectCode: "IPA", teacherName: "Rina Marlina, S.Si.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Pendidikan Jasmani (PJOK)", subjectCode: "PJOK", teacherName: "Dedi Kurniawan, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Bahasa Inggris", subjectCode: "BIG", teacherName: "Ahmad Fauzi, S.Pd.", hadir: 2, izin: 0, sakit: 0, alpa: 1, total: 3 },
        { subjectName: "Pendidikan Agama Islam", subjectCode: "PAI", teacherName: "Drs. H. Mulyadi", hadir: 2, izin: 0, sakit: 0, alpa: 0, total: 2 },
      ],
    },
    {
      id: 104,
      name: "Citra Kirana",
      nis: "20260704",
      hadir: 18,
      izin: 1,
      sakit: 0,
      alpa: 1,
      persentase: "90%",
      absences: [
        {
          id: "abs-7",
          type: "ALPA",
          subjectName: "Pendidikan Agama Islam (PAI)",
          subjectCode: "PAI",
          teacherName: "Drs. H. Mulyadi",
          date: "Senin, 22 Sep 2026",
          time: "11:00 - 12:30 WIB",
          note: "Alpa tanpa keterangan di jam pelajaran PAI.",
        },
        {
          id: "abs-8",
          type: "IZIN",
          subjectName: "Matematika",
          subjectCode: "MTK",
          teacherName: "Budi Santoso, M.Pd.",
          date: "Rabu, 17 Sep 2026",
          time: "09:15 - 10:45 WIB",
          note: "Izin istirahat di ruang UKS karena mengalami pusing saat pelajaran berlangsung.",
        },
      ],
      subjectBreakdown: [
        { subjectName: "Bahasa Indonesia", subjectCode: "BIN", teacherName: "Siti Rahmawati, S.Pd.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Matematika", subjectCode: "MTK", teacherName: "Budi Santoso, M.Pd.", hadir: 3, izin: 1, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Ilmu Pengetahuan Alam", subjectCode: "IPA", teacherName: "Rina Marlina, S.Si.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Pendidikan Jasmani (PJOK)", subjectCode: "PJOK", teacherName: "Dedi Kurniawan, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Bahasa Inggris", subjectCode: "BIG", teacherName: "Ahmad Fauzi, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Pendidikan Agama Islam", subjectCode: "PAI", teacherName: "Drs. H. Mulyadi", hadir: 1, izin: 0, sakit: 0, alpa: 1, total: 2 },
      ],
    },
    {
      id: 105,
      name: "Dimas Anggara",
      nis: "20260705",
      hadir: 18,
      izin: 1,
      sakit: 0,
      alpa: 1,
      persentase: "90%",
      absences: [
        {
          id: "abs-9",
          type: "ALPA",
          subjectName: "Pendidikan Jasmani (PJOK)",
          subjectCode: "PJOK",
          teacherName: "Dedi Kurniawan, S.Pd.",
          date: "Selasa, 23 Sep 2026",
          time: "13:15 - 14:45 WIB",
          note: "Tidak hadir di lapangan olahraga saat pelajaran PJOK (cabut setelah jam istirahat).",
        },
        {
          id: "abs-10",
          type: "IZIN",
          subjectName: "Ilmu Pengetahuan Alam (IPA)",
          subjectCode: "IPA",
          teacherName: "Rina Marlina, S.Si.",
          date: "Kamis, 18 Sep 2026",
          time: "11:00 - 12:30 WIB",
          note: "Izin konseling ke ruang Bimbingan Konseling (BK) dengan rekomendasi guru piket.",
        },
      ],
      subjectBreakdown: [
        { subjectName: "Bahasa Indonesia", subjectCode: "BIN", teacherName: "Siti Rahmawati, S.Pd.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Matematika", subjectCode: "MTK", teacherName: "Budi Santoso, M.Pd.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Ilmu Pengetahuan Alam", subjectCode: "IPA", teacherName: "Rina Marlina, S.Si.", hadir: 3, izin: 1, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Pendidikan Jasmani (PJOK)", subjectCode: "PJOK", teacherName: "Dedi Kurniawan, S.Pd.", hadir: 2, izin: 0, sakit: 0, alpa: 1, total: 3 },
        { subjectName: "Bahasa Inggris", subjectCode: "BIG", teacherName: "Ahmad Fauzi, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Pendidikan Agama Islam", subjectCode: "PAI", teacherName: "Drs. H. Mulyadi", hadir: 2, izin: 0, sakit: 0, alpa: 0, total: 2 },
      ],
    },
  ],
  "7b": [
    {
      id: 106,
      name: "Ahmad Fauzan",
      nis: "20260711",
      hadir: 19,
      izin: 1,
      sakit: 0,
      alpa: 0,
      persentase: "95%",
      absences: [
        {
          id: "abs-11",
          type: "IZIN",
          subjectName: "Matematika",
          subjectCode: "MTK",
          teacherName: "Budi Santoso, M.Pd.",
          date: "Senin, 15 Sep 2026",
          time: "09:15 - 10:45 WIB",
          note: "Izin piket organisasi OSIS & bantuan di perpustakaan sekolah.",
        },
      ],
      subjectBreakdown: [
        { subjectName: "Bahasa Indonesia", subjectCode: "BIN", teacherName: "Siti Rahmawati, S.Pd.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Matematika", subjectCode: "MTK", teacherName: "Budi Santoso, M.Pd.", hadir: 3, izin: 1, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Ilmu Pengetahuan Alam", subjectCode: "IPA", teacherName: "Rina Marlina, S.Si.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Pendidikan Jasmani (PJOK)", subjectCode: "PJOK", teacherName: "Dedi Kurniawan, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Bahasa Inggris", subjectCode: "BIG", teacherName: "Ahmad Fauzi, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Pendidikan Agama Islam", subjectCode: "PAI", teacherName: "Drs. H. Mulyadi", hadir: 2, izin: 0, sakit: 0, alpa: 0, total: 2 },
      ],
    },
    {
      id: 107,
      name: "Bella Safitri",
      nis: "20260712",
      hadir: 17,
      izin: 1,
      sakit: 0,
      alpa: 2,
      persentase: "85%",
      absences: [
        {
          id: "abs-12",
          type: "ALPA",
          subjectName: "Matematika",
          subjectCode: "MTK",
          teacherName: "Budi Santoso, M.Pd.",
          date: "Jumat, 26 Sep 2026",
          time: "09:15 - 10:45 WIB",
          note: "Perhatian Wali Kelas: Siswa tidak berada di kelas setelah jam istirahat pertama (cabut/bolos).",
        },
        {
          id: "abs-13",
          type: "ALPA",
          subjectName: "Ilmu Pengetahuan Alam (IPA)",
          subjectCode: "IPA",
          teacherName: "Rina Marlina, S.Si.",
          date: "Kamis, 18 Sep 2026",
          time: "11:00 - 12:30 WIB",
          note: "Tidak hadir di jam IPA tanpa konfirmasi / surat izin.",
        },
        {
          id: "abs-14",
          type: "IZIN",
          subjectName: "Bahasa Indonesia",
          subjectCode: "BIN",
          teacherName: "Siti Rahmawati, S.Pd.",
          date: "Rabu, 17 Sep 2026",
          time: "07:30 - 09:00 WIB",
          note: "Izin ke ruang UKS karena sakit perut mendadak.",
        },
      ],
      subjectBreakdown: [
        { subjectName: "Bahasa Indonesia", subjectCode: "BIN", teacherName: "Siti Rahmawati, S.Pd.", hadir: 3, izin: 1, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Matematika", subjectCode: "MTK", teacherName: "Budi Santoso, M.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 1, total: 4 },
        { subjectName: "Ilmu Pengetahuan Alam", subjectCode: "IPA", teacherName: "Rina Marlina, S.Si.", hadir: 3, izin: 0, sakit: 0, alpa: 1, total: 4 },
        { subjectName: "Pendidikan Jasmani (PJOK)", subjectCode: "PJOK", teacherName: "Dedi Kurniawan, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Bahasa Inggris", subjectCode: "BIG", teacherName: "Ahmad Fauzi, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Pendidikan Agama Islam", subjectCode: "PAI", teacherName: "Drs. H. Mulyadi", hadir: 2, izin: 0, sakit: 0, alpa: 0, total: 2 },
      ],
    },
    {
      id: 108,
      name: "Candra Wijaya",
      nis: "20260713",
      hadir: 20,
      izin: 0,
      sakit: 0,
      alpa: 0,
      persentase: "100%",
      absences: [],
      subjectBreakdown: [
        { subjectName: "Bahasa Indonesia", subjectCode: "BIN", teacherName: "Siti Rahmawati, S.Pd.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Matematika", subjectCode: "MTK", teacherName: "Budi Santoso, M.Pd.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Ilmu Pengetahuan Alam", subjectCode: "IPA", teacherName: "Rina Marlina, S.Si.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Pendidikan Jasmani (PJOK)", subjectCode: "PJOK", teacherName: "Dedi Kurniawan, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Bahasa Inggris", subjectCode: "BIG", teacherName: "Ahmad Fauzi, S.Pd.", hadir: 3, izin: 0, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Pendidikan Agama Islam", subjectCode: "PAI", teacherName: "Drs. H. Mulyadi", hadir: 2, izin: 0, sakit: 0, alpa: 0, total: 2 },
      ],
    },
    {
      id: 109,
      name: "Dewi Lestari",
      nis: "20260714",
      hadir: 16,
      izin: 2,
      sakit: 2,
      alpa: 0,
      persentase: "80%",
      absences: [
        {
          id: "abs-15",
          type: "SAKIT",
          subjectName: "Bahasa Indonesia",
          subjectCode: "BIN",
          teacherName: "Siti Rahmawati, S.Pd.",
          date: "Jumat, 26 Sep 2026",
          time: "07:30 - 09:00 WIB",
          note: "Surat izin dokter dari Puskesmas Tirtajaya (Demam & Flu).",
        },
        {
          id: "abs-16",
          type: "SAKIT",
          subjectName: "Matematika",
          subjectCode: "MTK",
          teacherName: "Budi Santoso, M.Pd.",
          date: "Jumat, 26 Sep 2026",
          time: "09:15 - 10:45 WIB",
          note: "Lanjutan izin sakit dokter.",
        },
        {
          id: "abs-17",
          type: "IZIN",
          subjectName: "Bahasa Inggris",
          subjectCode: "BIG",
          teacherName: "Ahmad Fauzi, S.Pd.",
          date: "Senin, 15 Sep 2026",
          time: "11:00 - 12:30 WIB",
          note: "Izin acara keluarga penting di luar kota.",
        },
        {
          id: "abs-18",
          type: "IZIN",
          subjectName: "Pendidikan Jasmani (PJOK)",
          subjectCode: "PJOK",
          teacherName: "Dedi Kurniawan, S.Pd.",
          date: "Selasa, 16 Sep 2026",
          time: "13:15 - 14:45 WIB",
          note: "Lanjutan izin acara keluarga.",
        },
      ],
      subjectBreakdown: [
        { subjectName: "Bahasa Indonesia", subjectCode: "BIN", teacherName: "Siti Rahmawati, S.Pd.", hadir: 3, izin: 0, sakit: 1, alpa: 0, total: 4 },
        { subjectName: "Matematika", subjectCode: "MTK", teacherName: "Budi Santoso, M.Pd.", hadir: 3, izin: 0, sakit: 1, alpa: 0, total: 4 },
        { subjectName: "Ilmu Pengetahuan Alam", subjectCode: "IPA", teacherName: "Rina Marlina, S.Si.", hadir: 4, izin: 0, sakit: 0, alpa: 0, total: 4 },
        { subjectName: "Pendidikan Jasmani (PJOK)", subjectCode: "PJOK", teacherName: "Dedi Kurniawan, S.Pd.", hadir: 2, izin: 1, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Bahasa Inggris", subjectCode: "BIG", teacherName: "Ahmad Fauzi, S.Pd.", hadir: 2, izin: 1, sakit: 0, alpa: 0, total: 3 },
        { subjectName: "Pendidikan Agama Islam", subjectCode: "PAI", teacherName: "Drs. H. Mulyadi", hadir: 2, izin: 0, sakit: 0, alpa: 0, total: 2 },
      ],
    },
  ],
};

const AVAILABLE_CLASSES = [
  { id: "7a", code: "7A", label: "Kelas 7A" },
  { id: "7b", code: "7B", label: "Kelas 7B" },
  { id: "7c", code: "7C", label: "Kelas 7C" },
  { id: "8a", code: "8A", label: "Kelas 8A" },
  { id: "9a", code: "9A", label: "Kelas 9A" },
];

export default function SiswaPage() {
  const { currentUser, activeRole } = useAuthRole();

  // If user is Wali Kelas with homeroomClass, default to that class; otherwise default to "7a"
  const defaultClassId = (
    currentUser.homeroomClass || "7A"
  ).toLowerCase();
  const [selectedClassId, setSelectedClassId] = React.useState<string>(defaultClassId);

  // Modal State for Student Subject Breakdown Drill-down
  const [selectedStudentForDetail, setSelectedStudentForDetail] =
    React.useState<RekapStudent | null>(null);
  const [modalFilter, setModalFilter] = React.useState<"ABSEN_ONLY" | "ALL_SUBJECTS">("ABSEN_ONLY");

  // Synchronize when role / homeroom assignment changes
  React.useEffect(() => {
    if (currentUser.homeroomClass) {
      setSelectedClassId(currentUser.homeroomClass.toLowerCase());
    } else {
      setSelectedClassId("7a");
    }
  }, [currentUser]);

  // JIKA USER ADALAH GURU MAPEL TANPA TUGAS WALI KELAS:
  if (activeRole !== "SUPER_ADMIN" && !currentUser.homeroomClass) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-xs border border-amber-200">
          <GraduationCap className="w-8 h-8 text-[#0c3960]" />
        </div>
        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
            Menu Khusus Wali Kelas
          </span>
          <h2 className="text-2xl font-black text-slate-900">
            Halaman Rekap Kelas Binaan
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
            Akun Anda terdaftar sebagai <strong>{currentUser.name}</strong> ({currentUser.subject || "Guru Mata Pelajaran"}). Anda tidak memiliki penugasan kelas binaan aktif untuk semester ini.
          </p>
          <p className="text-xs text-slate-400">
            Halaman ini khusus diperuntukkan bagi Wali Kelas untuk memantau rekap absensi rombel binaannya di seluruh mata pelajaran.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/portal-guru"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0c3960] hover:bg-[#0a2e4e] text-white text-xs font-bold shadow-md shadow-blue-900/15 transition cursor-pointer"
          >
            <span>Buka Jadwal & Presensi Mengajar Anda</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </Link>
        </div>
      </div>
    );
  }

  const currentClassItem =
    AVAILABLE_CLASSES.find((c) => c.id === selectedClassId) || AVAILABLE_CLASSES[0];
  const displayClassCode = currentClassItem.code;
  const displayStudents =
    REKAP_DATA_BY_CLASS[selectedClassId] || REKAP_DATA_BY_CLASS["7a"];

  const handleDownloadRekap = () => {
    const headers = [
      "NO",
      "NAMA SISWA",
      "NIS",
      "HADIR",
      "IZIN",
      "SAKIT",
      "ALPA",
      "PERSENTASE",
    ];
    const rows = displayStudents.map((s, idx) => [
      idx + 1,
      `"${s.name}"`,
      `'${s.nis}`,
      s.hadir,
      s.izin,
      s.sakit,
      s.alpa,
      s.persentase,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Rekap_Kehadiran_Kelas_${displayClassCode}_Bulan_Ini.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Jika Super Admin, tampilkan selector kelas kecil di atas agar bisa memilih kelas binaan yang ingin dipantau */}
      {activeRole === "SUPER_ADMIN" && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-500 mr-1">Pilih Kelas:</span>
          {AVAILABLE_CLASSES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedClassId(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                selectedClassId === c.id
                  ? "bg-[#0c3960] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {/* Card 1: Dashboard Header (Sesuai Referensi Gambar Pengguna) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6">
        <div className="space-y-2">
          <div>
            <span className="inline-block px-3 py-1 rounded-md bg-[#e6fbf4] text-[#059669] font-bold text-xs tracking-wide">
              Wali Kelas Binaan
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Kelas {displayClassCode}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Pemantauan harian rekap kehadiran anak didik dari seluruh guru mata pelajaran.
          </p>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          <button
            onClick={handleDownloadRekap}
            className="w-full sm:w-auto px-5 py-3 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2.5 transition cursor-pointer shadow-xs whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Download Rekap Bulanan</span>
          </button>
        </div>
      </div>

      {/* Card 2: Daftar Rekap Siswa (Sesuai Referensi Gambar Pengguna, Responsif HP & Desktop) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 sm:p-7 pb-4 sm:pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Rekap Siswa Kelas {displayClassCode} (Bulan Ini)
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Klik nama siswa, baris tabel, atau tombol <strong>Detail Mapel</strong> untuk melihat riwayat kehadiran per guru.
            </p>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Total Siswa: {displayStudents.length} Orang
          </span>
        </div>

        {/* TAMPILAN DESKTOP & TABLET: TABEL RESMI SESUAI REFERENSI */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 uppercase text-[11px] font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-center w-16">NO</th>
                <th className="px-6 py-4">NAMA SISWA & NIS</th>
                <th className="px-6 py-4 text-center">HADIR</th>
                <th className="px-6 py-4 text-center">IZIN</th>
                <th className="px-6 py-4 text-center">SAKIT</th>
                <th className="px-6 py-4 text-center">ALPA</th>
                <th className="px-6 py-4 text-center">PERSENTASE</th>
                <th className="px-6 py-4 text-center w-32">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {displayStudents.map((s, idx) => (
                <tr
                  key={s.id}
                  onClick={() => {
                    setSelectedStudentForDetail(s);
                    setModalFilter("ABSEN_ONLY");
                  }}
                  className="hover:bg-blue-50/40 transition cursor-pointer group"
                >
                  <td className="px-6 py-5 text-center font-medium text-slate-400 text-sm">
                    {idx + 1}
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900 text-sm group-hover:text-blue-700 transition flex items-center gap-1.5">
                      <span className="group-hover:underline">{s.name}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition" />
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">{s.nis}</div>
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-emerald-500 text-sm">
                    {s.hadir}
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-blue-500 text-sm">
                    {s.izin}
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-amber-500 text-sm">
                    {s.sakit}
                  </td>
                  <td className="px-6 py-5 text-center font-bold text-rose-500 text-sm">
                    {s.alpa}
                  </td>
                  <td className="px-6 py-5 text-center font-extrabold text-slate-900 text-sm">
                    {s.persentase}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStudentForDetail(s);
                        setModalFilter("ABSEN_ONLY");
                      }}
                      className="px-3.5 py-1.5 bg-[#0c3960] hover:bg-[#0a2e4e] text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-300" />
                      <span>Detail Mapel</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TAMPILAN KHUSUS HP (MOBILE NATIVE CARDS - TIDAK PERLU SCROLL HORIZONTAL) */}
        <div className="block md:hidden divide-y divide-slate-100 p-4 space-y-3.5">
          {displayStudents.map((s, idx) => (
            <div
              key={s.id}
              onClick={() => {
                setSelectedStudentForDetail(s);
                setModalFilter("ABSEN_ONLY");
              }}
              className="p-4 bg-slate-50/70 hover:bg-blue-50/40 rounded-2xl border border-slate-200/80 transition cursor-pointer space-y-3 shadow-2xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-white text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 shadow-2xs">
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                      {s.name}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">NIS: {s.nis}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-2.5 py-1 rounded-full bg-slate-900 text-white font-extrabold text-xs">
                    {s.persentase}
                  </span>
                </div>
              </div>

              {/* 4 Kotak Statistik Kehadiran Siswa di HP */}
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Hadir</span>
                  <span className="font-bold text-emerald-600 text-sm">{s.hadir}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Izin</span>
                  <span className="font-bold text-blue-600 text-sm">{s.izin}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Sakit</span>
                  <span className="font-bold text-amber-600 text-sm">{s.sakit}</span>
                </div>
                <div className="p-2 rounded-xl bg-white border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 block font-medium">Alpa</span>
                  <span className="font-bold text-rose-600 text-sm">{s.alpa}</span>
                </div>
              </div>

              {/* Tombol Aksi di HP */}
              <button
                type="button"
                className="w-full py-2.5 bg-[#0c3960] hover:bg-[#0a2e4e] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Eye className="w-3.5 h-3.5 text-amber-300" />
                <span>Lihat Rincian Mapel & Catatan</span>
                <ChevronRight className="w-3.5 h-3.5 text-white/70" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL RINCIAN MAPEL SETIAP SISWA (DRILL-DOWN) */}
      {selectedStudentForDetail && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-[#0c3960] text-amber-300 font-extrabold flex items-center justify-center text-base sm:text-lg shrink-0 shadow-xs">
                  {selectedStudentForDetail.name.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900">
                      {selectedStudentForDetail.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] sm:text-[11px] font-bold">
                      NIS: {selectedStudentForDetail.nis}
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                    Riwayat presensi siswa khusus <strong>Kelas {displayClassCode}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 4 Kotak Ringkasan Kehadiran Siswa */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-center">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Hadir</span>
                <div className="text-lg sm:text-xl font-black text-emerald-600 mt-0.5">
                  {selectedStudentForDetail.hadir}
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">Sesi Mapel</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Izin</span>
                <div className="text-lg sm:text-xl font-black text-blue-600 mt-0.5">
                  {selectedStudentForDetail.izin}
                </div>
                <span className="text-[10px] text-blue-700 font-medium">Sesi Mapel</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50 border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Sakit</span>
                <div className="text-lg sm:text-xl font-black text-amber-600 mt-0.5">
                  {selectedStudentForDetail.sakit}
                </div>
                <span className="text-[10px] text-amber-700 font-medium">Sesi Mapel</span>
              </div>
              <div className="p-2.5 sm:p-3 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-[10px] uppercase font-bold text-slate-400">Alpa</span>
                <div className="text-lg sm:text-xl font-black text-rose-600 mt-0.5">
                  {selectedStudentForDetail.alpa}
                </div>
                <span className="text-[10px] text-rose-700 font-medium">Sesi Mapel</span>
              </div>
            </div>

            {/* Tab Filter di dalam Modal */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 border-b border-slate-100 pb-2">
              <button
                onClick={() => setModalFilter("ABSEN_ONLY")}
                className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                  modalFilter === "ABSEN_ONLY"
                    ? "bg-[#0c3960] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Catatan Alpa & Izin ({selectedStudentForDetail.absences.length})
              </button>
              <button
                onClick={() => setModalFilter("ALL_SUBJECTS")}
                className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center ${
                  modalFilter === "ALL_SUBJECTS"
                    ? "bg-[#0c3960] text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                Rekap Semua Mata Pelajaran ({selectedStudentForDetail.subjectBreakdown.length})
              </button>
            </div>

            {/* TAB KONTEN 1: CATATAN ALPA & IZIN DI MAPEL APA */}
            {modalFilter === "ABSEN_ONLY" && (
              <div className="space-y-3">
                {selectedStudentForDetail.absences.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-800">
                      Siswa Hadir Penuh di Seluruh Mata Pelajaran!
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tidak ada catatan izin, sakit, maupun alpa yang tercatat bulan ini.
                    </p>
                  </div>
                ) : (
                  selectedStudentForDetail.absences.map((rec) => {
                    const isAlpa = rec.type === "ALPA";
                    const isIzin = rec.type === "IZIN";

                    return (
                      <div
                        key={rec.id}
                        className={`p-4 rounded-2xl border space-y-2 text-xs transition ${
                          isAlpa
                            ? "bg-rose-50/60 border-rose-200"
                            : isIzin
                            ? "bg-blue-50/60 border-blue-200"
                            : "bg-amber-50/60 border-amber-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-md font-extrabold text-[10px] uppercase ${
                                isAlpa
                                  ? "bg-rose-600 text-white"
                                  : isIzin
                                  ? "bg-blue-600 text-white"
                                  : "bg-amber-600 text-white"
                              }`}
                            >
                              {rec.type}
                            </span>
                            <span className="font-extrabold text-slate-900 text-sm">
                              {rec.subjectName} ({rec.subjectCode})
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {rec.date}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-[11px] text-slate-600">
                          <div className="flex items-center gap-1 font-medium">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>Guru Pengajar: <strong>{rec.teacherName}</strong></span>
                          </div>
                          <div className="flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>Waktu: {rec.time}</span>
                          </div>
                        </div>

                        <div className="bg-white p-3 rounded-xl border border-slate-200/80 text-[11px] text-slate-700 space-y-0.5">
                          <span className="font-bold text-slate-900">Catatan dari Guru Pengajar:</span>
                          <p className="leading-relaxed italic">"{rec.note}"</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB KONTEN 2: REKAP SEMUA MATA PELAJARAN */}
            {modalFilter === "ALL_SUBJECTS" && (
              <div className="space-y-2">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-3.5 py-2.5">Mata Pelajaran</th>
                        <th className="px-3.5 py-2.5">Guru Pengajar</th>
                        <th className="px-3 py-2.5 text-center">Hadir</th>
                        <th className="px-3 py-2.5 text-center">Izin</th>
                        <th className="px-3 py-2.5 text-center">Sakit</th>
                        <th className="px-3 py-2.5 text-center">Alpa</th>
                        <th className="px-3 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {selectedStudentForDetail.subjectBreakdown.map((sb) => {
                        const hasAlpa = sb.alpa > 0;
                        const hasIzin = sb.izin > 0;
                        return (
                          <tr key={sb.subjectCode} className="hover:bg-slate-50/50">
                            <td className="px-3.5 py-2.5 font-bold text-slate-900">
                              {sb.subjectName}
                            </td>
                            <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                              {sb.teacherName}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-emerald-600">
                              {sb.hadir}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-blue-600">
                              {sb.izin}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-amber-600">
                              {sb.sakit}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-rose-600">
                              {sb.alpa}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              {hasAlpa ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                                  Ada Alpa
                                </span>
                              ) : hasIzin ? (
                                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                                  Ada Izin
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Penuh
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Footer Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 font-medium">
                Tingkat kehadiran siswa ini:{" "}
                <strong className="text-slate-900">
                  {selectedStudentForDetail.persentase}
                </strong>
              </span>
              <button
                onClick={() => setSelectedStudentForDetail(null)}
                className="px-5 py-2.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
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

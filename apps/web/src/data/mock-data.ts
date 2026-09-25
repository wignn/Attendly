export interface Teacher {
  id: number;
  name: string;
  nip: string;
  subject: string;
  role: string; // "Wali Kelas 7B", "Wali Kelas 7A", atau "none"
  status: "Aktif" | "Nonaktif";
}

export interface ClassItem {
  id: string;
  code: string;
  name: string;
  tingkat: "7" | "8" | "9";
  percentage: number;
  wali: string;
  totalSiswa: number;
}

export interface Student {
  id: number;
  name: string;
  nis: string;
  wa: string;
  status: "Aktif" | "Nonaktif";
}

export interface RecentActivity {
  id: string;
  type: string;
  user: string;
  time: string;
}

export const initialTeachers: Teacher[] = [
  { id: 1, name: "Siti Rahmawati, S.Pd.", nip: "198504122010012004", subject: "Bahasa Indonesia", role: "Wali Kelas 7B", status: "Aktif" },
  { id: 2, name: "Budi Santoso, M.Pd.", nip: "197802152005011002", subject: "Matematika", role: "Wali Kelas 7A", status: "Aktif" },
  { id: 3, name: "Rina Marlina, S.Si.", nip: "199003212015022001", subject: "Ilmu Pengetahuan Alam (IPA)", role: "Wali Kelas 8A", status: "Aktif" },
  { id: 4, name: "Ahmad Fauzi, S.Pd.", nip: "198208102008011015", subject: "Bahasa Inggris", role: "none", status: "Aktif" },
  { id: 5, name: "Dedi Kurniawan, S.Pd.", nip: "198711122012011003", subject: "Pendidikan Jasmani (PJOK)", role: "Wali Kelas 9A", status: "Aktif" },
];

export const initialClasses: ClassItem[] = [
  { id: "7a", code: "7A", name: "Kelas 7A - Bahasa Indonesia", tingkat: "7", percentage: 96, wali: "Budi Santoso, M.Pd.", totalSiswa: 5 },
  { id: "7b", code: "7B", name: "Kelas 7B - Bahasa Indonesia", tingkat: "7", percentage: 94, wali: "Siti Rahmawati, S.Pd.", totalSiswa: 4 },
  { id: "7c", code: "7C", name: "Kelas 7C - Bahasa Indonesia", tingkat: "7", percentage: 91, wali: "Eko Prasetyo, S.Kom.", totalSiswa: 4 },
  { id: "7d", code: "7D", name: "Kelas 7D - Bahasa Indonesia", tingkat: "7", percentage: 97, wali: "Rina Marlina, S.Si.", totalSiswa: 3 },
  { id: "7e", code: "7E", name: "Kelas 7E - Bahasa Indonesia", tingkat: "7", percentage: 93, wali: "Dedi Kurniawan, S.Pd.", totalSiswa: 3 },
  { id: "7f", code: "7F", name: "Kelas 7F - Bahasa Indonesia", tingkat: "7", percentage: 95, wali: "Nurul Hidayah, M.Pd.", totalSiswa: 3 },
  { id: "8a", code: "8A", name: "Kelas 8A - Bahasa Indonesia", tingkat: "8", percentage: 95, wali: "Rina Marlina, S.Si.", totalSiswa: 4 },
  { id: "8b", code: "8B", name: "Kelas 8B - Matematika", tingkat: "8", percentage: 92, wali: "Budi Santoso, M.Pd.", totalSiswa: 4 },
  { id: "8c", code: "8C", name: "Kelas 8C - IPA Terpadu", tingkat: "8", percentage: 90, wali: "Siti Rahmawati, S.Pd.", totalSiswa: 3 },
  { id: "9a", code: "9A", name: "Kelas 9A - Bahasa Indonesia", tingkat: "9", percentage: 98, wali: "Dedi Kurniawan, S.Pd.", totalSiswa: 3 },
  { id: "9b", code: "9B", name: "Kelas 9B - Bahasa Inggris", tingkat: "9", percentage: 93, wali: "Ahmad Fauzi, S.Pd.", totalSiswa: 3 },
  { id: "9c", code: "9C", name: "Kelas 9C - IPA Terpadu", tingkat: "9", percentage: 96, wali: "Nurul Hidayah, M.Pd.", totalSiswa: 3 },
];

export const initialStudentsByClass: Record<string, Student[]> = {
  "7a": [
    { id: 101, name: "Aditya Pratama", nis: "20260701", wa: "081298765431", status: "Aktif" },
    { id: 102, name: "Alya Zahra", nis: "20260702", wa: "081298765432", status: "Aktif" },
    { id: 103, name: "Bagas Saputra", nis: "20260703", wa: "081298765433", status: "Aktif" },
    { id: 104, name: "Citra Kirana", nis: "20260704", wa: "081298765434", status: "Aktif" },
    { id: 105, name: "Dimas Anggara", nis: "20260705", wa: "081298765435", status: "Aktif" },
  ],
  "7b": [
    { id: 106, name: "Ahmad Fauzan", nis: "20260711", wa: "081311223341", status: "Aktif" },
    { id: 107, name: "Bella Safitri", nis: "20260712", wa: "081311223342", status: "Aktif" },
    { id: 108, name: "Candra Wijaya", nis: "20260713", wa: "081311223343", status: "Aktif" },
    { id: 109, name: "Dewi Lestari", nis: "20260714", wa: "081311223344", status: "Aktif" },
  ],
  "7c": [
    { id: 110, name: "Farhan Maulana", nis: "20260721", wa: "081566778811", status: "Aktif" },
    { id: 111, name: "Gita Permata", nis: "20260722", wa: "081566778812", status: "Aktif" },
    { id: 112, name: "Hendra Gunawan", nis: "20260723", wa: "081566778813", status: "Aktif" },
    { id: 113, name: "Indah Puspita", nis: "20260724", wa: "081566778814", status: "Aktif" },
  ],
  "8a": [
    { id: 201, name: "Salwa Alifa", nis: "20250801", wa: "081233445511", status: "Aktif" },
    { id: 202, name: "Taufik Hidayat", nis: "20250802", wa: "081233445512", status: "Aktif" },
    { id: 203, name: "Umar Bakri", nis: "20250803", wa: "081233445513", status: "Aktif" },
  ],
  "9a": [
    { id: 301, name: "Wahyu Ramadhan", nis: "20240901", wa: "081399881122", status: "Aktif" },
    { id: 302, name: "Yuliana Putri", nis: "20240902", wa: "081399881123", status: "Aktif" },
    { id: 303, name: "Zaki Mubarak", nis: "20240903", wa: "081399881124", status: "Aktif" },
  ],
};

export const initialDashboardMetrics = {
  totalStudents: 1248,
  totalTeachers: 56,
  attendanceToday: 94.2,
  activeClasses: 36,
};

export const weeklyTrends = [
  { day: "Sen", heightClass: "h-28", rate: "90.5%" },
  { day: "Sel", heightClass: "h-40", rate: "93.8%" },
  { day: "Rab", heightClass: "h-32", rate: "94.2%" },
  { day: "Kam", heightClass: "h-44", rate: "96.5%", isHighlight: true },
  { day: "Jum", heightClass: "h-36", rate: "92.4%" },
];

export const initialRecentActivities: RecentActivity[] = [
  { id: "1", type: "Login berhasil", user: "Pak Budi Santoso", time: "08:15" },
  { id: "2", type: "Absensi diinput", user: "Bu Sari — VII-A", time: "08:30" },
  { id: "3", type: "Data siswa diubah", user: "Admin Utama", time: "09:00" },
  { id: "4", type: "Login berhasil", user: "Bu Siti Rahmawati", time: "09:12" },
];

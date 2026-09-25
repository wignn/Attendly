"use client";

import * as React from "react";
import {
  initialClasses,
  initialStudentsByClass,
  ClassItem,
  Student,
} from "@/data/mock-data";
import {
  Users,
  Shapes,
  ArrowLeft,
  ArrowRight,
  UserPlus,
  PenSquare,
  Trash2,
  X,
  Search,
} from "lucide-react";

export default function SiswaPage() {
  // Navigation State
  // tier: 1 = pilih jenjang, 2 = pilih rombel, 3 = daftar siswa
  const [tier, setTier] = React.useState<1 | 2 | 3>(1);
  const [selectedTingkat, setSelectedTingkat] = React.useState<"7" | "8" | "9">("7");
  const [selectedClassId, setSelectedClassId] = React.useState<string>("7a");

  // Data State
  const [classes] = React.useState<ClassItem[]>(initialClasses);
  const [studentsMap, setStudentsMap] = React.useState<Record<string, Student[]>>(
    initialStudentsByClass
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [formNama, setFormNama] = React.useState("");
  const [formNis, setFormNis] = React.useState("");
  const [formNisn, setFormNisn] = React.useState("");
  const [formStatus, setFormStatus] = React.useState<"Aktif" | "Nonaktif">("Aktif");

  // Delete State
  const [deleteTarget, setDeleteTarget] = React.useState<Student | null>(null);

  const currentClass = React.useMemo(() => {
    return classes.find((c) => c.id === selectedClassId) || classes[0];
  }, [classes, selectedClassId]);

  const currentStudentList = React.useMemo(() => {
    const list = studentsMap[selectedClassId] || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.nis.includes(q) ||
        (s.nisn && s.nisn.includes(q))
    );
  }, [studentsMap, selectedClassId, searchQuery]);

  // Actions for Tier navigation
  const handleSelectTingkat = (num: "7" | "8" | "9") => {
    setSelectedTingkat(num);
    const firstClassInTingkat = classes.find((c) => c.tingkat === num);
    if (firstClassInTingkat) {
      setSelectedClassId(firstClassInTingkat.id);
    }
    setTier(2);
  };

  const handleSelectClass = (classId: string) => {
    setSelectedClassId(classId);
    setSearchQuery("");
    setTier(3);
  };

  // CRUD Actions
  const handleOpenAdd = () => {
    setEditingId(null);
    setFormNama("");
    setFormNis("");
    setFormNisn("");
    setFormStatus("Aktif");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Student) => {
    setEditingId(s.id);
    setFormNama(s.name);
    setFormNis(s.nis);
    setFormNisn(s.nisn || "");
    setFormStatus(s.status);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNama.trim() || !formNis.trim()) return;

    if (editingId) {
      setStudentsMap((prev) => ({
        ...prev,
        [selectedClassId]: (prev[selectedClassId] || []).map((s) =>
          s.id === editingId
            ? { ...s, name: formNama, nis: formNis, nisn: formNisn, status: formStatus }
            : s
        ),
      }));
    } else {
      const newStudent: Student = {
        id: Date.now(),
        name: formNama,
        nis: formNis,
        nisn: formNisn || undefined,
        status: formStatus,
      };
      setStudentsMap((prev) => ({
        ...prev,
        [selectedClassId]: [newStudent, ...(prev[selectedClassId] || [])],
      }));
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setStudentsMap((prev) => ({
      ...prev,
      [selectedClassId]: (prev[selectedClassId] || []).filter(
        (s) => s.id !== deleteTarget.id
      ),
    }));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================
          TIER 1: PILIHAN JENJANG / TINGKAT SISWA (7, 8, 9)
      ======================================================== */}
      {tier === 1 && (
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900">
              Pilih Jenjang / Tingkat Siswa
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Pilih tingkat 7, 8, atau 9 untuk mengelola data anggota siswa per rombongan belajar (rombel).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { num: "7" as const, title: "Kelas 7 (Tujuh)", desc: "Kurikulum Merdeka • Fase D", iconBg: "bg-blue-600" },
              { num: "8" as const, title: "Kelas 8 (Delapan)", desc: "Kurikulum Merdeka • Fase D", iconBg: "bg-emerald-600" },
              { num: "9" as const, title: "Kelas 9 (Sembilan)", desc: "Tingkat Akhir • Persiapan Kelulusan", iconBg: "bg-amber-600" },
            ].map((t) => {
              const rombels = classes.filter((c) => c.tingkat === t.num);
              const totalSiswa = rombels.reduce(
                (sum, c) => sum + (studentsMap[c.id] || []).length,
                0
              );

              return (
                <div
                  key={t.num}
                  onClick={() => handleSelectTingkat(t.num)}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs hover:border-[#0c3960] hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-2xl ${t.iconBg} text-white flex items-center justify-center font-extrabold text-xl shadow`}
                      >
                        {t.num}
                      </div>
                      <span className="px-3 py-1 bg-slate-100 group-hover:bg-[#0c3960] group-hover:text-white rounded-full text-slate-600 text-xs font-bold transition flex items-center gap-1">
                        <span>Pilih</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-800">{t.title}</h4>
                    <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Shapes className="w-3.5 h-3.5 text-slate-400" />
                      <span>{rombels.length} Rombel</span>
                    </span>
                    <span className="font-bold text-[#0c3960]">{totalSiswa} Siswa</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================
          TIER 2: PILIHAN ROMBEL KELAS
      ======================================================== */}
      {tier === 2 && (
        <div className="space-y-5">
          {/* Breadcrumb & Kembali */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setTier(1)}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Pilihan Jenjang (7, 8, 9)</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Jenjang Terpilih: Kelas {selectedTingkat}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {classes
              .filter((c) => c.tingkat === selectedTingkat)
              .map((c) => {
                const count = (studentsMap[c.id] || []).length;
                return (
                  <div
                    key={c.id}
                    onClick={() => handleSelectClass(c.id)}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-[#0c3960] hover:shadow-md transition cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-2.5 py-1 bg-blue-50 text-[#0c3960] font-bold text-xs rounded-lg">
                          {c.code}
                        </span>
                        <span className="text-xs text-emerald-600 font-bold">
                          {c.percentage}% Hadir
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{c.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Wali: <strong className="text-slate-700">{c.wali}</strong>
                      </p>
                    </div>

                    <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">{count} Siswa Terdaftar</span>
                      <span className="text-blue-700 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                        <span>Buka</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ========================================================
          TIER 3: DETAIL TABEL SISWA
      ======================================================== */}
      {tier === 3 && (
        <div className="space-y-5">
          {/* Breadcrumb & Kembali */}
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setTier(2)}
              className="inline-flex items-center gap-2 text-xs font-bold text-blue-700 hover:text-blue-800 transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Daftar Rombel Kelas {selectedTingkat}</span>
            </button>
            <span className="text-xs text-slate-500 font-medium">
              Manajemen Siswa / {currentClass.code}
            </span>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
            {/* Header Detail Kelas */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Daftar Siswa {currentClass.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Wali Kelas: <strong className="text-slate-700">{currentClass.wali}</strong> • Total:{" "}
                  {currentStudentList.length} Siswa
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari siswa atau NIS..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] w-48 sm:w-56"
                  />
                </div>

                {/* Tombol Tambah Siswa */}
                <button
                  onClick={handleOpenAdd}
                  className="bg-[#0c3960] hover:bg-[#092b49] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah Siswa</span>
                </button>
              </div>
            </div>

            {/* Tabel Siswa */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5 text-center w-12">No</th>
                    <th className="px-5 py-3.5">Nama Lengkap Siswa</th>
                    <th className="px-5 py-3.5">NIS</th>
                    <th className="px-5 py-3.5">NISN</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
                  {currentStudentList.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        Belum ada siswa terdaftar di rombel ini.
                      </td>
                    </tr>
                  ) : (
                    currentStudentList.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition">
                        <td className="px-5 py-3.5 text-center text-slate-400 font-medium">
                          {idx + 1}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-800">{s.name}</td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-600">
                          {s.nis}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-slate-400">
                          {s.nisn || "-"}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              s.status === "Aktif"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(s)}
                              className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                              title="Edit Siswa"
                            >
                              <PenSquare className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(s)}
                              className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Siswa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH / EDIT SISWA */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? "Edit Data Siswa" : `Tambah Siswa (${currentClass.code})`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Aditya Pratama"
                  value={formNama}
                  onChange={(e) => setFormNama(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIS (Nomor Induk Siswa)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 20260701"
                  value={formNis}
                  onChange={(e) => setFormNis(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NISN (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 0081234501"
                  value={formNisn}
                  onChange={(e) => setFormNisn(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Status Siswa
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as "Aktif" | "Nonaktif")}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden bg-white"
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Nonaktif">Nonaktif / Mutasi</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold cursor-pointer hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0c3960] hover:bg-[#092b49] text-white rounded-xl font-bold cursor-pointer transition shadow-xs"
                >
                  Simpan Siswa
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
                Hapus Siswa {deleteTarget.name}?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Data kehadiran siswa di rombel ini tidak akan lagi tercatat.
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold cursor-pointer transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

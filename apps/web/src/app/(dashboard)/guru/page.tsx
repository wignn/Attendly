"use client";

import * as React from "react";
import { initialTeachers, Teacher } from "@/data/mock-data";
import {
  GraduationCap,
  Plus,
  PenSquare,
  Trash2,
  X,
  Search,
} from "lucide-react";

export default function GuruPage() {
  const [teachers, setTeachers] = React.useState<Teacher[]>(initialTeachers);
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  const [formName, setFormName] = React.useState("");
  const [formNip, setFormNip] = React.useState("");
  const [formSubject, setFormSubject] = React.useState("");
  const [formRole, setFormRole] = React.useState("none");

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = React.useState<Teacher | null>(null);

  const filteredTeachers = React.useMemo(() => {
    if (!searchQuery.trim()) return teachers;
    const q = searchQuery.toLowerCase();
    return teachers.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.nip.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormName("");
    setFormNip("");
    setFormSubject("");
    setFormRole("none");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingId(t.id);
    setFormName(t.name);
    setFormNip(t.nip);
    setFormSubject(t.subject);
    setFormRole(t.role);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formNip.trim()) return;

    if (editingId) {
      // Edit mode
      setTeachers((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? { ...item, name: formName, nip: formNip, subject: formSubject, role: formRole }
            : item
        )
      );
    } else {
      // Add mode
      const newTeacher: Teacher = {
        id: Date.now(),
        name: formName,
        nip: formNip,
        subject: formSubject || "Guru Mapel",
        role: formRole,
        status: "Aktif",
      };
      setTeachers((prev) => [newTeacher, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setTeachers((prev) => prev.filter((t) => t.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Container Tabel Utama */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Manajemen Guru & Peran</h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Kelola NIP, mata pelajaran yang diampu, dan penugasan sebagai wali kelas SMPN 1 Tirtajaya
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari guru atau NIP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0c3960] w-48 sm:w-60"
              />
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

        {/* Tabel Data Guru */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[11px]">
              <tr>
                <th className="px-4 py-3.5">Nama Guru</th>
                <th className="px-4 py-3.5">NIP</th>
                <th className="px-4 py-3.5">Mata Pelajaran</th>
                <th className="px-4 py-3.5">Peran Tambahan</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
              {filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data guru yang cocok.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition">
                    <td className="px-4 py-3.5 font-bold text-slate-800">{g.name}</td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">{g.nip}</td>
                    <td className="px-4 py-3.5 font-medium">{g.subject}</td>
                    <td className="px-4 py-3.5">
                      {g.role !== "none" ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 font-semibold text-[11px]">
                          {g.role}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Hanya Guru Mapel</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        {g.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEdit(g)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                          title="Edit Data"
                        >
                          <PenSquare className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(g)}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Hapus Guru"
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

        {/* Footer Counter */}
        <div className="text-xs text-slate-400 font-medium pt-2">
          Menampilkan {filteredTeachers.length} dari {teachers.length} guru terdaftar
        </div>
      </div>

      {/* MODAL TAMBAH / EDIT GURU */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? "Edit Data Guru" : "Tambah Guru Baru"}
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
                  Nama Lengkap & Gelar
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Rahmawati, S.Pd."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIP Guru
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 198504122010012004"
                  value={formNip}
                  onChange={(e) => setFormNip(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mata Pelajaran Utama
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Bahasa Indonesia"
                  value={formSubject}
                  onChange={(e) => setFormSubject(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Peran Tambahan (Wali Kelas)
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:ring-1 focus:ring-[#0c3960] focus:outline-hidden bg-white"
                >
                  <option value="none">Tidak Merangkap (Hanya Guru Mapel)</option>
                  <option value="Wali Kelas 7A">Wali Kelas 7A</option>
                  <option value="Wali Kelas 7B">Wali Kelas 7B</option>
                  <option value="Wali Kelas 8A">Wali Kelas 8A</option>
                  <option value="Wali Kelas 8B">Wali Kelas 8B</option>
                  <option value="Wali Kelas 9A">Wali Kelas 9A</option>
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
                  Simpan Data
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
                Hapus Guru {deleteTarget.name}?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Data penugasan dan peran wali kelas akan dicabut dari guru ini.
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

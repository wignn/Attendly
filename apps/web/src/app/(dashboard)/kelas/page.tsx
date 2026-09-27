"use client";

import * as React from "react";
import Link from "next/link";
import {
  Shapes,
  Search,
  ChevronRight,
  AlertCircle,
  RefreshCw,
  School,
  Users,
} from "lucide-react";
import { useClassesOptions } from "@/hooks/use-attendance-sessions";

export default function KelasIndexPage() {
  const [searchQuery, setSearchQuery] = React.useState("");

  const {
    data: classes = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useClassesOptions();

  const filteredClasses = React.useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const q = searchQuery.toLowerCase();
    return classes.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.grade && c.grade.toLowerCase().includes(q))
    );
  }, [classes, searchQuery]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-3 py-1 rounded-full bg-blue-50 text-[#0c3960] text-[11px] font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Shapes className="w-3.5 h-3.5 text-[#0c3960]" />
              Data Rombel & Presensi
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Daftar Kelas & Rekap Presensi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
            Pilih rombongan belajar (rombel) untuk melihat laporan kehadiran detail per siswa dan mata pelajaran.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${
                isFetching ? "animate-spin" : ""
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-xs flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari kelas berdasarkan nama (contoh: 7A, 8B, Kelas 9)..."
          className="w-full text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-hidden bg-transparent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1"
          >
            Reset
          </button>
        )}
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
        <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold">Gagal Memuat Daftar Kelas</h4>
            <p className="text-xs text-rose-600">
              {error instanceof Error ? error.message : "Terjadi kesalahan pada server."}
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
      {!isLoading && !isError && filteredClasses.length === 0 && (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Shapes className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Tidak Ada Kelas Ditemukan
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery
              ? `Tidak ada rombel yang cocok dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
              : "Belum ada data rombongan belajar aktif yang terdaftar di sistem."}
          </p>
        </div>
      )}

      {/* Classes Grid */}
      {!isLoading && !isError && filteredClasses.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredClasses.map((cls) => (
            <div
              key={cls.id}
              className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-[#0c3960]/30 hover:shadow-md transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0c3960] font-black text-sm flex items-center justify-center border border-blue-100">
                    {cls.code || cls.name.slice(0, 3)}
                  </div>
                  {cls.grade && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                      Tingkat {cls.grade}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-black text-slate-900 group-hover:text-[#0c3960] transition-colors">
                  {cls.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
                  <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Kode: {cls.code}</span>
                  {cls.section && <span>• Bagian {cls.section}</span>}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rekap Siswa</span>
                </span>
                <Link
                  href={`/kelas/${cls.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0c3960] hover:bg-[#0a2e4e] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <span>Detail Presensi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

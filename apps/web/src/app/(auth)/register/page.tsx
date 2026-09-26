"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { School, User, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        role: "TEACHER",
      });
      router.push("/portal-guru");
    } catch (err: any) {
      setError(err?.message || "Pendaftaran akun gagal. Silakan periksa kembali data Anda.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf5e6] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand & School Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0c3960] flex items-center justify-center text-white shadow-lg shadow-blue-900/20 border-2 border-amber-300">
            <School className="w-9 h-9 text-amber-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            SMPN 1 Tirtajaya
          </h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Registrasi Akun Guru Baru
          </p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Daftar Akun Guru</h2>
            <p className="text-xs text-slate-500">
              Lengkapi data berikut untuk membuat akses mandiri portal presensi
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nama Lengkap &amp; Gelar</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="Mis. Siti Rahmawati, S.Pd."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960] focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Sekolah</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="guru@smpn1tirtajaya.sch.id"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960] focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Kata Sandi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  placeholder="Minimal 8 karakter..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960] focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#0c3960] hover:bg-[#0a2e4e] text-white text-xs font-bold shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Mendaftarkan Akun...</span>
                </>
              ) : (
                <>
                  <span>Daftar Sekarang</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              Sudah memiliki akun?{" "}
              <Link href="/login" className="font-bold text-[#0c3960] hover:underline">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>© 2026 SMPN 1 Tirtajaya • Kabupaten Karawang</p>
        </div>
      </div>
    </div>
  );
}

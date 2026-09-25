"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuthRole, UserRole, DEMO_PROFILES } from "@/context/auth-role-context";
import {
  School,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap,
  UsersRound,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, loginAsDemo } = useAuthRole();

  const [email, setEmail] = React.useState("admin@smpn1tirtajaya.sch.id");
  const [password, setPassword] = React.useState("••••••••");
  const [showPassword, setShowPassword] = React.useState(false);
  const [rememberMe, setRememberMe] = React.useState(true);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Gagal masuk ke sistem. Silakan periksa kembali data Anda.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: UserRole) => {
    const prof = DEMO_PROFILES[role];
    setEmail(prof.email);
    setPassword("password123");
    loginAsDemo(role);
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
            Sistem Absensi & Presensi Terpadu
          </p>
        </div>

        {/* Demo Fast Login Pills (Urgent Role Testing) */}
        <div className="bg-white/80 backdrop-blur-xs border border-amber-200/80 rounded-2xl p-3.5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
            <span>Login Cepat Pengujian (Role Selector):</span>
            <span className="text-[10px] text-amber-600 bg-amber-100 font-extrabold px-1.5 py-0.5 rounded">
              Demo Ready
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo("SUPER_ADMIN")}
              className="flex flex-col items-center p-2 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100 text-emerald-900 text-left transition cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600 mb-1" />
              <span className="text-[11px] font-bold leading-tight">Super Admin</span>
              <span className="text-[9px] text-slate-500">Admin Utama</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("TEACHER")}
              className="flex flex-col items-center p-2 rounded-xl border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-900 text-left transition cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 text-blue-600 mb-1" />
              <span className="text-[11px] font-bold leading-tight">Guru Mapel</span>
              <span className="text-[9px] text-slate-500">Bu Siti (BIN)</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemo("HOMEROOM_TEACHER")}
              className="flex flex-col items-center p-2 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-amber-900 text-left transition cursor-pointer"
            >
              <UsersRound className="w-4 h-4 text-amber-600 mb-1" />
              <span className="text-[11px] font-bold leading-tight">Wali Kelas</span>
              <span className="text-[9px] text-slate-500">Pak Budi (7A)</span>
            </button>
          </div>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Masuk ke Akun</h2>
            <p className="text-xs text-slate-500">
              Gunakan email dinas atau akun Google resmi sekolah Anda
            </p>
          </div>

          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Email Sekolah / NIP</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@smpn1tirtajaya.sch.id"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960] focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Kata Sandi</label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Silakan hubungi Administrator Tata Usaha untuk reset kata sandi.");
                  }}
                  className="text-[11px] font-semibold text-blue-700 hover:underline"
                >
                  Lupa Sandi?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960] focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#0c3960] focus:ring-[#0c3960] cursor-pointer"
              />
              <label htmlFor="remember-me" className="ml-2 text-xs text-slate-600 cursor-pointer">
                Ingat sesi login saya
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#0c3960] hover:bg-[#0a2e4e] text-white text-xs font-bold shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <span>Memproses Masuk...</span>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white px-2 text-slate-400">Atau Masuk Dengan</span>
            </div>
          </div>

          {/* Google SSO Button (KOM-6 Backend Alignment) */}
          <button
            type="button"
            onClick={() => handleQuickDemo("SUPER_ADMIN")}
            className="w-full py-2.5 px-4 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-3 transition cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Masuk dengan Akun Google Sekolah</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>© 2026 SMPN 1 Tirtajaya • Kabupaten Karawang</p>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Server Terproteksi
            </span>
            <span>•</span>
            <span>Versi 1.0.0 (KOM-16)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

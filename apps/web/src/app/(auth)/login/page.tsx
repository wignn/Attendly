"use client";

import * as React from "react";
import Script from "next/script";
import { useAuthRole } from "@/context/auth-role-context";
import {
  School,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuthRole();
  const googleButtonRef = React.useRef<HTMLDivElement>(null);

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [googleReady, setGoogleReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const handleGoogleScriptLoad = React.useCallback(() => {
    if (!window.google || !googleButtonRef.current || !googleClientId) return;
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async ({ credential }) => {
        setError(null);
        setLoading(true);
        try {
          await loginWithGoogle(credential);
        } catch (err: any) {
          setError(
            err?.message ||
              "Login Google gagal. Pastikan akun email Anda telah didaftarkan oleh administrator."
          );
        } finally {
          setLoading(false);
        }
      },
    });
    window.google.accounts.id.renderButton(googleButtonRef.current, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 360,
    });
    setGoogleReady(true);
  }, [googleClientId, loginWithGoogle]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      if (err?.code === "INVALID_CREDENTIALS") {
        setError("Email atau kata sandi tidak sesuai. Periksa kembali akun Anda.");
      } else {
        setError(err?.message || "Gagal masuk ke sistem. Silakan coba beberapa saat lagi.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fbf5e6] flex flex-col justify-center items-center px-4 py-8 sm:px-6 lg:px-8">
      {googleClientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={handleGoogleScriptLoad}
        />
      )}
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-[#0c3960] flex items-center justify-center text-white shadow-lg shadow-blue-900/20 border-2 border-amber-300">
            <School className="w-9 h-9 text-amber-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SMPN 1 Tirtajaya</h1>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Sistem Absensi & Presensi Terpadu
          </p>
        </div>

        {/* Main Login Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Masuk ke Akun</h2>
            <p className="text-xs text-slate-500">
              Gunakan akun yang telah disiapkan oleh Super Admin atau Tata Usaha
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-xs font-bold text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nama@sekolah.sch.id"
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960] focus:border-transparent transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-bold text-slate-700">
                  Kata Sandi
                </label>
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert("Silakan hubungi Administrator Tata Usaha untuk reset kata sandi akun Anda.");
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
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi..."
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0c3960] focus:border-transparent transition"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#0c3960] hover:bg-[#0a2e4e] text-white text-xs font-bold shadow-md shadow-blue-900/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Memproses Masuk...</span>
                </>
              ) : (
                <>
                  <span>Masuk dengan Email</span>
                  <ArrowRight className="w-4 h-4 text-amber-300" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-white px-2 text-slate-400">Atau masuk dengan Google</span>
            </div>
          </div>

          {googleClientId ? (
            <div className="flex justify-center min-h-10" aria-busy={!googleReady}>
              <div ref={googleButtonRef} />
            </div>
          ) : (
            <p className="text-center text-xs text-amber-700">
              Login Google belum dikonfigurasi. Hubungi administrator.
            </p>
          )}

          <p className="text-center text-[11px] text-slate-500">
            Akun hanya dapat digunakan setelah disiapkan oleh Super Admin.
          </p>
        </div>

        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>© 2026 SMPN 1 Tirtajaya • Kabupaten Karawang</p>
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Server Terproteksi
            </span>
            <span>•</span>
            <span>Versi 1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

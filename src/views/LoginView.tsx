import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  User,
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  ShieldCheck,
  GraduationCap,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

const LOGO_STORAGE_KEY = 'ADM_GURU_PORTAL_LOGO';

export const LoginView: React.FC = () => {
  const { login, showNotification } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Permanent portal logo (Patented - read from storage, cannot be changed)
  const [portalLogo] = useState<string | null>(() => {
    return localStorage.getItem(LOGO_STORAGE_KEY);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const success = login(username, password);
      if (success) {
        showNotification(
          'success',
          'Selamat Datang Bapak NANANG ARIFIN, S.Pd.! Akses Sistem Administrasi Guru berhasil dibuka.'
        );
      } else {
        setErrorMessage(
          'Username atau Password tidak sesuai. Silakan periksa kembali kredensial Anda.'
        );
        showNotification(
          'error',
          'Login Gagal: Silakan periksa username dan password Anda.'
        );
      }
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-950 via-teal-950 to-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans">
      {/* Background Animated Ambient Lighting Orbs */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -top-10 right-1/3 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glassmorphism Login Card */}
      <div className="w-full max-w-md bg-slate-900/85 backdrop-blur-2xl rounded-3xl border border-teal-500/30 shadow-2xl overflow-hidden relative z-10 text-white animate-scale-up">
        {/* Top Header Section with Patented Portal Logo */}
        <div className="p-6 sm:p-8 text-center border-b border-slate-800 bg-gradient-to-b from-teal-950/80 to-transparent relative">
          
          {/* Permanent Logo Container (Paten / Permanen) */}
          <div className="inline-block mb-3 max-w-full">
            <div
              className={`inline-flex items-center justify-center rounded-2xl shadow-xl border-2 select-none ${
                portalLogo
                  ? 'p-2.5 bg-white/95 border-teal-400/80 shadow-teal-500/20 max-w-[280px] max-h-36 min-w-[100px] min-h-[90px]'
                  : 'w-20 h-20 bg-gradient-to-br from-teal-500 to-emerald-600 text-slate-950 font-black shadow-teal-500/30 border-teal-300/50'
              }`}
            >
              {portalLogo ? (
                <img
                  src={portalLogo}
                  alt="Logo Portal Resmi Administrasi Guru"
                  className="max-h-32 max-w-full object-contain rounded-xl select-none"
                />
              ) : (
                <GraduationCap className="w-10 h-10" />
              )}
            </div>
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-black uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
              <span>Portal Otentikasi Terproteksi</span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
            Administrasi Guru Kurikulum Merdeka
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
            BSKAP No. 046/H/KR/2025 &amp; Pembelajaran Mendalam (Deep Learning)
          </p>
        </div>

        {/* Login Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {/* Error Alert Message */}
          {errorMessage && (
            <div className="bg-rose-500/15 border border-rose-500/40 text-rose-200 p-3.5 rounded-2xl text-xs flex items-start gap-2.5 animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-rose-300 block">Akses Ditolak</span>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {/* User Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              User / Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4 text-teal-400" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan User..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800/90 border border-slate-700/90 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4 text-teal-400" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan Password..."
                className="w-full pl-10 pr-11 py-3 bg-slate-800/90 border border-slate-700/90 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
                title={showPassword ? 'Sembunyikan Password' : 'Tampilkan Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg shadow-teal-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 border border-teal-300/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Memverifikasi Kredensial...</span>
              </span>
            ) : (
              <>
                <span>Masuk Ke Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Requested Email Notice Banner */}
          <div className="bg-gradient-to-r from-teal-950/90 via-slate-900 to-teal-950/90 border border-teal-500/30 rounded-2xl p-4 text-center text-xs space-y-1 shadow-inner">
            <div className="inline-flex items-center gap-1.5 text-amber-300 font-extrabold text-[11px]">
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>Permintaan Akses &amp; Lisensi Pengguna</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Jika Anda ingin menggunakan aplikasi ini bisa kirim email ke:
            </p>
            <a
              href="mailto:arifinnanang8@gmail.com"
              className="inline-block font-extrabold text-teal-300 hover:text-teal-200 hover:underline text-xs tracking-wide bg-teal-900/50 px-3 py-1 rounded-lg border border-teal-500/40 mt-1 transition-colors"
            >
              arifinnanang8@gmail.com
            </a>
          </div>
        </form>

        {/* Footer info */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 text-center text-[10px] text-slate-400">
          <p>© 2026 Admin Guru Kurikulum Merdeka • SMK Ma'arif 1 Sendang Agung</p>
        </div>
      </div>
    </div>
  );
};

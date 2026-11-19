import React from 'react';
import { useApp } from '../context/AppContext';
import {
  FolderKanban,
  FileCheck,
  Database,
  RefreshCw,
  Sparkles,
  DownloadCloud,
  HardDrive,
  FileBadge2,
  ChevronRight,
  School,
  User,
  LogOut,
  Save,
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    schoolProfile,
    stats,
    setActiveView,
    runMasterSync,
    currentUser,
    logout,
    lastAutosavedAt,
    supabaseConnected,
  } = useApp();

  return (
    <header className="bg-gradient-to-br from-[#063b2c] via-[#043325] to-[#022319] text-white pt-6 pb-5 px-4 sm:px-6 lg:px-8 border-b border-emerald-950/60 shadow-lg relative overflow-hidden">
      {/* Subtle ambient background glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 left-10 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs font-medium">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-600/50 backdrop-blur-sm shadow-xs">
            <FileBadge2 className="w-3.5 h-3.5 text-emerald-300" />
            <span className="font-semibold">Regulasi Resmi: BSKAP 046/2025 · Permendikbudristek 12/2024 &amp; 13/2025 · KMA 1503/2025</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 text-emerald-300/90 border border-emerald-800/40 backdrop-blur-sm">
            <span>{schoolProfile.subject}</span>
            <span className="opacity-40">•</span>
            <span>Fase {schoolProfile.fase} ({schoolProfile.grade})</span>
            <span className="opacity-40">•</span>
            <span>Tahun Ajaran {schoolProfile.academicYear} (Smt {schoolProfile.semester})</span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/80 text-teal-200 border border-teal-600/50 backdrop-blur-sm shadow-xs font-mono text-[11px]">
            <Save className="w-3.5 h-3.5 text-teal-300 animate-pulse" />
            <span>Autosave Aktif · Pukul {lastAutosavedAt || '00:00'}</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('database')}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 hover:bg-emerald-900 text-emerald-100 border border-emerald-500/40 backdrop-blur-sm shadow-xs text-[11px] font-semibold transition-colors cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                supabaseConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span>DB: {supabaseConnected ? 'Supabase Terhubung' : 'Lokal + Supabase Siap'}</span>
          </button>
        </div>

        {/* Main Title & Kesiapan Berkas Card */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-5">
          <div className="space-y-1.5 max-w-3xl">
            <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-tight text-white flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span>Dashboard Administrasi Guru</span>
              <span className="text-emerald-400 font-light hidden sm:inline">·</span>
              <span className="text-emerald-200 text-lg sm:text-2xl font-bold">
                Kurikulum Merdeka &amp; Pembelajaran Mendalam
              </span>
            </h1>
            <p className="text-xs sm:text-[13px] text-emerald-200/90 font-medium leading-relaxed">
              Berlandaskan KepKa BSKAP No. 046/H/KR/2025, Permendikbudristek No. 12 Tahun 2024, Permendikbudristek Nomor 13 Tahun 2025, dan KMA No. 1503 Tahun 2025
            </p>
            <p className="text-xs text-emerald-100/80 flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5">
              <span className="font-semibold text-emerald-200">{schoolProfile.teacherName}</span>
              <span className="text-emerald-300/80">{schoolProfile.teacherIdType || 'NIP'}: {schoolProfile.teacherNip}</span>
              <span className="text-emerald-500">•</span>
              <span className="font-medium text-white/90 flex items-center gap-1">
                <School className="w-3.5 h-3.5 inline text-emerald-400" />
                {schoolProfile.schoolName}
              </span>
              <span className="text-emerald-500">•</span>
              <span className="text-emerald-300/80">KS: {schoolProfile.headmasterName}</span>
            </p>
          </div>

          {/* Kesiapan Berkas 1 Tahun Card */}
          <div className="bg-[#054432]/85 hover:bg-[#064c38] transition-all border border-emerald-500/30 rounded-2xl p-4 sm:w-80 shadow-inner backdrop-blur-md">
            <div className="flex items-center justify-between text-xs font-semibold mb-2">
              <span className="text-emerald-100">Kesiapan Berkas 1 Tahun</span>
              <span className="text-emerald-300 font-bold text-sm">{stats.kesiapanPct}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-emerald-950/80 rounded-full h-2 mb-2 overflow-hidden border border-emerald-700/30">
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-300 h-2 rounded-full transition-all duration-700"
                style={{ width: `${stats.kesiapanPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-emerald-200/80">{stats.kesiapanCount} dari {stats.kesiapanCount} dokumen siap</span>
              <button
                onClick={() => setActiveView('bundel')}
                className="text-emerald-200 hover:text-white font-semibold flex items-center gap-0.5 group transition-colors cursor-pointer"
              >
                <span>Buka Bundel</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* Action Button Row */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-emerald-800/40">
          <button
            onClick={() => setActiveView('bundel')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FolderKanban className="w-3.5 h-3.5 text-slate-950" />
            <span>Bundel Lengkap 1 Tahun</span>
          </button>

          <button
            onClick={() => setActiveView('cover')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 hover:text-white border border-emerald-600/40 text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            <FileCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Cover &amp; Pengesahan</span>
          </button>

          <button
            onClick={() => setActiveView('bank_cp')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 hover:text-white border border-emerald-600/40 text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-emerald-300" />
            <span>Bank CP (BSKAP 2025)</span>
          </button>

          <button
            onClick={runMasterSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/40 text-xs font-semibold shadow transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Master Sync (1-Klik)</span>
          </button>

          <button
            onClick={() => setActiveView('ai_asisten')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600/80 to-amber-700/80 hover:from-amber-500 hover:to-amber-600 text-amber-100 hover:text-white border border-amber-500/40 text-xs font-semibold shadow transition-all active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Asisten</span>
          </button>

          <button
            onClick={() => setActiveView('pusat_unduh')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 hover:text-white border border-emerald-600/40 text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            <DownloadCloud className="w-3.5 h-3.5 text-emerald-300" />
            <span>Pusat Unduh</span>
          </button>

          <button
            onClick={() => setActiveView('backup')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100 hover:text-white border border-emerald-600/40 text-xs font-medium transition-all active:scale-95 cursor-pointer"
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-300" />
            <span>Backup Data</span>
          </button>

          <button
            onClick={() => setActiveView('database')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white border border-teal-400/50 text-xs font-semibold shadow transition-all active:scale-95 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-teal-100" />
            <span>Integrasi Database</span>
          </button>

          {/* User Account & Logout Button */}
          <div className="flex items-center gap-2 ml-auto pl-2 border-l border-emerald-800/60">
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-950/80 border border-emerald-700/50 text-[11px] font-bold text-emerald-200">
              <User className="w-3.5 h-3.5 text-teal-400" />
              <span>{currentUser || 'NANANG ARIFIN'}</span>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-900/50 hover:bg-rose-800 text-rose-200 hover:text-white border border-rose-600/40 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              title="Keluar dari Akun"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

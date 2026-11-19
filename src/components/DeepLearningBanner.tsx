import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ArrowRight,
  Download,
  Lightbulb,
  HeartHandshake,
} from 'lucide-react';

export const DeepLearningBanner: React.FC = () => {
  const { setActiveView, openPrintModal } = useApp();

  return (
    <div className="bg-gradient-to-r from-[#032d20] via-[#043d2c] to-[#022319] text-white rounded-2xl p-5 sm:p-6 my-5 border border-emerald-500/40 shadow-md relative overflow-hidden">
      {/* Decorative background light */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-3xl">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/90 text-emerald-300 text-xs font-semibold border border-emerald-600/50">
            <span className="uppercase tracking-wide">Inovasi Kemendikdasmen RI</span>
            <span className="text-emerald-500">|</span>
            <span className="text-emerald-200">Pendekatan Deep Learning (Mindful, Meaningful, Joyful)</span>
          </div>

          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Hasil Modul Deep Learning: 3 Pilar Pembelajaran Mendalam
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
            Memadukan pengalaman berkesadaran (Mindful Inquiring), koneksi dunia nyata (Meaningful Dialogue), dan perayaan karya kolaboratif (Joyful Celebration), lengkap dengan rubrik penilaian autentik dan LKPD siap ajar.
          </p>

          {/* 3 Pillars badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#084d39] text-emerald-200 text-xs font-medium border border-emerald-600/40 shadow-sm">
              <span className="text-emerald-400 text-sm">🌿</span>
              <span>Mindful: Hening Cipta & Refleksi Fokus</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#084d39] text-amber-200 text-xs font-medium border border-amber-600/40 shadow-sm">
              <Lightbulb className="w-3.5 h-3.5 text-amber-300" />
              <span>Meaningful: Masalah Nyata & Aplikasi Hidup</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#084d39] text-amber-200 text-xs font-medium border border-amber-600/40 shadow-sm">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
              <span>Joyful: Pameran Karya & Apresiasi Kolaboratif</span>
            </span>
          </div>
        </div>

        {/* Right CTA Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
          <button
            onClick={() => setActiveView('modul_ajar')}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg hover:shadow-emerald-400/20 transition-all active:scale-95 cursor-pointer"
          >
            <span>Buka Modul Deep Learning</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => openPrintModal('modul_ajar')}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#032a1e] hover:bg-[#053728] text-emerald-100 hover:text-white border border-emerald-700/60 font-medium text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>Unduh Dokumen Modul</span>
          </button>
        </div>
      </div>
    </div>
  );
};

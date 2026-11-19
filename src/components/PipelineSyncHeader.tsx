import React from 'react';
import { useApp } from '../context/AppContext';
import { BookOpen, RefreshCw, Layers, ArrowRight } from 'lucide-react';

export const PipelineSyncHeader: React.FC = () => {
  const { selectedBook, runMasterSync, showNotification } = useApp();

  const handleSyncPipeline = () => {
    runMasterSync();
    showNotification(
      'success',
      'Sinkronisasi Pipeline Kurikulum Berhasil: Kalender/RPE (MEF & JP) → Analisis CP/ATP → PROTA → PROMES → Modul Ajar → LKPD → Penilaian Rapor telah diselaraskan dengan buku terpilih!'
    );
  };

  return (
    <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-xl border border-emerald-500/30 mb-6 flex flex-col lg:flex-row items-center justify-between gap-4">
      {/* Left: Active Book & Publisher Filter Info */}
      <div className="flex items-center gap-3.5 w-full lg:w-auto">
        <div className="w-14 h-18 bg-white/10 rounded-xl overflow-hidden border border-white/20 shrink-0 flex items-center justify-center">
          {selectedBook?.coverDataUri ? (
            <img src={selectedBook.coverDataUri} alt={selectedBook.judulBuku} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-6 h-6 text-emerald-400" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase tracking-wider border border-emerald-500/30">
              Buku Pilihan (Filter Penerbit) & CP/ATP Diterapkan
            </span>
            <span className="text-[10px] text-slate-300 font-mono">
              {selectedBook?.penerbit || 'Pusat Perbukuan BSKAP Kemendikdasmen RI'}
            </span>
          </div>
          <h2 className="text-sm font-black text-white mt-0.5">
            {selectedBook?.judulBuku || 'Cerdas Cergas Berbahasa dan Bersastra Indonesia Kelas X'}
          </h2>
          <p className="text-[11px] text-slate-300">
            Penulis: <span className="font-bold text-emerald-300">{selectedBook?.pengarang || 'Fadillah Tri Aulia & Sefi Indra Gumilar'}</span> • Tahun: {selectedBook?.tahunTerbit || '2026'} • ISBN: {selectedBook?.isbn || '978-602-244-325-4'}
          </p>
        </div>
      </div>

      {/* Center/Right: Pipeline Indicator & Sync Button */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto justify-end">
        <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-bold text-slate-300 bg-white/5 px-3 py-2 rounded-xl border border-white/10">
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Kalender/RPE</span>
          <ArrowRight className="w-3 h-3 text-emerald-400" />
          <span>CP/ATP</span>
          <ArrowRight className="w-3 h-3 text-emerald-400" />
          <span>PROTA</span>
          <ArrowRight className="w-3 h-3 text-emerald-400" />
          <span>PROMES</span>
          <ArrowRight className="w-3 h-3 text-emerald-400" />
          <span>Modul Ajar</span>
          <ArrowRight className="w-3 h-3 text-emerald-400" />
          <span>LKPD</span>
          <ArrowRight className="w-3 h-3 text-emerald-400" />
          <span>Rapor</span>
        </div>

        <button
          onClick={handleSyncPipeline}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer border border-emerald-400/40"
          title="Sinkronisasi Otomatis Seluruh Pipeline Kalender/RPE → CP/ATP → PROTA → PROMES → Modul Ajar → LKPD → Penilaian Rapor"
        >
          <RefreshCw className="w-4 h-4 animate-spin-slow" />
          <span>Sinkronisasi Pipeline Kurikulum</span>
        </button>
      </div>
    </div>
  );
};

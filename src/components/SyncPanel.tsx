import React from 'react';
import { useApp } from '../context/AppContext';
import { RefreshCw, BarChart3, Check } from 'lucide-react';

export const SyncPanel: React.FC = () => {
  const { stats, runMasterSync, setActiveView } = useApp();

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm my-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-2">
          {/* Top Status */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              Status Keselarasan Dokumen
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {stats.alignmentAudit.alignmentPercentage}% Selaras Otomatis
            </span>
          </div>

          {/* Heading */}
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            Sinkronisasi Data Proses Seluruh Dokumen (1 Tahun)
          </h3>

          {/* Pipeline flow */}
          <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
            Memastikan seluruh dokumen tersinkronisasi mulus:{' '}
            <span className="font-semibold text-slate-800">
              Kalender/RPE (MEF & JP) → Analisis CP/ATP → PROTA → PROMES → Modul Ajar → LKPD → Penilaian Rapor.
            </span>
          </p>

          {/* 4 Checklist items */}
          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-medium text-slate-700">
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              PROTA ({stats.protaTotalJp} JP)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              PROMES ({stats.protaTotalJp > 0 ? '7 Baris' : '0 Baris'})
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              Modul ({stats.modulCount} Unit)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              Penilaian ({stats.totalStudents} Siswa)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
          <button
            onClick={runMasterSync}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Pusat Sinkronisasi (1-Klik)</span>
          </button>

          <button
            onClick={() => setActiveView('analisis_perangkat')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 font-medium text-xs sm:text-sm transition-all active:scale-95 cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-slate-500" />
            <span>Matriks Keselarasan</span>
          </button>
        </div>
      </div>
    </div>
  );
};

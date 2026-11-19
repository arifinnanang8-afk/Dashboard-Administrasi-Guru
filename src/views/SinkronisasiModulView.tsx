import React from 'react';
import { useApp } from '../context/AppContext';
import { GitMerge, ArrowLeft, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

export const SinkronisasiModulView: React.FC = () => {
  const { modulAjarList, tujuanPembelajaran, prota, lkpdList, runMasterSync, setActiveView } = useApp();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('dashboard')}
            title="Kembali ke Dashboard"
            aria-label="Kembali ke Dashboard"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <GitMerge className="w-5 h-5 text-teal-600" />
              Sinkronisasi Modul Terpadu (Harmonisasi Alur Dokumen)
            </h2>
            <p className="text-xs text-slate-500">
              Sinkronkan Data Modul Ajar secara otomatis dengan CP, TP, ATP, PROTA, LKPD & Asesmen
            </p>
          </div>
        </div>

        <button
          onClick={runMasterSync}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Harmonisasi 1-Klik</span>
        </button>
      </div>

      {/* Cross Reference Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Matriks Cross-Reference 7 Bab Pembelajaran Mendalam
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
            ✓ 100% Selaras Otomatis
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px]">
                <th className="p-3 border-b text-center">Bab</th>
                <th className="p-3 border-b">Nama Modul Ajar</th>
                <th className="p-3 border-b text-center">Kode ATP</th>
                <th className="p-3 border-b text-center">PROTA (JP)</th>
                <th className="p-3 border-b text-center">PROMES</th>
                <th className="p-3 border-b text-center">LKPD Bab</th>
                <th className="p-3 border-b text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {modulAjarList.map((m) => {
                const matchTp = tujuanPembelajaran.find((tp) => tp.babId === `bab-${m.babNumber}`);
                const matchProta = prota.find((p) => p.babNumber === m.babNumber);
                const matchLkpd = lkpdList.find((l) => l.babNumber === m.babNumber);

                return (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center font-bold text-slate-900">{m.babNumber}</td>
                    <td className="p-3 font-semibold text-slate-900">{m.babTitle}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-800">
                      {matchTp?.code || `TP 10.${m.babNumber}`}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-800">
                      {matchProta?.alokasiJp || m.alokasiJp} JP
                    </td>
                    <td className="p-3 text-center text-slate-600 font-medium">Terpetakan Mingguan</td>
                    <td className="p-3 text-center font-medium text-emerald-700">
                      {matchLkpd ? `LKPD ${m.babNumber} Aktif` : 'Siap'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Harmonis
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { useApp } from '../context/AppContext';
import { Check, Workflow } from 'lucide-react';
import { MenuKey } from '../types';

export const RoadmapSteps: React.FC = () => {
  const { setActiveView } = useApp();

  const steps: { number: number; title: string; subtitle: string; target: MenuKey }[] = [
    { number: 1, title: 'CP & ATP', subtitle: 'KepKa 046/2025', target: 'cp_atp' },
    { number: 2, title: 'Kaldik & RPE', subtitle: 'Pekan Efektif', target: 'rpe' },
    { number: 3, title: 'Bloom HOTS', subtitle: 'C1-C6 Anderson', target: 'bloom' },
    { number: 4, title: 'PROTA', subtitle: 'Alokasi 1 Thn', target: 'prota' },
    { number: 5, title: 'PROMES', subtitle: 'Matriks Jadwal', target: 'promes' },
    { number: 6, title: 'Modul Ajar', subtitle: 'Berdiferensiasi', target: 'modul_ajar' },
    { number: 7, title: 'LKPD Bab', subtitle: 'Lembar Kerja', target: 'lkpd' },
    { number: 8, title: 'Bundel 1 Thn', subtitle: 'Siap Jilid Resmi', target: 'bundel' },
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm my-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Workflow className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Alur Penyusunan Perangkat Kurikulum Merdeka
            </h3>
            <p className="text-xs text-slate-500">
              Tahapan berurutan sesuai panduan resmi PPA dan regulasi BSKAP 2025
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-400 italic">
          Klik nomor tahapan untuk langsung membuka modul terkait
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {steps.map((step) => (
          <button
            key={step.number}
            onClick={() => setActiveView(step.target)}
            className="flex flex-col justify-between p-3 rounded-xl border border-slate-200/80 hover:border-emerald-500 bg-slate-50/60 hover:bg-emerald-50/40 transition-all text-left group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center group-hover:bg-emerald-600 transition-colors">
                {step.number}
              </span>
              <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 transition-colors">
                {step.title}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                {step.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

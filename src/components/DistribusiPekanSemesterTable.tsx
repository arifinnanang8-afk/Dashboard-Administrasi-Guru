import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MonthRpeDetail } from '../types';
import { calculateRpeTotals, MonthlyRealTeachingStat } from '../utils/curriculumLogic';

interface DistribusiPekanSemesterTableProps {
  semester: 1 | 2;
  months: MonthRpeDetail[];
  jpPerWeek: number;
  cadanganJp: number;
  realMonths: MonthlyRealTeachingStat[];
  activeSourceLabel: string;
  onUpdateMonth: (
    semester: 1 | 2,
    monthIdx: number,
    updates: Partial<MonthRpeDetail>
  ) => void;
}

export const DistribusiPekanSemesterTable: React.FC<DistribusiPekanSemesterTableProps> = ({
  semester,
  months,
  jpPerWeek,
  cadanganJp,
  realMonths,
  activeSourceLabel,
  onUpdateMonth,
}) => {
  const totals = calculateRpeTotals(months, jpPerWeek, cadanganJp);

  const totalEffectiveMeetings = months.reduce((acc, m, idx) => {
    const realM = realMonths[idx];
    const defaultMeetings =
      m.effectiveWeeks === 0 ? 0 : realM ? realM.effectiveCount : m.effectiveWeeks;
    const val = m.effectiveMeetings !== undefined ? m.effectiveMeetings : defaultMeetings;
    return acc + val;
  }, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-black text-slate-900">
            Tabel Distribusi Pekan Efektif &amp; Non-Efektif Semester {semester}{' '}
            ({semester === 1 ? 'Ganjil' : 'Genap'})
          </h3>
          <p className="text-[11px] text-slate-500">
            Sumber Kaldik: <span className="font-semibold text-indigo-800">{activeSourceLabel}</span>
          </p>
        </div>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Tersinkron Otomatis ke Analisis 12 Bulan, Kaldik &amp; PROTA</span>
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[820px]">
          <thead>
            <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px]">
              <th className="p-3 border-b text-center w-12">No</th>
              <th className="p-3 border-b w-36">Nama Bulan</th>
              <th className="p-3 border-b text-center w-24">Jml Pekan</th>
              <th className="p-3 border-b text-center w-28">Pekan Non-Efektif</th>
              <th className="p-3 border-b text-center w-28">Pekan Efektif</th>
              <th className="p-3 border-b text-center w-32">Pertemuan Efektif</th>
              <th className="p-3 border-b text-center w-24">JP Efektif</th>
              <th className="p-3 border-b min-w-[240px]">
                Keterangan / Alasan Non-Efektif (Sinkron Kaldik)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {months.map((m, idx) => {
              const effectiveWeeks = Math.max(0, m.totalWeeks - m.nonEffectiveWeeks);
              const realM = realMonths[idx];
              const defaultMeetings =
                effectiveWeeks === 0 ? 0 : realM ? realM.effectiveCount : effectiveWeeks;
              const displayedMeetings =
                m.effectiveMeetings !== undefined ? m.effectiveMeetings : defaultMeetings;
              const monthlyJp = effectiveWeeks * jpPerWeek;

              return (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="p-2.5 text-center font-medium text-slate-600">{idx + 1}</td>
                  <td className="p-2.5 font-bold text-slate-900 whitespace-nowrap">{m.month}</td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      min={1}
                      max={6}
                      aria-label={`Distribusi Smt ${semester} jumlah pekan ${m.month}`}
                      value={m.totalWeeks}
                      onChange={(e) =>
                        onUpdateMonth(semester, idx, {
                          totalWeeks: Math.max(1, Math.min(6, parseInt(e.target.value, 10) || 0)),
                        })
                      }
                      className="w-16 px-2 py-1 text-center font-bold border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0d5c3e] focus:outline-none"
                    />
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      min={0}
                      max={m.totalWeeks}
                      aria-label={`Distribusi Smt ${semester} pekan non-efektif ${m.month}`}
                      value={m.nonEffectiveWeeks}
                      onChange={(e) =>
                        onUpdateMonth(semester, idx, {
                          nonEffectiveWeeks: Math.max(
                            0,
                            Math.min(m.totalWeeks, parseInt(e.target.value, 10) || 0)
                          ),
                        })
                      }
                      className="w-16 px-2 py-1 text-center font-bold text-rose-600 border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                  </td>
                  <td className="p-2.5 text-center font-black text-emerald-700 text-sm">
                    {effectiveWeeks}
                  </td>
                  <td className="p-2.5 text-center">
                    <input
                      type="number"
                      min={0}
                      max={31}
                      aria-label={`Distribusi Smt ${semester} pertemuan efektif ${m.month}`}
                      value={displayedMeetings}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        onUpdateMonth(semester, idx, {
                          effectiveMeetings:
                            raw === '' ? 0 : Math.max(0, Math.min(31, parseInt(raw, 10) || 0)),
                        });
                      }}
                      className="w-20 px-2 py-1 text-center font-bold text-emerald-800 border border-emerald-400 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </td>
                  <td className="p-2.5 text-center font-black text-blue-600 whitespace-nowrap">
                    {monthlyJp} JP
                  </td>
                  <td className="p-2.5">
                    <input
                      type="text"
                      aria-label={`Distribusi Smt ${semester} keterangan ${m.month}`}
                      value={m.nonEffectiveNote}
                      onChange={(e) =>
                        onUpdateMonth(semester, idx, { nonEffectiveNote: e.target.value })
                      }
                      placeholder="Contoh: STS, Libur..."
                      className="w-full px-2.5 py-1 border border-slate-200 rounded-lg text-slate-700 focus:ring-1 focus:ring-[#0d5c3e] focus:outline-none"
                    />
                  </td>
                </tr>
              );
            })}
            <tr className="bg-slate-100/90 font-bold text-slate-900">
              <td colSpan={2} className="p-3 text-right whitespace-nowrap">
                TOTAL SEMESTER {semester}
              </td>
              <td className="p-3 text-center text-sm">{totals.totalWeeks}</td>
              <td className="p-3 text-center text-sm text-rose-600">
                {totals.nonEffectiveWeeks}
              </td>
              <td className="p-3 text-center text-sm text-emerald-800 whitespace-nowrap">
                {totals.effectiveWeeks} Pekan
              </td>
              <td className="p-3 text-center text-sm text-emerald-900 whitespace-nowrap">
                {totalEffectiveMeetings} Kali
              </td>
              <td className="p-3 text-center text-sm text-blue-700 whitespace-nowrap">
                {totals.grossJp} JP
              </td>
              <td className="p-3 text-slate-600 text-[11px]">
                Jam Efektif Bersih Semester {semester}: <strong>{totals.netJp} JP</strong> (Cadangan{' '}
                {cadanganJp} JP)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

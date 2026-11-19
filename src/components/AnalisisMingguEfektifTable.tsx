import React from 'react';
import { RotateCcw } from 'lucide-react';
import { RpeState, MonthRpeDetail } from '../types';
import { RealTeachingScheduleAnalysis } from '../utils/curriculumLogic';

interface AnalisisMingguEfektifTableProps {
  rpeData: RpeState;
  realMeetingAnalysis: RealTeachingScheduleAnalysis;
  onUpdateMonth: (
    semester: 1 | 2,
    monthIdx: number,
    updates: Partial<MonthRpeDetail>
  ) => void;
  onResetToKaldikStandard: () => void;
}

export const AnalisisMingguEfektifTable: React.FC<AnalisisMingguEfektifTableProps> = ({
  rpeData,
  realMeetingAnalysis,
  onUpdateMonth,
  onResetToKaldikStandard,
}) => {
  const allRows: {
    no: number;
    semester: 1 | 2;
    semIdx: number;
    monthData: MonthRpeDetail;
    jpPerWeek: number;
    defaultRealMeetings: number;
  }[] = [
    ...rpeData.semester1.months.map((m, idx) => {
      const realM = realMeetingAnalysis.semester1.months[idx];
      const fallbackMeetings =
        m.effectiveWeeks === 0
          ? 0
          : realM
          ? realM.effectiveCount
          : m.effectiveWeeks;
      return {
        no: idx + 1,
        semester: 1 as const,
        semIdx: idx,
        monthData: m,
        jpPerWeek: rpeData.semester1.jpPerWeek,
        defaultRealMeetings: fallbackMeetings,
      };
    }),
    ...rpeData.semester2.months.map((m, idx) => {
      const realM = realMeetingAnalysis.semester2.months[idx];
      const fallbackMeetings =
        m.effectiveWeeks === 0
          ? 0
          : realM
          ? realM.effectiveCount
          : m.effectiveWeeks;
      return {
        no: idx + 7,
        semester: 2 as const,
        semIdx: idx,
        monthData: m,
        jpPerWeek: rpeData.semester2.jpPerWeek,
        defaultRealMeetings: fallbackMeetings,
      };
    }),
  ];

  const totals = allRows.reduce(
    (acc, row) => {
      const effWeeks = Math.max(0, row.monthData.totalWeeks - row.monthData.nonEffectiveWeeks);
      const effMeetings =
        row.monthData.effectiveMeetings !== undefined
          ? row.monthData.effectiveMeetings
          : row.defaultRealMeetings;
      const jp = effWeeks * row.jpPerWeek;

      acc.totalWeeks += row.monthData.totalWeeks;
      acc.nonEffectiveWeeks += row.monthData.nonEffectiveWeeks;
      acc.effectiveWeeks += effWeeks;
      acc.effectiveMeetings += effMeetings;
      acc.totalJp += jp;
      if (row.semester === 1) acc.s1EffectiveWeeks += effWeeks;
      else acc.s2EffectiveWeeks += effWeeks;
      return acc;
    },
    {
      totalWeeks: 0,
      nonEffectiveWeeks: 0,
      effectiveWeeks: 0,
      effectiveMeetings: 0,
      totalJp: 0,
      s1EffectiveWeeks: 0,
      s2EffectiveWeeks: 0,
    }
  );

  const sameJpPerWeek = rpeData.semester1.jpPerWeek === rpeData.semester2.jpPerWeek;
  const totalFormulaText = sameJpPerWeek
    ? `Total Jam Efektif = ${totals.effectiveWeeks} Minggu x ${rpeData.semester1.jpPerWeek} JP = ${totals.totalJp} JP`
    : `Total Jam Efektif = (${totals.s1EffectiveWeeks} Mgg x ${rpeData.semester1.jpPerWeek} JP) + (${totals.s2EffectiveWeeks} Mgg x ${rpeData.semester2.jpPerWeek} JP) = ${totals.totalJp} JP`;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Header matching attached reference photo */}
      <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-black text-slate-900">
            Analisis Minggu Efektif &amp; Hari/Pertemuan Efektif
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Anda dapat menyesuaikan angka Minggu Tidak Efektif atau Pertemuan Efektif tiap bulan secara langsung jika diperlukan.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetToKaldikStandard}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold shadow-2xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>Kembalikan ke Hitungan Standar Kaldik</span>
        </button>
      </div>

      {/* 12-Month Full Year Effective Weeks & Meetings Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse min-w-[920px]">
          <thead>
            <tr className="bg-[#0d5c3e] text-white text-[11px] font-bold">
              <th className="py-3 px-3 text-center w-12">No</th>
              <th className="py-3 px-3 w-36">Bulan</th>
              <th className="py-3 px-3 text-center w-32">Jumlah Minggu</th>
              <th className="py-3 px-3 text-center w-36">Minggu Tidak Efektif</th>
              <th className="py-3 px-3 text-center w-32">Minggu Efektif</th>
              <th className="py-3 px-3 text-center w-40">Jml Pertemuan Efektif</th>
              <th className="py-3 px-3 text-center w-32">Total JP Efektif</th>
              <th className="py-3 px-3 min-w-[260px]">Keterangan Minggu Tidak Efektif / Agenda</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {allRows.map((row) => {
              const m = row.monthData;
              const effectiveWeeks = Math.max(0, m.totalWeeks - m.nonEffectiveWeeks);
              const displayedMeetings =
                m.effectiveMeetings !== undefined ? m.effectiveMeetings : row.defaultRealMeetings;
              const monthlyJp = effectiveWeeks * row.jpPerWeek;

              return (
                <tr key={`${row.semester}-${row.semIdx}`} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                    {row.no}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                    {m.month}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min={1}
                      max={6}
                      aria-label={`Jumlah minggu ${m.month}`}
                      value={m.totalWeeks}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(6, parseInt(e.target.value, 10) || 0));
                        onUpdateMonth(row.semester, row.semIdx, { totalWeeks: val });
                      }}
                      className="w-16 px-2 py-1.5 text-center font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0d5c3e] focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={m.totalWeeks}
                      aria-label={`Minggu tidak efektif ${m.month}`}
                      value={m.nonEffectiveWeeks}
                      onChange={(e) => {
                        const val = Math.max(
                          0,
                          Math.min(m.totalWeeks, parseInt(e.target.value, 10) || 0)
                        );
                        onUpdateMonth(row.semester, row.semIdx, { nonEffectiveWeeks: val });
                      }}
                      className="w-16 px-2 py-1.5 text-center font-bold text-rose-600 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-[#0d7a4a] text-sm">
                    {effectiveWeeks}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min={0}
                      max={31}
                      aria-label={`Jumlah pertemuan efektif ${m.month}`}
                      value={displayedMeetings}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (raw === '') {
                          onUpdateMonth(row.semester, row.semIdx, { effectiveMeetings: 0 });
                          return;
                        }
                        const val = Math.max(0, Math.min(31, parseInt(raw, 10) || 0));
                        onUpdateMonth(row.semester, row.semIdx, { effectiveMeetings: val });
                      }}
                      className="w-20 px-2 py-1.5 text-center font-bold text-[#0d7a4a] bg-white border border-emerald-400 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center font-black text-blue-600 whitespace-nowrap">
                    {monthlyJp} JP
                  </td>
                  <td className="py-2.5 px-3">
                    <input
                      type="text"
                      aria-label={`Keterangan agenda ${m.month}`}
                      value={m.nonEffectiveNote}
                      onChange={(e) =>
                        onUpdateMonth(row.semester, row.semIdx, {
                          nonEffectiveNote: e.target.value,
                        })
                      }
                      placeholder="Keterangan minggu tidak efektif / agenda..."
                      className="w-full px-3 py-1.5 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#0d5c3e] focus:outline-none"
                    />
                  </td>
                </tr>
              );
            })}

            {/* Summary Total Row */}
            <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-200">
              <td colSpan={2} className="py-3.5 px-3 text-center uppercase tracking-wide text-xs">
                JUMLAH TOTAL
              </td>
              <td className="py-3.5 px-3 text-center text-sm">{totals.totalWeeks}</td>
              <td className="py-3.5 px-3 text-center text-sm text-rose-600">
                {totals.nonEffectiveWeeks}
              </td>
              <td className="py-3.5 px-3 text-center text-sm text-[#0d7a4a] whitespace-nowrap">
                {totals.effectiveWeeks} Minggu
              </td>
              <td className="py-3.5 px-3 text-center text-sm text-slate-900 whitespace-nowrap">
                {totals.effectiveMeetings} Kali
              </td>
              <td className="py-3.5 px-3 text-center text-sm text-blue-600 whitespace-nowrap">
                {totals.totalJp} JP
              </td>
              <td className="py-3.5 px-3 text-xs font-semibold text-slate-600">
                {totalFormulaText}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  CalendarX2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  ALL_TEACHING_DAYS,
  TeachingDayName,
  analyzeRealTeachingSchedule,
} from '../utils/curriculumLogic';

const STORAGE_KEY_DAYS = 'guru_selected_teaching_days_v1';

interface JadwalMengajarRiilPanelProps {
  selectedDays?: TeachingDayName[];
  onSelectedDaysChange?: (days: TeachingDayName[]) => void;
}

export const JadwalMengajarRiilPanel: React.FC<JadwalMengajarRiilPanelProps> = ({
  selectedDays: controlledDays,
  onSelectedDaysChange,
}) => {
  const { schoolProfile, kaldikEvents, rpe, updateRpe, showNotification } = useApp();

  const [internalDays, setInternalDays] = useState<TeachingDayName[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DAYS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return ['Senin', 'Rabu'];
  });

  const selectedDays = controlledDays ?? internalDays;
  const setSelectedDays = (
    updater: TeachingDayName[] | ((prev: TeachingDayName[]) => TeachingDayName[])
  ) => {
    const next = typeof updater === 'function' ? updater(selectedDays) : updater;
    if (onSelectedDaysChange) {
      onSelectedDaysChange(next);
    } else {
      setInternalDays(next);
    }
  };

  const [showMonthlyDetail, setShowMonthlyDetail] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DAYS, JSON.stringify(selectedDays));
    } catch {
      // ignore
    }
  }, [selectedDays]);

  const jpPerWeekS1 = rpe?.semester1?.jpPerWeek || 4;
  const jpPerWeekS2 = rpe?.semester2?.jpPerWeek || 4;

  const analysis = useMemo(() => {
    return analyzeRealTeachingSchedule({
      academicYear: schoolProfile.academicYear || '2026/2027',
      selectedDays,
      kaldikEvents,
      jpPerWeekS1,
      jpPerWeekS2,
    });
  }, [schoolProfile.academicYear, selectedDays, kaldikEvents, jpPerWeekS1, jpPerWeekS2]);

  const syncAnalysisToRpe = (daysToSync: TeachingDayName[], showToast = false) => {
    if (daysToSync.length === 0) {
      if (showToast) {
        showNotification('error', 'Pilih minimal 1 hari jadwal mengajar terlebih dahulu.');
      }
      return;
    }

    const currentAnalysis = analyzeRealTeachingSchedule({
      academicYear: schoolProfile.academicYear || '2026/2027',
      selectedDays: daysToSync,
      kaldikEvents,
      jpPerWeekS1,
      jpPerWeekS2,
    });

    const updatedS1Months = rpe.semester1.months.map((m, idx) => {
      const stat = currentAnalysis.semester1.months[idx];
      if (!stat) return m;
      const nonEffWeeks =
        stat.holidayCount === 0
          ? 0
          : Math.min(m.totalWeeks, Math.max(1, Math.ceil(stat.holidayCount / daysToSync.length)));
      const effWeeks = Math.max(0, m.totalWeeks - nonEffWeeks);
      const note =
        stat.holidayCount > 0
          ? `${stat.affectedSummary} — [Jadwal ${daysToSync.join(', ')}: ${stat.effectiveCount}/${stat.scheduledCount} Pertemuan Riil]`
          : `Efektif Penuh (Hari ${daysToSync.join(', ')} tidak terkena libur Kaldik) — [Pertemuan Riil: ${stat.effectiveCount}/${stat.scheduledCount} Hari]`;
      return {
        ...m,
        nonEffectiveWeeks: nonEffWeeks,
        effectiveWeeks: effWeeks,
        nonEffectiveNote: note,
      };
    });

    const updatedS2Months = rpe.semester2.months.map((m, idx) => {
      const stat = currentAnalysis.semester2.months[idx];
      if (!stat) return m;
      const nonEffWeeks =
        stat.holidayCount === 0
          ? 0
          : Math.min(m.totalWeeks, Math.max(1, Math.ceil(stat.holidayCount / daysToSync.length)));
      const effWeeks = Math.max(0, m.totalWeeks - nonEffWeeks);
      const note =
        stat.holidayCount > 0
          ? `${stat.affectedSummary} — [Jadwal ${daysToSync.join(', ')}: ${stat.effectiveCount}/${stat.scheduledCount} Pertemuan Riil]`
          : `Efektif Penuh (Hari ${daysToSync.join(', ')} tidak terkena libur Kaldik) — [Pertemuan Riil: ${stat.effectiveCount}/${stat.scheduledCount} Hari]`;
      return {
        ...m,
        nonEffectiveWeeks: nonEffWeeks,
        effectiveWeeks: effWeeks,
        nonEffectiveNote: note,
      };
    });

    updateRpe({
      ...rpe,
      semester1: {
        ...rpe.semester1,
        months: updatedS1Months,
      },
      semester2: {
        ...rpe.semester2,
        months: updatedS2Months,
      },
    });

    if (showToast) {
      showNotification(
        'success',
        `Analisis Pertemuan Riil (Hari ${daysToSync.join(', ')}) berhasil disinkronkan ke Tabel RPE Semester 1 & 2!`
      );
    }
  };

  const handleToggleDay = (day: TeachingDayName) => {
    setSelectedDays((prev) => {
      const exists = prev.includes(day);
      const next = exists
        ? prev.filter((d) => d !== day)
        : ALL_TEACHING_DAYS.filter((d) => [...prev, day].includes(d));
      if (next.length > 0) {
        setTimeout(() => syncAnalysisToRpe(next, false), 0);
      }
      return next;
    });
  };

  const handleSetPresetDays = (days: TeachingDayName[]) => {
    setSelectedDays(days);
    syncAnalysisToRpe(days, true);
  };

  const getEventBadgeStyle = (type: string) => {
    switch (type) {
      case 'libur_nasional':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'libur_semester':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'sts':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'sas':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="bg-gradient-to-br from-amber-50/90 via-white to-indigo-50/60 border-b-2 border-indigo-200 p-5 space-y-4">
      {/* Header & Instructions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-700 text-white shadow-sm">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight">
              Pilih Hari Jadwal Mengajar di Kelas (Untuk Analisis Pertemuan Riil):
            </h4>
          </div>
          <p className="text-xs text-slate-700 font-medium leading-relaxed">
            Centang hari apa saja Anda masuk mengajar di kelas ini. Sistem akan otomatis mengecek apakah hari tersebut terkena libur di Kalender Pendidikan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSetPresetDays(['Senin', 'Rabu'])}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition-colors cursor-pointer"
          >
            Default (Senin & Rabu)
          </button>
          <button
            type="button"
            onClick={() => handleSetPresetDays([...ALL_TEACHING_DAYS])}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors cursor-pointer"
          >
            Centang Semua Hari
          </button>
          <button
            type="button"
            onClick={() => syncAnalysisToRpe(selectedDays, true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sinkronkan Pertemuan Riil ke Tabel RPE</span>
          </button>
        </div>
      </div>

      {/* 6 Day Checkboxes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {ALL_TEACHING_DAYS.map((day) => {
          const isChecked = selectedDays.includes(day);
          const dayStat = analysis.dayOfWeekStats[day];

          return (
            <label
              key={day}
              className={`relative flex flex-col justify-between p-3 rounded-xl border-2 transition-all cursor-pointer select-none ${
                isChecked
                  ? 'bg-indigo-700 text-white border-indigo-800 shadow-md'
                  : 'bg-white hover:bg-indigo-50/50 text-slate-800 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleDay(day)}
                    aria-label={`Hari ${day}`}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer accent-emerald-400"
                  />
                  <span className="text-xs font-black tracking-wide uppercase">
                    {day}
                  </span>
                </div>
                {isChecked && (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-400 text-slate-950 font-black text-[9px] uppercase">
                    Aktif
                  </span>
                )}
              </div>

              <div
                className={`mt-2 pt-2 border-t text-[10px] space-y-0.5 ${
                  isChecked ? 'border-indigo-500/70 text-indigo-100' : 'border-slate-100 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Total Kalender:</span>
                  <span className="font-bold">{dayStat.totalInYear} hr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Terkena Libur:</span>
                  <span
                    className={`font-bold ${
                      isChecked ? 'text-amber-300' : 'text-rose-600'
                    }`}
                  >
                    {dayStat.holidayInYear} hr
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Efektif KBM:</span>
                  <span
                    className={`font-black ${
                      isChecked ? 'text-emerald-300' : 'text-emerald-700'
                    }`}
                  >
                    {dayStat.effectiveInYear} hr
                  </span>
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Real-time Collision Summary Cards */}
      {selectedDays.length === 0 ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Silakan centang minimal satu hari jadwal mengajar di atas untuk melihat hasil analisis pertemuan riil dan pengecekan hari libur Kalender Pendidikan.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">
                Hari Terjadwal ({selectedDays.join(', ')})
              </span>
              <p className="text-xl font-black text-slate-900 mt-1">
                {analysis.totalScheduledDays} Hari
              </p>
              <span className="text-[11px] text-slate-600">
                Smt 1: <strong>{analysis.semester1.scheduledDays}</strong> · Smt 2:{' '}
                <strong>{analysis.semester2.scheduledDays}</strong>
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
              <span className="text-[10px] font-bold text-rose-600 uppercase flex items-center gap-1">
                <CalendarX2 className="w-3.5 h-3.5" />
                Terkena Libur / Agenda Kaldik
              </span>
              <p className="text-xl font-black text-rose-600 mt-1">
                {analysis.totalHolidayAffectedDays} Hari Libur
              </p>
              <span className="text-[11px] text-rose-700 font-medium">
                Smt 1: <strong>{analysis.semester1.holidayAffectedDays}</strong> · Smt 2:{' '}
                <strong>{analysis.semester2.holidayAffectedDays}</strong>
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] font-bold text-emerald-700 uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Pertemuan Tatap Muka Riil
              </span>
              <p className="text-xl font-black text-emerald-700 mt-1">
                {analysis.totalEffectiveMeetings} Pertemuan
              </p>
              <span className="text-[11px] text-emerald-800 font-semibold">
                Smt 1: <strong>{analysis.semester1.effectiveMeetings}</strong> · Smt 2:{' '}
                <strong>{analysis.semester2.effectiveMeetings}</strong> Pertemuan Efektif
              </span>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-xs">
              <span className="text-[10px] font-bold text-indigo-700 uppercase flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Estimasi Jam Pelajaran (JP) Riil
              </span>
              <p className="text-xl font-black text-indigo-700 mt-1">
                {analysis.totalEffectiveJp} JP
              </p>
              <span className="text-[11px] text-indigo-800 font-medium">
                Smt 1: <strong>{analysis.semester1.effectiveJp} JP</strong> · Smt 2:{' '}
                <strong>{analysis.semester2.effectiveJp} JP</strong> ({jpPerWeekS1} JP/Mgg)
              </span>
            </div>
          </div>

          {/* Detected Holiday Collisions Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <h5 className="text-xs font-black text-slate-900">
                  Hasil Cek Otomatis Hari Mengajar ({selectedDays.join(', ')}) yang Terkena Libur / Agenda Kaldik ({analysis.affectedDates.length} Tanggal):
                </h5>
              </div>
              <button
                type="button"
                onClick={() => setShowMonthlyDetail((prev) => !prev)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer"
              >
                <span>
                  {showMonthlyDetail
                    ? 'Sembunyikan Tabel Rekap Per Bulan'
                    : 'Lihat Rekap Pertemuan Riil Per Bulan (Juli - Juni)'}
                </span>
                {showMonthlyDetail ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {analysis.affectedDates.length === 0 ? (
              <p className="text-xs text-emerald-700 font-semibold">
                Tidak ada jadwal hari mengajar yang berbenturan dengan tanggal libur Kalender Pendidikan.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                {analysis.affectedDates.map((item, idx) => (
                  <div
                    key={`${item.dateStr}-${idx}`}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-start justify-between gap-2 text-[11px]"
                  >
                    <div className="space-y-0.5">
                      <div className="font-black text-slate-900 flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 text-[10px]">
                          {item.dayName}
                        </span>
                        <span>{item.formattedDate}</span>
                      </div>
                      <p className="font-semibold text-rose-700 leading-snug">
                        {item.eventName}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border shrink-0 ${getEventBadgeStyle(
                        item.eventType
                      )}`}
                    >
                      Smt {item.semester}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Collapsible Monthly Real Meetings Breakdown */}
            {showMonthlyDetail && (
              <div className="pt-3 border-t border-slate-200 overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase">
                      <th className="p-2 border-b">Bulan</th>
                      <th className="p-2 border-b text-center">Semester</th>
                      <th className="p-2 border-b text-center">Hari Terjadwal</th>
                      <th className="p-2 border-b text-center text-rose-700">Terkena Libur</th>
                      <th className="p-2 border-b text-center text-emerald-800">Pertemuan Riil</th>
                      <th className="p-2 border-b">Rincian Tanggal Terkena Agenda / Libur Kaldik</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[...analysis.semester1.months, ...analysis.semester2.months].map((m, i) => (
                      <tr key={`${m.monthName}-${i}`} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900">
                          {m.monthName} {m.year}
                        </td>
                        <td className="p-2 text-center font-semibold text-slate-600">
                          Smt {m.semester}
                        </td>
                        <td className="p-2 text-center font-bold text-slate-800">
                          {m.scheduledCount} Hari
                        </td>
                        <td className="p-2 text-center font-bold text-rose-600">
                          {m.holidayCount} Hari
                        </td>
                        <td className="p-2 text-center font-black text-emerald-700">
                          {m.effectiveCount} Pertemuan
                        </td>
                        <td className="p-2 text-slate-600">{m.affectedSummary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

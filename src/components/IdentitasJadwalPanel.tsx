import React from 'react';
import { School, User, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TeachingDayName } from '../utils/curriculumLogic';
import { JadwalMengajarRiilPanel } from './JadwalMengajarRiilPanel';

interface IdentitasJadwalPanelProps {
  selectedDays: TeachingDayName[];
  onSelectedDaysChange: (days: TeachingDayName[]) => void;
  onNextStep?: () => void;
}

export const IdentitasJadwalPanel: React.FC<IdentitasJadwalPanelProps> = ({
  selectedDays,
  onSelectedDaysChange,
  onNextStep,
}) => {
  const { schoolProfile, updateSchoolProfile, rpe, updateRpe, showNotification } = useApp();

  const handleJpPerWeekChange = (semester: 1 | 2, value: number) => {
    const safeVal = Math.max(1, Math.min(40, value));
    if (semester === 1) {
      updateRpe({
        ...rpe,
        semester1: { ...rpe.semester1, jpPerWeek: safeVal },
      });
    } else {
      updateRpe({
        ...rpe,
        semester2: { ...rpe.semester2, jpPerWeek: safeVal },
      });
    }
  };

  const handleCadanganChange = (semester: 1 | 2, value: number) => {
    const safeVal = Math.max(0, Math.min(40, value));
    if (semester === 1) {
      updateRpe({
        ...rpe,
        semester1: { ...rpe.semester1, cadanganJp: safeVal },
      });
    } else {
      updateRpe({
        ...rpe,
        semester2: { ...rpe.semester2, cadanganJp: safeVal },
      });
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <School className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="text-sm font-black text-slate-900">
                1. Identitas Satuan Pendidikan, Guru & Beban Jam Mengajar
              </h3>
              <p className="text-[11px] text-slate-600">
                Pengaturan identitas mata pelajaran dan jumlah JP per minggu tersinkron otomatis ke RPE, PROTA, dan PROMES.
              </p>
            </div>
          </div>

          {onNextStep && (
            <button
              type="button"
              onClick={onNextStep}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#109848] hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <span>Lanjut ke 2. Kalender Pendidikan</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <School className="w-3.5 h-3.5 text-slate-500" />
              <span>Nama Satuan Pendidikan</span>
            </label>
            <input
              type="text"
              value={schoolProfile.schoolName}
              onChange={(e) => updateSchoolProfile({ schoolName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Nama Guru Pengampu</span>
            </label>
            <input
              type="text"
              value={schoolProfile.teacherName}
              onChange={(e) => updateSchoolProfile({ teacherName: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Mata Pelajaran</span>
            </label>
            <input
              type="text"
              value={schoolProfile.subject}
              onChange={(e) => updateSchoolProfile({ subject: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Kelas / Fase
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                value={schoolProfile.grade}
                onChange={(e) => updateSchoolProfile({ grade: e.target.value })}
                aria-label="Kelas"
                className="col-span-2 w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
              />
              <input
                type="text"
                value={schoolProfile.fase}
                onChange={(e) => updateSchoolProfile({ fase: e.target.value })}
                aria-label="Fase"
                placeholder="Fase"
                className="col-span-1 w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-semibold text-center"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tahun Pelajaran
            </label>
            <input
              type="text"
              value={schoolProfile.academicYear}
              onChange={(e) => updateSchoolProfile({ academicYear: e.target.value })}
              placeholder="2026/2027"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>JP / Minggu (Smt 1)</span>
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={rpe.semester1.jpPerWeek}
                onChange={(e) =>
                  handleJpPerWeekChange(1, parseInt(e.target.value, 10) || 1)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-black text-emerald-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-700" />
                <span>JP / Minggu (Smt 2)</span>
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={rpe.semester2.jpPerWeek}
                onChange={(e) =>
                  handleJpPerWeekChange(2, parseInt(e.target.value, 10) || 1)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-black text-indigo-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cadangan JP (Smt 1)
              </label>
              <input
                type="number"
                min={0}
                max={40}
                value={rpe.semester1.cadanganJp}
                onChange={(e) =>
                  handleCadanganChange(1, parseInt(e.target.value, 10) || 0)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cadangan JP (Smt 2)
              </label>
              <input
                type="number"
                min={0}
                max={40}
                value={rpe.semester2.cadanganJp}
                onChange={(e) =>
                  handleCadanganChange(2, parseInt(e.target.value, 10) || 0)
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white font-bold"
              />
            </div>
          </div>

          <div className="md:col-span-2 flex items-end justify-end">
            <button
              type="button"
              onClick={() =>
                showNotification(
                  'success',
                  'Identitas & Beban Jam Mengajar berhasil disimpan dan disinkronkan!'
                )
              }
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Simpan Pengaturan Identitas & JP
            </button>
          </div>
        </div>
      </div>

      {/* Jadwal Hari Mengajar di Kelas */}
      <div className="rounded-2xl border-2 border-indigo-200 overflow-hidden shadow-sm">
        <JadwalMengajarRiilPanel
          selectedDays={selectedDays}
          onSelectedDaysChange={onSelectedDaysChange}
        />
      </div>
    </div>
  );
};

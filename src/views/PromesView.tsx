import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Grid3X3,
  ArrowLeft,
  Printer,
  Download,
  CheckCircle2,
  RefreshCw,
  FileSpreadsheet,
  BookOpen,
  User,
  School,
} from 'lucide-react';
import { exportPromesToWord, exportPromesToExcel } from '../utils/exporter';
import { getSyncedSubChaptersForBab, getCompleteBookSourceString } from '../utils/curriculumLogic';
import { PipelineSyncHeader } from '../components/PipelineSyncHeader';
import { IdentitasPerangkat } from '../components/IdentitasPerangkat';

export const PromesView: React.FC = () => {
  const {
    promes,
    updatePromesItem,
    syncProtaToPromes,
    schoolProfile,
    updateSchoolProfile,
    setActiveView,
    openPrintModal,
    showNotification,
  } = useApp();
  const [activeSemester, setActiveSemester] = useState<1 | 2>(1);

  // Filter items by semester
  const s1Items = promes.filter((p) => p.semester === 1);
  const s2Items = promes.filter((p) => p.semester === 2);
  const s1TotalJp = s1Items.reduce((a, b) => a + (b.alokasiJp || 0), 0);
  const s2TotalJp = s2Items.reduce((a, b) => a + (b.alokasiJp || 0), 0);

  const filteredPromes = activeSemester === 1 ? s1Items : s2Items;

  const semester1Weeks = [
    { label: 'Juli', weeks: ['Jul-1', 'Jul-2', 'Jul-3', 'Jul-4'] },
    { label: 'Agustus', weeks: ['Agu-1', 'Agu-2', 'Agu-3', 'Agu-4', 'Agu-5'] },
    { label: 'September', weeks: ['Sep-1', 'Sep-2', 'Sep-3', 'Sep-4'] },
    { label: 'Oktober', weeks: ['Okt-1', 'Okt-2', 'Okt-3', 'Okt-4', 'Okt-5'] },
    { label: 'November', weeks: ['Nov-1', 'Nov-2', 'Nov-3', 'Nov-4'] },
    { label: 'Desember', weeks: ['Des-1', 'Des-2', 'Des-3', 'Des-4', 'Des-5'] },
  ];

  const semester2Weeks = [
    { label: 'Januari', weeks: ['Jan-1', 'Jan-2', 'Jan-3', 'Jan-4'] },
    { label: 'Februari', weeks: ['Feb-1', 'Feb-2', 'Feb-3', 'Feb-4'] },
    { label: 'Maret', weeks: ['Mar-1', 'Mar-2', 'Mar-3', 'Mar-4', 'Mar-5'] },
    { label: 'April', weeks: ['Apr-1', 'Apr-2', 'Apr-3', 'Apr-4'] },
    { label: 'Mei', weeks: ['Mei-1', 'Mei-2', 'Mei-3', 'Mei-4', 'Mei-5'] },
    { label: 'Juni', weeks: ['Jun-1', 'Jun-2', 'Jun-3', 'Jun-4'] },
  ];

  const currentMonths = activeSemester === 1 ? semester1Weeks : semester2Weeks;

  const handleCellChange = (itemId: string, weekKey: string, value: number) => {
    const item = promes.find((p) => p.id === itemId);
    if (!item) return;
    const updatedDistribution = { ...item.distribution, [weekKey]: value };
    updatePromesItem({ ...item, distribution: updatedDistribution });
  };

  const handleExportWord = async (targetSem: 1 | 2 | 'both') => {
    await exportPromesToWord(
      promes,
      schoolProfile,
      targetSem,
      `PROMES_SEMESTER_${targetSem === 'both' ? '1_DAN_2' : targetSem}_${schoolProfile.subject.replace(/\s+/g, '_')}.docx`
    );
    showNotification(
      'success',
      `Tabel Matriks PROMES Semester ${targetSem === 'both' ? '1 & 2' : targetSem} berhasil diekspor ke Word (.docx)!`
    );
  };

  return (
    <div className="space-y-6">
      <PipelineSyncHeader />

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
              <Grid3X3 className="w-5 h-5 text-cyan-600" />
              Program Semester (PROMES) Tahun Ajaran {schoolProfile.academicYear}
            </h2>
            <p className="text-xs text-slate-500">
              Matriks Distribusi Mingguan Jam Pelajaran Tatap Muka (Tersinkron Otomatis dari PROTA & RPE)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveView('prota')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Buka PROTA</span>
          </button>

          <button
            onClick={() => syncProtaToPromes('auto_rpe', false)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-bold transition-colors cursor-pointer"
            title="Tarik & distribusikan ulang JP dari PROTA sesuai Pekan Efektif RPE"
          >
            <RefreshCw className="w-4 h-4 text-cyan-700" />
            <span>Sinkron dari PROTA</span>
          </button>

          <div className="relative group">
            <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer">
              <Download className="w-4 h-4" />
              <span>Unduh Word (.docx)</span>
            </button>
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 hidden group-hover:block z-20">
              <button
                onClick={() => handleExportWord(1)}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
              >
                Unduh Word Semester 1
              </button>
              <button
                onClick={() => handleExportWord(2)}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 font-medium cursor-pointer"
              >
                Unduh Word Semester 2
              </button>
              <button
                onClick={() => handleExportWord('both')}
                className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-100 font-medium border-t cursor-pointer"
              >
                Unduh Word Smt 1 & 2 Lengkap
              </button>
            </div>
          </div>

          <button
            onClick={() => {
              exportPromesToExcel(promes, schoolProfile, 'both');
              showNotification('success', 'Matriks Mingguan PROMES Semester 1 & 2 berhasil diekspor ke Excel (.xlsx)!');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Ekspor Matriks Mingguan PROMES ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={() => {
              updateSchoolProfile({ semester: activeSemester });
              openPrintModal('promes');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Cetak PROMES atau Ekspor ke PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Ekspor PDF / Cetak</span>
          </button>
        </div>
      </div>

      {/* Official Identity Summary Card */}
      <IdentitasPerangkat
        documentTitle="Program Semester (PROMES)"
        semesterSpecific={activeSemester}
      />

      {/* Semester Switcher */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setActiveSemester(1)}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSemester === 1
              ? 'bg-cyan-800 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Semester 1 (Ganjil: Juli - Desember) · {s1Items.length} Lingkup Bab ({s1TotalJp} JP)
        </button>

        <button
          onClick={() => setActiveSemester(2)}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSemester === 2
              ? 'bg-cyan-800 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          Semester 2 (Genap: Januari - Juni) · {s2Items.length} Lingkup Bab ({s2TotalJp} JP)
        </button>
      </div>

      {/* Promes Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-slate-900">
            Matriks Distribusi Mingguan Semester {activeSemester} ({activeSemester === 1 ? 'Ganjil' : 'Genap'})
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Terhubung Otomatis dengan Katalog Buku Resmi
            </span>
            <button
              onClick={() => {
                updateSchoolProfile({ semester: activeSemester });
                openPrintModal('promes');
              }}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 cursor-pointer"
            >
              Cetak Smt {activeSemester} Saja →
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-center text-[11px] font-bold">
                <th rowSpan={2} className="p-2 border w-10">No</th>
                <th rowSpan={2} className="p-2 border text-left min-w-[190px]">Bab / Lingkup Materi Pokok</th>
                <th rowSpan={2} className="p-2 border text-left min-w-[240px]">Materi Pembelajaran (Sub-Bab Buku Resmi)</th>
                <th rowSpan={2} className="p-2 border w-16">Kode TP</th>
                <th rowSpan={2} className="p-2 border w-16">Target JP</th>
                <th rowSpan={2} className="p-2 border w-16">Sebaran</th>
                {currentMonths.map((m, idx) => (
                  <th key={idx} colSpan={m.weeks.length} className="p-2 border">
                    {m.label}
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50 text-slate-600 text-center text-[10px]">
                {currentMonths.flatMap((m) =>
                  m.weeks.map((w, wIdx) => (
                    <th key={w} className="p-1 border w-7">
                      {wIdx + 1}
                    </th>
                  ))
                )}
              </tr>
            </thead>
            <tbody>
              {filteredPromes.map((item, idx) => {
                const totalRowAllocated = Object.values(item.distribution || {}).reduce(
                  (a, b) => a + (Number(b) || 0),
                  0
                );
                const isMatched = totalRowAllocated === item.alokasiJp;
                const subChapters = getSyncedSubChaptersForBab(
                  schoolProfile.subject,
                  schoolProfile.grade,
                  item.babNumber
                );
                return (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="p-2 border text-center font-medium">{idx + 1}</td>
                    <td className="p-2 border font-bold text-slate-900">
                      <p>{item.babTitle}</p>
                      <p className="text-[10px] text-slate-500 font-normal">{item.tpDescription}</p>
                    </td>
                    <td className="p-2 border text-slate-800">
                      <div className="space-y-1">
                        {subChapters.map((sub, sIdx) => (
                          <div key={sIdx} className="text-xs font-semibold text-cyan-950 flex items-start gap-1">
                            <span className="text-cyan-700 font-bold">{sIdx + 1}.</span>
                            <span>{sub}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 pt-1.5 border-t border-slate-200 text-[10px] text-emerald-800 font-medium italic">
                        📚 {getCompleteBookSourceString(schoolProfile)}
                      </div>
                    </td>
                    <td className="p-2 border text-center font-mono font-bold text-emerald-800 whitespace-nowrap">
                      {item.tpCode}
                    </td>
                    <td className="p-2 border text-center font-black text-slate-900 whitespace-nowrap">
                      {item.alokasiJp} JP
                    </td>
                    <td className="p-2 border text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isMatched
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {totalRowAllocated}/{item.alokasiJp} JP
                      </span>
                    </td>
                    {currentMonths.flatMap((m) =>
                      m.weeks.map((w) => {
                        const val = item.distribution[w] || '';
                        return (
                          <td key={w} className="p-1 border text-center">
                            <input
                              type="number"
                              min={0}
                              max={12}
                              value={val}
                              onChange={(e) =>
                                handleCellChange(
                                  item.id,
                                  w,
                                  parseInt(e.target.value, 10) || 0
                                )
                              }
                              className={`w-7 h-7 text-center font-bold text-xs rounded border border-transparent hover:border-slate-300 focus:border-cyan-500 ${
                                val ? 'bg-cyan-100 text-cyan-950 font-black' : 'text-slate-300'
                              }`}
                            />
                          </td>
                        );
                      })
                    )}
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

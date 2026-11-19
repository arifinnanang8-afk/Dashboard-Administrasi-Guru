import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Target,
  GraduationCap,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Sliders,
  Award,
  ChevronDown,
  ChevronUp,
  FileCheck2,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { StudentRecord, StudentCpTarget, CpMasteryLevel } from '../types';
import {
  calculateCpMappingStats,
  deriveCpTargetFromAssessment,
} from '../utils/cpMappingLogic';

const QUICK_NOTE_PRESETS = [
  'Sangat mahir mengevaluasi akurasi fakta secara kritis dan mandiri.',
  'Telah mencapai kriteria ketercapaian target TP dengan baik.',
  'Perlu pendampingan terstruktur dalam mengonstruksi gagasan tertulis.',
  'Membutuhkan penguatan kosakata dan struktur kalimat baku.',
  'Aktif dalam kolaborasi kelompok dan siap pengayaan materi mandiri.',
];

export const CpStudentMappingDashboard: React.FC = () => {
  const {
    students,
    cpElements,
    tujuanPembelajaran,
    schoolProfile,
    updateStudentCpTarget,
    syncAllCpTargetsToAssessment,
    pullAssessmentScoresToCpTargets,
    setActiveView,
    showNotification,
  } = useApp();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedTpCode, setSelectedTpCode] = useState<string>(
    tujuanPembelajaran[0]?.code || 'TP 10.1'
  );
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Tercapai' | 'Dalam Proses' | 'Perlu Penguatan'>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected TP object and associated CP element
  const activeTp = useMemo(() => {
    return tujuanPembelajaran.find((tp) => tp.code === selectedTpCode) || tujuanPembelajaran[0];
  }, [tujuanPembelajaran, selectedTpCode]);

  const activeElement = useMemo(() => {
    if (!activeTp) return cpElements[0] || { name: 'Menyimak', deskripsi: '' };
    return (
      cpElements.find((el) => el.name.toLowerCase() === activeTp.element.toLowerCase()) ||
      cpElements[0] || { name: activeTp.element, deskripsi: '' }
    );
  }, [cpElements, activeTp]);

  // Dynamic stats
  const stats = useMemo(() => {
    return calculateCpMappingStats(students, selectedTpCode);
  }, [students, selectedTpCode]);

  // Filter students based on search and status
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery);

      if (!matchSearch) return false;

      if (statusFilter === 'Semua') return true;

      const target =
        s.cpTargets?.[selectedTpCode] ||
        deriveCpTargetFromAssessment(s, selectedTpCode, activeElement?.name || 'CP', schoolProfile.kktpThreshold || 75);

      return target.status === statusFilter;
    });
  }, [students, searchQuery, statusFilter, selectedTpCode, activeElement, schoolProfile.kktpThreshold]);

  // Handle local change of student target
  const handleLevelSelect = (student: StudentRecord, level: CpMasteryLevel) => {
    const existing =
      student.cpTargets?.[selectedTpCode] ||
      deriveCpTargetFromAssessment(student, selectedTpCode, activeElement?.name || 'CP', schoolProfile.kktpThreshold || 75);

    let defaultScore = existing.skor;
    let status: 'Tercapai' | 'Dalam Proses' | 'Perlu Penguatan' = 'Tercapai';

    if (level === 'Mahir') {
      defaultScore = Math.max(92, existing.skor);
      status = 'Tercapai';
    } else if (level === 'Cakap') {
      defaultScore = Math.max(82, existing.skor);
      status = 'Tercapai';
    } else if (level === 'Cukup') {
      defaultScore = 70;
      status = 'Dalam Proses';
    } else {
      defaultScore = 60;
      status = 'Perlu Penguatan';
    }

    const updatedTarget: StudentCpTarget = {
      ...existing,
      elementName: activeElement?.name || 'CP',
      tpCode: selectedTpCode,
      targetLevel: level,
      skor: defaultScore,
      status,
    };

    updateStudentCpTarget(student.id, selectedTpCode, updatedTarget);
  };

  const handleScoreChange = (student: StudentRecord, score: number) => {
    const safeScore = Math.max(0, Math.min(100, score || 0));
    const existing =
      student.cpTargets?.[selectedTpCode] ||
      deriveCpTargetFromAssessment(student, selectedTpCode, activeElement?.name || 'CP', schoolProfile.kktpThreshold || 75);

    let targetLevel: CpMasteryLevel = 'Cakap';
    let status: 'Tercapai' | 'Dalam Proses' | 'Perlu Penguatan' = 'Tercapai';

    if (safeScore >= 90) {
      targetLevel = 'Mahir';
      status = 'Tercapai';
    } else if (safeScore >= (schoolProfile.kktpThreshold || 75)) {
      targetLevel = 'Cakap';
      status = 'Tercapai';
    } else if (safeScore >= 65) {
      targetLevel = 'Cukup';
      status = 'Dalam Proses';
    } else {
      targetLevel = 'Perlu Bimbingan';
      status = 'Perlu Penguatan';
    }

    const updatedTarget: StudentCpTarget = {
      ...existing,
      elementName: activeElement?.name || 'CP',
      tpCode: selectedTpCode,
      targetLevel,
      skor: safeScore,
      status,
    };

    updateStudentCpTarget(student.id, selectedTpCode, updatedTarget);
  };

  const handleNoteChange = (student: StudentRecord, note: string) => {
    const existing =
      student.cpTargets?.[selectedTpCode] ||
      deriveCpTargetFromAssessment(student, selectedTpCode, activeElement?.name || 'CP', schoolProfile.kktpThreshold || 75);

    const updatedTarget: StudentCpTarget = {
      ...existing,
      elementName: activeElement?.name || 'CP',
      tpCode: selectedTpCode,
      catatanGuru: note,
    };

    updateStudentCpTarget(student.id, selectedTpCode, updatedTarget);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-500/30 shadow-md my-5 space-y-5 animate-in fade-in duration-300">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Pemetaan Mandiri Capaian Target CP Per Siswa</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                KepKa BSKAP No. 046/2025
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-100 text-teal-900 border border-teal-300">
                Terintegrasi Modul Asesmen
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
              Catat dan pantau capaian target Capaian Pembelajaran (CP) individual untuk setiap peserta didik. 
              Setiap catatan target otomatis disinkronkan ke dalam <strong className="text-slate-800">Nilai Asesmen Formatif</strong> dan narasi capaian <strong className="text-slate-800">Rapor Kurikulum Merdeka</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4" />
                <span>Ciutkan Panel</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Buka Panel Pemetaan</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveView('asesmen')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            title="Buka Halaman Pengolahan Nilai Asesmen & Rapor Lengkap"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Ke Modul Asesmen</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-5">
          {/* Statistical Highlights HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200/80">
              <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider">Total Siswa</p>
              <p className="text-xl font-black text-emerald-950 mt-0.5">{stats.totalStudents}</p>
              <p className="text-[10px] text-slate-500">Kelas {schoolProfile.grade}</p>
            </div>

            <div className="bg-teal-50/70 p-3 rounded-2xl border border-teal-200/80">
              <p className="text-[10px] text-teal-800 font-bold uppercase tracking-wider">Target Tercapai</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <p className="text-xl font-black text-teal-950">{stats.achievementPercentage}%</p>
                <span className="text-[10px] text-teal-700 font-bold">({stats.targetAchievedCount} siswa)</span>
              </div>
              <p className="text-[10px] text-slate-500">Target KKTP {schoolProfile.kktpThreshold || 75}</p>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/80">
              <p className="text-[10px] text-amber-800 font-bold uppercase tracking-wider">Dalam Proses</p>
              <p className="text-xl font-black text-amber-950 mt-0.5">{stats.inProgressCount}</p>
              <p className="text-[10px] text-slate-500">Rentang 65 - 74</p>
            </div>

            <div className="bg-rose-50/70 p-3 rounded-2xl border border-rose-200/80">
              <p className="text-[10px] text-rose-800 font-bold uppercase tracking-wider">Perlu Bimbingan</p>
              <p className="text-xl font-black text-rose-950 mt-0.5">{stats.needInterventionCount}</p>
              <p className="text-[10px] text-slate-500">Remedial/Intervensi</p>
            </div>

            <div className="bg-indigo-50/70 p-3 rounded-2xl border border-indigo-200/80">
              <p className="text-[10px] text-indigo-800 font-bold uppercase tracking-wider">Rata-Rata Skor</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <p className="text-xl font-black text-indigo-950">{stats.averageScore}</p>
                <TrendingUp className="w-4 h-4 text-indigo-600" />
              </div>
              <p className="text-[10px] text-slate-500">Skala 0 - 100</p>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">Tingkat Mahir</p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{stats.masteryDistribution.mahir}</p>
              <p className="text-[10px] text-slate-500">Skor &gt;= 90</p>
            </div>
          </div>

          {/* Interactive Controls & Filters */}
          <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200/90 space-y-3.5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              {/* TP & CP Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Fokus Capaian Target:</span>
                <select
                  value={selectedTpCode}
                  onChange={(e) => setSelectedTpCode(e.target.value)}
                  className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                >
                  {tujuanPembelajaran.map((tp) => (
                    <option key={tp.id} value={tp.code}>
                      {tp.code}: {tp.element} — {tp.materiPokok}
                    </option>
                  ))}
                </select>

                <div className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                  <span>Elemen:</span>
                  <span className="underline decoration-emerald-600 decoration-1">{activeElement?.name}</span>
                </div>
              </div>

              {/* Action Buttons: Sync with Assessment */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => pullAssessmentScoresToCpTargets(selectedTpCode, activeElement?.name || 'CP')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Tarik data otomatis dari nilai asesmen siswa yang sudah ada ke dalam pemetaan target"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Tarik dari Nilai Asesmen</span>
                </button>

                <button
                  type="button"
                  onClick={() => syncAllCpTargetsToAssessment(selectedTpCode)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                  title="Sinkronkan seluruh pemetaan target CP siswa ke modul asesmen & deskripsi rapor"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Sinkronkan ke Modul Asesmen</span>
                </button>
              </div>
            </div>

            {/* CP Element Official Description Banner */}
            {activeElement?.deskripsi && (
              <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/90 text-xs flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-bold text-emerald-950">
                      Capaian Elemen "{activeElement.name}" (KepKa BSKAP 046/2025):
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-900 font-extrabold">
                      {activeTp?.code} • {activeTp?.hotsCategory}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-snug italic">
                    "{activeElement.deskripsi}"
                  </p>
                </div>
              </div>
            )}

            {/* Search and Status Filter Pills */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shrink-0">
                {(['Semua', 'Tercapai', 'Dalam Proses', 'Perlu Penguatan'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari siswa berdasarkan nama atau NISN..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Student Target Records List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>Menampilkan {filteredStudents.length} dari {students.length} Siswa</span>
              <span className="hidden sm:inline">Pilih tingkat kemahiran &amp; skor untuk mencatat capaian target</span>
            </div>

            <div className="grid grid-cols-1 gap-3 max-h-[620px] overflow-y-auto pr-1">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  Tidak ditemukan siswa dengan kriteria filter "{searchQuery || statusFilter}".
                </div>
              ) : (
                filteredStudents.map((std, idx) => {
                  const target =
                    std.cpTargets?.[selectedTpCode] ||
                    deriveCpTargetFromAssessment(std, selectedTpCode, activeElement?.name || 'CP', schoolProfile.kktpThreshold || 75);

                  const isTercapai = target.status === 'Tercapai';
                  const isInProgress = target.status === 'Dalam Proses';

                  return (
                    <div
                      key={std.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all space-y-3"
                    >
                      {/* Student Info & Status Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-900 flex items-center justify-center font-black text-xs shrink-0 border border-emerald-200">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                                {std.name}
                              </h4>
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                                {std.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">
                              NISN: {std.nisn} • Nilai Rapor Saat Ini: <strong className="text-slate-800">{std.nilaiAkhir}</strong> ({std.predikat})
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${
                              isTercapai
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                : isInProgress
                                ? 'bg-amber-50 text-amber-800 border-amber-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                            }`}
                          >
                            {isTercapai ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : isInProgress ? (
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            ) : (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            )}
                            <span>{target.status}</span>
                          </span>

                          <div className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-xl text-xs font-bold text-slate-800">
                            <span className="text-[10px] text-slate-500">Skor:</span>
                            <span className="text-emerald-800 font-black">{target.skor}</span>
                          </div>
                        </div>
                      </div>

                      {/* Interactive Controls Row: Mastery Buttons + Score Input */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1 border-t border-slate-100 items-center">
                        {/* 4 Mastery Level Buttons */}
                        <div className="md:col-span-8 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] font-bold text-slate-600 mr-1">Tingkat Capaian:</span>
                          {(
                            [
                              { key: 'Mahir', label: 'Mahir (>=90)', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                              { key: 'Cakap', label: 'Cakap (75-89)', color: 'border-teal-500 bg-teal-50 text-teal-900' },
                              { key: 'Cukup', label: 'Cukup (65-74)', color: 'border-amber-500 bg-amber-50 text-amber-900' },
                              { key: 'Perlu Bimbingan', label: 'Perlu Bimbingan (<65)', color: 'border-rose-500 bg-rose-50 text-rose-900' },
                            ] as const
                          ).map((lvl) => {
                            const isSelected = target.targetLevel === lvl.key;
                            return (
                              <button
                                key={lvl.key}
                                type="button"
                                onClick={() => handleLevelSelect(std, lvl.key)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                                  isSelected
                                    ? `${lvl.color} ring-2 ring-emerald-500/20 font-black shadow-2xs`
                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                {lvl.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Direct Score Adjustment */}
                        <div className="md:col-span-4 flex items-center justify-end gap-2">
                          <label className="text-[11px] font-bold text-slate-600 shrink-0">
                            Atur Skor:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={target.skor}
                            onChange={(e) => handleScoreChange(std, Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-center text-slate-900 focus:ring-2 focus:ring-emerald-500"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              showNotification(
                                'success',
                                `Capaian ${std.name} (${selectedTpCode}) telah diperbarui & terintegrasi dengan modul asesmen.`
                              );
                            }}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            Simpan
                          </button>
                        </div>
                      </div>

                      {/* Teacher Notes & Differentiation */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                            <span>Catatan Target &amp; Diferensiasi Belajar (Rapor):</span>
                          </label>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <span>Preset:</span>
                            {QUICK_NOTE_PRESETS.slice(0, 2).map((preset, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleNoteChange(std, preset)}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-900 cursor-pointer text-[10px]"
                              >
                                Opsi {pIdx + 1}
                              </button>
                            ))}
                          </div>
                        </div>

                        <input
                          type="text"
                          value={target.catatanGuru || ''}
                          onChange={(e) => handleNoteChange(std, e.target.value)}
                          placeholder="Masukkan catatan spesifik kompetensi siswa atau diferensiasi yang diberikan..."
                          className="w-full px-3 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

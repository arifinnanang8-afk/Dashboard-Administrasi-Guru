import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Clock,
  ArrowLeft,
  ArrowRight,
  Printer,
  Download,
  Save,
  CheckCircle2,
  CalendarDays,
  Search,
  Upload,
  RefreshCw,
  FileSpreadsheet,
  Building2,
  Sparkles,
  Plus,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import {
  calculateRpeTotals,
  analyzeRealTeachingSchedule,
  adaptKaldikEventsToAcademicYear,
  buildStandardYearRpeFromKaldik,
  syncMonthRpeDetailUpdate,
  TeachingDayName,
} from '../utils/curriculumLogic';
import { exportRpeToWord, exportKaldikToWord, exportRpeToExcel } from '../utils/exporter';
import { PipelineSyncHeader } from '../components/PipelineSyncHeader';
import { IdentitasPerangkat } from '../components/IdentitasPerangkat';
import { JadwalMengajarRiilPanel } from '../components/JadwalMengajarRiilPanel';
import { KalenderRpeStepNav, KalenderRpeStep } from '../components/KalenderRpeStepNav';
import { IdentitasJadwalPanel } from '../components/IdentitasJadwalPanel';
import { KalenderPendidikanGrid } from '../components/KalenderPendidikanGrid';
import { AnalisisMingguEfektifTable } from '../components/AnalisisMingguEfektifTable';
import { DistribusiPekanSemesterTable } from '../components/DistribusiPekanSemesterTable';
import { ProgramAlokasiWaktuPanel } from '../components/ProgramAlokasiWaktuPanel';
import {
  REGIONAL_KALDIK_DATABASE,
  RegionalKaldikPreset,
  parseUploadedKaldikFile,
  computeRpeFromKaldikEvents,
  downloadKaldikExcelTemplate,
} from '../utils/regionalKaldikDatabase';
import { KaldikEvent, MonthRpeDetail } from '../types';

export const RpeView: React.FC = () => {
  const {
    rpe,
    updateRpe,
    prota,
    promes,
    kaldikEvents,
    addKaldikEvent,
    updateKaldikEvent,
    deleteKaldikEvent,
    syncKaldikAndRpe,
    runMasterSync,
    schoolProfile,
    updateSchoolProfile,
    setActiveView,
    openPrintModal,
    showNotification,
  } = useApp();

  const [activeStep, setActiveStep] = useState<KalenderRpeStep>(2);
  const [selectedDays, setSelectedDays] = useState<TeachingDayName[]>(() => {
    try {
      const saved = localStorage.getItem('guru_selected_teaching_days_v1');
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
  const [activeSemester, setActiveSemester] = useState<1 | 2>(1);
  const [step3ViewMode, setStep3ViewMode] = useState<'all' | 1 | 2>('all');
  const [rpeData, setRpeData] = useState(rpe);
  const [isKaldikPanelOpen, setIsKaldikPanelOpen] = useState<boolean>(true);
  const [activeKaldikTab, setActiveKaldikTab] = useState<'cari_dinas' | 'upload_dokumen' | 'daftar_agenda'>('cari_dinas');

  // Search & Filter state for Regional Dinas Pendidikan Kaldik
  const [searchDinasQuery, setSearchDinasQuery] = useState<string>('');
  const [selectedRegionGroup, setSelectedRegionGroup] = useState<string>('Semua');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('kaldik-lampung');
  const [activeSourceLabel, setActiveSourceLabel] = useState<string>(
    'Dinas Pendidikan dan Kebudayaan Provinsi Lampung (SK No. 800/1425/V.01/DP.1/2026)'
  );
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // Quick Add Agenda inside RPE View
  const [newAgendaName, setNewAgendaName] = useState('');
  const [newAgendaStart, setNewAgendaStart] = useState('2026-08-17');
  const [newAgendaEnd, setNewAgendaEnd] = useState('2026-08-17');
  const [newAgendaType, setNewAgendaType] = useState<KaldikEvent['type']>('kegiatan_sekolah');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep local rpeData in sync if global rpe changes externally
  useEffect(() => {
    setRpeData(rpe);
  }, [rpe]);

  const s1Totals = calculateRpeTotals(
    rpeData.semester1.months,
    rpeData.semester1.jpPerWeek,
    rpeData.semester1.cadanganJp
  );
  const s2Totals = calculateRpeTotals(
    rpeData.semester2.months,
    rpeData.semester2.jpPerWeek,
    rpeData.semester2.cadanganJp
  );

  const realMeetingAnalysis = useMemo(() => {
    return analyzeRealTeachingSchedule({
      academicYear: schoolProfile.academicYear || '2026/2027',
      selectedDays,
      kaldikEvents,
      jpPerWeekS1: rpeData.semester1.jpPerWeek,
      jpPerWeekS2: rpeData.semester2.jpPerWeek,
    });
  }, [
    schoolProfile.academicYear,
    selectedDays,
    kaldikEvents,
    rpeData.semester1.jpPerWeek,
    rpeData.semester2.jpPerWeek,
  ]);

  const s1EffectiveMeetingsTotal = useMemo(() => {
    return rpeData.semester1.months.reduce((acc, m, idx) => {
      const realM = realMeetingAnalysis.semester1.months[idx];
      const fallback = m.effectiveWeeks === 0 ? 0 : realM ? realM.effectiveCount : m.effectiveWeeks;
      return acc + (m.effectiveMeetings !== undefined ? m.effectiveMeetings : fallback);
    }, 0);
  }, [rpeData.semester1.months, realMeetingAnalysis.semester1.months]);

  const s2EffectiveMeetingsTotal = useMemo(() => {
    return rpeData.semester2.months.reduce((acc, m, idx) => {
      const realM = realMeetingAnalysis.semester2.months[idx];
      const fallback = m.effectiveWeeks === 0 ? 0 : realM ? realM.effectiveCount : m.effectiveWeeks;
      return acc + (m.effectiveMeetings !== undefined ? m.effectiveMeetings : fallback);
    }, 0);
  }, [rpeData.semester2.months, realMeetingAnalysis.semester2.months]);

  const displayedSummaryStats = useMemo(() => {
    if (step3ViewMode === 1) {
      return {
        labelScope: 'Total 6 Bulan (Semester 1)',
        totalWeeks: s1Totals.totalWeeks,
        nonEffectiveWeeks: s1Totals.nonEffectiveWeeks,
        effectiveWeeks: s1Totals.effectiveWeeks,
        effectiveMeetings: s1EffectiveMeetingsTotal,
        grossJp: s1Totals.grossJp,
        netJp: s1Totals.netJp,
        jpSubtitle: `${rpeData.semester1.jpPerWeek} JP/Minggu · Bersih ${s1Totals.netJp} JP`,
      };
    }
    if (step3ViewMode === 2) {
      return {
        labelScope: 'Total 6 Bulan (Semester 2)',
        totalWeeks: s2Totals.totalWeeks,
        nonEffectiveWeeks: s2Totals.nonEffectiveWeeks,
        effectiveWeeks: s2Totals.effectiveWeeks,
        effectiveMeetings: s2EffectiveMeetingsTotal,
        grossJp: s2Totals.grossJp,
        netJp: s2Totals.netJp,
        jpSubtitle: `${rpeData.semester2.jpPerWeek} JP/Minggu · Bersih ${s2Totals.netJp} JP`,
      };
    }
    return {
      labelScope: 'Total 12 Bulan (Smt 1 + Smt 2)',
      totalWeeks: s1Totals.totalWeeks + s2Totals.totalWeeks,
      nonEffectiveWeeks: s1Totals.nonEffectiveWeeks + s2Totals.nonEffectiveWeeks,
      effectiveWeeks: s1Totals.effectiveWeeks + s2Totals.effectiveWeeks,
      effectiveMeetings: s1EffectiveMeetingsTotal + s2EffectiveMeetingsTotal,
      grossJp: s1Totals.grossJp + s2Totals.grossJp,
      netJp: s1Totals.netJp + s2Totals.netJp,
      jpSubtitle: `Smt 1: ${s1Totals.netJp} JP + Smt 2: ${s2Totals.netJp} JP (Bersih)`,
    };
  }, [
    step3ViewMode,
    s1Totals,
    s2Totals,
    s1EffectiveMeetingsTotal,
    s2EffectiveMeetingsTotal,
    rpeData.semester1.jpPerWeek,
    rpeData.semester2.jpPerWeek,
  ]);

  // Filter Dinas Pendidikan Presets
  const filteredDinasList = REGIONAL_KALDIK_DATABASE.filter((item) => {
    const matchGroup =
      selectedRegionGroup === 'Semua' || item.regionGroup === selectedRegionGroup;
    const q = searchDinasQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      item.province.toLowerCase().includes(q) ||
      item.dinasName.toLowerCase().includes(q) ||
      item.skNumber.toLowerCase().includes(q) ||
      item.jenjang.toLowerCase().includes(q) ||
      item.highlights.some((h) => h.toLowerCase().includes(q));
    return matchGroup && matchQuery;
  });

  const handleApplyRegionalKaldik = (preset: RegionalKaldikPreset) => {
    const clonedRpe = JSON.parse(JSON.stringify(preset.rpe));
    const clonedEvents = JSON.parse(JSON.stringify(preset.events));
    setSelectedPresetId(preset.id);
    setRpeData(clonedRpe);
    setActiveSourceLabel(`${preset.dinasName} (${preset.skNumber})`);
    syncKaldikAndRpe(
      clonedRpe,
      clonedEvents,
      `Kalender Pendidikan ${preset.province} (${preset.skNumber}) berhasil diterapkan & disinkronkan otomatis ke RPE!`
    );
  };

  const handleUploadKaldikDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseUploadedKaldikFile(file, rpeData);
      setUploadedFileName(file.name);
      setRpeData(result.rpe);
      setActiveSourceLabel(result.sourceTitle);
      syncKaldikAndRpe(result.rpe, result.events, result.summaryText);
    } catch (err: any) {
      showNotification(
        'error',
        `Gagal membaca dokumen Kalender Pendidikan: ${err?.message || 'Format tidak didukung'}`
      );
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleAutoRecalculateFromEvents = () => {
    const syncedRpe = computeRpeFromKaldikEvents(
      kaldikEvents,
      rpeData,
      schoolProfile.academicYear || '2026/2027'
    );
    setRpeData(syncedRpe);
    updateRpe(syncedRpe);
    runMasterSync();
    showNotification(
      'success',
      'Sinkron Otomatis Selesai: Agenda Kalender Pendidikan ↔ Pekan Efektif RPE ↔ PROTA (100% Selaras)!'
    );
  };

  const handleQuickAddAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgendaName.trim()) return;
    const created: KaldikEvent = {
      id: `rpe-ev-${Date.now()}`,
      name: newAgendaName.trim(),
      dateStart: newAgendaStart,
      dateEnd: newAgendaEnd || newAgendaStart,
      type: newAgendaType,
      color: newAgendaType === 'libur_nasional' ? '#ef4444' : '#3b82f6',
      notes: 'Ditambahkan dari Analisis RPE (Auto-Sync)',
    };
    const nextEvents = [...kaldikEvents, created];
    addKaldikEvent(created);
    setNewAgendaName('');

    if (autoSyncEnabled) {
      const nextRpe = computeRpeFromKaldikEvents(
        nextEvents,
        rpeData,
        schoolProfile.academicYear || '2026/2027'
      );
      setRpeData(nextRpe);
      updateRpe(nextRpe);
    }
  };

  const handleAddCalendarAgenda = (created: KaldikEvent) => {
    const nextEvents = [...kaldikEvents, created];
    addKaldikEvent(created);
    if (autoSyncEnabled) {
      const nextRpe = computeRpeFromKaldikEvents(
        nextEvents,
        rpeData,
        schoolProfile.academicYear || '2026/2027'
      );
      setRpeData(nextRpe);
      updateRpe(nextRpe);
    }
  };

  const handleUpdateCalendarAgenda = (updated: KaldikEvent) => {
    const nextEvents = kaldikEvents.map((ev) => (ev.id === updated.id ? updated : ev));
    updateKaldikEvent(updated);
    if (autoSyncEnabled) {
      const nextRpe = computeRpeFromKaldikEvents(
        nextEvents,
        rpeData,
        schoolProfile.academicYear || '2026/2027'
      );
      setRpeData(nextRpe);
      updateRpe(nextRpe);
    }
  };

  const handleDeleteAgendaFromRpe = (id: string) => {
    const nextEvents = kaldikEvents.filter((ev) => ev.id !== id);
    deleteKaldikEvent(id);
    if (autoSyncEnabled) {
      const nextRpe = computeRpeFromKaldikEvents(
        nextEvents,
        rpeData,
        schoolProfile.academicYear || '2026/2027'
      );
      setRpeData(nextRpe);
      updateRpe(nextRpe);
    }
  };

  const handleAdaptCalendarToYear = (nextAcademicYear: string) => {
    const adaptedEvents = adaptKaldikEventsToAcademicYear(kaldikEvents, nextAcademicYear);
    const syncedRpe = computeRpeFromKaldikEvents(adaptedEvents, rpeData, nextAcademicYear);
    updateSchoolProfile({ academicYear: nextAcademicYear });
    setRpeData(syncedRpe);
    syncKaldikAndRpe(
      syncedRpe,
      adaptedEvents,
      `Kalender Pendidikan & RPE disesuaikan otomatis ke Tahun Pelajaran ${nextAcademicYear}!`
    );
  };

  const handleUpdateMonthAnySemester = (
    semester: 1 | 2,
    monthIdx: number,
    updates: Partial<MonthRpeDetail>
  ) => {
    const updated = JSON.parse(JSON.stringify(rpeData));
    const targetMonths =
      semester === 1 ? updated.semester1.months : updated.semester2.months;
    if (!targetMonths[monthIdx]) return;

    const realMonths =
      semester === 1
        ? realMeetingAnalysis.semester1.months
        : realMeetingAnalysis.semester2.months;
    const defaultRealMeetings = realMonths[monthIdx]?.effectiveCount ?? targetMonths[monthIdx].effectiveWeeks;
    const meetingsPerWeek = Math.max(1, selectedDays.length);

    targetMonths[monthIdx] = syncMonthRpeDetailUpdate(
      targetMonths[monthIdx],
      updates,
      defaultRealMeetings,
      meetingsPerWeek
    );

    setRpeData(updated);
    if (autoSyncEnabled) {
      updateRpe(updated);
    }
  };

  const handleResetRpeToKaldikStandard = () => {
    const standardRpe = buildStandardYearRpeFromKaldik({
      kaldikEvents,
      jpPerWeekS1: rpeData.semester1.jpPerWeek,
      jpPerWeekS2: rpeData.semester2.jpPerWeek,
      cadanganJpS1: rpeData.semester1.cadanganJp,
      cadanganJpS2: rpeData.semester2.cadanganJp,
      academicYear: schoolProfile.academicYear || '2026/2027',
    });
    setRpeData(standardRpe);
    updateRpe(standardRpe);
    showNotification(
      'success',
      'Tabel Analisis Minggu & Pertemuan Efektif dikembalikan ke hitungan standar Kalender Pendidikan!'
    );
  };

  const handleSaveRpe = () => {
    updateRpe(rpeData);
  };

  const handleExportWord = async () => {
    updateRpe(rpeData);
    await exportRpeToWord(
      rpeData,
      schoolProfile,
      `RPE_${schoolProfile.subject.replace(/\s+/g, '_')}_${schoolProfile.academicYear.replace('/', '-')}.docx`,
      { kaldikEvents, prota, promes, selectedDays }
    );
    showNotification('success', 'Dokumen Kalender & RPE lengkap (12 Bulan, Smt 1 & 2, TP, Kaldik) berhasil diunduh ke Word (.docx)!');
  };

  return (
    <div className="space-y-6">
      <PipelineSyncHeader />
      <IdentitasPerangkat
        documentTitle="Rincian Pekan Efektif (RPE) & Alokasi JP (MEF & JP)"
        semesterSpecific={activeSemester}
      />

      {/* Hidden File Input for Kaldik Document Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUploadKaldikDocument}
        accept=".xlsx,.xls,.csv,.json,.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
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
              <Clock className="w-5 h-5 text-indigo-600" />
              Analisis RPE (Rincian Pekan Efektif & Alokasi JP) & Kalender Pendidikan
            </h2>
            <p className="text-xs text-slate-500">
              Terintegrasi Kalender Pendidikan Dinas Pendidikan Daerah Terupdate & Upload Dokumen Kaldik (Sinkron Otomatis)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setActiveStep(2);
              setIsKaldikPanelOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeStep === 2 && isKaldikPanelOpen
                ? 'bg-indigo-700 text-white border-indigo-700 shadow-sm'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>Menu Kalender Pendidikan Daerah</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Upload Dokumen Kalender Pendidikan (Excel, PDF, Word, JSON)"
          >
            <Upload className="w-4 h-4 text-amber-700" />
            <span>Upload Dokumen Kaldik</span>
          </button>

          <button
            onClick={handleAutoRecalculateFromEvents}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Sinkronkan Otomatis Kalender Pendidikan ke Tabel RPE dan PROTA"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sinkron Otomatis</span>
          </button>

          <button
            onClick={handleSaveRpe}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Simpan RPE</span>
          </button>

          <button
            onClick={() => {
              updateRpe(rpeData);
              exportRpeToExcel(rpeData, schoolProfile, {
                kaldikEvents,
                prota,
                promes,
                selectedDays,
              });
              showNotification('success', 'Dokumen lengkap Kalender & RPE (12 Bulan, Smt 1 & 2, TP, Kaldik) berhasil diekspor ke Excel (.xlsx)!');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Ekspor seluruh dokumen Kalender & RPE ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Word</span>
          </button>

          <button
            onClick={() => {
              updateRpe(rpeData);
              openPrintModal('rpe');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Cetak seluruh dokumen Kalender & RPE atau Ekspor ke PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Ekspor PDF / Cetak</span>
          </button>
        </div>
      </div>

      {/* Active Synchronization Status Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 text-white p-4 rounded-2xl border border-indigo-500/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-emerald-300 uppercase tracking-wider text-[10px] bg-emerald-950/90 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                ● SINKRON OTOMATIS AKTIF
              </span>
              <span className="text-slate-300 font-medium">
                Sumber Kalender Pendidikan Aktif:
              </span>
            </div>
            <p className="font-bold text-sm text-white mt-0.5">{activeSourceLabel}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSyncEnabled}
              onChange={(e) => setAutoSyncEnabled(e.target.checked)}
              className="rounded text-emerald-500 focus:ring-0"
            />
            <span className="text-[11px] font-semibold text-emerald-200">
              Auto-Sinkron RPE saat Kaldik Berubah
            </span>
          </label>

          <button
            onClick={() => setActiveView('kaldik')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] border border-white/15 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Halaman Penuh Kaldik</span>
          </button>
        </div>
      </div>

      {/* 4-STEP MENU BAR KALENDER & RPE */}
      <KalenderRpeStepNav
        activeStep={activeStep}
        onSelectStep={(step) => {
          setActiveStep(step);
          if (step === 2) setIsKaldikPanelOpen(true);
        }}
        academicYear={schoolProfile.academicYear}
      />

      {/* STEP 1: IDENTITAS & JADWAL MENGAJAR */}
      {activeStep === 1 && (
        <IdentitasJadwalPanel
          selectedDays={selectedDays}
          onSelectedDaysChange={setSelectedDays}
          onNextStep={() => setActiveStep(2)}
        />
      )}

      {/* STEP 2: MENU KALENDER PENDIDIKAN (PENCARIAN DINAS PENDIDIKAN DAERAH & UPLOAD DOKUMEN KALDIK) */}
      {activeStep === 2 && isKaldikPanelOpen && (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md overflow-hidden">
          {/* Panel Header & Sub-Tabs */}
          <div className="p-4 bg-indigo-50/80 border-b border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CalendarDays className="w-5 h-5 text-indigo-700" />
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                  Menu Kalender Pendidikan Daerah Terupdate & Upload Dokumen Kaldik
                </h3>
                <p className="text-[11px] text-slate-600">
                  Pilih Kalender Pendidikan sesuai Dinas Pendidikan Provinsi/Kabupaten/Kota atau unggah dokumen Kaldik sekolah untuk sinkronisasi otomatis RPE
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveKaldikTab('cari_dinas')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeKaldikTab === 'cari_dinas'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                🔍 Cari Dinas Pendidikan Daerah (38 Provinsi)
              </button>
              <button
                onClick={() => setActiveKaldikTab('upload_dokumen')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeKaldikTab === 'upload_dokumen'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                📤 Upload Dokumen Kaldik Sekolah/Daerah
              </button>
              <button
                onClick={() => setActiveKaldikTab('daftar_agenda')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeKaldikTab === 'daftar_agenda'
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                📋 Agenda Kaldik Tersinkron ({kaldikEvents.length})
              </button>
            </div>
          </div>

          {/* PILIH HARI JADWAL MENGAJAR DI KELAS (UNTUK ANALISIS PERTEMUAN RIIL) */}
          <JadwalMengajarRiilPanel
            selectedDays={selectedDays}
            onSelectedDaysChange={setSelectedDays}
          />

          {/* TAB 1: PENCARIAN KALENDER PENDIDIKAN DINAS PENDIDIKAN DAERAH */}
          {activeKaldikTab === 'cari_dinas' && (
            <div className="p-5 space-y-4">
              {/* Quick Dropdown + Search Bar */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Search Input */}
                <div className="lg:col-span-5 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchDinasQuery}
                    onChange={(e) => setSearchDinasQuery(e.target.value)}
                    placeholder="Cari provinsi, kab/kota, Kemenag, atau nomor SK Kadisdik..."
                    className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white font-medium"
                  />
                </div>

                {/* Direct Scrollable Select Dropdown */}
                <div className="lg:col-span-5 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <select
                    value={selectedPresetId}
                    onChange={(e) => {
                      const found = REGIONAL_KALDIK_DATABASE.find((r) => r.id === e.target.value);
                      if (found) handleApplyRegionalKaldik(found);
                    }}
                    className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    {REGIONAL_KALDIK_DATABASE.map((reg) => (
                      <option key={reg.id} value={reg.id}>
                        {reg.province} — {reg.skNumber}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Instant Apply Button */}
                <div className="lg:col-span-2">
                  <button
                    onClick={() => {
                      const found =
                        REGIONAL_KALDIK_DATABASE.find((r) => r.id === selectedPresetId) ||
                        REGIONAL_KALDIK_DATABASE[0];
                      handleApplyRegionalKaldik(found);
                    }}
                    className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sinkronkan</span>
                  </button>
                </div>
              </div>

              {/* Region Island Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {[
                  'Semua',
                  'Sumatera',
                  'Jawa',
                  'Bali & Nusa Tenggara',
                  'Kalimantan',
                  'Sulawesi',
                  'Maluku & Papua',
                  'Kemenag Nasional',
                ].map((grp) => (
                  <button
                    key={grp}
                    onClick={() => setSelectedRegionGroup(grp)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      selectedRegionGroup === grp
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {grp}
                  </button>
                ))}
              </div>

              {/* Grid of Regional Dinas Pendidikan Kaldik Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[340px] overflow-y-auto pr-1">
                {filteredDinasList.map((reg) => {
                  const isSelected = selectedPresetId === reg.id;
                  const regS1 = calculateRpeTotals(
                    reg.rpe.semester1.months,
                    reg.rpe.semester1.jpPerWeek,
                    reg.rpe.semester1.cadanganJp
                  );
                  const regS2 = calculateRpeTotals(
                    reg.rpe.semester2.months,
                    reg.rpe.semester2.jpPerWeek,
                    reg.rpe.semester2.cadanganJp
                  );

                  return (
                    <div
                      key={reg.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between gap-3 text-xs ${
                        isSelected
                          ? 'bg-indigo-50/70 border-2 border-indigo-600 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-bold text-[10px]">
                            {reg.regionGroup}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {reg.updatedAt}
                          </span>
                        </div>
                        <h4 className="font-black text-slate-900 text-xs leading-snug">
                          {reg.province}
                        </h4>
                        <p className="text-[11px] font-semibold text-indigo-800">
                          {reg.dinasName}
                        </p>
                        <p className="text-[10px] font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                          {reg.skNumber}
                        </p>
                        <ul className="space-y-0.5 text-[11px] text-slate-600 pt-1">
                          {reg.highlights.map((h, i) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-emerald-600 font-bold">•</span>
                              <span>{h}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        <div className="text-[10px] font-bold text-slate-700">
                          <span>Smt 1: {regS1.effectiveWeeks} Mgg</span>
                          <span className="mx-1">·</span>
                          <span>Smt 2: {regS2.effectiveWeeks} Mgg</span>
                        </div>
                        <button
                          onClick={() => handleApplyRegionalKaldik(reg)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-700 text-white'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                          }`}
                        >
                          {isSelected ? '✓ Tersinkron' : 'Pilih & Sinkronkan'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: UPLOAD DOKUMEN KALENDER PENDIDIKAN */}
          {activeKaldikTab === 'upload_dokumen' && (
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Upload Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-indigo-400 hover:border-indigo-600 bg-indigo-50/40 hover:bg-indigo-50/80 rounded-2xl p-6 text-center space-y-3 cursor-pointer transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">
                      Klik untuk Upload Dokumen Kalender Pendidikan
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Mendukung format: <span className="font-bold">Excel (.xlsx, .xls, .csv), Word (.docx, .doc), PDF (.pdf), JSON (.json), & Gambar Kaldik</span>
                    </p>
                  </div>
                  {uploadedFileName && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      <span>File Terakhir Diunggah: {uploadedFileName}</span>
                    </div>
                  )}
                </div>

                {/* Instructions & Template Download */}
                <div className="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Cara Kerja Sinkronisasi Otomatis Dokumen Kaldik</span>
                  </h4>
                  <ol className="list-decimal list-inside space-y-1.5 text-slate-700 leading-relaxed">
                    <li>
                      Unggah file Kalender Pendidikan dari Dinas Pendidikan Provinsi/Kabupaten/Kota atau Kaldik Satuan Pendidikan Anda.
                    </li>
                    <li>
                      Sistem otomatis mendeteksi daftar agenda akademik (MPLS, STS, SAS/SAT, Libur Nasional, Libur Ramadhan/Idul Fitri, dan Libur Semester).
                    </li>
                    <li>
                      Jumlah <strong>Pekan Efektif</strong>, <strong>Pekan Tidak Efektif</strong>, serta <strong>Alokasi Jam Pelajaran (JP)</strong> pada tabel RPE Semester 1 & Semester 2 langsung diperbarui secara otomatis.
                    </li>
                  </ol>
                  <div className="pt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        downloadKaldikExcelTemplate(
                          schoolProfile.schoolName,
                          schoolProfile.academicYear
                        )
                      }
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh Template Excel Kaldik (.xlsx)</span>
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Pilih File dari Komputer</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DAFTAR AGENDA KALDIK TERSINKRON & TAMBAH CEPAT */}
          {activeKaldikTab === 'daftar_agenda' && (
            <div className="p-5 space-y-4 text-xs">
              {/* Quick Add Agenda Form */}
              <form
                onSubmit={handleQuickAddAgenda}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 items-end"
              >
                <div className="sm:col-span-4">
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Nama Kegiatan / Libur Kaldik
                  </label>
                  <input
                    type="text"
                    value={newAgendaName}
                    onChange={(e) => setNewAgendaName(e.target.value)}
                    placeholder="Contoh: Libur Khusus Daerah / Workshop..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Mulai Tanggal
                  </label>
                  <input
                    type="date"
                    value={newAgendaStart}
                    onChange={(e) => setNewAgendaStart(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Selesai Tanggal
                  </label>
                  <input
                    type="date"
                    value={newAgendaEnd}
                    onChange={(e) => setNewAgendaEnd(e.target.value)}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Kategori
                  </label>
                  <select
                    value={newAgendaType}
                    onChange={(e) => setNewAgendaType(e.target.value as KaldikEvent['type'])}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
                  >
                    <option value="kegiatan_sekolah">Kegiatan Sekolah</option>
                    <option value="sts">STS (Tengah Smt)</option>
                    <option value="sas">SAS/SAT (Akhir Smt)</option>
                    <option value="libur_nasional">Libur Nasional/Daerah</option>
                    <option value="libur_semester">Libur Semester</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-2 px-3 bg-indigo-700 hover:bg-indigo-600 text-white font-bold rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah & Sinkron</span>
                  </button>
                </div>
              </form>

              {/* Compact Synchronized Agenda Table */}
              <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0">
                    <tr>
                      <th className="p-2.5 border-b">Tanggal</th>
                      <th className="p-2.5 border-b">Agenda Kalender Pendidikan</th>
                      <th className="p-2.5 border-b">Kategori</th>
                      <th className="p-2.5 border-b">Keterangan Sumber</th>
                      <th className="p-2.5 border-b text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {kaldikEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50">
                        <td className="p-2.5 font-mono font-semibold text-slate-800 whitespace-nowrap">
                          {ev.dateStart} {ev.dateEnd !== ev.dateStart ? `s.d. ${ev.dateEnd}` : ''}
                        </td>
                        <td className="p-2.5 font-bold text-slate-900">{ev.name}</td>
                        <td className="p-2.5">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 font-bold text-[10px] uppercase">
                            {ev.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-600 italic">{ev.notes}</td>
                        <td className="p-2.5 text-center">
                          <button
                            onClick={() => handleDeleteAgendaFromRpe(ev.id)}
                            className="p-1 rounded hover:bg-rose-100 text-rose-600 cursor-pointer"
                            title="Hapus Agenda & Hitung Ulang RPE"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Setiap penambahan/penghapusan agenda di atas otomatis memperbarui pekan tidak efektif pada tabel RPE di bawah.
                </span>
                <button
                  onClick={async () => {
                    await exportKaldikToWord(
                      kaldikEvents,
                      schoolProfile,
                      `KALDIK_${schoolProfile.subject.replace(/\s+/g, '_')}.docx`
                    );
                    showNotification('success', 'Tabel Kalender Pendidikan berhasil diunduh ke Word (.docx)!');
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Tabel Kaldik Word (.docx)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeStep === 2 && (
        <div className="space-y-4">
          <KalenderPendidikanGrid
            academicYear={schoolProfile.academicYear || '2026/2027'}
            selectedDays={selectedDays}
            kaldikEvents={kaldikEvents}
            onAddKaldikEvent={handleAddCalendarAgenda}
            onUpdateKaldikEvent={handleUpdateCalendarAgenda}
            onDeleteKaldikEvent={handleDeleteAgendaFromRpe}
            onAdaptCalendarToYear={handleAdaptCalendarToYear}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#109848] hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <span>Lanjut ke 3. Analisis Minggu & Pertemuan Efektif</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: ANALISIS MINGGU & PERTEMUAN EFEKTIF (TERPADU 12 BULAN ↔ SMT 1 ↔ SMT 2) */}
      {activeStep === 3 && (
        <div className="space-y-6">
          {/* Unified Filter & Next Step Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setStep3ViewMode('all')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  step3ViewMode === 'all'
                    ? 'bg-[#0d5c3e] text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Paduan Penuh (12 Bulan, Smt 1 &amp; Smt 2)
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSemester(1);
                  setStep3ViewMode(1);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  step3ViewMode === 1
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Semester 1 (Ganjil) · {s1Totals.effectiveWeeks} Mgg ({s1Totals.grossJp} JP)
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveSemester(2);
                  setStep3ViewMode(2);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  step3ViewMode === 2
                    ? 'bg-indigo-700 text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                Semester 2 (Genap) · {s2Totals.effectiveWeeks} Mgg ({s2Totals.grossJp} JP)
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveStep(4)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#109848] hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <span>Lanjut ke 4. Program Alokasi Waktu (TP)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* 3-Way Real-Time Synchronization Indicator */}
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl px-4 py-3 flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-[#109848] shrink-0" />
              <span>
                Sinkronisasi 3 Tabel Aktif: Perubahan di tabel mana pun otomatis memperbarui seluruh tabel &amp; PROTA.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-900 whitespace-nowrap">
                12 Bulan: {s1Totals.effectiveWeeks + s2Totals.effectiveWeeks} Mgg ·{' '}
                {s1EffectiveMeetingsTotal + s2EffectiveMeetingsTotal} Pertemuan ·{' '}
                {s1Totals.grossJp + s2Totals.grossJp} JP
              </span>
              <span className="text-emerald-700">↔</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-900 whitespace-nowrap">
                Smt 1: {s1Totals.effectiveWeeks} Mgg · {s1EffectiveMeetingsTotal} Pertemuan · {s1Totals.grossJp} JP
              </span>
              <span className="text-emerald-700">↔</span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 text-indigo-900 whitespace-nowrap">
                Smt 2: {s2Totals.effectiveWeeks} Mgg · {s2EffectiveMeetingsTotal} Pertemuan · {s2Totals.grossJp} JP
              </span>
            </div>
          </div>

          {/* 4 Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Jumlah Pekan Kalender</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{displayedSummaryStats.totalWeeks} Pekan</p>
              <span className="text-[11px] text-slate-500">{displayedSummaryStats.labelScope}</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-rose-600 uppercase">Pekan Tidak Efektif</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{displayedSummaryStats.nonEffectiveWeeks} Pekan</p>
              <span className="text-[11px] text-slate-500">MPLS, STS, SAS &amp; Libur Kaldik</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-emerald-600 uppercase">Pekan &amp; Pertemuan Efektif</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {displayedSummaryStats.effectiveWeeks} Pekan
              </p>
              <span className="text-[11px] text-emerald-700 font-semibold">
                {displayedSummaryStats.effectiveMeetings} Kali Tatap Muka
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-indigo-600 uppercase">Total Jam Pelajaran (JP)</span>
              <p className="text-2xl font-black text-indigo-700 mt-1">{displayedSummaryStats.grossJp} JP</p>
              <span className="text-[11px] text-indigo-700 font-semibold">
                {displayedSummaryStats.jpSubtitle}
              </span>
            </div>
          </div>

          {/* 1. 12-Month Analisis Minggu Efektif & Hari/Pertemuan Efektif */}
          <AnalisisMingguEfektifTable
            rpeData={rpeData}
            realMeetingAnalysis={realMeetingAnalysis}
            onUpdateMonth={handleUpdateMonthAnySemester}
            onResetToKaldikStandard={handleResetRpeToKaldikStandard}
          />

          {/* 2. Tabel Distribusi Pekan Efektif & Non-Efektif Semester 1 */}
          {(step3ViewMode === 'all' || step3ViewMode === 1) && (
            <DistribusiPekanSemesterTable
              semester={1}
              months={rpeData.semester1.months}
              jpPerWeek={rpeData.semester1.jpPerWeek}
              cadanganJp={rpeData.semester1.cadanganJp}
              realMonths={realMeetingAnalysis.semester1.months}
              activeSourceLabel={activeSourceLabel}
              onUpdateMonth={handleUpdateMonthAnySemester}
            />
          )}

          {/* 3. Tabel Distribusi Pekan Efektif & Non-Efektif Semester 2 */}
          {(step3ViewMode === 'all' || step3ViewMode === 2) && (
            <DistribusiPekanSemesterTable
              semester={2}
              months={rpeData.semester2.months}
              jpPerWeek={rpeData.semester2.jpPerWeek}
              cadanganJp={rpeData.semester2.cadanganJp}
              realMonths={realMeetingAnalysis.semester2.months}
              activeSourceLabel={activeSourceLabel}
              onUpdateMonth={handleUpdateMonthAnySemester}
            />
          )}

          {/* Analisis Pertemuan Riil Per Bulan Berdasarkan Hari Jadwal Mengajar */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-4 bg-emerald-50/70 border-b border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Rincian Hari Terjadwal vs Libur Kaldik (Jadwal Mengajar: {selectedDays.length > 0 ? selectedDays.join(', ') : 'Belum dipilih'})
                </h3>
                <p className="text-[11px] text-slate-600">
                  Total Pertemuan Efektif Tersinkron:{' '}
                  <strong className="text-emerald-800">
                    {displayedSummaryStats.effectiveMeetings} Pertemuan ({displayedSummaryStats.grossJp} JP Kotor · {displayedSummaryStats.netJp} JP Bersih)
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveStep(1)}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold cursor-pointer"
              >
                Ubah Hari Jadwal Mengajar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px]">
                    <th className="p-3 border-b">Bulan</th>
                    <th className="p-3 border-b text-center">Hari Terjadwal</th>
                    <th className="p-3 border-b text-center text-rose-700">Terkena Libur Kaldik</th>
                    <th className="p-3 border-b text-center text-emerald-800">Pertemuan Efektif Tersinkron</th>
                    <th className="p-3 border-b">Keterangan Tanggal Terkena Agenda / Libur</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(step3ViewMode === 1
                    ? realMeetingAnalysis.semester1.months.map((m, idx) => ({
                        m,
                        syncedM: rpeData.semester1.months[idx],
                      }))
                    : step3ViewMode === 2
                    ? realMeetingAnalysis.semester2.months.map((m, idx) => ({
                        m,
                        syncedM: rpeData.semester2.months[idx],
                      }))
                    : [
                        ...realMeetingAnalysis.semester1.months.map((m, idx) => ({
                          m,
                          syncedM: rpeData.semester1.months[idx],
                        })),
                        ...realMeetingAnalysis.semester2.months.map((m, idx) => ({
                          m,
                          syncedM: rpeData.semester2.months[idx],
                        })),
                      ]
                  ).map(({ m, syncedM }, idx) => {
                    const effectiveVal =
                      syncedM?.effectiveMeetings !== undefined
                        ? syncedM.effectiveMeetings
                        : syncedM?.effectiveWeeks === 0
                        ? 0
                        : m.effectiveCount;
                    return (
                      <tr key={`${m.monthName}-${m.year}-${idx}`} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {m.monthName} {m.year}
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-800">
                          {m.scheduledCount} Hari
                        </td>
                        <td className="p-3 text-center font-bold text-rose-600">
                          {m.holidayCount} Hari
                        </td>
                        <td className="p-3 text-center font-black text-emerald-700">
                          {effectiveVal} Pertemuan
                        </td>
                        <td className="p-3 text-slate-600">{m.affectedSummary}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: PROGRAM ALOKASI WAKTU (TP) */}
      {activeStep === 4 && (
        <ProgramAlokasiWaktuPanel
          rpeEffectiveJpS1={s1Totals.grossJp}
          rpeEffectiveJpS2={s2Totals.grossJp}
          rpeNetJpS1={s1Totals.netJp}
          rpeNetJpS2={s2Totals.netJp}
          jpPerWeekS1={rpeData.semester1.jpPerWeek}
          jpPerWeekS2={rpeData.semester2.jpPerWeek}
          meetingsPerWeek={Math.max(1, selectedDays.length)}
          onBackToRpeStep={() => setActiveStep(3)}
        />
      )}
    </div>
  );
};

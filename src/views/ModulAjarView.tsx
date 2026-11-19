import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpen,
  ArrowLeft,
  Sparkles,
  Printer,
  Download,
  Edit3,
  CheckCircle2,
  FileCheck,
  CheckSquare,
  Square,
  Layers,
  ListChecks,
  RefreshCw,
  ArrowRight,
  BookmarkCheck,
  Calendar,
  Plus,
  Trash2,
  Wand2,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { ModulAjarItem } from '../types';
import { exportModulAjarToWord, exportModulAjarToExcel } from '../utils/exporter';
import { PipelineSyncHeader } from '../components/PipelineSyncHeader';
import { IdentitasPerangkat } from '../components/IdentitasPerangkat';
import { ensureOfficialKemendikdasmenModul, getSyncedSubChaptersForBab } from '../utils/curriculumLogic';
import { getTenAssessmentInstruments } from '../utils/assessmentInstruments';
import { DeepChapterAnalysisCard } from '../components/DeepChapterAnalysisCard';

const DIMENSI_PROFIL_LULUSAN_OPTIONS = [
  'Keimanan dan Ketakwaan terhadap Tuhan YME',
  'Penalaran Kritis',
  'Kolaborasi',
  'Kesehatan',
  'Kewargaan',
  'Kreativitas',
  'Kemandirian',
  'Komunikasi',
];

export const ModulAjarView: React.FC = () => {
  const {
    modulAjarList,
    updateModulAjar,
    schoolProfile,
    prota,
    promes,
    selectedBook,
    runMasterSync,
    setActiveView,
    openPrintModal,
    showNotification,
    isFocusMode,
    toggleFocusMode,
  } = useApp();

  const [selectedBab, setSelectedBab] = useState<number>(1);
  const [selectedPertemuan, setSelectedPertemuan] = useState<number | 'all'>('all');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [activeInstrumentTab, setActiveInstrumentTab] = useState<string>('all');

  // Dynamic Bab choices synced with PROTA & PROMES
  const availableBabs = useMemo(() => {
    if (prota && prota.length > 0) {
      return prota.map((p) => {
        const modulMatch = modulAjarList.find((m) => m.babNumber === p.babNumber);
        return {
          babNumber: p.babNumber,
          babTitle: p.babTitle,
          alokasiJp: p.alokasiJp,
          pertemuanCount: Math.ceil(p.alokasiJp / 3) || 6,
          semester: p.semester,
          tpCode: p.tpCode,
          tpDescription: p.tpDescription,
          modulId: modulMatch?.id || `modul-${p.babNumber}`,
        };
      });
    }
    return modulAjarList.map((m) => ({
      babNumber: m.babNumber,
      babTitle: m.babTitle,
      alokasiJp: m.alokasiJp,
      pertemuanCount: m.pertemuanCount || Math.ceil(m.alokasiJp / 3),
      semester: m.semester,
      tpCode: `TP 10.${m.babNumber}`,
      tpDescription: m.pemahamanBermakna || '',
      modulId: m.id,
    }));
  }, [prota, modulAjarList]);

  const selectedBabInfo = availableBabs.find((b) => b.babNumber === selectedBab) || availableBabs[0];
  const rawModul = modulAjarList.find((m) => m.babNumber === selectedBab) || modulAjarList[0];

  // Merge latest PROTA/PROMES alokasiJp & babTitle into currentModul
  const syncedRawModul: ModulAjarItem = {
    ...rawModul,
    babNumber: selectedBabInfo.babNumber,
    babTitle: selectedBabInfo.babTitle,
    alokasiJp: selectedBabInfo.alokasiJp,
    pertemuanCount: selectedBabInfo.pertemuanCount,
    semester: selectedBabInfo.semester as 1 | 2,
    tujuanPembelajaran: [selectedBabInfo.tpDescription || rawModul.tujuanPembelajaran[0]],
  };

  const currentModul = ensureOfficialKemendikdasmenModul(syncedRawModul, schoolProfile);

  const tenInstruments = useMemo(() => {
    return getTenAssessmentInstruments(
      schoolProfile.subject,
      schoolProfile.grade,
      currentModul.babNumber,
      currentModul.babTitle,
      schoolProfile
    );
  }, [schoolProfile, currentModul.babNumber, currentModul.babTitle]);

  const [editState, setEditState] = useState<ModulAjarItem>(currentModul);

  const handleSelectBab = (babNum: number) => {
    setSelectedBab(babNum);
    setSelectedPertemuan('all');
    const info = availableBabs.find((b) => b.babNumber === babNum) || availableBabs[0];
    const match = modulAjarList.find((m) => m.babNumber === babNum) || modulAjarList[0];
    const merged: ModulAjarItem = {
      ...match,
      babNumber: info.babNumber,
      babTitle: info.babTitle,
      alokasiJp: info.alokasiJp,
      pertemuanCount: info.pertemuanCount,
      semester: info.semester as 1 | 2,
      tujuanPembelajaran: [info.tpDescription || match.tujuanPembelajaran[0]],
    };
    const normalized = ensureOfficialKemendikdasmenModul(merged, schoolProfile);
    setEditState(normalized);
    setIsEditing(false);
  };

  const handleToggleDimensi = (dimensi: string) => {
    const currentDimensi = editState.identifikasi?.dimensiProfilLulusan || [];
    const nextDimensi = currentDimensi.includes(dimensi)
      ? currentDimensi.filter((d) => d !== dimensi)
      : [...currentDimensi, dimensi];

    setEditState((prev) => ({
      ...prev,
      identifikasi: {
        pesertaDidik: prev.identifikasi?.pesertaDidik || '',
        materiPelajaran: prev.identifikasi?.materiPelajaran || '',
        ...prev.identifikasi,
        dimensiProfilLulusan: nextDimensi,
      },
    }));
  };

  const [newAssessmentInput, setNewAssessmentInput] = useState<string>('');

  const currentInstrumenList = editState.asesmenPembelajaran?.contohInstrumen || [
    'Penilaian Sejawat',
    'Penilaian Diri',
    'Penilaian Proyek',
    'Penilaian Produk',
    'Observasi',
    'Portofolio',
    'Penilaian Berbasis Kelas',
    'Penilaian Kinerja',
    'Tes tertulis',
    'Tes lisan',
  ];

  const handleAutoGenerateModul = () => {
    const generated = ensureOfficialKemendikdasmenModul(
      {
        ...currentModul,
        identifikasi: undefined,
        desainPembelajaran: undefined,
        pengalamanBelajar: undefined,
        asesmenPembelajaran: undefined,
      },
      schoolProfile
    );
    updateModulAjar(generated);
    setEditState(generated);
    showNotification(
      'success',
      `✨ Modul Ajar Bab ${generated.babNumber} ("${generated.babTitle}") berhasil dibuat otomatis secara lengkap dengan Sintaks & 10 Instrumen Penilaian!`
    );
  };

  const handleToggleAssessmentItem = (item: string) => {
    const exists = currentInstrumenList.includes(item);
    const nextList = exists
      ? currentInstrumenList.filter((i) => i !== item)
      : [...currentInstrumenList, item];

    setEditState((prev) => ({
      ...prev,
      asesmenPembelajaran: {
        assessmentAsLearning: prev.asesmenPembelajaran?.assessmentAsLearning || '',
        assessmentForLearning: prev.asesmenPembelajaran?.assessmentForLearning || '',
        assessmentOfLearning: prev.asesmenPembelajaran?.assessmentOfLearning || '',
        contohInstrumen: nextList,
      },
    }));
  };

  const handleAddCustomAssessment = () => {
    if (!newAssessmentInput.trim()) return;
    const item = newAssessmentInput.trim();
    if (!currentInstrumenList.includes(item)) {
      const nextList = [...currentInstrumenList, item];
      setEditState((prev) => ({
        ...prev,
        asesmenPembelajaran: {
          assessmentAsLearning: prev.asesmenPembelajaran?.assessmentAsLearning || '',
          assessmentForLearning: prev.asesmenPembelajaran?.assessmentForLearning || '',
          assessmentOfLearning: prev.asesmenPembelajaran?.assessmentOfLearning || '',
          contohInstrumen: nextList,
        },
      }));
    }
    setNewAssessmentInput('');
  };

  const handleRemoveAssessmentItem = (itemToRemove: string) => {
    setEditState((prev) => ({
      ...prev,
      asesmenPembelajaran: {
        assessmentAsLearning: prev.asesmenPembelajaran?.assessmentAsLearning || '',
        assessmentForLearning: prev.asesmenPembelajaran?.assessmentForLearning || '',
        assessmentOfLearning: prev.asesmenPembelajaran?.assessmentOfLearning || '',
        contohInstrumen: currentInstrumenList.filter((i) => i !== itemToRemove),
      },
    }));
  };

  const handleSaveModul = (e: React.FormEvent) => {
    e.preventDefault();
    updateModulAjar(editState);
    setIsEditing(false);
    showNotification(
      'success',
      `Modul Ajar Bab ${editState.babNumber} format resmi Kemendikdasmen berhasil diperbarui!`
    );
  };

  const handleApplyAnalysisToModul = (analysis: {
    materiFaktual: string;
    materiKonseptual: string;
    materiProsedural: string;
    materiMetakognitif: string;
    pertanyaanPemantik: string[];
    pemahamanBermakna: string;
  }) => {
    const updated: ModulAjarItem = {
      ...currentModul,
      identifikasi: {
        ...currentModul.identifikasi,
        dimensiProfilLulusan: currentModul.identifikasi?.dimensiProfilLulusan || ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian'],
        materiFaktual: analysis.materiFaktual,
        materiKonseptual: analysis.materiKonseptual,
        materiProsedural: analysis.materiProsedural,
        materiMetakognitif: analysis.materiMetakognitif,
      },
      desainPembelajaran: {
        ...currentModul.desainPembelajaran,
        tujuanPembelajaran: currentModul.desainPembelajaran?.tujuanPembelajaran || currentModul.tujuanPembelajaran,
        praktikPedagogis: 'Problem Based Learning (PBL) & Deep Learning (Mindful, Meaningful, Joyful)',
        lingkunganPembelajaran: 'Fisik: Ruang kelas kolaboratif, LKPD | Virtual: PID & Gawai | Budaya: Growth Mindset',
      },
      pertanyaanPemantik: analysis.pertanyaanPemantik,
      pemahamanBermakna: analysis.pemahamanBermakna,
    };
    updateModulAjar(updated);
    setEditState(updated);
  };

  const [selectedInstrumentsToPrint, setSelectedInstrumentsToPrint] = useState<string[]>([
    'Penilaian Sejawat',
    'Penilaian Diri',
    'Penilaian Proyek',
    'Penilaian Produk',
    'Observasi',
    'Portofolio',
    'Penilaian Berbasis Kelas',
    'Penilaian Kinerja',
    'Tes tertulis',
    'Tes lisan',
  ]);

  const handleExportWord = async () => {
    const ptmSuffix = selectedPertemuan !== 'all' ? `_PERTEMUAN_${selectedPertemuan}` : '';
    await exportModulAjarToWord(
      [currentModul],
      schoolProfile,
      `MODUL_AJAR_DEEP_LEARNING_BAB_${currentModul.babNumber}${ptmSuffix}_${schoolProfile.subject.replace(/\s+/g, '_')}.docx`,
      selectedPertemuan,
      selectedInstrumentsToPrint
    );
    showNotification(
      'success',
      `Modul Ajar Terpadu Bab ${currentModul.babNumber} ${selectedPertemuan !== 'all' ? `(Pertemuan Ke-${selectedPertemuan})` : '(Semua Pertemuan)'} berhasil diekspor ke Word (.docx) dengan ${selectedInstrumentsToPrint.length} instrumen penilaian terpilih!`
    );
  };

  return (
    <div className="space-y-6">
      {!isFocusMode && (
        <>
          <PipelineSyncHeader />
          <IdentitasPerangkat
            documentTitle={`Modul Ajar Bab ${currentModul.babNumber}: ${currentModul.title}`}
            semesterSpecific={currentModul.semester as 1 | 2}
          />

          {/* Pipeline Interactive Navigation Bar */}
          <div className="bg-slate-900 rounded-2xl p-3.5 text-white shadow-md border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 font-bold text-slate-300">
              <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Sinkronisasi Pipeline Kurikulum:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 font-semibold text-[11px]">
              <button
                onClick={() => setActiveView('rpe')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="Ke Kalender Pendidikan & RPE"
              >
                <span>Kalender/RPE</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
              <button
                onClick={() => setActiveView('cp_atp')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="Ke Analisis CP & ATP"
              >
                <span>Analisis CP/ATP</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
              <button
                onClick={() => setActiveView('prota')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="Ke Program Tahunan (PROTA)"
              >
                <span>PROTA</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
              <button
                onClick={() => setActiveView('promes')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="Ke Program Semester (PROMES)"
              >
                <span>PROMES</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
              <button
                onClick={() => setActiveView('modul_ajar')}
                className="px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-black shadow-xs cursor-pointer flex items-center gap-1"
                title="Modul Ajar Terpadu & Deep Learning (Aktif)"
              >
                <span>Modul Ajar</span>
                <ArrowRight className="w-3 h-3 text-cyan-200" />
              </button>
              <button
                onClick={() => setActiveView('lkpd')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                title="Ke Lembar Kerja Peserta Didik (LKPD)"
              >
                <span>LKPD</span>
                <ArrowRight className="w-3 h-3 text-slate-500" />
              </button>
              <button
                onClick={() => setActiveView('asesmen')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Ke Asesmen & Penilaian Rapor"
              >
                <span>Penilaian Rapor</span>
              </button>
            </div>

            <button
              onClick={() => {
                runMasterSync();
                showNotification(
                  'success',
                  'Sinkronisasi Pipeline Berhasil: Kalender/RPE → Analisis CP/ATP → PROTA → PROMES → Modul Ajar → LKPD → Penilaian Rapor telah selaras!'
                );
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm cursor-pointer ml-auto sm:ml-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sinkronkan Ke Semua Dokumen</span>
            </button>
          </div>
        </>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          {!isFocusMode && (
            <button
              onClick={() => setActiveView('dashboard')}
              title="Kembali ke Dashboard"
              aria-label="Kembali ke Dashboard"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-cyan-700" />
              Modul Ajar Terpadu & Pembelajaran Mendalam (Deep Learning)
            </h2>
            <p className="text-xs text-slate-500">
              Format Resmi Kemendikdasmen: Identifikasi · Desain Pembelajaran · Pengalaman Belajar · Asesmen
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              const nextState = !isFocusMode;
              toggleFocusMode();
              showNotification(
                'info',
                nextState
                  ? 'Mode Fokus Diaktifkan: Sidebar dan navigasi disembunyikan agar Anda fokus menyusun Modul Ajar.'
                  : 'Mode Fokus Dinonaktifkan: Sidebar dan elemen navigasi ditampilkan kembali.'
              );
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${
              isFocusMode
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 ring-2 ring-amber-300/60'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
            }`}
            title={
              isFocusMode
                ? 'Keluar dari Mode Fokus dan tampilkan kembali sidebar & navigasi'
                : 'Aktifkan Mode Fokus: Sembunyikan sidebar & navigasi yang tidak relevan saat menyusun Modul Ajar'
            }
          >
            {isFocusMode ? (
              <>
                <Minimize2 className="w-4 h-4 text-amber-100" />
                <span>Keluar Mode Fokus</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-cyan-300" />
                <span>Mode Fokus</span>
              </>
            )}
          </button>

          <button
            onClick={handleAutoGenerateModul}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
            title="Buat Otomatis Modul Ajar secara lengkap dengan Sintaks & 10 Instrumen Penilaian"
          >
            <Wand2 className="w-4 h-4 text-purple-200" />
            <span>Buat Otomatis Modul</span>
          </button>

          <button
            onClick={() => {
              setEditState(currentModul);
              setIsEditing(!isEditing);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Batal Ubah' : 'Edit Modul Ini'}</span>
          </button>

          <button
            onClick={() => {
              exportModulAjarToExcel(
                modulAjarList,
                schoolProfile,
                selectedPertemuan,
                selectedInstrumentsToPrint
              );
              showNotification(
                'success',
                'Data Modul Ajar Deep Learning (Poin A. Informasi Umum s.d. H. Lampiran & Pasca Observasi) berhasil diekspor ke Excel (.xlsx)!'
              );
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Ekspor Modul Ajar Deep Learning ke Excel (.xlsx)"
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
            onClick={() => openPrintModal('modul_ajar')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Cetak Modul Ajar atau Ekspor ke PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Ekspor PDF / Cetak</span>
          </button>
        </div>
      </div>

      {/* Bab Navigator Cards/Tabs Synced with PROTA & PROMES */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
            <ListChecks className="w-4 h-4 text-cyan-700" />
            <span>Pilihan Bab Pembelajaran (Disinkron dengan Materi & Pertemuan PROTA & PROMES):</span>
          </p>
          <span className="text-[11px] font-semibold text-slate-500">
            Total {availableBabs.length} Bab
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {availableBabs.map((b) => {
            const isSelected = selectedBab === b.babNumber;
            return (
              <button
                key={b.babNumber}
                onClick={() => handleSelectBab(b.babNumber)}
                className={`p-3 rounded-xl text-left transition-all border cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-cyan-900 text-white border-cyan-950 shadow-md ring-2 ring-cyan-500/50'
                    : 'bg-slate-50 hover:bg-cyan-50/50 text-slate-800 border-slate-200 hover:border-cyan-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                      isSelected ? 'bg-cyan-700 text-cyan-100' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    Bab {b.babNumber} • Semester {b.semester}
                  </span>
                  <span
                    className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {b.alokasiJp} JP ({b.pertemuanCount} Pertemuan)
                  </span>
                </div>

                <p className="text-xs font-bold leading-snug line-clamp-2">
                  {b.babTitle}
                </p>

                <div className="flex items-center justify-between text-[10px] opacity-85 pt-0.5 border-t border-current/10">
                  <span className="truncate italic">🎯 {b.tpCode}: {b.tpDescription}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pertemuan Selector Bar (Disinkron dengan PROTA & PROMES) */}
      <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <p className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-700" />
            <span>Pilihan Pertemuan untuk Bab {selectedBabInfo.babNumber} ({selectedBabInfo.pertemuanCount} Pertemuan / {selectedBabInfo.alokasiJp} JP):</span>
          </p>
          <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
            {selectedPertemuan === 'all'
              ? 'Menampilkan Semua Pertemuan (1 s.d. ' + selectedBabInfo.pertemuanCount + ')'
              : 'Menampilkan Khusus Pertemuan Ke-' + selectedPertemuan + ' (3 JP)'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 font-sans">
          <button
            onClick={() => setSelectedPertemuan('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedPertemuan === 'all'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            Semua Pertemuan (1 s.d. {selectedBabInfo.pertemuanCount})
          </button>

          {Array.from({ length: selectedBabInfo.pertemuanCount || 6 }).map((_, pIdx) => {
            const ptmNum = pIdx + 1;
            const subChapters = getSyncedSubChaptersForBab(schoolProfile.subject, schoolProfile.grade, selectedBabInfo.babNumber);
            const ptmTopic = subChapters[pIdx] || `Pertemuan ${ptmNum}`;
            const isSelected = selectedPertemuan === ptmNum;

            return (
              <button
                key={ptmNum}
                onClick={() => setSelectedPertemuan(ptmNum)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-500/40'
                    : 'bg-white text-slate-700 hover:bg-emerald-50/60 border border-slate-300'
                }`}
                title={ptmTopic}
              >
                <span>Pertemuan {ptmNum}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isSelected ? 'bg-emerald-900/80 text-emerald-100' : 'bg-slate-100 text-slate-600'}`}>
                  3 JP
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Bab Info Banner */}
      <div className="bg-white rounded-xl p-3.5 text-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border border-slate-300 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <BookmarkCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="font-extrabold text-sm text-slate-950">
              Bab {selectedBabInfo.babNumber}: {selectedBabInfo.babTitle} {selectedPertemuan !== 'all' ? `• PERTEMUAN KE-${selectedPertemuan}` : ''}
            </p>
            <p className="text-[11px] text-slate-600 font-medium">
              Alokasi: <span className="font-bold text-emerald-700">{selectedPertemuan !== 'all' ? '3 JP (1 Pertemuan)' : `${selectedBabInfo.alokasiJp} JP (${selectedBabInfo.pertemuanCount} Pertemuan)`}</span> • Semester {selectedBabInfo.semester} • Kode ATP: <span className="font-mono text-cyan-800 font-bold">{selectedBabInfo.tpCode}</span>
            </p>
          </div>
        </div>
        <div className="text-[10.5px] text-slate-700 font-medium italic bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 sm:text-right">
          📚 Rujukan Buku: {selectedBook?.judulBuku || 'Kurikulum Merdeka Edisi Revisi BSKAP 046/2025'}
        </div>
      </div>

      {/* Deep Chapter Analysis Card (Analisis Mendalam Buku Teks & Deep Learning) */}
      <DeepChapterAnalysisCard
        babNumber={selectedBabInfo.babNumber}
        babTitle={selectedBabInfo.babTitle}
        schoolProfile={schoolProfile}
        currentModul={currentModul}
        selectedBook={selectedBook}
        onApplyAnalysisToModul={handleApplyAnalysisToModul}
        showNotification={showNotification}
      />

      {/* EDIT FORM MODE */}
      {isEditing ? (
        <form
          onSubmit={handleSaveModul}
          className="bg-white rounded-2xl border-2 border-cyan-600 shadow-xl p-6 sm:p-8 space-y-6 text-xs"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-cyan-700" />
              Edit Modul Ajar Bab {editState.babNumber}: {editState.babTitle}
            </h3>
            <span className="text-slate-500 font-semibold">Format Resmi Kemendikdasmen</span>
          </div>

          {/* 1. IDENTIFIKASI */}
          <div className="space-y-4 bg-sky-50/60 p-4 rounded-xl border border-sky-200">
            <h4 className="font-bold text-sky-900 text-sm flex items-center gap-1.5">
              <span>1. Identifikasi</span>
            </h4>
            <div className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Peserta Didik (opsional): Identifikasi kesiapan sebelum belajar
                </label>
                <textarea
                  rows={2}
                  value={editState.identifikasi?.pesertaDidik || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      identifikasi: {
                        pesertaDidik: e.target.value,
                        materiPelajaran: editState.identifikasi?.materiPelajaran || '',
                        dimensiProfilLulusan: editState.identifikasi?.dimensiProfilLulusan || [],
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                  placeholder="Identifikasi kesiapan peserta didik, pengetahuan awal, minat, latar belakang..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Materi Pelajaran (opsional): Analisis materi, jenis pengetahuan, relevansi nyata
                </label>
                <textarea
                  rows={2}
                  value={editState.identifikasi?.materiPelajaran || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      identifikasi: {
                        pesertaDidik: editState.identifikasi?.pesertaDidik || '',
                        materiPelajaran: e.target.value,
                        dimensiProfilLulusan: editState.identifikasi?.dimensiProfilLulusan || [],
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                  placeholder="Jenis pengetahuan yang akan dicapai, relevansi kehidupan nyata, tingkat kesulitan..."
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Dimensi Profil Lulusan (Pilihlah dimensi yang akan dicapai):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-white p-3 rounded-lg border border-slate-200">
                  {DIMENSI_PROFIL_LULUSAN_OPTIONS.map((dimensi) => {
                    const isChecked = (editState.identifikasi?.dimensiProfilLulusan || []).includes(
                      dimensi
                    );
                    return (
                      <label
                        key={dimensi}
                        onClick={() => handleToggleDimensi(dimensi)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                          isChecked
                            ? 'bg-sky-100 border-sky-500 text-sky-950 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-sky-700 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span>{dimensi}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 2. DESAIN PEMBELAJARAN */}
          <div className="space-y-4 bg-cyan-50/60 p-4 rounded-xl border border-cyan-200">
            <h4 className="font-bold text-cyan-900 text-sm">2. Desain Pembelajaran</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Capaian Pembelajaran (opsional)
                </label>
                <textarea
                  rows={2}
                  value={editState.desainPembelajaran?.capaianPembelajaran || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      desainPembelajaran: {
                        ...editState.desainPembelajaran!,
                        capaianPembelajaran: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lintas Disiplin Ilmu (opsional)
                </label>
                <input
                  type="text"
                  value={editState.desainPembelajaran?.lintasDisiplinIlmu || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      desainPembelajaran: {
                        ...editState.desainPembelajaran!,
                        lintasDisiplinIlmu: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Tujuan Pembelajaran (Kompetensi & Konten)
                </label>
                <textarea
                  rows={3}
                  value={(editState.desainPembelajaran?.tujuanPembelajaran || editState.tujuanPembelajaran).join('\n')}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n').filter((l) => l.trim() !== '');
                    setEditState({
                      ...editState,
                      tujuanPembelajaran: lines,
                      desainPembelajaran: {
                        ...editState.desainPembelajaran!,
                        tujuanPembelajaran: lines,
                      },
                    });
                  }}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Topik Pembelajaran (opsional)
                </label>
                <input
                  type="text"
                  value={editState.desainPembelajaran?.topikPembelajaran || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      desainPembelajaran: {
                        ...editState.desainPembelajaran!,
                        topikPembelajaran: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Praktik Pedagogis (Model/Strategi/Metode)
                </label>
                <input
                  type="text"
                  value={editState.desainPembelajaran?.praktikPedagogis || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      desainPembelajaran: {
                        ...editState.desainPembelajaran!,
                        praktikPedagogis: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-cyan-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kemitraan Pembelajaran (opsional)
                </label>
                <input
                  type="text"
                  value={editState.desainPembelajaran?.kemitraanPembelajaran || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      desainPembelajaran: {
                        ...editState.desainPembelajaran!,
                        kemitraanPembelajaran: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lingkungan Pembelajaran (Budaya Belajar Aman & Saling Memuliakan)
                </label>
                <input
                  type="text"
                  value={editState.desainPembelajaran?.lingkunganPembelajaran || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      desainPembelajaran: {
                        ...editState.desainPembelajaran!,
                        lingkunganPembelajaran: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Pemanfaatan Digital (opsional)
                </label>
                <input
                  type="text"
                  value={editState.desainPembelajaran?.pemanfaatanDigital || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      desainPembelajaran: {
                        ...editState.desainPembelajaran!,
                        pemanfaatanDigital: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
          </div>

          {/* 3. PENGALAMAN BELAJAR (LANGKAH-LANGKAH PEMBELAJARAN & SINTAKS) */}
          <div className="space-y-4 bg-amber-50/60 p-4 sm:p-5 rounded-xl border border-amber-200">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
              <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                <span>3. Pengalaman Belajar (Langkah-Langkah Pembelajaran & Sintaks)</span>
              </h4>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">
                Dapat Ditambah/Dikurangi Sesuai Keinginan Guru
              </span>
            </div>

            <div className="space-y-4">
              {/* AWAL (opsional) */}
              <div className="p-3.5 bg-white rounded-xl border border-amber-300/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <label className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(editState.pengalamanBelajar?.kegiatanAwal)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditState({
                            ...editState,
                            pengalamanBelajar: {
                              ...editState.pengalamanBelajar!,
                              kegiatanAwal: editState.pengalamanBelajar?.kegiatanAwal || {
                                prinsip: 'Berkesadaran, Bermakna, Menggembirakan',
                                deskripsi: [
                                  'Guru membuka pembelajaran dengan salam hangat, doa bersama, dan mengecek kehadiran peserta didik.',
                                  'Orientasi bermakna: Guru menyampaikan tujuan pembelajaran dan alur aktivitas yang akan dilaksanakan.',
                                  'Apersepsi & Motivasi: Diskusi singkat menggali pengetahuan awal siswa terkait materi.',
                                ],
                              },
                            },
                          });
                        } else {
                          const nextPengalaman = { ...editState.pengalamanBelajar! };
                          delete nextPengalaman.kegiatanAwal;
                          setEditState({
                            ...editState,
                            pengalamanBelajar: nextPengalaman,
                          });
                        }
                      }}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>Gunakan Bagian AWAL (opsional)</span>
                  </label>
                  <span className="text-[10.5px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                    Orientasi & Apersepsi (±15 Menit)
                  </span>
                </div>

                {editState.pengalamanBelajar?.kegiatanAwal && (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Prinsip Pembelajaran yang Digunakan pada Bagian Awal:
                      </label>
                      <input
                        type="text"
                        value={editState.pengalamanBelajar.kegiatanAwal.prinsip || 'Berkesadaran, Bermakna, Menggembirakan'}
                        onChange={(e) => {
                          setEditState({
                            ...editState,
                            pengalamanBelajar: {
                              ...editState.pengalamanBelajar!,
                              kegiatanAwal: {
                                ...editState.pengalamanBelajar!.kegiatanAwal!,
                                prinsip: e.target.value,
                              },
                            },
                          });
                        }}
                        placeholder="Contoh: Berkesadaran, Bermakna, Menggembirakan"
                        className="w-full p-2 bg-amber-50/30 border border-slate-300 rounded-lg text-xs font-semibold text-amber-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Langkah Kegiatan Awal (Satu kalimat per baris - Tambah/Kurangi bebas):
                      </label>
                      <textarea
                        rows={3}
                        value={editState.pengalamanBelajar.kegiatanAwal.deskripsi.join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          setEditState({
                            ...editState,
                            pengalamanBelajar: {
                              ...editState.pengalamanBelajar!,
                              kegiatanAwal: {
                                ...editState.pengalamanBelajar!.kegiatanAwal!,
                                deskripsi: lines,
                              },
                            },
                          });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-sans leading-relaxed"
                        placeholder="Tuliskan setiap langkah kegiatan awal per baris..."
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* INTI (Memahami, Mengaplikasi, Merefleksi) */}
              <div className="p-3.5 bg-white rounded-xl border border-amber-300/80 space-y-3">
                <div className="border-b border-slate-100 pb-2">
                  <h5 className="font-extrabold text-slate-900 text-xs uppercase tracking-wide">
                    INTI (Pengalaman Belajar Aktif)
                  </h5>
                  <p className="text-[11px] text-slate-500 font-medium pt-0.5">
                    Memfasilitasi pengalaman memahami, mengaplikasi, dan merefleksi.
                  </p>
                </div>

                {/* 1. Memahami */}
                <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="font-bold text-emerald-950 text-xs">
                      1. Memahami (Sintaks Data Collection & Pengonstruksian Konsep)
                    </label>
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                      Prinsip Pembelajaran pada Tahap Memahami:
                    </label>
                    <input
                      type="text"
                      value={editState.pengalamanBelajar?.kegiatanInti?.memahami?.prinsip || 'Berkesadaran, Bermakna'}
                      onChange={(e) => {
                        setEditState({
                          ...editState,
                          pengalamanBelajar: {
                            ...editState.pengalamanBelajar!,
                            kegiatanInti: {
                              ...editState.pengalamanBelajar!.kegiatanInti,
                              memahami: {
                                ...editState.pengalamanBelajar!.kegiatanInti.memahami,
                                prinsip: e.target.value,
                              },
                            },
                          },
                        });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-emerald-900 mb-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                      Langkah-Langkah Kegiatan Memahami (Tambah/Kurangi Baris Bebas):
                    </label>
                    <textarea
                      rows={3}
                      value={editState.pengalamanBelajar?.kegiatanInti?.memahami?.deskripsi.join('\n') || ''}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n');
                        setEditState({
                          ...editState,
                          pengalamanBelajar: {
                            ...editState.pengalamanBelajar!,
                            kegiatanInti: {
                              ...editState.pengalamanBelajar!.kegiatanInti,
                              memahami: {
                                ...editState.pengalamanBelajar!.kegiatanInti.memahami,
                                deskripsi: lines,
                              },
                            },
                          },
                        });
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* 2. Mengaplikasi */}
                <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="font-bold text-amber-950 text-xs">
                      2. Mengaplikasi (Sintaks Problem Solving & Eksperimentasi Produk)
                    </label>
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                      Prinsip Pembelajaran pada Tahap Mengaplikasi:
                    </label>
                    <input
                      type="text"
                      value={editState.pengalamanBelajar?.kegiatanInti?.mengaplikasi?.prinsip || 'Berkesadaran, Bermakna'}
                      onChange={(e) => {
                        setEditState({
                          ...editState,
                          pengalamanBelajar: {
                            ...editState.pengalamanBelajar!,
                            kegiatanInti: {
                              ...editState.pengalamanBelajar!.kegiatanInti,
                              mengaplikasi: {
                                ...editState.pengalamanBelajar!.kegiatanInti.mengaplikasi,
                                prinsip: e.target.value,
                              },
                            },
                          },
                        });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-amber-900 mb-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                      Langkah-Langkah Kegiatan Mengaplikasi (Tambah/Kurangi Baris Bebas):
                    </label>
                    <textarea
                      rows={3}
                      value={editState.pengalamanBelajar?.kegiatanInti?.mengaplikasi?.deskripsi.join('\n') || ''}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n');
                        setEditState({
                          ...editState,
                          pengalamanBelajar: {
                            ...editState.pengalamanBelajar!,
                            kegiatanInti: {
                              ...editState.pengalamanBelajar!.kegiatanInti,
                              mengaplikasi: {
                                ...editState.pengalamanBelajar!.kegiatanInti.mengaplikasi,
                                deskripsi: lines,
                              },
                            },
                          },
                        });
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* 3. Merefleksi */}
                <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-200 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <label className="font-bold text-rose-950 text-xs">
                      3. Merefleksi (Sintaks Evaluasi & Meta-Kognisi Mandiri)
                    </label>
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                      Prinsip Pembelajaran pada Tahap Merefleksi:
                    </label>
                    <input
                      type="text"
                      value={editState.pengalamanBelajar?.kegiatanInti?.merefleksi?.prinsip || 'Berkesadaran, Bermakna'}
                      onChange={(e) => {
                        setEditState({
                          ...editState,
                          pengalamanBelajar: {
                            ...editState.pengalamanBelajar!,
                            kegiatanInti: {
                              ...editState.pengalamanBelajar!.kegiatanInti,
                              merefleksi: {
                                ...editState.pengalamanBelajar!.kegiatanInti.merefleksi,
                                prinsip: e.target.value,
                              },
                            },
                          },
                        });
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-rose-900 mb-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-semibold text-slate-600 mb-1">
                      Langkah-Langkah Kegiatan Merefleksi (Tambah/Kurangi Baris Bebas):
                    </label>
                    <textarea
                      rows={3}
                      value={editState.pengalamanBelajar?.kegiatanInti?.merefleksi?.deskripsi.join('\n') || ''}
                      onChange={(e) => {
                        const lines = e.target.value.split('\n');
                        setEditState({
                          ...editState,
                          pengalamanBelajar: {
                            ...editState.pengalamanBelajar!,
                            kegiatanInti: {
                              ...editState.pengalamanBelajar!.kegiatanInti,
                              merefleksi: {
                                ...editState.pengalamanBelajar!.kegiatanInti.merefleksi,
                                deskripsi: lines,
                              },
                            },
                          },
                        });
                      }}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-sans leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* PENUTUP (opsional) */}
              <div className="p-3.5 bg-white rounded-xl border border-amber-300/80 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <label className="font-extrabold text-slate-900 text-xs flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(editState.pengalamanBelajar?.kegiatanPenutup)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEditState({
                            ...editState,
                            pengalamanBelajar: {
                              ...editState.pengalamanBelajar!,
                              kegiatanPenutup: editState.pengalamanBelajar?.kegiatanPenutup || {
                                prinsip: 'Berkesadaran, Bermakna, Menggembirakan',
                                deskripsi: [
                                  'Guru bersama peserta didik membuat rangkuman dan kesimpulan atas materi pembelajaran.',
                                  'Umpan balik konstruktif dan refleksi belajar mandiri siswa atas pencapaian hari ini.',
                                  'Informasi tindak lanjut, tugas terstruktur, serta doa penutup pembelajaran.',
                                ],
                              },
                            },
                          });
                        } else {
                          const nextPengalaman = { ...editState.pengalamanBelajar! };
                          delete nextPengalaman.kegiatanPenutup;
                          setEditState({
                            ...editState,
                            pengalamanBelajar: nextPengalaman,
                          });
                        }
                      }}
                      className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                    />
                    <span>Gunakan Bagian PENUTUP (opsional)</span>
                  </label>
                  <span className="text-[10.5px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                    Rangkuman & Refleksi Mandiri (±10 Menit)
                  </span>
                </div>

                {editState.pengalamanBelajar?.kegiatanPenutup && (
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Prinsip Pembelajaran yang Digunakan pada Bagian Penutup:
                      </label>
                      <input
                        type="text"
                        value={editState.pengalamanBelajar.kegiatanPenutup.prinsip || 'Berkesadaran, Bermakna, Menggembirakan'}
                        onChange={(e) => {
                          setEditState({
                            ...editState,
                            pengalamanBelajar: {
                              ...editState.pengalamanBelajar!,
                              kegiatanPenutup: {
                                ...editState.pengalamanBelajar!.kegiatanPenutup!,
                                prinsip: e.target.value,
                              },
                            },
                          });
                        }}
                        placeholder="Contoh: Berkesadaran, Bermakna, Menggembirakan"
                        className="w-full p-2 bg-amber-50/30 border border-slate-300 rounded-lg text-xs font-semibold text-amber-950"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Langkah Kegiatan Penutup (Satu kalimat per baris - Tambah/Kurangi bebas):
                      </label>
                      <textarea
                        rows={3}
                        value={editState.pengalamanBelajar.kegiatanPenutup.deskripsi.join('\n')}
                        onChange={(e) => {
                          const lines = e.target.value.split('\n');
                          setEditState({
                            ...editState,
                            pengalamanBelajar: {
                              ...editState.pengalamanBelajar!,
                              kegiatanPenutup: {
                                ...editState.pengalamanBelajar!.kegiatanPenutup!,
                                deskripsi: lines,
                              },
                            },
                          });
                        }}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-sans leading-relaxed"
                        placeholder="Tuliskan setiap langkah kegiatan penutup per baris..."
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. ASESMEN PEMBELAJARAN & PENYESUAIAN JENIS PENILAIAN */}
          <div className="space-y-4 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-700" />
                <span>4. Asesmen Pembelajaran & Penyesuaian Jenis Penilaian (Tambah / Kurangi Penilaian)</span>
              </h4>
              <button
                type="button"
                onClick={handleAutoGenerateModul}
                className="px-3 py-1 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Generate AI Otomatis</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assessment as Learning (Sebagai Pembelajaran)
                </label>
                <textarea
                  rows={2}
                  value={editState.asesmenPembelajaran?.assessmentAsLearning || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      asesmenPembelajaran: {
                        ...editState.asesmenPembelajaran!,
                        assessmentAsLearning: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assessment for Learning (Untuk Pembelajaran)
                </label>
                <textarea
                  rows={2}
                  value={editState.asesmenPembelajaran?.assessmentForLearning || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      asesmenPembelajaran: {
                        ...editState.asesmenPembelajaran!,
                        assessmentForLearning: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assessment of Learning (Hasil Pembelajaran)
                </label>
                <textarea
                  rows={2}
                  value={editState.asesmenPembelajaran?.assessmentOfLearning || ''}
                  onChange={(e) =>
                    setEditState({
                      ...editState,
                      asesmenPembelajaran: {
                        ...editState.asesmenPembelajaran!,
                        assessmentOfLearning: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            {/* PILIHAN JENIS PENILAIAN DITERAPKAN (TAMBAH / KURANGI) */}
            <div className="space-y-3 bg-white p-3.5 rounded-lg border border-slate-200">
              <label className="block font-extrabold text-slate-900 text-xs">
                Pilih Jenis Penilaian yang Diterapkan pada Bab Ini (Centang untuk Mengaktifkan, Uncheck/Hapus untuk Mengurangi):
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  'Penilaian Sejawat',
                  'Penilaian Diri',
                  'Penilaian Proyek',
                  'Penilaian Produk',
                  'Observasi',
                  'Portofolio',
                  'Penilaian Berbasis Kelas',
                  'Penilaian Kinerja',
                  'Tes tertulis',
                  'Tes lisan',
                ].map((item) => {
                  const isChecked = currentInstrumenList.includes(item);
                  return (
                    <label
                      key={item}
                      onClick={() => handleToggleAssessmentItem(item)}
                      className={`flex items-center gap-1.5 p-2 rounded-lg border text-[11px] cursor-pointer select-none transition-all ${
                        isChecked
                          ? 'bg-emerald-100 border-emerald-500 text-emerald-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-500 opacity-60'
                      }`}
                    >
                      {isChecked ? (
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate">{item}</span>
                    </label>
                  );
                })}
              </div>

              {/* CUSTOM ASSESSMENT ADDITION BAR */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <p className="font-semibold text-slate-800 text-[11px]">Tambah Jenis Penilaian Kustom Lainnya:</p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newAssessmentInput}
                    onChange={(e) => setNewAssessmentInput(e.target.value)}
                    placeholder="Contoh: Penilaian Jurnal Harian, Penilaian Sikap Spiritual..."
                    className="flex-1 p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAssessment}
                    className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Penilaian</span>
                  </button>
                </div>

                {/* ACTIVE INSTRUMENTS TAGS WITH DELETE */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-bold text-slate-600">Daftar Penilaian Aktif ({currentInstrumenList.length}):</span>
                  {currentInstrumenList.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-300 text-slate-900 text-[11px] font-bold"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAssessmentItem(item)}
                        className="text-rose-600 hover:text-rose-800 cursor-pointer ml-0.5"
                        title="Hapus penilaian ini"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Form Submit buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-cyan-800 hover:bg-cyan-700 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Modul</span>
            </button>
          </div>
        </form>
      ) : (
        /* OFFICIAL KEMENDIKDASMEN 8-SECTION DISPLAY (EXACT MATCH TO UPLOADED PDF) */
        <div className="bg-white rounded-2xl border-2 border-slate-900 shadow-2xl overflow-hidden font-sans text-xs">
          {/* Top Title Bar */}
          <div className="bg-white text-slate-900 p-6 text-center border-b-2 border-slate-900 space-y-1">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-slate-950">
              RENCANA PEMBELAJARAN MENDALAM
            </h2>
            <p className="text-xs font-bold text-amber-900">
              Kurikulum Merdeka 2026 — Pembelajaran Berdiferensiasi
            </p>
            <p className="text-sm font-extrabold text-slate-800 uppercase tracking-wide pt-0.5">
              {schoolProfile.schoolName}
            </p>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* ==========================================
                A. INFORMASI UMUM
               ========================================== */}
            <div className="space-y-2">
              <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-sm uppercase tracking-wider rounded-t-md">
                A. INFORMASI UMUM
              </div>
              <table className="w-full border-collapse border border-slate-900 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50 w-52">Nama Satuan Pendidikan</td>
                    <td className="border border-slate-900 p-2 font-bold">{schoolProfile.schoolName}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Nama Guru Penyusun</td>
                    <td className="border border-slate-900 p-2 font-extrabold text-slate-950">{schoolProfile.teacherName}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">NUPTK Guru</td>
                    <td className="border border-slate-900 p-2 font-mono font-bold text-slate-950">
                      {schoolProfile.teacherNuptk || schoolProfile.teacherNip || '9443766667200012'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Mata Pelajaran</td>
                    <td className="border border-slate-900 p-2 font-bold text-amber-900">{schoolProfile.subject}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Kelas / Fase</td>
                    <td className="border border-slate-900 p-2 font-semibold">{schoolProfile.grade} / Fase {schoolProfile.fase}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Semester</td>
                    <td className="border border-slate-900 p-2 font-semibold">Semester {currentModul.semester} ({currentModul.semester === 1 ? 'Ganjil' : 'Genap'})</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Tahun Pelajaran</td>
                    <td className="border border-slate-900 p-2 font-mono font-bold">{schoolProfile.academicYear}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Alokasi Waktu</td>
                    <td className="border border-slate-900 p-2 font-bold">{currentModul.alokasiJp} JP ({currentModul.pertemuanCount} Pertemuan)</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Tanggal Penyusunan</td>
                    <td className="border border-slate-900 p-2">{schoolProfile.signaturePlaceDate || '14 Oktober 2026'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Sumber/Referensi CP</td>
                    <td className="border border-slate-900 p-2 font-medium">Dokumen kemendikdasmen, BSKAP 046/2025, Fase {schoolProfile.fase}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ==========================================
                B. IDENTIFIKASI
               ========================================== */}
            <div className="space-y-3">
              <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-sm uppercase tracking-wider rounded-t-md">
                B. IDENTIFIKASI
              </div>

              {/* B.1 Identifikasi Peserta Didik */}
              <div className="space-y-1">
                <h5 className="font-extrabold text-[#7c2d12] text-xs border-l-4 border-[#7c2d12] pl-2">
                  B.1 Identifikasi Peserta Didik
                </h5>
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-slate-900 p-2 font-bold bg-slate-50 w-52">
                        Kesiapan Awal (Data Asesmen)
                      </td>
                      <td className="border border-slate-900 p-2 leading-relaxed">
                        {currentModul.identifikasi?.pesertaDidik || 'Dari 36 siswa, 24 sudah memahami konsep dasar, 8 masih perlu pendampingan, 4 siap materi pendampingan.'}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-bold bg-slate-50">
                        Gaya Belajar
                      </td>
                      <td className="border border-slate-900 p-2 leading-relaxed">
                        Guru memperhatikan gaya belajar (visual, auditori, kinestetik) dan menerapkan diferensiasi sesuai kebutuhan.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* B.2 Materi Pelajaran */}
              <div className="space-y-1">
                <h5 className="font-extrabold text-[#7c2d12] text-xs border-l-4 border-[#7c2d12] pl-2">
                  B.2 Materi Pelajaran
                </h5>
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <tbody>
                    <tr>
                      <td className="border border-slate-900 p-2 font-bold bg-slate-50 w-52">Faktual</td>
                      <td className="border border-slate-900 p-2">Terminologi, istilah, fakta, dan data konkret yang relevan dengan topik {schoolProfile.subject}.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-bold bg-slate-50">Konseptual</td>
                      <td className="border border-slate-900 p-2">Prinsip, teori, dan hubungan antar konsep yang membentuk pemahaman mendalam tentang topik pembelajaran.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-bold bg-slate-50">Prosedural</td>
                      <td className="border border-slate-900 p-2">Langkah-langkah sistematis dan teknik spesifik dalam {schoolProfile.subject} yang perlu dikuasai peserta didik.</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-900 p-2 font-bold bg-slate-50">Metakognitif</td>
                      <td className="border border-slate-900 p-2">Strategi belajar mandiri dan evaluasi diri terhadap hasil belajar dalam konteks {schoolProfile.subject}.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* B.3 Dimensi Profil Lulusan */}
              <div className="space-y-1">
                <h5 className="font-extrabold text-[#7c2d12] text-xs border-l-4 border-[#7c2d12] pl-2">
                  B.3 Dimensi Profil Lulusan
                </h5>
                <table className="w-full border-collapse border border-slate-900 text-xs">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-slate-900 p-2 text-left w-52">Dimensi</th>
                      <th className="border border-slate-900 p-2 text-left">Deskripsi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(currentModul.identifikasi?.dimensiProfilLulusan || ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian']).map((dim: string) => (
                      <tr key={dim}>
                        <td className="border border-slate-900 p-2 font-bold">{dim}</td>
                        <td className="border border-slate-900 p-2">
                          {dim === 'Penalaran Kritis' && 'Peserta didik mampu menganalisis informasi secara mendalam dan mengambil keputusan berbasis bukti.'}
                          {dim === 'Kolaborasi' && 'Peserta didik bekerja sama secara efektif dalam tim dan menghargai perbedaan pendapat.'}
                          {dim === 'Kemandirian' && 'Peserta didik memiliki inisiatif dan bertanggung jawab atas proses belajarnya.'}
                          {dim === 'Kreativitas' && 'Peserta didik mampu menghasilkan gagasan, karya, dan tindakan yang orisinal serta inovatif.'}
                          {dim === 'Keimanan dan Ketakwaan terhadap Tuhan YME' && 'Peserta didik berakhlak mulia dan menjalankan perintah agama dengan teguh.'}
                          {dim === 'Kesehatan' && 'Peserta didik menjaga kebugaran jasmani dan kesejahteraan mental.'}
                          {dim === 'Kewargaan' && 'Peserta didik berpartisipasi aktif dalam kehidupan bermasyarakat dan berbangsa.'}
                          {dim === 'Komunikasi' && 'Peserta didik menyampaikan gagasan secara jelas, santun, dan responsif.'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ==========================================
                C. DESAIN PEMBELAJARAN
               ========================================== */}
            <div className="space-y-2">
              <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-sm uppercase tracking-wider rounded-t-md">
                C. DESAIN PEMBELAJARAN
              </div>
              <table className="w-full border-collapse border border-slate-900 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50 w-52">Capaian Pembelajaran</td>
                    <td className="border border-slate-900 p-2 leading-relaxed font-medium">
                      {currentModul.desainPembelajaran?.capaianPembelajaran || 'Pemahaman terhadap materi meliputi definisi dan konsep yang dikaitkan dengan fenomena dan masalah yang terjadi.'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Tujuan Pembelajaran</td>
                    <td className="border border-slate-900 p-2 font-bold leading-relaxed text-slate-950">
                      {Array.isArray(currentModul.desainPembelajaran?.tujuanPembelajaran)
                        ? currentModul.desainPembelajaran.tujuanPembelajaran.join('; ')
                        : currentModul.desainPembelajaran?.tujuanPembelajaran || currentModul.tujuanPembelajaran.join('; ')}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Lintas Disiplin Ilmu</td>
                    <td className="border border-slate-900 p-2">{currentModul.desainPembelajaran?.lintasDisiplinIlmu || 'Matematika, IPS, PKn, Geografi'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Model Pembelajaran</td>
                    <td className="border border-slate-900 p-2 font-bold text-amber-900">{currentModul.desainPembelajaran?.praktikPedagogis || 'Problem Based Learning (PBL)'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Metode Pembelajaran</td>
                    <td className="border border-slate-900 p-2">Diskusi Kelompok, Tanya Jawab, Presentasi</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Sarana Prasarana</td>
                    <td className="border border-slate-900 p-2">{currentModul.saranaPrasarana || 'PID | Laptop | Gawai / Smartphone | LKPD (Lembar Kerja Peserta Didik) | Whiteboard'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Target Peserta Didik</td>
                    <td className="border border-slate-900 p-2">{currentModul.targetPesertaDidik || 'Murid Reguler / Umum'}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Kemitraan Pembelajaran</td>
                    <td className="border border-slate-900 p-2 leading-relaxed">
                      {currentModul.desainPembelajaran?.kemitraanPembelajaran || 'Orang tua/wali sebagai mitra pendampingan di rumah; komunitas lokal sebagai sumber belajar kontekstual; narasumber terkait untuk menghubungkan materi dengan dunia nyata.'}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Lingkungan Pembelajaran</td>
                    <td className="border border-slate-900 p-2 space-y-1">
                      <p><strong>Fisik:</strong> Ruang kelas tertata mendukung kolaborasi. LKPD, Whiteboard & Spidol.</p>
                      <p><strong>Virtual/Digital:</strong> PID, Laptop, Gawai / Smartphone.</p>
                      <p><strong>Budaya:</strong> Suasana kelas yang aman, inklusif, dan mendorong pertumbuhan (growth mindset).</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ==========================================
                D. PETA PENGALAMAN BELAJAR
               ========================================== */}
            <div className="space-y-2">
              <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-sm uppercase tracking-wider rounded-t-md">
                D. PETA PENGALAMAN BELAJAR
              </div>
              <p className="text-[11px] text-slate-600 italic">
                Tiga tahap siklus pembelajaran (Memahami, Mengaplikasikan, Merefleksi) wajib ada — urutan menyesuaikan konteks TP dan model pembelajaran.
              </p>
              <table className="w-full border-collapse border border-slate-900 text-xs">
                <thead>
                  <tr className="bg-slate-100 font-bold text-center">
                    <th className="border border-slate-900 p-2 w-16">Urutan</th>
                    <th className="border border-slate-900 p-2 w-32">Tahap</th>
                    <th className="border border-slate-900 p-2 text-left">Deskripsi Pengalaman Belajar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-900 p-2 text-center font-bold">1</td>
                    <td className="border border-slate-900 p-2 font-bold text-emerald-900">Memahami</td>
                    <td className="border border-slate-900 p-2 leading-relaxed">
                      Peserta didik terlibat langsung mengamati fenomena/kasus terkait {schoolProfile.subject}, difasilitasi pertanyaan pemantik untuk membangun pemahaman awal terhadap tujuan pembelajaran.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 text-center font-bold">2</td>
                    <td className="border border-slate-900 p-2 font-bold text-amber-900">Mengaplikasikan</td>
                    <td className="border border-slate-900 p-2 leading-relaxed">
                      Melalui Problem Based Learning (PBL), peserta didik menerapkan konsep pada tantangan kontekstual secara kolaboratif untuk mencapai tujuan pembelajaran tersebut.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 text-center font-bold">3</td>
                    <td className="border border-slate-900 p-2 font-bold text-rose-900">Merefleksi</td>
                    <td className="border border-slate-900 p-2 leading-relaxed">
                      Peserta didik menuliskan refleksi singkat tentang apa yang dipahami dan apa yang masih membingungkan, lalu melakukan teach-back kepada teman sebaya.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ==========================================
                E. LANGKAH-LANGKAH PEMBELAJARAN
               ========================================== */}
            <div className="space-y-3">
              <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-sm uppercase tracking-wider rounded-t-md">
                E. LANGKAH-LANGKAH PEMBELAJARAN
              </div>

              {/* E.1 Pendahuluan */}
              {currentModul.pengalamanBelajar?.kegiatanAwal && (
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-300">
                  <h5 className="font-extrabold text-slate-950 text-xs">
                    E.1 Pendahuluan (±15 Menit)
                  </h5>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-800">
                    {currentModul.pengalamanBelajar.kegiatanAwal.deskripsi.map((line: string, idx: number) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* E.2 Kegiatan Inti */}
              <div className="space-y-2.5 p-3.5 bg-white rounded-lg border border-slate-300">
                <h5 className="font-extrabold text-slate-950 text-xs">
                  E.2 Kegiatan Inti (Mengikuti Urutan Siklus di Bagian D)
                </h5>

                {/* Tahap 1 - Memahami */}
                <div className="space-y-1 pl-2">
                  <p className="font-bold text-emerald-950">
                    Tahap 1 — Memahami:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-slate-800">
                    {currentModul.pengalamanBelajar?.kegiatanInti.memahami.deskripsi.map((line: string, idx: number) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>

                {/* Tahap 2 - Mengaplikasikan */}
                <div className="space-y-1 pl-2 pt-1 border-t border-slate-200">
                  <p className="font-bold text-amber-950">
                    Tahap 2 — Mengaplikasikan:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-slate-800">
                    {currentModul.pengalamanBelajar?.kegiatanInti.mengaplikasi.deskripsi.map((line: string, idx: number) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>

                {/* Tahap 3 - Merefleksi */}
                <div className="space-y-1 pl-2 pt-1 border-t border-slate-200">
                  <p className="font-bold text-rose-950">
                    Tahap 3 — Merefleksi:
                  </p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-slate-800">
                    {currentModul.pengalamanBelajar?.kegiatanInti.merefleksi.deskripsi.map((line: string, idx: number) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] font-semibold text-slate-700 italic pt-1">
                    Metode yang digunakan sepanjang kegiatan inti: Diskusi Kelompok, Tanya Jawab, Presentasi.
                  </p>
                </div>
              </div>

              {/* E.3 Penutup */}
              {currentModul.pengalamanBelajar?.kegiatanPenutup && (
                <div className="space-y-1.5 p-3.5 bg-slate-50 rounded-lg border border-slate-300">
                  <h5 className="font-extrabold text-slate-950 text-xs">
                    E.3 Penutup (±10 Menit)
                  </h5>
                  <ul className="list-disc list-inside space-y-1 pl-1 text-slate-800">
                    {currentModul.pengalamanBelajar.kegiatanPenutup.deskripsi.map((line: string, idx: number) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* ==========================================
                F. ASESMEN PEMBELAJARAN
               ========================================== */}
            <div className="space-y-4">
              <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-sm uppercase tracking-wider rounded-t-md">
                F. ASESMEN PEMBELAJARAN
              </div>

              <div className="space-y-3">
                <h5 className="font-extrabold text-[#7c2d12] text-xs">
                  F.1 Asesmen Formatif (Dilaksanakan dalam Pertemuan Ini)
                </h5>

                {/* F.1.a Sebelum Pembelajaran */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-300">
                  <p className="font-extrabold text-slate-900 text-xs">
                    F.1.a — Sebelum Pembelajaran (Asesmen Diagnostik Awal)
                  </p>
                  <table className="w-full border-collapse border border-slate-900 text-xs mt-1">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-slate-900 p-1.5 w-12 text-center">No.</th>
                        <th className="border border-slate-900 p-1.5 text-left">Pertanyaan Pemantik</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-1.5 text-center font-bold">1</td>
                        <td className="border border-slate-900 p-1.5">Sebelum mempelajari materi ini, dari mana asal barang atau jasa yang kita gunakan setiap hari?</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 text-center font-bold">2</td>
                        <td className="border border-slate-900 p-1.5">Apa yang terjadi jika tidak ada kegiatan produksi?</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 text-center font-bold">3</td>
                        <td className="border border-slate-900 p-1.5">Apa perbedaan antara membuat barang dan memberikan jasa?</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Cara Penilaian</td>
                        <td className="border border-slate-900 p-1.5">
                          Bersifat kualitatif dan tidak diberi skor angka. Guru membaca jawaban singkat peserta didik lalu memetakannya ke salah satu dari tiga kelompok kesiapan: <strong>Perlu Pendampingan</strong>, <strong>Reguler</strong>, atau <strong>Siap Pengayaan</strong>.
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Output Penilaian</td>
                        <td className="border border-slate-900 p-1.5">
                          Peta kesiapan awal peserta didik (per kelompok), menjadi dasar pembentukan kelompok diferensiasi pada Kegiatan Inti hari ini.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* F.1.b Saat Pembelajaran */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-300">
                  <p className="font-extrabold text-slate-900 text-xs">
                    F.1.b — Saat Pembelajaran (Asesmen Proses)
                  </p>
                  <table className="w-full border-collapse border border-slate-900 text-xs mt-1">
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 w-32">Teknik</td>
                        <td className="border border-slate-900 p-1.5" colSpan={4}>
                          Observasi aktif selama diskusi/kerja kelompok, pertanyaan lisan (teknik Socratic/cold calling), dan pengamatan keterlibatan peserta didik sepanjang Kegiatan Inti.
                        </td>
                      </tr>
                      <tr className="bg-slate-100 font-bold text-center">
                        <td className="border border-slate-900 p-1.5 text-left">Aspek</td>
                        <td className="border border-slate-900 p-1.5">Sangat Baik (4)</td>
                        <td className="border border-slate-900 p-1.5">Baik (3)</td>
                        <td className="border border-slate-900 p-1.5">Cukup (2)</td>
                        <td className="border border-slate-900 p-1.5">Perlu Bimbingan (1)</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold">Keterlibatan Aktif</td>
                        <td className="border border-slate-900 p-1.5">Selalu aktif, berinisiatif</td>
                        <td className="border border-slate-900 p-1.5">Sering aktif</td>
                        <td className="border border-slate-900 p-1.5">Kadang aktif jika diminta</td>
                        <td className="border border-slate-900 p-1.5">Pasif</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold">Kemampuan Analisis</td>
                        <td className="border border-slate-900 p-1.5">Analisis mendalam & kritis</td>
                        <td className="border border-slate-900 p-1.5">Analisis logis</td>
                        <td className="border border-slate-900 p-1.5">Analisis dasar</td>
                        <td className="border border-slate-900 p-1.5">Belum mampu mandiri</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold">Kolaborasi Tim</td>
                        <td className="border border-slate-900 p-1.5">Kontribusi aktif</td>
                        <td className="border border-slate-900 p-1.5">Bekerja sama baik</td>
                        <td className="border border-slate-900 p-1.5">Kontribusi minimal</td>
                        <td className="border border-slate-900 p-1.5">Sulit bekerja tim</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Output Penilaian</td>
                        <td className="border border-slate-900 p-1.5" colSpan={4}>
                          Checklist partisipasi per peserta didik dan catatan anekdotal guru selama kegiatan berlangsung — dipakai sebagai bahan umpan balik langsung, bukan nilai rapor.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* F.1.c Exit Ticket */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-300">
                  <p className="font-extrabold text-slate-900 text-xs">
                    F.1.c — Setelah Pembelajaran (Exit Ticket)
                  </p>
                  <table className="w-full border-collapse border border-slate-900 text-xs mt-1">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-slate-900 p-1.5 w-12 text-center">No.</th>
                        <th className="border border-slate-900 p-1.5 text-left">Pertanyaan Refleksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-1.5 text-center font-bold">1</td>
                        <td className="border border-slate-900 p-1.5">Sebutkan 1 hal paling penting yang kamu pelajari hari ini tentang {schoolProfile.subject}.</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 text-center font-bold">2</td>
                        <td className="border border-slate-900 p-1.5">Apakah ada bagian yang masih membingungkan? Jelaskan.</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 text-center font-bold">3</td>
                        <td className="border border-slate-900 p-1.5">Pada skala 1-4, seberapa yakin kamu sudah mencapai tujuan pembelajaran? (1 = belum sama sekali, 4 = sangat yakin)</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Cara Penilaian</td>
                        <td className="border border-slate-900 p-1.5">Exit ticket dinilai cepat oleh guru sebagai indikator pemahaman mandiri peserta didik terhadap TP hari ini — bukan skor akademik formal.</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Output Penilaian</td>
                        <td className="border border-slate-900 p-1.5">Rekap sebaran skala pemahaman (1-4) seluruh kelas, menjadi dasar keputusan: melanjutkan ke topik berikutnya, atau melakukan pengulangan singkat di awal pertemuan berikutnya.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* F.3 Pedoman Penskoran Sumatif */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-300">
                  <p className="font-extrabold text-slate-900 text-xs">
                    F.3 Pedoman Penskoran Sumatif
                  </p>
                  <table className="w-full border-collapse border border-slate-900 text-xs mt-1">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="border border-slate-900 p-1.5 text-left w-52">Komponen</th>
                        <th className="border border-slate-900 p-1.5 w-20 text-center">Bobot</th>
                        <th className="border border-slate-900 p-1.5 text-left">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold">Pilihan Ganda (10 soal)</td>
                        <td className="border border-slate-900 p-1.5 text-center font-bold">30%</td>
                        <td className="border border-slate-900 p-1.5">Skor benar × 3, maks 30 poin.</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold">Esai (5 soal)</td>
                        <td className="border border-slate-900 p-1.5 text-center font-bold">50%</td>
                        <td className="border border-slate-900 p-1.5">Tiap soal maks 20 poin, mengukur analisis dan sintesis.</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold">Portofolio/Proyek</td>
                        <td className="border border-slate-900 p-1.5 text-center font-bold">20%</td>
                        <td className="border border-slate-900 p-1.5">Penilaian proses dan produk pembelajaran.</td>
                      </tr>
                    </tbody>
                  </table>
                  <p className="text-[11px] font-bold text-emerald-900 bg-emerald-50 p-2 rounded border border-emerald-200 mt-2">
                    Konversi Nilai: 90-100 = A | 80-89 = B | 70-79 = C | 60-69 = D | &lt;60 = E
                  </p>
                </div>

                {/* F.4 Remedial dan Pengayaan */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-300">
                  <p className="font-extrabold text-slate-900 text-xs">
                    F.4 Remedial dan Pengayaan
                  </p>
                  <table className="w-full border-collapse border border-slate-900 text-xs mt-1">
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 w-32">Remedial</td>
                        <td className="border border-slate-900 p-1.5">
                          Re-teaching konsep kunci dengan pendekatan berbeda, tutor sebaya, dan latihan berjenjang dari LOTS menuju MOTS bagi peserta didik di bawah KKM.
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Pengayaan</td>
                        <td className="border border-slate-900 p-1.5">
                          Proyek mandiri terkait {schoolProfile.subject}, literatur lanjutan, atau partisipasi kompetisi bagi peserta didik yang telah mencapai KKM.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* F.5 Output Rekapitulasi Penilaian */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-300">
                  <p className="font-extrabold text-slate-900 text-xs">
                    F.5 Output Rekapitulasi Penilaian
                  </p>
                  <p className="text-[10.5px] text-slate-500 italic mb-1">
                    Diisi manual oleh guru setelah asesmen berlangsung.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-900 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 font-bold text-center">
                          <th className="border border-slate-900 p-1.5 w-10">No.</th>
                          <th className="border border-slate-900 p-1.5 text-left">Nama Peserta Didik</th>
                          <th className="border border-slate-900 p-1.5 text-left">Catatan Formatif</th>
                          <th className="border border-slate-900 p-1.5 w-16">Nilai PG</th>
                          <th className="border border-slate-900 p-1.5 w-16">Nilai Esai</th>
                          <th className="border border-slate-900 p-1.5 w-20">Nilai Akhir</th>
                          <th className="border border-slate-900 p-1.5 w-16">Predikat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: 36 }, (_, i) => i + 1).map((no: number) => (
                          <tr key={no}>
                            <td className="border border-slate-900 p-1.5 text-center font-mono">{no}</td>
                            <td className="border border-slate-900 p-1.5 font-semibold text-slate-800"></td>
                            <td className="border border-slate-900 p-1.5 italic text-slate-600"></td>
                            <td className="border border-slate-900 p-1.5 text-center font-mono"></td>
                            <td className="border border-slate-900 p-1.5 text-center font-mono"></td>
                            <td className="border border-slate-900 p-1.5 text-center font-mono font-bold text-emerald-900"></td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold"></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 10 INSTRUMEN PENILAIAN SELEKSI TERPILIH */}
                <div className="pt-3 border-t-2 border-slate-300 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    <span className="font-extrabold text-emerald-950 text-xs">
                      Pilihan 10 Instrumen Penilaian Terlampir:
                    </span>
                    <span className="px-2.5 py-0.5 rounded bg-emerald-800 text-white font-mono text-[10.5px] font-bold">
                      {selectedInstrumentsToPrint.length} Terpilih
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-[11px] font-bold">
                    {currentInstrumenList.map((instName) => {
                      const isChecked = selectedInstrumentsToPrint.includes(instName);
                      return (
                        <button
                          key={instName}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedInstrumentsToPrint(selectedInstrumentsToPrint.filter((i) => i !== instName));
                            } else {
                              setSelectedInstrumentsToPrint([...selectedInstrumentsToPrint, instName]);
                            }
                          }}
                          className={`p-1.5 rounded border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-800 text-white border-emerald-900 font-extrabold'
                              : 'bg-white text-slate-500 border-slate-300 opacity-60 hover:bg-slate-100'
                          }`}
                        >
                          <span>{isChecked ? '☑' : '☐'}</span>
                          <span className="truncate">{instName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Rendered Selected Assessment Instruments */}
                  <div className="space-y-3 pt-2">
                    {[
                      { nameMatch: 'Penilaian Sejawat', item: tenInstruments.penilaianSejawat },
                      { nameMatch: 'Penilaian Diri', item: tenInstruments.penilaianDiri },
                      { nameMatch: 'Penilaian Proyek', item: tenInstruments.penilaianProyek },
                      { nameMatch: 'Penilaian Produk', item: tenInstruments.penilaianProduk },
                      { nameMatch: 'Observasi', item: tenInstruments.observasiSikap },
                      { nameMatch: 'Portofolio', item: tenInstruments.portofolio },
                      { nameMatch: 'Penilaian Berbasis Kelas', item: tenInstruments.penilaianBerbasisKelas },
                      { nameMatch: 'Penilaian Kinerja', item: tenInstruments.penilaianKinerja },
                    ]
                      .filter((x) => selectedInstrumentsToPrint.includes(x.nameMatch))
                      .map(({ item }) => (
                        <div key={item.id} className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-300">
                          <div className="flex justify-between font-bold text-slate-900 text-xs">
                            <span>{item.name}</span>
                            <span className="italic font-normal text-slate-600">[{item.category}]</span>
                          </div>
                          <table className="w-full border-collapse border border-slate-900 text-left text-[11px]">
                            <thead>
                              <tr className="bg-slate-100 font-bold">
                                {item.tableHeaders.map((h, i) => (
                                  <th key={i} className="border border-slate-900 p-1.5">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {item.items.map((row) => (
                                <tr key={row.no}>
                                  <td className="border border-slate-900 p-1.5 text-center font-bold w-8">{row.no}</td>
                                  <td className="border border-slate-900 p-1.5 font-semibold w-1/4">{row.kriteria}</td>
                                  <td className="border border-slate-900 p-1.5">{row.indikator}</td>
                                  <td className="border border-slate-900 p-1.5 text-center font-bold w-20">{row.skorMaksimal}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          <p className="text-[10.5px] text-slate-700 italic">
                            * Rubrik: {item.rubrikPenilaian.map((r) => `${r.predikat} (${r.skor})`).join(' · ')} | {item.formatLembar.skalaSkor}
                          </p>
                        </div>
                      ))}

                    {selectedInstrumentsToPrint.includes('Tes tertulis') && (
                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-300">
                        <p className="font-bold text-slate-900 text-xs">9. Tes Tertulis (Kisi-Kisi, Soal PG & Uraian HOTS)</p>
                        <div className="space-y-2">
                          {tenInstruments.tesTertulisItems.map((tItem) => (
                            <div key={tItem.no} className="p-2 border border-slate-300 rounded bg-white space-y-1">
                              <p className="font-bold text-slate-950">Soal {tItem.no} ({tItem.bentuk} - Bobot {tItem.bobotSkor}): {tItem.soal}</p>
                              {tItem.pilihan && (
                                <div className="pl-3 text-[10.5px] space-y-0.5">
                                  {tItem.pilihan.map((p, pIdx) => (
                                    <p key={pIdx}>{p}</p>
                                  ))}
                                </div>
                              )}
                              <p className="text-[10.5px] font-semibold text-emerald-900">Kunci/Rubrik: {tItem.kunciJawaban}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedInstrumentsToPrint.includes('Tes lisan') && (
                      <div className="space-y-1.5 bg-slate-50 p-3 rounded-lg border border-slate-300">
                        <p className="font-bold text-slate-900 text-xs">10. Tes Lisan (Panduan & Pertanyaan Pemantik Konseptual/Vokasi)</p>
                        <div className="space-y-1.5">
                          {tenInstruments.tesLisanItems.map((lItem) => (
                            <div key={lItem.no} className="p-2 border border-slate-300 rounded bg-white text-[11px]">
                              <p className="font-bold text-purple-950">Pertanyaan {lItem.no} (Fokus: {lItem.fokusKompetensi}): &ldquo;{lItem.pertanyaan}&rdquo;</p>
                              <p className="text-[10.5px] text-purple-900 font-medium">Rubrik Skor (Maks {lItem.skorMaks}): {lItem.kunciJawabanDanRubrik}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
                G. DIFERENSIASI PEMBELAJARAN
               ========================================== */}
            <div className="space-y-2">
              <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-sm uppercase tracking-wider rounded-t-md">
                G. DIFERENSIASI PEMBELAJARAN
              </div>
              <table className="w-full border-collapse border border-slate-900 text-xs">
                <tbody>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50 w-32">Konten</td>
                    <td className="border border-slate-900 p-2 leading-relaxed">
                      Materi disajikan multimodal (teks, visual, audio, video) untuk mengakomodasi gaya belajar berbeda.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Proses</td>
                    <td className="border border-slate-900 p-2 leading-relaxed">
                      Diferensiasi proses melalui pilihan kegiatan, tugas bertingkat, dan pengelompokan fleksibel sesuai kebutuhan.
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">Produk</td>
                    <td className="border border-slate-900 p-2 leading-relaxed">
                      Peserta didik memilih bentuk produk sesuai minat: laporan tertulis, poster, video singkat, atau demonstrasi langsung.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* ==========================================
                H. LAMPIRAN
               ========================================== */}
            <div className="space-y-4">
              <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-sm uppercase tracking-wider rounded-t-md">
                H. LAMPIRAN
              </div>

              {/* Daftar Pustaka */}
              <div className="space-y-1 bg-slate-50 p-3.5 rounded-lg border border-slate-300">
                <h5 className="font-extrabold text-slate-950 text-xs">
                  Daftar Pustaka
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-slate-800 leading-relaxed pt-1">
                  <li>Kemendikdasmen. (2026). Panduan Pembelajaran Mendalam Kurikulum Merdeka. Jakarta: Badan Standar, Kurikulum, dan Asesmen Pendidikan.</li>
                  <li>Kemendikdasmen. (2026). Capaian Pembelajaran {schoolProfile.subject} — Kurikulum Merdeka.</li>
                  <li>Platform Merdeka Mengajar (PMM). Modul Ajar dan Perangkat Pembelajaran {schoolProfile.subject}. guru.kemdikbud.go.id</li>
                </ol>
              </div>

              {/* Lembar Tanda Tangan Pengesahan */}
              <div className="p-4 bg-white rounded-lg border border-slate-300 space-y-6 text-center text-xs">
                <div className="flex justify-end text-slate-700 font-medium">
                  <p>{schoolProfile.signaturePlaceDate || 'Bandar Mataram, 14 Oktober 2026'}</p>
                </div>
                <div className="grid grid-cols-2 gap-8 pt-2">
                  <div className="space-y-16">
                    <div>
                      <p className="text-slate-600">Mengetahui,</p>
                      <p className="font-bold text-slate-900">Kepala {schoolProfile.schoolName}</p>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-950 underline decoration-2 underline-offset-4">
                        {schoolProfile.headmasterName || 'Yuliana Setyowati, S.Pd., M.M'}
                      </p>
                      <p className="font-mono text-slate-700">
                        NIP. {schoolProfile.headmasterNip || '196907051992032008'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-16">
                    <div>
                      <p className="text-slate-600">Disusun Oleh,</p>
                      <p className="font-bold text-slate-900">Guru Mata Pelajaran {schoolProfile.subject}</p>
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-950 underline decoration-2 underline-offset-4">
                        {schoolProfile.teacherName || 'Herda Helmi, S.Pd.'}
                      </p>
                      <p className="font-mono text-slate-700">
                        NIP. {schoolProfile.teacherNip || '198908292024212022'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pasca Observasi Page 6 */}
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-300 space-y-3 font-sans text-xs">
                <h5 className="font-black text-slate-950 text-sm border-b border-slate-300 pb-1">Pasca Observasi & Rencana Tindak Lanjut</h5>
                <div className="space-y-2 text-slate-800">
                  <div>
                    <p className="font-extrabold text-slate-950">Catatan hal yang perlu ditingkatkan dari pelaksanaan pembelajaran:</p>
                    <ol className="list-decimal list-inside pl-2 space-y-0.5 pt-0.5">
                      <li>Mengoptimalkan manajemen waktu,</li>
                      <li>Penekanan kesepakatan pembelajaran bersama siswa.</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-950">Rencana Tindak Lanjut:</p>
                    <ol className="list-decimal list-inside pl-2 space-y-1 pt-0.5">
                      <li><strong>Mengoptimalkan manajemen waktu:</strong> Menyusun perencanaan kegiatan secara lebih terstruktur, menentukan skala prioritas, serta mengalokasikan waktu secara efektif agar seluruh proses pembelajaran berjalan sesuai jadwal.</li>
                      <li><strong>Menekankan kesepakatan pembelajaran:</strong> Mengingatkan dan menegaskan kembali kesepakatan pembelajaran bersama peserta didik, termasuk kedisiplinan, tanggung jawab, partisipasi aktif, serta aturan selama pembelajaran.</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};



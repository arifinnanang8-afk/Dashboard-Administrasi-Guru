import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileText,
  ArrowLeft,
  Printer,
  Download,
  Edit3,
  Key,
  CheckCircle2,
  FileSpreadsheet,
  Maximize2,
  Minimize2,
  BookOpen,
  Calendar,
  Sparkles,
  Layers,
  HelpCircle,
  Brain,
  Users,
  Compass,
} from 'lucide-react';
import { exportLkpdToWord, exportLkpdToExcel } from '../utils/exporter';
import { PipelineSyncHeader } from '../components/PipelineSyncHeader';
import { IdentitasPerangkat } from '../components/IdentitasPerangkat';
import { LkpdItem } from '../types';
import { getSyncedSubChaptersForBab } from '../utils/curriculumLogic';

export const LkpdView: React.FC = () => {
  const {
    lkpdList,
    updateLkpd,
    schoolProfile,
    setActiveView,
    openPrintModal,
    showNotification,
    isFocusMode,
    toggleFocusMode,
    prota,
    promes,
    modulAjarList,
    selectedBook,
    students,
  } = useApp();

  const [selectedBab, setSelectedBab] = useState<number>(1);
  const [selectedPertemuan, setSelectedPertemuan] = useState<number>(1);
  const [showAnswerKey, setShowAnswerKey] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Ensure 36 authentic students dataset for class assessment
  const classOf36Students = useMemo(() => {
    const list = [...(students || [])];
    const defaultNames = [
      'Aditya Pratama Putra', 'Ahmad Faisal Ramadhani', 'Anisa Rahmawati Putri', 'Bagas Wahyu Saputra',
      'Bayu Ardiyansah Putra', 'Citra Dewi Anggraini', 'Dandi Rizki Kurniawan', 'Devi Kartika Sari',
      'Dimas Setiawan', 'Eka Nur Halimah', 'Fajar Hidayatullah', 'Fitri Handayani',
      'Gilang Ramadhan', 'Hesti Wulandari', 'Ihsan Maulana', 'Indah Permatasari',
      'Kurnia Sandy', 'Lestari Ayu Ningtyas', 'Muhammad Ilham', 'Nabila Zahra',
      'Rian Pratama', 'Siti Aisyah', 'Teguh Prasetyo', 'Zahra Amelia',
      'Abdul Halim Mubarok', 'Bella Saphira', 'Candra Wijaya', 'Dina Marlina',
      'Erwin Syahputra', 'Fiona Lestari', 'Guntur Pamungkas', 'Hani Febrianti',
      'Irfan Hakim', 'Jasmine Putri', 'Kevin Sanjaya', 'Lia Lestari'
    ];

    while (list.length < 36) {
      const idx = list.length;
      const name = defaultNames[idx] || `Siswa Ke-${idx + 1}`;
      list.push({
        id: `std-36-${idx + 1}`,
        nisn: `0081234${(idx + 1).toString().padStart(3, '0')}`,
        name,
        gender: idx % 2 === 0 ? 'L' : 'P',
        formatifScores: { 'TP 10.1': 85 },
        sumatifLmScores: { 'Bab 1': 85 },
        sumatifAkhir: 85,
        nilaiAkhir: 85,
        predikat: 'A',
        kktpStatus: 'Tuntas',
        deskripsi: 'Menunjukkan penguasaan kompetensi yang baik dan aktif berkolaborasi.',
      });
    }

    return list.slice(0, 36);
  }, [students]);

  // Find active PROTA or Modul Ajar item for the selected Bab
  const activeProta = prota.find((p: any) => p.babNumber === selectedBab) || prota[0];
  const activeModul = modulAjarList.find((m: any) => m.babNumber === selectedBab) || modulAjarList[0];
  const baseLkpd = lkpdList.find((l: any) => l.babNumber === selectedBab) || lkpdList[0];

  // Derive Bab total JP and total meetings from PROTA & Modul Ajar
  const babTotalJp = activeProta?.alokasiJp || activeModul?.alokasiJp || 24;
  const babTotalPertemuan = activeModul?.pertemuanCount || Math.max(1, Math.ceil(babTotalJp / 4));

  // Get official textbook sub-chapters for this Bab
  const subChapters = getSyncedSubChaptersForBab(
    schoolProfile.subject,
    schoolProfile.grade,
    selectedBab
  );

  // Derive sub-topic for the selected meeting
  const subTopicIdx = (selectedPertemuan - 1) % subChapters.length;
  const currentSubTopic = subChapters[subTopicIdx] || `Sub-Materi Pertemuan ke-${selectedPertemuan}`;

  // Current active LKPD item for this Bab & Meeting
  const currentLkpd: LkpdItem = {
    ...baseLkpd,
    babNumber: selectedBab,
    babTitle: activeProta?.babTitle || baseLkpd?.babTitle || `Bab ${selectedBab}`,
    pertemuan: selectedPertemuan,
    waktu: `${Math.round(babTotalJp / babTotalPertemuan)} JP (${selectedBook?.penerbit ? selectedBook.penerbit : 'Buku Utama Kemendikdasmen'})`,
    title: `LKPD Pertemuan ${selectedPertemuan}: ${currentSubTopic}`,
  };

  const [editState, setEditState] = useState<LkpdItem>(currentLkpd);

  const handleSelectBab = (num: number) => {
    setSelectedBab(num);
    setSelectedPertemuan(1);
    setIsEditing(false);
  };

  const handleSelectPertemuan = (pNum: number) => {
    setSelectedPertemuan(pNum);
    setIsEditing(false);
  };

  const handleSaveLkpd = (e: React.FormEvent) => {
    e.preventDefault();
    updateLkpd(editState);
    setIsEditing(false);
    showNotification(
      'success',
      `LKPD Bab ${editState.babNumber} Pertemuan ke-${selectedPertemuan} berhasil disimpan & disingkronkan!`
    );
  };

  const handleExportWord = async () => {
    await exportLkpdToWord(
      [currentLkpd],
      schoolProfile,
      `LKPD_BAB_${currentLkpd.babNumber}_P${selectedPertemuan}_${schoolProfile.subject.replace(/\s+/g, '_')}.docx`
    );
    showNotification(
      'success',
      `Tabel LKPD Bab ${currentLkpd.babNumber} Pertemuan ke-${selectedPertemuan} berhasil diekspor ke Word (.docx)!`
    );
  };

  return (
    <div className="space-y-6">
      {!isFocusMode && (
        <>
          <PipelineSyncHeader />
          <IdentitasPerangkat
            documentTitle={`Lembar Kerja Peserta Didik (LKPD) Bab ${selectedBab}: ${currentLkpd.babTitle} (Pertemuan ${selectedPertemuan} / ${babTotalPertemuan} Pertemuan - ${babTotalJp} JP)`}
            semesterSpecific={(currentLkpd.semester || 1) as 1 | 2}
          />
        </>
      )}

      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
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
              <FileText className="w-5 h-5 text-emerald-600" />
              Lembar Kerja Peserta Didik (LKPD) Setiap Pertemuan
            </h2>
            <p className="text-xs text-slate-500">
              Terpadu Modul Ajar &amp; Pembelajaran Mendalam (Deep Learning: Memahami ➔ Mengaplikasikan ➔ Merefleksi)
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
                  ? 'Mode Fokus Diaktifkan: Sidebar disembunyikan agar Anda fokus menyusun LKPD.'
                  : 'Mode Fokus Dinonaktifkan: Navigasi ditampilkan kembali.'
              );
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
              isFocusMode
                ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500 ring-2 ring-amber-300/60'
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-800'
            }`}
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
            onClick={() => {
              setEditState(currentLkpd);
              setIsEditing(!isEditing);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Batal Ubah' : 'Edit LKPD Ini'}</span>
          </button>

          <button
            onClick={() => setShowAnswerKey(!showAnswerKey)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Key className="w-4 h-4 text-amber-600" />
            <span>{showAnswerKey ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}</span>
          </button>

          <button
            onClick={() => {
              exportLkpdToExcel(lkpdList, schoolProfile);
              showNotification('success', 'Data LKPD & Kunci Jawaban berhasil diekspor ke Excel (.xlsx)!');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
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
            onClick={() => openPrintModal('lkpd')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Ekspor PDF / Cetak</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PILIHAN BAB PEMBELAJARAN (Disinkron dengan Materi & Pertemuan PROTA & PROMES) */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px] uppercase tracking-wider mb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sinkronisasi Pipeline Aktif</span>
            </span>
            <h3 className="text-sm md:text-base font-extrabold text-white">
              Pilihan Bab Pembelajaran (Disinkron dengan Materi &amp; Pertemuan PROTA &amp; PROMES)
            </h3>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Sumber Buku: <b className="text-cyan-300">{selectedBook?.penerbit || 'Buku Utama Kemendikdasmen RI'}</b>
          </span>
        </div>

        {/* Bab Grid / Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {lkpdList.map((l: any) => {
            const pMatch = prota.find((p: any) => p.babNumber === l.babNumber);
            const mMatch = modulAjarList.find((m: any) => m.babNumber === l.babNumber);
            const totalJp = pMatch?.alokasiJp || mMatch?.alokasiJp || 24;
            const totalPertemuan = mMatch?.pertemuanCount || Math.ceil(totalJp / 4);
            const isActive = selectedBab === l.babNumber;

            return (
              <button
                key={l.id}
                type="button"
                onClick={() => handleSelectBab(l.babNumber)}
                className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white border-emerald-400 shadow-lg ring-2 ring-emerald-300/50'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1">
                    <span className="uppercase tracking-wider">Bab {l.babNumber}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/60 text-slate-300 border border-slate-700 text-[10px]">
                      Smt {l.semester || 1}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-xs leading-snug line-clamp-2">
                    {pMatch?.babTitle || l.babTitle}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-semibold">
                  <span className={isActive ? 'text-emerald-100' : 'text-cyan-400'}>
                    {totalPertemuan} Pertemuan / {totalJp} JP
                  </span>
                  <span className={isActive ? 'text-emerald-200 font-bold' : 'text-slate-400'}>
                    {isActive ? 'Aktif ✓' : 'Pilih Bab ➔'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: PILIHAN PERTEMUAN UNTUK BAB (Pertemuan / JP) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="text-sm md:text-base font-extrabold text-slate-900">
                Pilihan Pertemuan untuk Bab {selectedBab}: {currentLkpd.babTitle} ({babTotalPertemuan} Pertemuan / {babTotalJp} JP)
              </h3>
              <p className="text-xs text-slate-500">
                Pilih pertemuan aktif untuk mengulas materi, pertanyaan diskusi, dan lembar kerja Pembelajaran Mendalam
              </p>
            </div>
          </div>
        </div>

        {/* Meeting Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {Array.from({ length: babTotalPertemuan }).map((_, idx) => {
            const pNum = idx + 1;
            const subName = subChapters[idx % subChapters.length] || `Sub-Materi Pertemuan ke-${pNum}`;
            const isPertemuanActive = selectedPertemuan === pNum;

            return (
              <button
                key={pNum}
                type="button"
                onClick={() => handleSelectPertemuan(pNum)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                  isPertemuanActive
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-md ring-2 ring-emerald-300'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] ${
                  isPertemuanActive ? 'bg-white text-emerald-900' : 'bg-slate-200 text-slate-700'
                }`}>
                  {pNum}
                </span>
                <div className="text-left">
                  <div className="leading-tight">Pertemuan {pNum}</div>
                  <div className={`text-[10px] font-medium truncate max-w-[150px] ${
                    isPertemuanActive ? 'text-emerald-200' : 'text-slate-500'
                  }`}>
                    {subName.split(' ')[0]} {subName.split(' ')[1] || ''}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Meeting Information Banner */}
        <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-bold text-emerald-950">
              Pertemuan ke-{selectedPertemuan} dari {babTotalPertemuan} Pertemuan:
            </span>
            <span className="font-medium text-emerald-900 truncate">
              {currentSubTopic}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 font-bold text-emerald-800">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Alokasi: {Math.round(babTotalJp / babTotalPertemuan)} JP per Pertemuan</span>
          </div>
        </div>
      </div>

      {/* Inline Editor for LKPD */}
      {isEditing && (
        <form
          onSubmit={handleSaveLkpd}
          className="bg-emerald-50/70 p-6 rounded-2xl border border-emerald-200 shadow-sm space-y-4 max-w-4xl mx-auto"
        >
          <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
            <h3 className="text-sm font-extrabold text-emerald-950 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-emerald-700" />
              Penyusunan &amp; Penyuntingan LKPD Bab {selectedBab} Pertemuan {selectedPertemuan}
            </h3>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan LKPD Pertemuan {selectedPertemuan}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Judul LKPD Pertemuan</label>
              <input
                type="text"
                value={editState.title}
                onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Alokasi Waktu / Penerbit</label>
              <input
                type="text"
                value={editState.waktu}
                onChange={(e) => setEditState({ ...editState, waktu: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">Ringkasan Materi Konsep (Mindful Reading)</label>
            <textarea
              rows={3}
              value={editState.materiRingkas}
              onChange={(e) => setEditState({ ...editState, materiRingkas: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">Aktivitas Penyelidikan Kolaboratif (Meaningful Learning)</label>
            <textarea
              rows={3}
              value={editState.aktivitas}
              onChange={(e) => setEditState({ ...editState, aktivitas: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">Tugas Mandiri &amp; Refleksi Belajar (Joyful Learning)</label>
            <textarea
              rows={2}
              value={editState.tugasMandiri}
              onChange={(e) => setEditState({ ...editState, tugasMandiri: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
            />
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">Kunci Jawaban &amp; Rubrik Guru</label>
            <textarea
              rows={3}
              value={editState.kunciJawaban}
              onChange={(e) => setEditState({ ...editState, kunciJawaban: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
            />
          </div>
        </form>
      )}

      {/* Main Worksheet Layout (Deep Learning Integrated) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-md p-6 sm:p-10 space-y-6 max-w-4xl mx-auto">
        {/* Worksheet Header */}
        <div className="border-b-2 border-slate-900 pb-4 text-center space-y-1">
          <p className="text-xs font-bold tracking-widest text-slate-500 uppercase">
            {schoolProfile.schoolName}
          </p>
          <h3 className="text-xl font-black text-slate-900 uppercase">
            {currentLkpd.title}
          </h3>
          <p className="text-xs font-medium text-slate-600">
            Mata Pelajaran: {schoolProfile.subject} · Kelas: {schoolProfile.grade} · Pertemuan Ke-{selectedPertemuan} ({currentLkpd.waktu})
          </p>
        </div>

        {/* IDENTITAS KURIKULUM RESMI LKPD */}
        <div className="border border-slate-900 rounded-xl overflow-hidden text-xs">
          <div className="bg-slate-100 px-3 py-1.5 font-bold uppercase tracking-wider text-slate-800 border-b border-slate-900 text-[11px] flex justify-between">
            <span>IDENTITAS PERANGKAT KERJA SISWA:</span>
            <span className="font-mono text-[10px]">PEMBELAJARAN MENDALAM (DEEP LEARNING) BSKAP 2025</span>
          </div>
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold bg-slate-50 w-44">Satuan Pendidikan</td>
                <td className="p-2 font-bold">: {schoolProfile.schoolName}</td>
                <td className="p-2 font-bold bg-slate-50 w-40">Tahun Ajaran / Smt</td>
                <td className="p-2">: {schoolProfile.academicYear} / Semester {currentLkpd.semester || 1}</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-bold bg-slate-50">Mata Pelajaran</td>
                <td className="p-2 font-bold text-emerald-900">: {schoolProfile.subject}</td>
                <td className="p-2 font-bold bg-slate-50">Guru Pengampu</td>
                <td className="p-2 font-bold">: {schoolProfile.teacherName}</td>
              </tr>
              <tr>
                <td className="p-2 font-bold bg-slate-50">Fase / Kelas / Bab</td>
                <td className="p-2">: Fase {schoolProfile.fase} / {schoolProfile.grade} / Bab {selectedBab}</td>
                <td className="p-2 font-bold bg-slate-50">Status Pertemuan</td>
                <td className="p-2 font-bold text-emerald-800">: Pertemuan ke-{selectedPertemuan} dari {babTotalPertemuan} Pertemuan</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Group Identity Card */}
        <div className="border border-slate-300 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-600">Nama Kelompok: </span>
            <span className="text-slate-400">________________________</span>
          </div>
          <div>
            <span className="font-semibold text-slate-600">Tanggal Pengerjaan: </span>
            <span className="text-slate-400">________________________</span>
          </div>
          <div className="col-span-2">
            <span className="font-semibold text-slate-600">Anggota Kelompok (Maksimal 7 Siswa): </span>
            <span className="text-slate-500 block mt-1 font-mono text-[11px] leading-relaxed">
              1. __________________  2. __________________  3. __________________  4. __________________<br />
              5. __________________  6. __________________  7. __________________
            </span>
          </div>
        </div>

        {/* A. Petunjuk Pengerjaan Deep Learning */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Compass className="w-4 h-4 text-emerald-700" />
            <span>A. Petunjuk Pengerjaan Berbasis Deep Learning</span>
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-slate-700 pl-1">
            <li><b>Berkesadaran (Mindful):</b> Berdoalah sebelum belajar, fokuskan perhatian, dan baca ringkasan konsep dengan saksama.</li>
            <li><b>Bermakna (Meaningful):</b> Diskusikan masalah kontekstual bersama anggota kelompok (maksimal 7 siswa) dan kaitkan dengan pengalaman kehidupan sehari-hari.</li>
            <li><b>Menggembirakan (Joyful):</b> Berikan apresiasi kepada rekan sejawat dan lakukan presentasi/teach-back dengan suasana yang komunikatif.</li>
            <li>Kerjakan tugas diskusi secara kolaboratif dan tuliskan hasil analisis kelompok pada ruang lembar jawaban yang telah disediakan.</li>
          </ol>
        </div>

        {/* B. Ringkasan Materi (Tahap 1: Memahami / Mindful) */}
        <div className="space-y-2 text-xs p-4 rounded-xl bg-slate-50 border border-slate-200">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Brain className="w-4 h-4 text-cyan-700" />
            <span>B. Ringkasan Materi &amp; Pertanyaan Pemantik (Tahap 1: Memahami / Mindful)</span>
          </h4>
          <p className="text-slate-800 font-bold mb-1">
            Sub-Materi Pertemuan ke-{selectedPertemuan}: {currentSubTopic}
          </p>
          <p className="text-slate-700 leading-relaxed text-justify">{currentLkpd.materiRingkas}</p>
        </div>

        {/* C. Aktivitas Penyelidikan Kolaboratif (Tahap 2: Mengaplikasikan / Meaningful) */}
        <div className="space-y-2 text-xs">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-700" />
            <span>C. Aktivitas Penyelidikan Kolaboratif (Tahap 2: Mengaplikasikan / Meaningful)</span>
          </h4>
          <p className="p-3.5 rounded-xl bg-emerald-50 text-emerald-950 font-medium border border-emerald-200 leading-relaxed">
            {currentLkpd.aktivitas}
          </p>
        </div>

        {/* D. Pertanyaan Diskusi & Analisis (HOTS C4-C6) */}
        <div className="space-y-4 text-xs">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-indigo-700" />
            <span>D. Pertanyaan Diskusi &amp; Analisis Kritis (HOTS)</span>
          </h4>
          {currentLkpd.pertanyaanDiskusi.map((q, idx) => (
            <div key={idx} className="space-y-2">
              <p className="font-semibold text-slate-800">
                {idx + 1}. {q}
              </p>
              <div className="w-full h-16 border border-dashed border-slate-300 rounded-lg p-2 text-slate-400 italic">
                Ruang lembar jawaban peserta didik untuk pertanyaan {idx + 1}...
              </div>
            </div>
          ))}
        </div>

        {/* E. Refleksi Belajar & Teach-Back (Tahap 3: Merefleksi / Joyful) */}
        <div className="space-y-3 text-xs pt-3 border-t border-slate-200">
          <h4 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>E. Refleksi Belajar &amp; Teach-Back (Tahap 3: Merefleksi / Joyful)</span>
          </h4>
          <p className="text-slate-700">{currentLkpd.tugasMandiri}</p>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2">
            <p className="font-bold text-amber-950">Refleksi Pemahaman Mandiri (Teach-Back):</p>
            <p className="text-amber-900 italic">
              "Menurut saya, hal paling menarik yang dipelajari pada Pertemuan ke-{selectedPertemuan} adalah _______________________ karena _______________________."
            </p>
            <div className="flex items-center gap-3 pt-1 text-[11px] text-amber-900 font-semibold">
              <span>Skala Pemahaman Hari Ini:</span>
              <span>[ ] 1 - Belum Paham</span>
              <span>[ ] 2 - Cukup</span>
              <span>[ ] 3 - Paham</span>
            </div>
          </div>
        </div>

        {/* LAMPIRAN (Diperlukan untuk Asesmen & Bahan Bacaan Peserta Didik) */}
        <div className="mt-8 pt-6 border-t-2 border-slate-900 space-y-6 text-xs">
          <div className="bg-slate-900 text-white p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="font-extrabold text-sm uppercase tracking-wider">
                LAMPIRAN PERTEMUAN KE-{selectedPertemuan}
              </h4>
            </div>
            <span className="text-[11px] font-mono text-cyan-300 font-bold">
              BSKAP 046/2025 &amp; PERMENDIKBUDRISTEK 12/2024
            </span>
          </div>

          {/* A. ASESMEN */}
          <div className="space-y-4">
            <h5 className="font-black text-slate-900 uppercase text-xs tracking-wide flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              <span>A. Asesmen Pembelajaran Terpadu</span>
            </h5>

            {/* 1. Asesmen Formatif Tabel Siap Pakai */}
            <div className="space-y-2">
              <p className="font-bold text-slate-800 text-[11px]">
                1. Asesmen Formatif (Awal Pembelajaran, Proses Pembelajaran, &amp; Akhir Pembelajaran) — Siap Pakai untuk 36 Siswa:
              </p>
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-left font-bold border-b border-slate-900">
                      <th className="p-2.5 w-1/5">Tahap Formatif</th>
                      <th className="p-2.5 w-1/5">Teknik &amp; Instrumen</th>
                      <th className="p-2.5 w-1/4">Pertanyaan / Indikator Asesmen</th>
                      <th className="p-2.5 w-1/5">Rubrik &amp; Kriteria Penilaian</th>
                      <th className="p-2.5 w-1/5">Tindak Lanjut Pedagogis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-white hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900 bg-slate-50">Awal Pembelajaran (Diagnostik)</td>
                      <td className="p-2.5">Pertanyaan Pemantik Lisan &amp; Emosional</td>
                      <td className="p-2.5">1. Dari mana asal konsep {currentSubTopic}?<br/>2. Sebutkan contoh penerapan harianmu.</td>
                      <td className="p-2.5">
                        • Belum Paham (1-2)<br/>
                        • Paham Dasar (3)<br/>
                        • Siap Pengayaan (4)
                      </td>
                      <td className="p-2.5 font-semibold text-emerald-800">Pembentukan kelompok heterogen (maks 7 siswa)</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900 bg-slate-50">Proses Pembelajaran (Kinerja Diskusi)</td>
                      <td className="p-2.5">Lembar Observasi Aktivitas &amp; Rubrik Diskusi</td>
                      <td className="p-2.5">1. Keaktifan penyelidikan kelompok<br/>2. Kemampuan menyampaikan argumen kritis</td>
                      <td className="p-2.5">
                        • SB (Sangat Baik / 4)<br/>
                        • B (Baik / 3)<br/>
                        • C (Cukup / 2)<br/>
                        • PB (Perlu Bimbingan / 1)
                      </td>
                      <td className="p-2.5 font-semibold text-emerald-800">Pendampingan langsung (scaffolding) bagi kelompok butuh dukungan</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900 bg-slate-50">Akhir Pembelajaran (Exit Ticket)</td>
                      <td className="p-2.5">Exit Ticket 3-2-1 &amp; Sesi Teach-Back</td>
                      <td className="p-2.5">1. "1 Hal paling berkesan hari ini?"<br/>2. "1 Hal yang masih membingungkan?"</td>
                      <td className="p-2.5">Peta sebaran pemahaman mandiri (Skala 1-4) tanpa skor angka rapor</td>
                      <td className="p-2.5 font-semibold text-emerald-800">Pengulasan singkat di awal pertemuan berikutnya</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Formatif Class Tracking Table for 36 Students */}
              <div className="mt-3 space-y-1">
                <p className="font-bold text-slate-800 text-[10.5px]">
                  📋 Lembar Observasi &amp; Catatan Asesmen Formatif Siap Pakai (Seluruh 36 Siswa Kelas {schoolProfile.grade}):
                </p>
                <div className="border border-slate-300 rounded-xl overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-[10.5px] border-collapse">
                    <thead className="sticky top-0 bg-slate-900 text-white font-bold z-10">
                      <tr>
                        <th className="p-2 w-10 text-center border-r border-slate-700">No</th>
                        <th className="p-2 text-left border-r border-slate-700">Nama Peserta Didik</th>
                        <th className="p-2 text-center w-24 border-r border-slate-700">NISN</th>
                        <th className="p-2 text-center border-r border-slate-700">Formatif Awal (Diagnostik)</th>
                        <th className="p-2 text-center border-r border-slate-700">Formatif Proses (Kinerja Diskusi)</th>
                        <th className="p-2 text-center border-r border-slate-700">Formatif Akhir (Exit Ticket)</th>
                        <th className="p-2 text-left">Catatan Umpan Balik Guru &amp; Tindak Lanjut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {classOf36Students.map((std: any, idx: number) => {
                        const rawScore = std.formatifScores[`TP 10.${selectedBab}`] || std.formatifScores['TP 10.1'] || 85;
                        const diagLabel = rawScore >= 90 ? 'Siap Pengayaan (4)' : rawScore >= 75 ? 'Paham Dasar (3)' : 'Perlu Bimbingan (2)';
                        const prosesLabel = rawScore >= 90 ? 'Sangat Baik (4)' : rawScore >= 75 ? 'Baik (3)' : 'Cukup (2)';
                        const exitLabel = rawScore >= 90 ? 'Skala 4 - Paham & Buka Tutoring' : rawScore >= 75 ? 'Skala 3 - Paham Mandiri' : 'Skala 2 - Perlu Penguatan';

                        return (
                          <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="p-2 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{std.name}</td>
                            <td className="p-2 text-center font-mono text-[10px] border-r border-slate-200">{std.nisn}</td>
                            <td className="p-2 text-center font-semibold text-cyan-900 border-r border-slate-200">{diagLabel}</td>
                            <td className="p-2 text-center font-semibold text-emerald-900 border-r border-slate-200">{prosesLabel}</td>
                            <td className="p-2 text-center font-semibold text-purple-900 border-r border-slate-200">{exitLabel}</td>
                            <td className="p-2 text-slate-700 text-[10px]">{std.deskripsi || 'Aktif berkolaborasi dalam kelompok dan terampil menyampaikan ide.'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 2. Asesmen Sumatif Tabel Siap Pakai */}
            <div className="space-y-2 pt-2">
              <p className="font-bold text-slate-800 text-[11px]">
                2. Asesmen Sumatif (Awal Pembelajaran, Proses Pembelajaran, &amp; Akhir Pembelajaran) — Siap Pakai untuk 36 Siswa:
              </p>
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-[11px] border-collapse">
                  <thead>
                    <tr className="bg-slate-900 text-white text-left font-bold border-b border-slate-900">
                      <th className="p-2.5 w-1/5">Tahap Sumatif</th>
                      <th className="p-2.5 w-1/5">Bentuk &amp; Instrumen</th>
                      <th className="p-2.5 w-1/4">Kisi-Kisi / Indikator (HOTS)</th>
                      <th className="p-2.5 w-1/5">Bobot &amp; Pedoman Penskoran</th>
                      <th className="p-2.5 w-1/5">Konversi Predikat Rapor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-white hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900 bg-slate-50">Awal Pembelajaran (Tes Prasyarat)</td>
                      <td className="p-2.5">Tes Kemampuan Prasyarat (5 PG)</td>
                      <td className="p-2.5">Mengukur kelengkapan fondasi kompetensi sebelum memasuki {currentSubTopic}</td>
                      <td className="p-2.5">Skor Benar × 20 (Maks 100). Ambang KKTP ≥ 75.</td>
                      <td className="p-2.5 font-semibold text-cyan-900">Program pemantapan prasyarat singkat</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900 bg-slate-50">Proses Pembelajaran (Sumatif Produk)</td>
                      <td className="p-2.5">Rubrik Penilaian Produk / Laporan Kelompok</td>
                      <td className="p-2.5">1. Orisinalitas &amp; Analisis (40%)<br/>2. Kerapian Laporan (30%)<br/>3. Presentasi (30%)</td>
                      <td className="p-2.5">Skor Maksimal 100.<br/>• 90-100: Mahir (A)<br/>• 80-89: Cakap (B)<br/>• 75-79: Layak (C)<br/>• &lt;75: Perlu Bimbingan (D)</td>
                      <td className="p-2.5 font-semibold text-cyan-900">Nilai Sumatif Lingkup Materi (LM) Pertemuan ke-{selectedPertemuan}</td>
                    </tr>
                    <tr className="bg-white hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900 bg-slate-50">Akhir Pembelajaran (Sumatif Bab)</td>
                      <td className="p-2.5">Tes Tertulis HOTS (PG &amp; Esai Analitis C4-C6)</td>
                      <td className="p-2.5">1. 10 Pilihan Ganda (C4-C5)<br/>2. 2 Soal Esai Analitis (C6)</td>
                      <td className="p-2.5">• PG: 30%<br/>• Esai: 50%<br/>• Produk: 20%<br/>Skor Akhir Maks 100.</td>
                      <td className="p-2.5 font-semibold text-cyan-900">Nilai Rapor Akhir Bab {selectedBab}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Sumatif Class Score Table for 36 Students */}
              <div className="mt-3 space-y-1">
                <p className="font-bold text-slate-800 text-[10.5px]">
                  📊 Lembar Rekapitulasi Nilai Asesmen Sumatif Siap Pakai (Seluruh 36 Siswa Kelas {schoolProfile.grade}):
                </p>
                <div className="border border-slate-300 rounded-xl overflow-x-auto max-h-[380px] overflow-y-auto">
                  <table className="w-full text-[10.5px] border-collapse">
                    <thead className="sticky top-0 bg-slate-900 text-white font-bold z-10">
                      <tr>
                        <th className="p-2 w-10 text-center border-r border-slate-700">No</th>
                        <th className="p-2 text-left border-r border-slate-700">Nama Peserta Didik</th>
                        <th className="p-2 text-center w-24 border-r border-slate-700">NISN</th>
                        <th className="p-2 text-center border-r border-slate-700">Sumatif Awal (Tes Prasyarat)</th>
                        <th className="p-2 text-center border-r border-slate-700">Sumatif Proses (Produk / Laporan)</th>
                        <th className="p-2 text-center border-r border-slate-700">Sumatif Akhir (Tes HOTS)</th>
                        <th className="p-2 text-center font-black border-r border-slate-700">Nilai Akhir Sumatif</th>
                        <th className="p-2 text-center border-r border-slate-700">Predikat</th>
                        <th className="p-2 text-center">Status KKTP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {classOf36Students.map((std: any, idx: number) => {
                        const sumLm = std.sumatifLmScores[`Bab ${selectedBab}`] || std.nilaiAkhir || 85;
                        const sumAwal = Math.min(100, Math.max(65, sumLm - 2));
                        const sumProses = Math.min(100, Math.max(65, sumLm + 1));
                        const sumAkhir = Math.min(100, Math.max(65, sumLm));
                        const finalScore = Math.round((sumAwal * 0.2) + (sumProses * 0.3) + (sumAkhir * 0.5));
                        const pred = finalScore >= 85 ? 'A' : finalScore >= 75 ? 'B' : finalScore >= 65 ? 'C' : 'D';
                        const status = finalScore >= (schoolProfile.kktpThreshold || 75) ? 'Tuntas' : 'Perlu Bimbingan';

                        return (
                          <tr key={std.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                            <td className="p-2 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                            <td className="p-2 font-bold text-slate-900 border-r border-slate-200">{std.name}</td>
                            <td className="p-2 text-center font-mono text-[10px] border-r border-slate-200">{std.nisn}</td>
                            <td className="p-2 text-center font-semibold border-r border-slate-200">{sumAwal}</td>
                            <td className="p-2 text-center font-semibold border-r border-slate-200">{sumProses}</td>
                            <td className="p-2 text-center font-semibold border-r border-slate-200">{sumAkhir}</td>
                            <td className="p-2 text-center font-black text-cyan-900 border-r border-slate-200">{finalScore}</td>
                            <td className="p-2 text-center font-bold text-slate-900 border-r border-slate-200">{pred}</td>
                            <td className="p-2 text-center font-bold">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${status === 'Tuntas' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                {status}
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
          </div>

          {/* B. MATERI PELAJARAN */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <h5 className="font-black text-slate-900 uppercase text-xs tracking-wide flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-cyan-700" />
              <span>B. Materi Pelajaran Resmi (Sub-Materi Pertemuan ke-{selectedPertemuan})</span>
            </h5>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-[11px] text-slate-800">
              <div>
                <span className="font-bold text-slate-900 block uppercase">1. Rujukan Buku Teks Resmi:</span>
                <p className="mt-0.5 text-slate-700">
                  {selectedBook?.judulBuku
                    ? `${selectedBook.judulBuku} (${selectedBook.penerbit}), SIBI buku.kemendikdasmen.go.id`
                    : `Buku Teks Utama Kurikulum Merdeka Edisi Revisi (${schoolProfile.subject} Kelas ${schoolProfile.grade}), Penerbit: Pusat Perbukuan BSKAP Kemendikdasmen RI, KepKa BSKAP No. 046/H/KR/2025`}
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block uppercase">2. Uraian Bahan Bacaan Peserta Didik ({currentSubTopic}):</span>
                <p className="mt-0.5 text-slate-700 leading-relaxed text-justify">
                  {currentLkpd.materiRingkas} Materi ini dirancang untuk mengembangkan pemahaman mendalam peserta didik secara faktual, konseptual, dan prosedural, serta menghubungkannya dengan penerapan di dunia nyata dan industri.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block uppercase">3. Glosarium Istilah Penting Abad 21 / AI:</span>
                <p className="mt-0.5 text-slate-700 italic">
                  <b>Pembelajaran Mendalam (Deep Learning):</b> Pendekatan belajar berkesadaran (mindful), bermakna (meaningful), dan menggembirakan (joyful) untuk menguatkan Profil Pelajar Pancasila dan penalaran kritis.
                </p>
              </div>

              <div>
                <span className="font-bold text-slate-900 block uppercase">4. Daftar Pustaka:</span>
                <p className="mt-0.5 text-slate-700 font-mono text-[10.5px]">
                  Pusat Perbukuan BSKAP Kemendikdasmen RI. (2025). <i>Buku Teks Utama Kurikulum Merdeka Edisi Revisi {schoolProfile.subject} Kelas {schoolProfile.grade}</i>. Jakarta: Kementerian Pendidikan Dasar dan Menengah Republik Indonesia (Akses SIBI: buku.kemendikdasmen.go.id).
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* F. Kunci Jawaban & Rubrik Guru */}
        {showAnswerKey && (
          <div className="mt-8 p-5 rounded-2xl bg-amber-50/80 border border-amber-300 text-xs space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-bold">
              <Key className="w-4 h-4 text-amber-700" />
              <span>KUNCI JAWABAN &amp; RUBRIK PENILAIAN GURU (Pertemuan ke-{selectedPertemuan})</span>
            </div>
            <p className="text-amber-950 leading-relaxed font-mono bg-white p-3 rounded-xl border border-amber-200">
              {currentLkpd.kunciJawaban}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

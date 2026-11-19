import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  BookOpenCheck,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Download,
  Sparkles,
  X,
  Save,
  BookOpen,
  Library,
  Target,
  ListOrdered,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  FileSpreadsheet,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { TujuanPembelajaran, CpElement } from '../types';
import { exportCpAtpToWord, exportCpAtpToExcel, triggerPrint } from '../utils/exporter';
import {
  calculateRpeTotals,
  getSubjectRasionalAndCpElements,
  validateCpElementsAgainstBskap2025,
} from '../utils/curriculumLogic';
import { PipelineSyncHeader } from '../components/PipelineSyncHeader';
import { IdentitasPerangkat } from '../components/IdentitasPerangkat';

export const AnalisisCpAtpView: React.FC = () => {
  const {
    schoolProfile,
    cpElements: contextCpElements,
    tujuanPembelajaran,
    rpe,
    selectedBook,
    updateCpElements,
    updateTujuanPembelajaran,
    addTujuanPembelajaran,
    deleteTujuanPembelajaran,
    setActiveView,
    openPrintModal,
    showNotification,
  } = useApp();

  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState<1 | 2 | 'all'>('all');
  const [selectedElementFilter, setSelectedElementFilter] = useState<string>('all');
  const [editingTp, setEditingTp] = useState<TujuanPembelajaran | null>(null);
  const [editingCpElement, setEditingCpElement] = useState<CpElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Calculate target RPE net JP for Semester 1 & 2
  const s1Rpe = calculateRpeTotals(rpe.semester1.months, rpe.semester1.jpPerWeek, rpe.semester1.cadanganJp);
  const s2Rpe = calculateRpeTotals(rpe.semester2.months, rpe.semester2.jpPerWeek, rpe.semester2.cadanganJp);
  const rpeS1NetJp = s1Rpe.netJp || 28;
  const rpeS2NetJp = s2Rpe.netJp || 26;

  // Obtain Subject Rationale & Official BSKAP 046/H/KR/2025 CP Elements
  const { rasional: defaultRasional, cpElements: subjectCpElements } = getSubjectRasionalAndCpElements(
    schoolProfile.subject,
    schoolProfile.grade,
    schoolProfile.fase,
    selectedBook
  );

  // Active elements reflect contextCpElements if set for the current subject, or fallback to official subjectCpElements
  const displayCpElements: CpElement[] =
    contextCpElements && contextCpElements.length > 0
      ? contextCpElements
      : subjectCpElements;

  // Validate active CP elements against official KepKa BSKAP 046/2025
  const cpValidation = validateCpElementsAgainstBskap2025(displayCpElements, subjectCpElements);

  const handlePullOfficialBskapData = () => {
    updateCpElements(subjectCpElements);
    showNotification(
      'success',
      `Pembaruan Berhasil: Data resmi terbaru KepKa BSKAP No. 046/H/KR/2025 (${subjectCpElements.length} Elemen CP ${schoolProfile.subject}) telah ditarik dan diterapkan!`
    );
  };

  const handleRunManualValidation = () => {
    const result = validateCpElementsAgainstBskap2025(displayCpElements, subjectCpElements);
    if (result.updateAvailable) {
      showNotification(
        'info',
        `Pembaruan Tersedia: Ditemukan ${result.discrepancies.length} perbedaan deskripsi elemen CP terhadap KepKa BSKAP 046/2025. Klik "Tarik Data Resmi Terbaru" untuk menyelaraskan.`
      );
    } else {
      showNotification(
        'success',
        `Validasi Konten Berhasil: Seluruh ${result.totalOfficial} Elemen CP telah 100% sesuai dengan KepKa BSKAP No. 046/H/KR/2025!`
      );
    }
  };

  const handleSimulateDiscrepancy = () => {
    if (!displayCpElements || displayCpElements.length === 0) return;
    const simulated = displayCpElements.map((el, idx) =>
      idx === 0
        ? {
            ...el,
            deskripsi: `${el.deskripsi.slice(0, 85)}... [Draft Lama Pra-Revisi BSKAP]`,
          }
        : el
    );
    updateCpElements(simulated);
    showNotification(
      'info',
      'Pembaruan Tersedia: Terdeteksi perbedaan deskripsi elemen CP dengan KepKa BSKAP 046/2025!'
    );
  };

  const handleSaveCpElement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCpElement) return;
    const nextList = displayCpElements.map((el) =>
      el.id === editingCpElement.id ? editingCpElement : el
    );
    updateCpElements(nextList);
    setEditingCpElement(null);
    const check = validateCpElementsAgainstBskap2025(nextList, subjectCpElements);
    if (check.updateAvailable) {
      showNotification(
        'info',
        'Pembaruan Tersedia: Deskripsi elemen CP yang disimpan berbeda dari rumusan resmi KepKa BSKAP 046/2025.'
      );
    } else {
      showNotification('success', 'Deskripsi elemen CP berhasil diperbarui sesuai KepKa BSKAP 046/2025.');
    }
  };

  // New TP Template State
  const [newTp, setNewTp] = useState<Partial<TujuanPembelajaran>>({
    code: `10.${tujuanPembelajaran.length + 1}`,
    element: displayCpElements[0]?.name || 'Pemahaman Konsep',
    description: '',
    indikatorKinerja: '',
    materiPokok: '',
    subMateri: '',
    bloomLevel: 'C4',
    hotsCategory: 'HOTS',
    jpAllocation: 18,
    semester: 1,
    babId: `bab-${tujuanPembelajaran.length + 1}`,
    profilPelajarPancasila: ['Bernalar Kritis', 'Mandiri'],
    rencanaAsesmen: 'Formatif: Latihan studi kasus LKPD; Sumatif: Tes tertulis pemahaman materi',
    kataKunci: [],
  });

  const handleDownloadWord = async () => {
    await exportCpAtpToWord(displayCpElements, tujuanPembelajaran, schoolProfile);
    showNotification('success', 'Dokumen Analisis CP & ATP berhasil diunduh ke Word (.docx)!');
  };

  const handleDownloadExcel = () => {
    exportCpAtpToExcel(displayCpElements, tujuanPembelajaran, schoolProfile, rpe);
    showNotification('success', 'Data Analisis CP & ATP berhasil diekspor ke Excel (.xlsx)!');
  };

  const handleSaveTp = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTp) {
      updateTujuanPembelajaran(editingTp);
      setEditingTp(null);
      showNotification('success', `Tujuan Pembelajaran ${editingTp.code} berhasil diperbarui.`);
    } else {
      const created: TujuanPembelajaran = {
        id: `tp-${Date.now()}`,
        code: newTp.code || `10.${tujuanPembelajaran.length + 1}`,
        element: newTp.element || displayCpElements[0]?.name || 'Elemen Capaian',
        description: newTp.description || '',
        indikatorKinerja: newTp.indikatorKinerja || '• Siswa mampu menganalisis materi dan menyelesaikan studi kasus kontekstual.',
        materiPokok: newTp.materiPokok || 'Materi Pokok Baru',
        subMateri: newTp.subMateri || '• Konsep esensial materi\n• Studi kasus terapan\n• Refleksi dan evaluasi',
        bloomLevel: (newTp.bloomLevel as any) || 'C4',
        hotsCategory: (newTp.hotsCategory as any) || 'HOTS',
        jpAllocation: Number(newTp.jpAllocation) || 18,
        semester: Number(newTp.semester) as 1 | 2 || 1,
        babId: newTp.babId || `bab-${tujuanPembelajaran.length + 1}`,
        profilPelajarPancasila: newTp.profilPelajarPancasila || ['Bernalar Kritis', 'Mandiri'],
        rencanaAsesmen: newTp.rencanaAsesmen || 'Formatif: LKPD Analisis; Sumatif: Ujian Tertulis',
        variasiKeterampilan: newTp.variasiKeterampilan || 'Penalaran kritis dan pemecahan masalah kontekstual.',
        kataKunci: (newTp.kataKunci as string[]) || [],
      };
      addTujuanPembelajaran(created);
      setIsModalOpen(false);
      showNotification('success', `Tujuan Pembelajaran ${created.code} baru berhasil ditambahkan.`);
    }
  };

  const filteredTp = tujuanPembelajaran.filter((tp) => {
    const matchSemester =
      selectedSemesterFilter === 'all' || tp.semester === selectedSemesterFilter;
    const matchElement =
      selectedElementFilter === 'all' ||
      tp.element.toLowerCase() === selectedElementFilter.toLowerCase() ||
      tp.element.includes(selectedElementFilter);
    return matchSemester && matchElement;
  });

  const totalJp = tujuanPembelajaran.reduce((a, b) => a + (Number(b.jpAllocation) || 0), 0);
  const s1Jp = tujuanPembelajaran
    .filter((tp) => tp.semester === 1)
    .reduce((a, b) => a + (Number(b.jpAllocation) || 0), 0);
  const s2Jp = tujuanPembelajaran
    .filter((tp) => tp.semester === 2)
    .reduce((a, b) => a + (Number(b.jpAllocation) || 0), 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Pipeline Status */}
      <PipelineSyncHeader />

      {/* 2. Official Identity Component (Synchronized with All 7 Modules) */}
      <IdentitasPerangkat
        documentTitle="Analisis Capaian Pembelajaran (CP) & Alur Tujuan Pembelajaran (ATP)"
        semesterSpecific="full"
      />

      {/* 3. Action Header Bar */}
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
              <BookOpenCheck className="w-5 h-5 text-emerald-600" />
              Analisis Capaian Pembelajaran (CP) & Alur Tujuan Pembelajaran (ATP)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Total {tujuanPembelajaran.length} TP ({totalJp} JP) · Semester 1: {s1Jp} JP · Semester 2: {s2Jp} JP
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRunManualValidation}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              cpValidation.updateAvailable
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border-amber-300'
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
            title="Verifikasi kesesuaian deskripsi elemen CP terhadap KepKa BSKAP No. 046/H/KR/2025"
          >
            {cpValidation.updateAvailable ? (
              <AlertTriangle className="w-4 h-4 text-amber-700" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            )}
            <span>
              {cpValidation.updateAvailable ? 'Pembaruan Tersedia' : 'Validasi BSKAP 046/2025'}
            </span>
          </button>

          <button
            onClick={() => setActiveView('bank_cp')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
            title="Pilih Buku Teks & Selaraskan Pipeline Bank CP"
          >
            <Library className="w-4 h-4 text-emerald-700" />
            <span>Bank CP (BSKAP 2025)</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah TP Baru</span>
          </button>

          {/* 1. Ekspor PDF / Cetak */}
          <button
            onClick={() => openPrintModal('cp_atp')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Buka Modal Cetak & Pratinjau PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Ekspor PDF / Cetak</span>
          </button>

          {/* 2. Ekspor Excel */}
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Ekspor Analisis CP & ATP ke Spreadsheet Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Ekspor Excel</span>
          </button>

          {/* 3. Ekspor PDF (Langsung) */}
          <button
            onClick={() => triggerPrint()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Simpan / Cetak Langsung Halaman ke PDF"
          >
            <Printer className="w-4 h-4 text-rose-600" />
            <span>Ekspor PDF</span>
          </button>

          {/* 4. Ekspor Word */}
          <button
            onClick={handleDownloadWord}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Unduh Dokumen Analisis CP & ATP ke Microsoft Word (.docx)"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Word</span>
          </button>
        </div>
      </div>

      {/* 3b. BSKAP 046/2025 CONTENT VALIDATION & 'PEMBARUAN TERSEDIA' BANNER */}
      {cpValidation.updateAvailable ? (
        <div
          role="alert"
          className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-4 sm:p-5 shadow-md space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 shrink-0 mt-0.5 shadow-xs">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                    Pembaruan Tersedia
                  </span>
                  <span className="text-xs font-bold text-amber-900 font-mono">
                    Validasi Konten KepKa BSKAP No. 046/H/KR/2025
                  </span>
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 mt-1">
                  Ditemukan {cpValidation.discrepancies.length} Perbedaan Deskripsi Elemen CP dengan Standar Resmi KepKa BSKAP 046/2025
                </h3>
                <p className="text-xs text-slate-700 mt-0.5">
                  Beberapa deskripsi atau struktur Elemen Capaian Pembelajaran yang sedang digunakan belum sesuai dengan rumusan terbaru sistem ({cpValidation.matchedCount} dari {cpValidation.totalOfficial} elemen sesuai). Klik tombol di samping untuk menarik data resmi terbaru dari sistem.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePullOfficialBskapData}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer shrink-0"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Tarik Data Resmi Terbaru (BSKAP 046/2025)</span>
            </button>
          </div>

          <div className="bg-white/90 rounded-xl border border-amber-300 p-3 space-y-2 text-xs">
            <p className="font-bold text-amber-950 text-[11px] uppercase tracking-wider">
              Rincian Perbedaan Deskripsi Elemen CP yang Terdeteksi:
            </p>
            <div className="space-y-2">
              {cpValidation.discrepancies.map((disc, dIdx) => (
                <div
                  key={`${disc.elementName}-${dIdx}`}
                  className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 space-y-1"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-extrabold text-slate-900">
                      Elemen: {disc.elementName}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-200 text-amber-950 font-bold text-[10px]">
                      {disc.issueType === 'description_mismatch'
                        ? 'Perbedaan Deskripsi'
                        : disc.issueType === 'missing_element'
                        ? 'Elemen Resmi Belum Ada'
                        : 'Elemen Non-Standar'}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-900 font-medium">{disc.message}</p>
                  {disc.currentDescription && (
                    <p className="text-[11px] text-rose-800 bg-rose-50 p-1.5 rounded border border-rose-200">
                      <strong>Digunakan Saat Ini:</strong> {disc.currentDescription}
                    </p>
                  )}
                  {disc.officialDescription && disc.officialDescription !== '-' && (
                    <p className="text-[11px] text-emerald-900 bg-emerald-50 p-1.5 rounded border border-emerald-200">
                      <strong>Standar Resmi BSKAP 046/2025:</strong> {disc.officialDescription}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-700 text-white shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-700 text-white font-bold text-[10px] uppercase tracking-wider">
                  Terverifikasi Resmi
                </span>
                <span className="text-xs font-extrabold text-emerald-950">
                  Validasi Konten CP Sesuai KepKa BSKAP No. 046/H/KR/2025 ({cpValidation.matchedCount}/{cpValidation.totalOfficial} Elemen Sesuai)
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Seluruh deskripsi elemen Capaian Pembelajaran ({schoolProfile.subject} — Fase {schoolProfile.fase}) telah diverifikasi sesuai dengan data resmi sistem.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSimulateDiscrepancy}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-900 border border-slate-300 hover:border-amber-300 text-[11px] font-bold transition-all cursor-pointer"
              title="Uji coba deteksi perbedaan deskripsi CP untuk menampilkan notifikasi Pembaruan Tersedia"
            >
              Uji Deteksi Perbedaan
            </button>
            <button
              type="button"
              onClick={handleRunManualValidation}
              className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cek Validasi</span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
          {/* I. BUKU PILIHAN (FILTER PENERBIT) & CP/ATP DITERAPKAN — ELEMEN CAPAIAN PEMBELAJARAN RESMI BSKAP 046/2025 */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-mono font-bold text-xs">
                  KepKa BSKAP No. 046/H/KR/2025
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-800 font-bold text-xs">
                  Permendikbudristek No. 12 Tahun 2024
                </span>
                <a
                  href="https://kurikulum.kemendikdasmen.go.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <span>kurikulum.kemendikdasmen.go.id</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold text-xs">
                  {selectedBook?.penerbit || 'Pusat Perbukuan Kemendikdasmen RI'}
                </span>
              </div>
              <button
                onClick={() => setActiveView('bank_cp')}
                className="flex items-center gap-1.5 text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
              >
                <span>I. Buku Pilihan (Filter Penerbit) & CP/ATP Diterapkan</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-700 text-white shadow-xs shrink-0 mt-0.5">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 mb-0.5">
                    I. Buku Pilihan (Filter Penerbit) & CP/ATP Diterapkan — ELEMEN CAPAIAN PEMBELAJARAN RESMI BSKAP 046/2025
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {selectedBook?.judulBuku || `Buku Teks Utama Edisi Revisi: ${schoolProfile.subject} ${schoolProfile.grade}`}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Penulis: <span className="font-semibold text-slate-700">{selectedBook?.pengarang || 'Tim Pengembang Kurikulum Merdeka'}</span> ·
                    Penerbit: <span className="font-semibold text-slate-700">{selectedBook?.penerbit || 'Kemendikdasmen RI'}</span> ·
                    Tersinkron ke: <span className="font-bold text-emerald-700">Kalender/RPE → Analisis CP/ATP → PROTA → PROMES → Modul Ajar → LKPD → Penilaian Rapor</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveView('bank_cp')}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs shrink-0 cursor-pointer shadow-2xs"
              >
                Ganti Buku Paket
              </button>
            </div>

            {/* Tabel Ringkas Elemen Capaian Pembelajaran Resmi BSKAP 046/2025 */}
            <div className="rounded-xl border border-emerald-200/80 overflow-hidden">
              <div className="bg-emerald-900 text-white px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-extrabold tracking-wide uppercase">
                  ELEMEN CAPAIAN PEMBELAJARAN RESMI BSKAP 046/2025 ({schoolProfile.subject} — Fase {schoolProfile.fase} / {schoolProfile.grade})
                </span>
                <span className="text-[11px] text-emerald-200 font-mono">
                  Sumber: https://kurikulum.kemendikdasmen.go.id/
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="bg-emerald-50 text-emerald-950 font-bold border-b border-emerald-200 text-[11px] uppercase">
                      <th className="p-2.5 w-12 text-center">No</th>
                      <th className="p-2.5 w-52">Elemen Capaian Pembelajaran</th>
                      <th className="p-2.5">Deskripsi Resmi Capaian Pembelajaran (BSKAP 046/2025)</th>
                      <th className="p-2.5 w-64">Fokus Kompetensi</th>
                      <th className="p-2.5 w-24 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 bg-white">
                    {displayCpElements.map((el, i) => {
                      const hasDiff = cpValidation.discrepancies.some(
                        (d) => d.elementName.toLowerCase() === el.name.toLowerCase()
                      );
                      return (
                        <tr
                          key={`resmi-${el.id}-${i}`}
                          className={hasDiff ? 'bg-amber-50/70 hover:bg-amber-100/60' : 'hover:bg-emerald-50/40'}
                        >
                          <td className="p-2.5 text-center font-bold text-slate-500 align-top">{i + 1}</td>
                          <td className="p-2.5 font-bold text-emerald-950 align-top">
                            <div>{el.name}</div>
                            {hasDiff ? (
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-amber-200 text-amber-950 text-[9.5px] font-extrabold">
                                Pembaruan Tersedia
                              </span>
                            ) : (
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-bold">
                                ✓ Sesuai BSKAP 2025
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-slate-700 leading-relaxed align-top">{el.deskripsi}</td>
                          <td className="p-2.5 text-slate-700 align-top">
                            <div className="flex flex-wrap gap-1">
                              {el.kompetensi.map((k, ki) => (
                                <span
                                  key={ki}
                                  className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[10px]"
                                >
                                  {k}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2.5 text-center align-top">
                            <button
                              type="button"
                              onClick={() => setEditingCpElement({ ...el })}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px] cursor-pointer"
                              title="Edit Deskripsi Elemen CP"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* I. RASIONAL & KARAKTERISTIK MATA PELAJARAN */}
            <div className="pt-2">
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase mb-2 flex items-center gap-2">
                <span className="text-emerald-700">I.</span> RASIONAL & KARAKTERISTIK MATA PELAJARAN
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed text-justify bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/80">
                {defaultRasional}
              </p>
            </div>
          </div>

          {/* II. ANALISIS PEMETAAN ELEMEN CP KE KOMPETENSI DAN LINGKUP MATERI */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                <span className="text-emerald-700">II.</span> ANALISIS PEMETAAN ELEMEN CP KE KOMPETENSI DAN LINGKUP MATERI
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Dekonstruksi kalimat Capaian Pembelajaran resmi (KepKa BSKAP No. 046/H/KR/2025 & Permendikbudristek No. 12 Tahun 2024) untuk mengidentifikasi Kata Kerja Operasional (KKO) tingkat kognitif, lingkup materi esensial, serta variasi keterampilan berpikir tingkat tinggi (HOTS).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <th className="p-3 w-12 text-center">No</th>
                    <th className="p-3 w-48">Elemen CP</th>
                    <th className="p-3">Kalimat Capaian Pembelajaran (CP)</th>
                    <th className="p-3 w-56">Kompetensi yang Dituju (KKO)</th>
                    <th className="p-3 w-56">Lingkup Materi Esensial</th>
                    <th className="p-3 w-48">Variasi Keterampilan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {displayCpElements.map((el, idx) => (
                    <tr key={el.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 text-center font-bold text-slate-500 align-top">
                        {idx + 1}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 align-top">
                        {el.name}
                      </td>
                      <td className="p-3.5 text-slate-700 leading-relaxed align-top">
                        {el.deskripsi}
                      </td>
                      <td className="p-3.5 align-top">
                        <ul className="list-disc list-inside space-y-1 text-slate-700">
                          {el.kompetensi.map((k, ki) => (
                            <li key={ki} className="leading-snug">{k}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3.5 align-top">
                        <ul className="list-disc list-inside space-y-1 text-slate-700">
                          {el.materi.map((m, mi) => (
                            <li key={mi} className="leading-snug">{m}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="p-3.5 text-slate-700 leading-snug align-top">
                        {el.variasiKeterampilan || 'Penalaran kritis, kreativitas pemecahan masalah, dan komunikasi solutif.'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* III. MATRIKS ALUR TUJUAN PEMBELAJARAN (ATP) DAN ALOKASI WAKTU */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase">
                    <span className="text-emerald-700">III.</span> MATRIKS ALUR TUJUAN PEMBELAJARAN (ATP) DAN ALOKASI WAKTU
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Alur Tujuan Pembelajaran (ATP) dirancang berurutan secara logis, memuat Indikator Ketercapaian Tujuan Pembelajaran (IKTP / KKTP), Dimensi Profil Pelajar Pancasila, Rencana Asesmen, dan Sumber Belajar.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    Menampilkan {filteredTp.length} dari {tujuanPembelajaran.length} TP
                  </span>
                </div>
              </div>

              {/* Filter controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-200/80 text-xs">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-slate-500 uppercase text-[10px] mr-1">Filter Semester:</span>
                  {(['all', 1, 2] as const).map((sem) => (
                    <button
                      key={sem}
                      onClick={() => setSelectedSemesterFilter(sem)}
                      className={`px-3 py-1 rounded-xl font-bold transition-all cursor-pointer ${
                        selectedSemesterFilter === sem
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {sem === 'all' ? 'Semua Semester (1 Tahun)' : `Semester ${sem} (${sem === 1 ? s1Jp : s2Jp} JP)`}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Filter Elemen:</span>
                  <select
                    value={selectedElementFilter}
                    onChange={(e) => setSelectedElementFilter(e.target.value)}
                    className="px-2.5 py-1 rounded-xl border border-slate-300 font-semibold bg-white text-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="all">Semua Elemen CP ({displayCpElements.length})</option>
                    {displayCpElements.map((el) => (
                      <option key={el.id} value={el.name}>
                        {el.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-200 uppercase text-[11px]">
                    <th className="p-3 w-10 text-center">No</th>
                    <th className="p-3 w-24 text-center">Kode / Sem</th>
                    <th className="p-3 w-40">Elemen CP</th>
                    <th className="p-3 min-w-[220px]">Tujuan Pembelajaran (TP)</th>
                    <th className="p-3 min-w-[220px]">Indikator Ketercapaian (IKTP)</th>
                    <th className="p-3 w-24 text-center">KKO Bloom</th>
                    <th className="p-3 min-w-[240px]">Materi Pokok & Sub-Materi</th>
                    <th className="p-3 w-14 text-center">JP</th>
                    <th className="p-3 w-32">Profil Pelajar Pancasila</th>
                    <th className="p-3 min-w-[180px]">Rencana Asesmen & Media</th>
                    <th className="p-3 w-16 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredTp.map((tp, idx) => {
                    const officialElement =
                      displayCpElements.find(
                        (el) => el.name.toLowerCase() === (tp.element || '').toLowerCase()
                      ) ||
                      displayCpElements[idx % displayCpElements.length] ||
                      displayCpElements[0];
                    const activeElementName = officialElement ? officialElement.name : tp.element;

                    return (
                      <tr key={tp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 text-center text-slate-500 font-bold align-top">
                          {idx + 1}
                        </td>

                        {/* Kode / Sem */}
                        <td className="p-3 text-center align-top space-y-1">
                          <span className="font-bold text-slate-900 block font-mono text-xs">
                            {tp.code}
                          </span>
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold text-[10px] border border-amber-200">
                            Smt {tp.semester}
                          </span>
                        </td>

                        {/* Elemen CP */}
                        <td className="p-3 font-semibold text-slate-800 align-top">
                          <span className="block text-slate-900 font-bold">{activeElementName}</span>
                          <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono text-[9px]">
                            BSKAP 046/2025
                          </span>
                        </td>

                        {/* Tujuan Pembelajaran */}
                        <td className="p-3 text-slate-900 leading-relaxed align-top font-medium">
                          {tp.description}
                        </td>

                        {/* Indikator Kinerja / IKTP */}
                        <td className="p-3 text-slate-700 leading-relaxed align-top">
                          {tp.indikatorKinerja ? (
                            <div className="space-y-1">
                              {tp.indikatorKinerja.split('\n').map((line, li) => (
                                <p key={li} className="leading-snug">{line}</p>
                              ))}
                            </div>
                          ) : (
                            <p className="leading-snug">
                              • Siswa dapat menganalisis materi dan menyelesaikan studi kasus dengan kalkulasi tepat.
                            </p>
                          )}
                        </td>

                        {/* KKO Bloom */}
                        <td className="p-3 text-center align-top space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-mono font-bold text-xs">
                            {tp.bloomLevel}
                          </span>
                          <span
                            className={`block px-1.5 py-0.5 rounded font-bold text-[10px] ${
                              tp.hotsCategory === 'HOTS'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}
                          >
                            {tp.hotsCategory}
                          </span>
                        </td>

                        {/* Materi Pokok & Sub-Materi */}
                        <td className="p-3 align-top space-y-1.5">
                          <p className="font-bold text-slate-900">{tp.materiPokok}</p>
                          
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[10px]">
                            <BookOpen className="w-3 h-3 text-emerald-600" />
                            <span>{tp.babId ? `Bab ${tp.babId.replace('bab-', '')}` : 'Bab Materi'}</span>
                          </div>

                          {tp.subMateri ? (
                            <div className="text-[11px] text-slate-600 space-y-0.5 pt-0.5">
                              {tp.subMateri.split('\n').map((subLine, si) => (
                                <p key={si} className="leading-tight">{subLine}</p>
                              ))}
                            </div>
                          ) : (
                            <ul className="text-[11px] text-slate-600 list-disc list-inside space-y-0.5 pt-0.5">
                              <li>Konsep esensial dan fenomena kontekstual</li>
                              <li>Metode analisis dan kalkulasi</li>
                            </ul>
                          )}

                          <p className="text-[10px] text-slate-400 italic pt-1 border-t border-slate-100">
                            Buku Siswa & Panduan Guru {schoolProfile.subject} ({selectedBook?.penerbit || 'Kemendikdasmen RI'})
                          </p>
                        </td>

                        {/* JP */}
                        <td className="p-3 text-center align-top">
                          <span className="font-extrabold text-slate-900 font-mono text-base block">
                            {tp.jpAllocation}
                          </span>
                        </td>

                        {/* Profil Pelajar Pancasila */}
                        <td className="p-3 align-top">
                          <div className="flex flex-wrap gap-1">
                            {(tp.profilPelajarPancasila || ['Bernalar Kritis', 'Mandiri']).map((p5, pi) => (
                              <span
                                key={pi}
                                className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200"
                              >
                                {p5}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Rencana Asesmen & Media */}
                        <td className="p-3 text-slate-700 leading-relaxed align-top text-[11px]">
                          {tp.rencanaAsesmen || 'Formatif: Latihan studi kasus anggaran; Sumatif: Tes tertulis'}
                        </td>

                        {/* Aksi */}
                        <td className="p-3 text-center align-top">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setEditingTp(tp)}
                              className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                              title="Edit TP"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                deleteTujuanPembelajaran(tp.id);
                                showNotification('info', `TP ${tp.code} telah dihapus.`);
                              }}
                              className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                              title="Hapus TP"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Bottom Summary Bar exactly matching the photo */}
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                    <td colSpan={7} className="p-3.5 text-right uppercase tracking-wider text-xs">
                      TOTAL ALOKASI JAM PELAJARAN (JP) YANG DIANALISIS :
                    </td>
                    <td className="p-3.5 text-center text-sm font-black text-slate-900 font-mono">
                      {totalJp} <span className="text-[10px] block font-sans font-bold">JP</span>
                    </td>
                    <td colSpan={3} className="p-3.5 text-slate-700 font-semibold text-xs">
                      Semester 1: <span className="font-bold text-slate-900">{s1Jp} JP</span> (Target RPE: {rpeS1NetJp} JP) | Semester 2: <span className="font-bold text-slate-900">{s2Jp} JP</span> (Target RPE: {rpeS2NetJp} JP)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* IV. PRINSIP DAN RASIONAL ALUR PENGURUTAN TUJUAN PEMBELAJARAN (ATP) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              <span className="text-emerald-700">IV.</span> PRINSIP DAN RASIONAL ALUR PENGURUTAN TUJUAN PEMBELAJARAN (ATP)
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed text-justify">
              Alur Tujuan Pembelajaran disusun secara sistematis mengacu pada Panduan Pembelajaran dan Asesmen (PPA) Kurikulum Merdeka. Pengurutan materi memadukan pendekatan Hierarkis (keterampilan prasyarat), Pengurutan dari Konkret ke Abstrak, serta Prosedural bertingkat (scaffolding). Beban jam pelajaran tiap semester telah dihitung secara presisi berdasarkan Rincian Pekan Efektif (RPE) Kalender Pendidikan 2026/2027.
            </p>
          </div>

          {/* V. PANDUAN KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP) */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              <span className="text-emerald-700">V.</span> PANDUAN KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: 0 - 65% Perlu Bimbingan */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/60 shadow-2xs space-y-1.5">
                <h4 className="text-xs font-black text-rose-700 uppercase tracking-tight">
                  0 – 65% (Perlu Bimbingan)
                </h4>
                <p className="text-xs text-slate-700 leading-snug">
                  Belum mencapai ketuntasan. Wajib mengikuti remedial seluruh materi pokok terkait.
                </p>
              </div>

              {/* Card 2: 66 - 75% Cukup */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/60 shadow-2xs space-y-1.5">
                <h4 className="text-xs font-black text-amber-700 uppercase tracking-tight">
                  66 – 75% (Cukup)
                </h4>
                <p className="text-xs text-slate-700 leading-snug">
                  Mencapai batas ketuntasan minimal. Diberikan remedial parsial pada indikator yang lemah.
                </p>
              </div>

              {/* Card 3: 76 - 85% Baik */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 shadow-2xs space-y-1.5">
                <h4 className="text-xs font-black text-emerald-700 uppercase tracking-tight">
                  76 – 85% (Baik)
                </h4>
                <p className="text-xs text-slate-700 leading-snug">
                  Tuntas dengan capaian baik. Dapat melanjutkan ke TP berikutnya secara mandiri.
                </p>
              </div>

              {/* Card 4: 86 - 100% Sangat Mahir */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 shadow-2xs space-y-1.5">
                <h4 className="text-xs font-black text-blue-700 uppercase tracking-tight">
                  86 – 100% (Sangat Mahir)
                </h4>
                <p className="text-xs text-slate-700 leading-snug">
                  Tuntas melampaui standar. Diberikan program pengayaan studi kasus lanjutan atau tutor sebaya.
                </p>
              </div>
            </div>
          </div>

          {/* VI. REKOMENDASI STRATEGI PEMBELAJARAN BERDIFERENSIASI */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-2">
            <h3 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              <span className="text-emerald-700">VI.</span> REKOMENDASI STRATEGI PEMBELAJARAN BERDIFERENSIASI
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              Lakukan pemetaan diagnostik awal. Bagi peserta didik dalam kelompok fleksibel (kemampuan dasar, menengah, mahir) dan gunakan bahan ajar multimodal (teks, video, manipulatif).
            </p>
          </div>
        </div>

      {/* MODAL EDIT TP */}
      {editingTp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                Edit Matriks Tujuan Pembelajaran ({editingTp.code})
              </h3>
              <button onClick={() => setEditingTp(null)} className="p-1 rounded text-white/70 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTp} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode TP / Sem</label>
                  <input
                    type="text"
                    value={editingTp.code}
                    onChange={(e) => setEditingTp({ ...editingTp, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={editingTp.semester}
                    onChange={(e) => setEditingTp({ ...editingTp, semester: Number(e.target.value) as 1 | 2 })}
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                  >
                    <option value={1}>Semester 1 (Ganjil)</option>
                    <option value={2}>Semester 2 (Genap)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alokasi JP</label>
                  <input
                    type="number"
                    value={editingTp.jpAllocation}
                    onChange={(e) => setEditingTp({ ...editingTp, jpAllocation: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl font-bold font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Elemen CP</label>
                <select
                  value={editingTp.element}
                  onChange={(e) => setEditingTp({ ...editingTp, element: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                >
                  {displayCpElements.map((el) => (
                    <option key={el.id} value={el.name}>
                      {el.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tujuan Pembelajaran (TP)</label>
                <textarea
                  rows={2}
                  value={editingTp.description}
                  onChange={(e) => setEditingTp({ ...editingTp, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Indikator Ketercapaian (IKTP) / Indikator Kinerja</label>
                <textarea
                  rows={2}
                  value={editingTp.indikatorKinerja || ''}
                  onChange={(e) => setEditingTp({ ...editingTp, indikatorKinerja: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="• Siswa dapat memecahkan soal studi kasus..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Materi Pokok</label>
                  <input
                    type="text"
                    value={editingTp.materiPokok}
                    onChange={(e) => setEditingTp({ ...editingTp, materiPokok: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">KKO & Taksonomi Bloom</label>
                  <select
                    value={editingTp.bloomLevel}
                    onChange={(e) => setEditingTp({ ...editingTp, bloomLevel: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                  >
                    <option value="C1">C1 - Mengingat (LOTS)</option>
                    <option value="C2">C2 - Memahami (LOTS)</option>
                    <option value="C3">C3 - Mengaplikasikan (MOTS)</option>
                    <option value="C4">C4 - Menganalisis (HOTS)</option>
                    <option value="C5">C5 - Mengevaluasi (HOTS)</option>
                    <option value="C6">C6 - Mencipta (HOTS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sub-Materi Pokok (Pisahkan dengan baris baru)</label>
                <textarea
                  rows={2}
                  value={editingTp.subMateri || ''}
                  onChange={(e) => setEditingTp({ ...editingTp, subMateri: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="• Sub-bab 1&#10;• Sub-bab 2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rencana Asesmen & Media Pembelajaran</label>
                <input
                  type="text"
                  value={editingTp.rencanaAsesmen || ''}
                  onChange={(e) => setEditingTp({ ...editingTp, rencanaAsesmen: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Formatif: Latihan studi kasus anggaran; Sumatif: Tes tertulis perhitungan ekonomi"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTp(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH TP BARU */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-300" />
                Tambah Tujuan Pembelajaran (TP) Baru
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 rounded text-white/70 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveTp} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kode TP / Sem</label>
                  <input
                    type="text"
                    value={newTp.code}
                    onChange={(e) => setNewTp({ ...newTp, code: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold font-mono"
                    placeholder="Contoh: 10.3"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester</label>
                  <select
                    value={newTp.semester}
                    onChange={(e) => setNewTp({ ...newTp, semester: Number(e.target.value) as 1 | 2 })}
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                  >
                    <option value={1}>Semester 1 (Ganjil)</option>
                    <option value={2}>Semester 2 (Genap)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alokasi JP</label>
                  <input
                    type="number"
                    value={newTp.jpAllocation}
                    onChange={(e) => setNewTp({ ...newTp, jpAllocation: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border rounded-xl font-bold font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Elemen CP</label>
                <select
                  value={newTp.element}
                  onChange={(e) => setNewTp({ ...newTp, element: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                >
                  {displayCpElements.map((el) => (
                    <option key={el.id} value={el.name}>
                      {el.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tujuan Pembelajaran (TP)</label>
                <textarea
                  rows={2}
                  value={newTp.description}
                  onChange={(e) => setNewTp({ ...newTp, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Peserta didik mampu menghitung biaya peluang..."
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Indikator Ketercapaian (IKTP) / Indikator Kinerja</label>
                <textarea
                  rows={2}
                  value={newTp.indikatorKinerja || ''}
                  onChange={(e) => setNewTp({ ...newTp, indikatorKinerja: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="• Siswa dapat memecahkan soal studi kasus..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Materi Pokok</label>
                  <input
                    type="text"
                    value={newTp.materiPokok}
                    onChange={(e) => setNewTp({ ...newTp, materiPokok: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl font-bold"
                    placeholder="Contoh: Mekanisme Pasar dan Elastisitas"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">KKO & Taksonomi Bloom</label>
                  <select
                    value={newTp.bloomLevel}
                    onChange={(e) => setNewTp({ ...newTp, bloomLevel: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl font-bold bg-white"
                  >
                    <option value="C1">C1 - Mengingat (LOTS)</option>
                    <option value="C2">C2 - Memahami (LOTS)</option>
                    <option value="C3">C3 - Mengaplikasikan (MOTS)</option>
                    <option value="C4">C4 - Menganalisis (HOTS)</option>
                    <option value="C5">C5 - Mengevaluasi (HOTS)</option>
                    <option value="C6">C6 - Mencipta (HOTS)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sub-Materi Pokok (Pisahkan dengan baris baru)</label>
                <textarea
                  rows={2}
                  value={newTp.subMateri || ''}
                  onChange={(e) => setNewTp({ ...newTp, subMateri: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="• Sub-bab 1&#10;• Sub-bab 2"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Rencana Asesmen & Media Pembelajaran</label>
                <input
                  type="text"
                  value={newTp.rencanaAsesmen || ''}
                  onChange={(e) => setNewTp({ ...newTp, rencanaAsesmen: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Formatif: Latihan studi kasus anggaran; Sumatif: Tes tertulis perhitungan ekonomi"
                />
              </div>

              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan TP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL EDIT ELEMEN CP */}
      {editingCpElement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                Edit Deskripsi Elemen CP ({editingCpElement.name})
              </h3>
              <button
                onClick={() => setEditingCpElement(null)}
                className="p-1 rounded text-white/70 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveCpElement} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Elemen CP</label>
                <input
                  type="text"
                  value={editingCpElement.name}
                  onChange={(e) =>
                    setEditingCpElement({ ...editingCpElement, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Deskripsi Capaian Pembelajaran
                </label>
                <textarea
                  rows={4}
                  value={editingCpElement.deskripsi}
                  onChange={(e) =>
                    setEditingCpElement({ ...editingCpElement, deskripsi: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-xl leading-relaxed"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Catatan: Apabila deskripsi diubah sehingga berbeda dari rumusan resmi KepKa BSKAP No. 046/H/KR/2025, sistem validasi akan menampilkan notifikasi <strong>Pembaruan Tersedia</strong>.
                </p>
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCpElement(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Deskripsi CP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


import React from 'react';
import { useApp } from '../context/AppContext';
import { Printer, X, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { KopSurat } from './KopSurat';
import {
  triggerPrint,
  exportCoverAndPengesahanToWord,
  exportCpAtpToWord,
  exportProtaToWord,
  exportPromesToWord,
  exportRpeToWord,
  exportKaldikToWord,
  exportBloomToWord,
  exportModulAjarToWord,
  exportLkpdToWord,
  exportAsesmenToWord,
  exportMasterBundelToWord,
  exportPreviewDomToUniversalWord,
  exportCpAtpToExcel,
  exportProtaToExcel,
  exportPromesToExcel,
  exportRpeToExcel,
  exportKaldikToExcel,
  exportBloomToExcel,
  exportModulAjarToExcel,
  exportLkpdToExcel,
  exportGradesToExcel,
  exportAnalisisPerangkatToExcel,
  exportMasterBundelToExcel,
} from '../utils/exporter';
import {
  calculateRpeTotals,
  calculateBloomStats,
  getSyncedSubChaptersForBab,
  getCompleteBookSourceString,
  ensureOfficialKemendikdasmenModul,
  getSubjectRasionalAndCpElements,
  buildUnifiedRpeExportPayload,
  formatKaldikCategoryExportLabel,
  getIndonesianMonthYearLabel,
  formatDateRangeLabelId,
} from '../utils/curriculumLogic';
import { getTenAssessmentInstruments } from '../utils/assessmentInstruments';

export const PrintModal: React.FC = () => {
  const {
    isPrintModalOpen,
    printDocKey,
    openPrintModal,
    closePrintModal,
    schoolProfile,
    cpElements,
    rpe,
    prota,
    promes,
    modulAjarList,
    lkpdList,
    students,
    kaldikEvents,
    tujuanPembelajaran,
    selectedBook,
    showNotification,
  } = useApp();

  const [selectedSemester, setSelectedSemester] = React.useState<1 | 2 | 'both'>(
    schoolProfile.semester === 2 ? 2 : 1
  );

  const [selectedPrintBab, setSelectedPrintBab] = React.useState<number | 'all'>('all');
  const [selectedPrintPertemuan, setSelectedPrintPertemuan] = React.useState<number | 'all'>('all');
  const [selectedPrintInstruments, setSelectedPrintInstruments] = React.useState<string[]>([
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

  React.useEffect(() => {
    if (schoolProfile.semester) {
      setSelectedSemester(schoolProfile.semester === 2 ? 2 : 1);
    }
  }, [schoolProfile.semester]);

  const isLandscapeDoc = ['promes', 'rpe', 'kaldik', 'asesmen', 'prota', 'cp_atp'].includes(printDocKey || '');

  React.useEffect(() => {
    if (!isPrintModalOpen) return;
    const style = document.createElement('style');
    style.id = 'print-orientation-style';
    style.innerHTML = isLandscapeDoc
      ? '@media print { @page { size: A4 landscape; margin: 1cm; } body { -webkit-print-color-adjust: exact; } }'
      : '@media print { @page { size: A4 portrait; margin: 1cm; } body { -webkit-print-color-adjust: exact; } }';
    document.head.appendChild(style);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closePrintModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      const existing = document.getElementById('print-orientation-style');
      if (existing) existing.remove();
    };
  }, [isPrintModalOpen, isLandscapeDoc, closePrintModal]);

  if (!isPrintModalOpen) return null;

  const currentModul = modulAjarList[0];
  const currentLkpd = lkpdList[0];
  const totalJp = tujuanPembelajaran.reduce((a, b) => a + b.jpAllocation, 0);
  const totalProtaJp = prota.reduce((a, b) => a + (Number(b.alokasiJp) || 0), 0);
  const bloomStats = calculateBloomStats(tujuanPembelajaran);
  const unifiedRpeSnapshot = buildUnifiedRpeExportPayload({
    rpe,
    academicYear: schoolProfile.academicYear,
    kaldikEvents,
    prota,
    promes,
  });
  const s1RpeTotals = calculateRpeTotals(
    rpe.semester1.months,
    rpe.semester1.jpPerWeek,
    rpe.semester1.cadanganJp
  );
  const s2RpeTotals = calculateRpeTotals(
    rpe.semester2.months,
    rpe.semester2.jpPerWeek,
    rpe.semester2.cadanganJp
  );

  const semester1Months = [
    { label: 'Juli', weeks: ['Jul-1', 'Jul-2', 'Jul-3', 'Jul-4'] },
    { label: 'Agustus', weeks: ['Agu-1', 'Agu-2', 'Agu-3', 'Agu-4', 'Agu-5'] },
    { label: 'September', weeks: ['Sep-1', 'Sep-2', 'Sep-3', 'Sep-4'] },
    { label: 'Oktober', weeks: ['Okt-1', 'Okt-2', 'Okt-3', 'Okt-4', 'Okt-5'] },
    { label: 'November', weeks: ['Nov-1', 'Nov-2', 'Nov-3', 'Nov-4'] },
    { label: 'Desember', weeks: ['Des-1', 'Des-2', 'Des-3', 'Des-4', 'Des-5'] },
  ];

  const semester2Months = [
    { label: 'Januari', weeks: ['Jan-1', 'Jan-2', 'Jan-3', 'Jan-4'] },
    { label: 'Februari', weeks: ['Feb-1', 'Feb-2', 'Feb-3', 'Feb-4'] },
    { label: 'Maret', weeks: ['Mar-1', 'Mar-2', 'Mar-3', 'Mar-4', 'Mar-5'] },
    { label: 'April', weeks: ['Apr-1', 'Apr-2', 'Apr-3', 'Apr-4'] },
    { label: 'Mei', weeks: ['Mei-1', 'Mei-2', 'Mei-3', 'Mei-4', 'Mei-5'] },
    { label: 'Juni', weeks: ['Jun-1', 'Jun-2', 'Jun-3', 'Jun-4'] },
  ];

  const cleanSubject = schoolProfile.subject.replace(/\s+/g, '_');
  const cleanYear = schoolProfile.academicYear.replace('/', '-');

  const renderOfficialIdentitasTable = (customSemester?: string) => {
    const nuptk = schoolProfile.teacherNuptk || schoolProfile.teacherNip || '9443766667200012';
    const sem =
      customSemester ||
      `${schoolProfile.academicYear} / Semester ${
        selectedSemester === 'both'
          ? '1 & 2 (1 Tahun Penuh)'
          : selectedSemester === 2
          ? '2 (Genap)'
          : '1 (Ganjil)'
      }`;
    return (
      <div className="border border-slate-900 rounded-lg overflow-hidden my-3 text-[11px] font-sans">
        <div className="bg-slate-100 px-3 py-1 font-bold uppercase tracking-wider text-slate-800 border-b border-slate-900 text-[10px] flex justify-between">
          <span>IDENTITAS PERANGKAT PEMBELAJARAN</span>
          <span className="font-mono text-[9px]">KURIKULUM MERDEKA BSKAP 2025</span>
        </div>
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="p-1.5 font-bold bg-slate-50 w-44">Satuan Pendidikan</td>
              <td className="p-1.5 font-bold">: {schoolProfile.schoolName}</td>
              <td className="p-1.5 font-bold bg-slate-50 w-40">Tahun Ajaran / Semester</td>
              <td className="p-1.5">: {sem}</td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="p-1.5 font-bold bg-slate-50">Mata Pelajaran</td>
              <td className="p-1.5 font-bold text-emerald-900">: {schoolProfile.subject}</td>
              <td className="p-1.5 font-bold bg-slate-50">Guru Penyusun</td>
              <td className="p-1.5 font-bold">: {schoolProfile.teacherName}</td>
            </tr>
            <tr>
              <td className="p-1.5 font-bold bg-slate-50">Fase / Kelas</td>
              <td className="p-1.5">: Fase {schoolProfile.fase} / {schoolProfile.grade}</td>
              <td className="p-1.5 font-bold bg-slate-50">NUPTK Guru</td>
              <td className="p-1.5 font-mono font-bold">: {nuptk}</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const handleDownloadWordDocxFromPreview = async () => {
    try {
      switch (printDocKey) {
        case 'cover':
          await exportCoverAndPengesahanToWord(
            schoolProfile,
            { nomorDokumen: '421.5/082/SMK-M1/2026' },
            `COVER_PENGESAHAN_DAFTAR_ISI_${cleanSubject}_${cleanYear}.docx`
          );
          break;
        case 'cp_atp':
          await exportCpAtpToWord(
            cpElements,
            tujuanPembelajaran,
            schoolProfile,
            `ANALISIS_CP_ATP_${cleanSubject}_FASE_${schoolProfile.fase}.docx`
          );
          break;
        case 'prota':
          await exportProtaToWord(prota, schoolProfile, `PROTA_${cleanSubject}_${cleanYear}.docx`);
          break;
        case 'promes':
          await exportPromesToWord(
            promes,
            schoolProfile,
            selectedSemester,
            `PROMES_SEMESTER_${selectedSemester === 'both' ? '1_DAN_2' : selectedSemester}_${cleanSubject}_${cleanYear}.docx`
          );
          break;
        case 'rpe':
          await exportRpeToWord(
            rpe,
            schoolProfile,
            `RPE_${cleanSubject}_${cleanYear}.docx`,
            { kaldikEvents, prota, promes }
          );
          break;
        case 'kaldik':
          await exportKaldikToWord(kaldikEvents, schoolProfile, `KALDIK_${cleanSubject}_${cleanYear}.docx`);
          break;
        case 'bloom':
          await exportBloomToWord(
            tujuanPembelajaran,
            schoolProfile,
            `ANALISIS_BLOOM_HOTS_${cleanSubject}_${cleanYear}.docx`
          );
          break;
        case 'modul_ajar':
          {
            const filterList = selectedPrintBab === 'all'
              ? modulAjarList
              : modulAjarList.filter((m) => m.babNumber === selectedPrintBab);
            const ptmLabel = selectedPrintPertemuan !== 'all' ? `_PERTEMUAN_${selectedPrintPertemuan}` : '';
            const babLabel = selectedPrintBab !== 'all' ? `_BAB_${selectedPrintBab}` : '';
            await exportModulAjarToWord(
              filterList,
              schoolProfile,
              `MODUL_AJAR_DEEP_LEARNING_${cleanSubject}${babLabel}${ptmLabel}_${cleanYear}.docx`,
              selectedPrintPertemuan,
              selectedPrintInstruments
            );
          }
          break;
        case 'lkpd':
          await exportLkpdToWord(lkpdList, schoolProfile, `LKPD_LENGKAP_${cleanSubject}_${cleanYear}.docx`);
          break;
        case 'asesmen':
          await exportAsesmenToWord(
            students,
            schoolProfile,
            `REKAP_NILAI_ASESMEN_RAPOR_${cleanSubject}_${cleanYear}.docx`
          );
          break;
        case 'bundel':
        default:
          await exportMasterBundelToWord(
            {
              profile: schoolProfile,
              cpElements,
              tujuanPembelajaran,
              rpe,
              prota,
              promes,
              modulAjarList,
              lkpdList,
              students,
              kaldikEvents,
            },
            `BUNDEL_MASTER_LENGKAP_1TAHUN_${cleanSubject}_${cleanYear}.docx`
          );
          break;
      }
      showNotification(
        'success',
        'Dokumen Word (.docx) berhasil diunduh dengan struktur tabel persis seperti pratinjau layar!'
      );
    } catch (err: any) {
      showNotification(
        'error',
        `Gagal mengunduh dokumen Word (.docx): ${err?.message || 'Terjadi kesalahan.'}`
      );
    }
  };

  const handleDownloadUniversalDoc = () => {
    try {
      const docTitle = (printDocKey || 'DOKUMEN').toUpperCase();
      exportPreviewDomToUniversalWord(
        'printable-preview-canvas',
        `${docTitle}_${cleanSubject}_${cleanYear}.doc`
      );
      showNotification(
        'success',
        'Dokumen Word Universal (.doc) berhasil diunduh (Suport Semua Versi MS Word 2003–365 & WPS)!'
      );
    } catch (err: any) {
      showNotification(
        'error',
        `Gagal mengunduh Word (.doc): ${err?.message || 'Terjadi kesalahan.'}`
      );
    }
  };

  const handleDownloadExcelFromPreview = () => {
    try {
      switch (printDocKey) {
        case 'cp_atp':
          exportCpAtpToExcel(cpElements, tujuanPembelajaran, schoolProfile, rpe);
          break;
        case 'prota':
          exportProtaToExcel(prota, schoolProfile);
          break;
        case 'promes':
          exportPromesToExcel(promes, schoolProfile, selectedSemester);
          break;
        case 'rpe':
          exportRpeToExcel(rpe, schoolProfile, { kaldikEvents, prota, promes });
          break;
        case 'kaldik':
          exportKaldikToExcel(kaldikEvents, schoolProfile);
          break;
        case 'bloom':
          exportBloomToExcel(tujuanPembelajaran, schoolProfile);
          break;
        case 'modul_ajar':
          {
            const filterList = selectedPrintBab === 'all'
              ? modulAjarList
              : modulAjarList.filter((m) => m.babNumber === selectedPrintBab);
            exportModulAjarToExcel(
              filterList,
              schoolProfile,
              selectedPrintPertemuan,
              selectedPrintInstruments
            );
          }
          break;
        case 'lkpd':
          exportLkpdToExcel(lkpdList, schoolProfile);
          break;
        case 'asesmen':
          exportGradesToExcel(students, schoolProfile);
          break;
        case 'analisis_perangkat':
          exportAnalisisPerangkatToExcel(
            schoolProfile,
            prota,
            promes,
            modulAjarList,
            lkpdList,
            students,
            rpe
          );
          break;
        case 'cover':
        case 'bundel':
        default:
          exportMasterBundelToExcel({
            profile: schoolProfile,
            cpElements,
            tujuanPembelajaran,
            rpe,
            prota,
            promes,
            modulAjarList,
            lkpdList,
            students,
            kaldikEvents,
          });
          break;
      }
      showNotification(
        'success',
        'Data berhasil diekspor ke Spreadsheet Excel (.xlsx) lengkap dengan identitas tersinkronisasi!'
      );
    } catch (err: any) {
      showNotification(
        'error',
        `Gagal mengekspor Spreadsheet Excel: ${err?.message || 'Terjadi kesalahan.'}`
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Container */}
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
        {/* Modal Toolbar (hidden during print) */}
        <div className="bg-slate-900 text-white no-print shrink-0 border-b border-slate-800">
          <div className="p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-bold">
                Pratinjau Cetak Resmi A4 · Ekspor PDF, Excel (.xlsx) & Word (.docx)
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* 1. Ekspor Excel (.xlsx) */}
              <button
                onClick={handleDownloadExcelFromPreview}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                title="Ekspor Data ke Excel (.xlsx) Tersinkronisasi"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor Excel (.xlsx)</span>
              </button>

              {/* 2. Unduh Word (.docx) */}
              <button
                onClick={handleDownloadWordDocxFromPreview}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                title="Unduh Dokumen Word (.docx) Tabel Utuh (Word 2007/2010/2013/2016/2019/2021/365)"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Word (.docx)</span>
              </button>

              {/* 3. Unduh Word (.doc) */}
              <button
                onClick={handleDownloadUniversalDoc}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                title="Unduh Dokumen Word Universal (.doc) Kompatibel Semua Jenis Office Word"
              >
                <FileText className="w-4 h-4" />
                <span>Unduh Word (.doc)</span>
              </button>

              {/* 4. Ekspor PDF / Cetak */}
              <button
                onClick={triggerPrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow transition-all cursor-pointer"
                title="Cetak Dokumen atau Ekspor ke PDF Resmi"
              >
                <Printer className="w-4 h-4" />
                <span>Ekspor PDF / Cetak</span>
              </button>

              <button
                onClick={closePrintModal}
                aria-label="Tutup Pratinjau Cetak"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Document Switcher Menu Bar (All Menus Active on Click) */}
          <div className="px-3.5 sm:px-5 py-2 bg-slate-800/90 border-t border-slate-700/80 flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
            <span className="text-slate-300 mr-1">Menu Dokumen:</span>
            {[
              { key: 'cover', label: 'Cover & Pengesahan' },
              { key: 'kaldik', label: 'Kalender Pendidikan' },
              { key: 'rpe', label: 'Analisis RPE' },
              { key: 'cp_atp', label: 'Analisis CP & ATP' },
              { key: 'prota', label: 'PROTA' },
              { key: 'promes', label: 'PROMES' },
              { key: 'modul_ajar', label: 'Modul Ajar Deep Learning' },
              { key: 'lkpd', label: 'LKPD' },
              { key: 'bloom', label: 'Taksonomi Bloom' },
              { key: 'asesmen', label: 'Penilaian Rapor' },
              { key: 'bundel', label: 'Bundel Lengkap 1 Tahun' },
            ].map((docItem) => {
              const isActiveDoc = printDocKey === docItem.key;
              return (
                <button
                  key={docItem.key}
                  type="button"
                  onClick={() => openPrintModal(docItem.key as any)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    isActiveDoc
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-700/70 hover:bg-slate-600 text-slate-200'
                  }`}
                >
                  {docItem.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div
          id="printable-preview-canvas"
          className="flex-1 overflow-y-auto p-6 sm:p-12 bg-white text-slate-900 font-serif leading-relaxed text-xs"
        >
          {/* Official Kop Surat with Left & Right Logos (Kop Yayasan vs Kop Dinas) */}
          <KopSurat
            schoolProfile={schoolProfile}
            leftLogoUrl={schoolProfile.leftLogoUrl || schoolProfile.logoUrl}
            rightLogoUrl={schoolProfile.rightLogoUrl}
            isEditable={false}
          />

          {/* 1. COVER, PENGESAHAN & DAFTAR ISI */}
          {printDocKey === 'cover' && (
            <div className="space-y-12">
              {/* PAGE 1: SAMPUL RESMI KURIKULUM MERDEKA (A4) */}
              <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl border-4 border-double border-slate-900 min-h-[760px] flex flex-col justify-between text-center relative overflow-hidden">
                {schoolProfile.coverBackgroundUrl && (
                  <>
                    <img
                      src={schoolProfile.coverBackgroundUrl}
                      alt="Latar Belakang Sampul"
                      className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
                    />
                    <div
                      className="absolute inset-0 pointer-events-none z-0"
                      style={{
                        backgroundColor: `rgba(255, 255, 255, ${Math.min(
                          0.9,
                          Math.max(0, (schoolProfile.coverOverlayOpacity ?? 20) / 100)
                        )})`,
                      }}
                    />
                  </>
                )}

                <div className="relative z-10 flex-1 flex flex-col justify-between p-8 sm:p-10">
                  <div className="bg-white/92 px-4 py-3 rounded-xl border border-slate-200 space-y-1">
                    <p className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">
                      KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH
                    </p>
                    <p className="text-xs font-black tracking-wider text-emerald-800 uppercase">
                      KURIKULUM MERDEKA & PEMBELAJARAN MENDALAM
                    </p>
                    <div className="w-20 h-0.5 bg-slate-900 mx-auto my-2" />
                    <h1 className="text-xl font-black text-slate-950 tracking-tight uppercase leading-snug">
                      PERANGKAT ADMINISTRASI PEMBELAJARAN GURU
                    </h1>
                    <p className="text-sm font-extrabold text-slate-800 tracking-wide">
                      TAHUN AJARAN {schoolProfile.academicYear}
                    </p>
                    <p className="text-xs font-bold text-emerald-800 tracking-wider">
                      {schoolProfile.semester === 1 ? 'Semester 1' : 'Semester 2'}
                    </p>
                  </div>

                  {/* School Emblem / Logo Container */}
                  <div className="my-5 flex flex-col items-center justify-center">
                    {schoolProfile.logoUrl ? (
                      <img
                        src={schoolProfile.logoUrl}
                        alt="Logo Sekolah"
                        width={136}
                        height={136}
                        className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-2xl p-1.5 border-2 border-emerald-600/40 bg-white/95"
                      />
                    ) : (
                      <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-white/95 border-2 border-dashed border-emerald-600/50 flex flex-col items-center justify-center">
                        <span className="text-5xl mb-0.5">🏫</span>
                        <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tighter">
                          SMK MA'ARIF 1
                        </span>
                      </div>
                    )}
                    <span className="text-[11px] font-bold font-mono text-slate-700 bg-white/90 px-2.5 py-0.5 rounded-full border border-slate-200 mt-2">
                      NPSN: {schoolProfile.npsn} {schoolProfile.akreditasi ? `• Terakreditasi: ${schoolProfile.akreditasi}` : ''}
                    </span>
                  </div>

                  {/* Subject & Class Details Table */}
                  <table className="w-full max-w-md mx-auto border-collapse border border-slate-900 bg-white/95 text-xs text-left font-sans">
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-2 font-semibold bg-slate-50 w-40">Mata Pelajaran</td>
                        <td className="border border-slate-900 p-2 font-black text-slate-950">: {schoolProfile.subject}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-semibold bg-slate-50">Fase / Kelas</td>
                        <td className="border border-slate-900 p-2 font-bold text-slate-900">: Fase {schoolProfile.fase} / {schoolProfile.grade}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-semibold bg-slate-50">Beban Alokasi</td>
                        <td className="border border-slate-900 p-2 font-bold text-slate-900">: 132 JP (39 Pekan Efektif)</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-semibold bg-slate-50">Pendekatan Ajar</td>
                        <td className="border border-slate-900 p-2 font-bold text-emerald-800">: Deep Learning (3 Pilar)</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Teacher Info */}
                  <div className="my-4 bg-white/92 py-3 px-5 rounded-xl border border-slate-300 max-w-xs mx-auto w-full space-y-1">
                    <p className="text-xs text-slate-500 italic">Disusun Oleh:</p>
                    <p className="text-base font-black text-slate-950 underline decoration-slate-900 decoration-2 underline-offset-4 tracking-tight">
                      {schoolProfile.teacherName}
                    </p>
                    <p className="text-xs font-mono font-bold text-slate-700">
                      {schoolProfile.teacherIdType || 'NIP'}. {schoolProfile.teacherNip}
                    </p>
                  </div>

                  {/* Bottom School Identity */}
                  <div className="pt-4 pb-2 px-4 bg-white/92 rounded-xl border-t-2 border-slate-900 text-xs">
                    <p className="font-black text-sm text-slate-950 uppercase tracking-wide">
                      {schoolProfile.schoolName}
                    </p>
                    {schoolProfile.programKeahlian && (
                      <p className="text-slate-700 font-semibold my-1 text-[11px] whitespace-pre-line">
                        Program Keahlian: {Array.isArray(schoolProfile.programKeahlian) ? schoolProfile.programKeahlian.join(', ') : schoolProfile.programKeahlian}
                      </p>
                    )}
                    <p className="text-slate-600 mt-0.5 text-[11px]">
                      {schoolProfile.address} {schoolProfile.phone ? `• Telp: ${schoolProfile.phone}` : ''}
                    </p>
                  </div>
                </div>
              </div>

              {/* PAGE 2: LEMBAR PENGESAHAN */}
              <div className="page-break break-before-page pt-8 border-t-2 border-dashed border-slate-400">
                <div className="text-center space-y-1 pb-3 border-b-2 border-slate-800 mb-4 font-sans">
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                    LEMBAR PENGESAHAN DOKUMEN PERANGKAT PEMBELAJARAN
                  </h3>
                  <p className="text-xs sm:text-sm font-extrabold text-emerald-800 uppercase tracking-wide">
                    KURIKULUM MERDEKA TAHUN AJARAN {schoolProfile.academicYear}
                  </p>
                  <p className="text-xs font-mono text-slate-700 font-bold pt-0.5">
                    Nomor: 421.5/082/SMK-M1/2026
                  </p>
                </div>

                <div className="space-y-4 text-xs leading-relaxed text-slate-800 mb-6 text-justify font-sans">
                  <p className="indent-8 text-slate-700">
                    Setelah melalui proses telaah, verifikasi, dan validasi kurikulum oleh Tim Pengembang Kurikulum Satuan
                    Pendidikan, Dokumen Perangkat Pembelajaran Kurikulum Merdeka yang memuat Capaian Pembelajaran (CP),
                    Alur Tujuan Pembelajaran (ATP), Rincian Pekan Efektif (RPE), Program Tahunan (PROTA), Program Semester
                    (PROMES), Modul Ajar Terpadu, Lembar Kerja Peserta Didik (LKPD), serta Instrumen Penilaian & Kriteria
                    Ketercapaian Tujuan Pembelajaran (KKTP) untuk:
                  </p>

                  <table className="w-full border-collapse border border-slate-900 font-sans text-xs my-3">
                    <tbody>
                      <tr>
                        <td className="border border-slate-900 p-2 font-bold bg-slate-50 w-48">Satuan Pendidikan</td>
                        <td className="border border-slate-900 p-2 font-black text-slate-950 uppercase">: {schoolProfile.schoolName}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-bold bg-slate-50">Mata Pelajaran</td>
                        <td className="border border-slate-900 p-2 font-extrabold text-slate-900">: {schoolProfile.subject}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-bold bg-slate-50">Fase / Kelas</td>
                        <td className="border border-slate-900 p-2 font-medium text-slate-800">: Fase {schoolProfile.fase} / Kelas {schoolProfile.grade}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-bold bg-slate-50">Tahun Ajaran / Semester</td>
                        <td className="border border-slate-900 p-2 font-medium text-slate-800">: {schoolProfile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-bold bg-slate-50">Guru Penyusun</td>
                        <td className="border border-slate-900 p-2 font-extrabold text-slate-950">: {schoolProfile.teacherName}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-900 p-2 font-bold bg-slate-50">{schoolProfile.teacherIdType || 'NIP'} Guru</td>
                        <td className="border border-slate-900 p-2 font-mono font-semibold text-slate-800">: {schoolProfile.teacherNip}</td>
                      </tr>
                    </tbody>
                  </table>

                  <p className="indent-8 text-slate-700">
                    Disahkan dan ditetapkan untuk diberlakukan sebagai pedoman dan acuan operasional resmi pelaksanaan
                    Kegiatan Belajar Mengajar (KBM) serta pelaksanaan evaluasi asesmen pada{' '}
                    <span className="font-extrabold text-slate-950 uppercase">{schoolProfile.schoolName}</span> untuk Tahun
                    Ajaran {schoolProfile.academicYear}.
                  </p>
                </div>

                {/* Signatures */}
                <div className="space-y-6 pt-2 font-sans">
                  <p className="text-right text-xs text-slate-700 font-medium">
                    {schoolProfile.signaturePlaceDate}
                  </p>

                  <div className="grid grid-cols-2 gap-8 text-center text-xs">
                    <div className="flex flex-col justify-between min-h-36">
                      <div>
                        <p className="text-slate-600">Mengetahui,</p>
                        <p className="font-bold text-slate-900">Kepala Sekolah</p>
                      </div>
                      <div className="my-1.5 flex items-center justify-center h-20">
                        {schoolProfile.headmasterSignatureUrl && (
                          <img
                            src={schoolProfile.headmasterSignatureUrl}
                            alt="Tanda Tangan Kepala Sekolah"
                            width={150}
                            height={75}
                            className="max-h-20 max-w-[180px] object-contain mx-auto"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-950 underline decoration-slate-900">
                          {schoolProfile.headmasterName}
                        </p>
                        <p className="text-[11px] font-mono text-slate-700">
                          {schoolProfile.headmasterIdType || 'NIP'}. {schoolProfile.headmasterNip}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between min-h-36">
                      <div>
                        <p className="text-slate-600">Disusun Oleh,</p>
                        <p className="font-bold text-slate-900">Guru Mata Pelajaran</p>
                      </div>
                      <div className="my-1.5 flex items-center justify-center h-20">
                        {schoolProfile.teacherSignatureUrl && (
                          <img
                            src={schoolProfile.teacherSignatureUrl}
                            alt="Tanda Tangan Guru"
                            width={150}
                            height={75}
                            className="max-h-20 max-w-[180px] object-contain mx-auto"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-950 underline decoration-slate-900">
                          {schoolProfile.teacherName}
                        </p>
                        <p className="text-[11px] font-mono text-slate-700">
                          {schoolProfile.teacherIdType || 'NIP'}. {schoolProfile.teacherNip}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* PAGE 3: DAFTAR ISI BUNDEL PERANGKAT PEMBELAJARAN */}
              <div className="page-break break-before-page pt-8 border-t-2 border-dashed border-slate-400">
                <div className="text-center space-y-1 pb-3 mb-4 font-sans">
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-950 tracking-tight">
                    DAFTAR ISI BUNDEL PERANGKAT PEMBELAJARAN
                  </h3>
                  <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                    KURIKULUM MERDEKA & PEMBELAJARAN MENDALAM • TAHUN AJARAN {schoolProfile.academicYear}
                  </p>
                  <p className="text-[11px] text-slate-600 font-semibold">
                    Mata Pelajaran: {schoolProfile.subject} | Fase/Kelas: Fase {schoolProfile.fase} / {schoolProfile.grade} | Guru: {schoolProfile.teacherName}
                  </p>
                </div>

                <table className="w-full border-collapse border border-slate-900 font-sans text-xs mb-6">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-[11px] uppercase">
                      <th className="border border-slate-900 p-2 text-center w-12">Bag.</th>
                      <th className="border border-slate-900 p-2 text-left">Nama Dokumen Perangkat Pembelajaran</th>
                      <th className="border border-slate-900 p-2 text-left w-40">Keterangan / Alokasi</th>
                      <th className="border border-slate-900 p-2 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[11px]">
                    {[
                      { romawi: 'I', title: 'Sampul Resmi (Cover) & Lembar Pengesahan', desc: 'Identitas & Legalitas KS' },
                      { romawi: 'II', title: `Kalender Pendidikan (Kaldik) Tahun Ajaran ${schoolProfile.academicYear}`, desc: `${kaldikEvents.length} Agenda · Semester 1 & 2` },
                      { romawi: 'III', title: 'Rincian Pekan Efektif (RPE) & Distribusi Jam', desc: `${unifiedRpeSnapshot.annualSummary.effectiveWeeks} Pekan · ${unifiedRpeSnapshot.annualSummary.effectiveMeetings} Pertemuan / ${unifiedRpeSnapshot.annualSummary.grossJp} JP` },
                      { romawi: 'IV', title: 'Analisis Capaian Pembelajaran (CP) & Alur Tujuan (ATP)', desc: `${tujuanPembelajaran.length} Tujuan Pembelajaran` },
                      { romawi: 'V', title: 'Analisis Taksonomi Bloom & Pemetaan HOTS (C1–C6)', desc: `${bloomStats.hotsPercentage}% Kategori HOTS` },
                      { romawi: 'VI', title: 'Program Tahunan (PROTA) & Alokasi Waktu TP', desc: `Alokasi ${totalProtaJp} JP (${unifiedRpeSnapshot.tpSummary.totalMeetings} Pertemuan)` },
                      { romawi: 'VII', title: 'Program Semester (PROMES) Ganjil & Genap', desc: `${promes.length} Unit Matriks Sebaran Mingguan` },
                      { romawi: 'VIII', title: 'Modul Ajar Terpadu & Deep Learning (Mindful, Meaningful, Joyful)', desc: `${modulAjarList.length} Unit Modul Berdiferensiasi` },
                      { romawi: 'IX', title: 'Lembar Kerja Peserta Didik (LKPD) Setiap Pertemuan', desc: `${lkpdList.length} Bab + Kunci Jawaban` },
                      { romawi: 'X', title: 'Instrumen Asesmen, Rubrik KKTP, & Rekap Nilai Rapor', desc: `${students.length} Siswa · Formatif, Sumatif & Rapor` },
                    ].map((row) => (
                      <tr key={row.romawi}>
                        <td className="border border-slate-900 p-2 text-center font-bold font-mono">{row.romawi}</td>
                        <td className="border border-slate-900 p-2 font-semibold">{row.title}</td>
                        <td className="border border-slate-900 p-2">{row.desc}</td>
                        <td className="border border-slate-900 p-2 text-center font-bold text-emerald-800">Lengkap ✓</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. PROGRAM TAHUNAN (PROTA) */}
          {printDocKey === 'prota' && (
            <div className="space-y-4 font-sans">
              <div className="text-center">
                <h2 className="text-base font-bold uppercase">PROGRAM TAHUNAN (PROTA)</h2>
                <p className="text-xs text-slate-600">
                  Mata Pelajaran: {schoolProfile.subject} · Fase {schoolProfile.fase} ({schoolProfile.grade}) · TA {schoolProfile.academicYear}
                </p>
              </div>
              {renderOfficialIdentitasTable(`${schoolProfile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)`)}
              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-900 p-2 text-center w-8">No</th>
                    <th className="border border-slate-900 p-2 text-center w-12">Smt</th>
                    <th className="border border-slate-900 p-2">Bab / Lingkup Materi</th>
                    <th className="border border-slate-900 p-2 text-center w-16">Kode TP</th>
                    <th className="border border-slate-900 p-2">Tujuan Pembelajaran</th>
                    <th className="border border-slate-900 p-2 text-center w-16">Pertemuan</th>
                    <th className="border border-slate-900 p-2 text-center w-14">JP</th>
                    <th className="border border-slate-900 p-2 w-28">Perkiraan Bulan</th>
                    <th className="border border-slate-900 p-2 w-24">Keterangan</th>
                  </tr>
                </thead>
                <tbody>
                  {prota.map((p, idx) => {
                    const meetings =
                      p.jmlPertemuan !== undefined
                        ? p.jmlPertemuan
                        : Math.max(0, Math.round((Number(p.alokasiJp) || 0) / 2));
                    return (
                      <tr key={p.id}>
                        <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-900 p-2 text-center">Smt {p.semester}</td>
                        <td className="border border-slate-900 p-2 font-bold">{p.babTitle}</td>
                        <td className="border border-slate-900 p-2 text-center font-mono font-bold text-emerald-900">{p.tpCode}</td>
                        <td className="border border-slate-900 p-2">{p.tpDescription}</td>
                        <td className="border border-slate-900 p-2 text-center font-bold">{meetings}</td>
                        <td className="border border-slate-900 p-2 text-center font-bold">{p.alokasiJp} JP</td>
                        <td className="border border-slate-900 p-2">{p.perkiraanBulan || `Semester ${p.semester}`}</td>
                        <td className="border border-slate-900 p-2 italic">{p.keterangan}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold bg-emerald-50">
                    <td colSpan={5} className="border border-slate-900 p-2 text-right">
                      TOTAL ALOKASI WAKTU 1 TAHUN AJARAN:
                    </td>
                    <td className="border border-slate-900 p-2 text-center">
                      {unifiedRpeSnapshot.tpSummary.totalMeetings}
                    </td>
                    <td className="border border-slate-900 p-2 text-center">
                      {totalProtaJp} JP
                    </td>
                    <td colSpan={2} className="border border-slate-900 p-2 text-emerald-900">
                      ✓ Selaras RPE ({unifiedRpeSnapshot.annualSummary.grossJp} JP)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 3. PROGRAM SEMESTER (PROMES) */}
          {printDocKey === 'promes' && (
            <div className="space-y-6 font-sans text-xs">
              {/* Semester Filter Toolbar Bar (Hidden on Print Output) */}
              <div className="mb-2 p-2.5 bg-slate-100 rounded-xl border border-slate-300 no-print flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-600" />
                  <span className="text-xs font-bold text-slate-800">
                    Opsi Cetak / Unduh Matriks PROMES:
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSelectedSemester(1)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      selectedSemester === 1
                        ? 'bg-cyan-800 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    Cetak Semester 1 Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSemester(2)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      selectedSemester === 2
                        ? 'bg-cyan-800 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    Cetak Semester 2 Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSemester('both')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      selectedSemester === 'both'
                        ? 'bg-cyan-800 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                    }`}
                  >
                    Cetak Smt 1 & 2 Lengkap
                  </button>
                </div>
              </div>

              <div className="text-center space-y-1">
                <h2 className="text-base font-bold uppercase tracking-tight">
                  PROGRAM SEMESTER (PROMES){' '}
                  {selectedSemester === 1
                    ? 'SEMESTER 1 (GANJIL)'
                    : selectedSemester === 2
                    ? 'SEMESTER 2 (GENAP)'
                    : 'SEMESTER 1 & 2 (LENGKAP)'}
                </h2>
                <p className="text-xs text-slate-700 font-semibold">
                  Satuan Pendidikan: {schoolProfile.schoolName} (NPSN: {schoolProfile.npsn})
                </p>
                <p className="text-xs text-slate-600">
                  Mata Pelajaran: {schoolProfile.subject} · Fase {schoolProfile.fase} ({schoolProfile.grade}) · Tahun Ajaran: {schoolProfile.academicYear} · Guru: {schoolProfile.teacherName} (NUPTK: {schoolProfile.teacherNip})
                </p>
              </div>

              {renderOfficialIdentitasTable()}

              {/* Semester 1 Matrix */}
              {(selectedSemester === 1 || selectedSemester === 'both') && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase text-slate-900 bg-slate-100 p-1.5 border border-slate-300">
                    I. MATRIKS DISTRIBUSI MINGGUAN SEMESTER 1 (GANJIL: JULI – DESEMBER)
                  </h3>
                  <table className="w-full border-collapse border border-slate-900 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-slate-900 p-1.5 w-8">No</th>
                        <th className="border border-slate-900 p-1.5 text-left">Bab / Lingkup Materi</th>
                        <th className="border border-slate-900 p-1.5 text-left">Materi Pembelajaran</th>
                        <th className="border border-slate-900 p-1.5 w-12">Kode</th>
                        <th className="border border-slate-900 p-1.5 w-10">JP</th>
                        {semester1Months.map((m) => (
                          <th key={m.label} className="border border-slate-900 p-1.5">
                            {m.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {promes
                        .filter((p) => p.semester === 1)
                        .map((item, idx) => (
                          <tr key={item.id}>
                            <td className="border border-slate-900 p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-slate-900 p-1.5">
                              <p className="font-bold">{item.babTitle}</p>
                              <p className="text-slate-600 text-[9px]">{item.tpDescription}</p>
                            </td>
                            <td className="border border-slate-900 p-1.5 font-semibold text-cyan-950">
                              <ol className="list-decimal list-inside space-y-0.5">
                                {getSyncedSubChaptersForBab(
                                  schoolProfile.subject,
                                  schoolProfile.grade,
                                  item.babNumber
                                ).map((sub, sIdx) => (
                                  <li key={sIdx} className="text-[9.5px]">
                                    <span className="font-normal text-slate-900">{sub}</span>
                                  </li>
                                ))}
                              </ol>
                              <div className="mt-1 pt-1 border-t border-slate-300 text-[8.5px] text-emerald-900 font-medium italic">
                                📚 {getCompleteBookSourceString(schoolProfile)}
                              </div>
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-mono font-bold">{item.tpCode}</td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold">{item.alokasiJp} JP</td>
                            {semester1Months.map((m) => {
                              const active = m.weeks
                                .map((w, i) => (item.distribution?.[w] ? `M${i + 1}:${item.distribution[w]}JP` : null))
                                .filter(Boolean)
                                .join(', ');
                              return (
                                <td
                                  key={m.label}
                                  className={`border border-slate-900 p-1.5 text-center ${
                                    active ? 'bg-cyan-50 font-bold text-cyan-950' : 'text-slate-400'
                                  }`}
                                >
                                  {active || '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Semester 2 Matrix */}
              {(selectedSemester === 2 || selectedSemester === 'both') && (
                <div className="space-y-2 pt-4">
                  <h3 className="text-xs font-bold uppercase text-slate-900 bg-slate-100 p-1.5 border border-slate-300">
                    {selectedSemester === 'both'
                      ? 'II. MATRIKS DISTRIBUSI MINGGUAN SEMESTER 2 (GENAP: JANUARI – JUNI)'
                      : 'I. MATRIKS DISTRIBUSI MINGGUAN SEMESTER 2 (GENAP: JANUARI – JUNI)'}
                  </h3>
                  <table className="w-full border-collapse border border-slate-900 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-center">
                        <th className="border border-slate-900 p-1.5 w-8">No</th>
                        <th className="border border-slate-900 p-1.5 text-left">Bab / Lingkup Materi</th>
                        <th className="border border-slate-900 p-1.5 text-left">Materi Pembelajaran</th>
                        <th className="border border-slate-900 p-1.5 w-12">Kode</th>
                        <th className="border border-slate-900 p-1.5 w-10">JP</th>
                        {semester2Months.map((m) => (
                          <th key={m.label} className="border border-slate-900 p-1.5">
                            {m.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {promes
                        .filter((p) => p.semester === 2)
                        .map((item, idx) => (
                          <tr key={item.id}>
                            <td className="border border-slate-900 p-1.5 text-center">{idx + 1}</td>
                            <td className="border border-slate-900 p-1.5">
                              <p className="font-bold">{item.babTitle}</p>
                              <p className="text-slate-600 text-[9px]">{item.tpDescription}</p>
                            </td>
                            <td className="border border-slate-900 p-1.5 font-semibold text-cyan-950">
                              <ol className="list-decimal list-inside space-y-0.5">
                                {getSyncedSubChaptersForBab(
                                  schoolProfile.subject,
                                  schoolProfile.grade,
                                  item.babNumber
                                ).map((sub, sIdx) => (
                                  <li key={sIdx} className="text-[9.5px]">
                                    <span className="font-normal text-slate-900">{sub}</span>
                                  </li>
                                ))}
                              </ol>
                              <div className="mt-1 pt-1 border-t border-slate-300 text-[8.5px] text-emerald-900 font-medium italic">
                                📚 {getCompleteBookSourceString(schoolProfile)}
                              </div>
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-mono font-bold">{item.tpCode}</td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold">{item.alokasiJp} JP</td>
                            {semester2Months.map((m) => {
                              const active = m.weeks
                                .map((w, i) => (item.distribution?.[w] ? `M${i + 1}:${item.distribution[w]}JP` : null))
                                .filter(Boolean)
                                .join(', ');
                              return (
                                <td
                                  key={m.label}
                                  className={`border border-slate-900 p-1.5 text-center ${
                                    active ? 'bg-cyan-50 font-bold text-cyan-950' : 'text-slate-400'
                                  }`}
                                >
                                  {active || '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 4. ASESMEN & REKAP NILAI RAPOR */}
          {printDocKey === 'asesmen' && (
            <div className="space-y-4 font-sans">
              <div className="text-center">
                <h2 className="text-base font-bold uppercase">REKAPITULASI NILAI ASESMEN & RAPOR SISWA</h2>
                <p className="text-xs text-slate-600">
                  Mata Pelajaran: {schoolProfile.subject} · Kelas: {schoolProfile.grade} · TA {schoolProfile.academicYear}
                </p>
              </div>
              {renderOfficialIdentitasTable()}
              <table className="w-full border-collapse border border-slate-900 text-[10px]">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-900 p-1.5 text-center">No</th>
                    <th className="border border-slate-900 p-1.5">NISN</th>
                    <th className="border border-slate-900 p-1.5">Nama Peserta Didik</th>
                    <th className="border border-slate-900 p-1.5 text-center">L/P</th>
                    <th className="border border-slate-900 p-1.5 text-center">TP1</th>
                    <th className="border border-slate-900 p-1.5 text-center">TP2</th>
                    <th className="border border-slate-900 p-1.5 text-center">TP3</th>
                    <th className="border border-slate-900 p-1.5 text-center">TP4</th>
                    <th className="border border-slate-900 p-1.5 text-center">TP5</th>
                    <th className="border border-slate-900 p-1.5 text-center">TP6</th>
                    <th className="border border-slate-900 p-1.5 text-center">TP7</th>
                    <th className="border border-slate-900 p-1.5 text-center">Sumatif</th>
                    <th className="border border-slate-900 p-1.5 text-center font-bold bg-emerald-50">Nilai Akhir</th>
                    <th className="border border-slate-900 p-1.5 text-center">Predikat</th>
                    <th className="border border-slate-900 p-1.5 text-center">Status KKTP</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="border border-slate-900 p-1 text-center">{idx + 1}</td>
                      <td className="border border-slate-900 p-1 font-mono">{s.nisn}</td>
                      <td className="border border-slate-900 p-1 font-semibold">{s.name}</td>
                      <td className="border border-slate-900 p-1 text-center">{s.gender}</td>
                      <td className="border border-slate-900 p-1 text-center">{s.formatifScores['TP 10.1'] || '-'}</td>
                      <td className="border border-slate-900 p-1 text-center">{s.formatifScores['TP 10.2'] || '-'}</td>
                      <td className="border border-slate-900 p-1 text-center">{s.formatifScores['TP 10.3'] || '-'}</td>
                      <td className="border border-slate-900 p-1 text-center">{s.formatifScores['TP 10.4'] || '-'}</td>
                      <td className="border border-slate-900 p-1 text-center">{s.formatifScores['TP 10.5'] || '-'}</td>
                      <td className="border border-slate-900 p-1 text-center">{s.formatifScores['TP 10.6'] || '-'}</td>
                      <td className="border border-slate-900 p-1 text-center">{s.formatifScores['TP 10.7'] || '-'}</td>
                      <td className="border border-slate-900 p-1 text-center">{s.sumatifAkhir}</td>
                      <td className="border border-slate-900 p-1 text-center font-bold bg-emerald-50/60">{s.nilaiAkhir}</td>
                      <td className="border border-slate-900 p-1 text-center font-bold">{s.predikat}</td>
                      <td className="border border-slate-900 p-1 text-center font-semibold">{s.kktpStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 5. RINCIAN PEKAN EFEKTIF (RPE) & KALENDER PENDIDIKAN TERPADU */}
          {printDocKey === 'rpe' &&
            (() => {
              const rpePayload = buildUnifiedRpeExportPayload({
                rpe,
                academicYear: schoolProfile.academicYear,
                kaldikEvents,
                prota,
                promes,
              });

              return (
                <div className="space-y-5 font-sans text-xs">
                  <div className="text-center">
                    <h2 className="text-base font-bold uppercase">
                      KALENDER PENDIDIKAN, RINCIAN PEKAN EFEKTIF (RPE) &amp; PROGRAM ALOKASI WAKTU TP
                    </h2>
                    <p className="text-xs text-slate-600">
                      Tahun Ajaran {schoolProfile.academicYear} · Mata Pelajaran: {schoolProfile.subject} · Fase{' '}
                      {schoolProfile.fase} · Jadwal Mengajar: {rpePayload.selectedDays.join(', ')}
                    </p>
                  </div>

                  {renderOfficialIdentitasTable()}

                  {/* I. ANALISIS MINGGU EFEKTIF & HARI/PERTEMUAN EFEKTIF (12 BULAN) */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase">
                      I. ANALISIS MINGGU EFEKTIF &amp; HARI/PERTEMUAN EFEKTIF (12 BULAN)
                    </h3>
                    <table className="w-full border-collapse border border-slate-900 text-[11px]">
                      <thead>
                        <tr className="bg-emerald-900 text-white font-bold">
                          <th className="border border-slate-900 p-2 text-center w-9">No</th>
                          <th className="border border-slate-900 p-2">Bulan</th>
                          <th className="border border-slate-900 p-2 text-center">Jml Minggu</th>
                          <th className="border border-slate-900 p-2 text-center">Tidak Efektif</th>
                          <th className="border border-slate-900 p-2 text-center">Minggu Efektif</th>
                          <th className="border border-slate-900 p-2 text-center">Pertemuan Efektif</th>
                          <th className="border border-slate-900 p-2 text-center">Total JP Efektif</th>
                          <th className="border border-slate-900 p-2">Keterangan Minggu Tidak Efektif / Agenda</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rpePayload.twelveMonthRows.map((row) => (
                          <tr key={row.no}>
                            <td className="border border-slate-900 p-1.5 text-center">{row.no}</td>
                            <td className="border border-slate-900 p-1.5 font-bold">{row.month}</td>
                            <td className="border border-slate-900 p-1.5 text-center">{row.totalWeeks}</td>
                            <td className="border border-slate-900 p-1.5 text-center text-rose-700 font-bold">
                              {row.nonEffectiveWeeks}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-emerald-800">
                              {row.effectiveWeeks}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-emerald-800">
                              {row.effectiveMeetings}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-blue-800">
                              {row.effectiveJp} JP
                            </td>
                            <td className="border border-slate-900 p-1.5">{row.note}</td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-50 font-bold">
                          <td colSpan={2} className="border border-slate-900 p-2 text-right">
                            JUMLAH TOTAL (12 BULAN)
                          </td>
                          <td className="border border-slate-900 p-2 text-center">
                            {rpePayload.annualSummary.totalWeeks}
                          </td>
                          <td className="border border-slate-900 p-2 text-center text-rose-700">
                            {rpePayload.annualSummary.nonEffectiveWeeks}
                          </td>
                          <td className="border border-slate-900 p-2 text-center text-emerald-900">
                            {rpePayload.annualSummary.effectiveWeeks} Mgg
                          </td>
                          <td className="border border-slate-900 p-2 text-center text-emerald-900">
                            {rpePayload.annualSummary.effectiveMeetings} Kali
                          </td>
                          <td className="border border-slate-900 p-2 text-center text-blue-900">
                            {rpePayload.annualSummary.grossJp} JP
                          </td>
                          <td className="border border-slate-900 p-2">
                            Bersih: {rpePayload.annualSummary.netJp} JP (Cadangan {rpePayload.annualSummary.cadanganJp} JP)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* II. TABEL DISTRIBUSI PEKAN EFEKTIF SEMESTER 1 */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase">
                      II. TABEL DISTRIBUSI PEKAN EFEKTIF &amp; NON-EFEKTIF SEMESTER 1 (GANJIL)
                    </h3>
                    <table className="w-full border-collapse border border-slate-900 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-slate-900 p-2 text-center w-9">No</th>
                          <th className="border border-slate-900 p-2">Nama Bulan</th>
                          <th className="border border-slate-900 p-2 text-center">Jml Pekan</th>
                          <th className="border border-slate-900 p-2 text-center">Non-Efektif</th>
                          <th className="border border-slate-900 p-2 text-center">Pekan Efektif</th>
                          <th className="border border-slate-900 p-2 text-center">Pertemuan</th>
                          <th className="border border-slate-900 p-2 text-center">JP Efektif</th>
                          <th className="border border-slate-900 p-2">Keterangan / Alasan Non-Efektif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rpePayload.s1Rows.map((row) => (
                          <tr key={row.no}>
                            <td className="border border-slate-900 p-1.5 text-center">{row.semNo}</td>
                            <td className="border border-slate-900 p-1.5 font-bold">{row.month}</td>
                            <td className="border border-slate-900 p-1.5 text-center">{row.totalWeeks}</td>
                            <td className="border border-slate-900 p-1.5 text-center text-rose-700 font-bold">
                              {row.nonEffectiveWeeks}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-emerald-800">
                              {row.effectiveWeeks}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-emerald-800">
                              {row.effectiveMeetings}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-blue-800">
                              {row.effectiveJp} JP
                            </td>
                            <td className="border border-slate-900 p-1.5">{row.note}</td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-50 font-bold">
                          <td colSpan={2} className="border border-slate-900 p-2 text-right">
                            TOTAL SEMESTER 1
                          </td>
                          <td className="border border-slate-900 p-2 text-center">
                            {rpePayload.s1Summary.totalWeeks}
                          </td>
                          <td className="border border-slate-900 p-2 text-center text-rose-700">
                            {rpePayload.s1Summary.nonEffectiveWeeks}
                          </td>
                          <td className="border border-slate-900 p-2 text-center">
                            {rpePayload.s1Summary.effectiveWeeks} Pekan
                          </td>
                          <td className="border border-slate-900 p-2 text-center">
                            {rpePayload.s1Summary.effectiveMeetings} Kali
                          </td>
                          <td className="border border-slate-900 p-2 text-center">
                            {rpePayload.s1Summary.grossJp} JP
                          </td>
                          <td className="border border-slate-900 p-2">
                            Bersih: {rpePayload.s1Summary.netJp} JP (Cadangan {rpePayload.s1Summary.cadanganJp} JP)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* III. TABEL DISTRIBUSI PEKAN EFEKTIF SEMESTER 2 */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase">
                      III. TABEL DISTRIBUSI PEKAN EFEKTIF &amp; NON-EFEKTIF SEMESTER 2 (GENAP)
                    </h3>
                    <table className="w-full border-collapse border border-slate-900 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-slate-900 p-2 text-center w-9">No</th>
                          <th className="border border-slate-900 p-2">Nama Bulan</th>
                          <th className="border border-slate-900 p-2 text-center">Jml Pekan</th>
                          <th className="border border-slate-900 p-2 text-center">Non-Efektif</th>
                          <th className="border border-slate-900 p-2 text-center">Pekan Efektif</th>
                          <th className="border border-slate-900 p-2 text-center">Pertemuan</th>
                          <th className="border border-slate-900 p-2 text-center">JP Efektif</th>
                          <th className="border border-slate-900 p-2">Keterangan / Alasan Non-Efektif</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rpePayload.s2Rows.map((row) => (
                          <tr key={row.no}>
                            <td className="border border-slate-900 p-1.5 text-center">{row.semNo}</td>
                            <td className="border border-slate-900 p-1.5 font-bold">{row.month}</td>
                            <td className="border border-slate-900 p-1.5 text-center">{row.totalWeeks}</td>
                            <td className="border border-slate-900 p-1.5 text-center text-rose-700 font-bold">
                              {row.nonEffectiveWeeks}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-emerald-800">
                              {row.effectiveWeeks}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-emerald-800">
                              {row.effectiveMeetings}
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-blue-800">
                              {row.effectiveJp} JP
                            </td>
                            <td className="border border-slate-900 p-1.5">{row.note}</td>
                          </tr>
                        ))}
                        <tr className="bg-emerald-50 font-bold">
                          <td colSpan={2} className="border border-slate-900 p-2 text-right">
                            TOTAL SEMESTER 2
                          </td>
                          <td className="border border-slate-900 p-2 text-center">
                            {rpePayload.s2Summary.totalWeeks}
                          </td>
                          <td className="border border-slate-900 p-2 text-center text-rose-700">
                            {rpePayload.s2Summary.nonEffectiveWeeks}
                          </td>
                          <td className="border border-slate-900 p-2 text-center">
                            {rpePayload.s2Summary.effectiveWeeks} Pekan
                          </td>
                          <td className="border border-slate-900 p-2 text-center">
                            {rpePayload.s2Summary.effectiveMeetings} Kali
                          </td>
                          <td className="border border-slate-900 p-2 text-center">
                            {rpePayload.s2Summary.grossJp} JP
                          </td>
                          <td className="border border-slate-900 p-2">
                            Bersih: {rpePayload.s2Summary.netJp} JP (Cadangan {rpePayload.s2Summary.cadanganJp} JP)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* IV. PROGRAM ALOKASI WAKTU & DISTRIBUSI TUJUAN PEMBELAJARAN (TP) */}
                  {rpePayload.tpRows.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase">
                        IV. PROGRAM ALOKASI WAKTU &amp; DISTRIBUSI TUJUAN PEMBELAJARAN (TP)
                      </h3>
                      <table className="w-full border-collapse border border-slate-900 text-[11px]">
                        <thead>
                          <tr className="bg-slate-900 text-white font-bold">
                            <th className="border border-slate-900 p-2 text-center w-9">No</th>
                            <th className="border border-slate-900 p-2">Kode / Jenis</th>
                            <th className="border border-slate-900 p-2">
                              Lingkup Materi &amp; Tujuan Pembelajaran (TP) / Kegiatan
                            </th>
                            <th className="border border-slate-900 p-2 text-center">Jml Pertemuan</th>
                            <th className="border border-slate-900 p-2 text-center">Alokasi JP</th>
                            <th className="border border-slate-900 p-2">Perkiraan Bulan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rpePayload.tpRows.map((row) => (
                            <tr key={row.no}>
                              <td className="border border-slate-900 p-1.5 text-center">{row.no}</td>
                              <td className="border border-slate-900 p-1.5 font-bold">{row.tpCode}</td>
                              <td className="border border-slate-900 p-1.5">{row.lingkupMateri}</td>
                              <td className="border border-slate-900 p-1.5 text-center font-bold">
                                {row.jmlPertemuan}
                              </td>
                              <td className="border border-slate-900 p-1.5 text-center font-bold text-emerald-800 bg-emerald-50">
                                {row.alokasiJp}
                              </td>
                              <td className="border border-slate-900 p-1.5">{row.perkiraanBulan}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-100 font-bold">
                            <td colSpan={3} className="border border-slate-900 p-2 text-right">
                              TOTAL ALOKASI WAKTU TP
                            </td>
                            <td className="border border-slate-900 p-2 text-center">
                              {rpePayload.tpSummary.totalMeetings}
                            </td>
                            <td className="border border-slate-900 p-2 text-center text-emerald-900">
                              {rpePayload.tpSummary.totalAllocatedJp} JP
                            </td>
                            <td className="border border-slate-900 p-2">
                              Terpakai: {rpePayload.tpSummary.totalAllocatedJp} /{' '}
                              {rpePayload.tpSummary.targetEffectiveJp} JP (
                              {rpePayload.tpSummary.isBalanced
                                ? 'Seimbang'
                                : `Selisih ${rpePayload.tpSummary.diffJp} JP`}
                              )
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* V. RINCIAN HARI TERJADWAL VS LIBUR KALDIK */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase">
                      V. RINCIAN HARI TERJADWAL VS LIBUR KALDIK (JADWAL: {rpePayload.selectedDays.join(', ')})
                    </h3>
                    <table className="w-full border-collapse border border-slate-900 text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 font-bold">
                          <th className="border border-slate-900 p-2 text-center w-9">No</th>
                          <th className="border border-slate-900 p-2">Bulan</th>
                          <th className="border border-slate-900 p-2 text-center">Hari Terjadwal</th>
                          <th className="border border-slate-900 p-2 text-center">Terkena Libur Kaldik</th>
                          <th className="border border-slate-900 p-2 text-center">Pertemuan Efektif</th>
                          <th className="border border-slate-900 p-2">Keterangan Tanggal Terkena Agenda / Libur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rpePayload.twelveMonthRows.map((row) => (
                          <tr key={row.no}>
                            <td className="border border-slate-900 p-1.5 text-center">{row.no}</td>
                            <td className="border border-slate-900 p-1.5 font-bold">{row.month}</td>
                            <td className="border border-slate-900 p-1.5 text-center">{row.scheduledCount} Hari</td>
                            <td className="border border-slate-900 p-1.5 text-center text-rose-700 font-bold">
                              {row.holidayCount} Hari
                            </td>
                            <td className="border border-slate-900 p-1.5 text-center font-bold text-emerald-800">
                              {row.effectiveMeetings} Pertemuan
                            </td>
                            <td className="border border-slate-900 p-1.5">{row.affectedSummary}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* VI. RINCIAN AGENDA & HARI LIBUR KALENDER PENDIDIKAN */}
                  {rpePayload.kaldikRows.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold uppercase">
                        VI. RINCIAN AGENDA &amp; HARI LIBUR KALENDER PENDIDIKAN ({schoolProfile.academicYear})
                      </h3>
                      <table className="w-full border-collapse border border-slate-900 text-[11px]">
                        <thead>
                          <tr className="bg-slate-100 font-bold">
                            <th className="border border-slate-900 p-2 text-center w-9">No</th>
                            <th className="border border-slate-900 p-2">Bulan</th>
                            <th className="border border-slate-900 p-2">Rentang Tanggal</th>
                            <th className="border border-slate-900 p-2">Uraian Kegiatan / Hari Libur</th>
                            <th className="border border-slate-900 p-2">Kategori Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rpePayload.kaldikRows.map((ev) => (
                            <tr key={ev.no}>
                              <td className="border border-slate-900 p-1.5 text-center">{ev.no}</td>
                              <td className="border border-slate-900 p-1.5 font-bold">{ev.monthLabel}</td>
                              <td className="border border-slate-900 p-1.5">{ev.dateRangeLabel}</td>
                              <td className="border border-slate-900 p-1.5 font-semibold">{ev.name}</td>
                              <td className="border border-slate-900 p-1.5">{ev.categoryLabel}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Rekapitulasi 1 Tahun Ajaran */}
                  <div className="border border-slate-900 bg-emerald-50 p-2.5 text-center font-bold text-emerald-950 text-[11px]">
                    REKAPITULASI 1 TAHUN AJARAN: {rpePayload.annualSummary.effectiveWeeks} PEKAN EFEKTIF ·{' '}
                    {rpePayload.annualSummary.effectiveMeetings} PERTEMUAN · TOTAL {rpePayload.annualSummary.grossJp} JP
                    EFEKTIF (BERSIH {rpePayload.annualSummary.netJp} JP · CADANGAN {rpePayload.annualSummary.cadanganJp} JP)
                  </div>
                </div>
              );
            })()}

          {/* 6. MODUL AJAR DEEP LEARNING */}
          {printDocKey === 'modul_ajar' && (
            <div className="space-y-6 font-sans text-xs">
              {/* Filter Toolbar for Modul Ajar Print (Hidden on Print Output) */}
              <div className="p-3 bg-slate-100 rounded-xl border border-slate-300 no-print space-y-2.5 shadow-2xs font-sans">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-300 pb-2">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-700" />
                    Pilih Bab yang Dicetak / Diunduh:
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPrintBab('all');
                        setSelectedPrintPertemuan('all');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        selectedPrintBab === 'all'
                          ? 'bg-cyan-900 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      Semua Bab (1 s.d. {modulAjarList.length})
                    </button>
                    {modulAjarList.map((m) => (
                      <button
                        key={m.babNumber}
                        type="button"
                        onClick={() => {
                          setSelectedPrintBab(m.babNumber);
                          setSelectedPrintPertemuan('all');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                          selectedPrintBab === m.babNumber
                            ? 'bg-cyan-900 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                        }`}
                      >
                        Bab {m.babNumber}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pertemuan Filter (Always Active & Visible) */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    Pilih Pertemuan{selectedPrintBab !== 'all' ? ` untuk Bab ${selectedPrintBab}` : ''}:
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedPrintPertemuan('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                        selectedPrintPertemuan === 'all'
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                      }`}
                    >
                      Semua Pertemuan (1 s.d. {(selectedPrintBab !== 'all' ? modulAjarList.find(m => m.babNumber === selectedPrintBab)?.pertemuanCount : modulAjarList[0]?.pertemuanCount) || 6})
                    </button>
                    {Array.from({
                      length: (selectedPrintBab !== 'all' ? modulAjarList.find(m => m.babNumber === selectedPrintBab)?.pertemuanCount : modulAjarList[0]?.pertemuanCount) || 6
                    }).map((_, pIdx) => {
                      const pNum = pIdx + 1;
                      return (
                        <button
                          key={pNum}
                          type="button"
                          onClick={() => setSelectedPrintPertemuan(pNum)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            selectedPrintPertemuan === pNum
                              ? 'bg-emerald-800 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-300'
                          }`}
                        >
                          Pertemuan {pNum} (3 JP)
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pilihan Ceklis Instrumen Penilaian yang Dicetak */}
                <div className="border-t border-slate-300 pt-2 font-sans space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      Pilihan Ceklis Instrumen Penilaian yang Dicetak:
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPrintInstruments([
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
                          ])
                        }
                        className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-bold cursor-pointer transition-all"
                      >
                        ✓ Ceklis Semua
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPrintInstruments([])}
                        className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 text-[10px] font-bold cursor-pointer transition-all"
                      >
                        ✕ Hapus Ceklis
                      </button>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-[10px] font-bold">
                        {selectedPrintInstruments.length} Terpilih
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 text-[10.5px] font-bold">
                    {[
                      { id: 'Penilaian Sejawat', label: '1. Penilaian Sejawat' },
                      { id: 'Penilaian Diri', label: '2. Penilaian Diri' },
                      { id: 'Penilaian Proyek', label: '3. Penilaian Proyek' },
                      { id: 'Penilaian Produk', label: '4. Penilaian Produk' },
                      { id: 'Observasi', label: '5. Observasi Sikap' },
                      { id: 'Portofolio', label: '6. Portofolio' },
                      { id: 'Penilaian Berbasis Kelas', label: '7. Penilaian Berbasis Kelas' },
                      { id: 'Penilaian Kinerja', label: '8. Penilaian Kinerja' },
                      { id: 'Tes tertulis', label: '9. Tes Tertulis (HOTS)' },
                      { id: 'Tes lisan', label: '10. Tes Lisan' },
                    ].map((item) => {
                      const isChecked = selectedPrintInstruments.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedPrintInstruments(selectedPrintInstruments.filter((i) => i !== item.id));
                            } else {
                              setSelectedPrintInstruments([...selectedPrintInstruments, item.id]);
                            }
                          }}
                          className={`p-1.5 rounded border text-left flex items-center gap-1 transition-all cursor-pointer ${
                            isChecked
                              ? 'bg-emerald-800 text-white border-emerald-900 font-extrabold'
                              : 'bg-white text-slate-500 border-slate-300 opacity-60 hover:bg-slate-100'
                          }`}
                        >
                          <span>{isChecked ? '☑' : '☐'}</span>
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {modulAjarList
                .filter((m) => selectedPrintBab === 'all' || m.babNumber === selectedPrintBab)
                .map((rawMod, mIdx) => {
                  const mod = ensureOfficialKemendikdasmenModul(rawMod, schoolProfile);
                  const insts = getTenAssessmentInstruments(
                    schoolProfile.subject,
                    schoolProfile.grade,
                    mod.babNumber,
                    mod.babTitle,
                    schoolProfile
                  );

                  return (
                    <div
                      key={mod.id || mIdx}
                      className={mIdx > 0 ? 'page-break break-before-page pt-6 space-y-5' : 'space-y-5'}
                    >
                      {/* Top Title Bar */}
                      <div className="bg-white text-slate-900 p-4 text-center border-2 border-slate-900 space-y-1">
                        <h2 className="text-lg font-black tracking-tight uppercase text-slate-950">
                          RENCANA PEMBELAJARAN MENDALAM
                          {selectedPrintPertemuan !== 'all' ? ` • PERTEMUAN KE-${selectedPrintPertemuan}` : ''}
                        </h2>
                        <p className="text-xs font-bold text-amber-900">
                          Kurikulum Merdeka 2026 — Pembelajaran Berdiferensiasi
                        </p>
                        <p className="text-xs font-extrabold text-slate-800 uppercase tracking-wide">
                          {schoolProfile.schoolName} · Bab {mod.babNumber}: {mod.babTitle}
                        </p>
                      </div>

                      {/* A. INFORMASI UMUM */}
                      <div className="space-y-1.5">
                        <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-xs uppercase tracking-wider">
                          A. INFORMASI UMUM
                        </div>
                        <table className="w-full border-collapse border border-slate-900 text-[11px]">
                          <tbody>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 w-52">Nama Satuan Pendidikan</td>
                              <td className="border border-slate-900 p-1.5 font-bold">{schoolProfile.schoolName}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Nama Guru Penyusun</td>
                              <td className="border border-slate-900 p-1.5 font-extrabold text-slate-950">{schoolProfile.teacherName}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">NUPTK Guru</td>
                              <td className="border border-slate-900 p-1.5 font-mono font-bold text-slate-950">
                                {schoolProfile.teacherNuptk || schoolProfile.teacherNip || '9443766667200012'}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Mata Pelajaran</td>
                              <td className="border border-slate-900 p-1.5 font-bold text-amber-900">{schoolProfile.subject}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Kelas / Fase</td>
                              <td className="border border-slate-900 p-1.5 font-semibold">{schoolProfile.grade} / Fase {schoolProfile.fase}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Semester</td>
                              <td className="border border-slate-900 p-1.5 font-semibold">Semester {mod.semester} ({mod.semester === 1 ? 'Ganjil' : 'Genap'})</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Tahun Pelajaran</td>
                              <td className="border border-slate-900 p-1.5 font-mono font-bold">{schoolProfile.academicYear}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Alokasi Waktu</td>
                              <td className="border border-slate-900 p-1.5 font-bold">
                                {selectedPrintPertemuan !== 'all'
                                  ? `Pertemuan Ke-${selectedPrintPertemuan} (3 JP) dari Total ${mod.alokasiJp} JP`
                                  : `${mod.alokasiJp} JP (${mod.pertemuanCount} Pertemuan)`}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Tanggal Penyusunan</td>
                              <td className="border border-slate-900 p-1.5">{schoolProfile.signaturePlaceDate || '14 Oktober 2026'}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Sumber/Referensi CP</td>
                              <td className="border border-slate-900 p-1.5 font-medium">Dokumen kemendikdasmen, BSKAP 046/2025, Fase {schoolProfile.fase}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* B. IDENTIFIKASI */}
                      <div className="space-y-2.5">
                        <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-xs uppercase tracking-wider">
                          B. IDENTIFIKASI
                        </div>

                        {/* B.1 Identifikasi Peserta Didik */}
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-[#7c2d12] text-[11px] border-l-4 border-[#7c2d12] pl-2">
                            B.1 Identifikasi Peserta Didik
                          </h5>
                          <table className="w-full border-collapse border border-slate-900 text-[11px]">
                            <tbody>
                              <tr>
                                <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 w-52">
                                  Kesiapan Awal (Data Asesmen)
                                </td>
                                <td className="border border-slate-900 p-1.5 leading-relaxed">
                                  {mod.identifikasi?.pesertaDidik || 'Dari 36 siswa, 24 sudah memahami konsep dasar, 8 masih perlu pendampingan, 4 siap materi pendampingan.'}
                                </td>
                              </tr>
                              <tr>
                                <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">
                                  Gaya Belajar
                                </td>
                                <td className="border border-slate-900 p-1.5 leading-relaxed">
                                  Guru memperhatikan gaya belajar (visual, auditori, kinestetik) dan menerapkan diferensiasi sesuai kebutuhan.
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* B.2 Materi Pelajaran */}
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-[#7c2d12] text-[11px] border-l-4 border-[#7c2d12] pl-2">
                            B.2 Materi Pelajaran
                          </h5>
                          <table className="w-full border-collapse border border-slate-900 text-[11px]">
                            <tbody>
                              <tr>
                                <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 w-52">Faktual</td>
                                <td className="border border-slate-900 p-1.5">Terminologi, istilah, fakta, dan data konkret yang relevan dengan topik {schoolProfile.subject}.</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Konseptual</td>
                                <td className="border border-slate-900 p-1.5">Prinsip, teori, dan hubungan antar konsep yang membentuk pemahaman mendalam tentang topik pembelajaran.</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Prosedural</td>
                                <td className="border border-slate-900 p-1.5">Langkah-langkah sistematis dan teknik spesifik dalam {schoolProfile.subject} yang perlu dikuasai peserta didik.</td>
                              </tr>
                              <tr>
                                <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Metakognitif</td>
                                <td className="border border-slate-900 p-1.5">Strategi belajar mandiri dan evaluasi diri terhadap hasil belajar dalam konteks {schoolProfile.subject}.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* B.3 Dimensi Profil Lulusan */}
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-[#7c2d12] text-[11px] border-l-4 border-[#7c2d12] pl-2">
                            B.3 Dimensi Profil Lulusan
                          </h5>
                          <table className="w-full border-collapse border border-slate-900 text-[11px]">
                            <thead>
                              <tr className="bg-slate-100 font-bold">
                                <th className="border border-slate-900 p-1.5 text-left w-52">Dimensi</th>
                                <th className="border border-slate-900 p-1.5 text-left">Deskripsi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(mod.identifikasi?.dimensiProfilLulusan || ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian']).map((dim: string) => (
                                <tr key={dim}>
                                  <td className="border border-slate-900 p-1.5 font-bold">{dim}</td>
                                  <td className="border border-slate-900 p-1.5">
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

                      {/* C. DESAIN PEMBELAJARAN */}
                      <div className="space-y-1.5">
                        <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-xs uppercase tracking-wider">
                          C. DESAIN PEMBELAJARAN
                        </div>
                        <table className="w-full border-collapse border border-slate-900 text-[11px]">
                          <tbody>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 w-52">Capaian Pembelajaran</td>
                              <td className="border border-slate-900 p-1.5 leading-relaxed font-medium">
                                {mod.desainPembelajaran?.capaianPembelajaran || 'Pemahaman terhadap materi meliputi definisi dan konsep yang dikaitkan dengan fenomena dan masalah yang terjadi.'}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Tujuan Pembelajaran</td>
                              <td className="border border-slate-900 p-1.5 font-bold leading-relaxed text-slate-950">
                                {Array.isArray(mod.desainPembelajaran?.tujuanPembelajaran)
                                  ? mod.desainPembelajaran.tujuanPembelajaran.join('; ')
                                  : mod.desainPembelajaran?.tujuanPembelajaran || mod.tujuanPembelajaran.join('; ')}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Lintas Disiplin Ilmu</td>
                              <td className="border border-slate-900 p-1.5">{mod.desainPembelajaran?.lintasDisiplinIlmu || 'Matematika, IPS, PKn, Geografi'}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Model Pembelajaran</td>
                              <td className="border border-slate-900 p-1.5 font-bold text-amber-900">{mod.desainPembelajaran?.praktikPedagogis || 'Problem Based Learning (PBL)'}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Metode Pembelajaran</td>
                              <td className="border border-slate-900 p-1.5">Diskusi Kelompok, Tanya Jawab, Presentasi</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Sarana Prasarana</td>
                              <td className="border border-slate-900 p-1.5">{mod.saranaPrasarana || 'PID | Laptop | Gawai / Smartphone | LKPD (Lembar Kerja Peserta Didik) | Whiteboard'}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Target Peserta Didik</td>
                              <td className="border border-slate-900 p-1.5">{mod.targetPesertaDidik || 'Murid Reguler / Umum'}</td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Kemitraan Pembelajaran</td>
                              <td className="border border-slate-900 p-1.5 leading-relaxed">
                                {mod.desainPembelajaran?.kemitraanPembelajaran || 'Orang tua/wali sebagai mitra pendampingan di rumah; komunitas lokal sebagai sumber belajar kontekstual; narasumber terkait untuk menghubungkan materi dengan dunia nyata.'}
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Lingkungan Pembelajaran</td>
                              <td className="border border-slate-900 p-1.5 space-y-0.5">
                                <p><strong>Fisik:</strong> Ruang kelas tertata mendukung kolaborasi. LKPD, Whiteboard &amp; Spidol.</p>
                                <p><strong>Virtual/Digital:</strong> PID, Laptop, Gawai / Smartphone.</p>
                                <p><strong>Budaya:</strong> Suasana kelas yang aman, inklusif, dan mendorong pertumbuhan (growth mindset).</p>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* D. PETA PENGALAMAN BELAJAR */}
                      <div className="space-y-1.5">
                        <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-xs uppercase tracking-wider">
                          D. PETA PENGALAMAN BELAJAR
                        </div>
                        <p className="text-[10.5px] text-slate-600 italic">
                          Tiga tahap siklus pembelajaran (Memahami, Mengaplikasikan, Merefleksi) wajib ada — urutan menyesuaikan konteks TP dan model pembelajaran.
                        </p>
                        <table className="w-full border-collapse border border-slate-900 text-[11px]">
                          <thead>
                            <tr className="bg-slate-100 font-bold text-center">
                              <th className="border border-slate-900 p-1.5 w-16">Urutan</th>
                              <th className="border border-slate-900 p-1.5 w-32">Tahap</th>
                              <th className="border border-slate-900 p-1.5 text-left">Deskripsi Pengalaman Belajar</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td className="border border-slate-900 p-1.5 text-center font-bold">1</td>
                              <td className="border border-slate-900 p-1.5 font-bold text-emerald-900">Memahami</td>
                              <td className="border border-slate-900 p-1.5 leading-relaxed">
                                Peserta didik terlibat langsung mengamati fenomena/kasus terkait {schoolProfile.subject}, difasilitasi pertanyaan pemantik untuk membangun pemahaman awal terhadap tujuan pembelajaran.
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 text-center font-bold">2</td>
                              <td className="border border-slate-900 p-1.5 font-bold text-amber-900">Mengaplikasikan</td>
                              <td className="border border-slate-900 p-1.5 leading-relaxed">
                                Melalui Problem Based Learning (PBL), peserta didik menerapkan konsep pada tantangan kontekstual secara kolaboratif untuk mencapai tujuan pembelajaran tersebut.
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 text-center font-bold">3</td>
                              <td className="border border-slate-900 p-1.5 font-bold text-rose-900">Merefleksi</td>
                              <td className="border border-slate-900 p-1.5 leading-relaxed">
                                Peserta didik menuliskan refleksi singkat tentang apa yang dipahami dan apa yang masih membingungkan, lalu melakukan teach-back kepada teman sebaya.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* E. LANGKAH-LANGKAH PEMBELAJARAN */}
                      <div className="space-y-2.5">
                        <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-xs uppercase tracking-wider">
                          E. LANGKAH-LANGKAH PEMBELAJARAN
                        </div>

                        {/* E.1 Pendahuluan */}
                        {mod.pengalamanBelajar?.kegiatanAwal && (
                          <div className="space-y-1 p-3 bg-slate-50 border border-slate-900">
                            <h5 className="font-extrabold text-slate-950 text-[11px]">
                              E.1 Pendahuluan (±15 Menit)
                            </h5>
                            <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-800 text-[11px]">
                              {mod.pengalamanBelajar.kegiatanAwal.deskripsi.map((line: string, idx: number) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* E.2 Kegiatan Inti */}
                        <div className="space-y-2 p-3 bg-white border border-slate-900 text-[11px]">
                          <h5 className="font-extrabold text-slate-950 text-[11px]">
                            E.2 Kegiatan Inti (Mengikuti Urutan Siklus di Bagian D)
                          </h5>

                          <div className="space-y-0.5 pl-2">
                            <p className="font-bold text-emerald-950">Tahap 1 — Memahami:</p>
                            <ul className="list-disc list-inside space-y-0.5 pl-2 text-slate-800">
                              {mod.pengalamanBelajar?.kegiatanInti.memahami.deskripsi.map((line: string, idx: number) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-0.5 pl-2 pt-1 border-t border-slate-200">
                            <p className="font-bold text-amber-950">Tahap 2 — Mengaplikasikan:</p>
                            <ul className="list-disc list-inside space-y-0.5 pl-2 text-slate-800">
                              {mod.pengalamanBelajar?.kegiatanInti.mengaplikasi.deskripsi.map((line: string, idx: number) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="space-y-0.5 pl-2 pt-1 border-t border-slate-200">
                            <p className="font-bold text-rose-950">Tahap 3 — Merefleksi:</p>
                            <ul className="list-disc list-inside space-y-0.5 pl-2 text-slate-800">
                              {mod.pengalamanBelajar?.kegiatanInti.merefleksi.deskripsi.map((line: string, idx: number) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                            <p className="text-[10.5px] font-semibold text-slate-700 italic pt-1">
                              Metode yang digunakan sepanjang kegiatan inti: Diskusi Kelompok, Tanya Jawab, Presentasi.
                            </p>
                          </div>
                        </div>

                        {/* E.3 Penutup */}
                        {mod.pengalamanBelajar?.kegiatanPenutup && (
                          <div className="space-y-1 p-3 bg-slate-50 border border-slate-900">
                            <h5 className="font-extrabold text-slate-950 text-[11px]">
                              E.3 Penutup (±10 Menit)
                            </h5>
                            <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-800 text-[11px]">
                              {mod.pengalamanBelajar.kegiatanPenutup.deskripsi.map((line: string, idx: number) => (
                                <li key={idx}>{line}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* F. ASESMEN PEMBELAJARAN */}
                      <div className="space-y-3">
                        <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-xs uppercase tracking-wider">
                          F. ASESMEN PEMBELAJARAN
                        </div>

                        <h5 className="font-extrabold text-[#7c2d12] text-[11px]">
                          F.1 Asesmen Formatif (Dilaksanakan dalam Pertemuan Ini)
                        </h5>

                        {/* F.1.a Sebelum Pembelajaran */}
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900 text-[11px]">
                            F.1.a — Sebelum Pembelajaran (Asesmen Diagnostik Awal)
                          </p>
                          <table className="w-full border-collapse border border-slate-900 text-[11px]">
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
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900 text-[11px]">
                            F.1.b — Saat Pembelajaran (Asesmen Proses)
                          </p>
                          <table className="w-full border-collapse border border-slate-900 text-[11px]">
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
                                <td className="border border-slate-900 p-1.5">Analisis mendalam &amp; kritis</td>
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
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900 text-[11px]">
                            F.1.c — Setelah Pembelajaran (Exit Ticket)
                          </p>
                          <table className="w-full border-collapse border border-slate-900 text-[11px]">
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
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900 text-[11px]">
                            F.3 Pedoman Penskoran Sumatif
                          </p>
                          <table className="w-full border-collapse border border-slate-900 text-[11px]">
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
                          <p className="text-[10.5px] font-bold text-emerald-900 bg-emerald-50 p-1.5 border border-slate-900">
                            Konversi Nilai: 90-100 = A | 80-89 = B | 70-79 = C | 60-69 = D | &lt;60 = E
                          </p>
                        </div>

                        {/* F.4 Remedial dan Pengayaan */}
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900 text-[11px]">
                            F.4 Remedial dan Pengayaan
                          </p>
                          <table className="w-full border-collapse border border-slate-900 text-[11px]">
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

                        {/* F.5 Output Rekapitulasi Penilaian (36 Blank Rows) */}
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-900 text-[11px]">
                            F.5 Output Rekapitulasi Penilaian
                          </p>
                          <p className="text-[10px] text-slate-600 italic">
                            Diisi manual oleh guru setelah asesmen berlangsung.
                          </p>
                          <table className="w-full border-collapse border border-slate-900 text-[10.5px]">
                            <thead>
                              <tr className="bg-slate-100 font-bold text-center">
                                <th className="border border-slate-900 p-1 w-10">No.</th>
                                <th className="border border-slate-900 p-1 text-left">Nama Peserta Didik</th>
                                <th className="border border-slate-900 p-1 text-left">Catatan Formatif</th>
                                <th className="border border-slate-900 p-1 w-16">Nilai PG</th>
                                <th className="border border-slate-900 p-1 w-16">Nilai Esai</th>
                                <th className="border border-slate-900 p-1 w-20">Nilai Akhir</th>
                                <th className="border border-slate-900 p-1 w-16">Predikat</th>
                              </tr>
                            </thead>
                            <tbody>
                              {Array.from({ length: 36 }, (_, i) => i + 1).map((no: number) => (
                                <tr key={no}>
                                  <td className="border border-slate-900 p-1 text-center font-mono">{no}</td>
                                  <td className="border border-slate-900 p-1"></td>
                                  <td className="border border-slate-900 p-1"></td>
                                  <td className="border border-slate-900 p-1 text-center"></td>
                                  <td className="border border-slate-900 p-1 text-center"></td>
                                  <td className="border border-slate-900 p-1 text-center"></td>
                                  <td className="border border-slate-900 p-1 text-center"></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* LAMPIRAN 10 INSTRUMEN PENILAIAN TERPILIH */}
                        <div className="pt-2 space-y-3">
                          <h4 className="font-extrabold text-slate-950 uppercase text-center tracking-tight text-xs bg-slate-100 py-1.5 border border-slate-900">
                            LAMPIRAN RESMI: INSTRUMEN PENILAIAN PEMBELAJARAN TERPILIH (BAB {mod.babNumber})
                          </h4>

                          {[
                            { nameMatch: 'Penilaian Sejawat', item: insts.penilaianSejawat },
                            { nameMatch: 'Penilaian Diri', item: insts.penilaianDiri },
                            { nameMatch: 'Penilaian Proyek', item: insts.penilaianProyek },
                            { nameMatch: 'Penilaian Produk', item: insts.penilaianProduk },
                            { nameMatch: 'Observasi', item: insts.observasiSikap },
                            { nameMatch: 'Portofolio', item: insts.portofolio },
                            { nameMatch: 'Penilaian Berbasis Kelas', item: insts.penilaianBerbasisKelas },
                            { nameMatch: 'Penilaian Kinerja', item: insts.penilaianKinerja },
                          ]
                            .filter((x) => selectedPrintInstruments.includes(x.nameMatch))
                            .map(({ item }) => (
                              <div key={item.id} className="space-y-1.5 border-b border-slate-300 pb-3">
                                <div className="flex justify-between font-bold text-slate-900">
                                  <span>{item.name}</span>
                                  <span className="italic font-normal">[{item.category}]</span>
                                </div>
                                <table className="w-full border-collapse border border-slate-900 text-left text-[10.5px]">
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
                                        <td className="border border-slate-900 p-1.5 text-center font-bold w-6">{row.no}</td>
                                        <td className="border border-slate-900 p-1.5 font-semibold w-1/4">{row.kriteria}</td>
                                        <td className="border border-slate-900 p-1.5">{row.indikator}</td>
                                        <td className="border border-slate-900 p-1.5 text-center font-bold w-16">{row.skorMaksimal}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                <p className="text-[10px] text-slate-700 italic">
                                  * Rubrik: {item.rubrikPenilaian.map((r) => `${r.predikat} (${r.skor})`).join(' · ')} | {item.formatLembar.skalaSkor}
                                </p>
                              </div>
                            ))}

                          {selectedPrintInstruments.includes('Tes tertulis') && (
                            <div className="space-y-1.5 border-b border-slate-300 pb-3">
                              <p className="font-bold text-slate-900">9. Tes Tertulis (Kisi-Kisi, Soal PG &amp; Uraian HOTS)</p>
                              <div className="space-y-2">
                                {insts.tesTertulisItems.map((tItem) => (
                                  <div key={tItem.no} className="p-2 border border-slate-400 rounded bg-slate-50 space-y-1">
                                    <p className="font-bold text-slate-950">Soal {tItem.no} ({tItem.bentuk} - Bobot {tItem.bobotSkor}): {tItem.soal}</p>
                                    {tItem.pilihan && (
                                      <div className="pl-3 text-[10px] space-y-0.5">
                                        {tItem.pilihan.map((p, pIdx) => (
                                          <p key={pIdx}>{p}</p>
                                        ))}
                                      </div>
                                    )}
                                    <p className="text-[10px] font-semibold text-emerald-900">Kunci/Rubrik: {tItem.kunciJawaban}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {selectedPrintInstruments.includes('Tes lisan') && (
                            <div className="space-y-1.5 pb-2">
                              <p className="font-bold text-slate-900">10. Tes Lisan (Panduan &amp; Pertanyaan Pemantik Konseptual/Vokasi)</p>
                              <div className="space-y-1.5">
                                {insts.tesLisanItems.map((lItem) => (
                                  <div key={lItem.no} className="p-2 border border-slate-400 rounded bg-purple-50/40 text-[10.5px]">
                                    <p className="font-bold text-purple-950">Pertanyaan {lItem.no} (Fokus: {lItem.fokusKompetensi}): &ldquo;{lItem.pertanyaan}&rdquo;</p>
                                    <p className="text-[10px] text-purple-900 font-medium">Rubrik Skor (Maks {lItem.skorMaks}): {lItem.kunciJawabanDanRubrik}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* G. DIFERENSIASI PEMBELAJARAN */}
                      <div className="space-y-1.5">
                        <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-xs uppercase tracking-wider">
                          G. DIFERENSIASI PEMBELAJARAN
                        </div>
                        <table className="w-full border-collapse border border-slate-900 text-[11px]">
                          <tbody>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50 w-32">Konten</td>
                              <td className="border border-slate-900 p-1.5 leading-relaxed">
                                Materi disajikan multimodal (teks, visual, audio, video) untuk mengakomodasi gaya belajar berbeda.
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Proses</td>
                              <td className="border border-slate-900 p-1.5 leading-relaxed">
                                Diferensiasi proses melalui pilihan kegiatan, tugas bertingkat, dan pengelompokan fleksibel sesuai kebutuhan.
                              </td>
                            </tr>
                            <tr>
                              <td className="border border-slate-900 p-1.5 font-bold bg-slate-50">Produk</td>
                              <td className="border border-slate-900 p-1.5 leading-relaxed">
                                Peserta didik memilih bentuk produk sesuai minat: laporan tertulis, poster, video singkat, atau demonstrasi langsung.
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* H. LAMPIRAN & PASCA OBSERVASI */}
                      <div className="space-y-3">
                        <div className="bg-[#7c2d12] text-white px-3 py-1.5 font-black text-xs uppercase tracking-wider">
                          H. LAMPIRAN
                        </div>

                        {/* Daftar Pustaka */}
                        <div className="space-y-1 bg-slate-50 p-3 border border-slate-900 text-[11px]">
                          <h5 className="font-extrabold text-slate-950">Daftar Pustaka</h5>
                          <ol className="list-decimal list-inside space-y-0.5 text-slate-800 leading-relaxed">
                            <li>Kemendikdasmen. (2026). Panduan Pembelajaran Mendalam Kurikulum Merdeka. Jakarta: Badan Standar, Kurikulum, dan Asesmen Pendidikan.</li>
                            <li>Kemendikdasmen. (2026). Capaian Pembelajaran {schoolProfile.subject} — Kurikulum Merdeka.</li>
                            <li>Platform Merdeka Mengajar (PMM). Modul Ajar dan Perangkat Pembelajaran {schoolProfile.subject}. guru.kemdikbud.go.id</li>
                          </ol>
                        </div>

                        {/* Lembar Tanda Tangan Pengesahan */}
                        <div className="p-4 bg-white border border-slate-900 space-y-5 text-center text-[11px]">
                          <div className="flex justify-end text-slate-700 font-medium">
                            <p>{schoolProfile.signaturePlaceDate || 'Bandar Mataram, 14 Oktober 2026'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-8 pt-1">
                            <div className="space-y-14">
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

                            <div className="space-y-14">
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

                        {/* Pasca Observasi & Rencana Tindak Lanjut */}
                        <div className="p-3.5 bg-slate-50 border border-slate-900 space-y-2 font-sans text-[11px]">
                          <h5 className="font-black text-slate-950 text-xs border-b border-slate-400 pb-1">
                            Pasca Observasi &amp; Rencana Tindak Lanjut
                          </h5>
                          <div className="space-y-2 text-slate-800">
                            <div>
                              <p className="font-extrabold text-slate-950">
                                Catatan hal yang perlu ditingkatkan dari pelaksanaan pembelajaran:
                              </p>
                              <ol className="list-decimal list-inside pl-2 space-y-0.5 pt-0.5">
                                <li>Mengoptimalkan manajemen waktu,</li>
                                <li>Penekanan kesepakatan pembelajaran bersama siswa.</li>
                              </ol>
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-950">Rencana Tindak Lanjut:</p>
                              <ol className="list-decimal list-inside pl-2 space-y-1 pt-0.5">
                                <li>
                                  <strong>Mengoptimalkan manajemen waktu:</strong> Menyusun perencanaan kegiatan secara lebih terstruktur, menentukan skala prioritas, serta mengalokasikan waktu secara efektif agar seluruh proses pembelajaran berjalan sesuai jadwal.
                                </li>
                                <li>
                                  <strong>Menekankan kesepakatan pembelajaran:</strong> Mengingatkan dan menegaskan kembali kesepakatan pembelajaran bersama peserta didik, termasuk kedisiplinan, tanggung jawab, partisipasi aktif, serta aturan selama pembelajaran.
                                </li>
                              </ol>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* 7. LEMBAR KERJA PESERTA DIDIK (LKPD) */}
          {printDocKey === 'lkpd' && (
            <div className="space-y-4 font-sans text-xs">
              <div className="text-center">
                <h2 className="text-base font-bold uppercase">LEMBAR KERJA PESERTA DIDIK (LKPD)</h2>
                <p className="text-xs text-slate-600">
                  Bab {currentLkpd.babNumber}: {currentLkpd.title} · Waktu: {currentLkpd.waktu}
                </p>
              </div>

              {renderOfficialIdentitasTable()}

              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <tbody>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50 w-44">Nama Kelompok</td>
                    <td className="border border-slate-900 p-2">................................................</td>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50 w-36">Kelas / Waktu</td>
                    <td className="border border-slate-900 p-2">{schoolProfile.grade} / {currentLkpd.waktu}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">A. Petunjuk Pengerjaan</td>
                    <td colSpan={3} className="border border-slate-900 p-2">
                      {currentLkpd.petunjuk.map((pt, idx) => (
                        <div key={idx}>{idx + 1}. {pt}</div>
                      ))}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-slate-50">B. Ringkasan Materi</td>
                    <td colSpan={3} className="border border-slate-900 p-2">{currentLkpd.materiRingkas}</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 font-bold bg-emerald-50">C. Aktivitas Kolaboratif</td>
                    <td colSpan={3} className="border border-slate-900 p-2 font-semibold bg-emerald-50/40">{currentLkpd.aktivitas}</td>
                  </tr>
                </tbody>
              </table>

              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-900 p-2 text-center w-10">No</th>
                    <th className="border border-slate-900 p-2 text-left">D. Pertanyaan Diskusi & Analisis HOTS</th>
                    <th className="border border-slate-900 p-2 text-left w-1/2">Lembar Jawaban Peserta Didik</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLkpd.pertanyaanDiskusi.map((q, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-900 p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-900 p-2 font-semibold">{q}</td>
                      <td className="border border-slate-900 p-2 text-slate-400 italic">
                        ............................................................................................
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-amber-50">
                    <td className="border border-slate-900 p-2 font-bold text-center">★</td>
                    <td className="border border-slate-900 p-2 font-bold text-amber-950">Kunci Jawaban & Panduan Guru</td>
                    <td className="border border-slate-900 p-2 text-amber-950">{currentLkpd.kunciJawaban}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 8. ANALISIS TAKSONOMI BLOOM & HOTS */}
          {printDocKey === 'bloom' && (
            <div className="space-y-4 font-sans text-xs">
              <div className="text-center">
                <h2 className="text-base font-bold uppercase">ANALISIS TAKSONOMI BLOOM & KUALITAS HOTS</h2>
                <p className="text-xs text-slate-600">Pemetaan Anderson-Krathwohl · Persentase HOTS: 71%</p>
              </div>
              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-900 p-2 text-center w-20">Kode TP</th>
                    <th className="border border-slate-900 p-2 w-36">Elemen</th>
                    <th className="border border-slate-900 p-2">Tujuan Pembelajaran</th>
                    <th className="border border-slate-900 p-2 text-center w-24">Level Kognitif</th>
                    <th className="border border-slate-900 p-2 text-center w-24">Kategori</th>
                  </tr>
                </thead>
                <tbody>
                  {tujuanPembelajaran.map((tp) => (
                    <tr key={tp.id}>
                      <td className="border border-slate-900 p-2 text-center font-mono font-bold">{tp.code}</td>
                      <td className="border border-slate-900 p-2 font-semibold">{tp.element}</td>
                      <td className="border border-slate-900 p-2">{tp.description}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold">{tp.bloomLevel}</td>
                      <td className="border border-slate-900 p-2 text-center font-semibold">{tp.hotsCategory}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 className="text-xs font-bold uppercase pt-2">
                MATRIKS 2 DIMENSI ANDERSON-KRATHWOHL (PROSES KOGNITIF X DIMENSI PENGETAHUAN)
              </h3>
              <table className="w-full border-collapse border border-slate-900 text-[11px] text-center">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-900 p-2 text-left">Dimensi Pengetahuan</th>
                    <th className="border border-slate-900 p-2">C1 Mengingat</th>
                    <th className="border border-slate-900 p-2">C2 Memahami</th>
                    <th className="border border-slate-900 p-2">C3 Menerapkan</th>
                    <th className="border border-slate-900 p-2">C4 Menganalisis</th>
                    <th className="border border-slate-900 p-2">C5 Mengevaluasi</th>
                    <th className="border border-slate-900 p-2">C6 Mencipta</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-900 p-2 text-left font-bold bg-slate-50">1. Faktual</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2 font-bold">TP 10.7</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2">-</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 text-left font-bold bg-slate-50">2. Konseptual</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2 font-bold">TP 10.3</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2">-</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 text-left font-bold bg-slate-50">3. Prosedural</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2 font-bold">TP 10.4</td>
                    <td className="border border-slate-900 p-2 font-bold">TP 10.1, TP 10.6</td>
                    <td className="border border-slate-900 p-2 font-bold">TP 10.2</td>
                    <td className="border border-slate-900 p-2 font-bold">TP 10.5</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-900 p-2 text-left font-bold bg-slate-50">4. Metakognitif</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2">-</td>
                    <td className="border border-slate-900 p-2 font-semibold">Refleksi LHO</td>
                    <td className="border border-slate-900 p-2 font-semibold">Refleksi Anekdot</td>
                    <td className="border border-slate-900 p-2 font-semibold">Deep Learning</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* 9. KALENDER PENDIDIKAN (KALDIK) */}
          {printDocKey === 'kaldik' && (
            <div className="space-y-4 font-sans text-xs">
              <div className="text-center">
                <h2 className="text-base font-bold uppercase">AGENDA KALENDER PENDIDIKAN TA {schoolProfile.academicYear}</h2>
                <p className="text-xs text-slate-600">{schoolProfile.schoolName} · {kaldikEvents.length} Agenda Tersinkron</p>
              </div>
              {renderOfficialIdentitasTable(`${schoolProfile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)`)}
              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 font-bold">
                    <th className="border border-slate-900 p-2 text-center w-10">No</th>
                    <th className="border border-slate-900 p-2">Bulan</th>
                    <th className="border border-slate-900 p-2">Rentang Tanggal</th>
                    <th className="border border-slate-900 p-2">Uraian Kegiatan / Hari Libur</th>
                    <th className="border border-slate-900 p-2 text-center">Kategori Status</th>
                    <th className="border border-slate-900 p-2">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {[...kaldikEvents]
                    .sort((a, b) => (a.dateStart || '').localeCompare(b.dateStart || ''))
                    .map((ev, idx) => (
                      <tr key={ev.id}>
                        <td className="border border-slate-900 p-2 text-center">{idx + 1}</td>
                        <td className="border border-slate-900 p-2 font-bold">{getIndonesianMonthYearLabel(ev.dateStart)}</td>
                        <td className="border border-slate-900 p-2">
                          {formatDateRangeLabelId(ev.dateStart, ev.dateEnd)}
                        </td>
                        <td className="border border-slate-900 p-2 font-bold">{ev.name}</td>
                        <td className="border border-slate-900 p-2 text-center font-semibold text-emerald-900">
                          {formatKaldikCategoryExportLabel(ev.type)}
                        </td>
                        <td className="border border-slate-900 p-2">{ev.notes || '-'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 10. ANALISIS CP & ALUR TUJUAN PEMBELAJARAN (ATP) */}
          {printDocKey === 'cp_atp' && (() => {
            const s1RpePrint = calculateRpeTotals(rpe.semester1.months, rpe.semester1.jpPerWeek, rpe.semester1.cadanganJp);
            const s2RpePrint = calculateRpeTotals(rpe.semester2.months, rpe.semester2.jpPerWeek, rpe.semester2.cadanganJp);
            const rpeS1NetJpPrint = s1RpePrint.netJp || 28;
            const rpeS2NetJpPrint = s2RpePrint.netJp || 26;
            const s1JpPrint = tujuanPembelajaran.filter((tp) => tp.semester === 1).reduce((a, b) => a + (Number(b.jpAllocation) || 0), 0);
            const s2JpPrint = tujuanPembelajaran.filter((tp) => tp.semester === 2).reduce((a, b) => a + (Number(b.jpAllocation) || 0), 0);
            const { rasional: printRasional, cpElements: printSubjectElements } = getSubjectRasionalAndCpElements(
              schoolProfile.subject,
              schoolProfile.grade,
              schoolProfile.fase,
              selectedBook
            );
            const activePrintElements =
              cpElements &&
              cpElements.length > 0 &&
              cpElements[0].variasiKeterampilan &&
              cpElements.some((el) =>
                printSubjectElements.some((sel) => sel.name.toLowerCase() === el.name.toLowerCase())
              )
                ? cpElements
                : printSubjectElements;

            return (
              <div className="space-y-6 font-sans text-xs">
                <div className="text-center space-y-1">
                  <h2 className="text-base font-black uppercase text-slate-950 tracking-tight">
                    ANALISIS CAPAIAN PEMBELAJARAN (CP) & ALUR TUJUAN PEMBELAJARAN (ATP)
                  </h2>
                  <p className="text-xs font-bold text-emerald-800">
                    Berdasarkan KepKa BSKAP No. 046/H/KR/2025, Permendikbudristek No. 12 Tahun 2024, Permendikbudristek Nomor 13 Tahun 2025, dan KMA No. 1503 Tahun 2025 · Sumber: https://kurikulum.kemendikdasmen.go.id/
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Mata Pelajaran: {schoolProfile.subject} · Fase {schoolProfile.fase} ({schoolProfile.grade}) · Tahun Ajaran {schoolProfile.academicYear} · Guru: {schoolProfile.teacherName}
                  </p>
                </div>

                {renderOfficialIdentitasTable(`${schoolProfile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)`)}

                {/* Section I: Buku Pilihan & Elemen CP Resmi BSKAP 046/2025 + Rasional */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-1">
                    I. BUKU PILIHAN (FILTER PENERBIT) & CP/ATP DITERAPKAN — ELEMEN CAPAIAN PEMBELAJARAN RESMI BSKAP 046/2025
                  </h3>
                  <table className="w-full border-collapse border border-slate-900 text-[10px]">
                    <thead>
                      <tr className="bg-emerald-50 font-bold text-slate-900 uppercase">
                        <th className="border border-slate-900 p-2 text-center w-8">No</th>
                        <th className="border border-slate-900 p-2 text-left w-44">Elemen Capaian Pembelajaran</th>
                        <th className="border border-slate-900 p-2 text-left">Deskripsi Resmi Capaian Pembelajaran (BSKAP 046/2025)</th>
                        <th className="border border-slate-900 p-2 text-left w-52">Fokus Kompetensi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePrintElements.map((el, idx) => (
                        <tr key={`print-resmi-${el.id}-${idx}`}>
                          <td className="border border-slate-900 p-2 text-center font-bold align-top">{idx + 1}</td>
                          <td className="border border-slate-900 p-2 font-bold text-slate-900 align-top">{el.name}</td>
                          <td className="border border-slate-900 p-2 text-slate-800 leading-relaxed align-top">{el.deskripsi}</td>
                          <td className="border border-slate-900 p-2 text-slate-800 align-top">
                            <ul className="list-disc list-inside space-y-0.5">
                              {el.kompetensi.map((k: string, ki: number) => (
                                <li key={ki}>{k}</li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="space-y-1">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      RASIONAL & KARAKTERISTIK MATA PELAJARAN
                    </h4>
                    <p className="text-[11px] text-slate-800 leading-relaxed text-justify bg-slate-50 p-3 border border-slate-300">
                      {printRasional}
                    </p>
                  </div>
                </div>

                {/* Section II: Analisis Pemetaan Elemen CP */}
                <div className="space-y-2">
                  <div className="border-b border-slate-900 pb-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      II. ANALISIS PEMETAAN ELEMEN CP KE KOMPETENSI DAN LINGKUP MATERI
                    </h3>
                    <p className="text-[10px] text-slate-600">
                      Dekonstruksi kalimat Capaian Pembelajaran untuk mengidentifikasi Kata Kerja Operasional (KKO) tingkat kognitif, lingkup materi esensial, serta variasi keterampilan berpikir tingkat tinggi (HOTS).
                    </p>
                  </div>

                  <table className="w-full border-collapse border border-slate-900 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-900 uppercase">
                        <th className="border border-slate-900 p-2 text-center w-8">No</th>
                        <th className="border border-slate-900 p-2 text-left w-36">Elemen CP</th>
                        <th className="border border-slate-900 p-2 text-left">Kalimat Capaian Pembelajaran (CP)</th>
                        <th className="border border-slate-900 p-2 text-left w-44">Kompetensi yang Dituju (KKO)</th>
                        <th className="border border-slate-900 p-2 text-left w-44">Lingkup Materi Esensial</th>
                        <th className="border border-slate-900 p-2 text-left w-40">Variasi Keterampilan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activePrintElements.map((el, idx) => (
                        <tr key={el.id}>
                          <td className="border border-slate-900 p-2 text-center font-bold align-top">{idx + 1}</td>
                          <td className="border border-slate-900 p-2 font-bold text-slate-900 align-top">{el.name}</td>
                          <td className="border border-slate-900 p-2 text-slate-800 leading-relaxed align-top">{el.deskripsi}</td>
                          <td className="border border-slate-900 p-2 text-slate-800 align-top">
                            <ul className="list-disc list-inside space-y-0.5">
                              {el.kompetensi.map((k: string, ki: number) => (
                                <li key={ki}>{k}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="border border-slate-900 p-2 text-slate-800 align-top">
                            <ul className="list-disc list-inside space-y-0.5">
                              {el.materi.map((m: string, mi: number) => (
                                <li key={mi}>{m}</li>
                              ))}
                            </ul>
                          </td>
                          <td className="border border-slate-900 p-2 text-slate-800 align-top">
                            {el.variasiKeterampilan || 'Penalaran kritis, kreativitas pemecahan masalah, dan komunikasi solutif.'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Section III: Matriks Alur Tujuan Pembelajaran (ATP) */}
                <div className="space-y-2 pt-2">
                  <div className="border-b border-slate-900 pb-1">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                      III. MATRIKS ALUR TUJUAN PEMBELAJARAN (ATP) DAN ALOKASI WAKTU
                    </h3>
                    <p className="text-[10px] text-slate-600">
                      Alur Tujuan Pembelajaran (ATP) dirancang berurutan secara logis, memuat Indikator Ketercapaian Tujuan Pembelajaran (IKTP / KKTP), KKO Bloom, Dimensi Profil Pelajar Pancasila, Rencana Asesmen, dan Sumber Belajar.
                    </p>
                  </div>

                  <table className="w-full border-collapse border border-slate-900 text-[10px]">
                    <thead>
                      <tr className="bg-slate-100 font-bold text-slate-900 uppercase">
                        <th className="border border-slate-900 p-1.5 text-center w-7">No</th>
                        <th className="border border-slate-900 p-1.5 text-center w-16">Kode / Sem</th>
                        <th className="border border-slate-900 p-1.5 text-left w-28">Elemen CP</th>
                        <th className="border border-slate-900 p-1.5 text-left">Tujuan Pembelajaran (TP)</th>
                        <th className="border border-slate-900 p-1.5 text-left w-44">Indikator Ketercapaian (IKTP)</th>
                        <th className="border border-slate-900 p-1.5 text-center w-16">KKO Bloom</th>
                        <th className="border border-slate-900 p-1.5 text-left w-44">Materi Pokok & Sub-Materi</th>
                        <th className="border border-slate-900 p-1.5 text-center w-10">JP</th>
                        <th className="border border-slate-900 p-1.5 text-left w-24">Profil Pancasila</th>
                        <th className="border border-slate-900 p-1.5 text-left w-32">Rencana Asesmen & Media</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tujuanPembelajaran.map((tp, idx) => (
                        <tr key={tp.id}>
                          <td className="border border-slate-900 p-1.5 text-center font-bold align-top">{idx + 1}</td>
                          <td className="border border-slate-900 p-1.5 text-center align-top font-mono font-bold">
                            {tp.code}
                            <span className="block text-[9px] font-sans text-amber-900 font-bold">Smt {tp.semester}</span>
                          </td>
                          <td className="border border-slate-900 p-1.5 font-medium text-slate-900 align-top">{tp.element}</td>
                          <td className="border border-slate-900 p-1.5 text-slate-800 leading-relaxed align-top">{tp.description}</td>
                          <td className="border border-slate-900 p-1.5 text-slate-700 leading-snug align-top">
                            {tp.indikatorKinerja || '• Siswa dapat memecahkan soal studi kasus dengan kalkulasi tepat.'}
                          </td>
                          <td className="border border-slate-900 p-1.5 text-center align-top font-mono font-bold">
                            <span className="block text-indigo-900">{tp.bloomLevel}</span>
                            <span className="block text-[9px] font-sans text-rose-800">{tp.hotsCategory}</span>
                          </td>
                          <td className="border border-slate-900 p-1.5 text-slate-800 align-top">
                            <p className="font-bold text-slate-950">{tp.materiPokok}</p>
                            <p className="text-[9px] font-bold text-emerald-800">
                              {tp.babId ? `Bab ${tp.babId.replace('bab-', '')}` : `Bab ${idx + 1}`}
                            </p>
                            {tp.subMateri && (
                              <div className="text-[9px] text-slate-600 mt-0.5">
                                {tp.subMateri.split('\n').map((sub, si) => (
                                  <p key={si}>{sub}</p>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="border border-slate-900 p-1.5 text-center font-bold font-mono text-xs align-top">
                            {tp.jpAllocation}
                          </td>
                          <td className="border border-slate-900 p-1.5 align-top text-[9px]">
                            {(tp.profilPelajarPancasila || ['Bernalar Kritis', 'Mandiri']).join(', ')}
                          </td>
                          <td className="border border-slate-900 p-1.5 align-top text-[9px]">
                            {tp.rencanaAsesmen || 'Formatif & Sumatif'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 font-bold border-t-2 border-slate-900">
                        <td colSpan={7} className="border border-slate-900 p-2 text-right uppercase font-bold">
                          TOTAL ALOKASI JAM PELAJARAN (JP) YANG DIANALISIS :
                        </td>
                        <td className="border border-slate-900 p-2 text-center font-black font-mono text-xs">
                          {totalJp} JP
                        </td>
                        <td colSpan={2} className="border border-slate-900 p-2 text-left font-bold text-[10px]">
                          Semester 1: {s1JpPrint} JP (Target RPE: {rpeS1NetJpPrint} JP) | Semester 2: {s2JpPrint} JP (Target RPE: {rpeS2NetJpPrint} JP)
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Section IV: Prinsip dan Rasional Alur Pengurutan ATP */}
                <div className="space-y-1 pt-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-1">
                    IV. PRINSIP DAN RASIONAL ALUR PENGURUTAN TUJUAN PEMBELAJARAN (ATP)
                  </h3>
                  <p className="text-[11px] text-slate-800 leading-relaxed text-justify bg-slate-50 p-2.5 border border-slate-300">
                    Alur Tujuan Pembelajaran disusun secara sistematis mengacu pada Panduan Pembelajaran dan Asesmen (PPA) Kurikulum Merdeka. Pengurutan materi memadukan pendekatan Hierarkis (keterampilan prasyarat), Pengurutan dari Konkret ke Abstrak, serta Prosedural bertingkat (scaffolding). Beban jam pelajaran tiap semester telah dihitung secara presisi berdasarkan Rincian Pekan Efektif (RPE) Kalender Pendidikan 2026/2027.
                  </p>
                </div>

                {/* Section V: Panduan KKTP */}
                <div className="space-y-1.5 pt-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-1">
                    V. PANDUAN KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
                  </h3>
                  <div className="grid grid-cols-4 gap-2 text-[10px]">
                    <div className="p-2 border border-slate-400 bg-slate-50">
                      <p className="font-bold text-slate-900">0 – 65% (Perlu Bimbingan)</p>
                      <p className="text-slate-700 mt-0.5">Belum mencapai ketuntasan. Wajib mengikuti remedial seluruh materi pokok terkait.</p>
                    </div>
                    <div className="p-2 border border-slate-400 bg-slate-50">
                      <p className="font-bold text-slate-900">66 – 75% (Cukup)</p>
                      <p className="text-slate-700 mt-0.5">Mencapai batas ketuntasan minimal. Diberikan remedial parsial pada indikator yang lemah.</p>
                    </div>
                    <div className="p-2 border border-slate-400 bg-slate-50">
                      <p className="font-bold text-slate-900">76 – 85% (Baik)</p>
                      <p className="text-slate-700 mt-0.5">Tuntas dengan capaian baik. Dapat melanjutkan ke TP berikutnya secara mandiri.</p>
                    </div>
                    <div className="p-2 border border-slate-400 bg-slate-50">
                      <p className="font-bold text-slate-900">86 – 100% (Sangat Mahir)</p>
                      <p className="text-slate-700 mt-0.5">Tuntas melampaui standar. Diberikan program pengayaan studi kasus lanjutan atau tutor sebaya.</p>
                    </div>
                  </div>
                </div>

                {/* Section VI: Rekomendasi Berdiferensiasi */}
                <div className="space-y-1 pt-1">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-900 pb-1">
                    VI. REKOMENDASI STRATEGI PEMBELAJARAN BERDIFERENSIASI
                  </h3>
                  <p className="text-[11px] text-slate-800 leading-relaxed bg-slate-50 p-2.5 border border-slate-300">
                    Lakukan pemetaan diagnostik awal. Bagi peserta didik dalam kelompok fleksibel (kemampuan dasar, menengah, mahir) dan gunakan bahan ajar multimodal (teks, video, manipulatif).
                  </p>
                </div>
              </div>
            );
          })()}

          {/* 11. BUNDEL LENGKAP 1 TAHUN */}
          {printDocKey === 'bundel' && (
            <div className="space-y-6 font-sans text-xs">
              <div className="text-center">
                <h2 className="text-base font-bold uppercase">BUNDEL LENGKAP PERANGKAT MENGAJAR (1 TAHUN)</h2>
                <p className="text-xs text-slate-600">Kompilasi 10 Berkas Administrasi Lengkap · Berlandaskan KepKa BSKAP No. 046/H/KR/2025, Permendikbudristek No. 12 Tahun 2024, Permendikbudristek Nomor 13 Tahun 2025, dan KMA No. 1503 Tahun 2025</p>
              </div>
              {renderOfficialIdentitasTable(`${schoolProfile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)`)}
              <table className="w-full border-collapse border border-slate-900 text-[11px]">
                <thead>
                  <tr className="bg-slate-100 font-bold uppercase">
                    <th className="border border-slate-900 p-2 text-center w-12">No</th>
                    <th className="border border-slate-900 p-2 text-left">Nama Dokumen dalam Bundel Master</th>
                    <th className="border border-slate-900 p-2 text-center w-32">Status Tabel</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    'Cover & Lembar Pengesahan Resmi (Kepala Sekolah & Guru Pengampu)',
                    `Kalender Pendidikan (${kaldikEvents.length} Agenda) & RPE ${unifiedRpeSnapshot.annualSummary.effectiveWeeks} Pekan (${unifiedRpeSnapshot.annualSummary.effectiveMeetings} Pertemuan / ${unifiedRpeSnapshot.annualSummary.grossJp} JP)`,
                    `Analisis Capaian Pembelajaran (CP) dan Alur Tujuan Pembelajaran (${tujuanPembelajaran.length} TP)`,
                    `Analisis Taksonomi Bloom HOTS (${bloomStats.hotsPercentage}% HOTS) & Matriks 2D Anderson-Krathwohl`,
                    `Program Tahunan (PROTA) & Program Alokasi Waktu TP (${totalProtaJp} JP · ${unifiedRpeSnapshot.tpSummary.totalMeetings} Pertemuan)`,
                    `Program Semester (PROMES) Semester 1 & 2 (${promes.length} Unit Sebaran Mingguan)`,
                    `Modul Ajar Deep Learning (${modulAjarList.length} Bab Unit Lengkap 3 Pilar & Rubrik KKTP)`,
                    `Lembar Kerja Peserta Didik (LKPD) Siap Ajar & Kunci Jawaban (${lkpdList.length} Bab)`,
                    `Buku Nilai & Rekapitulasi Rapor Peserta Didik (${students.length} Siswa)`,
                  ].map((docName, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-900 p-2 text-center font-bold">{idx + 1}</td>
                      <td className="border border-slate-900 p-2 font-semibold">{docName}</td>
                      <td className="border border-slate-900 p-2 text-center font-bold text-emerald-800">Tabel Utuh ✓</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Embedded Kalender Pendidikan & RPE 12 Bulan in Bundel Preview */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-900 pb-1">
                  LAMPIRAN I: ANALISIS MINGGU EFEKTIF &amp; PERTEMUAN EFEKTIF 12 BULAN (RPE)
                </h3>
                <table className="w-full border-collapse border border-slate-900 text-[11px]">
                  <thead>
                    <tr className="bg-emerald-900 text-white font-bold text-[10px] uppercase">
                      <th className="border border-slate-900 p-1.5 text-center w-8">No</th>
                      <th className="border border-slate-900 p-1.5 text-left">Bulan</th>
                      <th className="border border-slate-900 p-1.5 text-center">Jml Mgg</th>
                      <th className="border border-slate-900 p-1.5 text-center">Non-Efektif</th>
                      <th className="border border-slate-900 p-1.5 text-center">Mgg Efektif</th>
                      <th className="border border-slate-900 p-1.5 text-center">Pertemuan</th>
                      <th className="border border-slate-900 p-1.5 text-center">Total JP</th>
                      <th className="border border-slate-900 p-1.5 text-left">Keterangan / Agenda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unifiedRpeSnapshot.twelveMonthRows.map((row) => (
                      <tr key={row.no}>
                        <td className="border border-slate-900 p-1.5 text-center">{row.no}</td>
                        <td className="border border-slate-900 p-1.5 font-bold">{row.month}</td>
                        <td className="border border-slate-900 p-1.5 text-center">{row.totalWeeks}</td>
                        <td className="border border-slate-900 p-1.5 text-center text-rose-700 font-bold">{row.nonEffectiveWeeks}</td>
                        <td className="border border-slate-900 p-1.5 text-center text-emerald-800 font-bold">{row.effectiveWeeks}</td>
                        <td className="border border-slate-900 p-1.5 text-center text-emerald-800 font-bold">{row.effectiveMeetings}</td>
                        <td className="border border-slate-900 p-1.5 text-center text-blue-800 font-bold">{row.effectiveJp} JP</td>
                        <td className="border border-slate-900 p-1.5">{row.note}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 font-bold">
                      <td colSpan={2} className="border border-slate-900 p-2 text-right">JUMLAH TOTAL (12 BULAN)</td>
                      <td className="border border-slate-900 p-2 text-center">{unifiedRpeSnapshot.annualSummary.totalWeeks}</td>
                      <td className="border border-slate-900 p-2 text-center text-rose-700">{unifiedRpeSnapshot.annualSummary.nonEffectiveWeeks}</td>
                      <td className="border border-slate-900 p-2 text-center">{unifiedRpeSnapshot.annualSummary.effectiveWeeks} Mgg</td>
                      <td className="border border-slate-900 p-2 text-center">{unifiedRpeSnapshot.annualSummary.effectiveMeetings} Kali</td>
                      <td className="border border-slate-900 p-2 text-center">{unifiedRpeSnapshot.annualSummary.grossJp} JP</td>
                      <td className="border border-slate-900 p-2">Bersih: {unifiedRpeSnapshot.annualSummary.netJp} JP (Jadwal: {unifiedRpeSnapshot.selectedDays.join(', ')})</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-900 pb-1 pt-2">
                  LAMPIRAN II: ELEMEN CAPAIAN PEMBELAJARAN RESMI BSKAP 046/2025
                </h3>
                <table className="w-full border-collapse border border-slate-900 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-[10px] uppercase">
                      <th className="border border-slate-900 p-2 text-center w-10">No</th>
                      <th className="border border-slate-900 p-2 text-left w-44">Elemen Capaian Pembelajaran</th>
                      <th className="border border-slate-900 p-2 text-left">Deskripsi Resmi Capaian Pembelajaran (BSKAP 046/2025)</th>
                      <th className="border border-slate-900 p-2 text-left w-48">Fokus Kompetensi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cpElements.map((el, idx) => (
                      <tr key={el.id}>
                        <td className="border border-slate-900 p-2 text-center font-bold">{idx + 1}</td>
                        <td className="border border-slate-900 p-2 font-bold">{el.name}</td>
                        <td className="border border-slate-900 p-2">{el.deskripsi}</td>
                        <td className="border border-slate-900 p-2">{el.kompetensi.join(', ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-900 pb-1 pt-2">
                  LAMPIRAN III: MATRIKS ALUR TUJUAN PEMBELAJARAN (ATP) 1 TAHUN AJARAN
                </h3>
                <table className="w-full border-collapse border border-slate-900 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold text-[10px] uppercase">
                      <th className="border border-slate-900 p-2 text-center w-16">Kode TP</th>
                      <th className="border border-slate-900 p-2 text-left w-32">Elemen</th>
                      <th className="border border-slate-900 p-2 text-left">Tujuan Pembelajaran (TP)</th>
                      <th className="border border-slate-900 p-2 text-center w-14">Bloom</th>
                      <th className="border border-slate-900 p-2 text-center w-16">Kategori</th>
                      <th className="border border-slate-900 p-2 text-center w-14">JP</th>
                      <th className="border border-slate-900 p-2 text-center w-14">Smt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tujuanPembelajaran.map((tp) => (
                      <tr key={tp.id}>
                        <td className="border border-slate-900 p-2 text-center font-mono font-bold">{tp.code}</td>
                        <td className="border border-slate-900 p-2">{tp.element}</td>
                        <td className="border border-slate-900 p-2">
                          <p className="font-bold">{tp.materiPokok}</p>
                          <p>{tp.description}</p>
                        </td>
                        <td className="border border-slate-900 p-2 text-center font-mono font-bold">{tp.bloomLevel}</td>
                        <td className="border border-slate-900 p-2 text-center font-bold">{tp.hotsCategory}</td>
                        <td className="border border-slate-900 p-2 text-center font-bold">{tp.jpAllocation} JP</td>
                        <td className="border border-slate-900 p-2 text-center">Smt {tp.semester}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 font-bold">
                      <td colSpan={5} className="border border-slate-900 p-2 text-right">TOTAL ALOKASI JAM PELAJARAN 1 TAHUN</td>
                      <td className="border border-slate-900 p-2 text-center">{totalJp} JP</td>
                      <td className="border border-slate-900 p-2 text-center">Selaras PROTA</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-900 pb-1 pt-2">
                  LAMPIRAN IV: PROGRAM TAHUNAN (PROTA) &amp; PROGRAM ALOKASI WAKTU TP ({totalProtaJp} JP)
                </h3>
                <table className="w-full border-collapse border border-slate-900 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 font-bold">
                      <th className="border border-slate-900 p-2 text-center w-8">No</th>
                      <th className="border border-slate-900 p-2 text-center w-12">Smt</th>
                      <th className="border border-slate-900 p-2">Bab / Lingkup Materi</th>
                      <th className="border border-slate-900 p-2 text-center w-16">Kode</th>
                      <th className="border border-slate-900 p-2">Tujuan Pembelajaran</th>
                      <th className="border border-slate-900 p-2 text-center w-14">Pertemuan</th>
                      <th className="border border-slate-900 p-2 text-center w-14">JP</th>
                      <th className="border border-slate-900 p-2 w-28">Perkiraan Bulan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unifiedRpeSnapshot.tpRows.map((row) => {
                      const matched = prota[row.no - 1];
                      return (
                        <tr key={row.no}>
                          <td className="border border-slate-900 p-2 text-center">{row.no}</td>
                          <td className="border border-slate-900 p-2 text-center">Smt {row.semester}</td>
                          <td className="border border-slate-900 p-2 font-bold">{matched?.babTitle || row.lingkupMateri}</td>
                          <td className="border border-slate-900 p-2 text-center font-mono">{row.tpCode}</td>
                          <td className="border border-slate-900 p-2">{matched?.tpDescription || row.lingkupMateri}</td>
                          <td className="border border-slate-900 p-2 text-center font-bold">{row.jmlPertemuan}</td>
                          <td className="border border-slate-900 p-2 text-center font-bold">{row.alokasiJp} JP</td>
                          <td className="border border-slate-900 p-2">{row.perkiraanBulan}</td>
                        </tr>
                      );
                    })}
                    <tr className="bg-emerald-50 font-bold">
                      <td colSpan={5} className="border border-slate-900 p-2 text-right">TOTAL ALOKASI WAKTU PROTA / TP</td>
                      <td className="border border-slate-900 p-2 text-center">{unifiedRpeSnapshot.tpSummary.totalMeetings}</td>
                      <td className="border border-slate-900 p-2 text-center">{unifiedRpeSnapshot.tpSummary.totalAllocatedJp} JP</td>
                      <td className="border border-slate-900 p-2">
                        {unifiedRpeSnapshot.tpSummary.isBalanced
                          ? 'Seimbang ✓'
                          : `Terpakai ${unifiedRpeSnapshot.tpSummary.totalAllocatedJp}/${unifiedRpeSnapshot.tpSummary.targetEffectiveJp} JP`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Official Signatures Block (for documents other than cover which already has dedicated signatures) */}
          {printDocKey !== 'cover' && (
            <div className="mt-12 pt-6 font-sans text-xs">
              <div className="text-right mb-6 text-slate-600 font-medium">
                {schoolProfile.signaturePlaceDate}
              </div>

              <div className="grid grid-cols-2 gap-8 text-center">
                <div>
                  <p className="text-slate-600">Mengetahui,</p>
                  <p className="font-bold text-slate-900">Kepala Sekolah</p>
                  <div className="my-1.5 flex items-center justify-center h-20">
                    {schoolProfile.headmasterSignatureUrl && (
                      <img
                        src={schoolProfile.headmasterSignatureUrl}
                        alt="Tanda Tangan Kepala Sekolah"
                        width={150}
                        height={75}
                        className="max-h-20 max-w-[180px] object-contain mx-auto"
                      />
                    )}
                  </div>
                  <p className="font-bold text-slate-950 underline">{schoolProfile.headmasterName}</p>
                  <p className="text-[11px] font-mono text-slate-600">
                    {schoolProfile.headmasterIdType || 'NIP'}. {schoolProfile.headmasterNip}
                  </p>
                </div>

                <div>
                  <p className="text-slate-600">Guru Pengampu,</p>
                  <p className="font-bold text-slate-900">Mata Pelajaran {schoolProfile.subject}</p>
                  <div className="my-1.5 flex items-center justify-center h-20">
                    {schoolProfile.teacherSignatureUrl && (
                      <img
                        src={schoolProfile.teacherSignatureUrl}
                        alt="Tanda Tangan Guru"
                        width={150}
                        height={75}
                        className="max-h-20 max-w-[180px] object-contain mx-auto"
                      />
                    )}
                  </div>
                  <p className="font-bold text-slate-950 underline">{schoolProfile.teacherName}</p>
                  <p className="text-[11px] font-mono text-slate-600">
                    {schoolProfile.teacherIdType || 'NIP'}. {schoolProfile.teacherNip}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

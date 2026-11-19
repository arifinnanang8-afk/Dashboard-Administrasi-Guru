import React from 'react';
import { useApp } from '../context/AppContext';
import {
  DownloadCloud,
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  CheckCircle2,
  Package,
} from 'lucide-react';
import {
  exportProtaToExcel,
  exportGradesToExcel,
  exportCpAtpToExcel,
  exportPromesToExcel,
  exportRpeToExcel,
  exportKaldikToExcel,
  exportBloomToExcel,
  exportModulAjarToExcel,
  exportLkpdToExcel,
  exportMasterBundelToExcel,
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
} from '../utils/exporter';

export const PusatUnduhView: React.FC = () => {
  const {
    schoolProfile,
    cpElements,
    rpe,
    prota,
    promes,
    students,
    modulAjarList,
    lkpdList,
    kaldikEvents,
    tujuanPembelajaran,
    setActiveView,
    openPrintModal,
    showNotification,
  } = useApp();

  const cleanSubject = schoolProfile.subject.replace(/\s+/g, '_');
  const cleanYear = schoolProfile.academicYear.replace('/', '-');

  const handleDownloadMasterWord = async () => {
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
      `MASTER_DOKUMEN_1TAHUN_${cleanSubject}_${cleanYear}.docx`
    );
    showNotification(
      'success',
      'Master Bundel 1 Tahun berhasil diunduh dalam format Word (.docx) dengan struktur tabel utuh!'
    );
  };

  const handleDownloadMasterExcel = () => {
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
    showNotification(
      'success',
      'Master Bundel 1 Tahun berhasil diekspor ke Workbook Excel Multi-Sheet (.xlsx)!'
    );
  };

  const downloadList = [
    {
      title: 'Cover, Lembar Pengesahan & Daftar Isi Bundel',
      badge: 'Word, Excel & PDF',
      format: 'DOCX / XLSX / PDF',
      docKey: 'cover' as const,
      onExcel: handleDownloadMasterExcel,
      onWord: async () => {
        await exportCoverAndPengesahanToWord(
          schoolProfile,
          { nomorDokumen: '421.5/082/SMK-M1/2026' },
          `COVER_PENGESAHAN_DAFTAR_ISI_${cleanSubject}_${cleanYear}.docx`
        );
        showNotification('success', 'Cover, Pengesahan & Daftar Isi Word (.docx) berhasil diunduh.');
      },
    },
    {
      title: `Program Tahunan (PROTA) ${prota.reduce((a, b) => a + b.alokasiJp, 0)} JP`,
      badge: 'Word, Excel & PDF',
      format: 'XLSX / DOCX / PDF',
      docKey: 'prota' as const,
      onExcel: () => exportProtaToExcel(prota, schoolProfile),
      onWord: async () => {
        await exportProtaToWord(prota, schoolProfile, `PROTA_${cleanSubject}_${cleanYear}.docx`);
        showNotification('success', 'Tabel PROTA Word (.docx) berhasil diunduh.');
      },
    },
    {
      title: 'Program Semester (PROMES) Semester 1 & 2',
      badge: 'Word, Excel & PDF',
      format: 'XLSX / DOCX / PDF',
      docKey: 'promes' as const,
      onExcel: () => exportPromesToExcel(promes, schoolProfile, 'both'),
      onWord: async () => {
        await exportPromesToWord(promes, schoolProfile, 'both', `PROMES_${cleanSubject}_${cleanYear}.docx`);
        showNotification('success', 'Tabel Matriks PROMES Word (.docx) berhasil diunduh.');
      },
    },
    {
      title: 'Analisis RPE & Program Alokasi Waktu TP (Terpadu)',
      badge: 'Word, Excel & PDF',
      format: 'XLSX / DOCX / PDF',
      docKey: 'rpe' as const,
      onExcel: () => exportRpeToExcel(rpe, schoolProfile, { kaldikEvents, prota, promes }),
      onWord: async () => {
        await exportRpeToWord(
          rpe,
          schoolProfile,
          `RPE_${cleanSubject}_${cleanYear}.docx`,
          { kaldikEvents, prota, promes }
        );
        showNotification('success', 'Dokumen lengkap Kalender & RPE Word (.docx) berhasil diunduh.');
      },
    },
    {
      title: 'Kalender Pendidikan (Kaldik) Tahun Ajaran',
      badge: 'Word, Excel & PDF',
      format: 'XLSX / DOCX / PDF',
      docKey: 'kaldik' as const,
      onExcel: () => exportKaldikToExcel(kaldikEvents, schoolProfile),
      onWord: async () => {
        await exportKaldikToWord(kaldikEvents, schoolProfile, `KALDIK_${cleanSubject}_${cleanYear}.docx`);
        showNotification('success', 'Tabel Kalender Pendidikan Word (.docx) berhasil diunduh.');
      },
    },
    {
      title: 'Analisis CP & Alur Tujuan Pembelajaran (ATP)',
      badge: 'Word, Excel & PDF',
      format: 'XLSX / DOCX / PDF',
      docKey: 'cp_atp' as const,
      onExcel: () => exportCpAtpToExcel(cpElements, tujuanPembelajaran, schoolProfile, rpe),
      onWord: async () => {
        await exportCpAtpToWord(
          cpElements,
          tujuanPembelajaran,
          schoolProfile,
          `ANALISIS_CP_ATP_${cleanSubject}_FASE_${schoolProfile.fase}.docx`
        );
        showNotification('success', 'Tabel Elemen CP & Matriks ATP (.docx) berhasil diunduh.');
      },
    },
    {
      title: 'Analisis Taksonomi Bloom & Matriks 2D HOTS',
      badge: 'Word, Excel & PDF',
      format: 'XLSX / DOCX / PDF',
      docKey: 'bloom' as const,
      onExcel: () => exportBloomToExcel(tujuanPembelajaran, schoolProfile),
      onWord: async () => {
        await exportBloomToWord(tujuanPembelajaran, schoolProfile, `ANALISIS_BLOOM_${cleanSubject}.docx`);
        showNotification('success', 'Tabel Taksonomi Bloom & Matriks 2D Word (.docx) berhasil diunduh.');
      },
    },
    {
      title: `${modulAjarList.length} Modul Ajar Deep Learning & Tabel Rubrik KKTP`,
      badge: 'Word, Excel & PDF',
      format: 'XLSX / DOCX / PDF',
      docKey: 'modul_ajar' as const,
      onExcel: () => exportModulAjarToExcel(modulAjarList, schoolProfile),
      onWord: async () => {
        await exportModulAjarToWord(modulAjarList, schoolProfile, `MODUL_AJAR_LENGKAP_${cleanSubject}.docx`);
        showNotification('success', 'Modul Ajar Deep Learning Word (.docx) berhasil diunduh.');
      },
    },
    {
      title: `${lkpdList.length} Lembar Kerja Peserta Didik (LKPD) + Kunci Jawaban`,
      badge: 'Word, Excel & PDF',
      format: 'XLSX / DOCX / PDF',
      docKey: 'lkpd' as const,
      onExcel: () => exportLkpdToExcel(lkpdList, schoolProfile),
      onWord: async () => {
        await exportLkpdToWord(lkpdList, schoolProfile, `LKPD_LENGKAP_${cleanSubject}.docx`);
        showNotification('success', 'LKPD Lengkap Word (.docx) berhasil diunduh.');
      },
    },
    {
      title: `Rekap Nilai Asesmen & Rapor (${students.length} Siswa)`,
      badge: 'Word, Excel & PDF',
      format: 'DOCX / XLSX / PDF',
      docKey: 'asesmen' as const,
      onExcel: () => exportGradesToExcel(students, schoolProfile),
      onWord: async () => {
        await exportAsesmenToWord(students, schoolProfile, `REKAP_NILAI_RAPOR_${cleanSubject}.docx`);
        showNotification('success', 'Tabel Rekap Nilai Rapor Word (.docx) berhasil diunduh.');
      },
    },
  ];

  return (
    <div className="space-y-6">
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
              <DownloadCloud className="w-5 h-5 text-slate-700" />
              Pusat Unduh Dokumen Lengkap (Word, Excel & PDF)
            </h2>
            <p className="text-xs text-slate-500">
              Unduh Seluruh Berkas Administrasi 1 Tahun Siap Cetak dan Diarsip
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadMasterExcel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor Semua ke Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleDownloadMasterWord}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Package className="w-4 h-4" />
            <span>Unduh Semua ke Word (.docx)</span>
          </button>
        </div>
      </div>

      {/* Grid of Downloadable Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {downloadList.map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm hover:border-emerald-400 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {item.badge}
                </span>
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Siap Unduh
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Format: <span className="font-semibold text-slate-700">{item.format}</span> · Resmi Kurikulum Merdeka
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
              {item.onWord && (
                <button
                  onClick={item.onWord}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold border border-blue-200 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Word (.docx)</span>
                </button>
              )}

              {item.onExcel && (
                <button
                  onClick={item.onExcel}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel (.xlsx)</span>
                </button>
              )}

              <button
                onClick={() => openPrintModal(item.docKey)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer ml-auto"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak A4</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { CpElement, TujuanPembelajaran } from '../types';
import { useApp } from '../context/AppContext';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  Download,
  Sparkles,
  CheckCircle2,
  BookOpen,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import {
  exportCpAtpToExcel,
  exportCpAtpToWord,
  exportPreviewDomToUniversalWord,
  triggerPrint,
} from '../utils/exporter';
import {
  calculateRpeTotals,
  getSubjectRasionalAndCpElements,
  getCompleteBookSourceString,
} from '../utils/curriculumLogic';

interface SmartExportPreviewProps {
  cpElements: CpElement[];
  tujuanPembelajaran: TujuanPembelajaran[];
}

export const SmartExportPreview: React.FC<SmartExportPreviewProps> = ({
  cpElements,
  tujuanPembelajaran,
}) => {
  const {
    schoolProfile,
    rpe,
    selectedBook,
    openPrintModal,
    showNotification,
  } = useApp();

  const s1Rpe = calculateRpeTotals(
    rpe.semester1.months,
    rpe.semester1.jpPerWeek,
    rpe.semester1.cadanganJp
  );
  const s2Rpe = calculateRpeTotals(
    rpe.semester2.months,
    rpe.semester2.jpPerWeek,
    rpe.semester2.cadanganJp
  );
  const rpeS1NetJp = s1Rpe.netJp || 28;
  const rpeS2NetJp = s2Rpe.netJp || 26;

  const { rasional: officialRasional, cpElements: subjectCpElements } =
    getSubjectRasionalAndCpElements(
      schoolProfile.subject,
      schoolProfile.grade,
      schoolProfile.fase,
      selectedBook
    );

  const displayCpElements: CpElement[] =
    cpElements &&
    cpElements.length > 0 &&
    cpElements[0].variasiKeterampilan &&
    cpElements.some((el) =>
      subjectCpElements.some(
        (sel) => sel.name.toLowerCase() === el.name.toLowerCase()
      )
    )
      ? cpElements
      : subjectCpElements;

  const totalJp = tujuanPembelajaran.reduce(
    (a, b) => a + (Number(b.jpAllocation) || 0),
    0
  );
  const s1Jp = tujuanPembelajaran
    .filter((tp) => tp.semester === 1)
    .reduce((a, b) => a + (Number(b.jpAllocation) || 0), 0);
  const s2Jp = tujuanPembelajaran
    .filter((tp) => tp.semester === 2)
    .reduce((a, b) => a + (Number(b.jpAllocation) || 0), 0);

  const bookSourceText =
    selectedBook?.judulBuku || getCompleteBookSourceString(schoolProfile);

  const handleExportPdfPrintModal = () => {
    openPrintModal('cp_atp');
  };

  const handleExportExcel = () => {
    exportCpAtpToExcel(
      displayCpElements,
      tujuanPembelajaran,
      schoolProfile,
      rpe
    );
    showNotification(
      'success',
      'Spreadsheet Analisis CP & ATP (BSKAP 046/2025) berhasil diekspor ke Excel (.xlsx)!'
    );
  };

  const handleDirectPdf = () => {
    triggerPrint();
  };

  const handleExportWordDocx = async () => {
    await exportCpAtpToWord(
      displayCpElements,
      tujuanPembelajaran,
      schoolProfile
    );
    showNotification(
      'success',
      'Dokumen Analisis CP & ATP (BSKAP 046/2025) berhasil diunduh ke Word (.docx)!'
    );
  };

  const handleExportWordExactDom = () => {
    exportPreviewDomToUniversalWord(
      'smart-export-preview-canvas',
      `Smart_Export_CP_ATP_${schoolProfile.subject.replace(/\s+/g, '_')}_${schoolProfile.grade.replace(/\s+/g, '_')}.doc`
    );
    showNotification(
      'success',
      'Dokumen Smart Export Preview Persis Layar (.doc) berhasil diunduh!'
    );
  };

  return (
    <div className="space-y-5">
      {/* Top Synchronized Export Pipeline Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800 no-print">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                SMART EXPORT PREVIEW TERSINKRONISASI
              </span>
              <span className="text-[11px] text-slate-300 font-mono">
                KepKa BSKAP No. 046/H/KR/2025 · Permendikbudristek 12/2024 &amp; 13/2025 · KMA 1503/2025
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Alur Ekspor Tersinkronisasi:{' '}
              <span className="font-bold text-white">
                Ekspor PDF / Cetak → Ekspor Excel → Ekspor PDF → Ekspor Word → Smart Export Preview
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 1. Ekspor PDF / Cetak */}
            <button
              onClick={handleExportPdfPrintModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 text-xs font-bold transition-all cursor-pointer"
              title="Buka Modal Cetak & Pratinjau PDF"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ekspor PDF / Cetak</span>
            </button>

            <ArrowRight className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />

            {/* 2. Ekspor Excel */}
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Unduh File Spreadsheet Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor Excel (.xlsx)</span>
            </button>

            <ArrowRight className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />

            {/* 3. Ekspor PDF */}
            <button
              onClick={handleDirectPdf}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Simpan / Cetak Langsung ke PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Ekspor PDF</span>
            </button>

            <ArrowRight className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />

            {/* 4. Ekspor Word (.docx) */}
            <button
              onClick={handleExportWordDocx}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
              title="Unduh Dokumen Microsoft Word (.docx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Word (.docx)</span>
            </button>

            <ArrowRight className="w-3.5 h-3.5 text-slate-500 hidden sm:block" />

            {/* 5. Smart Export Preview (.doc Persis Layar) */}
            <button
              onClick={handleExportWordExactDom}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold transition-all cursor-pointer shadow-xs"
              title="Unduh Format Word Persis Tampilan Smart Export Preview (.doc)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Export Word (.doc)</span>
            </button>
          </div>
        </div>
      </div>

      {/* A4 Landscape Document Preview Canvas */}
      <div
        id="smart-export-preview-canvas"
        className="bg-white p-8 rounded-2xl border-2 border-slate-300 shadow-lg max-w-6xl mx-auto font-sans text-slate-900 space-y-6"
      >
        {/* Official School Letterhead (Kop Surat) */}
        <div className="border-b-4 border-double border-slate-900 pb-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-600">
            PEMERINTAH REPUBLIK INDONESIA · KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH
          </p>
          <h1 className="text-xl font-black uppercase tracking-wide text-slate-950 mt-0.5">
            {schoolProfile.schoolName}
          </h1>
          <p className="text-[11px] text-slate-600">
            NPSN: {schoolProfile.npsn} · Fase {schoolProfile.fase} ({schoolProfile.grade}) · Tahun Ajaran: {schoolProfile.academicYear}
          </p>
        </div>

        {/* Document Title */}
        <div className="text-center space-y-1">
          <h2 className="text-base font-black uppercase text-slate-950 tracking-tight">
            ANALISIS CAPAIAN PEMBELAJARAN (CP) & ALUR TUJUAN PEMBELAJARAN (ATP)
          </h2>
          <p className="text-xs font-bold text-emerald-800">
            Berdasarkan KepKa BSKAP No. 046/H/KR/2025, Permendikbudristek No. 12 Tahun 2024, Permendikbudristek Nomor 13 Tahun 2025, dan KMA No. 1503 Tahun 2025 · Sumber Resmi: kurikulum.kemendikdasmen.go.id
          </p>
          <p className="text-[11px] text-slate-600 font-semibold">
            Buku Referensi Terpilih: {bookSourceText} ({selectedBook?.penerbit || 'Kemendikdasmen RI'})
          </p>
        </div>

        {/* Official 6-Field Identitas Table */}
        <table className="w-full border-collapse border border-slate-900 text-xs">
          <tbody>
            <tr>
              <td className="border border-slate-900 p-2 font-bold bg-slate-100 w-44">Satuan Pendidikan</td>
              <td className="border border-slate-900 p-2 font-semibold">{schoolProfile.schoolName}</td>
              <td className="border border-slate-900 p-2 font-bold bg-slate-100 w-48">Tahun Ajaran / Semester</td>
              <td className="border border-slate-900 p-2 font-semibold">
                {schoolProfile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)
              </td>
            </tr>
            <tr>
              <td className="border border-slate-900 p-2 font-bold bg-slate-100">Mata Pelajaran</td>
              <td className="border border-slate-900 p-2 font-bold text-emerald-900">{schoolProfile.subject}</td>
              <td className="border border-slate-900 p-2 font-bold bg-slate-100">Guru Penyusun</td>
              <td className="border border-slate-900 p-2 font-semibold">{schoolProfile.teacherName}</td>
            </tr>
            <tr>
              <td className="border border-slate-900 p-2 font-bold bg-slate-100">Fase / Kelas</td>
              <td className="border border-slate-900 p-2 font-semibold">
                Fase {schoolProfile.fase} / {schoolProfile.grade}
              </td>
              <td className="border border-slate-900 p-2 font-bold bg-slate-100">NUPTK Guru</td>
              <td className="border border-slate-900 p-2 font-mono font-semibold">
                {schoolProfile.teacherNuptk || schoolProfile.teacherNip || '-'}
              </td>
            </tr>
          </tbody>
        </table>

        {/* SECTION I: BUKU PILIHAN & ELEMEN CAPAIAN PEMBELAJARAN RESMI BSKAP 046/2025 */}
        <div className="space-y-3">
          <div className="border-b border-slate-900 pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
              I. BUKU PILIHAN (FILTER PENERBIT) & CP/ATP DITERAPKAN — ELEMEN CAPAIAN PEMBELAJARAN RESMI BSKAP 046/2025
            </h3>
            <span className="text-[10px] font-mono font-bold text-emerald-800">
              https://kurikulum.kemendikdasmen.go.id/
            </span>
          </div>

          <table className="w-full border-collapse border border-slate-900 text-[11px]">
            <thead>
              <tr className="bg-emerald-50 text-emerald-950 font-bold uppercase">
                <th className="border border-slate-900 p-2 text-center w-10">No</th>
                <th className="border border-slate-900 p-2 text-left w-48">Elemen Capaian Pembelajaran</th>
                <th className="border border-slate-900 p-2 text-left">
                  Deskripsi Resmi Capaian Pembelajaran (BSKAP 046/2025)
                </th>
                <th className="border border-slate-900 p-2 text-left w-56">Fokus Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {displayCpElements.map((el, idx) => (
                <tr key={`smart-resmi-${el.id}-${idx}`}>
                  <td className="border border-slate-900 p-2 text-center font-bold align-top">{idx + 1}</td>
                  <td className="border border-slate-900 p-2 font-bold text-slate-950 align-top">{el.name}</td>
                  <td className="border border-slate-900 p-2 text-slate-800 leading-relaxed align-top">
                    {el.deskripsi}
                  </td>
                  <td className="border border-slate-900 p-2 text-slate-800 align-top">
                    <ul className="list-disc list-inside space-y-0.5">
                      {el.kompetensi.map((k, ki) => (
                        <li key={ki}>{k}</li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 pt-1">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              RASIONAL & KARAKTERISTIK MATA PELAJARAN ({schoolProfile.subject.toUpperCase()})
            </h4>
            <p className="text-[11px] text-slate-800 leading-relaxed text-justify bg-slate-50 p-3 border border-slate-300">
              {officialRasional}
            </p>
          </div>
        </div>

        {/* SECTION II: ANALISIS PEMETAAN ELEMEN CP KE KOMPETENSI DAN LINGKUP MATERI */}
        <div className="space-y-2">
          <div className="border-b border-slate-900 pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
              II. ANALISIS PEMETAAN ELEMEN CP KE KOMPETENSI DAN LINGKUP MATERI
            </h3>
            <p className="text-[10px] text-slate-600">
              Dekonstruksi kalimat Capaian Pembelajaran resmi (KepKa BSKAP No. 046/H/KR/2025, Permendikbudristek No. 12 Tahun 2024, Permendikbudristek Nomor 13 Tahun 2025, dan KMA No. 1503 Tahun 2025) untuk mengidentifikasi Kata Kerja Operasional (KKO) tingkat kognitif, lingkup materi esensial, serta variasi keterampilan berpikir tingkat tinggi (HOTS).
            </p>
          </div>

          <table className="w-full border-collapse border border-slate-900 text-[11px]">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-950 uppercase">
                <th className="border border-slate-900 p-2 text-center w-10">No</th>
                <th className="border border-slate-900 p-2 text-left w-40">Elemen CP</th>
                <th className="border border-slate-900 p-2 text-left">Kalimat Capaian Pembelajaran (CP)</th>
                <th className="border border-slate-900 p-2 text-left w-48">Kompetensi yang Dituju (KKO)</th>
                <th className="border border-slate-900 p-2 text-left w-48">Lingkup Materi Esensial</th>
                <th className="border border-slate-900 p-2 text-left w-44">Variasi Keterampilan</th>
              </tr>
            </thead>
            <tbody>
              {displayCpElements.map((el, idx) => (
                <tr key={`smart-map-${el.id}-${idx}`}>
                  <td className="border border-slate-900 p-2 text-center font-bold align-top">{idx + 1}</td>
                  <td className="border border-slate-900 p-2 font-bold text-slate-950 align-top">{el.name}</td>
                  <td className="border border-slate-900 p-2 text-slate-800 leading-relaxed align-top">
                    {el.deskripsi}
                  </td>
                  <td className="border border-slate-900 p-2 text-slate-800 align-top">
                    <ul className="list-disc list-inside space-y-0.5">
                      {el.kompetensi.map((k, ki) => (
                        <li key={ki}>{k}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="border border-slate-900 p-2 text-slate-800 align-top">
                    <ul className="list-disc list-inside space-y-0.5">
                      {el.materi.map((m, mi) => (
                        <li key={mi}>{m}</li>
                      ))}
                    </ul>
                  </td>
                  <td className="border border-slate-900 p-2 text-slate-800 align-top">
                    {el.variasiKeterampilan ||
                      'Penalaran kritis, kreativitas pemecahan masalah, dan komunikasi solutif.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* SECTION III: MATRIKS ALUR TUJUAN PEMBELAJARAN (ATP) DAN ALOKASI WAKTU */}
        <div className="space-y-2">
          <div className="border-b border-slate-900 pb-1">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-950">
              III. MATRIKS ALUR TUJUAN PEMBELAJARAN (ATP) DAN ALOKASI WAKTU
            </h3>
            <p className="text-[10px] text-slate-600">
              Alur Tujuan Pembelajaran (ATP) dirancang berurutan secara logis, memuat Indikator Ketercapaian Tujuan Pembelajaran (IKTP / KKTP), KKO Taksonomi Bloom, Materi Pokok & Bab Buku, Alokasi JP, Dimensi Profil Pelajar Pancasila, serta Rencana Asesmen.
            </p>
          </div>

          <table className="w-full border-collapse border border-slate-900 text-[10.5px]">
            <thead>
              <tr className="bg-slate-100 font-bold text-slate-950 uppercase">
                <th className="border border-slate-900 p-1.5 text-center w-8">No</th>
                <th className="border border-slate-900 p-1.5 text-center w-16">Kode / Sem</th>
                <th className="border border-slate-900 p-1.5 text-left w-32">Elemen CP</th>
                <th className="border border-slate-900 p-1.5 text-left">Tujuan Pembelajaran (TP)</th>
                <th className="border border-slate-900 p-1.5 text-left w-44">Indikator Ketercapaian (IKTP)</th>
                <th className="border border-slate-900 p-1.5 text-center w-20">KKO Bloom</th>
                <th className="border border-slate-900 p-1.5 text-left w-48">Materi Pokok & Sub-Materi</th>
                <th className="border border-slate-900 p-1.5 text-center w-12">JP</th>
                <th className="border border-slate-900 p-1.5 text-left w-28">Profil Pelajar Pancasila</th>
                <th className="border border-slate-900 p-1.5 text-left w-36">Rencana Asesmen & Media</th>
              </tr>
            </thead>
            <tbody>
              {tujuanPembelajaran.map((tp, idx) => {
                const officialElement =
                  displayCpElements.find(
                    (el) => el.name.toLowerCase() === (tp.element || '').toLowerCase()
                  ) ||
                  displayCpElements[idx % displayCpElements.length] ||
                  displayCpElements[0];
                const activeElementName = officialElement ? officialElement.name : tp.element;

                return (
                  <tr key={`smart-tp-${tp.id}-${idx}`}>
                    <td className="border border-slate-900 p-1.5 text-center font-bold align-top">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-900 p-1.5 text-center align-top font-mono font-bold">
                      {tp.code}
                      <span className="block text-[9px] font-sans text-amber-900 font-bold">
                        Smt {tp.semester}
                      </span>
                    </td>
                    <td className="border border-slate-900 p-1.5 font-bold text-slate-900 align-top">
                      {activeElementName}
                    </td>
                    <td className="border border-slate-900 p-1.5 text-slate-800 leading-relaxed align-top">
                      {tp.description}
                    </td>
                    <td className="border border-slate-900 p-1.5 text-slate-700 leading-snug align-top">
                      {tp.indikatorKinerja ||
                        '• Siswa dapat memecahkan soal studi kasus dengan analisis dan kalkulasi tepat.'}
                    </td>
                    <td className="border border-slate-900 p-1.5 text-center align-top font-mono font-bold">
                      <span className="block text-indigo-900">{tp.bloomLevel}</span>
                      <span className="block text-[9px] font-sans text-rose-800">
                        {tp.hotsCategory}
                      </span>
                    </td>
                    <td className="border border-slate-900 p-1.5 text-slate-800 align-top">
                      <p className="font-bold text-slate-950">{tp.materiPokok}</p>
                      <p className="text-[9.5px] font-bold text-emerald-800">
                        {tp.babId ? `Bab ${tp.babId.replace('bab-', '')}` : `Bab ${idx + 1}`}
                      </p>
                      {tp.subMateri && (
                        <div className="text-[9.5px] text-slate-600 mt-0.5">
                          {tp.subMateri.split('\n').map((sub, si) => (
                            <p key={si}>{sub}</p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="border border-slate-900 p-1.5 text-center font-bold font-mono text-xs align-top">
                      {tp.jpAllocation}
                    </td>
                    <td className="border border-slate-900 p-1.5 align-top text-[9.5px]">
                      {(tp.profilPelajarPancasila || ['Bernalar Kritis', 'Mandiri']).join(', ')}
                    </td>
                    <td className="border border-slate-900 p-1.5 align-top text-[9.5px]">
                      {tp.rencanaAsesmen || 'Formatif & Sumatif'}
                    </td>
                  </tr>
                );
              })}
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
                  Semester 1: {s1Jp} JP (Target RPE: {rpeS1NetJp} JP) | Semester 2: {s2Jp} JP (Target RPE: {rpeS2NetJp} JP)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* SECTION IV: PRINSIP DAN RASIONAL ALUR PENGURUTAN ATP */}
        <div className="space-y-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 border-b border-slate-900 pb-1">
            IV. PRINSIP DAN RASIONAL ALUR PENGURUTAN TUJUAN PEMBELAJARAN (ATP)
          </h3>
          <p className="text-[11px] text-slate-800 leading-relaxed text-justify bg-slate-50 p-2.5 border border-slate-300">
            Alur Tujuan Pembelajaran disusun secara sistematis mengacu pada Panduan Pembelajaran dan Asesmen (PPA) Kurikulum Merdeka. Pengurutan materi memadukan pendekatan Hierarkis (keterampilan prasyarat), Pengurutan dari Konkret ke Abstrak, serta Prosedural bertingkat (scaffolding). Beban jam pelajaran tiap semester telah dihitung secara presisi berdasarkan Rincian Pekan Efektif (RPE) Kalender Pendidikan {schoolProfile.academicYear}.
          </p>
        </div>

        {/* SECTION V: PANDUAN KKTP */}
        <div className="space-y-1.5">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 border-b border-slate-900 pb-1">
            V. PANDUAN KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[10px]">
            <div className="p-2 border border-slate-400 bg-rose-50/40">
              <p className="font-bold text-rose-950">0 – 65% (Perlu Bimbingan)</p>
              <p className="text-slate-700 mt-0.5">
                Belum mencapai ketuntasan. Wajib mengikuti remedial seluruh materi pokok terkait.
              </p>
            </div>
            <div className="p-2 border border-slate-400 bg-amber-50/40">
              <p className="font-bold text-amber-950">66 – 75% (Cukup)</p>
              <p className="text-slate-700 mt-0.5">
                Mencapai batas ketuntasan minimal. Diberikan remedial parsial pada indikator yang lemah.
              </p>
            </div>
            <div className="p-2 border border-slate-400 bg-emerald-50/40">
              <p className="font-bold text-emerald-950">76 – 85% (Baik)</p>
              <p className="text-slate-700 mt-0.5">
                Tuntas dengan capaian baik. Dapat melanjutkan ke TP berikutnya secara mandiri.
              </p>
            </div>
            <div className="p-2 border border-slate-400 bg-sky-50/40">
              <p className="font-bold text-sky-950">86 – 100% (Sangat Mahir)</p>
              <p className="text-slate-700 mt-0.5">
                Tuntas melampaui standar. Diberikan program pengayaan studi kasus lanjutan atau tutor sebaya.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION VI: REKOMENDASI STRATEGI PEMBELAJARAN BERDIFERENSIASI */}
        <div className="space-y-1">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-950 border-b border-slate-900 pb-1">
            VI. REKOMENDASI STRATEGI PEMBELAJARAN BERDIFERENSIASI
          </h3>
          <p className="text-[11px] text-slate-800 leading-relaxed bg-slate-50 p-2.5 border border-slate-300">
            Lakukan pemetaan diagnostik awal. Bagi peserta didik dalam kelompok fleksibel (kemampuan dasar, menengah, mahir) dan gunakan bahan ajar multimodal (teks, video, manipulatif).
          </p>
        </div>

        {/* Official Signatures Block */}
        <div className="pt-6 text-xs">
          <div className="text-right mb-4 text-slate-700 font-medium">
            {schoolProfile.signaturePlaceDate}
          </div>
          <div className="grid grid-cols-2 gap-8 text-center">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900">Kepala Sekolah</p>
              <div className="h-16 flex items-center justify-center my-1">
                {schoolProfile.headmasterSignatureUrl && (
                  <img
                    src={schoolProfile.headmasterSignatureUrl}
                    alt="Tanda Tangan Kepala Sekolah"
                    className="max-h-16 object-contain mx-auto"
                  />
                )}
              </div>
              <p className="font-bold text-slate-950 underline">{schoolProfile.headmasterName}</p>
              <p className="text-[11px] font-mono text-slate-600">
                {schoolProfile.headmasterIdType || 'NIP'}. {schoolProfile.headmasterNip}
              </p>
            </div>
            <div>
              <p className="text-slate-600">Guru Penyusun,</p>
              <p className="font-bold text-slate-900">Mata Pelajaran {schoolProfile.subject}</p>
              <div className="h-16 flex items-center justify-center my-1">
                {schoolProfile.teacherSignatureUrl && (
                  <img
                    src={schoolProfile.teacherSignatureUrl}
                    alt="Tanda Tangan Guru"
                    className="max-h-16 object-contain mx-auto"
                  />
                )}
              </div>
              <p className="font-bold text-slate-950 underline">{schoolProfile.teacherName}</p>
              <p className="text-[11px] font-mono text-slate-600">
                NUPTK. {schoolProfile.teacherNuptk || schoolProfile.teacherNip}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

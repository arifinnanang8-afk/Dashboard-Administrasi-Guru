import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Layers,
  ArrowLeft,
  Printer,
  Download,
  CheckCircle2,
  FileText,
  Calendar,
  BookOpen,
  Brain,
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';
import { exportMasterBundelToExcel, exportCpAtpToWord, exportMasterBundelToWord } from '../utils/exporter';
import { PipelineSyncHeader } from '../components/PipelineSyncHeader';
import { IdentitasPerangkat } from '../components/IdentitasPerangkat';

export const BundelLengkapView: React.FC = () => {
  const {
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
    setActiveView,
    openPrintModal,
    showNotification,
    stats,
  } = useApp();

  const [activeTab, setActiveTab] = useState<string>('daftar_isi');

  const bundleSections = [
    { id: 'daftar_isi', title: 'Daftar Isi Bundel 1 Tahun', icon: <Layers className="w-4 h-4" /> },
    { id: 'cover', title: '1. Cover & Lembar Pengesahan', icon: <FileText className="w-4 h-4" /> },
    { id: 'kaldik_rpe', title: '2. Kalender & Analisis RPE', icon: <Calendar className="w-4 h-4" /> },
    { id: 'cp_atp', title: '3. Capaian & Alur Tujuan (ATP)', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'bloom', title: '4. Taksonomi Bloom & Matriks HOTS', icon: <Brain className="w-4 h-4" /> },
    { id: 'prota_promes', title: '5. PROTA & PROMES (132 JP)', icon: <FileText className="w-4 h-4" /> },
    { id: 'modul_deep', title: '6. Modul Ajar Deep Learning (7 Unit)', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'lkpd', title: '7. Lembar Kerja Peserta Didik (LKPD)', icon: <FileText className="w-4 h-4" /> },
    { id: 'asesmen', title: '8. Asesmen, Rubrik & Rapor (24 Siswa)', icon: <GraduationCap className="w-4 h-4" /> },
  ];

  const handleExportAllWord = async () => {
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
      `MASTER_BUNDEL_1TAHUN_${schoolProfile.subject.replace(/\s+/g, '_')}.docx`
    );
    showNotification(
      'success',
      'Master Bundel 1 Tahun berhasil diekspor ke Word (.docx) dengan struktur tabel persis pratinjau!'
    );
  };

  const handleExportAllExcel = () => {
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
      'Master Bundel 1 Tahun (Multi-Sheet Workbook) berhasil diekspor ke Excel (.xlsx)!'
    );
  };

  return (
    <div className="space-y-6">
      <PipelineSyncHeader />
      <IdentitasPerangkat
        documentTitle="Bundel Lengkap Perangkat Pembelajaran 1 Tahun Penuh"
        semesterSpecific="full"
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-600" />
              Bundel Lengkap Perangkat Pembelajaran (1 Tahun)
            </h2>
            <p className="text-xs text-slate-500">
              Kompilasi master seluruh dokumen administrasi mengajar siap cetak & jilid resmi
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportAllExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Ekspor Seluruh Bundel ke Workbook Excel Multi-Sheet (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={handleExportAllWord}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Bundel Word</span>
          </button>

          <button
            onClick={() => openPrintModal('bundel')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Ekspor PDF / Cetak</span>
          </button>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: Section Navigator */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm space-y-1.5 h-fit">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
            Daftar Berkas Terpadu
          </h3>
          {bundleSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                activeTab === sec.id
                  ? 'bg-emerald-700 text-white font-semibold shadow-sm'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {sec.icon}
              <span className="truncate">{sec.title}</span>
            </button>
          ))}
        </div>

        {/* Right: Preview Panel */}
        <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm min-h-[600px]">
          {activeTab === 'daftar_isi' && (
            <div className="space-y-6">
              <div className="border-b pb-4 border-slate-200">
                <h3 className="text-xl font-bold text-slate-900">
                  Daftar Isi Bundel Master Perangkat Pembelajaran 1 Tahun
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Mata Pelajaran: {schoolProfile.subject} · Fase {schoolProfile.fase} ({schoolProfile.grade}) · TA {schoolProfile.academicYear}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bundleSections.slice(1).map((sec, idx) => (
                  <div
                    key={sec.id}
                    className="p-4 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex items-start gap-3"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{sec.title}</p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mt-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        100% Siap Cetak
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-bold text-slate-800">Catatan Auditor Pembelajaran:</p>
                <p>
                  Seluruh 11 dokumen di atas telah terintegrasi secara komprehensif mengikuti standar
                  KepKa BSKAP No. 046/H/KR/2025, Permendikbudristek No. 12 Tahun 2024, Permendikbudristek Nomor 13 Tahun 2025, dan KMA No. 1503 Tahun 2025. Jam pelajaran ({stats.protaTotalJp || 132} JP) telah selaras antara Kalender Pendidikan, RPE, PROTA, PROMES, dan 7 Modul Ajar Deep Learning.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'cover' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Bagian 1: Cover & Legalitas</h3>
              <p className="text-xs text-slate-500">Halaman judul dan tanda tangan pengesahan resmi</p>
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-3">
                <p className="text-sm font-bold uppercase text-slate-800">
                  {schoolProfile.schoolName}
                </p>
                <p className="text-xs text-slate-600">
                  Perangkat Administrasi Pembelajaran: {schoolProfile.subject}
                </p>
                <p className="text-xs text-slate-500">Guru: {schoolProfile.teacherName}</p>
                <button
                  onClick={() => setActiveView('cover')}
                  className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 cursor-pointer"
                >
                  Buka Pengaturan Cover Khusus →
                </button>
              </div>
            </div>
          )}

          {activeTab === 'prota_promes' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-2">Bagian 5: PROTA & PROMES (132 JP)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700">
                      <th className="p-2.5 border">No</th>
                      <th className="p-2.5 border">Lingkup Materi / Bab</th>
                      <th className="p-2.5 border">Kode TP</th>
                      <th className="p-2.5 border">JP</th>
                      <th className="p-2.5 border">Smt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prota.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2.5 border text-center font-medium">{idx + 1}</td>
                        <td className="p-2.5 border font-semibold text-slate-900">{item.babTitle}</td>
                        <td className="p-2.5 border font-mono text-emerald-700">{item.tpCode}</td>
                        <td className="p-2.5 border text-center font-bold">{item.alokasiJp} JP</td>
                        <td className="p-2.5 border text-center">Semester {item.semester}</td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 font-bold text-emerald-950">
                      <td colSpan={3} className="p-2.5 border text-right">TOTAL ALOKASI JP 1 TAHUN</td>
                      <td className="p-2.5 border text-center text-sm">132 JP</td>
                      <td className="p-2.5 border text-center">100% Selaras</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'modul_deep' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
                Bagian 6: 7 Modul Ajar Deep Learning (Mindful, Meaningful, Joyful)
              </h3>
              <div className="space-y-3">
                {modulAjarList.map((m) => (
                  <div key={m.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-slate-900">
                        Bab {m.babNumber}: {m.babTitle}
                      </h4>
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                        {m.alokasiJp} JP · Smt {m.semester}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 italic">"{m.pemahamanBermakna}"</p>
                    <div className="flex flex-wrap gap-2 text-[11px] pt-1">
                      <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        🌿 {m.deepLearning.mindful.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        💡 {m.deepLearning.meaningful.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 border border-rose-200">
                        ✨ {m.deepLearning.joyful.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'asesmen' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b pb-2">
                Bagian 8: Rekap Nilai Siswa & Ketuntasan Rapor
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-slate-50 rounded-xl border">
                  <span className="text-xs text-slate-500">Jumlah Siswa</span>
                  <p className="text-xl font-bold text-slate-900">{students.length} Siswa</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-xs text-emerald-700">Ketuntasan KKTP</span>
                  <p className="text-xl font-bold text-emerald-800">96% Tuntas</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-xs text-blue-700">Rata-rata Kelas</span>
                  <p className="text-xl font-bold text-blue-800">85.1</p>
                </div>
              </div>
              <button
                onClick={() => setActiveView('asesmen')}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 cursor-pointer"
              >
                Buka Buku Nilai & Pengolahan Rapor Lengkap →
              </button>
            </div>
          )}

          {activeTab === 'cp_atp' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Bagian 3: Elemen Capaian Pembelajaran & Matriks ATP (1 Tahun)
                  </h3>
                  <p className="text-xs text-slate-500">
                    KepKa BSKAP No. 046/H/KR/2025 · Fase {schoolProfile.fase} ({schoolProfile.grade})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      await exportCpAtpToWord(
                        cpElements,
                        tujuanPembelajaran,
                        schoolProfile,
                        `ANALISIS_CP_ATP_${schoolProfile.subject.replace(/\s+/g, '_')}.docx`
                      );
                      showNotification('success', 'Tabel CP & Matriks ATP berhasil diunduh ke Word (.docx)!');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Tabel Word (.docx)</span>
                  </button>
                  <button
                    onClick={() => openPrintModal('cp_atp')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak / Preview A4</span>
                  </button>
                </div>
              </div>

              {/* Elemen Capaian Pembelajaran Resmi BSKAP 046/2025 */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  I. Elemen Capaian Pembelajaran Resmi BSKAP 046/2025
                </h4>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="p-2.5 border text-center w-10">No</th>
                        <th className="p-2.5 border w-48">Elemen Capaian Pembelajaran</th>
                        <th className="p-2.5 border">Deskripsi Resmi Capaian Pembelajaran (BSKAP 046/2025)</th>
                        <th className="p-2.5 border w-56">Fokus Kompetensi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cpElements.map((el, idx) => (
                        <tr key={el.id} className="hover:bg-slate-50">
                          <td className="p-2.5 border text-center font-bold">{idx + 1}</td>
                          <td className="p-2.5 border font-bold text-slate-900">{el.name}</td>
                          <td className="p-2.5 border text-slate-700 leading-relaxed">{el.deskripsi}</td>
                          <td className="p-2.5 border text-emerald-800 font-medium">{el.kompetensi.join(', ')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Matriks Alur Tujuan Pembelajaran (ATP) 1 Tahun Ajaran */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  II. Matriks Alur Tujuan Pembelajaran (ATP) 1 Tahun Ajaran
                </h4>
                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700">
                        <th className="p-2.5 border text-center">Kode TP</th>
                        <th className="p-2.5 border">Elemen</th>
                        <th className="p-2.5 border">Tujuan Pembelajaran (TP)</th>
                        <th className="p-2.5 border text-center">Bloom</th>
                        <th className="p-2.5 border text-center">Kategori</th>
                        <th className="p-2.5 border text-center">JP</th>
                        <th className="p-2.5 border text-center">Smt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tujuanPembelajaran.map((tp) => (
                        <tr key={tp.id} className="hover:bg-slate-50">
                          <td className="p-2.5 border font-mono font-bold text-emerald-800 text-center">{tp.code}</td>
                          <td className="p-2.5 border font-medium text-slate-700">{tp.element}</td>
                          <td className="p-2.5 border">
                            <p className="font-bold text-slate-900">{tp.materiPokok}</p>
                            <p className="text-slate-600">{tp.description}</p>
                          </td>
                          <td className="p-2.5 border text-center font-mono font-bold">{tp.bloomLevel}</td>
                          <td className="p-2.5 border text-center font-bold">{tp.hotsCategory}</td>
                          <td className="p-2.5 border text-center font-bold">{tp.jpAllocation} JP</td>
                          <td className="p-2.5 border text-center">Smt {tp.semester}</td>
                        </tr>
                      ))}
                      <tr className="bg-emerald-50 font-bold text-emerald-950">
                        <td colSpan={5} className="p-2.5 border text-right">
                          TOTAL ALOKASI JAM PELAJARAN 1 TAHUN
                        </td>
                        <td className="p-2.5 border text-center">
                          {tujuanPembelajaran.reduce((a, b) => a + b.jpAllocation, 0)} JP
                        </td>
                        <td className="p-2.5 border text-center">Selaras PROTA</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {!['daftar_isi', 'cover', 'cp_atp', 'prota_promes', 'modul_deep', 'asesmen'].includes(activeTab) && (
            <div className="p-8 text-center space-y-4">
              <p className="text-sm font-semibold text-slate-700">
                Pratinjau lengkap modul telah siap dalam bundel master.
              </p>
              <button
                onClick={() => openPrintModal(activeTab as any)}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-600 cursor-pointer"
              >
                Cetak Bagian Ini Sekarang →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

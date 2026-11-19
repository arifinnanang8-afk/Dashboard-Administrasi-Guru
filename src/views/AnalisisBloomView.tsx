import React from 'react';
import { useApp } from '../context/AppContext';
import { Brain, ArrowLeft, Printer, CheckCircle2, TrendingUp, AlertTriangle, Download, FileSpreadsheet } from 'lucide-react';
import { exportBloomToWord, exportBloomToExcel } from '../utils/exporter';

export const AnalisisBloomView: React.FC = () => {
  const { stats, tujuanPembelajaran, schoolProfile, setActiveView, openPrintModal, showNotification } = useApp();

  const cognitiveLevels = [
    { code: 'C1', name: 'Mengingat (Remembering)', desc: 'Mengenali dan mengingat kembali fakta, istilah, dan konsep.', category: 'LOTS', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { code: 'C2', name: 'Memahami (Understanding)', desc: 'Menjelaskan gagasan, mengklasifikasi, dan merangkum makna.', category: 'LOTS', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { code: 'C3', name: 'Menerapkan (Applying)', desc: 'Menggunakan prosedur, aturan, atau konsep dalam situasi baru.', category: 'MOTS', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { code: 'C4', name: 'Menganalisis (Analyzing)', desc: 'Memecah materi menjadi bagian-bagian dan mendeteksi keterkaitan.', category: 'HOTS', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    { code: 'C5', name: 'Mengevaluasi (Evaluating)', desc: 'Membuat pertimbangan nilai berdasarkan kriteria dan standar baku.', category: 'HOTS', color: 'bg-rose-50 text-rose-700 border-rose-200' },
    { code: 'C6', name: 'Mencipta (Creating)', desc: 'Menyusun elemen menjadi struktur baru yang koheren dan orisinal.', category: 'HOTS', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ];

  const lotsCount = tujuanPembelajaran.filter((tp) => ['C1', 'C2'].includes(tp.bloomLevel)).length;
  const motsCount = tujuanPembelajaran.filter((tp) => tp.bloomLevel === 'C3').length;
  const hotsCount = tujuanPembelajaran.filter((tp) => ['C4', 'C5', 'C6'].includes(tp.bloomLevel)).length;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
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
              <Brain className="w-5 h-5 text-purple-600" />
              Analisis Taksonomi Bloom & Matriks Nalar Tinggi (HOTS)
            </h2>
            <p className="text-xs text-slate-500">
              Evaluasi tingkat kognitif C1–C6 dan Matriks 2 Dimensi Anderson-Krathwohl
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              exportBloomToExcel(tujuanPembelajaran, schoolProfile);
              showNotification('success', 'Analisis Taksonomi Bloom & HOTS berhasil diekspor ke Excel (.xlsx)!');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Ekspor Analisis Taksonomi Bloom ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={async () => {
              await exportBloomToWord(
                tujuanPembelajaran,
                schoolProfile,
                `ANALISIS_TAKSONOMI_BLOOM_HOTS_${schoolProfile.subject.replace(/\s+/g, '_')}.docx`
              );
              showNotification('success', 'Tabel Analisis Bloom & Matriks 2D berhasil diunduh ke Word (.docx)!');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Word</span>
          </button>

          <button
            onClick={() => openPrintModal('bloom')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Cetak Laporan Bloom atau Ekspor ke PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Ekspor PDF / Cetak</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* HOTS Card */}
        <div className="bg-gradient-to-br from-purple-900 to-indigo-950 text-white p-5 rounded-2xl border border-purple-500/30 shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-200 uppercase tracking-wider">
              Persentase HOTS (C4–C6)
            </span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black">{stats.bloomHotsPct}%</span>
            <span className="text-xs text-purple-200 font-semibold">
              ({hotsCount} dari {tujuanPembelajaran.length} TP)
            </span>
          </div>
          <p className="text-xs text-purple-100/80 leading-relaxed">
            Predikat: <span className="font-bold text-white">Sangat Baik</span>. Telah melampaui batas minimal 50% rekomendasi Kemendikdasmen untuk fase kejuruan.
          </p>
        </div>

        {/* MOTS Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tingkat Menengah (MOTS - C3)
          </span>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-3xl font-black text-amber-600">
              {Math.round((motsCount / tujuanPembelajaran.length) * 100)}%
            </span>
            <span className="text-xs text-slate-500 font-medium">({motsCount} TP)</span>
          </div>
          <p className="text-xs text-slate-600">
            Fokus pada penerapan taktik negosiasi langsung di lingkungan bisnis nyata.
          </p>
        </div>

        {/* LOTS Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tingkat Dasar (LOTS - C1/C2)
          </span>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-3xl font-black text-blue-600">
              {Math.round((lotsCount / tujuanPembelajaran.length) * 100)}%
            </span>
            <span className="text-xs text-slate-500 font-medium">({lotsCount} TP)</span>
          </div>
          <p className="text-xs text-slate-600">
            Fondasi konseptual tata argumentasi debat dan struktur teks dasar.
          </p>
        </div>
      </div>

      {/* 6 Cognitive Levels Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">
          Pemetaan 6 Tingkat Kognitif Taksonomi Bloom Revisi
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {cognitiveLevels.map((lvl) => {
            const matchingTps = tujuanPembelajaran.filter((tp) => tp.bloomLevel === lvl.code);
            return (
              <div
                key={lvl.code}
                className={`p-4 rounded-xl border ${lvl.color} flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono font-black text-sm">{lvl.code}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/80 border">
                      {lvl.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs mb-1 text-slate-900">{lvl.name}</h4>
                  <p className="text-[11px] text-slate-600 leading-snug">{lvl.desc}</p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-200/60 text-[11px]">
                  <span className="font-semibold text-slate-700">Tujuan Terkait: </span>
                  {matchingTps.length > 0 ? (
                    <span className="font-mono font-bold text-slate-900">
                      {matchingTps.map((t) => t.code).join(', ')}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">Tidak ada</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Anderson-Krathwohl 2D Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">
            Matriks 2 Dimensi Anderson-Krathwohl (Proses Kognitif x Dimensi Pengetahuan)
          </h3>
          <p className="text-xs text-slate-500">
            Pemetaan sebaran Tujuan Pembelajaran (TP) pada domain pengetahuan faktual, konseptual, prosedural, dan metakognitif
          </p>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-center text-xs border border-slate-200 border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold">
                <th className="p-2.5 border text-left">Dimensi Pengetahuan</th>
                <th className="p-2.5 border">C1 Mengingat</th>
                <th className="p-2.5 border">C2 Memahami</th>
                <th className="p-2.5 border">C3 Menerapkan</th>
                <th className="p-2.5 border">C4 Menganalisis</th>
                <th className="p-2.5 border">C5 Mengevaluasi</th>
                <th className="p-2.5 border">C6 Mencipta</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2.5 border text-left font-semibold bg-slate-50">1. Faktual</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border font-mono font-bold text-blue-700">TP 10.7</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border">-</td>
              </tr>
              <tr>
                <td className="p-2.5 border text-left font-semibold bg-slate-50">2. Konseptual</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border font-mono font-bold text-purple-700">TP 10.3</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border">-</td>
              </tr>
              <tr>
                <td className="p-2.5 border text-left font-semibold bg-slate-50">3. Prosedural</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border font-mono font-bold text-amber-700">TP 10.4</td>
                <td className="p-2.5 border font-mono font-bold text-purple-700">TP 10.1, TP 10.6</td>
                <td className="p-2.5 border font-mono font-bold text-rose-700">TP 10.2</td>
                <td className="p-2.5 border font-mono font-bold text-emerald-700">TP 10.5</td>
              </tr>
              <tr>
                <td className="p-2.5 border text-left font-semibold bg-slate-50">4. Metakognitif</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border">-</td>
                <td className="p-2.5 border text-emerald-700 font-semibold">Refleksi LHO</td>
                <td className="p-2.5 border text-emerald-700 font-semibold">Refleksi Anekdot</td>
                <td className="p-2.5 border text-emerald-700 font-semibold">Deep Learning</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

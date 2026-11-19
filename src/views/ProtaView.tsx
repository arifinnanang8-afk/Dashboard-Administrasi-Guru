import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  FileSpreadsheet,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Download,
  CheckCircle2,
  RefreshCw,
  Grid3X3,
  ArrowRight,
  CalendarCheck2,
  Sparkles,
  AlertCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { ProtaItem } from '../types';
import { exportProtaToExcel, exportProtaToWord } from '../utils/exporter';
import { PipelineSyncHeader } from '../components/PipelineSyncHeader';
import { IdentitasPerangkat } from '../components/IdentitasPerangkat';
import {
  buildPromesFromProta,
  formatPromesWeekSummary,
} from '../utils/curriculumLogic';

export const ProtaView: React.FC = () => {
  const {
    prota,
    promes,
    rpe,
    updateProtaItem,
    addProtaItem,
    deleteProtaItem,
    syncProtaToPromes,
    schoolProfile,
    setActiveView,
    openPrintModal,
    showNotification,
  } = useApp();

  const [isSyncPanelOpen, setIsSyncPanelOpen] = useState<boolean>(true);
  const [syncMode, setSyncMode] = useState<'auto_rpe' | 'preserve_custom'>('auto_rpe');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('Tersinkron Otomatis');
  const [editingItem, setEditingItem] = useState<ProtaItem | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState<Partial<ProtaItem>>({
    semester: 1,
    babNumber: prota.length + 1,
    babTitle: '',
    tpCode: `TP 10.${prota.length + 1}`,
    tpDescription: '',
    alokasiJp: 16,
    keterangan: 'Formatif & Sumatif',
  });

  const totalJp = prota.reduce((acc, p) => acc + (p.alokasiJp || 0), 0);
  const s1ProtaJp = prota
    .filter((p) => p.semester === 1)
    .reduce((a, b) => a + (b.alokasiJp || 0), 0);
  const s2ProtaJp = prota
    .filter((p) => p.semester === 2)
    .reduce((a, b) => a + (b.alokasiJp || 0), 0);

  // Calculate live PROMES alignment status
  const promesAlignment = useMemo(() => {
    const promesTotalJp = promes.reduce((acc, p) => acc + (p.alokasiJp || 0), 0);
    const promesDistributedJp = promes.reduce(
      (acc, p) =>
        acc +
        Object.values(p.distribution || {}).reduce((sum, v) => sum + (Number(v) || 0), 0),
      0
    );

    const previewSyncedPromes = buildPromesFromProta(prota, rpe, promes, syncMode);

    const rowStatuses = prota.map((pItem) => {
      const matchedCurrent = promes.find(
        (pm) =>
          pm.tpCode === pItem.tpCode ||
          pm.id === pItem.id.replace('prota-', 'promes-')
      );
      const matchedPreview = previewSyncedPromes.find(
        (pm) =>
          pm.tpCode === pItem.tpCode ||
          pm.id === pItem.id.replace('prota-', 'promes-')
      );

      const currentDistributedJp = matchedCurrent
        ? Object.values(matchedCurrent.distribution || {}).reduce(
            (sum, v) => sum + (Number(v) || 0),
            0
          )
        : 0;

      const isRowSynced =
        Boolean(matchedCurrent) &&
        matchedCurrent!.semester === pItem.semester &&
        matchedCurrent!.alokasiJp === pItem.alokasiJp &&
        currentDistributedJp === pItem.alokasiJp;

      return {
        protaItem: pItem,
        matchedCurrent,
        matchedPreview,
        currentDistributedJp,
        isRowSynced,
        weekSummary: formatPromesWeekSummary(
          matchedCurrent?.distribution || matchedPreview?.distribution
        ),
        previewWeekSummary: formatPromesWeekSummary(matchedPreview?.distribution),
      };
    });

    const allRowsSynced =
      prota.length === promes.length &&
      rowStatuses.every((r) => r.isRowSynced);

    return {
      promesTotalJp,
      promesDistributedJp,
      rowStatuses,
      allRowsSynced,
      SyncedCount: rowStatuses.filter((r) => r.isRowSynced).length,
    };
  }, [prota, promes, rpe, syncMode]);

  const handleRunSync = (navigateAfter: boolean = false) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setLastSyncedAt(`Terakhir disinkronkan pukul ${timeStr}`);
    syncProtaToPromes(syncMode, navigateAfter);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    updateProtaItem(editingItem);
    setEditingItem(null);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.babTitle || !newItem.tpDescription) {
      showNotification('error', 'Judul Bab dan Deskripsi wajib diisi.');
      return;
    }
    const created: ProtaItem = {
      id: `prota-${Date.now()}`,
      semester: Number(newItem.semester) || 1,
      babNumber: Number(newItem.babNumber) || prota.length + 1,
      babTitle: newItem.babTitle || '',
      tpCode: newItem.tpCode || `TP 10.${prota.length + 1}`,
      tpDescription: newItem.tpDescription || '',
      alokasiJp: Number(newItem.alokasiJp) || 16,
      keterangan: newItem.keterangan || 'Formatif & Sumatif',
    };
    addProtaItem(created);
    setIsAddOpen(false);
    setNewItem({
      semester: 1,
      babNumber: prota.length + 2,
      babTitle: '',
      tpCode: `TP 10.${prota.length + 2}`,
      tpDescription: '',
      alokasiJp: 16,
      keterangan: 'Formatif & Sumatif',
    });
  };

  const handleExportWord = async () => {
    await exportProtaToWord(
      prota,
      schoolProfile,
      `PROTA_${schoolProfile.subject.replace(/\s+/g, '_')}_${schoolProfile.academicYear.replace('/', '-')}.docx`
    );
    showNotification(
      'success',
      'Tabel PROTA berhasil diekspor ke Word (.docx) sesuai struktur pratinjau!'
    );
  };

  return (
    <div className="space-y-6">
      <PipelineSyncHeader />
      <IdentitasPerangkat
        documentTitle="Program Tahunan (PROTA) 1 Tahun Ajaran Penuh"
        semesterSpecific="full"
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
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Program Tahunan (PROTA) Tahun Ajaran {schoolProfile.academicYear}
            </h2>
            <p className="text-xs text-slate-500">
              Distribusi {totalJp} JP per Alur Tujuan Pembelajaran · {schoolProfile.schoolName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSyncPanelOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isSyncPanelOpen
                ? 'bg-cyan-900 text-white border-cyan-900 shadow-sm'
                : 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-200'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Menu Sinkron ke PROMES</span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                promesAlignment.allRowsSynced
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30'
                  : 'bg-amber-400 text-slate-950'
              }`}
            >
              {promesAlignment.SyncedCount}/{prota.length} Bab
            </span>
          </button>

          <button
            onClick={() => handleRunSync(false)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Sinkronkan langsung seluruh baris PROTA ke Matriks Mingguan PROMES"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sinkron ke PROMES</span>
          </button>

          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Baris PROTA</span>
          </button>

          <button
            onClick={() => {
              exportProtaToExcel(prota, schoolProfile);
              showNotification('success', 'Data PROTA berhasil diekspor ke Excel (.xlsx)!');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Ekspor PROTA ke Excel (.xlsx)"
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
            onClick={() => openPrintModal('prota')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Cetak Dokumen atau Ekspor ke PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Ekspor PDF / Cetak</span>
          </button>
        </div>
      </div>

      {/* Menu Sinkronisasi PROTA ke PROMES */}
      {isSyncPanelOpen && (
        <div className="bg-white rounded-2xl border-2 border-cyan-500/40 shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-950 via-teal-900 to-emerald-950 text-white p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-400/30 text-cyan-200 text-[11px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  Sinkronisasi Otomatis PROTA → PROMES
                </span>
                <span className="text-[11px] text-emerald-300 font-medium">
                  • {lastSyncedAt}
                </span>
              </div>
              <h3 className="text-base font-extrabold tracking-tight text-white">
                Menu Sinkronisasi Program Tahunan (PROTA) ke Program Semester (PROMES)
              </h3>
              <p className="text-xs text-cyan-100/90 max-w-3xl">
                Mendistribusikan seluruh Bab/Lingkup Materi, Kode TP, dan Alokasi JP dari PROTA ke matriks mingguan Semester 1 & Semester 2 pada PROMES dengan menyesuaikan Pekan Efektif dari Kalender Pendidikan & Analisis RPE ({rpe.semester1.jpPerWeek} JP/Pekan).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => handleRunSync(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Sinkronkan ke PROMES Sekarang</span>
              </button>

              <button
                onClick={() => handleRunSync(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 font-bold text-xs transition-all cursor-pointer"
              >
                <Grid3X3 className="w-4 h-4 text-cyan-300" />
                <span>Sinkron & Buka Matriks PROMES</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-4 bg-slate-50/60">
            {/* Control & KPI Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase">
                    Status Keselarasan Matriks
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    {promesAlignment.allRowsSynced ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-black text-emerald-800">
                          100% Tersinkron ({promesAlignment.SyncedCount}/{prota.length} Bab)
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <span className="text-sm font-black text-amber-800">
                          {promesAlignment.SyncedCount}/{prota.length} Bab Tersinkron
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Setiap tambah/ubah baris PROTA otomatis memperbarui PROMES.
                  </p>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90">
                <span className="text-[11px] font-bold text-slate-500 uppercase">
                  Perbandingan Alokasi JP (PROTA vs PROMES)
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <div>
                    <span className="text-xs text-slate-500">PROTA: </span>
                    <span className="text-sm font-black text-slate-900">{totalJp} JP</span>
                  </div>
                  <span className="text-slate-300">↔</span>
                  <div>
                    <span className="text-xs text-slate-500">Matriks PROMES: </span>
                    <span className="text-sm font-black text-cyan-800">
                      {promesAlignment.promesDistributedJp} JP
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Smt 1: {s1ProtaJp} JP ({rpe.semester1.jpPerWeek} JP/pekan) · Smt 2: {s2ProtaJp} JP ({rpe.semester2.jpPerWeek} JP/pekan)
                </p>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200/90">
                <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1.5 mb-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-700" />
                  Metode Distribusi Mingguan PROMES
                </label>
                <select
                  value={syncMode}
                  onChange={(e) =>
                    setSyncMode(e.target.value as 'auto_rpe' | 'preserve_custom')
                  }
                  className="w-full px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-600 cursor-pointer"
                >
                  <option value="auto_rpe">
                    Distribusi Otomatis Pekan Efektif RPE ({rpe.semester1.jpPerWeek} JP/Minggu)
                  </option>
                  <option value="preserve_custom">
                    Pertahankan Jadwal Kustom & Sesuaikan Bab/JP Baru
                  </option>
                </select>
              </div>
            </div>

            {/* Preview Mapping Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CalendarCheck2 className="w-4 h-4 text-cyan-700" />
                  Pratinjau Pemetaan Distribusi Mingguan PROTA ke Matriks PROMES
                </span>
                <button
                  onClick={() => setActiveView('promes')}
                  className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1 cursor-pointer"
                >
                  <span>Lihat Tabel Matriks PROMES Lengkap</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b text-[11px] uppercase">
                      <th className="py-2 px-3 text-center">Smt</th>
                      <th className="py-2 px-3">Kode TP</th>
                      <th className="py-2 px-3">Bab / Lingkup Materi PROTA</th>
                      <th className="py-2 px-3 text-center">Target JP</th>
                      <th className="py-2 px-3">Sebaran Bulan & Minggu Efektif di PROMES</th>
                      <th className="py-2 px-3 text-center">Status Sinkron</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {promesAlignment.rowStatuses.map((row) => (
                      <tr key={row.protaItem.id} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center font-semibold text-slate-600">
                          Smt {row.protaItem.semester}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-800 whitespace-nowrap">
                          {row.protaItem.tpCode}
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-900">
                          {row.protaItem.babTitle}
                        </td>
                        <td className="py-2 px-3 text-center font-black text-slate-900 whitespace-nowrap">
                          {row.protaItem.alokasiJp} JP
                        </td>
                        <td className="py-2 px-3">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-50 text-cyan-900 border border-cyan-200/80 font-semibold text-[11px]">
                            <Grid3X3 className="w-3 h-3 text-cyan-700" />
                            {row.weekSummary}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center whitespace-nowrap">
                          {row.isRowSynced ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              Tersinkron ({row.currentDistributedJp} JP)
                            </span>
                          ) : (
                            <button
                              onClick={() => handleRunSync(false)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] cursor-pointer"
                            >
                              <RefreshCw className="w-3 h-3" />
                              Klik Sinkronkan
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Summary KPI Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-5 rounded-2xl border border-emerald-500/30 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
            Total Alokasi PROTA 1 Tahun
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black">{totalJp} JP</span>
            <span className="text-xs text-emerald-200">
              (Semester 1: {s1ProtaJp} JP · Semester 2: {s2ProtaJp} JP)
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-emerald-800/60 px-4 py-2 rounded-xl border border-emerald-600/40 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>✓ 100% Selaras dengan Kalender, RPE & PROMES ({totalJp} JP)</span>
          </div>
          <button
            onClick={() => setActiveView('promes')}
            className="flex items-center gap-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Grid3X3 className="w-4 h-4" />
            <span>Buka PROMES →</span>
          </button>
        </div>
      </div>

      {/* PROTA Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Matriks Program Tahunan (PROTA) Mata Pelajaran {schoolProfile.subject}
          </h3>
          <span className="text-xs text-slate-500">
            Fase {schoolProfile.fase} · Kelas {schoolProfile.grade}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px]">
                <th className="p-3 border-b text-center">No</th>
                <th className="p-3 border-b text-center">Smt</th>
                <th className="p-3 border-b">Lingkup Materi / Bab</th>
                <th className="p-3 border-b text-center">Kode TP</th>
                <th className="p-3 border-b">Tujuan Pembelajaran</th>
                <th className="p-3 border-b text-center">Alokasi (JP)</th>
                <th className="p-3 border-b">Sebaran Minggu PROMES</th>
                <th className="p-3 border-b">Keterangan</th>
                <th className="p-3 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {prota.map((item, idx) => {
                const rowSync = promesAlignment.rowStatuses[idx];
                return (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3 text-center font-medium text-slate-600">{idx + 1}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700 text-[10px]">
                        Smt {item.semester}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-slate-900 max-w-[200px]">{item.babTitle}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-800 whitespace-nowrap">
                      {item.tpCode}
                    </td>
                    <td className="p-3 text-slate-700 leading-relaxed font-normal min-w-[240px]">
                      {item.tpDescription}
                    </td>
                    <td className="p-3 text-center font-black text-slate-900 text-sm whitespace-nowrap">
                      {item.alokasiJp} JP
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-cyan-50 text-cyan-900 border border-cyan-200 text-[11px] font-semibold">
                        <Grid3X3 className="w-3 h-3 text-cyan-700" />
                        {rowSync?.weekSummary || '-'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 italic whitespace-nowrap">{item.keterangan}</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                          title="Edit Baris PROTA"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteProtaItem(item.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                          title="Hapus Baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-emerald-50 font-bold text-emerald-950">
                <td colSpan={5} className="p-3 text-right">
                  TOTAL ALOKASI WAKTU 1 TAHUN AJARAN:
                </td>
                <td className="p-3 text-center text-base">{totalJp} JP</td>
                <td colSpan={3} className="p-3 text-emerald-700 font-semibold">
                  ✓ Sesuai Standar BSKAP 046/2025 & Tersinkron ke Matriks PROMES
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border space-y-4 animate-scale-up text-xs"
          >
            <h3 className="text-base font-bold text-slate-900">
              Edit Baris PROTA ({editingItem.tpCode})
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Semester</label>
                <select
                  value={editingItem.semester}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, semester: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nomor Bab</label>
                <input
                  type="number"
                  value={editingItem.babNumber}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, babNumber: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Alokasi JP</label>
                <input
                  type="number"
                  value={editingItem.alokasiJp}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, alokasiJp: parseInt(e.target.value, 10) })
                  }
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Judul Bab / Lingkup Materi</label>
              <input
                type="text"
                value={editingItem.babTitle}
                onChange={(e) => setEditingItem({ ...editingItem, babTitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Deskripsi Tujuan Pembelajaran</label>
              <textarea
                rows={3}
                value={editingItem.tpDescription}
                onChange={(e) => setEditingItem({ ...editingItem, tpDescription: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Keterangan Asesmen</label>
              <input
                type="text"
                value={editingItem.keterangan}
                onChange={(e) => setEditingItem({ ...editingItem, keterangan: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-semibold cursor-pointer"
              >
                Simpan & Sinkronkan ke PROMES
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddNew}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border space-y-4 animate-scale-up text-xs"
          >
            <h3 className="text-base font-bold text-slate-900">Tambah Baris PROTA Baru</h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Semester</label>
                <select
                  value={newItem.semester}
                  onChange={(e) => setNewItem({ ...newItem, semester: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value={1}>Semester 1</option>
                  <option value={2}>Semester 2</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nomor Bab</label>
                <input
                  type="number"
                  value={newItem.babNumber}
                  onChange={(e) => setNewItem({ ...newItem, babNumber: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Alokasi JP</label>
                <input
                  type="number"
                  value={newItem.alokasiJp}
                  onChange={(e) => setNewItem({ ...newItem, alokasiJp: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Kode TP</label>
              <input
                type="text"
                value={newItem.tpCode}
                onChange={(e) => setNewItem({ ...newItem, tpCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Judul Bab / Lingkup Materi</label>
              <input
                type="text"
                placeholder="Contoh: Bab 8: Teks Drama..."
                value={newItem.babTitle}
                onChange={(e) => setNewItem({ ...newItem, babTitle: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Deskripsi Tujuan Pembelajaran</label>
              <textarea
                rows={3}
                placeholder="Menganalisis pementasan drama..."
                value={newItem.tpDescription}
                onChange={(e) => setNewItem({ ...newItem, tpDescription: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-semibold cursor-pointer"
              >
                Tambahkan ke PROTA & Sinkron PROMES
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

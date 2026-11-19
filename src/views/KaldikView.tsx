import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Printer,
  CheckCircle2,
  CalendarDays,
  Upload,
  Download,
  RefreshCw,
  MapPin,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import { KaldikEvent } from '../types';
import { exportKaldikToWord, exportKaldikToExcel } from '../utils/exporter';
import {
  REGIONAL_KALDIK_DATABASE,
  RegionalKaldikPreset,
  computeRpeFromKaldikEvents,
  parseUploadedKaldikFile,
  downloadKaldikExcelTemplate,
} from '../utils/regionalKaldikDatabase';
import { PipelineSyncHeader } from '../components/PipelineSyncHeader';
import { IdentitasPerangkat } from '../components/IdentitasPerangkat';
import { JadwalMengajarRiilPanel } from '../components/JadwalMengajarRiilPanel';

export const KaldikView: React.FC = () => {
  const {
    rpe,
    kaldikEvents,
    deleteKaldikEvent,
    syncKaldikAndRpe,
    schoolProfile,
    stats,
    setActiveView,
    openPrintModal,
    showNotification,
  } = useApp();

  const [selectedRegionId, setSelectedRegionId] = useState<string>('dinas-lampung');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<KaldikEvent>>({
    name: '',
    dateStart: '2026-08-01',
    dateEnd: '2026-08-01',
    type: 'kegiatan_sekolah',
    color: '#3b82f6',
    notes: '',
  });

  const activePreset =
    REGIONAL_KALDIK_DATABASE.find((p) => p.id === selectedRegionId) ||
    REGIONAL_KALDIK_DATABASE[0];

  const filteredPresets = REGIONAL_KALDIK_DATABASE.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.province.toLowerCase().includes(q) ||
      p.dinasName.toLowerCase().includes(q) ||
      p.skNumber.toLowerCase().includes(q)
    );
  });

  const handleSelectRegionPreset = (preset: RegionalKaldikPreset) => {
    setSelectedRegionId(preset.id);
    syncKaldikAndRpe(
      preset.rpe,
      preset.events,
      `${preset.dinasName} (${preset.skNumber})`
    );
  };

  const handleManualSyncToRpe = () => {
    const updatedRpe = computeRpeFromKaldikEvents(kaldikEvents, rpe);
    syncKaldikAndRpe(
      updatedRpe,
      kaldikEvents,
      `Agenda Kalender Pendidikan (${kaldikEvents.length} Agenda)`
    );
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name) {
      showNotification('error', 'Nama agenda wajib diisi.');
      return;
    }
    const created: KaldikEvent = {
      id: `ev-${Date.now()}`,
      name: newEvent.name || 'Agenda Baru',
      dateStart: newEvent.dateStart || '2026-08-01',
      dateEnd: newEvent.dateEnd || newEvent.dateStart || '2026-08-01',
      type: (newEvent.type as any) || 'kegiatan_sekolah',
      color: newEvent.color || '#3b82f6',
      notes: newEvent.notes || '',
    };
    const nextEvents = [...kaldikEvents, created];
    const updatedRpe = computeRpeFromKaldikEvents(nextEvents, rpe);
    syncKaldikAndRpe(updatedRpe, nextEvents, `Penambahan Agenda "${created.name}"`);
    setIsAddModalOpen(false);
    setNewEvent({
      name: '',
      dateStart: '2026-08-01',
      dateEnd: '2026-08-01',
      type: 'kegiatan_sekolah',
      color: '#3b82f6',
      notes: '',
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await parseUploadedKaldikFile(file, rpe);
      syncKaldikAndRpe(result.rpe, result.events, result.sourceTitle);
      showNotification('success', result.summaryText);
    } catch (err: any) {
      showNotification(
        'error',
        err?.message || 'Gagal membaca file Kalender Pendidikan.'
      );
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'libur_nasional':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Libur Nasional</span>;
      case 'libur_semester':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-100 text-pink-800">Libur Semester</span>;
      case 'sts':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">STS (Sumatif Tengah Smt)</span>;
      case 'sas':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">SAS (Sumatif Akhir Smt)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Kegiatan Sekolah</span>;
    }
  };

  return (
    <div className="space-y-6">
      <PipelineSyncHeader />
      <IdentitasPerangkat
        documentTitle="Kalender Pendidikan (Kaldik) & Matriks Efektif 1 Tahun Penuh"
        semesterSpecific="full"
      />

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
              <CalendarDays className="w-5 h-5 text-blue-600" />
              Kalender Pendidikan (Kaldik) Tahun Ajaran {schoolProfile.academicYear}
            </h2>
            <p className="text-xs text-slate-500">
              {activePreset.dinasName} · {schoolProfile.schoolName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls,.csv,.pdf,.docx,.doc,.json,.txt"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Unggah dokumen Kalender Pendidikan (.xlsx, .csv, .pdf, .docx, .json)"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Upload Dokumen Kaldik</span>
          </button>

          <button
            onClick={() =>
              downloadKaldikExcelTemplate(
                schoolProfile.schoolName,
                schoolProfile.academicYear
              )
            }
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            title="Unduh Template Excel Kaldik & RPE (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Template Excel</span>
          </button>

          <button
            onClick={handleManualSyncToRpe}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Sinkronkan Otomatis Agenda Kaldik ke Tabel Analisis RPE"
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Sinkron Otomatis RPE</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Agenda Kaldik</span>
          </button>

          <button
            onClick={() => {
              exportKaldikToExcel(kaldikEvents, schoolProfile);
              showNotification('success', 'Data Kalender Pendidikan berhasil diekspor ke Excel (.xlsx)!');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Ekspor Kalender Pendidikan ke Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={async () => {
              await exportKaldikToWord(
                kaldikEvents,
                schoolProfile,
                `KALDIK_${schoolProfile.subject.replace(/\s+/g, '_')}_${schoolProfile.academicYear.replace('/', '-')}.docx`
              );
              showNotification('success', 'Tabel Kalender Pendidikan berhasil diunduh ke Word (.docx)!');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Word</span>
          </button>

          <button
            onClick={() => openPrintModal('kaldik')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
            title="Cetak Kalender Pendidikan atau Ekspor ke PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Ekspor PDF / Cetak</span>
          </button>
        </div>
      </div>

      {/* Pencarian Cepat Dinas Pendidikan Daerah */}
      <div className="bg-white p-4 rounded-2xl border border-blue-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">
              Pilih Kalender Pendidikan Dinas Pendidikan Daerah (Sinkron Otomatis ke RPE):
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari provinsi / Dinas Pendidikan..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedRegionId}
              onChange={(e) => {
                const found = REGIONAL_KALDIK_DATABASE.find(
                  (p) => p.id === e.target.value
                );
                if (found) handleSelectRegionPreset(found);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200 rounded-xl focus:outline-none cursor-pointer"
            >
              {filteredPresets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.province} — {p.dinasName}
                </option>
              ))}
            </select>
            <button
              onClick={() => setActiveView('rpe')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
            >
              Buka Analisis RPE →
            </button>
          </div>
        </div>
      </div>

      {/* Pilih Hari Jadwal Mengajar di Kelas (Untuk Analisis Pertemuan Riil) */}
      <div className="rounded-2xl border-2 border-indigo-200 overflow-hidden shadow-sm">
        <JadwalMengajarRiilPanel />
      </div>

      {/* Summary Stat Box */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Pekan Efektif KBM
          </span>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-3xl font-black text-blue-700">{stats.pekanEfektifTotal}</span>
            <span className="text-xs text-slate-600 font-semibold">Pekan / 1 Tahun</span>
          </div>
          <p className="text-xs text-slate-500">
            Smt 1: {stats.pekanEfektifS1} Pekan · Smt 2: {stats.pekanEfektifS2} Pekan
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Alokasi Jam Tatap Muka
          </span>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-3xl font-black text-emerald-700">{stats.protaTotalJp}</span>
            <span className="text-xs text-slate-600 font-semibold">JP Bersih</span>
          </div>
          <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% Selaras dengan PROTA & RPE
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Agenda Terdaftar
          </span>
          <div className="flex items-baseline gap-2 my-2">
            <span className="text-3xl font-black text-slate-800">{kaldikEvents.length}</span>
            <span className="text-xs text-slate-600 font-semibold">Kegiatan & Ujian</span>
          </div>
          <p className="text-xs text-slate-500">
            Termasuk STS, SAS, SAT, dan Libur Keagamaan
          </p>
        </div>
      </div>

      {/* Agenda Kaldik Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Jadwal Rinci Kegiatan Akademik & Ujian Sekolah 2026/2027
          </h3>
          <span className="text-xs text-slate-500">
            {schoolProfile.schoolName}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px]">
                <th className="p-3 border-b">Rentang Tanggal</th>
                <th className="p-3 border-b">Nama Agenda / Kegiatan</th>
                <th className="p-3 border-b">Kategori</th>
                <th className="p-3 border-b">Keterangan Khusus</th>
                <th className="p-3 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {kaldikEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-medium text-slate-800 whitespace-nowrap">
                    {ev.dateStart} {ev.dateEnd !== ev.dateStart ? `s.d. ${ev.dateEnd}` : ''}
                  </td>
                  <td className="p-3 font-semibold text-slate-900">{ev.name}</td>
                  <td className="p-3">{getEventTypeBadge(ev.type)}</td>
                  <td className="p-3 text-slate-600 italic">{ev.notes || '-'}</td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => deleteKaldikEvent(ev.id)}
                      className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="Hapus Agenda"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4 animate-scale-up text-xs"
          >
            <h3 className="text-base font-bold text-slate-900">Tambah Agenda Kalender Pendidikan</h3>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Nama Kegiatan / Libur</label>
              <input
                type="text"
                placeholder="Contoh: Sumatif Tengah Semester 2"
                value={newEvent.name}
                onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={newEvent.dateStart}
                  onChange={(e) => setNewEvent({ ...newEvent, dateStart: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Tanggal Selesai</label>
                <input
                  type="date"
                  value={newEvent.dateEnd}
                  onChange={(e) => setNewEvent({ ...newEvent, dateEnd: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Kategori Agenda</label>
              <select
                value={newEvent.type}
                onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                className="w-full px-3 py-2 border rounded-xl"
              >
                <option value="kegiatan_sekolah">Kegiatan Sekolah</option>
                <option value="sts">Sumatif Tengah Semester (STS)</option>
                <option value="sas">Sumatif Akhir Semester (SAS/SAT)</option>
                <option value="libur_nasional">Libur Nasional</option>
                <option value="libur_semester">Libur Semester</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Keterangan Tambahan</label>
              <textarea
                rows={2}
                placeholder="Catatan pelaksanaan..."
                value={newEvent.notes}
                onChange={(e) => setNewEvent({ ...newEvent, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-xl font-semibold cursor-pointer"
              >
                Simpan Agenda
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

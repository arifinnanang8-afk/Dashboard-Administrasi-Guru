import React from 'react';
import {
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { ProtaItem } from '../types';
import {
  autoBalanceTpAllocations,
  deriveEstimatedMonthRangeFromDistribution,
  inferSemesterFromKodeJenis,
} from '../utils/curriculumLogic';

interface ProgramAlokasiWaktuPanelProps {
  rpeEffectiveJpS1?: number;
  rpeEffectiveJpS2?: number;
  rpeNetJpS1: number;
  rpeNetJpS2: number;
  jpPerWeekS1?: number;
  jpPerWeekS2?: number;
  meetingsPerWeek?: number;
  onBackToRpeStep?: () => void;
}

export const ProgramAlokasiWaktuPanel: React.FC<ProgramAlokasiWaktuPanelProps> = ({
  rpeEffectiveJpS1,
  rpeEffectiveJpS2,
  rpeNetJpS1,
  rpeNetJpS2,
  jpPerWeekS1 = 4,
  jpPerWeekS2 = 4,
  meetingsPerWeek = 2,
  onBackToRpeStep,
}) => {
  const {
    prota,
    promes,
    tujuanPembelajaran,
    schoolProfile,
    updateProtaItem,
    addProtaItem,
    deleteProtaItem,
    setAllProtaItems,
    updateTujuanPembelajaran,
    syncProtaToPromes,
    setActiveView,
    showNotification,
  } = useApp();

  const targetS1Jp = rpeEffectiveJpS1 !== undefined ? rpeEffectiveJpS1 : rpeNetJpS1;
  const targetS2Jp = rpeEffectiveJpS2 !== undefined ? rpeEffectiveJpS2 : rpeNetJpS2;
  const totalTargetJp = targetS1Jp + targetS2Jp;

  const jpPerMeetingS1 = Math.max(1, Math.round((jpPerWeekS1 || 4) / Math.max(1, meetingsPerWeek || 1)));
  const jpPerMeetingS2 = Math.max(1, Math.round((jpPerWeekS2 || 4) / Math.max(1, meetingsPerWeek || 1)));

  const totalAllocatedJp = prota.reduce((acc, item) => acc + (Number(item.alokasiJp) || 0), 0);
  const diffJp = totalTargetJp - totalAllocatedJp;
  const isBalanced = diffJp === 0;

  const getRowJpPerMeeting = (semester: number) =>
    Number(semester) === 2 ? jpPerMeetingS2 : jpPerMeetingS1;

  const getRowMeetings = (item: ProtaItem) => {
    if (item.jmlPertemuan !== undefined) return Math.max(0, item.jmlPertemuan);
    const perMeeting = getRowJpPerMeeting(item.semester);
    if ((Number(item.alokasiJp) || 0) === 0) return 0;
    return Math.max(1, Math.round((Number(item.alokasiJp) || 0) / perMeeting));
  };

  const getRowEstimatedMonth = (item: ProtaItem) => {
    if (item.perkiraanBulan !== undefined) return item.perkiraanBulan;
    const matchedPromes = promes.find(
      (pm) =>
        pm.tpCode === item.tpCode || pm.id === item.id.replace('prota-', 'promes-')
    );
    return deriveEstimatedMonthRangeFromDistribution(
      matchedPromes?.distribution,
      item.semester,
      schoolProfile.academicYear
    );
  };

  const handleKodeJenisChange = (item: ProtaItem, nextKode: string) => {
    const inferredSemester = inferSemesterFromKodeJenis(nextKode, item.semester);
    updateProtaItem({
      ...item,
      tpCode: nextKode,
      semester: inferredSemester,
    });
  };

  const handleLingkupMateriChange = (item: ProtaItem, nextTitle: string) => {
    const prevPrimary = item.babTitle || item.tpDescription;
    const shouldSyncDesc =
      !item.tpDescription || item.tpDescription === prevPrimary;
    updateProtaItem({
      ...item,
      babTitle: nextTitle,
      tpDescription: shouldSyncDesc ? nextTitle : item.tpDescription,
    });
    const matchedTp = tujuanPembelajaran.find((t) => t.code === item.tpCode);
    if (matchedTp) {
      updateTujuanPembelajaran({
        ...matchedTp,
        materiPokok: nextTitle,
        description: shouldSyncDesc ? nextTitle : matchedTp.description,
      });
    }
  };

  const handleMeetingsChange = (item: ProtaItem, rawVal: string) => {
    const nextMeetings = Math.max(0, parseInt(rawVal, 10) || 0);
    const perMeeting = getRowJpPerMeeting(item.semester);
    const nextJp = nextMeetings * perMeeting;

    updateProtaItem({
      ...item,
      jmlPertemuan: nextMeetings,
      alokasiJp: nextJp,
    });

    const matchedTp = tujuanPembelajaran.find((t) => t.code === item.tpCode);
    if (matchedTp) {
      updateTujuanPembelajaran({ ...matchedTp, jpAllocation: nextJp });
    }
  };

  const handleJpChange = (item: ProtaItem, rawVal: string) => {
    const nextJp = Math.max(0, parseInt(rawVal, 10) || 0);
    const perMeeting = getRowJpPerMeeting(item.semester);
    const nextMeetings = nextJp === 0 ? 0 : Math.max(1, Math.round(nextJp / perMeeting));

    updateProtaItem({
      ...item,
      alokasiJp: nextJp,
      jmlPertemuan: nextMeetings,
    });

    const matchedTp = tujuanPembelajaran.find((t) => t.code === item.tpCode);
    if (matchedTp) {
      updateTujuanPembelajaran({ ...matchedTp, jpAllocation: nextJp });
    }
  };

  const handlePerkiraanBulanChange = (item: ProtaItem, nextBulan: string) => {
    updateProtaItem({
      ...item,
      perkiraanBulan: nextBulan,
    });
  };

  const handleAutoBalance = () => {
    if (prota.length === 0) {
      showNotification('info', 'Tambahkan minimal 1 baris TP / Agenda terlebih dahulu.');
      return;
    }

    const balanced = autoBalanceTpAllocations(prota, {
      targetTotalJpS1: targetS1Jp,
      targetTotalJpS2: targetS2Jp,
      jpPerMeetingS1,
      jpPerMeetingS2,
    });

    setAllProtaItems(balanced);

    balanced.forEach((item) => {
      const matchedTp = tujuanPembelajaran.find((t) => t.code === item.tpCode);
      if (matchedTp) {
        updateTujuanPembelajaran({ ...matchedTp, jpAllocation: item.alokasiJp });
      }
    });

    showNotification(
      'success',
      `Alokasi JP diratakan otomatis menjadi ${totalTargetJp} JP agar seimbang dengan Total JP Efektif Kaldik!`
    );
  };

  const handleAddRow = () => {
    const nextNumber = prota.length + 1;
    const s2Count = prota.filter((p) => Number(p.semester) === 2).length;
    const defaultSemester: 1 | 2 = s2Count <= prota.length / 2 ? 2 : 1;
    const semLabel = defaultSemester === 1 ? 'Ganjil' : 'Genap';
    const perMeeting = getRowJpPerMeeting(defaultSemester);
    const yearParts = (schoolProfile.academicYear || '2026/2027').split('/');
    const monthFallback =
      defaultSemester === 1
        ? `Desember ${yearParts[0] || '2026'}`
        : `Mei ${yearParts[1] || '2027'}`;

    const newRow: ProtaItem = {
      id: `prota-${Date.now()}`,
      semester: defaultSemester,
      babNumber: nextNumber,
      babTitle: 'Lingkup Materi / Agenda Pembelajaran Baru',
      tpCode: `TP ${defaultSemester}.${s2Count + 1} (${semLabel})`,
      tpDescription: 'Lingkup Materi / Agenda Pembelajaran Baru',
      alokasiJp: perMeeting,
      jmlPertemuan: 1,
      perkiraanBulan: monthFallback,
      keterangan: 'Formatif & Sumatif',
    };

    addProtaItem(newRow);
    showNotification('success', `Baris ${newRow.tpCode} berhasil ditambahkan.`);
  };

  const handleDeleteRow = (item: ProtaItem) => {
    deleteProtaItem(item.id);
    showNotification('info', `Baris ${item.tpCode} dihapus.`);
  };

  const handleSyncToProtaPromes = () => {
    syncProtaToPromes('auto_rpe', false);
    showNotification(
      'success',
      'Program Alokasi Waktu (TP) berhasil diselaraskan ke PROTA & PROMES sesuai Total JP Efektif!'
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-5 space-y-4">
        {/* Top Header Row matching reference screenshot */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              Program Alokasi Waktu &amp; Distribusi Tujuan Pembelajaran (TP)
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Susun distribusi Jam Pelajaran (JP) per Tujuan Pembelajaran agar pas dengan Total JP Efektif (
              <strong className="text-[#109848]">{totalTargetJp} JP</strong>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleAutoBalance}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Ratakan JP Otomatis</span>
            </button>
            <button
              type="button"
              onClick={handleAddRow}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#109848] hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Baris TP / Agenda</span>
            </button>
          </div>
        </div>

        {/* Full-Width Balance Status Banner */}
        <div
          className={`rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
            isBalanced
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <span className="font-bold">
            {isBalanced
              ? 'Alokasi Waktu Seimbang! Total JP yang dialokasikan sudah pas dengan Total JP Efektif Kaldik.'
              : diffJp > 0
              ? `Alokasi Waktu Belum Seimbang (Masih tersisa ${diffJp} JP untuk didistribusikan). Klik "Ratakan JP Otomatis" atau sesuaikan Jml Pertemuan.`
              : `Alokasi Waktu Melebihi Batas Efektif sebesar ${Math.abs(diffJp)} JP. Klik "Ratakan JP Otomatis" atau kurangi Jml Pertemuan.`}
          </span>
          <span className="font-black whitespace-nowrap tabular-nums">
            Terpakai: {totalAllocatedJp} / {totalTargetJp} JP
          </span>
        </div>

        {/* 7-Column TP Allocation Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0f172a] text-white text-[11px] font-bold tracking-wide">
                <th className="px-2.5 py-3 text-center w-10">No</th>
                <th className="px-2.5 py-3 w-36">Kode / Jenis</th>
                <th className="px-3 py-3 min-w-[230px]">
                  Lingkup Materi &amp; Tujuan Pembelajaran (TP) / Kegiatan
                </th>
                <th className="px-2 py-3 text-center w-24">Jml Pertemuan</th>
                <th className="px-2 py-3 text-center w-20">Alokasi JP</th>
                <th className="px-2.5 py-3 w-48">Perkiraan Bulan</th>
                <th className="px-2.5 py-3 text-center w-14">Hapus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {prota.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 text-xs">
                    Belum ada baris TP / Agenda. Klik <strong>Tambah Baris TP / Agenda</strong> untuk mulai menyusun alokasi waktu.
                  </td>
                </tr>
              ) : (
                prota.map((item, idx) => {
                  const displayedMeetings = getRowMeetings(item);
                  const displayedMonth = getRowEstimatedMonth(item);
                  const displayedLingkup = item.babTitle || item.tpDescription || '';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-2 py-2.5 text-center font-medium text-slate-600 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="px-2 py-2.5">
                        <input
                          type="text"
                          value={item.tpCode}
                          onChange={(e) => handleKodeJenisChange(item, e.target.value)}
                          aria-label={`Kode atau jenis baris ${idx + 1}`}
                          placeholder="TP 1.1 (Ganjil)"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-800 text-xs focus:ring-1 focus:ring-[#109848] focus:border-[#109848] focus:outline-none bg-white"
                        />
                      </td>
                      <td className="px-2 py-2.5">
                        <input
                          type="text"
                          value={displayedLingkup}
                          onChange={(e) => handleLingkupMateriChange(item, e.target.value)}
                          aria-label={`Lingkup materi dan TP ${item.tpCode}`}
                          placeholder="Lingkup materi dan tujuan pembelajaran..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs focus:ring-1 focus:ring-[#109848] focus:border-[#109848] focus:outline-none bg-white"
                        />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <input
                          type="number"
                          min={0}
                          max={99}
                          value={displayedMeetings}
                          onChange={(e) => handleMeetingsChange(item, e.target.value)}
                          aria-label={`Jumlah pertemuan ${item.tpCode}`}
                          className="w-16 px-2 py-1.5 text-center font-bold text-slate-800 border border-slate-200 rounded-lg focus:ring-1 focus:ring-[#109848] focus:border-[#109848] focus:outline-none bg-white tabular-nums"
                        />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <input
                          type="number"
                          min={0}
                          max={200}
                          value={item.alokasiJp}
                          onChange={(e) => handleJpChange(item, e.target.value)}
                          aria-label={`Alokasi JP ${item.tpCode}`}
                          className="w-16 px-2 py-1.5 text-center font-black text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg focus:ring-1 focus:ring-[#109848] focus:outline-none tabular-nums"
                        />
                      </td>
                      <td className="px-2 py-2.5">
                        <input
                          type="text"
                          value={displayedMonth}
                          onChange={(e) => handlePerkiraanBulanChange(item, e.target.value)}
                          aria-label={`Perkiraan bulan ${item.tpCode}`}
                          placeholder="Juli - Agustus 2026"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs focus:ring-1 focus:ring-[#109848] focus:border-[#109848] focus:outline-none bg-white"
                        />
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(item)}
                          aria-label={`Hapus baris ${item.tpCode}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer inline-flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Workflow Navigation & PROTA/PROMES Sync Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {onBackToRpeStep ? (
          <button
            type="button"
            onClick={onBackToRpeStep}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke 3. Analisis Minggu &amp; Pertemuan Efektif</span>
          </button>
        ) : (
          <span />
        )}

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncToProtaPromes}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm whitespace-nowrap transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sinkron ke PROTA &amp; PROMES</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView('prota')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold whitespace-nowrap transition-colors cursor-pointer"
          >
            <span>Buka Program Tahunan (PROTA)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Database,
  HardDrive,
  Cloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Upload,
  Settings2,
  Table2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { buildDatabaseEntityInventory } from '../utils/databaseIntegrationLogic';
import { getStoredSupabaseConfig, syncStateToSupabase } from '../services/supabaseClient';

export const DatabaseIntegrationPanel: React.FC = () => {
  const {
    schoolProfile,
    cpElements,
    tujuanPembelajaran,
    rpe,
    prota,
    promes,
    modulAjarList,
    lkpdList,
    students,
    kaldikEvents,
    lastAutosavedAt,
    supabaseConnected,
    supabaseLastSyncAt,
    refreshSupabaseStatus,
    setIsSupabaseModalOpen,
    setActiveView,
    showNotification,
  } = useApp();

  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [showSchemaTable, setShowSchemaTable] = useState(true);

  const supabaseConfig = getStoredSupabaseConfig();
  const supabaseHost = useMemo(() => {
    if (!supabaseConfig.url) return null;
    try {
      return new URL(supabaseConfig.url).hostname;
    } catch {
      return supabaseConfig.url;
    }
  }, [supabaseConfig.url]);

  const localKeys = useMemo(() => {
    try {
      return Object.keys(localStorage).filter((k) => k.startsWith('ADM_GURU_'));
    } catch {
      return [];
    }
  }, [schoolProfile, cpElements, tujuanPembelajaran, rpe, prota, promes, modulAjarList, lkpdList, students, kaldikEvents]);

  const inventory = useMemo(
    () =>
      buildDatabaseEntityInventory(
        {
          schoolProfile,
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
        localKeys
      ),
    [schoolProfile, cpElements, tujuanPembelajaran, rpe, prota, promes, modulAjarList, lkpdList, students, kaldikEvents, localKeys]
  );

  const handleQuickCloudSync = async () => {
    if (!supabaseConnected) {
      setIsSupabaseModalOpen(true);
      return;
    }
    setIsSyncingCloud(true);
    const res = await syncStateToSupabase({
      schoolProfile,
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
    setIsSyncingCloud(false);
    refreshSupabaseStatus();
    if (res.success) {
      showNotification('success', res.message);
    } else {
      showNotification('error', res.message);
    }
  };

  return (
    <section
      aria-label="Integrasi Database dan Penyimpanan Awan"
      className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm my-5 space-y-5"
    >
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                Arsitektur Penyimpanan &amp; Integrasi Database
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  supabaseConnected
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}
              >
                {supabaseConnected ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>
                  {supabaseConnected ? 'Supabase Cloud Terhubung' : 'Mode Penyimpanan Lokal + Siap Cloud'}
                </span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Integrasi Database: Supabase PostgreSQL, Autosave Lokal &amp; Google Drive
            </h3>
            <p className="text-xs text-slate-600">
              Total{' '}
              <span className="font-bold text-slate-800">{inventory.totalRecords} rekaman data</span>{' '}
              terstruktur di{' '}
              <span className="font-bold text-slate-800">10 entitas tabel kurikulum</span> ({inventory.totalKb}).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setIsSupabaseModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Settings2 className="w-4 h-4" />
            <span>{supabaseConnected ? 'Kelola Koneksi Supabase' : 'Hubungkan Supabase'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('database')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <Table2 className="w-4 h-4 text-emerald-300" />
            <span>Buka Pusat Database</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3 Database Layer Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Layer 1: Supabase PostgreSQL */}
        <div
          className={`rounded-2xl p-4 border transition-all flex flex-col justify-between gap-3 ${
            supabaseConnected
              ? 'bg-emerald-50/50 border-emerald-300/80'
              : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-600 text-white">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Supabase PostgreSQL</h4>
                  <p className="text-[11px] text-slate-500">Tabel: curriculum_documents</p>
                </div>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  supabaseConnected
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}
              >
                {supabaseConnected ? 'Terhubung' : 'Belum Konfigurasi'}
              </span>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1 bg-white/80 rounded-xl p-2.5 border border-slate-200/70">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Endpoint:</span>
                <span className="font-mono font-semibold text-slate-800 truncate max-w-[170px]">
                  {supabaseHost || 'Belum diatur'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Sinkron Terakhir:</span>
                <span className="font-semibold text-slate-800">
                  {supabaseLastSyncAt || 'Belum pernah sinkron'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleQuickCloudSync}
              disabled={isSyncingCloud}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold transition cursor-pointer disabled:opacity-60"
            >
              {isSyncingCloud ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Upload className="w-3.5 h-3.5" />
              )}
              <span>{supabaseConnected ? 'Sinkronkan Sekarang' : 'Konfigurasi API'}</span>
            </button>
          </div>
        </div>

        {/* Layer 2: Browser LocalStorage + Autosave */}
        <div className="rounded-2xl p-4 border border-teal-200 bg-teal-50/40 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-600 text-white">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Database Lokal &amp; Autosave</h4>
                  <p className="text-[11px] text-slate-500">Penyimpanan Browser Real-Time</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                Aktif
              </span>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1 bg-white/80 rounded-xl p-2.5 border border-teal-200/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Kunci Terimpan:</span>
                <span className="font-mono font-semibold text-slate-800">{localKeys.length} keys</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Autosave Terakhir:</span>
                <span className="font-mono font-semibold text-teal-800">{lastAutosavedAt}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('database')}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 text-[11px] font-bold transition cursor-pointer"
          >
            <span>Lihat Inspeksi Penyimpanan Lokal</span>
          </button>
        </div>

        {/* Layer 3: Google Drive & JSON Archive */}
        <div className="rounded-2xl p-4 border border-sky-200 bg-sky-50/40 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-sky-600 text-white">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900">Google Drive &amp; JSON Backup</h4>
                  <p className="text-[11px] text-slate-500">Arsip Portabel &amp; Pemulihan</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                Siap
              </span>
            </div>

            <div className="text-[11px] text-slate-600 space-y-1 bg-white/80 rounded-xl p-2.5 border border-sky-200/60">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Ukuran Snapshot:</span>
                <span className="font-mono font-semibold text-slate-800">{inventory.totalKb}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Format Ekspor:</span>
                <span className="font-semibold text-slate-800">Drive Cloud / .JSON</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('backup')}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-sky-50 text-sky-800 border border-sky-300 text-[11px] font-bold transition cursor-pointer"
          >
            <span>Buka Backup &amp; Google Drive</span>
          </button>
        </div>
      </div>

      {/* Collapsible Live 10-Entity Table Inventory */}
      <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/60">
        <div className="px-4 py-2.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Table2 className="w-4 h-4 text-emerald-700" />
            <span>Pemetaan Skema Tabel Database (10 Entitas Terintegrasi)</span>
          </div>
          <button
            type="button"
            onClick={() => setShowSchemaTable((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <span>{showSchemaTable ? 'Ringkas' : 'Tampilkan Detail Tabel'}</span>
            {showSchemaTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showSchemaTable && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 p-3">
            {inventory.entities.map((entity) => (
              <button
                key={entity.key}
                type="button"
                onClick={() => setActiveView('database')}
                className="text-left bg-white hover:border-emerald-400 border border-slate-200 rounded-xl p-2.5 transition-all shadow-2xs cursor-pointer group"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/80 truncate">
                    {entity.tableColumn}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">{entity.estimatedKb}</span>
                </div>
                <p className="text-[11px] font-bold text-slate-800 group-hover:text-emerald-700 truncate">
                  {entity.label}
                </p>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-700">
                    {entity.recordCount} {entity.unitLabel}
                  </span>
                  <span className={entity.syncedToLocal ? 'text-teal-700 font-semibold' : 'text-slate-400'}>
                    {entity.syncedToLocal ? '● Lokal OK' : '○ Memori'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

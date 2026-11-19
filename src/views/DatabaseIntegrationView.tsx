import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Database,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Upload,
  Download,
  Key,
  Link2,
  Terminal,
  Table2,
  HardDrive,
  Cloud,
  Copy,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  buildDatabaseEntityInventory,
  SUPABASE_CURRICULUM_SQL_SCHEMA,
} from '../utils/databaseIntegrationLogic';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  syncStateToSupabase,
  fetchStateFromSupabase,
} from '../services/supabaseClient';

export const DatabaseIntegrationView: React.FC = () => {
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
    restoreCompleteState,
    cleanupDeprecatedStorage,
    backupToJson,
    setActiveView,
    showNotification,
  } = useApp();

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'explorer' | 'supabase' | 'sql' | 'local'>('explorer');
  const [selectedEntityKey, setSelectedEntityKey] = useState<string>('students');

  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    setUrl(cfg.url);
    setAnonKey(cfg.anonKey);
  }, []);

  const localStorageEntries = useMemo(() => {
    try {
      return Object.keys(localStorage)
        .filter((k) => k.startsWith('ADM_GURU_'))
        .sort()
        .map((key) => {
          const val = localStorage.getItem(key) || '';
          const bytes = new TextEncoder().encode(val).length;
          return {
            key,
            bytes,
            kb: `${(bytes / 1024).toFixed(1)} KB`,
            preview: val.slice(0, 120) + (val.length > 120 ? '...' : ''),
          };
        });
    } catch {
      return [];
    }
  }, [schoolProfile, cpElements, tujuanPembelajaran, rpe, prota, promes, modulAjarList, lkpdList, students, kaldikEvents, lastAutosavedAt]);

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
        localStorageEntries.map((e) => e.key)
      ),
    [schoolProfile, cpElements, tujuanPembelajaran, rpe, prota, promes, modulAjarList, lkpdList, students, kaldikEvents, localStorageEntries]
  );

  const selectedEntity = useMemo(
    () => inventory.entities.find((e) => e.key === selectedEntityKey) || inventory.entities[0],
    [inventory.entities, selectedEntityKey]
  );

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url, anonKey);
    if (res.success) {
      saveSupabaseConfig({ url, anonKey });
      refreshSupabaseStatus();
      showNotification('success', 'Konfigurasi Supabase berhasil disimpan & diverifikasi.');
    } else {
      showNotification('error', res.message);
    }
    setTesting(false);
    setTestResult(res);
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    refreshSupabaseStatus();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    showNotification('info', 'Koneksi Supabase telah diputus dari perangkat ini.');
  };

  const handleSyncUp = async () => {
    saveSupabaseConfig({ url, anonKey });
    refreshSupabaseStatus();
    setSyncing(true);
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
    setSyncing(false);
    refreshSupabaseStatus();
    setTestResult({ success: res.success, message: res.message });
    showNotification(res.success ? 'success' : 'error', res.message);
  };

  const handlePullDown = async () => {
    saveSupabaseConfig({ url, anonKey });
    refreshSupabaseStatus();
    setPulling(true);
    const res = await fetchStateFromSupabase();
    setPulling(false);
    refreshSupabaseStatus();
    if (res.success && res.data) {
      restoreCompleteState(res.data);
      setTestResult({ success: true, message: res.message });
      showNotification('success', res.message);
    } else {
      setTestResult({ success: false, message: res.message });
      showNotification('error', res.message);
    }
  };

  const copySql = () => {
    navigator.clipboard.writeText(SUPABASE_CURRICULUM_SQL_SCHEMA);
    showNotification('success', 'Skrip SQL Supabase berhasil disalin ke papan klip!');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            aria-label="Kembali ke Dashboard"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <span>Pusat Integrasi Database &amp; Penyimpanan Cloud</span>
            </h2>
            <p className="text-xs text-slate-500">
              Supabase PostgreSQL · Skema 10 Entitas Kurikulum · Penyimpanan Lokal Autosave · Google Drive Backup
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              supabaseConnected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}
          >
            {supabaseConnected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            )}
            <span>{supabaseConnected ? 'Supabase Terhubung' : 'Supabase Belum Dikonfigurasi'}</span>
          </span>
        </div>
      </div>

      {/* Summary Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Entitas Database</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{inventory.entities.length} Tabel</p>
          <p className="text-xs text-emerald-700 font-semibold mt-1">Skema curriculum_documents</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Rekaman Data</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{inventory.totalRecords} Baris</p>
          <p className="text-xs text-slate-600 mt-1">Ukuran Payload: {inventory.totalKb}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Autosave Browser</p>
          <p className="text-2xl font-black text-teal-700 mt-1">{localStorageEntries.length} Keys</p>
          <p className="text-xs text-slate-600 mt-1">Tersimpan pukul {lastAutosavedAt}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sinkron Cloud Terakhir</p>
          <p className="text-sm font-extrabold text-slate-900 mt-2 truncate">
            {supabaseLastSyncAt || 'Belum pernah sinkron'}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            {supabaseConnected ? 'Siap Push / Pull PostgreSQL' : 'Atur API Key untuk aktivasi'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center overflow-x-auto border-b border-slate-200 bg-slate-50 px-4 pt-3 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('explorer')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'explorer'
                ? 'border-emerald-600 bg-white text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Table2 className="w-4 h-4 shrink-0" />
            <span>Skema &amp; Data (10 Entitas)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('supabase')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'supabase'
                ? 'border-emerald-600 bg-white text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 className="w-4 h-4 shrink-0" />
            <span>Koneksi Supabase</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sql'
                ? 'border-emerald-600 bg-white text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Terminal className="w-4 h-4 shrink-0" />
            <span>SQL Schema DDL</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl border-b-2 transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'local'
                ? 'border-emerald-600 bg-white text-emerald-700'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive className="w-4 h-4 shrink-0" />
            <span>Penyimpanan Lokal</span>
          </button>
        </div>

        <div className="p-6">
          {/* TAB 1: Live Schema & Entity Data Explorer */}
          {activeTab === 'explorer' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Entity List */}
              <div className="lg:col-span-5 space-y-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3">
                  Daftar Kolom Tabel (curriculum_documents)
                </h3>
                {inventory.entities.map((entity) => {
                  const isSelected = entity.key === selectedEntity.key;
                  return (
                    <button
                      key={entity.key}
                      type="button"
                      onClick={() => setSelectedEntityKey(entity.key)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-500 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
                            {entity.tableColumn}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500">jsonb</span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 mt-1 truncate">{entity.label}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="block text-xs font-extrabold text-slate-900">
                          {entity.recordCount} {entity.unitLabel}
                        </span>
                        <span className="block text-[10px] font-mono text-slate-500">{entity.estimatedKb}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Right JSON Inspector */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Pratinjau Data: <span className="font-mono text-emerald-700">{selectedEntity.tableColumn}</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      {selectedEntity.label} · {selectedEntity.recordCount} {selectedEntity.unitLabel} ({selectedEntity.estimatedKb})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(selectedEntity.previewSample, null, 2));
                      showNotification('success', `Data JSON "${selectedEntity.tableColumn}" disalin ke papan klip.`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin JSON</span>
                  </button>
                </div>

                <pre className="flex-1 max-h-[540px] overflow-auto p-4 rounded-xl bg-slate-900 text-emerald-100 text-[11px] font-mono leading-relaxed border border-slate-800">
                  {JSON.stringify(selectedEntity.previewSample, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: Supabase Configuration & Actions */}
          {activeTab === 'supabase' && (
            <form onSubmit={handleSaveAndTest} className="max-w-2xl space-y-5">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 leading-relaxed">
                <strong>Cara Menghubungkan Supabase:</strong> Masuk ke dashboard{' '}
                <span className="font-mono font-semibold">supabase.com</span>, pilih proyek Anda, buka{' '}
                <strong>Project Settings &gt; API</strong>, lalu salin <strong>Project URL</strong> dan{' '}
                <strong>anon public key</strong> ke formulir di bawah ini.
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="db-view-supabase-url"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Supabase Project URL
                  </label>
                  <div className="relative">
                    <Link2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="db-view-supabase-url"
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://xxxxxxxxx.supabase.co"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="db-view-supabase-key"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                  >
                    Supabase Anon / Public Key
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="db-view-supabase-key"
                      type={showKey ? 'text' : 'password'}
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((prev) => !prev)}
                      aria-label={showKey ? 'Sembunyikan API Key' : 'Tampilkan API Key'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-start gap-3 border ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="font-medium leading-relaxed">{testResult.message}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={testing}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer"
                  >
                    {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 text-emerald-300" />}
                    <span>{testing ? 'Menguji Koneksi...' : 'Simpan & Uji Koneksi'}</span>
                  </button>

                  {url && (
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      Putus Koneksi
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePullDown}
                    disabled={pulling || !url || !anonKey}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {pulling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>Tarik dari Cloud</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncUp}
                    disabled={syncing || !url || !anonKey}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>Simpan ke Cloud</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: SQL Schema */}
          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs text-slate-600">
                  Jalankan skrip DDL PostgreSQL berikut di <strong>Supabase SQL Editor</strong> untuk membuat tabel{' '}
                  <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">curriculum_documents</code> beserta kebijakan RLS:
                </p>
                <button
                  type="button"
                  onClick={copySql}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Skrip SQL</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                {SUPABASE_CURRICULUM_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {/* TAB 4: LocalStorage Inspector & Cloud Backup */}
          {activeTab === 'local' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Daftar Kunci Penyimpanan Browser (LocalStorage)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Seluruh perubahan otomatis tersimpan di perangkat ini dan disinkronkan tiap 30 detik.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={backupToJson}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Ekspor JSON Lengkap</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('backup')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Google Drive Backup</span>
                  </button>
                  <button
                    type="button"
                    onClick={cleanupDeprecatedStorage}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Bersihkan Cache Usang</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <th className="py-2.5 px-3 font-bold">Nama Kunci Storage</th>
                      <th className="py-2.5 px-3 font-bold">Ukuran</th>
                      <th className="py-2.5 px-3 font-bold">Cuplikan Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localStorageEntries.map((entry) => (
                      <tr key={entry.key} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-emerald-800 whitespace-nowrap">
                          {entry.key}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                          {entry.kb}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 max-w-md truncate">
                          {entry.preview}
                        </td>
                      </tr>
                    ))}
                    {localStorageEntries.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-6 text-center text-slate-500">
                          Belum ada data tersimpan di LocalStorage.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

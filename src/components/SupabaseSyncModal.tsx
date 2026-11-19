import React, { useState, useEffect } from 'react';
import { Database, CheckCircle, AlertCircle, RefreshCw, Upload, Download, Key, Link2, X, Terminal } from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  syncStateToSupabase,
  fetchStateFromSupabase,
} from '../services/supabaseClient';
import { SUPABASE_CURRICULUM_SQL_SCHEMA } from '../utils/databaseIntegrationLogic';
import { useApp } from '../context/AppContext';

interface SupabaseSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseSyncModal: React.FC<SupabaseSyncModalProps> = ({ isOpen, onClose }) => {
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
    showNotification,
    restoreCompleteState,
    refreshSupabaseStatus,
  } = useApp();

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'schema'>('config');

  useEffect(() => {
    if (isOpen) {
      const cfg = getStoredSupabaseConfig();
      setUrl(cfg.url);
      setAnonKey(cfg.anonKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url, anonKey);
    if (res.success) {
      saveSupabaseConfig({ url, anonKey });
      refreshSupabaseStatus();
      showNotification('success', 'Konfigurasi Supabase berhasil disimpan dan terhubung.');
    } else {
      showNotification('error', res.message);
    }
    setTesting(false);
    setTestResult(res);
  };

  const handleClear = () => {
    clearSupabaseConfig();
    refreshSupabaseStatus();
    setUrl('');
    setAnonKey('');
    setTestResult(null);
    showNotification('info', 'Konfigurasi Supabase dihapus.');
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
    if (res.success) {
      showNotification('success', res.message);
    } else {
      showNotification('error', res.message);
    }
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
      showNotification('success', res.message);
      onClose();
    } else {
      showNotification('error', res.message);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Koneksi Supabase Cloud Database"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-md">
              <Database className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Koneksi Supabase Cloud Database</h2>
              <p className="text-xs text-emerald-100">
                Sinkronkan perangkat ajar Kurikulum Merdeka ke Supabase PostgreSQL
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup modal Supabase"
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 space-x-4">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Kredensial &amp; Sinkronisasi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center space-x-2 cursor-pointer ${
              activeTab === 'schema'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>SQL Schema (Supabase SQL Editor)</span>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {activeTab === 'config' ? (
            <>
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 leading-relaxed">
                <span className="font-bold">Panduan Koneksi Supabase:</span> Buka dashboard Supabase Anda
                (supabase.com), buat proyek baru, lalu salin <strong className="font-mono">Project URL</strong> dan{' '}
                <strong className="font-mono">anon/public API key</strong> dari menu Project Settings &gt; API.
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="modal-supabase-url"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Supabase Project URL
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Link2 className="w-4 h-4" />
                    </span>
                    <input
                      id="modal-supabase-url"
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://xxxxxxxxx.supabase.co"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="modal-supabase-key"
                    className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
                  >
                    Supabase Anon / Public Key
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Key className="w-4 h-4" />
                    </span>
                    <input
                      id="modal-supabase-key"
                      type="password"
                      value={anonKey}
                      onChange={(e) => setAnonKey(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>
              </div>

              {testResult && (
                <div
                  className={`p-4 rounded-xl text-xs flex items-start space-x-3 border ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 leading-relaxed font-medium">{testResult.message}</div>
                </div>
              )}

              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSaveAndTest}
                    disabled={testing}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    {testing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Database className="w-4 h-4 text-emerald-600" />
                    )}
                    <span>{testing ? 'Menguji...' : 'Simpan & Uji Koneksi'}</span>
                  </button>

                  {url && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="px-3 py-2 text-rose-600 hover:bg-rose-50 text-xs font-semibold rounded-xl transition cursor-pointer"
                    >
                      Putus Koneksi
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handlePullDown}
                    disabled={pulling || !url || !anonKey}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    {pulling ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{pulling ? 'Menarik...' : 'Tarik dari Supabase'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSyncUp}
                    disabled={syncing || !url || !anonKey}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    {syncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{syncing ? 'Menyimpan...' : 'Sinkronkan ke Cloud'}</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="text-xs text-slate-600">
                Salin skrip SQL di bawah ini dan jalankan di{' '}
                <strong className="font-semibold text-slate-800">Supabase SQL Editor</strong> untuk membuat tabel
                penyimpanan perangkat ajar:
              </div>
              <div className="relative">
                <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                  {SUPABASE_CURRICULUM_SQL_SCHEMA}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(SUPABASE_CURRICULUM_SQL_SCHEMA);
                    showNotification('success', 'Skrip SQL berhasil disalin ke papan klip!');
                  }}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-semibold transition border border-slate-700 shadow-xs cursor-pointer"
                >
                  Salin SQL
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

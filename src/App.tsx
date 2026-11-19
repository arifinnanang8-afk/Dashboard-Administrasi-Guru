import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { StatCards } from './components/StatCards';
import { DeepLearningBanner } from './components/DeepLearningBanner';
import { SmartAiAssistantPanel } from './components/SmartAiAssistantPanel';
import { JpDistributionRechartsDashboard } from './components/JpDistributionRechartsDashboard';
import { CpStudentMappingDashboard } from './components/CpStudentMappingDashboard';
import { CpRegulationComparisonD3 } from './components/CpRegulationComparisonD3';
import { SyncPanel } from './components/SyncPanel';
import { DatabaseIntegrationPanel } from './components/DatabaseIntegrationPanel';
import { RoadmapSteps } from './components/RoadmapSteps';
import { MenuGrid } from './components/MenuGrid';
import { NotificationToast } from './components/NotificationToast';
import { PrintModal } from './components/PrintModal';
import { SupabaseSyncModal } from './components/SupabaseSyncModal';
import {
  LayoutDashboard,
  Calendar,
  BookOpenCheck,
  ListChecks,
  Table2,
  BookOpen,
  FileText,
  Award,
  Minimize2,
  Maximize2,
  EyeOff,
  Database,
} from 'lucide-react';
import { MenuKey } from './types';

// Detail Views
import { CoverPengesahanView } from './views/CoverPengesahanView';
import { BundelLengkapView } from './views/BundelLengkapView';
import { AnalisisCpAtpView } from './views/AnalisisCpAtpView';
import { AnalisisBloomView } from './views/AnalisisBloomView';
import { AnalisisPerangkatView } from './views/AnalisisPerangkatView';
import { KaldikView } from './views/KaldikView';
import { RpeView } from './views/RpeView';
import { ProtaView } from './views/ProtaView';
import { PromesView } from './views/PromesView';
import { ModulAjarView } from './views/ModulAjarView';
import { LkpdView } from './views/LkpdView';
import { AsesmenPenilaianView } from './views/AsesmenPenilaianView';
import { PusatSinkronisasiView } from './views/PusatSinkronisasiView';
import { ProfilSatuanView } from './views/ProfilSatuanView';
import { BankCpView } from './views/BankCpView';
import { SinkronisasiModulView } from './views/SinkronisasiModulView';
import { PusatUnduhView } from './views/PusatUnduhView';
import { BackupRestoreView } from './views/BackupRestoreView';
import { DatabaseIntegrationView } from './views/DatabaseIntegrationView';
import { AiAssistantView } from './views/AiAssistantView';

import { LoginView } from './views/LoginView';

const SIDEBAR_MODULES: { key: MenuKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'dashboard', label: 'Dashboard Utama', icon: LayoutDashboard },
  { key: 'rpe', label: 'Kalender & RPE', icon: Calendar },
  { key: 'cp_atp', label: 'Analisis CP & ATP', icon: BookOpenCheck },
  { key: 'prota', label: 'Program Tahunan (PROTA)', icon: ListChecks },
  { key: 'promes', label: 'Program Semester (PROMES)', icon: Table2 },
  { key: 'modul_ajar', label: 'Modul Ajar Deep Learning', icon: BookOpen },
  { key: 'lkpd', label: 'Lembar Kerja (LKPD)', icon: FileText },
  { key: 'asesmen', label: 'Penilaian Rapor', icon: Award },
  { key: 'database', label: 'Integrasi Database', icon: Database },
];

const MainContent: React.FC = () => {
  const {
    activeView,
    setActiveView,
    isFocusMode,
    toggleFocusMode,
    schoolProfile,
    stats,
    isAuthenticated,
    isSupabaseModalOpen,
    setIsSupabaseModalOpen,
  } = useApp();

  if (!isAuthenticated) {
    return <LoginView />;
  }

  const isFocusSupportedView = activeView === 'modul_ajar' || activeView === 'lkpd';
  const isFocusActive = isFocusMode && isFocusSupportedView;

  const renderActiveView = () => {
    switch (activeView) {
      case 'cover':
        return <CoverPengesahanView />;
      case 'bundel':
        return <BundelLengkapView />;
      case 'cp_atp':
        return <AnalisisCpAtpView />;
      case 'bloom':
        return <AnalisisBloomView />;
      case 'analisis_perangkat':
        return <AnalisisPerangkatView />;
      case 'kaldik':
        return <KaldikView />;
      case 'rpe':
        return <RpeView />;
      case 'prota':
        return <ProtaView />;
      case 'promes':
        return <PromesView />;
      case 'modul_ajar':
        return <ModulAjarView />;
      case 'lkpd':
        return <LkpdView />;
      case 'asesmen':
        return <AsesmenPenilaianView />;
      case 'sinkronisasi':
        return <PusatSinkronisasiView />;
      case 'profil':
        return <ProfilSatuanView />;
      case 'bank_cp':
        return <BankCpView />;
      case 'sinkron_modul':
        return <SinkronisasiModulView />;
      case 'pusat_unduh':
        return <PusatUnduhView />;
      case 'backup':
        return <BackupRestoreView />;
      case 'database':
        return <DatabaseIntegrationView />;
      case 'ai_asisten':
        return <AiAssistantView />;
      case 'dashboard':
      default:
        return (
          <>
            <StatCards />
            <JpDistributionRechartsDashboard />
            <DeepLearningBanner />
            <SmartAiAssistantPanel />
            <CpStudentMappingDashboard />
            <CpRegulationComparisonD3 />
            <SyncPanel />
            <DatabaseIntegrationPanel />
            <RoadmapSteps />
            <MenuGrid />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between">
      <div>
        {/* Global Header hidden during Focus Mode */}
        {!isFocusActive ? (
          <Header />
        ) : (
          /* Minimalist Sticky Focus Mode Top Bar */
          <div className="sticky top-0 z-40 bg-slate-900 text-white px-4 sm:px-6 py-2.5 border-b border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3 no-print">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-[11px] uppercase tracking-wider">
                <EyeOff className="w-3.5 h-3.5" />
                <span>Mode Fokus Aktif</span>
              </span>
              <span className="text-xs font-semibold text-slate-300 hidden sm:inline">
                Sidebar &amp; navigasi disembunyikan • {schoolProfile.subject} ({schoolProfile.grade})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveView('modul_ajar')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'modul_ajar'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Modul Ajar</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('lkpd')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeView === 'lkpd'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>LKPD</span>
                </button>
              </div>

              <button
                type="button"
                onClick={toggleFocusMode}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow transition-all cursor-pointer"
                title="Keluar dari Mode Fokus dan tampilkan kembali sidebar serta navigasi"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Keluar Mode Fokus</span>
              </button>
            </div>
          </div>
        )}

        <main
          className={`${
            isFocusActive ? 'max-w-5xl' : 'max-w-7xl'
          } mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 transition-all`}
        >
          {activeView !== 'dashboard' && !isFocusActive ? (
            <div className="flex flex-col lg:flex-row gap-6 items-start">
              {/* Collapsible Curriculum Sidebar (Hidden in Focus Mode) */}
              <aside
                aria-label="Sidebar Navigasi Perangkat Ajar"
                className="w-full lg:w-60 shrink-0 bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3 space-y-2 lg:sticky lg:top-4 no-print"
              >
                <div className="px-2 py-1 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                    Navigasi Modul
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Pipeline
                  </span>
                </div>
                <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
                  {SIDEBAR_MODULES.map((item) => {
                    const Icon = item.icon;
                    const isCurrent = activeView === item.key;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveView(item.key)}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer text-left ${
                          isCurrent
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-emerald-300' : 'text-slate-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {isFocusSupportedView && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={toggleFocusMode}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-extrabold transition-all cursor-pointer"
                      title="Sembunyikan sidebar & navigasi untuk fokus menyusun Modul Ajar / LKPD"
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Aktifkan Mode Fokus</span>
                    </button>
                  </div>
                )}
              </aside>

              {/* Main Module Content Area */}
              <div className="flex-1 min-w-0 w-full">{renderActiveView()}</div>
            </div>
          ) : (
            renderActiveView()
          )}
        </main>
      </div>

      {/* Official Standard Footer (Hidden during Focus Mode) */}
      {!isFocusActive && (
        <footer className="bg-white border-t border-slate-200 mt-12 py-6 px-4 sm:px-6 lg:px-8 no-print">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-semibold text-slate-800">
                Dashboard Administrasi Guru · Kurikulum Merdeka &amp; Pembelajaran Mendalam
              </p>
              <p>
                Berlandaskan KepKa BSKAP No. 046/H/KR/2025, Permendikbudristek No. 12 Tahun 2024, Permendikbudristek Nomor 13 Tahun 2025, dan KMA No. 1503 Tahun 2025.
              </p>
            </div>
            <div className="text-center sm:text-right font-medium">
              <p className="text-emerald-700 font-bold">100% Selaras Otomatis ({stats.protaTotalJp || 132} JP)</p>
              <p className="text-[11px] text-slate-400">{schoolProfile.schoolName.toUpperCase()} · TA {schoolProfile.academicYear}</p>
            </div>
          </div>
        </footer>
      )}

      {/* Global Modals & Notifications */}
      <PrintModal />
      <SupabaseSyncModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
      <NotificationToast />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}


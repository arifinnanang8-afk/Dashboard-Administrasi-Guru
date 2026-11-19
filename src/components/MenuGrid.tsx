import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { MenuCategory, MenuKey } from '../types';
import {
  Compass,
  Search,
  Bookmark,
  Layers,
  BookOpenCheck,
  Brain,
  BarChart3,
  Calendar,
  Clock,
  FileSpreadsheet,
  Grid3X3,
  BookOpen,
  FileText,
  GraduationCap,
  RefreshCw,
  Building2,
  Library,
  GitMerge,
  DownloadCloud,
  HardDrive,
  Sparkles,
  ArrowRight,
  Download,
  Printer,
  Upload,
  Database,
} from 'lucide-react';

export const MenuGrid: React.FC = () => {
  const {
    menuItems,
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    setActiveView,
    openPrintModal,
    stats,
  } = useApp();

  const categories: { label: MenuCategory; count: number }[] = [
    { label: 'Semua', count: 20 },
    { label: 'Perencanaan', count: 6 },
    { label: 'Program', count: 4 },
    { label: 'Pelaksanaan', count: 6 },
    { label: 'Pengaturan & Berkas', count: 4 },
  ];

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = activeCategory === 'Semua' || item.category === activeCategory;
      const matchQuery =
        searchQuery === '' ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [menuItems, activeCategory, searchQuery]);

  // Icon mapping
  const getMenuIcon = (key: MenuKey) => {
    switch (key) {
      case 'cover':
        return <Bookmark className="w-5 h-5 text-emerald-600" />;
      case 'bundel':
        return <Layers className="w-5 h-5 text-emerald-600" />;
      case 'cp_atp':
        return <BookOpenCheck className="w-5 h-5 text-emerald-600" />;
      case 'bloom':
        return <Brain className="w-5 h-5 text-purple-600" />;
      case 'analisis_perangkat':
        return <BarChart3 className="w-5 h-5 text-teal-600" />;
      case 'kaldik':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'rpe':
        return <Clock className="w-5 h-5 text-indigo-600" />;
      case 'prota':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      case 'promes':
        return <Grid3X3 className="w-5 h-5 text-cyan-600" />;
      case 'modul_ajar':
        return <BookOpen className="w-5 h-5 text-purple-600" />;
      case 'lkpd':
        return <FileText className="w-5 h-5 text-emerald-600" />;
      case 'asesmen':
        return <GraduationCap className="w-5 h-5 text-teal-600" />;
      case 'sinkronisasi':
        return <RefreshCw className="w-5 h-5 text-teal-600" />;
      case 'profil':
        return <Building2 className="w-5 h-5 text-rose-600" />;
      case 'bank_cp':
        return <Library className="w-5 h-5 text-emerald-600" />;
      case 'sinkron_modul':
        return <GitMerge className="w-5 h-5 text-teal-600" />;
      case 'pusat_unduh':
        return <DownloadCloud className="w-5 h-5 text-slate-600" />;
      case 'backup':
        return <HardDrive className="w-5 h-5 text-emerald-600" />;
      case 'database':
        return <Database className="w-5 h-5 text-teal-600" />;
      case 'ai_asisten':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      default:
        return <FileText className="w-5 h-5 text-slate-600" />;
    }
  };

  const getMenuIconBg = (key: MenuKey) => {
    switch (key) {
      case 'bloom':
      case 'modul_ajar':
        return 'bg-purple-50 border-purple-200';
      case 'kaldik':
        return 'bg-blue-50 border-blue-200';
      case 'rpe':
        return 'bg-indigo-50 border-indigo-200';
      case 'promes':
        return 'bg-cyan-50 border-cyan-200';
      case 'profil':
        return 'bg-rose-50 border-rose-200';
      case 'ai_asisten':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-emerald-50 border-emerald-200';
    }
  };

  const handleSecondaryAction = (actionKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (actionKey === 'bank_cp') {
      setActiveView('bank_cp');
    } else if (actionKey === 'unduh_bloom') {
      openPrintModal('bloom');
    } else if (actionKey === 'upload_kaldik') {
      setActiveView('kaldik');
    } else if (actionKey === 'cetak_rpe') {
      openPrintModal('rpe');
    } else if (actionKey === 'sinkron_modul') {
      setActiveView('sinkron_modul');
    } else if (actionKey === 'unduh_lkpd') {
      openPrintModal('lkpd');
    } else if (actionKey === 'unduh_nilai') {
      setActiveView('asesmen');
    }
  };

  return (
    <section className="my-6">
      {/* Title & Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100/80 text-emerald-800">
            <Compass className="w-6 h-6 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Menu Administrasi Pembelajaran
            </h2>
            <p className="text-xs text-slate-500">
              Pilih modul administrasi Kurikulum Merdeka yang ingin Anda kelola
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="main-menu-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari modul (contoh: CP, Modul, RPE)..."
            className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-slate-800 placeholder-slate-400 shadow-sm"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-5 text-xs font-medium">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setActiveCategory(cat.label)}
            className={`px-3.5 py-1.5 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
              activeCategory === cat.label
                ? 'bg-slate-900 text-white shadow-sm font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* 4-Column Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.key}
            onClick={() => setActiveView(item.key)}
            className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex flex-col justify-between group cursor-pointer text-left"
          >
            {/* Top row: Icon + Right Badge */}
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className={`p-2.5 rounded-xl border ${getMenuIconBg(item.key)}`}>
                  {getMenuIcon(item.key)}
                </div>
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full truncate max-w-[170px]">
                  {item.badge}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors mb-1.5 leading-snug">
                {item.title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-4">
                {item.description}
              </p>
            </div>

            {/* Footer: Status + Buttons */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px]">
              <span className="text-slate-500 truncate max-w-[110px]" title={item.statusInfo}>
                {item.statusInfo}
              </span>

              <div className="flex items-center gap-1.5 shrink-0">
                {item.secondaryButton && (
                  <button
                    onClick={(e) => handleSecondaryAction(item.secondaryButton!.actionKey, e)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 font-medium transition-colors cursor-pointer text-[10px]"
                  >
                    {item.secondaryButton.actionKey.includes('unduh') && <Download className="w-3 h-3 text-slate-500" />}
                    {item.secondaryButton.actionKey.includes('cetak') && <Printer className="w-3 h-3 text-slate-500" />}
                    {item.secondaryButton.actionKey.includes('upload') && <Upload className="w-3 h-3 text-slate-500" />}
                    <span>{item.secondaryButton.label}</span>
                  </button>
                )}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveView(item.key);
                  }}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold shadow-sm transition-all active:scale-95 cursor-pointer text-xs"
                >
                  <span>Buka</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calendar,
  FileText,
  Brain,
  BookOpen,
  GraduationCap,
  ArrowRight,
  Check,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Award,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export const StatCards: React.FC = () => {
  const { stats, setActiveView, rpe, prota, tujuanPembelajaran, modulAjarList, students } = useApp();
  const [showDetailedCharts, setShowDetailedCharts] = useState(false);

  // 1. Pekan Efektif monthly data (12 months S1 + S2)
  const monthlyRpeData = [
    ...(rpe?.semester1?.months || []).map((m) => ({
      name: m.month.slice(0, 3),
      pekan: m.effectiveWeeks,
      semester: 'S1',
    })),
    ...(rpe?.semester2?.months || []).map((m) => ({
      name: m.month.slice(0, 3),
      pekan: m.effectiveWeeks,
      semester: 'S2',
    })),
  ];

  // 2. PROTA allocation per chapter / bab
  const protaChartData = (prota || []).map((p, idx) => ({
    name: `B${idx + 1}`,
    bab: p.babTitle,
    jp: p.alokasiJp,
    semester: p.semester,
  }));

  // 3. Bloom taxonomy donut data (HOTS vs MOTS/LOTS)
  const hotsCount = stats.bloomHotsCount;
  const lotsCount = Math.max(0, (tujuanPembelajaran || []).length - hotsCount);
  const bloomDonutData = [
    { name: 'HOTS (C4-C6)', value: stats.bloomHotsPct, count: hotsCount, color: '#9333ea' },
    { name: 'MOTS/LOTS (C1-C3)', value: Math.max(0, 100 - stats.bloomHotsPct), count: lotsCount, color: '#e9d5ff' },
  ];

  // Bloom level distribution C1-C6
  const bloomLevels = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
  const bloomLevelCounts = bloomLevels.map((lvl) => {
    const count = (tujuanPembelajaran || []).filter((tp) => tp.bloomLevel === lvl).length;
    return {
      level: lvl,
      count,
      isHots: ['C4', 'C5', 'C6'].includes(lvl),
    };
  });

  // 4. Modul Ajar duration / completeness per module
  const modulChartData = (modulAjarList || []).map((m, idx) => ({
    name: `M${idx + 1}`,
    materi: m.babTitle || `Modul ${idx + 1}`,
    jp: m.alokasiJp || 18,
  }));

  // 5. Student score curve (sample first 16 students for clean visualization)
  const studentScoresData = (students || []).slice(0, 16).map((s, idx) => ({
    name: s.name.split(' ')[0],
    no: idx + 1,
    nilai: s.nilaiAkhir,
    kktp: 75,
  }));

  // Administrative Documents Completeness Pipeline (10 Documents)
  const docPipelineData = [
    { doc: 'Cover & Legalitas', progress: 100, code: 'COV' },
    { doc: 'Kalender Pendidikan', progress: 100, code: 'KAL' },
    { doc: 'Rincian Pekan Efektif', progress: 100, code: 'RPE' },
    { doc: 'Analisis CP & ATP', progress: 100, code: 'ATP' },
    { doc: 'Program Tahunan', progress: 100, code: 'PROTA' },
    { doc: 'Program Semester', progress: 100, code: 'PROMES' },
    { doc: 'Modul Ajar Deep Learning', progress: 100, code: 'MOD' },
    { doc: 'Lembar Kerja Siswa (LKPD)', progress: 100, code: 'LKPD' },
    { doc: 'Pemetaan Siswa CP', progress: 100, code: 'MAP' },
    { doc: 'Asesmen & Rapor', progress: 100, code: 'RAP' },
  ];

  return (
    <section className="my-5 space-y-3">
      {/* 5 Primary Stat Cards with Integrated Micro Recharts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* CARD 1: PEKAN EFEKTIF */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveView('rpe')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveView('rpe');
            }
          }}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-400 transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                PEKAN EFEKTIF
              </span>
              <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600">
                <Calendar className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.pekanEfektifTotal}
              </span>
              <span className="text-xs font-semibold text-slate-600">Pekan / Thn</span>
            </div>

            {/* Micro Recharts BarChart: 12-month weekly distribution */}
            <div className="h-10 w-full my-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRpeData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                            <span className="font-bold">{data.name}</span>: {data.pekan} Pekan ({data.semester})
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="pekan"
                    fill="#3b82f6"
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <span className="font-medium text-slate-600">
              S1: {stats.pekanEfektifS1} · S2: {stats.pekanEfektifS2}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* CARD 2: ALOKASI PROTA */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveView('prota')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveView('prota');
            }
          }}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-400 transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                ALOKASI PROTA
              </span>
              <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                <FileText className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.protaTotalJp}
              </span>
              <span className="text-xs font-semibold text-slate-600">JP Total</span>
            </div>

            {/* Micro Recharts BarChart: JP per Bab */}
            <div className="h-10 w-full my-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={protaChartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg max-w-[140px]">
                            <span className="font-bold">{data.name}</span>: {data.jp} JP
                            <p className="text-[9px] text-emerald-300 truncate">{data.bab}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="jp"
                    fill="#10b981"
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <span className="font-semibold text-emerald-700 flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              Sinkron Kalender (100%)
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* CARD 3: TAKSONOMI BLOOM */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveView('bloom')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveView('bloom');
            }
          }}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-400 transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                TAKSONOMI BLOOM
              </span>
              <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
                <Brain className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.bloomHotsPct}%
              </span>
              <span className="text-xs font-semibold text-slate-600">HOTS (C4-C6)</span>
            </div>

            {/* Micro Recharts Donut PieChart */}
            <div className="h-10 w-full my-1.5 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                            <span className="font-bold">{data.name}</span>: {data.value}% ({data.count} TP)
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Pie
                    data={bloomDonutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={10}
                    outerRadius={18}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                  >
                    {bloomDonutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <span className="font-medium text-slate-600">
              Sangat Baik ({stats.bloomHotsCount} TP HOTS)
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* CARD 4: MODUL AJAR */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveView('modul_ajar')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveView('modul_ajar');
            }
          }}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-fuchsia-400 transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                MODUL AJAR
              </span>
              <div className="p-1.5 rounded-xl bg-fuchsia-50 text-fuchsia-600">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.modulCount}
              </span>
              <span className="text-xs font-semibold text-slate-600">Modul Lengkap</span>
            </div>

            {/* Micro Recharts BarChart: 7 Modul JP breakdown */}
            <div className="h-10 w-full my-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modulChartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg max-w-[140px]">
                            <span className="font-bold">{data.name}</span>: {data.jp} JP
                            <p className="text-[9px] text-fuchsia-300 truncate">{data.materi}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="jp"
                    fill="#c026d3"
                    radius={[2, 2, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <span className="font-medium text-slate-600 truncate">
              Berdiferensiasi &amp; LKPD
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-fuchsia-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>

        {/* CARD 5: KETUNTASAN KELAS */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setActiveView('asesmen')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setActiveView('asesmen');
            }
          }}
          className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-teal-400 transition-all text-left flex flex-col justify-between group cursor-pointer relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                KETUNTASAN KELAS
              </span>
              <div className="p-1.5 rounded-xl bg-teal-50 text-teal-600">
                <GraduationCap className="w-4 h-4" />
              </div>
            </div>

            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-2xl font-black text-slate-900 tracking-tight">
                {stats.masteryRate}%
              </span>
              <span className="text-xs font-semibold text-slate-600">Tuntas KKTP</span>
            </div>

            {/* Micro Recharts AreaChart: Student score distribution curve */}
            <div className="h-10 w-full my-1.5">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={studentScoresData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                            <span className="font-bold">{data.name}</span>: Nilai {data.nilai}
                            <span className="text-[9px] text-teal-300 ml-1 font-mono">(KKTP 75)</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <defs>
                    <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0d9488" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="nilai"
                    stroke="#0d9488"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#tealGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px]">
            <span className="font-semibold text-teal-700">
              {stats.totalStudents} Siswa · Rerata {stats.classAverage}
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-1 transition-all" />
          </div>
        </div>
      </div>

      {/* Toggle Banner for Real-Time Recharts Analytics Dashboard */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100/90 rounded-xl border border-slate-200/90 transition-all">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-emerald-700" />
          <span className="text-xs font-bold text-slate-800">
            Visualisasi Progres Real-Time Administrasi Kurikulum (Recharts)
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
            <Sparkles className="w-3 h-3 text-emerald-600" />
            100% Terintegrasi
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowDetailedCharts((prev) => !prev)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-500 text-xs font-semibold shadow-2xs transition-all cursor-pointer"
        >
          <span>{showDetailedCharts ? 'Sembunyikan Grafik' : 'Lihat Analitik Lengkap'}</span>
          {showDetailedCharts ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expanded Interactive Recharts Analytics Panel */}
      {showDetailedCharts && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Chart 1: Kelengkapan 10 Dokumen Administrasi Guru */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Kelengkapan 10 Berkas Wajib
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  100% Siap
                </span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={docPipelineData}
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis
                      dataKey="code"
                      type="category"
                      tick={{ fontSize: 10, fill: '#475569', fontWeight: 600 }}
                      width={38}
                    />
                    <Tooltip
                      formatter={(val: any, _name: any, item: any) => [
                        `${val}% (Lengkap & Terverifikasi)`,
                        item.payload.doc,
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                        border: 'none',
                      }}
                    />
                    <Bar
                      dataKey="progress"
                      fill="#059669"
                      radius={[0, 4, 4, 0]}
                      barSize={12}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                Sesuai KepKa BSKAP 046/2025, Permendikbudristek 12/2024 &amp; 13/2025, KMA 1503/2025
              </p>
            </div>

            {/* Chart 2: Sebaran Pekan & Jam Efektif Semester 1 & 2 */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-700" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Sebaran Pekan Efektif (12 Bulan)
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {stats.pekanEfektifTotal} Pekan / 132 JP
                </span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRpeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[0, 6]} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: any) => [`${val} Pekan Efektif`, 'Pekan']}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                        border: 'none',
                      }}
                    />
                    <Bar
                      dataKey="pekan"
                      fill="#2563eb"
                      radius={[4, 4, 0, 0]}
                      barSize={16}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                Semester 1 (20 Pekan) · Semester 2 (19 Pekan) · Sinkron Otomatis
              </p>
            </div>

            {/* Chart 3: Distribusi Kognitif Taksonomi Bloom (C1-C6) */}
            <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-700" />
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                    Distribusi Kognitif Bloom (C1-C6)
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                  {stats.bloomHotsPct}% HOTS
                </span>
              </div>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bloomLevelCounts} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="level" tick={{ fontSize: 10, fill: '#64748b' }} />
                    <YAxis domain={[0, 'dataMax + 1']} tick={{ fontSize: 10, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(val: any, _name: any, item: any) => [
                        `${val} Tujuan Pembelajaran (${item.payload.isHots ? 'HOTS C4-C6' : 'LOTS/MOTS'})`,
                        `Level ${item.payload.level}`,
                      ]}
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '11px',
                        border: 'none',
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={20} isAnimationActive={false}>
                      {bloomLevelCounts.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isHots ? '#9333ea' : '#c084fc'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-slate-500 mt-2 text-center">
                Mendukung Pembelajaran Mendalam (Mindful, Meaningful, Joyful)
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

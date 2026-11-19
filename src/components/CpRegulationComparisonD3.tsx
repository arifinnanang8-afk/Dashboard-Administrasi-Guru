import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  GitCompare,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Sparkles,
  Info,
  Layers,
  FileCheck2,
  Zap,
  BarChart2,
  GitBranch,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export interface CpComparisonNode {
  id: string;
  subject: string;
  fase: string;
  elemen: string;
  regulasiLama: {
    regulasi: string; // 'BSKAP 033/H/KR/2022';
    alokasiJp: number;
    hotsPercentage: number;
    deskripsiCp: string;
    fokusUtama: string;
  };
  regulasiBaru: {
    regulasi: string; // 'Permendikbudristek 12/2024 & BSKAP 046/2025';
    alokasiJp: number;
    hotsPercentage: number;
    deskripsiCp: string;
    fokusUtama: string;
    deepLearningApproach: string;
  };
  perubahanUtama: string[];
}

const COMPARISON_DATA: CpComparisonNode[] = [
  {
    id: 'indo-elemen-1',
    subject: 'Bahasa Indonesia',
    fase: 'Fase E (Kelas 10)',
    elemen: 'Menyimak & Membaca Memirsa',
    regulasiLama: {
      regulasi: 'KepKa BSKAP No. 033/H/KR/2022',
      alokasiJp: 36,
      hotsPercentage: 55,
      deskripsiCp: 'Peserta didik mampu mengevaluasi gagasan dan pandangan berdasarkan kaidah logika dari menyimak berbagai jenis teks.',
      fokusUtama: 'Pemahaman literal dan interpretasi struktur teks monolog/dialog.',
    },
    regulasiBaru: {
      regulasi: 'Permendikbudristek 12/2024 & BSKAP 046/2025',
      alokasiJp: 44,
      hotsPercentage: 78,
      deskripsiCp: 'Peserta didik mengevaluasi gagasan, gagasan tersirat, dan bias informasi dari teks nonsastra, fiksi sejarah, serta media digital interaktif dengan analisis kritis berkesadaran tinggi.',
      fokusUtama: 'Analisis bias media, evaluasi esai kritis, dan integrasi Pembelajaran Mendalam (Deep Learning).',
      deepLearningApproach: 'Mindful Reading & Critical Discourse Analysis',
    },
    perubahanUtama: [
      'Penambahan evaluasi bias media digital & kecerdasan artifisial (AI)',
      'Peningkatan porsi Taksonomi Bloom C4-C6 (HOTS) dari 55% ke 78%',
      'Penyesuaian alokasi waktu dari 36 JP menjadi 44 JP per tahun',
      'Penerapan siklus Deep Learning: Memahami ➔ Mengaplikasikan ➔ Merefleksi',
    ],
  },
  {
    id: 'indo-elemen-2',
    subject: 'Bahasa Indonesia',
    fase: 'Fase E (Kelas 10)',
    elemen: 'Berbicara, Mempresentasikan & Menulis',
    regulasiLama: {
      regulasi: 'KepKa BSKAP No. 033/H/KR/2022',
      alokasiJp: 36,
      hotsPercentage: 60,
      deskripsiCp: 'Peserta didik mampu menyajikan gagasan secara lisan dan tertulis melalui diskusi, naskah laporan observasi, dan teks anekdot.',
      fokusUtama: 'Keterampilan menulis naskah formal dan komedi anekdot.',
    },
    regulasiBaru: {
      regulasi: 'Permendikbudristek 12/2024 & BSKAP 046/2025',
      alokasiJp: 44,
      hotsPercentage: 82,
      deskripsiCp: 'Peserta didik mampu mempresentasikan hasil riset, merancang negosiasi bisnis kontekstual, dan mengarang antologi sastra berbasis kearifan lokal.',
      fokusUtama: 'Public speaking berbasis bukti data, negosiasi wirausaha, dan publikasi antologi digital.',
      deepLearningApproach: 'Meaningful Presentation & Authentic Product Creation',
    },
    perubahanUtama: [
      'Penguatan modul simulasi negosiasi bisnis dan wirausaha kontekstual',
      'Integrasi standar publikasi buku antologi kelas dan karya digital',
      'Penyesuaian indikator capaian penilaian berbasis projek (PjBL)',
    ],
  },
  {
    id: 'mtk-elemen-1',
    subject: 'Matematika',
    fase: 'Fase E (Kelas 10)',
    elemen: 'Bilangan & Aljabar (Eksponen & Logaritma)',
    regulasiLama: {
      regulasi: 'KepKa BSKAP No. 033/H/KR/2022',
      alokasiJp: 32,
      hotsPercentage: 50,
      deskripsiCp: 'Peserta didik dapat menggeneralisasi sifat-sifat eksponen dan logaritma serta menggunakan barisan dan deret.',
      fokusUtama: 'Manipulasi aljabar dan rumus matematika abstrak.',
    },
    regulasiBaru: {
      regulasi: 'Permendikbudristek 12/2024 & BSKAP 046/2025',
      alokasiJp: 40,
      hotsPercentage: 75,
      deskripsiCp: 'Peserta didik mengaplikasikan sifat eksponen, logaritma, serta deret geometri pada pemodelan pertumbuhan finansial, bunga majemuk, dan optimasi bisnis vokasi.',
      fokusUtama: 'Pemodelan matematika finansial, bunga majemuk, dan pemecahan masalah nyata.',
      deepLearningApproach: 'Real-world Financial Math Modeling & Joyful Math',
    },
    perubahanUtama: [
      'Penyelarasan topik eksponen dengan matematika keuangan dan bunga majemuk',
      'Peningkatan porsi numerasi kontekstual pada Asesmen Sumatif',
      'Pengintegrasian alat bantu kalkulasi digital dan spreadsheet',
    ],
  },
  {
    id: 'mtk-elemen-2',
    subject: 'Matematika',
    fase: 'Fase E (Kelas 10)',
    elemen: 'Geometri & Trigonometri',
    regulasiLama: {
      regulasi: 'KepKa BSKAP No. 033/H/KR/2022',
      alokasiJp: 28,
      hotsPercentage: 52,
      deskripsiCp: 'Peserta didik dapat menyelesaikan masalah yang berkaitan dengan segitiga siku-siku menggunakan rasio trigonometri.',
      fokusUtama: 'Hafalan rumus trigonometri sin, cos, tan segitiga.',
    },
    regulasiBaru: {
      regulasi: 'Permendikbudristek 12/2024 & BSKAP 046/2025',
      alokasiJp: 36,
      hotsPercentage: 76,
      deskripsiCp: 'Peserta didik memodelkan dan memecahkan tantangan pengukuran spasial, navigasi lapangan, dan teknik kejuruan menggunakan aturan sinus, cosinus, dan trigonometri terapan.',
      fokusUtama: 'Pengukuran spasial vokasi, aturan Sinus/Cosinus terapan, dan survei lapangan.',
      deepLearningApproach: 'Spatial Deep Inquiry & Hands-on Measurement',
    },
    perubahanUtama: [
      'Penambahan aturan sinus dan cosinus untuk pemodelan non-siku-siku',
      'Penguatan aplikasi kontekstual kejuruan / lapangan',
    ],
  },
  {
    id: 'infor-elemen-1',
    subject: 'Informatika',
    fase: 'Fase E (Kelas 10)',
    elemen: 'Berpikir Komputasional (BK) & Algoritma',
    regulasiLama: {
      regulasi: 'KepKa BSKAP No. 033/H/KR/2022',
      alokasiJp: 24,
      hotsPercentage: 65,
      deskripsiCp: 'Peserta didik memahami konsep algoritma pencarian, pengurutan, dan struktur data sederhana.',
      fokusUtama: 'Teori logika algoritma & flowchart manual.',
    },
    regulasiBaru: {
      regulasi: 'Permendikbudristek 12/2024 & BSKAP 046/2025',
      alokasiJp: 36,
      hotsPercentage: 85,
      deskripsiCp: 'Peserta didik merancang dan mengimplementasikan algoritma kompleks (Stack, Queue, Graph) serta mengevaluasi etika kecerdasan artifisial (AI Ethics) & prompt engineering.',
      fokusUtama: 'Struktur data lanjut, etika Generative AI, dan penguji perangkat lunak.',
      deepLearningApproach: 'AI Literacy, Computational Thinking & Algorithm Design',
    },
    perubahanUtama: [
      'Penambahan standar baru: Etika AI, Prompt Engineering & Generative AI Literacy',
      'Peningkatan alokasi waktu dari 24 JP ke 36 JP',
      'Praktik proyek coding mini berbasis permasalahan nyata di industri',
    ],
  },
  {
    id: 'eko-elemen-1',
    subject: 'Ekonomi',
    fase: 'Fase E (Kelas 10)',
    elemen: 'Pemahaman Konsep Ekonomi & Literasi Keuangan',
    regulasiLama: {
      regulasi: 'KepKa BSKAP No. 033/H/KR/2022',
      alokasiJp: 30,
      hotsPercentage: 50,
      deskripsiCp: 'Peserta didik memahami kelangkaan, skala prioritas, serta peran pasar dan bank.',
      fokusUtama: 'Pengenalan teori dasar ekonomi dan kelembagaan.',
    },
    regulasiBaru: {
      regulasi: 'Permendikbudristek 12/2024 & BSKAP 046/2025',
      alokasiJp: 40,
      hotsPercentage: 80,
      deskripsiCp: 'Peserta didik menganalisis kelangkaan, biaya peluang (opportunity cost), literasi investasi digital (OJK/FinTech), serta menyusun Business Model Canvas (BMC) Koperasi & BUMD.',
      fokusUtama: 'Literasi FinTech legal OJK, Business Model Canvas (BMC), dan circular flow 4 sektor.',
      deepLearningApproach: 'Financial Wellbeing, Ethics & BMC Entrepreneurship',
    },
    perubahanUtama: [
      'Integrasi standar literasi keuangan digital OJK & pencegahan pinjol/investasi bodong',
      'Penerapan Business Model Canvas (BMC) Koperasi & Kewirausahaan Siswa',
      'Analisis dampak kebijakan fiskal dan moneter Bank Indonesia (BI-FAST & QRIS)',
    ],
  },
];

export const CpRegulationComparisonD3: React.FC = () => {
  const { schoolProfile } = useApp();
  const [selectedSubject, setSelectedSubject] = useState<string>(
    schoolProfile?.subject || 'Bahasa Indonesia'
  );
  const [activeTab, setActiveTab] = useState<'chart' | 'matrix' | 'details'>('chart');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const chartSvgRef = useRef<SVGSVGElement | null>(null);
  const chartContainerRef = useRef<HTMLDivElement | null>(null);

  // Available subjects
  const subjects = Array.from(new Set(COMPARISON_DATA.map((d) => d.subject)));

  // Filtered nodes
  const filteredNodes = COMPARISON_DATA.filter((node) => {
    const matchSubject = selectedSubject === 'Semua' || node.subject === selectedSubject;
    const matchSearch =
      searchQuery.trim() === '' ||
      node.elemen.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.perubahanUtama.some((p) => p.toLowerCase().includes(searchQuery.toLowerCase())) ||
      node.regulasiBaru.deskripsiCp.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSubject && matchSearch;
  });

  // Calculate summary metrics
  const avgHotsOld = Math.round(
    d3.mean(filteredNodes, (d) => d.regulasiLama.hotsPercentage) || 55
  );
  const avgHotsNew = Math.round(
    d3.mean(filteredNodes, (d) => d.regulasiBaru.hotsPercentage) || 78
  );
  const totalJpOld = d3.sum(filteredNodes, (d) => d.regulasiLama.alokasiJp) || 0;
  const totalJpNew = d3.sum(filteredNodes, (d) => d.regulasiBaru.alokasiJp) || 0;
  const hotsIncrease = avgHotsNew - avgHotsOld;

  // D3 Rendering effect for Comparison Bar Chart & Grouped Visuals
  useEffect(() => {
    if (activeTab !== 'chart' || !chartSvgRef.current || filteredNodes.length === 0) return;

    const svg = d3.select(chartSvgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = chartContainerRef.current
      ? chartContainerRef.current.clientWidth
      : 800;
    const margin = { top: 40, right: 30, bottom: 80, left: 60 };
    const width = Math.max(500, containerWidth) - margin.left - margin.right;
    const height = 360 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Prepare data pairs for each node
    const groupKeys = ['Regulasi Lama (BSKAP 033/2022)', 'Regulasi Baru (Permendikbud 12/2024 & BSKAP 046/2025)'];
    const x0 = d3
      .scaleBand()
      .domain(filteredNodes.map((d) => d.elemen))
      .range([0, width])
      .padding(0.3);

    const x1 = d3
      .scaleBand()
      .domain(groupKeys)
      .range([0, x0.bandwidth()])
      .padding(0.1);

    const yHots = d3
      .scaleLinear()
      .domain([0, 100])
      .nice()
      .range([height, 0]);

    // Color scales
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(groupKeys)
      .range(['#94a3b8', '#0284c7']); // Slate vs Cyan Blue

    // Draw grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(yHots)
          .tickSize(-width)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3,3');

    // Axes
    const xAxis = d3.axisBottom(x0);
    const yAxis = d3.axisLeft(yHots).ticks(5).tickFormat((d) => `${d}%`);

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    xAxisGroup
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-25)')
      .attr('fill', '#334155')
      .attr('font-weight', '600')
      .attr('font-size', '11px');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#475569')
      .attr('font-weight', '600');

    // Y Axis Title
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Rasio Penekanan HOTS (Taksonomi Bloom C4-C6)');

    // Tooltip div selection
    const tooltip = d3
      .select('body')
      .selectAll('.d3-cp-tooltip')
      .data([0])
      .join('div')
      .attr('class', 'd3-cp-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', '#0f172a')
      .style('color', '#fff')
      .style('padding', '10px 14px')
      .style('border-radius', '10px')
      .style('font-size', '12px')
      .style('box-shadow', '0 10px 25px -5px rgba(0, 0, 0, 0.3)')
      .style('z-index', '9999')
      .style('pointer-events', 'none')
      .style('border', '1px solid #334155');

    // Render bars
    const elemenGroups = g
      .selectAll('.elemen-group')
      .data(filteredNodes)
      .enter()
      .append('g')
      .attr('class', 'elemen-group')
      .attr('transform', (d) => `translate(${x0(d.elemen)},0)`);

    elemenGroups
      .selectAll('rect')
      .data((d) => [
        {
          key: groupKeys[0],
          value: d.regulasiLama.hotsPercentage,
          jp: d.regulasiLama.alokasiJp,
          regulasi: d.regulasiLama.regulasi,
          elemen: d.elemen,
          fokus: d.regulasiLama.fokusUtama,
        },
        {
          key: groupKeys[1],
          value: d.regulasiBaru.hotsPercentage,
          jp: d.regulasiBaru.alokasiJp,
          regulasi: d.regulasiBaru.regulasi,
          elemen: d.elemen,
          fokus: d.regulasiBaru.fokusUtama,
          deep: d.regulasiBaru.deepLearningApproach,
        },
      ])
      .enter()
      .append('rect')
      .attr('x', (d) => x1(d.key) || 0)
      .attr('y', height)
      .attr('width', x1.bandwidth())
      .attr('height', 0)
      .attr('fill', (d) => colorScale(d.key))
      .attr('rx', 5)
      .on('mouseover', (event, d) => {
        tooltip.style('visibility', 'visible').html(`
          <div class="font-bold text-cyan-300 text-sm mb-1">${d.elemen}</div>
          <div class="text-xs text-slate-300 mb-1"><b>${d.regulasi}</b></div>
          <div class="flex items-center gap-2 my-1">
            <span class="inline-block w-2.5 h-2.5 rounded-full" style="background:${colorScale(d.key)}"></span>
            <span>HOTS (C4-C6): <b>${d.value}%</b></span>
            <span class="text-slate-400">|</span>
            <span>Alokasi JP: <b>${d.jp} JP</b></span>
          </div>
          <div class="text-[11px] text-slate-300 mt-1 italic border-t border-slate-700 pt-1">
            Fokus: ${d.fokus}
          </div>
          ${d.deep ? `<div class="text-[11px] text-emerald-400 mt-1 font-semibold">Deep Learning: ${d.deep}</div>` : ''}
        `);
      })
      .on('mousemove', (event) => {
        tooltip
          .style('top', `${event.pageY - 10}px`)
          .style('left', `${event.pageX + 15}px`);
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      })
      .transition()
      .duration(750)
      .attr('y', (d) => yHots(d.value))
      .attr('height', (d) => height - yHots(d.value));

    // Value Labels on top of bars
    elemenGroups
      .selectAll('.bar-label')
      .data((d) => [
        { key: groupKeys[0], value: d.regulasiLama.hotsPercentage },
        { key: groupKeys[1], value: d.regulasiBaru.hotsPercentage },
      ])
      .enter()
      .append('text')
      .attr('class', 'bar-label')
      .attr('x', (d) => (x1(d.key) || 0) + x1.bandwidth() / 2)
      .attr('y', (d) => yHots(d.value) - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', (d) => (d.key === groupKeys[1] ? '#0284c7' : '#64748b'))
      .text((d) => `${d.value}%`);

    return () => {
      tooltip.remove();
    };
  }, [activeTab, filteredNodes, selectedSubject]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden my-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-cyan-950 p-6 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-cyan-500/10 backdrop-blur-3xl transform skew-x-12 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-extrabold text-xs uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>D3.js Visual Analytics Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2.5">
              <GitCompare className="w-6 h-6 text-cyan-400" />
              <span>Analisis Komparatif Perubahan CP/ATP &amp; Deep Learning</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
              Visualisasi D3.js perbandingan struktur Capaian Pembelajaran antara <b>KepKa BSKAP No. 033/H/KR/2022</b> dengan regulasi aktif <b>Permendikbudristek No. 12 Tahun 2024 &amp; KepKa BSKAP No. 046/H/KR/2025 (KMA 1503/2025)</b>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 bg-slate-950/60 p-2 rounded-2xl border border-slate-800">
            <span className="text-xs font-bold text-slate-400 px-2">Filter Mapel:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-900 text-cyan-300 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="Semua">Semua Mata Pelajaran</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Stat Badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 border-b border-slate-200/80">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-700 flex items-center justify-center font-black">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Peningkatan HOTS
            </div>
            <div className="text-lg font-black text-cyan-700 flex items-center gap-1">
              +{hotsIncrease}% <span className="text-xs font-semibold text-slate-500">({avgHotsOld}% ➔ {avgHotsNew}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Alokasi JP Total
            </div>
            <div className="text-lg font-black text-emerald-700 flex items-center gap-1">
              {totalJpNew} JP <span className="text-xs font-semibold text-slate-500">(Lama: {totalJpOld} JP)</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Deep Learning
            </div>
            <div className="text-lg font-black text-indigo-700">
              100% Integrated
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
              Status Regulasi
            </div>
            <div className="text-xs font-black text-purple-700 truncate">
              Permendikbud 12/2024
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Navigation Bar */}
      <div className="p-4 px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-white">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'chart'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Grafik D3 Komparatif</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'matrix'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            <span>Matriks Perubahan Elemen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              activeTab === 'details'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Rincian Deskripsi CP (Side-by-Side)</span>
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari elemen atau topik..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-300 bg-slate-50 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="p-6">
        {/* TAB 1: D3 Bar Chart Visualizer */}
        {activeTab === 'chart' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-cyan-600" />
                  <span>D3 Visual Chart: Perbandingan Rasio Penekanan HOTS &amp; Alokasi JP</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Arahkan kursor (hover) di atas batang grafik D3 untuk melihat detail komparasi dan pendekatan Deep Learning.
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-slate-400 inline-block" />
                  <span className="text-slate-600">BSKAP 033/2022</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-md bg-cyan-600 inline-block" />
                  <span className="text-slate-900">Permendikbud 12/2024 &amp; BSKAP 046/2025</span>
                </div>
              </div>
            </div>

            <div
              ref={chartContainerRef}
              className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-200 overflow-x-auto"
            >
              <svg ref={chartSvgRef} className="mx-auto block" />
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-start gap-3">
              <Info className="w-5 h-5 text-cyan-700 shrink-0 mt-0.5" />
              <div className="text-xs text-cyan-900">
                <b>Catatan Analisis D3 Engine:</b> Pada Permendikbudristek No. 12 Tahun 2024 &amp; KepKa BSKAP No. 046/H/KR/2025, alokasi JP diselaraskan dengan kebutuhan asesmen Pembelajaran Mendalam (Deep Learning), serta menaikkan porsi kriteria HOTS (C4 Analisis, C5 Evaluasi, C6 Kreasi) rata-rata sebesar <b>+{hotsIncrease}%</b> untuk mendukung kecakapan abad 21 dan literasi AI.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Perubahan Elemen Matrix */}
        {activeTab === 'matrix' && (
          <div className="space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-cyan-600" />
              <span>Matriks Perubahan Utama Per Elemen CP</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredNodes.map((node) => (
                <div
                  key={node.id}
                  className="bg-slate-50 p-5 rounded-2xl border border-slate-200 hover:border-cyan-400 transition-all shadow-xs"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-100 text-cyan-800 font-extrabold text-xs">
                      {node.subject} • {node.fase}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      ID: {node.id}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-sm mb-3">
                    {node.elemen}
                  </h4>

                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Lama (BSKAP 033)</div>
                      <div className="font-extrabold text-slate-700 mt-0.5">{node.regulasiLama.alokasiJp} JP • HOTS {node.regulasiLama.hotsPercentage}%</div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-200">
                      <div className="text-[10px] font-bold text-cyan-700 uppercase">Baru (Permendikbud 12/2024)</div>
                      <div className="font-extrabold text-cyan-900 mt-0.5">{node.regulasiBaru.alokasiJp} JP • HOTS {node.regulasiBaru.hotsPercentage}%</div>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Perubahan &amp; Penyelarasan Baru:</span>
                  </div>

                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {node.perubahanUtama.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-white p-2 rounded-xl border border-slate-200/70">
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span><b>Pendekatan Deep Learning:</b> {node.regulasiBaru.deepLearningApproach}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Side-by-Side Detailed CP Text Comparison */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-cyan-600" />
              <span>Perbandingan Teks Narasi CP Side-by-Side</span>
            </h3>

            {filteredNodes.map((node) => (
              <div
                key={node.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
              >
                <div className="bg-slate-900 text-white p-3.5 px-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span className="font-extrabold text-sm">{node.subject} — {node.elemen}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs border border-cyan-400/30">
                    {node.fase}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                  {/* Regulasi Lama */}
                  <div className="p-5 bg-white">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs mb-3 border border-slate-200">
                      <span>Lama: {node.regulasiLama.regulasi}</span>
                    </div>

                    <div className="text-xs text-slate-700 space-y-2">
                      <div>
                        <span className="font-bold text-slate-500 block text-[11px] uppercase">Deskripsi CP Resmi:</span>
                        <p className="mt-1 leading-relaxed italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                          "{node.regulasiLama.deskripsiCp}"
                        </p>
                      </div>

                      <div className="pt-2">
                        <span className="font-bold text-slate-500 block text-[11px] uppercase">Fokus Utama:</span>
                        <p className="font-semibold text-slate-800">{node.regulasiLama.fokusUtama}</p>
                      </div>
                    </div>
                  </div>

                  {/* Regulasi Baru */}
                  <div className="p-5 bg-cyan-50/40">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-600 text-white font-bold text-xs mb-3 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                      <span>Baru: {node.regulasiBaru.regulasi}</span>
                    </div>

                    <div className="text-xs text-slate-800 space-y-2">
                      <div>
                        <span className="font-bold text-cyan-800 block text-[11px] uppercase">Deskripsi CP Baru (Pembelajaran Mendalam):</span>
                        <p className="mt-1 leading-relaxed font-medium bg-white p-3 rounded-xl border border-cyan-200 text-slate-900 shadow-xs">
                          "{node.regulasiBaru.deskripsiCp}"
                        </p>
                      </div>

                      <div className="pt-2">
                        <span className="font-bold text-cyan-800 block text-[11px] uppercase">Fokus &amp; Pendekatan Deep Learning:</span>
                        <p className="font-bold text-cyan-950">{node.regulasiBaru.fokusUtama}</p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-[11px]">
                          {node.regulasiBaru.deepLearningApproach}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

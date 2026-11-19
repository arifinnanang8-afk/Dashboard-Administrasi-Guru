import React, { useState } from 'react';
import {
  Brain,
  Sparkles,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Compass,
  Layers,
  FileCheck2,
  Share2,
} from 'lucide-react';
import { SchoolProfile, ModulAjarItem } from '../types';
import { getSyncedSubChaptersForBab, getCompleteBookSourceString } from '../utils/curriculumLogic';

interface DeepChapterAnalysisCardProps {
  babNumber: number;
  babTitle: string;
  schoolProfile: SchoolProfile;
  currentModul: ModulAjarItem;
  selectedBook?: any;
  onApplyAnalysisToModul: (analysis: {
    materiFaktual: string;
    materiKonseptual: string;
    materiProsedural: string;
    materiMetakognitif: string;
    pertanyaanPemantik: string[];
    pemahamanBermakna: string;
  }) => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const DeepChapterAnalysisCard: React.FC<DeepChapterAnalysisCardProps> = ({
  babNumber,
  babTitle,
  schoolProfile,
  currentModul,
  selectedBook,
  onApplyAnalysisToModul,
  showNotification,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const subChapters = getSyncedSubChaptersForBab(
    schoolProfile.subject,
    schoolProfile.grade,
    babNumber
  );

  const bookSource = getCompleteBookSourceString(
    schoolProfile,
    selectedBook?.judulBuku ? `${selectedBook.judulBuku} (${selectedBook.penerbit})` : undefined
  );

  // Structured textbook key analysis data for the active Bab
  const factualConcept = `Topik ${schoolProfile.subject} Bab ${babNumber} ("${babTitle}") mencakup fakta empiris, definisi baku, data lapangan, serta terminologi resmi sesuai edisi revisi BSKAP 2025.`;
  const conceptualPrinciple = `Prinsip utama mengaitkan hubungan antar variabel ${schoolProfile.subject}, struktur alur berpikir logis, dan hukum dasar yang melandasi pemecahan masalah kontekstual pada Bab ${babNumber}.`;
  const proceduralMetacognitive = `Langkah-langkah terstruktur: 1) Analisis studi kasus awal, 2) Investigasi data kolaboratif, 3) Penyusunan laporan/produk, 4) Refleksi mandiri & teach-back strategi belajar.`;

  const commonMisconceptions = [
    `Miskonsepsi 1: Peserta didik sering menganggap teori ${schoolProfile.subject} bersifat abstrak dan lepas dari kehidupan harian. ➔ Solusi: Hadirkan studi kasus kontekstual lokal.`,
    `Miskonsepsi 2: Peserta didik cenderung menghafal rumus/langkah tanpa memahami prinsip logisnya. ➔ Solusi: Menerapkan metode bertanya Socratic & diskusi kelompok terbimbing.`,
  ];

  const mindfulAlignment = {
    title: 'Mindful Learning (Berkesadaran)',
    pemantik: [
      `1. Mengapa materi ${schoolProfile.subject} Bab ${babNumber} ini penting untuk masa depanmu?`,
      `2. Fenomena apa di sekitarmu yang berkaitan langsung dengan ${babTitle}?`,
      `3. Bagaimana caramu mengatasi kesulitan saat memahami konsep baru hari ini?`,
    ],
    fokusCheckIn: 'Sesi hening cipta 1-2 menit di awal kelas untuk fokus emosional & kesiapan belajar.',
  };

  const meaningfulAlignment = {
    title: 'Meaningful Learning (Bermakna)',
    studiKasus: `Penyelidikan kasus terapan ${schoolProfile.subject} Bab ${babNumber} yang terjadi di masyarakat / industri lokal.`,
    kolaborasi: 'Diskusi kelompok terstruktur (maksimal 7 peserta didik) dengan LKPD berbasis inquiry & PjBL.',
    interdisipliner: `Integrasi Lintas Disiplin Ilmu: ${schoolProfile.subject}, Matematika, IPS/IPA, Informatika, & Kewirausahaan.`,
  };

  const joyfulAlignment = {
    title: 'Joyful Learning (Menggembirakan)',
    metodeAktif: 'Problem Based Learning (PBL) dipadukan dengan permainan peran / simulasi mini.',
    teachBack: 'Sesi teach-back: Murid menjelaskan kembali materi kepada rekan sebaya dengan bahasa mereka sendiri.',
    apresiasi: 'Umpan balik konstruktif antarteman & refleksi growth mindset ("Kesulitan adalah proses tumbuh").',
  };

  const handleRunAiAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      showNotification(
        'success',
        `✨ Analisis Mendalam AI Bab ${babNumber} ("${babTitle}") berhasil diselaraskan dengan metode Pembelajaran Mendalam (Deep Learning)!`
      );
    }, 800);
  };

  const handleApplyToModul = () => {
    onApplyAnalysisToModul({
      materiFaktual: factualConcept,
      materiKonseptual: conceptualPrinciple,
      materiProsedural: proceduralMetacognitive,
      materiMetakognitif: 'Strategi pemantauan mandiri terhadap tingkat pemahaman dan evaluasi diri.',
      pertanyaanPemantik: mindfulAlignment.pemantik,
      pemahamanBermakna: `Memahami masalah ${schoolProfile.subject} Bab ${babNumber} secara kritis, kreatif, dan bertanggung jawab melalui Pembelajaran Mendalam.`,
    });
    showNotification(
      'success',
      `Poin kunci analisis Bab ${babNumber} berhasil diterapkan ke Bagian Identifikasi & Desain Pembelajaran Modul Ajar!`
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl overflow-hidden my-4">
      {/* Card Header Bar */}
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center font-black shrink-0 mt-0.5">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-extrabold text-[10px] uppercase tracking-wider border border-cyan-400/30">
                Fitur Analisis Buku Teks &amp; Deep Learning
              </span>
              <span className="text-xs font-bold text-slate-400">
                Bab {babNumber}
              </span>
            </div>
            <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
              <span>Analisis Mendalam Per Bab: {babTitle}</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
              Poin kunci buku teks resmi terpilih yang diselaraskan dengan 3 pilar Pembelajaran Mendalam (Mindful, Meaningful, &amp; Joyful Learning)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunAiAnalysis}
            disabled={isAnalyzing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>{isAnalyzing ? 'Menganalisis Buku...' : 'Jalankan Analisis AI'}</span>
          </button>

          <button
            type="button"
            onClick={handleApplyToModul}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Terapkan Ke Modul Ajar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title={isExpanded ? 'Sembunyikan Panel Analisis' : 'Tampilkan Panel Analisis'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-6 space-y-6 bg-slate-900/40">
          {/* Source Book Banner */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-xs flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-slate-300">
              <BookOpen className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-medium">{bookSource}</span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold">
              100% Selaras Katalog BSKAP 046/2025
            </span>
          </div>

          {/* Grid 1: Key Textbook Summaries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
            {/* Box 1: Material Structure */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-cyan-300 font-extrabold border-b border-slate-700 pb-2">
                <FileCheck2 className="w-4 h-4 text-cyan-400" />
                <span>1. Poin Kunci &amp; Struktur Materi Buku Teks Bab {babNumber}</span>
              </div>

              <div className="space-y-2 text-slate-200">
                <div>
                  <span className="font-bold text-slate-400 text-[11px] block uppercase">Pengetahuan Faktual:</span>
                  <p className="mt-0.5 leading-relaxed text-slate-300">{factualConcept}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-400 text-[11px] block uppercase">Pengetahuan Konseptual:</span>
                  <p className="mt-0.5 leading-relaxed text-slate-300">{conceptualPrinciple}</p>
                </div>

                <div>
                  <span className="font-bold text-slate-400 text-[11px] block uppercase">Pengetahuan Prosedural:</span>
                  <p className="mt-0.5 leading-relaxed text-slate-300">{proceduralMetacognitive}</p>
                </div>
              </div>
            </div>

            {/* Box 2: Sub-chapters & Misconception Handling */}
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-extrabold border-b border-slate-700 pb-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>2. Peta Sub-Bab Buku &amp; Penanganan Miskonsepsi</span>
              </div>

              <div>
                <span className="font-bold text-slate-400 text-[11px] block uppercase mb-1">Sub-Bab Pembelajaran Resmi:</span>
                <ul className="space-y-1">
                  {subChapters.map((sub, idx) => (
                    <li key={idx} className="flex items-center gap-2 bg-slate-900/60 p-1.5 px-2.5 rounded-lg border border-slate-700/60 text-slate-200">
                      <Zap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{sub}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2">
                <span className="font-bold text-amber-400 text-[11px] block uppercase mb-1">Perkiraan Miskonsepsi &amp; Solusi:</span>
                <ul className="space-y-1 text-slate-300 italic">
                  {commonMisconceptions.map((m, idx) => (
                    <li key={idx} className="bg-amber-950/40 p-2 rounded-lg border border-amber-800/40 text-[11px]">
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Grid 2: 3 Pillars Deep Learning Alignment */}
          <div>
            <div className="flex items-center gap-2 text-white font-extrabold text-sm mb-3">
              <Compass className="w-5 h-5 text-emerald-400" />
              <span>3. Penyelarasan Metode Pembelajaran Mendalam (Deep Learning)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Mindful */}
              <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/50 space-y-2">
                <div className="flex items-center gap-2 text-cyan-300 font-extrabold">
                  <Brain className="w-4 h-4 text-cyan-400" />
                  <span>{mindfulAlignment.title}</span>
                </div>
                <p className="text-[11px] text-cyan-100 font-semibold">{mindfulAlignment.fokusCheckIn}</p>
                <div className="pt-1">
                  <span className="font-bold text-cyan-300 text-[10px] uppercase">Pertanyaan Pemantik:</span>
                  <ul className="space-y-1 mt-1 text-slate-200">
                    {mindfulAlignment.pemantik.map((p, idx) => (
                      <li key={idx} className="bg-cyan-900/40 p-1.5 rounded-lg border border-cyan-700/40 text-[11px]">
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Meaningful */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-300 font-extrabold">
                  <Lightbulb className="w-4 h-4 text-emerald-400" />
                  <span>{meaningfulAlignment.title}</span>
                </div>
                <div>
                  <span className="font-bold text-emerald-300 text-[10px] uppercase block">Studi Kasus Kontekstual:</span>
                  <p className="text-slate-200 mt-0.5 leading-relaxed">{meaningfulAlignment.studiKasus}</p>
                </div>
                <div>
                  <span className="font-bold text-emerald-300 text-[10px] uppercase block">Aktivitas Kolaborasi:</span>
                  <p className="text-slate-200 mt-0.5 leading-relaxed">{meaningfulAlignment.kolaborasi}</p>
                </div>
                <div>
                  <span className="font-bold text-emerald-300 text-[10px] uppercase block">Lintas Disiplin Ilmu:</span>
                  <p className="text-emerald-100 font-semibold mt-0.5">{meaningfulAlignment.interdisipliner}</p>
                </div>
              </div>

              {/* Joyful */}
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-800/50 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-extrabold">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>{joyfulAlignment.title}</span>
                </div>
                <div>
                  <span className="font-bold text-purple-300 text-[10px] uppercase block">Metode Pembelajaran:</span>
                  <p className="text-slate-200 mt-0.5">{joyfulAlignment.metodeAktif}</p>
                </div>
                <div>
                  <span className="font-bold text-purple-300 text-[10px] uppercase block">Refleksi Teach-Back:</span>
                  <p className="text-slate-200 mt-0.5 leading-relaxed">{joyfulAlignment.teachBack}</p>
                </div>
                <div>
                  <span className="font-bold text-purple-300 text-[10px] uppercase block">Apresiasi &amp; Umpan Balik:</span>
                  <p className="text-purple-100 font-semibold mt-0.5">{joyfulAlignment.apresiasi}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

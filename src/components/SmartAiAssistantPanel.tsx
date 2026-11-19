import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Bot,
  Send,
  BookOpenCheck,
  Layers,
  CheckCircle2,
  Copy,
  Check,
  ArrowRight,
  Lightbulb,
  Wand2,
  RefreshCw,
  MessageSquarePlus,
} from 'lucide-react';
import {
  CONSULTATION_MODES,
  ConsultationTopicMode,
  buildConsultationPrompt,
  generateContextualConsultationResponse,
  formatBabLabel,
} from '../utils/aiConsultationLogic';

interface ConsultationHistoryItem {
  id: string;
  question: string;
  modeLabel: string;
  cpElemen: string;
  babLabel: string;
  responseText: string;
  mindfulStep: string;
  meaningfulStep: string;
  joyfulStep: string;
  cpAdaptationSummary: string;
  babNumber: number;
  timestamp: string;
}

export const SmartAiAssistantPanel: React.FC = () => {
  const {
    schoolProfile,
    cpElements,
    tujuanPembelajaran,
    modulAjarList,
    updateModulAjar,
    setActiveView,
    showNotification,
  } = useApp();

  const [selectedMode, setSelectedMode] = useState<ConsultationTopicMode>('deep_learning');
  const [selectedCpId, setSelectedCpId] = useState<string>(cpElements[0]?.id || '');
  const [selectedTpId, setSelectedTpId] = useState<string>(tujuanPembelajaran[0]?.id || '');
  const [customQuestion, setCustomQuestion] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  const activeCp = useMemo(() => {
    return cpElements.find((c) => c.id === selectedCpId) || cpElements[0];
  }, [cpElements, selectedCpId]);

  const activeTp = useMemo(() => {
    return tujuanPembelajaran.find((t) => t.id === selectedTpId) || tujuanPembelajaran[0];
  }, [tujuanPembelajaran, selectedTpId]);

  const activeBabNumber = useMemo(() => {
    if (!activeTp?.babId) return 1;
    const match = activeTp.babId.match(/\d+/);
    return match ? parseInt(match[0], 10) : 1;
  }, [activeTp]);

  const activeBabText = formatBabLabel(activeTp?.babId);

  // Seed initial consultation result so the panel is immediately rich and inspectable
  const initialSeedResult = useMemo(() => {
    const generated = generateContextualConsultationResponse({
      mode: 'deep_learning',
      schoolProfile,
      selectedCpElement: cpElements[0],
      selectedTp: tujuanPembelajaran[0],
      allCpElements: cpElements,
    });
    const seedBab = formatBabLabel(tujuanPembelajaran[0]?.babId);
    return {
      id: 'seed-consult-1',
      question: `Konsultasi Strategi Pembelajaran Mendalam (Mindful, Meaningful, Joyful) & Penyesuaian Materi Ajar berdasarkan CP BSKAP No. 046/H/KR/2025 untuk ${seedBab}: ${
        tujuanPembelajaran[0]?.materiPokok || 'Materi Pokok'
      }`,
      modeLabel: '3 Pilar Deep Learning',
      cpElemen: cpElements[0]?.name || 'Menyimak',
      babLabel: `${seedBab} — ${tujuanPembelajaran[0]?.materiPokok || 'Materi Pokok'}`,
      responseText: generated.summaryText,
      mindfulStep: generated.mindfulStep,
      meaningfulStep: generated.meaningfulStep,
      joyfulStep: generated.joyfulStep,
      cpAdaptationSummary: generated.cpAdaptationSummary,
      babNumber: 1,
      timestamp: 'Siap Diterapkan',
    };
  }, [schoolProfile, cpElements, tujuanPembelajaran]);

  const [history, setHistory] = useState<ConsultationHistoryItem[]>([initialSeedResult]);

  const latestConsultation = history[0] || initialSeedResult;

  const handleConsult = async (overrideMode?: ConsultationTopicMode, overrideQuestion?: string) => {
    const modeToUse = overrideMode || selectedMode;
    const questionText = overrideQuestion !== undefined ? overrideQuestion : customQuestion;

    if (overrideMode) {
      setSelectedMode(overrideMode);
    }

    const promptToSend = buildConsultationPrompt({
      mode: modeToUse,
      customQuestion: questionText,
      schoolProfile,
      selectedCpElement: activeCp,
      selectedTp: activeTp,
      allCpElements: cpElements,
    });

    const localSynthesis = generateContextualConsultationResponse({
      mode: modeToUse,
      customQuestion: questionText,
      schoolProfile,
      selectedCpElement: activeCp,
      selectedTp: activeTp,
      allCpElements: cpElements,
    });

    const modeMeta = CONSULTATION_MODES.find((m) => m.id === modeToUse) || CONSULTATION_MODES[0];
    setIsLoading(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    try {
      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          prompt: promptToSend,
          mode: modeMeta.label,
          context: {
            teacherName: schoolProfile.teacherName,
            schoolName: schoolProfile.schoolName,
            subject: schoolProfile.subject,
            fase: schoolProfile.fase,
            grade: schoolProfile.grade,
            academicYear: schoolProfile.academicYear,
            cpElemen: activeCp?.name,
            cpDeskripsi: activeCp?.deskripsi,
            bab: activeBabText,
            materiPokok: activeTp?.materiPokok,
            tujuanPembelajaran: activeTp?.description,
          },
        }),
      });
      clearTimeout(timeoutId);

      let finalResponseText = localSynthesis.summaryText;
      if (response.ok) {
        const data = await response.json();
        if (data?.result && typeof data.result === 'string' && data.result.trim().length > 0) {
          finalResponseText = data.result;
        }
      }

      const newEntry: ConsultationHistoryItem = {
        id: `consult-${Date.now()}`,
        question:
          questionText.trim().length > 0
            ? questionText.trim()
            : `${modeMeta.label} pada ${activeBabText} (${activeTp?.materiPokok || ''})`,
        modeLabel: modeMeta.badge,
        cpElemen: activeCp?.name || 'Elemen CP',
        babLabel: `${activeBabText} — ${activeTp?.materiPokok || ''}`,
        responseText: finalResponseText,
        mindfulStep: localSynthesis.mindfulStep,
        meaningfulStep: localSynthesis.meaningfulStep,
        joyfulStep: localSynthesis.joyfulStep,
        cpAdaptationSummary: localSynthesis.cpAdaptationSummary,
        babNumber: activeBabNumber,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHistory((prev) => [newEntry, ...prev.slice(0, 4)]);
      setCustomQuestion('');
      showNotification(
        'success',
        `Rekomendasi Asisten AI Pintar (${modeMeta.badge}) untuk ${activeBabText} berhasil disusun!`
      );
    } catch {
      clearTimeout(timeoutId);
      const fallbackEntry: ConsultationHistoryItem = {
        id: `consult-${Date.now()}`,
        question:
          questionText.trim().length > 0
            ? questionText.trim()
            : `${modeMeta.label} pada ${activeBabText} (${activeTp?.materiPokok || ''})`,
        modeLabel: modeMeta.badge,
        cpElemen: activeCp?.name || 'Elemen CP',
        babLabel: `${activeBabText} — ${activeTp?.materiPokok || ''}`,
        responseText: localSynthesis.summaryText,
        mindfulStep: localSynthesis.mindfulStep,
        meaningfulStep: localSynthesis.meaningfulStep,
        joyfulStep: localSynthesis.joyfulStep,
        cpAdaptationSummary: localSynthesis.cpAdaptationSummary,
        babNumber: activeBabNumber,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setHistory((prev) => [fallbackEntry, ...prev.slice(0, 4)]);
      setCustomQuestion('');
      showNotification(
        'success',
        `Hasil konsultasi ${modeMeta.badge} sesuai CP BSKAP 046/2025 untuk ${activeBabText} siap digunakan!`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToModulAjar = (item: ConsultationHistoryItem) => {
    const targetModul =
      modulAjarList.find((m) => m.babNumber === item.babNumber) || modulAjarList[0];
    if (!targetModul) return;

    const updatedModul = {
      ...targetModul,
      mindfulStep: item.mindfulStep,
      meaningfulStep: item.meaningfulStep,
      joyfulStep: item.joyfulStep,
      pemahamanBermakna: `${targetModul.pemahamanBermakna} [Adaptasi CP BSKAP 046/2025: ${item.cpAdaptationSummary}]`,
    };

    updateModulAjar(updatedModul);
    setAppliedId(item.id);
    showNotification(
      'success',
      `Strategi Deep Learning & Penyesuaian Materi CP BSKAP 046/2025 berhasil diterapkan ke Modul Ajar Bab ${targetModul.babNumber}!`
    );
    setTimeout(() => setAppliedId(null), 3000);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showNotification('success', 'Hasil konsultasi Asisten AI Pintar berhasil disalin ke clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section
      aria-label="Panel Asisten AI Pintar"
      data-testid="smart-ai-assistant-panel"
      className="my-5 bg-white rounded-2xl border border-indigo-200/90 shadow-md overflow-hidden"
    >
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white p-5 sm:p-6 border-b border-indigo-900/60">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-xs">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Asisten AI Pintar</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-900/90 text-indigo-200 border border-indigo-700 text-[11px] font-semibold">
                <BookOpenCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sinkron KepKa BSKAP No. 046/H/KR/2025</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-700 text-[11px] font-semibold">
                <Layers className="w-3.5 h-3.5 text-amber-300" />
                <span>Deep Learning (Mindful · Meaningful · Joyful)</span>
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                Panel Asisten AI Pintar: Konsultasi Pembelajaran Mendalam &amp; Penyesuaian Materi CP Terbaru
              </span>
            </h2>

            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Konsultasikan strategi pembelajaran mendalam (<em>Mindful Inquiring</em>,{' '}
              <em>Meaningful Dialogue</em>, <em>Joyful Celebration</em>) serta adaptasi materi ajar{' '}
              <strong className="text-white">{schoolProfile.subject}</strong> ({schoolProfile.grade}) berdasarkan
              deskripsi resmi Capaian Pembelajaran (CP) terbaru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveView('ai_asisten')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4 text-amber-300" />
              <span>Buka Ruang Konsultasi Penuh</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Interactive Body */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-gradient-to-b from-indigo-50/30 to-white">
        {/* Left Column: Context Selectors, Quick Topics & Consultation Form */}
        <div className="lg:col-span-5 space-y-4">
          {/* Step 1: Select Official CP Element & Bab/Materi */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <BookOpenCheck className="w-4 h-4 text-indigo-700" />
                <span>1. Konteks CP Terbaru &amp; Materi Ajar</span>
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                BSKAP 046/2025
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label
                  htmlFor="ai-panel-cp-select"
                  className="block font-bold text-slate-700 mb-1"
                >
                  Pilih Elemen CP Resmi:
                </label>
                <select
                  id="ai-panel-cp-select"
                  value={selectedCpId}
                  onChange={(e) => setSelectedCpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {cpElements.map((cp) => (
                    <option key={cp.id} value={cp.id}>
                      Elemen {cp.name} ({cp.kompetensi?.[0] || 'Kompetensi Utama'})
                    </option>
                  ))}
                </select>
              </div>

              {activeCp && (
                <div className="p-2.5 rounded-lg bg-white border border-indigo-100 text-[11px] text-slate-600 leading-relaxed">
                  <span className="font-bold text-indigo-950 block mb-0.5">
                    Bunyi CP BSKAP 046/2025 ({activeCp.name}):
                  </span>
                  <span className="italic">&ldquo;{activeCp.deskripsi}&rdquo;</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="ai-panel-tp-select"
                  className="block font-bold text-slate-700 mb-1"
                >
                  Pilih Bab &amp; Materi Pokok (ATP/PROTA):
                </label>
                <select
                  id="ai-panel-tp-select"
                  value={selectedTpId}
                  onChange={(e) => setSelectedTpId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {tujuanPembelajaran.map((tp) => (
                    <option key={tp.id} value={tp.id}>
                      {formatBabLabel(tp.babId)}: {tp.materiPokok} ({tp.code} · Smt {tp.semester})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Step 2: Quick Consultation Focus Buttons */}
          <div className="space-y-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 block">
              2. Pilih Fokus Konsultasi Cepat (1-Klik):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONSULTATION_MODES.map((m) => {
                const isSelected = selectedMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleConsult(m.id, '')}
                    disabled={isLoading}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1 ${
                      isSelected
                        ? 'bg-indigo-950 text-white border-indigo-900 shadow-sm ring-2 ring-indigo-400/50'
                        : 'bg-white hover:bg-indigo-50/60 text-slate-800 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-indigo-100 text-indigo-900'
                        }`}
                      >
                        {m.badge}
                      </span>
                      <Wand2
                        className={`w-3.5 h-3.5 ${
                          isSelected ? 'text-amber-300' : 'text-indigo-600'
                        }`}
                      />
                    </div>
                    <p className="text-xs font-bold leading-snug mt-1">{m.label}</p>
                    <p
                      className={`text-[11px] leading-tight line-clamp-2 ${
                        isSelected ? 'text-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      {m.shortDesc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Free-text Teacher Consultation Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleConsult(selectedMode, customQuestion);
            }}
            className="space-y-2 pt-1"
          >
            <label
              htmlFor="ai-panel-custom-question"
              className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-700"
            >
              3. Ajukan Pertanyaan Konsultasi Khusus:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="ai-panel-custom-question"
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                placeholder="Contoh: Bagaimana strategi Deep Learning & adaptasi materi CP terbaru untuk siswa SMK?"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 disabled:opacity-60 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menganalisis...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Konsultasi AI</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Active Consultation Output & Direct Curriculum Action */}
        <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Output Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold">
                Hasil Konsultasi Strategi Deep Learning &amp; Penyesuaian Materi CP
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 font-semibold">
                {latestConsultation.cpElemen}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-semibold">
                {latestConsultation.modeLabel}
              </span>
            </div>
          </div>

          {/* 3 Pillars Quick Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 bg-indigo-50/50 border-b border-indigo-100 text-[11px]">
            <div className="p-2.5 rounded-xl bg-white border border-emerald-200/80 shadow-2xs">
              <span className="font-extrabold text-emerald-800 block mb-0.5">
                🌿 1. Mindful Inquiring
              </span>
              <p className="text-slate-600 line-clamp-2 leading-snug">
                {latestConsultation.mindfulStep.replace(/^Mindful Inquiring \(Berkesadaran\):\s*/i, '')}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-amber-200/80 shadow-2xs">
              <span className="font-extrabold text-amber-800 block mb-0.5">
                💡 2. Meaningful Dialogue
              </span>
              <p className="text-slate-600 line-clamp-2 leading-snug">
                {latestConsultation.meaningfulStep.replace(/^Meaningful Dialogue \(Bermakna\):\s*/i, '')}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-white border border-indigo-200/80 shadow-2xs">
              <span className="font-extrabold text-indigo-800 block mb-0.5">
                🤝 3. Joyful Celebration
              </span>
              <p className="text-slate-600 line-clamp-2 leading-snug">
                {latestConsultation.joyfulStep.replace(/^Joyful Celebration \(Menggembirakan\):\s*/i, '')}
              </p>
            </div>
          </div>

          {/* Detailed Consultation Result */}
          <div className="p-4 sm:p-5 max-h-[340px] overflow-y-auto space-y-3 text-xs leading-relaxed text-slate-800">
            <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950">
              <span className="font-bold uppercase tracking-wider text-amber-800 block mb-0.5">
                Topik Konsultasi Aktif ({latestConsultation.timestamp}):
              </span>
              <span className="font-semibold">{latestConsultation.question}</span>
            </div>

            <div className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
              {latestConsultation.responseText}
            </div>
          </div>

          {/* Action Footer: Apply to Modul Ajar or Copy */}
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200/90 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleApplyToModulAjar(latestConsultation)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>
                  {appliedId === latestConsultation.id
                    ? `Tersimpan di Modul Ajar Bab ${latestConsultation.babNumber}!`
                    : `Terapkan ke Modul Ajar Bab ${latestConsultation.babNumber}`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCopy(latestConsultation.responseText, latestConsultation.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                {copiedId === latestConsultation.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Rekomendasi</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('modul_ajar')}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
            >
              <span>Lihat di Modul Ajar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

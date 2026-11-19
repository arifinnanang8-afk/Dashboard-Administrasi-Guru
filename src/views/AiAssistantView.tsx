import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  ArrowLeft,
  Send,
  Copy,
  Check,
  Bot,
  User,
  Lightbulb,
  FileText,
  Brain,
  Printer,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export const AiAssistantView: React.FC = () => {
  const { schoolProfile, cpElements, tujuanPembelajaran, setActiveView, showNotification } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      text: `Halo ${schoolProfile.teacherName}! Saya adalah Asisten AI Pintar untuk Konsultasi Strategi Pembelajaran Mendalam (Deep Learning: Mindful, Meaningful, Joyful) & Penyesuaian Materi Ajar berdasarkan CP Terbaru (KepKa BSKAP No. 046/H/KR/2025).

Saya siap membantu Anda mengadaptasi perangkat dan materi ajar ${schoolProfile.subject} Fase ${schoolProfile.fase} (${schoolProfile.grade}) di ${schoolProfile.schoolName}.

Silakan pilih topik konsultasi cepat di bawah atau tuliskan pertanyaan Anda!`,
      timestamp: '08:00',
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const promptTemplates = [
    {
      title: 'Strategi Deep Learning (3 Pilar)',
      prompt: `Susunkan strategi Pembelajaran Mendalam (Mindful Inquiring, Meaningful Dialogue, Joyful Celebration) untuk mata pelajaran ${schoolProfile.subject} Fase ${schoolProfile.fase} pada materi ${
        tujuanPembelajaran[0]?.materiPokok || 'Teks Laporan Hasil Observasi'
      } sesuai CP BSKAP No. 046/H/KR/2025.`,
    },
    {
      title: 'Penyesuaian Materi Ajar CP Terbaru',
      prompt: `Bagaimana menyesuaikan dan mengontekstualisasikan materi ajar ${schoolProfile.subject} (${schoolProfile.grade}) berdasarkan Elemen CP "${
        cpElements[0]?.name || 'Menyimak'
      }" menurut KepKa BSKAP No. 046/H/KR/2025?`,
    },
    {
      title: 'Diferensiasi Materi Sesuai CP',
      prompt: `Susun penyesuaian materi ajar berdiferensiasi (Kelompok Dasar, Menengah, dan Mahir) pada materi ${
        tujuanPembelajaran[1]?.materiPokok || 'Teks Anekdot & Negosiasi'
      } agar selaras dengan tuntutan CP BSKAP 046/2025.`,
    },
    {
      title: 'Asesmen Formatif & Rubrik KKTP',
      prompt: `Rancang asesmen formatif berkesadaran (Assessment as & for Learning) beserta rubrik KKTP 4 skala untuk materi ${
        tujuanPembelajaran[0]?.materiPokok || 'Teks Laporan Hasil Observasi'
      }.`,
    },
  ];

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || inputPrompt).trim();
    if (!prompt || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          mode: 'Konsultasi Strategi Deep Learning & Penyesuaian Materi CP BSKAP 046/2025',
          context: {
            teacherName: schoolProfile.teacherName,
            schoolName: schoolProfile.schoolName,
            subject: schoolProfile.subject,
            fase: schoolProfile.fase,
            grade: schoolProfile.grade,
            academicYear: schoolProfile.academicYear,
            cpElemen: cpElements[0]?.name,
            cpDeskripsi: cpElements[0]?.deskripsi,
            bab: tujuanPembelajaran[0]?.babId,
            materiPokok: tujuanPembelajaran[0]?.materiPokok,
            tujuanPembelajaran: tujuanPembelajaran[0]?.description,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menghubungi server Gemini AI.');
      }

      const data = await response.json();
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: data.result || 'Berhasil menyusun rekomendasi perangkat ajar.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.warn('Fallback curriculum generation used:', err);
      const fallbackResponse = `Berikut adalah rekomendasi Asisten AI Pintar mengenai Strategi Pembelajaran Mendalam & Penyesuaian Materi Ajar berdasarkan CP BSKAP No. 046/H/KR/2025 di ${schoolProfile.schoolName}:

### A. PENYESUAIAN MATERI AJAR BERDASARKAN CP TERBARU (BSKAP 046/H/KR/2025)
- **Mata Pelajaran:** ${schoolProfile.subject} (Fase ${schoolProfile.fase} - ${schoolProfile.grade})
- **Elemen CP Rujukan:** ${cpElements[0]?.name || 'Menyimak & Membaca-Memirsa'}
- **Deskripsi Resmi CP:** *"${cpElements[0]?.deskripsi || ''}"*
- **Adaptasi Materi Ajar:** Materi **${tujuanPembelajaran[0]?.materiPokok || 'Pokok'}** dikontekstualisasikan dengan studi kasus dunia nyata/kejuruan di ${schoolProfile.schoolName} dengan fokus pada kompetensi **${cpElements[0]?.kompetensi?.join(', ') || 'Penalaran Kritis'}**.

### B. STRATEGI 3 PILAR PEMBELAJARAN MENDALAM (DEEP LEARNING)
1. **Mindful Inquiring (Berkesadaran):**
   - Guru memandu jeda reflektif 3 menit untuk mengamati objek/kasus nyata tanpa prasangka sebelum membedah konsep.
2. **Meaningful Dialogue (Bermakna):**
   - Siswa mendiskusikan masalah autentik kejuruan dan memetakan solusi berbasis bukti sesuai indikator TP.
3. **Joyful Celebration (Menggembirakan):**
   - Pameran karya kolaboratif (*Gallery Walk*) disertai apresiasi konstruktif antar-kelompok.

### C. DIFERENSIASI & RUBRIK KKTP
- **Kelompok Dasar:** Kerangka pemandu (*scaffolding*) dan contoh langkah kerja.
- **Kelompok Menengah:** Analisis studi kasus kolaboratif menggunakan LKPD.
- **Kelompok Mahir:** Evaluasi kritis lintas kasus dan pengayaan tutor sebaya.`;

      const fallbackMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        sender: 'assistant',
        text: fallbackResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showNotification('success', 'Teks berhasil disalin ke clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('dashboard')}
            title="Kembali ke Dashboard"
            aria-label="Kembali ke Dashboard"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Asisten AI Pintar: Konsultasi Pembelajaran Mendalam &amp; Adaptasi CP Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Konsultan Strategi Deep Learning (Mindful, Meaningful, Joyful) &amp; Penyesuaian Materi KepKa BSKAP No. 046/H/KR/2025
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
            Konteks Aktif: {schoolProfile.subject} (Fase {schoolProfile.fase})
          </span>
        </div>
      </div>

      {/* Template Prompts */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
          Pilihan Cepat Template Kurikulum:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {promptTemplates.map((tmpl, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(tmpl.prompt)}
              className="p-3 bg-white rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/30 transition-all text-left text-xs font-semibold text-slate-800 flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-center gap-1.5 text-amber-700 mb-1">
                <Lightbulb className="w-3.5 h-3.5" />
                <span className="font-bold">{tmpl.title}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal line-clamp-2">{tmpl.prompt}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-6 min-h-[460px] max-h-[600px] overflow-y-auto space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 text-xs leading-relaxed ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl p-4 rounded-2xl space-y-2 ${
                m.sender === 'user'
                  ? 'bg-emerald-800 text-white rounded-tr-none'
                  : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-wrap font-sans">{m.text}</div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/40 text-[10px] opacity-75">
                <span>{m.timestamp}</span>
                {m.sender === 'assistant' && (
                  <button
                    onClick={() => copyText(m.text, m.id)}
                    className="flex items-center gap-1 hover:text-amber-700 font-semibold cursor-pointer"
                  >
                    {copiedId === m.id ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === m.id ? 'Tersalin' : 'Salin Teks'}</span>
                  </button>
                )}
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-xl bg-emerald-950 text-emerald-200 flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 text-xs items-center text-slate-500 italic">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
              Sedang menganalisis kurikulum dan menyusun rekomendasi perangkat ajar...
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder={`Tanyakan apa saja kepada AI seputar kurikulum ${schoolProfile.subject}...`}
          className="flex-1 px-4 py-3 bg-white rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs shadow-sm"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isLoading}
          className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <Send className="w-4 h-4" />
          <span>Kirim</span>
        </button>
      </form>
    </div>
  );
};

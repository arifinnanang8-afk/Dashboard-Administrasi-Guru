import { CpElement, SchoolProfile, TujuanPembelajaran } from '../types';

export type ConsultationTopicMode =
  | 'deep_learning'
  | 'cp_adaptation'
  | 'differentiation'
  | 'authentic_assessment';

export interface ConsultationContextInput {
  mode: ConsultationTopicMode;
  customQuestion?: string;
  schoolProfile: SchoolProfile;
  selectedCpElement?: CpElement;
  selectedTp?: TujuanPembelajaran;
  allCpElements?: CpElement[];
}

export const CONSULTATION_MODES: {
  id: ConsultationTopicMode;
  label: string;
  shortDesc: string;
  badge: string;
}[] = [
  {
    id: 'deep_learning',
    label: 'Strategi Pembelajaran Mendalam (Deep Learning)',
    shortDesc: 'Rancangan 3 Pilar: Mindful Inquiring, Meaningful Dialogue & Joyful Celebration',
    badge: '3 Pilar Deep Learning',
  },
  {
    id: 'cp_adaptation',
    label: 'Penyesuaian Materi Ajar Berdasarkan CP Terbaru',
    shortDesc: 'Dekonstruksi & kontekstualisasi materi ajar sesuai KepKa BSKAP No. 046/H/KR/2025',
    badge: 'CP BSKAP 046/2025',
  },
  {
    id: 'differentiation',
    label: 'Diferensiasi Materi & Scaffolding Sesuai CP',
    shortDesc: 'Penyesuaian materi untuk kelompok Dasar, Menengah, dan Mahir',
    badge: 'Berdiferensiasi',
  },
  {
    id: 'authentic_assessment',
    label: 'Asesmen Formatif & KKTP Berbasis Deep Learning',
    shortDesc: 'Umpan balik berkesadaran, rubrik analitik, dan indikator ketercapaian TP',
    badge: 'Asesmen & KKTP',
  },
];

export function formatBabLabel(babId?: string): string {
  if (!babId) return 'Bab 1';
  const match = babId.match(/(\d+)/);
  return match ? `Bab ${match[1]}` : babId;
}

/**
 * Builds a structured consultation prompt combining the teacher's active CP BSKAP 046/2025
 * element, TP/Bab material, and Deep Learning pedagogical framework.
 */
export function buildConsultationPrompt(input: ConsultationContextInput): string {
  const { mode, customQuestion, schoolProfile, selectedCpElement, selectedTp, allCpElements } = input;
  const cpName = selectedCpElement?.name || allCpElements?.[0]?.name || 'Menyimak & Membaca-Memirsa';
  const cpDesc =
    selectedCpElement?.deskripsi ||
    allCpElements?.[0]?.deskripsi ||
    'Peserta didik mampu mengevaluasi dan mengkreasi informasi berdasarkan Capaian Pembelajaran BSKAP No. 046/H/KR/2025.';
  const tpMateri = selectedTp?.materiPokok || 'Materi Pokok Kurikulum Merdeka';
  const tpBab = formatBabLabel(selectedTp?.babId);
  const tpGoal = selectedTp?.description || 'Memahami konsep esensial dan menerapkannya secara kontekstual.';

  if (customQuestion && customQuestion.trim().length > 0) {
    return `${customQuestion.trim()}

Konteks Kurikulum Aktif:
- Mata Pelajaran: ${schoolProfile.subject} (Fase ${schoolProfile.fase} / Kelas ${schoolProfile.grade})
- Elemen CP (KepKa BSKAP No. 046/H/KR/2025): ${cpName} — "${cpDesc}"
- Bab & Materi Pokok: ${tpBab} — ${tpMateri}
- Tujuan Pembelajaran (TP): ${tpGoal}`;
  }

  switch (mode) {
    case 'deep_learning':
      return `Susunkan strategi Pembelajaran Mendalam (Deep Learning: Mindful Inquiring, Meaningful Dialogue, Joyful Celebration) yang operasional untuk mata pelajaran ${schoolProfile.subject} Fase ${schoolProfile.fase} (${schoolProfile.grade}) pada ${tpBab}: "${tpMateri}" berdasarkan Elemen CP "${cpName}" (KepKa BSKAP No. 046/H/KR/2025).`;
    case 'cp_adaptation':
      return `Bagaimana cara menyesuaikan dan mengontekstualisasikan materi ajar "${tpMateri}" (${tpBab}) agar selaras 100% dengan deskripsi Elemen CP terbaru "${cpName}" menurut KepKa BSKAP No. 046/H/KR/2025 ("${cpDesc}") untuk peserta didik ${schoolProfile.grade} di ${schoolProfile.schoolName}?`;
    case 'differentiation':
      return `Buatkan panduan penyesuaian materi ajar berdiferensiasi (Konten, Proses, dan Produk) untuk kelompok kesiapan Dasar, Menengah, dan Mahir pada materi "${tpMateri}" (${tpBab}) mengacu pada CP BSKAP No. 046/H/KR/2025 Elemen "${cpName}".`;
    case 'authentic_assessment':
      return `Rancang strategi asesmen formatif dan rubrik KKTP berbasis Pembelajaran Mendalam (Assessment as, for, and of Learning) untuk mengukur ketercapaian TP "${tpGoal}" pada materi "${tpMateri}" sesuai CP BSKAP No. 046/H/KR/2025.`;
  }
}

/**
 * Generates a rich, deterministic, curriculum-aligned consultation response when offline or
 * when instant local synthesis is needed, grounded in the active CP BSKAP 046/2025 and TP.
 */
export function generateContextualConsultationResponse(input: ConsultationContextInput): {
  title: string;
  summaryText: string;
  mindfulStep: string;
  meaningfulStep: string;
  joyfulStep: string;
  cpAdaptationSummary: string;
} {
  const { mode, customQuestion, schoolProfile, selectedCpElement, selectedTp, allCpElements } = input;
  const cpName = selectedCpElement?.name || allCpElements?.[0]?.name || 'Pemahaman & Keterampilan Proses';
  const cpDesc =
    selectedCpElement?.deskripsi ||
    allCpElements?.[0]?.deskripsi ||
    'Peserta didik mampu memahami, menerapkan, dan mengevaluasi konsep esensial sesuai KepKa BSKAP No. 046/H/KR/2025.';
  const cpFocus =
    selectedCpElement?.kompetensi?.join(', ') ||
    selectedCpElement?.variasiKeterampilan ||
    'Penalaran Kritis, Analitis, dan Kontekstual';
  const tpCode = selectedTp?.code || 'TP 10.1';
  const tpBab = formatBabLabel(selectedTp?.babId);
  const tpMateri = selectedTp?.materiPokok || 'Konsep Esensial & Studi Kasus Kontekstual';
  const tpGoal =
    selectedTp?.description ||
    `Menganalisis dan mempraktikkan ${tpMateri} sesuai tuntutan Capaian Pembelajaran terbaru.`;
  const tpKko = selectedTp ? `${selectedTp.bloomLevel} (${selectedTp.hotsCategory})` : 'C4 (HOTS)';

  const mindfulStep = `Mindful Inquiring (Berkesadaran): Guru memandu jeda reflektif 3 menit untuk mengamati fenomena nyata terkait "${tpMateri}" di lingkungan ${schoolProfile.schoolName}, mengaktifkan fokus panca indera dan rasa ingin tahu autentik sebelum membedah konsep Elemen CP "${cpName}".`;

  const meaningfulStep = `Meaningful Dialogue (Bermakna): Peserta didik mendiskusikan studi kasus kontekstual "${tpMateri}" yang relevan dengan dunia nyata/kejuruan (${schoolProfile.grade}), menghubungkan bunyi resmi CP BSKAP 046/2025 dengan pemecahan masalah tingkat ${tpKko}.`;

  const joyfulStep = `Joyful Celebration (Menggembirakan): Kelompok menyajikan karya/solusi "${tpMateri}" melalui unjuk kerja kolaboratif (Gallery Walk / Simulasi Praktik) disertai umpan balik apresiatif antar-rekan sebaya.`;

  const cpAdaptationSummary = `Materi "${tpMateri}" (${tpBab}) dipertajam dari sekadar hafalan definisi menjadi kompetensi "${cpFocus}" sesuai bunyi resmi Elemen CP "${cpName}" (KepKa BSKAP No. 046/H/KR/2025).`;

  const modeHeading =
    mode === 'cp_adaptation'
      ? 'REKOMENDASI PENYESUAIAN MATERI AJAR BERDASARKAN CP BSKAP 046/2025'
      : mode === 'differentiation'
      ? 'STRATEGI DIFERENSIASI MATERI AJAR & SCAFFOLDING KURIKULUM MERDEKA'
      : mode === 'authentic_assessment'
      ? 'DESAIN ASESMEN FORMATIF & KKTP PEMBELAJARAN MENDALAM'
      : 'STRATEGI PEMBELAJARAN MENDALAM (DEEP LEARNING) & ADAPTASI CP TERBARU';

  const summaryText = `### ${modeHeading}
**Mata Pelajaran:** ${schoolProfile.subject} (Fase ${schoolProfile.fase} · ${schoolProfile.grade})
**Fokus Bab & Materi:** ${tpBab} — ${tpMateri} (${tpCode} · ${tpKko})
**Rujukan Elemen CP Resmi (KepKa BSKAP No. 046/H/KR/2025):**
- **Elemen:** ${cpName}
- **Deskripsi Resmi CP:** *"${cpDesc}"*
- **Fokus Kompetensi:** ${cpFocus}
${customQuestion ? `- **Pertanyaan Konsultasi Guru:** *"${customQuestion.trim()}"*\n` : ''}
---

### 1. Penyesuaian Materi Ajar Berdasarkan CP Terbaru (BSKAP 046/2025)
- **Transformasi Lingkup Materi:** ${cpAdaptationSummary}
- **Kontekstualisasi Lokal & Kejuruan:** Materi **${tpMateri}** dikaitkan langsung dengan studi kasus nyata di lingkungan **${schoolProfile.schoolName}** agar mencapai Tujuan Pembelajaran: *"${tpGoal}"*.
- **Penajaman Kognitif (${tpKko}):** Hindari pemberian catatan satu arah; gunakan stimulus multimodal (studi kasus autentik, infografik data, atau objek pengamatan langsung) yang menuntut ${cpFocus.toLowerCase()}.

### 2. Skenario 3 Pilar Pembelajaran Mendalam (Deep Learning)
1. **🌿 ${mindfulStep}**
2. **💡 ${meaningfulStep}**
3. **🤝 ${joyfulStep}**

### 3. Penyesuaian Pembelajaran Berdiferensiasi (Sesuai Kesiapan Siswa)
- **Kelompok Dasar (Perlu Bimbingan):** Diberikan kerangka pemandu (*graphic organizer*), glosarium kata kunci **${tpMateri}**, dan contoh terstruktur langkah demi langkah.
- **Kelompok Menengah (Cakap):** Menganalisis kasus kontekstual secara kolaboratif menggunakan lembar kerja penyelidikan terpandu.
- **Kelompok Mahir (Pengayaan HOTS):** Mengevaluasi perbandingan dua studi kasus kompleks dan merancang solusi inovatif atau menjadi tutor sebaya.

### 4. Indikator Ketercapaian (KKTP) & Tindak Lanjut
- **Asesmen Formatif (Assessment as & for Learning):** Observasi keaktifan diskusi bermakna, jurnal refleksi 3-2-1, dan umpan balik langsung saat penyusunan draf.
- **Kriteria Ketuntasan Minimal (75%):** Peserta didik dinyatakan tuntas apabila mampu menunjukkan kompetensi **${cpName}** pada materi **${tpMateri}** secara objektif, runtut, dan komunikatif.`;

  return {
    title: `${modeHeading} — ${tpBab}`,
    summaryText,
    mindfulStep,
    meaningfulStep,
    joyfulStep,
    cpAdaptationSummary,
  };
}

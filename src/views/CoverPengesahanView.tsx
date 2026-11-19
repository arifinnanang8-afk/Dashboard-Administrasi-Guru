import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Printer,
  Download,
  ArrowLeft,
  ShieldCheck,
  Edit3,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  Building2,
  UserCheck,
  FileText,
  Calendar,
  Sparkles,
  BookOpen,
  Layers,
  Info,
  Wand2,
  Trash2,
  Loader2,
  Sliders,
  Palette,
} from 'lucide-react';
import { exportCoverAndPengesahanToWord } from '../utils/exporter';
import { KopSurat } from '../components/KopSurat';

interface CoverGraphicData {
  schoolName: string;
  npsn: string;
  programKeahlian: string;
  akreditasi: string;
  phone: string;
  address: string;
  schoolMotto: string;
  titleMain: string;
  curriculumSubtitle: string;
  learningApproach: string;
  academicYear: string;
  semesterText: string;
  subject: string;
  gradeText: string;
  teacherName: string;
  teacherNip: string;
  teacherIdType?: string;
  customIdType?: string;
  headmasterName: string;
  headmasterNip: string;
  headmasterIdType?: string;
  customHeadmasterIdType?: string;
  book1Title: string;
  book2Title: string;
  book3Title: string;
  bottomMotto: string;
  logoUrl?: string;
  leftLogoUrl?: string;
  rightLogoUrl?: string;
  headmasterSignatureUrl?: string;
  teacherSignatureUrl?: string;
  backgroundUrl?: string;
  bgOverlayOpacity?: number;
  aiTheme?: string;
  aiCustomPrompt?: string;
}

const AI_COVER_THEMES = [
  {
    id: 'emerald_modern',
    name: 'Emerald Modern Kurikulum Merdeka',
    badge: 'Populer',
    desc: 'Gelombang zamrud berlapis, aksen emas, & siluet pendidikan modern',
    motto: 'Berakhlak Mulia, Kompeten, dan Berdaya Saing',
    bottomMotto: 'Bersinergi dalam Pendidikan, Menuju Generasi Unggul dan Berkarakter',
  },
  {
    id: 'gedung_asri',
    name: 'Gedung Sekolah & Taman Asri',
    badge: 'Visual Sekolah',
    desc: 'Ilustrasi arsitektur gedung sekolah hijau modern, langit cerah & buku',
    motto: 'Lingkungan Belajar Hijau, Nyaman, dan Inspiratif',
    bottomMotto: 'Mewujudkan Ekosistem Sekolah yang Cerdas, Asri, dan Berbudaya',
  },
  {
    id: 'deep_learning',
    name: 'Deep Learning Futuristik (3 Pilar)',
    badge: 'Deep Learning',
    desc: 'Gradasi biru-toska modern dengan jaringan pengetahuan Mindful, Meaningful, Joyful',
    motto: 'Mindful Inquiring • Meaningful Dialogue • Joyful Celebration',
    bottomMotto: 'Pembelajaran Mendalam untuk Kompetensi Masa Depan Indonesia Maju',
  },
  {
    id: 'klasik_emas',
    name: 'Klasik Elegan Hijau & Emas',
    badge: 'Resmi & Mewah',
    desc: 'Ornamen geometris emas & hijau tua berwibawa untuk dokumen supervisi & akreditasi',
    motto: 'Unggul dalam Mutu, Santun dalam Perilaku',
    bottomMotto: 'Dedikasi Pendidik Profesional demi Kemajuan Bangsa',
  },
  {
    id: 'minimalis_geometris',
    name: 'Minimalis Geometris Kontemporer',
    badge: 'Clean A4',
    desc: 'Desain terang, bersih, hemat tinta dengan aksen gelombang modern di sudut halaman',
    motto: 'Kreatif, Mandiri, dan Bernalar Kritis',
    bottomMotto: 'Merdeka Belajar, Berkarya Nyata untuk Negeri',
  },
];

// Fast procedural SVG cover generator (0ms latency, crisp vector quality, zero overlapping text)
function buildModernAiSvgDataUrl(themeId: string, customSeed = 0): string {
  let svg = '';

  if (themeId === 'gedung_asri') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1131" width="800" height="1131">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="45%" stop-color="#f0fdf4"/>
          <stop offset="100%" stop-color="#dcfce7"/>
        </linearGradient>
        <linearGradient id="topWave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#064e3b"/>
          <stop offset="60%" stop-color="#047857"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
        <linearGradient id="goldWave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#fde047"/>
        </linearGradient>
        <linearGradient id="bldg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#d1fae5" stop-opacity="0.7"/>
          <stop offset="100%" stop-color="#a7f3d0" stop-opacity="0.4"/>
        </linearGradient>
      </defs>
      <rect width="800" height="1131" fill="url(#sky)"/>
      <!-- Sun & Clouds -->
      <circle cx="660" cy="240" r="85" fill="#fef08a" opacity="0.45"/>
      <circle cx="660" cy="240" r="120" fill="#fef9c3" opacity="0.25"/>
      <!-- Modern School Building Architectural Silhouette in lower background -->
      <g opacity="0.38">
        <polygon points="420,580 780,450 780,860 420,860" fill="url(#bldg)" stroke="#059669" stroke-width="2"/>
        <polygon points="400,580 790,440 790,465 400,605" fill="#047857"/>
        <!-- Windows grid -->
        <rect x="460" y="590" width="45" height="55" rx="4" fill="#065f46" opacity="0.4"/>
        <rect x="525" y="568" width="45" height="55" rx="4" fill="#065f46" opacity="0.4"/>
        <rect x="590" y="545" width="45" height="55" rx="4" fill="#065f46" opacity="0.4"/>
        <rect x="655" y="522" width="45" height="55" rx="4" fill="#065f46" opacity="0.4"/>
        <rect x="460" y="675" width="45" height="55" rx="4" fill="#065f46" opacity="0.4"/>
        <rect x="525" y="655" width="45" height="55" rx="4" fill="#065f46" opacity="0.4"/>
        <rect x="590" y="635" width="45" height="55" rx="4" fill="#065f46" opacity="0.4"/>
        <rect x="655" y="615" width="45" height="55" rx="4" fill="#065f46" opacity="0.4"/>
        <!-- Trees -->
        <circle cx="430" cy="760" r="55" fill="#10b981" opacity="0.6"/>
        <circle cx="470" cy="780" r="45" fill="#059669" opacity="0.6"/>
        <circle cx="740" cy="750" r="65" fill="#047857" opacity="0.5"/>
      </g>
      <!-- Top Ribbon Waves -->
      <path d="M0,0 L800,0 L800,90 Q520,30 280,110 Q110,165 0,130 Z" fill="url(#goldWave)"/>
      <path d="M0,0 L720,0 Q460,40 240,105 Q90,150 0,110 Z" fill="url(#topWave)"/>
      <!-- Bottom Hills & Waves -->
      <path d="M0,930 Q260,840 540,910 Q690,950 800,890 L800,1131 L0,1131 Z" fill="url(#goldWave)" opacity="0.85"/>
      <path d="M0,955 Q280,870 560,935 Q710,970 800,920 L800,1131 L0,1131 Z" fill="url(#topWave)"/>
      <path d="M0,1035 Q400,970 800,1045 L800,1131 L0,1131 Z" fill="#022c22" opacity="0.55"/>
    </svg>`;
  } else if (themeId === 'deep_learning') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1131" width="800" height="1131">
      <defs>
        <linearGradient id="bgDL" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#f0fdfa"/>
          <stop offset="50%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#e0f2fe"/>
        </linearGradient>
        <linearGradient id="tealWave" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#0f766e"/>
          <stop offset="50%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0d9488"/>
        </linearGradient>
        <linearGradient id="cyanAccent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#38bdf8"/>
        </linearGradient>
      </defs>
      <rect width="800" height="1131" fill="url(#bgDL)"/>
      <!-- Futuristic Deep Learning Neural & Geometric Rings -->
      <g opacity="0.22" stroke="#0284c7" stroke-width="1.5" fill="none">
        <circle cx="680" cy="320" r="160"/>
        <circle cx="680" cy="320" r="220" stroke-dasharray="8 8"/>
        <circle cx="120" cy="680" r="180"/>
        <circle cx="120" cy="680" r="240" stroke-dasharray="6 10"/>
        <line x1="540" y1="220" x2="720" y2="420"/>
        <line x1="600" y1="450" x2="760" y2="260"/>
      </g>
      <circle cx="680" cy="320" r="70" fill="url(#cyanAccent)" opacity="0.15"/>
      <circle cx="120" cy="680" r="90" fill="url(#tealWave)" opacity="0.1"/>
      <!-- Top Futuristic Header Wave -->
      <path d="M0,0 L800,0 L800,125 Q580,55 350,115 Q140,170 0,110 Z" fill="url(#cyanAccent)" opacity="0.6"/>
      <path d="M0,0 L800,0 L800,90 Q540,35 310,95 Q120,145 0,90 Z" fill="url(#tealWave)"/>
      <!-- Bottom Futuristic Wave -->
      <path d="M0,930 Q240,860 520,920 Q680,955 800,885 L800,1131 L0,1131 Z" fill="url(#cyanAccent)" opacity="0.5"/>
      <path d="M0,955 Q270,885 550,945 Q700,980 800,925 L800,1131 L0,1131 Z" fill="url(#tealWave)"/>
    </svg>`;
  } else if (themeId === 'klasik_emas') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1131" width="800" height="1131">
      <defs>
        <linearGradient id="creamBg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="50%" stop-color="#ffffff"/>
          <stop offset="100%" stop-color="#fef3c7"/>
        </linearGradient>
        <linearGradient id="darkGreen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#022c22"/>
          <stop offset="50%" stop-color="#064e3b"/>
          <stop offset="100%" stop-color="#065f46"/>
        </linearGradient>
        <linearGradient id="luxuryGold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#b45309"/>
          <stop offset="50%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
      </defs>
      <rect width="800" height="1131" fill="url(#creamBg)"/>
      <!-- Ornamental Corner Polygons -->
      <polygon points="0,0 800,0 800,110 0,165" fill="url(#luxuryGold)" opacity="0.85"/>
      <polygon points="0,0 800,0 800,85 0,140" fill="url(#darkGreen)"/>
      <!-- Subtle Luxury Frame -->
      <rect x="28" y="28" width="744" height="1075" rx="16" fill="none" stroke="url(#luxuryGold)" stroke-width="3" opacity="0.7"/>
      <rect x="38" y="38" width="724" height="1055" rx="12" fill="none" stroke="#064e3b" stroke-width="1" opacity="0.35"/>
      <!-- Center Watermark Mandala/Diamond -->
      <g opacity="0.07" transform="translate(400,565) rotate(45)">
        <rect x="-180" y="-180" width="360" height="360" rx="24" fill="none" stroke="#064e3b" stroke-width="10"/>
        <rect x="-130" y="-130" width="260" height="260" rx="16" fill="none" stroke="#b45309" stroke-width="6"/>
      </g>
      <!-- Bottom Royal Polygon -->
      <polygon points="0,960 800,900 800,1131 0,1131" fill="url(#luxuryGold)" opacity="0.85"/>
      <polygon points="0,980 800,925 800,1131 0,1131" fill="url(#darkGreen)"/>
    </svg>`;
  } else if (themeId === 'minimalis_geometris') {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1131" width="800" height="1131">
      <defs>
        <linearGradient id="emGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#059669"/>
          <stop offset="100%" stop-color="#10b981"/>
        </linearGradient>
        <linearGradient id="amberGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#fbbf24"/>
        </linearGradient>
      </defs>
      <rect width="800" height="1131" fill="#ffffff"/>
      <!-- Minimalist Corner Shapes -->
      <path d="M0,0 L480,0 Q340,90 160,110 Q60,120 0,180 Z" fill="url(#amberGrad)" opacity="0.85"/>
      <path d="M0,0 L400,0 Q270,75 120,90 Q40,100 0,145 Z" fill="url(#emGrad)"/>
      <circle cx="730" cy="110" r="140" fill="#ecfdf5"/>
      <circle cx="70" cy="850" r="110" fill="#fffbeb"/>
      <!-- Bottom Right Geometric Wave -->
      <path d="M220,1131 Q460,1020 800,940 L800,1131 Z" fill="url(#amberGrad)" opacity="0.85"/>
      <path d="M300,1131 Q520,1040 800,975 L800,1131 Z" fill="#064e3b"/>
    </svg>`;
  } else {
    // Default: emerald_modern (matches reference image aesthetic without any baked-in text)
    const hueShift = customSeed % 20;
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1131" width="800" height="1131">
      <defs>
        <linearGradient id="bgMain" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="45%" stop-color="#f0fdf4"/>
          <stop offset="100%" stop-color="#dcfce7"/>
        </linearGradient>
        <linearGradient id="emeraldDark" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#064e3b"/>
          <stop offset="55%" stop-color="#047857"/>
          <stop offset="100%" stop-color="#059669"/>
        </linearGradient>
        <linearGradient id="goldRibbon" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stop-color="#eab308"/>
          <stop offset="50%" stop-color="#facc15"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>
      </defs>
      <rect width="800" height="1131" fill="url(#bgMain)"/>
      <!-- Soft Ambient Glows -->
      <circle cx="${650 - hueShift}" cy="340" r="210" fill="#bbf7d0" opacity="0.35"/>
      <circle cx="160" cy="640" r="190" fill="#fef08a" opacity="0.28"/>
      <!-- Top Left & Right Reference Waves -->
      <path d="M0,0 L560,0 Q340,55 180,115 Q60,160 0,145 Z" fill="url(#goldRibbon)"/>
      <path d="M0,0 L490,0 Q290,45 140,95 Q45,130 0,115 Z" fill="url(#emeraldDark)"/>
      <path d="M800,130 Q680,175 640,240 L800,205 Z" fill="url(#goldRibbon)" opacity="0.85"/>
      <path d="M800,150 Q695,190 660,255 L800,225 Z" fill="url(#emeraldDark)"/>
      <!-- Decorative Stack of 3 Books Graphic Illustration (No Text) on Right Side -->
      <g transform="translate(495, 675)" opacity="0.85">
        <!-- Orange Bottom Book -->
        <rect x="0" y="95" width="255" height="44" rx="8" fill="#ea580c"/>
        <rect x="8" y="102" width="235" height="30" rx="4" fill="#fff7ed" opacity="0.25"/>
        <!-- Green Middle Book -->
        <rect x="10" y="48" width="240" height="45" rx="8" fill="#15803d"/>
        <rect x="18" y="55" width="220" height="30" rx="4" fill="#f0fdf4" opacity="0.25"/>
        <!-- Blue Top Book -->
        <rect x="22" y="4" width="220" height="42" rx="8" fill="#1d4ed8"/>
        <rect x="30" y="10" width="200" height="28" rx="4" fill="#eff6ff" opacity="0.25"/>
      </g>
      <!-- Bottom Curved Emerald & Gold Footer -->
      <path d="M0,910 Q270,825 560,895 Q700,930 800,885 L800,1131 L0,1131 Z" fill="url(#goldRibbon)"/>
      <path d="M0,930 Q270,845 560,915 Q700,950 800,905 L800,1131 L0,1131 Z" fill="url(#emeraldDark)"/>
      <path d="M120,1045 Q400,1005 680,1045 Q730,1090 690,1120 L110,1120 Q70,1090 120,1045 Z" fill="#fefce8" opacity="0.92"/>
    </svg>`;
  }

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const CoverPengesahanView: React.FC = () => {
  const { schoolProfile, updateSchoolProfile, setActiveView, openPrintModal, showNotification } = useApp();
  const [activeTab, setActiveTab] = useState<'kedinasan' | 'pengesahan' | 'daftar_isi' | 'semua'>('kedinasan');
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const leftLogoInputRef = useRef<HTMLInputElement>(null);
  const rightLogoInputRef = useRef<HTMLInputElement>(null);
  const headmasterSignInputRef = useRef<HTMLInputElement>(null);
  const teacherSignInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Cover Graphic Data
  const [coverData, setCoverData] = useState<CoverGraphicData>(() => {
    const defaultData: CoverGraphicData = {
      schoolName: schoolProfile.schoolName || "SMK MA'ARIF 1 SENDANG AGUNG",
      npsn: schoolProfile.npsn || '10802058',
      programKeahlian:
        (typeof schoolProfile.programKeahlian === 'string'
          ? schoolProfile.programKeahlian
          : Array.isArray(schoolProfile.programKeahlian)
          ? schoolProfile.programKeahlian.join('\n')
          : '') || '1. Manajemen Perkantoran\n2. Teknik Komputer dan Jaringan',
      akreditasi: schoolProfile.akreditasi || 'A',
      phone: schoolProfile.phone || '(0729) 732109',
      address:
        schoolProfile.address ||
        'Jl. Raya Sendang Agung No. 01, Kec. Sendang Agung, Kab. Lampung Tengah, Lampung 34174',
      schoolMotto: 'Berakhlak Mulia, Kompeten, dan Berdaya Saing',
      titleMain: 'PERANGKAT PEMBELAJARAN',
      curriculumSubtitle: 'Kurikulum Merdeka',
      learningApproach: 'Pembelajaran Mendalam',
      academicYear: schoolProfile.academicYear || '2026/2027',
      semesterText: schoolProfile.semester === 1 ? 'Semester 1' : 'Semester 2',
      subject: schoolProfile.subject || 'Bahasa Indonesia',
      gradeText: 'E / X SMK',
      teacherName: schoolProfile.teacherName || 'Nanang Arifin, S.Pd',
      teacherNip: schoolProfile.teacherNip || '19880512 201101 2 008',
      teacherIdType: schoolProfile.teacherIdType || 'NIP',
      customIdType: '',
      headmasterName: schoolProfile.headmasterName || 'Drs. H. Bambang Sudirman, M.M.',
      headmasterNip: schoolProfile.headmasterNip || '19680315 199403 1 004',
      headmasterIdType: schoolProfile.headmasterIdType || 'NIP',
      customHeadmasterIdType: '',
      book1Title: 'Merdeka Belajar',
      book2Title: 'Deep Learning',
      book3Title: 'Indonesia Maju',
      bottomMotto: 'Bersinergi dalam Pendidikan, Menuju Generasi Unggul dan Berkarakter',
      logoUrl: schoolProfile.logoUrl || '',
      leftLogoUrl: schoolProfile.leftLogoUrl || schoolProfile.logoUrl || '',
      rightLogoUrl: schoolProfile.rightLogoUrl || '',
      headmasterSignatureUrl: schoolProfile.headmasterSignatureUrl || '',
      teacherSignatureUrl: schoolProfile.teacherSignatureUrl || '',
      backgroundUrl: schoolProfile.coverBackgroundUrl || buildModernAiSvgDataUrl('emerald_modern'),
      bgOverlayOpacity: schoolProfile.coverOverlayOpacity ?? 20,
      aiTheme: 'emerald_modern',
      aiCustomPrompt: '',
    };

    const saved = localStorage.getItem('ADM_GURU_COVER_GRAPHIC_DATA_2026');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultData,
          ...parsed,
          npsn: parsed.npsn ?? defaultData.npsn,
          programKeahlian: parsed.programKeahlian ?? defaultData.programKeahlian,
          akreditasi: parsed.akreditasi ?? defaultData.akreditasi,
          phone: parsed.phone ?? defaultData.phone,
          address: parsed.address ?? defaultData.address,
        };
      } catch {
        // fallback
      }
    }
    return defaultData;
  });

  // Live update helper for coverData + schoolProfile + localStorage
  const updateCoverAndProfile = (updates: Partial<CoverGraphicData>) => {
    setCoverData((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
      return next;
    });

    const profileUpdates: Record<string, unknown> = {};
    if (updates.schoolName !== undefined) profileUpdates.schoolName = updates.schoolName;
    if (updates.npsn !== undefined) profileUpdates.npsn = updates.npsn;
    if (updates.programKeahlian !== undefined) profileUpdates.programKeahlian = updates.programKeahlian;
    if (updates.akreditasi !== undefined) profileUpdates.akreditasi = updates.akreditasi;
    if (updates.phone !== undefined) profileUpdates.phone = updates.phone;
    if (updates.address !== undefined) profileUpdates.address = updates.address;
    if (updates.teacherName !== undefined) profileUpdates.teacherName = updates.teacherName;
    if (updates.teacherNip !== undefined) profileUpdates.teacherNip = updates.teacherNip;
    if (updates.teacherIdType !== undefined) profileUpdates.teacherIdType = updates.teacherIdType;
    if (updates.headmasterName !== undefined) profileUpdates.headmasterName = updates.headmasterName;
    if (updates.headmasterNip !== undefined) profileUpdates.headmasterNip = updates.headmasterNip;
    if (updates.headmasterIdType !== undefined) profileUpdates.headmasterIdType = updates.headmasterIdType;
    if (updates.subject !== undefined) profileUpdates.subject = updates.subject;
    if (updates.academicYear !== undefined) profileUpdates.academicYear = updates.academicYear;

    if (Object.keys(profileUpdates).length > 0) {
      updateSchoolProfile(profileUpdates);
    }
  };

  // Legalization Data for Halaman Pengesahan (Resmi Kepala Sekolah & Guru)
  const [legalData, setLegalData] = useState(() => {
    const saved = localStorage.getItem('ADM_GURU_LEGALIZATION_DATA_2026');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      nomorDokumen: '421.5/082/SMK-M1/2026',
      legalizationNote:
        'Setelah melalui proses telaah, verifikasi, dan validasi kurikulum oleh Tim Pengembang Kurikulum Satuan Pendidikan, Dokumen Perangkat Pembelajaran Kurikulum Merdeka yang memuat Capaian Pembelajaran (CP), Alur Tujuan Pembelajaran (ATP), Rincian Pekan Efektif (RPE), Program Tahunan (PROTA), Program Semester (PROMES), Modul Ajar Terpadu, Lembar Kerja Peserta Didik (LKPD), serta Instrumen Penilaian & Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) untuk:',
    };
  });

  // Sync external schoolProfile updates with coverData
  useEffect(() => {
    setCoverData((prev) => ({
      ...prev,
      schoolName: schoolProfile.schoolName ?? prev.schoolName,
      npsn: schoolProfile.npsn ?? prev.npsn,
      programKeahlian:
        (typeof schoolProfile.programKeahlian === 'string'
          ? schoolProfile.programKeahlian
          : Array.isArray(schoolProfile.programKeahlian)
          ? schoolProfile.programKeahlian.join('\n')
          : undefined) ?? prev.programKeahlian,
      akreditasi: schoolProfile.akreditasi ?? prev.akreditasi,
      phone: schoolProfile.phone ?? prev.phone,
      address: schoolProfile.address ?? prev.address,
      subject: schoolProfile.subject || prev.subject,
      teacherName: schoolProfile.teacherName || prev.teacherName,
      teacherNip: schoolProfile.teacherNip || prev.teacherNip,
      teacherIdType: schoolProfile.teacherIdType || prev.teacherIdType || 'NIP',
      headmasterName: schoolProfile.headmasterName || prev.headmasterName,
      headmasterNip: schoolProfile.headmasterNip || prev.headmasterNip,
      headmasterIdType: schoolProfile.headmasterIdType || prev.headmasterIdType || 'NIP',
      academicYear: schoolProfile.academicYear || prev.academicYear,
      logoUrl: schoolProfile.logoUrl || prev.logoUrl,
      leftLogoUrl: schoolProfile.leftLogoUrl || prev.leftLogoUrl || schoolProfile.logoUrl || prev.logoUrl,
      rightLogoUrl: schoolProfile.rightLogoUrl || prev.rightLogoUrl,
      headmasterSignatureUrl: schoolProfile.headmasterSignatureUrl || prev.headmasterSignatureUrl,
      teacherSignatureUrl: schoolProfile.teacherSignatureUrl || prev.teacherSignatureUrl,
    }));
  }, [schoolProfile]);

  // Handle School Logo Upload (Base64)
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'File harus berupa gambar (PNG, JPG, SVG, WebP)');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showNotification('error', 'Ukuran gambar logo maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      setCoverData((prev) => {
        const next = { ...prev, logoUrl: base64Url, leftLogoUrl: prev.leftLogoUrl || base64Url };
        localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
        return next;
      });
      updateSchoolProfile({ logoUrl: base64Url, leftLogoUrl: coverData.leftLogoUrl || base64Url });
      showNotification('success', 'Logo sekolah berhasil diupload dan disematkan pada sampul.');
    };
    reader.onerror = () => {
      showNotification('error', 'Gagal membaca file gambar.');
    };
    reader.readAsDataURL(file);
  };

  // Handle Left Kop Logo Upload
  const handleLeftLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'File logo kiri harus berupa gambar (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showNotification('error', 'Ukuran gambar logo maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      setCoverData((prev) => {
        const next = { ...prev, leftLogoUrl: base64Url, logoUrl: prev.logoUrl || base64Url };
        localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
        return next;
      });
      updateSchoolProfile({ leftLogoUrl: base64Url, logoUrl: coverData.logoUrl || base64Url });
      showNotification('success', 'Logo Kiri Kop Sekolah berhasil diupload!');
    };
    reader.readAsDataURL(file);
  };

  // Handle Right Kop Logo Upload
  const handleRightLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'File logo kanan harus berupa gambar (PNG, JPG, SVG, WebP)');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showNotification('error', 'Ukuran gambar logo maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      setCoverData((prev) => {
        const next = { ...prev, rightLogoUrl: base64Url };
        localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
        return next;
      });
      updateSchoolProfile({ rightLogoUrl: base64Url });
      showNotification('success', 'Logo Kanan Kop Sekolah berhasil diupload!');
    };
    reader.readAsDataURL(file);
  };

  const handleResetLeftLogo = () => {
    setCoverData((prev) => {
      const next = { ...prev, leftLogoUrl: '' };
      localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
      return next;
    });
    updateSchoolProfile({ leftLogoUrl: '' });
    if (leftLogoInputRef.current) leftLogoInputRef.current.value = '';
    showNotification('info', 'Logo Kiri Kop dikembalikan ke default.');
  };

  const handleResetRightLogo = () => {
    setCoverData((prev) => {
      const next = { ...prev, rightLogoUrl: '' };
      localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
      return next;
    });
    updateSchoolProfile({ rightLogoUrl: '' });
    if (rightLogoInputRef.current) rightLogoInputRef.current.value = '';
    showNotification('info', 'Logo Kanan Kop dikembalikan ke default.');
  };

  // Handle Headmaster Signature Upload
  const handleHeadmasterSignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'File tanda tangan Kepala Sekolah harus berupa gambar (PNG transparan, JPG, WebP, SVG).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showNotification('error', 'Ukuran file tanda tangan maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      setCoverData((prev) => {
        const next = { ...prev, headmasterSignatureUrl: base64Url };
        localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
        return next;
      });
      updateSchoolProfile({ headmasterSignatureUrl: base64Url });
      showNotification('success', 'Tanda tangan Kepala Sekolah berhasil diupload dan diterapkan pada Lembar Pengesahan!');
    };
    reader.readAsDataURL(file);
  };

  // Handle Teacher Signature Upload
  const handleTeacherSignUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'File tanda tangan Guru harus berupa gambar (PNG transparan, JPG, WebP, SVG).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showNotification('error', 'Ukuran file tanda tangan maksimal 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      setCoverData((prev) => {
        const next = { ...prev, teacherSignatureUrl: base64Url };
        localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
        return next;
      });
      updateSchoolProfile({ teacherSignatureUrl: base64Url });
      showNotification('success', 'Tanda tangan Guru Mata Pelajaran berhasil diupload dan diterapkan!');
    };
    reader.readAsDataURL(file);
  };

  const handleResetHeadmasterSign = () => {
    setCoverData((prev) => {
      const next = { ...prev, headmasterSignatureUrl: '' };
      localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
      return next;
    });
    updateSchoolProfile({ headmasterSignatureUrl: '' });
    if (headmasterSignInputRef.current) headmasterSignInputRef.current.value = '';
    showNotification('info', 'Tanda tangan Kepala Sekolah telah dihapus.');
  };

  const handleResetTeacherSign = () => {
    setCoverData((prev) => {
      const next = { ...prev, teacherSignatureUrl: '' };
      localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
      return next;
    });
    updateSchoolProfile({ teacherSignatureUrl: '' });
    if (teacherSignInputRef.current) teacherSignInputRef.current.value = '';
    showNotification('info', 'Tanda tangan Guru telah dihapus.');
  };

  // Handle Background Cover Photo Upload (Base64)
  const handleBgPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('error', 'File latar belakang harus berupa foto/gambar (JPG, PNG, WebP).');
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      showNotification('error', 'Ukuran foto latar belakang maksimal 6 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      setCoverData((prev) => {
        const next = {
          ...prev,
          backgroundUrl: base64Url,
          bgOverlayOpacity: prev.bgOverlayOpacity ?? 35,
          aiTheme: 'custom_upload',
        };
        localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
        return next;
      });
      updateSchoolProfile({
        coverBackgroundUrl: base64Url,
        coverOverlayOpacity: coverData.bgOverlayOpacity ?? 35,
      });
      setActiveTab('kedinasan');
      showNotification('success', 'Foto latar belakang cover berhasil diupload dan diterapkan!');
    };
    reader.onerror = () => {
      showNotification('error', 'Gagal membaca file foto latar belakang.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveBgPhoto = () => {
    setCoverData((prev) => {
      const next = { ...prev, backgroundUrl: '', aiTheme: 'none' };
      localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
      return next;
    });
    updateSchoolProfile({ coverBackgroundUrl: '' });
    if (bgFileInputRef.current) bgFileInputRef.current.value = '';
    showNotification('info', 'Latar belakang cover dikembalikan ke tampilan kertas putih resmi.');
  };

  // Apply Instant Preset Theme (0ms)
  const handleSelectPresetTheme = (themeId: string) => {
    const found = AI_COVER_THEMES.find((t) => t.id === themeId);
    const svgUrl = buildModernAiSvgDataUrl(themeId);
    setCoverData((prev) => {
      const next = {
        ...prev,
        aiTheme: themeId,
        backgroundUrl: svgUrl,
        bgOverlayOpacity: 10,
        schoolMotto: found?.motto || prev.schoolMotto,
        bottomMotto: found?.bottomMotto || prev.bottomMotto,
      };
      localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
      return next;
    });
    updateSchoolProfile({
      coverBackgroundUrl: svgUrl,
      coverOverlayOpacity: 10,
    });
    setActiveTab('kedinasan');
    showNotification('success', `Desain "${found?.name || 'Modern AI'}" diterapkan secara instan!`);
  };

  // Generate Fast & Modern Cover with Gemini AI (/api/gemini/generate-cover + instant vector fallback)
  const handleGenerateAiCover = async () => {
    setIsGeneratingAi(true);
    try {
      const selectedThemeObj = AI_COVER_THEMES.find((t) => t.id === coverData.aiTheme) || AI_COVER_THEMES[0];

      const response = await fetch('/api/gemini/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: coverData.aiCustomPrompt,
          theme: selectedThemeObj.name,
          schoolName: coverData.schoolName,
          subject: coverData.subject,
          grade: coverData.gradeText,
          teacherName: coverData.teacherName,
          academicYear: coverData.academicYear,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.svgCode && data.svgCode.includes('<svg')) {
          // Sanitize any accidental <text> tags from AI SVG so there's never overlapping text
          const cleanSvg = data.svgCode.replace(/<text[\s\S]*?<\/text>/gi, '');
          const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;

          setCoverData((prev) => {
            const next = {
              ...prev,
              backgroundUrl: svgDataUrl,
              bgOverlayOpacity: 15,
              schoolMotto: data.schoolMotto || prev.schoolMotto,
              bottomMotto: data.bottomMotto || prev.bottomMotto,
            };
            localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
            return next;
          });
          updateSchoolProfile({
            coverBackgroundUrl: svgDataUrl,
            coverOverlayOpacity: 15,
          });
          setActiveTab('kedinasan');
          showNotification('success', `Cover AI Modern (${data.themeName || selectedThemeObj.name}) berhasil dibuat!`);
          setIsGeneratingAi(false);
          return;
        }
      }

      // Ultra-fast fallback if offline or API key not set
      const fallbackSvgUrl = buildModernAiSvgDataUrl(
        coverData.aiTheme || 'emerald_modern',
        Date.now()
      );
      setCoverData((prev) => {
        const next = {
          ...prev,
          backgroundUrl: fallbackSvgUrl,
          bgOverlayOpacity: 10,
          schoolMotto: selectedThemeObj.motto,
          bottomMotto: selectedThemeObj.bottomMotto,
        };
        localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
        return next;
      });
      updateSchoolProfile({
        coverBackgroundUrl: fallbackSvgUrl,
        coverOverlayOpacity: 10,
      });
      setActiveTab('kedinasan');
      showNotification('success', `Cover Modern "${selectedThemeObj.name}" berhasil dibuat dengan cepat!`);
    } catch {
      const fallbackSvgUrl = buildModernAiSvgDataUrl(coverData.aiTheme || 'emerald_modern', Date.now());
      setCoverData((prev) => {
        const next = { ...prev, backgroundUrl: fallbackSvgUrl, bgOverlayOpacity: 10 };
        localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
        return next;
      });
      updateSchoolProfile({ coverBackgroundUrl: fallbackSvgUrl, coverOverlayOpacity: 10 });
      showNotification('success', 'Cover AI Modern berhasil diterapkan!');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleResetLogo = () => {
    setCoverData((prev) => {
      const next = { ...prev, logoUrl: '' };
      localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(next));
      return next;
    });
    updateSchoolProfile({ logoUrl: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    showNotification('info', 'Logo telah dikembalikan ke lambang default satuan pendidikan.');
  };

  // Save all form values
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    updateSchoolProfile({
      teacherName: coverData.teacherName,
      teacherNip: coverData.teacherNip,
      teacherIdType: coverData.teacherIdType || 'NIP',
      headmasterName: coverData.headmasterName,
      headmasterNip: coverData.headmasterNip,
      headmasterIdType: coverData.headmasterIdType || 'NIP',
      schoolName: coverData.schoolName,
      npsn: coverData.npsn,
      programKeahlian: coverData.programKeahlian,
      akreditasi: coverData.akreditasi,
      phone: coverData.phone,
      address: coverData.address,
      subject: coverData.subject,
      academicYear: coverData.academicYear,
      logoUrl: coverData.logoUrl,
      leftLogoUrl: coverData.leftLogoUrl,
      rightLogoUrl: coverData.rightLogoUrl,
      headmasterSignatureUrl: coverData.headmasterSignatureUrl,
      teacherSignatureUrl: coverData.teacherSignatureUrl,
      coverBackgroundUrl: coverData.backgroundUrl,
      coverOverlayOpacity: coverData.bgOverlayOpacity,
    });

    localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(coverData));
    localStorage.setItem('ADM_GURU_LEGALIZATION_DATA_2026', JSON.stringify(legalData));

    setIsEditing(false);
    showNotification(
      'success',
      'Perubahan sampul, foto latar belakang & pengesahan berhasil disimpan dan disinkronkan.'
    );
  };

  // Reset to Nanang Arifin / SMK Ma'arif 1 Sendang Agung Default
  const handleResetToDefault = () => {
    const defaultBg = buildModernAiSvgDataUrl('emerald_modern');
    const defaultCover: CoverGraphicData = {
      schoolName: "SMK MA'ARIF 1 SENDANG AGUNG",
      npsn: '10802058',
      programKeahlian: '1. Manajemen Perkantoran\n2. Teknik Komputer dan Jaringan',
      akreditasi: 'A',
      phone: '(0729) 732109',
      address: 'Jl. Raya Sendang Agung No. 01, Kec. Sendang Agung, Kab. Lampung Tengah, Lampung 34174',
      schoolMotto: 'Berakhlak Mulia, Kompeten, dan Berdaya Saing',
      titleMain: 'PERANGKAT PEMBELAJARAN',
      curriculumSubtitle: 'Kurikulum Merdeka',
      learningApproach: 'Pembelajaran Mendalam',
      academicYear: '2026/2027',
      semesterText: 'Semester 1',
      subject: 'Bahasa Indonesia',
      gradeText: 'E / X SMK',
      teacherName: 'Nanang Arifin, S.Pd',
      teacherNip: '19880512 201101 2 008',
      teacherIdType: 'NIP',
      customIdType: '',
      headmasterName: 'Drs. H. Bambang Sudirman, M.M.',
      headmasterNip: '19680315 199403 1 004',
      headmasterIdType: 'NIP',
      customHeadmasterIdType: '',
      book1Title: 'Merdeka Belajar',
      book2Title: 'Deep Learning',
      book3Title: 'Indonesia Maju',
      bottomMotto: 'Bersinergi dalam Pendidikan, Menuju Generasi Unggul dan Berkarakter',
      logoUrl: '',
      backgroundUrl: defaultBg,
      bgOverlayOpacity: 15,
      aiTheme: 'emerald_modern',
      aiCustomPrompt: '',
    };
    setCoverData(defaultCover);
    localStorage.setItem('ADM_GURU_COVER_GRAPHIC_DATA_2026', JSON.stringify(defaultCover));
    updateSchoolProfile({
      schoolName: defaultCover.schoolName,
      npsn: defaultCover.npsn,
      programKeahlian: defaultCover.programKeahlian,
      akreditasi: defaultCover.akreditasi,
      phone: defaultCover.phone,
      address: defaultCover.address,
      teacherName: defaultCover.teacherName,
      teacherNip: defaultCover.teacherNip,
      teacherIdType: 'NIP',
      headmasterName: defaultCover.headmasterName,
      headmasterNip: defaultCover.headmasterNip,
      headmasterIdType: 'NIP',
      subject: defaultCover.subject,
      academicYear: defaultCover.academicYear,
      logoUrl: '',
      coverBackgroundUrl: defaultBg,
      coverOverlayOpacity: 15,
    });
    showNotification('success', 'Sampul dikembalikan ke format standar Nanang Arifin, S.Pd.');
  };

  // Download High-Res PNG of the Cover (including uploaded background photo or AI cover)
  const handleDownloadCoverPng = async () => {
    try {
      showNotification('info', 'Sedang merender gambar sampul resolusi tinggi (.png)...');
      const canvas = document.createElement('canvas');
      canvas.width = 1055;
      canvas.height = 1491;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const loadImage = (src: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      // 1. Fill base white
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Draw background photo or AI SVG background if present
      if (coverData.backgroundUrl) {
        try {
          const bgImg = await loadImage(coverData.backgroundUrl);
          // Cover-fit scaling
          const scale = Math.max(canvas.width / bgImg.width, canvas.height / bgImg.height);
          const w = bgImg.width * scale;
          const h = bgImg.height * scale;
          const x = (canvas.width - w) / 2;
          const y = (canvas.height - h) / 2;
          ctx.drawImage(bgImg, x, y, w, h);

          // Apply white readability veil according to bgOverlayOpacity
          const veilAlpha = Math.min(0.9, Math.max(0, (coverData.bgOverlayOpacity ?? 20) / 100));
          ctx.fillStyle = `rgba(255, 255, 255, ${veilAlpha})`;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } catch {
          // fallback gradient if image fails
        }
      }

      // 3. Draw Header School Identity Banner
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.beginPath();
      ctx.roundRect(65, 95, 925, 130, 24);
      ctx.fill();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (coverData.logoUrl) {
        try {
          const logoImg = await loadImage(coverData.logoUrl);
          ctx.drawImage(logoImg, 95, 115, 90, 90);
        } catch {
          // ignore
        }
      }

      ctx.fillStyle = '#064e3b';
      ctx.font = '900 32px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(coverData.schoolName, 205, 152);

      ctx.fillStyle = '#047857';
      ctx.font = 'italic 600 20px Georgia, serif';
      ctx.fillText(coverData.schoolMotto, 205, 188);

      // 4. Main Title Banner
      ctx.fillStyle = '#064e3b';
      ctx.beginPath();
      ctx.roundRect(95, 265, 865, 170, 34);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 6;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 54px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(coverData.titleMain || 'PERANGKAT PEMBELAJARAN', 527, 368);

      // Subtitle Badge
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.roundRect(215, 420, 625, 95, 28);
      ctx.fill();

      ctx.fillStyle = '#064e3b';
      ctx.font = 'italic 900 38px system-ui, sans-serif';
      ctx.fillText(coverData.curriculumSubtitle, 527, 466);
      ctx.font = 'italic 700 26px system-ui, sans-serif';
      ctx.fillText(coverData.learningApproach, 527, 502);

      // Academic Year Pill (2 lines: Tahun Ajaran on top, Semester below)
      ctx.fillStyle = '#f0fdf4';
      ctx.beginPath();
      ctx.roundRect(245, 530, 565, 76, 24);
      ctx.fill();
      ctx.strokeStyle = '#065f46';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#064e3b';
      ctx.font = '800 25px system-ui, sans-serif';
      ctx.fillText(`TAHUN AJARAN ${coverData.academicYear}`, 527, 562);
      ctx.font = '700 21px system-ui, sans-serif';
      ctx.fillStyle = '#047857';
      ctx.fillText(coverData.semesterText, 527, 592);

      // 5. Left Info Cards
      const infoRows = [
        { label: 'Mata Pelajaran', value: coverData.subject },
        { label: 'Fase / Kelas', value: coverData.gradeText },
        { label: 'Nama Guru', value: coverData.teacherName },
        { label: coverData.teacherIdType || 'NIP', value: coverData.teacherNip },
        { label: 'Sekolah', value: coverData.schoolName },
      ];

      infoRows.forEach((row, idx) => {
        const y = 635 + idx * 108;
        ctx.fillStyle = '#065f46';
        ctx.beginPath();
        ctx.roundRect(70, y, 240, 34, [14, 14, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 18px system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(row.label, 90, y + 23);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(70, y + 32, 460, 58, [0, 16, 16, 16]);
        ctx.fill();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#022c22';
        ctx.font = '800 23px system-ui, sans-serif';
        ctx.fillText(row.value, 92, y + 69);
      });

      // 6. Bottom Motto Banner
      ctx.fillStyle = '#fefce8';
      ctx.beginPath();
      ctx.roundRect(140, 1345, 775, 85, 30);
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#064e3b';
      ctx.font = 'italic 700 24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(coverData.bottomMotto, 527, 1396);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `SAMPUL_KURIKULUM_MERDEKA_${coverData.subject.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
      showNotification('success', 'Gambar Sampul (.png) berhasil diunduh!');
    } catch (err) {
      console.error(err);
      showNotification('error', 'Gagal mengunduh gambar sampul.');
    }
  };

  // Export to Microsoft Word
  const handleExportWord = async () => {
    try {
      showNotification('info', 'Sedang memproses dokumen Word (.docx)...');
      await exportCoverAndPengesahanToWord(
        {
          ...schoolProfile,
          teacherName: coverData.teacherName,
          teacherNip: coverData.teacherNip,
          teacherIdType: coverData.teacherIdType || 'NIP',
          schoolName: coverData.schoolName,
          npsn: coverData.npsn,
          programKeahlian: coverData.programKeahlian,
          akreditasi: coverData.akreditasi,
          phone: coverData.phone,
          address: coverData.address,
          subject: coverData.subject,
          grade: coverData.gradeText,
          academicYear: coverData.academicYear,
        },
        legalData,
        `COVER_DAN_PENGESAHAN_${coverData.subject.replace(/\s+/g, '_')}_${coverData.academicYear.replace('/', '-')}.docx`
      );
      showNotification('success', 'Dokumen Cover & Pengesahan berhasil diunduh dalam format Word (.docx).');
    } catch (err) {
      console.error(err);
      showNotification('error', 'Gagal membuat berkas Word. Silakan coba kembali.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file inputs for logo and cover background photo */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleLogoUpload}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={leftLogoInputRef}
        onChange={handleLeftLogoUpload}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={rightLogoInputRef}
        onChange={handleRightLogoUpload}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={headmasterSignInputRef}
        onChange={handleHeadmasterSignUpload}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={teacherSignInputRef}
        onChange={handleTeacherSignUpload}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={bgFileInputRef}
        onChange={handleBgPhotoUpload}
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
      />

      {/* Top Header Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Kembali ke Dashboard"
            aria-label="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Cover & Halaman Pengesahan (Menu 1)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                AI Cover & Upload Foto
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sampul resmi Kurikulum Merdeka dengan fitur Upload Foto Latar Belakang & Generator Cover AI Cepat & Modern
            </p>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Ubah Data Button */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isEditing
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Tutup Formulir' : 'Ubah Data & Cover AI'}</span>
          </button>

          {/* Quick Upload Background Photo */}
          <button
            onClick={() => bgFileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition-all cursor-pointer"
            title="Upload foto latar belakang cover dari komputer"
          >
            <ImageIcon className="w-4 h-4 text-amber-600" />
            <span>Upload Foto Latar</span>
          </button>

          {/* Quick Buat Cover AI */}
          <button
            onClick={() => {
              setIsEditing(true);
              handleGenerateAiCover();
            }}
            disabled={isGeneratingAi}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-60"
            title="Buat desain latar belakang cover modern dengan AI secara cepat"
          >
            {isGeneratingAi ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span>Buat Cover AI Cepat</span>
          </button>

          {/* Unduh PNG */}
          <button
            onClick={handleDownloadCoverPng}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Unduh Sampul sebagai Gambar Resolusi Tinggi (.png)"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Unduh PNG</span>
          </button>

          {/* Unduh Word */}
          <button
            onClick={handleExportWord}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
            title="Unduh dokumen Cover & Lembar Pengesahan format Word (.docx)"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span>Unduh Word (.docx)</span>
          </button>

          {/* Cetak / PDF */}
          <button
            onClick={() => openPrintModal('cover')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            title="Cetak format A4 atau Simpan sebagai PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF (A4)</span>
          </button>
        </div>
      </div>

      {/* Pilihan Format Kop Surat Resmi (Yayasan vs Dinas Tanpa Jurusan) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-slate-50 p-3.5 sm:p-4 rounded-2xl border border-emerald-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-800 text-white shadow-xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-slate-900">Pilihan Kop Surat Resmi:</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                {schoolProfile.kopType === 'dinas' ? '🏛️ Kop Dinas (Tanpa Jurusan)' : "🕌 Kop Yayasan (Ma'arif NU)"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Pilihan kop berlaku otomatis untuk Lembar Pengesahan, Daftar Isi, Cetak Resmi A4 & Unduh Word (.docx).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-emerald-200/90 shadow-xs shrink-0">
          <button
            type="button"
            onClick={() => {
              updateSchoolProfile({ kopType: 'yayasan' });
              showNotification('success', "Format Kop Surat diubah ke 'Kop Yayasan (Ma'arif NU)'. Tersinkron ke seluruh dokumen.");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              schoolProfile.kopType !== 'dinas'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Kop Yayasan: Lembaga Pendidikan Ma'arif NU dengan daftar Program Keahlian / Jurusan"
          >
            <span>Kop Yayasan (Ma'arif NU)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              updateSchoolProfile({ kopType: 'dinas' });
              showNotification('success', "Format Kop Surat diubah ke 'Kop Dinas (Tanpa Jurusan)'. Tersinkron ke seluruh dokumen.");
            }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              schoolProfile.kopType === 'dinas'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Kop Dinas: Pemerintah Provinsi & Dinas Pendidikan dan Kebudayaan tanpa mencantumkan jurusan"
          >
            <span>Kop Dinas (Tanpa Jurusan)</span>
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-2.5 rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('kedinasan')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'kedinasan'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Sampul Resmi Kurikulum Merdeka (A4)</span>
          </button>

          <button
            onClick={() => setActiveTab('pengesahan')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pengesahan'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Lembar Pengesahan Legalitas (Kepala Sekolah & Guru)</span>
          </button>

          <button
            onClick={() => setActiveTab('daftar_isi')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'daftar_isi'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Daftar Isi Bundel</span>
          </button>

          <button
            onClick={() => setActiveTab('semua')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'semua'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Semua Berurutan (Cover + TTD + Isi)</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
          <Info className="w-4 h-4 text-emerald-600" />
          <span>Klik tombol "Ubah Data & Cover AI" untuk edit sampul</span>
        </div>
      </div>

      {/* COLLAPSIBLE EDIT FORM DRAWER */}
      {isEditing && (
        <form
          onSubmit={handleSaveForm}
          className="bg-white p-6 rounded-2xl border-2 border-emerald-500/40 shadow-lg space-y-6 animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                <Edit3 className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Formulir Ubah Data Sampul & Pengesahan
                </h3>
                <p className="text-xs text-slate-500">
                  Kelola identitas guru, pilih NIP/NUPTK, upload foto latar belakang cover, atau buat cover modern dengan AI secara cepat.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium cursor-pointer"
              title="Kembalikan ke data standar"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
            </button>
          </div>

          {/* =====================================================================
              NEW FEATURE: UPLOAD FOTO LATAR BELAKANG & BUAT COVER DENGAN AI MODERN
              ===================================================================== */}
          <div className="bg-gradient-to-br from-emerald-50/90 via-teal-50/60 to-amber-50/50 p-5 rounded-2xl border border-emerald-200/90 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-200/70 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-700 text-white shadow-xs">
                  <Wand2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-2">
                    <span>Desain Latar Belakang Cover (Upload Foto & Generator AI Cepat)</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-200/80 text-amber-950">
                      Cepat & Modern
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-600">
                    Upload foto gedung sekolah/kegiatan dari komputer Anda atau buat desain cover modern otomatis dengan AI tanpa teks yang bertumpuk.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
              {/* Left Column: Upload Foto Latar Belakang Cover */}
              <div className="lg:col-span-5 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-800">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  <span>1. Upload Foto untuk Cover Latar Belakang</span>
                </h5>

                <div className="flex items-start gap-3">
                  {/* Thumbnail Preview */}
                  <div className="w-20 h-28 rounded-xl border-2 border-dashed border-emerald-300 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner relative">
                    {coverData.backgroundUrl ? (
                      <img
                        src={coverData.backgroundUrl}
                        alt="Preview Latar Cover"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-1 text-[10px] text-slate-400 font-medium">
                        Polos / Putih
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <button
                      type="button"
                      onClick={() => bgFileInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs transition-all"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Foto Latar Belakang</span>
                    </button>

                    <p className="text-[11px] text-slate-500 leading-snug">
                      Mendukung foto gedung sekolah, taman, atau template grafis (JPG, PNG, WebP).
                    </p>

                    {coverData.backgroundUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveBgPhoto}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Hapus Latar (Gunakan Polos)</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Overlay Opacity Control */}
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                      <Sliders className="w-3 h-3 text-emerald-600" />
                      Kecerahan Lapisan Baca (Kontras Teks)
                    </span>
                    <span className="font-mono font-bold text-emerald-800">
                      {coverData.bgOverlayOpacity ?? 20}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={85}
                    step={5}
                    value={coverData.bgOverlayOpacity ?? 20}
                    onChange={(e) =>
                      setCoverData({ ...coverData, bgOverlayOpacity: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Right Column: Buat Cover dengan AI Cepat & Modern */}
              <div className="lg:col-span-7 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-800">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>2. Buat Cover dengan AI (Cepat & Modern)</span>
                  </h5>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    Bebas Teks Bertumpuk
                  </span>
                </div>

                {/* Preset Modern AI Theme Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 flex items-center gap-1">
                    <Palette className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pilih Gaya Desain Modern (Klik untuk Terapkan Instan):</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AI_COVER_THEMES.map((theme) => {
                      const isSelected = coverData.aiTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => handleSelectPresetTheme(theme.id)}
                          className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-500/20'
                              : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-slate-900 text-[11px] leading-tight">
                              {theme.name}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white text-emerald-800 border border-emerald-200 shrink-0">
                              {theme.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                            {theme.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Prompt + Generate AI Button */}
                <div className="pt-1 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={coverData.aiCustomPrompt || ''}
                    onChange={(e) => setCoverData({ ...coverData, aiCustomPrompt: e.target.value })}
                    placeholder="Instruksi AI opsional (misal: nuansa hijau zamrud, emas & futuristik)..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAiCover}
                    disabled={isGeneratingAi}
                    className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-sm cursor-pointer transition-all shrink-0 disabled:opacity-60"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Membuat Cover AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Buat Cover dengan AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
            {/* 1. Guru & Identitas Pegawai (NIP / NUPTK / NIPY / NIY) */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-800">
                <UserCheck className="w-4 h-4" />
                Data Guru Pengampu
              </h4>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Guru Lengkap</label>
                <input
                  type="text"
                  required
                  value={coverData.teacherName}
                  onChange={(e) => setCoverData({ ...coverData, teacherName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                  placeholder="Nanang Arifin, S.Pd"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Jenis Identitas Pegawai
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={
                      ['NIP', 'NUPTK', 'NIPY', 'NIY', 'PegID'].includes(coverData.teacherIdType || '')
                        ? coverData.teacherIdType
                        : 'Lainnya'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Lainnya') {
                        setCoverData({
                          ...coverData,
                          teacherIdType: coverData.customIdType || 'NUPTK',
                        });
                      } else {
                        setCoverData({ ...coverData, teacherIdType: val });
                      }
                    }}
                    className="w-full px-2.5 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-emerald-800 cursor-pointer"
                  >
                    <option value="NIP">NIP (PNS/PPPK)</option>
                    <option value="NUPTK">NUPTK (Kemendikbud)</option>
                    <option value="NIPY">NIPY (Pegawai Yayasan)</option>
                    <option value="NIY">NIY (Induk Yayasan)</option>
                    <option value="PegID">PegID (Kemenag)</option>
                    <option value="Lainnya">Lainnya (Ketik Sendiri)</option>
                  </select>
                  {(!['NIP', 'NUPTK', 'NIPY', 'NIY', 'PegID'].includes(coverData.teacherIdType || '')) ? (
                    <input
                      type="text"
                      value={coverData.teacherIdType || ''}
                      onChange={(e) =>
                        setCoverData({
                          ...coverData,
                          teacherIdType: e.target.value,
                          customIdType: e.target.value,
                        })
                      }
                      placeholder="Label (misal: NRG)"
                      className="w-full px-2.5 py-2 bg-white border rounded-xl border-slate-300 text-xs font-bold uppercase"
                    />
                  ) : (
                    <div className="flex items-center text-[11px] text-slate-500 italic px-1">
                      Label: {coverData.teacherIdType}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Nomor {coverData.teacherIdType || 'NIP'}
                </label>
                <input
                  type="text"
                  required
                  value={coverData.teacherNip}
                  onChange={(e) => setCoverData({ ...coverData, teacherNip: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                  placeholder="Nomor identitas (misal: 19880512 201101 2 008)"
                />
              </div>
            </div>

            {/* 2. Data Kepala Sekolah (Nama, Jenis Identitas: NIP/NUPTK/NIPY/NIY, Nomor) */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-800">
                <UserCheck className="w-4 h-4 text-emerald-700" />
                Data Kepala Sekolah
              </h4>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Kepala Sekolah Lengkap</label>
                <input
                  type="text"
                  required
                  value={coverData.headmasterName}
                  onChange={(e) => setCoverData({ ...coverData, headmasterName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                  placeholder="Drs. H. Bambang Sudirman, M.M."
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Jenis Identitas Pegawai
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={
                      ['NIP', 'NUPTK', 'NIPY', 'NIY', 'PegID'].includes(coverData.headmasterIdType || '')
                        ? coverData.headmasterIdType
                        : 'Lainnya'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'Lainnya') {
                        setCoverData({
                          ...coverData,
                          headmasterIdType: coverData.customHeadmasterIdType || 'NUPTK',
                        });
                      } else {
                        setCoverData({ ...coverData, headmasterIdType: val });
                      }
                    }}
                    className="w-full px-2.5 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-emerald-800 cursor-pointer"
                  >
                    <option value="NIP">NIP (PNS/PPPK)</option>
                    <option value="NUPTK">NUPTK (Kemendikbud)</option>
                    <option value="NIPY">NIPY (Pegawai Yayasan)</option>
                    <option value="NIY">NIY (Induk Yayasan)</option>
                    <option value="PegID">PegID (Kemenag)</option>
                    <option value="Lainnya">Lainnya (Ketik Sendiri)</option>
                  </select>
                  {(!['NIP', 'NUPTK', 'NIPY', 'NIY', 'PegID'].includes(coverData.headmasterIdType || '')) ? (
                    <input
                      type="text"
                      value={coverData.headmasterIdType || ''}
                      onChange={(e) =>
                        setCoverData({
                          ...coverData,
                          headmasterIdType: e.target.value,
                          customHeadmasterIdType: e.target.value,
                        })
                      }
                      placeholder="Label (misal: NRG)"
                      className="w-full px-2.5 py-2 bg-white border rounded-xl border-slate-300 text-xs font-bold uppercase"
                    />
                  ) : (
                    <div className="flex items-center text-[11px] text-slate-500 italic px-1">
                      Label: {coverData.headmasterIdType}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Nomor {coverData.headmasterIdType || 'NIP'}
                </label>
                <input
                  type="text"
                  required
                  value={coverData.headmasterNip}
                  onChange={(e) => setCoverData({ ...coverData, headmasterNip: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-mono"
                  placeholder="Nomor identitas (misal: 19680315 199403 1 004)"
                />
              </div>
            </div>

            {/* 2. Sekolah & Motto */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-800">
                <Building2 className="w-4 h-4" />
                Identitas Satuan Pendidikan
              </h4>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Satuan Pendidikan</label>
                <input
                  type="text"
                  required
                  value={coverData.schoolName}
                  onChange={(e) => updateCoverAndProfile({ schoolName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                  placeholder="SMK MA'ARIF 1 SENDANG AGUNG"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Motto Satuan (Header)</label>
                <input
                  type="text"
                  value={coverData.schoolMotto}
                  onChange={(e) => updateCoverAndProfile({ schoolMotto: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs italic"
                  placeholder="Berakhlak Mulia, Kompeten, dan Berdaya Saing"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">NPSN:</label>
                <input
                  type="text"
                  value={coverData.npsn ?? ''}
                  onChange={(e) => updateCoverAndProfile({ npsn: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-bold"
                  placeholder="Contoh: 10802058"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Program Keahlian:</label>
                <textarea
                  rows={2}
                  value={coverData.programKeahlian ?? ''}
                  onChange={(e) => updateCoverAndProfile({ programKeahlian: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  placeholder={`1. Manajemen Perkantoran\n2. Teknik Komputer dan Jaringan`}
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Tuliskan program/konsentrasi keahlian (tiap baris 1 jurusan, tampil pada Kop Yayasan & Lembar Sampul).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Terakreditasi :</label>
                  <input
                    type="text"
                    value={coverData.akreditasi ?? ''}
                    onChange={(e) => updateCoverAndProfile({ akreditasi: e.target.value })}
                    className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-bold text-emerald-800"
                    placeholder="Contoh: A / Unggul / B"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1 text-xs">Telp:</label>
                  <input
                    type="text"
                    value={coverData.phone ?? ''}
                    onChange={(e) => updateCoverAndProfile({ phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                    placeholder="Contoh: (0729) 732109"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 text-xs">Alamat:</label>
                <textarea
                  rows={2}
                  value={coverData.address ?? ''}
                  onChange={(e) => updateCoverAndProfile({ address: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-medium"
                  placeholder="Jl. Raya Sendang Agung No. 01, Kec. Sendang Agung, Kab. Lampung Tengah, Lampung 34174"
                />
              </div>

              <div className="pt-2 border-t border-slate-200">
                <label className="block text-slate-700 font-bold mb-1.5 text-xs">
                  Format Kop Surat Dokumen (Sinkron ke Pengesahan, Cetak & Word)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      updateSchoolProfile({ kopType: 'yayasan' });
                      showNotification('success', "Kop Yayasan (Ma'arif NU) dipilih.");
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      schoolProfile.kopType !== 'dinas'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <span className="text-sm">🕌</span>
                      <span>Kop Yayasan (Ma'arif NU)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      Memuat LP Ma'arif NU & daftar Program Keahlian / Jurusan.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      updateSchoolProfile({ kopType: 'dinas' });
                      showNotification('success', 'Kop Dinas (Tanpa Jurusan) dipilih.');
                    }}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      schoolProfile.kopType === 'dinas'
                        ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <span className="text-sm">🏛️</span>
                      <span>Kop Dinas (Tanpa Jurusan)</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                      Format Dinas Provinsi & Dikbud resmi tanpa jurusan.
                    </p>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Mata Pelajaran & Kelas */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-800">
                <BookOpen className="w-4 h-4" />
                Mata Pelajaran & Fase
              </h4>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Mata Pelajaran</label>
                <input
                  type="text"
                  required
                  value={coverData.subject}
                  onChange={(e) => setCoverData({ ...coverData, subject: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                  placeholder="Bahasa Indonesia"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Fase / Kelas</label>
                <input
                  type="text"
                  value={coverData.gradeText}
                  onChange={(e) => setCoverData({ ...coverData, gradeText: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                  placeholder="E / X SMK"
                />
              </div>
            </div>

            {/* 4. Tahun Ajaran & Semester */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-800">
                <Calendar className="w-4 h-4" />
                Tahun Ajaran & Semester
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Tahun Ajaran</label>
                  <input
                    type="text"
                    value={coverData.academicYear}
                    onChange={(e) => setCoverData({ ...coverData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                    placeholder="2026/2027"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Semester</label>
                  <input
                    type="text"
                    value={coverData.semesterText}
                    onChange={(e) => setCoverData({ ...coverData, semesterText: e.target.value })}
                    className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-semibold"
                    placeholder="Semester 1"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Slogan Inspiratif Bawah</label>
                <input
                  type="text"
                  value={coverData.bottomMotto}
                  onChange={(e) => setCoverData({ ...coverData, bottomMotto: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs italic"
                  placeholder="Bersinergi dalam Pendidikan, Menuju Generasi Unggul dan Berkarakter"
                />
              </div>
            </div>

            {/* 5. Judul Buku & Kurikulum */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-800">
                <Layers className="w-4 h-4" />
                Kurikulum & Label 3 Pilar Buku
              </h4>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Judul Sampul Utama</label>
                <input
                  type="text"
                  value={coverData.titleMain}
                  onChange={(e) => setCoverData({ ...coverData, titleMain: e.target.value })}
                  className="w-full px-3 py-2 bg-white border rounded-xl border-slate-300 focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                  placeholder="PERANGKAT PEMBELAJARAN"
                />
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Pilar 1</label>
                  <input
                    type="text"
                    value={coverData.book1Title}
                    onChange={(e) => setCoverData({ ...coverData, book1Title: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border rounded-lg border-slate-300 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Pilar 2</label>
                  <input
                    type="text"
                    value={coverData.book2Title}
                    onChange={(e) => setCoverData({ ...coverData, book2Title: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border rounded-lg border-slate-300 text-[11px]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-0.5">Pilar 3</label>
                  <input
                    type="text"
                    value={coverData.book3Title}
                    onChange={(e) => setCoverData({ ...coverData, book3Title: e.target.value })}
                    className="w-full px-2 py-1.5 bg-white border rounded-lg border-slate-300 text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* 6. Logo Sampul & Kop Sekolah (Kiri & Kanan) */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-800">
                <ImageIcon className="w-4 h-4" />
                Logo Kop Sekolah (Kiri & Kanan) & Sampul
              </h4>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Logo Kiri & Sampul */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-700">Logo Kiri Kop / Sampul</span>
                  <div className="w-20 h-20 rounded-xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
                    {coverData.leftLogoUrl || coverData.logoUrl ? (
                      <img
                        src={coverData.leftLogoUrl || coverData.logoUrl}
                        alt="Logo Kiri"
                        className="w-full h-full object-contain p-0.5"
                      />
                    ) : (
                      <span className="text-2xl">🏫</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => leftLogoInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-[11px] cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Kiri</span>
                  </button>
                  {(coverData.leftLogoUrl || coverData.logoUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        handleResetLeftLogo();
                        handleResetLogo();
                      }}
                      className="text-slate-400 hover:text-rose-600 text-[10px] underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                {/* Logo Kanan Kop */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-700">Logo Kanan Kop</span>
                  <div className="w-20 h-20 rounded-xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50">
                    {coverData.rightLogoUrl ? (
                      <img
                        src={coverData.rightLogoUrl}
                        alt="Logo Kanan"
                        className="w-full h-full object-contain p-0.5"
                      />
                    ) : (
                      <span className="text-2xl">🎓</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => rightLogoInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-1 px-2 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-[11px] cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Kanan</span>
                  </button>
                  {coverData.rightLogoUrl && (
                    <button
                      type="button"
                      onClick={handleResetRightLogo}
                      className="text-slate-400 hover:text-rose-600 text-[10px] underline cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 7. Upload Tanda Tangan Kepala Sekolah & Guru Mata Pelajaran */}
            <div className="md:col-span-2 lg:col-span-3 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  Upload Tanda Tangan Resmi (Kepala Sekolah & Guru Mata Pelajaran)
                </h4>
                <span className="text-[11px] text-slate-500">
                  Format PNG Transparan / JPG / SVG • Otomatis tampil pada Lembar Pengesahan, Daftar Isi & Cetak Dokumen
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tanda Tangan Kepala Sekolah */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-2xs">
                  <div className="space-y-1 flex-1">
                    <span className="text-xs font-bold text-slate-800 block">
                      1. Tanda Tangan Kepala Sekolah
                    </span>
                    <p className="text-[11px] text-slate-600 font-semibold">
                      {coverData.headmasterName || schoolProfile.headmasterName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {coverData.headmasterIdType || schoolProfile.headmasterIdType || 'NIP'}. {coverData.headmasterNip || schoolProfile.headmasterNip}
                    </p>
                    <div className="pt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => headmasterSignInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-2xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload TTD Kepala Sekolah</span>
                      </button>
                      {coverData.headmasterSignatureUrl && (
                        <button
                          type="button"
                          onClick={handleResetHeadmasterSign}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-semibold cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    onClick={() => headmasterSignInputRef.current?.click()}
                    title="Klik untuk upload Tanda Tangan Kepala Sekolah"
                    className="w-32 h-20 rounded-xl border-2 border-dashed border-emerald-300 hover:border-emerald-600 bg-slate-50 flex flex-col items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                  >
                    {coverData.headmasterSignatureUrl ? (
                      <img
                        src={coverData.headmasterSignatureUrl}
                        alt="TTD Kepala Sekolah"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center px-2">
                        Belum ada TTD Kepala Sekolah
                      </span>
                    )}
                  </div>
                </div>

                {/* Tanda Tangan Guru Mata Pelajaran */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-4 shadow-2xs">
                  <div className="space-y-1 flex-1">
                    <span className="text-xs font-bold text-slate-800 block">
                      2. Tanda Tangan Guru Mata Pelajaran
                    </span>
                    <p className="text-[11px] text-slate-600 font-semibold">
                      {coverData.teacherName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {coverData.teacherIdType || 'NIP'}. {coverData.teacherNip}
                    </p>
                    <div className="pt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => teacherSignInputRef.current?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white font-semibold rounded-lg text-xs cursor-pointer shadow-2xs transition-colors"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload TTD Guru</span>
                      </button>
                      {coverData.teacherSignatureUrl && (
                        <button
                          type="button"
                          onClick={handleResetTeacherSign}
                          className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-semibold cursor-pointer"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </div>
                  <div
                    onClick={() => teacherSignInputRef.current?.click()}
                    title="Klik untuk upload Tanda Tangan Guru"
                    className="w-32 h-20 rounded-xl border-2 border-dashed border-teal-300 hover:border-teal-600 bg-slate-50 flex flex-col items-center justify-center overflow-hidden shrink-0 cursor-pointer"
                  >
                    {coverData.teacherSignatureUrl ? (
                      <img
                        src={coverData.teacherSignatureUrl}
                        alt="TTD Guru"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 text-center px-2">
                        Belum ada TTD Guru
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      )}

      {/* =========================================================
          TAB 1: SAMPUL RESMI KURIKULUM MERDEKA (A4) DENGAN BG FOTO / AI
          ========================================================= */}
      {(activeTab === 'kedinasan' || activeTab === 'semua') && (
        <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border-4 border-double border-slate-900 shadow-xl min-h-[820px] flex flex-col justify-between text-center relative overflow-hidden">
          {/* Background Image Layer (Uploaded Photo or AI Modern Vector Cover) */}
          {coverData.backgroundUrl && (
            <>
              <img
                src={coverData.backgroundUrl}
                alt="Latar Belakang Sampul"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none z-0"
              />
              <div
                className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-200"
                style={{
                  backgroundColor: `rgba(255, 255, 255, ${Math.min(
                    0.9,
                    Math.max(0, (coverData.bgOverlayOpacity ?? 20) / 100)
                  )})`,
                }}
              />
            </>
          )}

          {/* Top Border Accent */}
          <div className="relative z-10 h-2 w-full bg-gradient-to-r from-emerald-800 via-amber-400 to-emerald-700" />

          {/* Main Content Wrapper */}
          <div className="relative z-10 flex-1 flex flex-col justify-between p-7 sm:p-11">
            {/* School Header Card */}
            <div className="bg-white/92 backdrop-blur-md px-5 py-4 rounded-2xl border border-emerald-600/30 shadow-sm space-y-1">
              <p className="text-[10px] sm:text-[11px] font-bold tracking-widest text-slate-600 uppercase">
                KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH
              </p>
              <p className="text-xs font-black tracking-wider text-emerald-800 uppercase">
                {coverData.curriculumSubtitle} • {coverData.learningApproach}
              </p>
              <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-emerald-700 to-transparent mx-auto my-1.5" />
              <h1 className="text-lg sm:text-2xl font-black text-slate-950 tracking-tight uppercase leading-snug">
                {coverData.titleMain || 'PERANGKAT ADMINISTRASI PEMBELAJARAN GURU'}
              </h1>
              <div className="inline-flex flex-col items-center px-5 py-1.5 rounded-2xl bg-emerald-900 text-amber-300 shadow-2xs mt-1">
                <span className="text-xs font-extrabold tracking-wide">
                  TAHUN AJARAN {coverData.academicYear}
                </span>
                <span className="text-[11px] font-bold text-emerald-100 tracking-wider mt-0.5">
                  {coverData.semesterText}
                </span>
              </div>
            </div>

            {/* School Emblem / Logo Container */}
            <div className="my-5 flex flex-col items-center justify-center">
              <div
                onClick={() => fileInputRef.current?.click()}
                title="Klik untuk mengganti logo sekolah"
                className="group relative cursor-pointer"
              >
                {coverData.logoUrl ? (
                  <img
                    src={coverData.logoUrl}
                    alt="Logo Sekolah"
                    className="w-32 h-32 sm:w-36 sm:h-36 object-contain rounded-2xl p-1.5 border-2 border-emerald-600/50 shadow-md bg-white/95 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-white/95 border-2 border-dashed border-emerald-600/60 flex flex-col items-center justify-center shadow-md group-hover:border-emerald-700 transition-all">
                    <span className="text-5xl mb-1">🏫</span>
                    <span className="text-[10px] font-black text-emerald-900 uppercase tracking-tighter px-2 line-clamp-1">
                      {coverData.schoolName.split(' ').slice(0, 3).join(' ')}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <span className="text-[11px] font-bold font-mono text-slate-800 bg-white/90 px-3 py-0.5 rounded-full border border-slate-300 shadow-2xs">
                  NPSN: {coverData.npsn || schoolProfile.npsn}
                </span>
                <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
                  Terakreditasi: {coverData.akreditasi || schoolProfile.akreditasi || 'A'}
                </span>
              </div>
            </div>

            {/* Subject & Class Details Card */}
            <div className="bg-white/94 backdrop-blur-md p-5 rounded-2xl border-2 border-emerald-700/30 space-y-2 text-xs font-medium text-slate-800 max-w-md mx-auto w-full text-left shadow-md">
              <div className="flex justify-between py-1.5 border-b border-slate-200/90">
                <span className="text-slate-500 font-semibold">Mata Pelajaran</span>
                <span className="font-black text-slate-950 text-right">{coverData.subject}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/90">
                <span className="text-slate-500 font-semibold">Fase / Kelas</span>
                <span className="font-bold text-slate-900">{coverData.gradeText}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200/90">
                <span className="text-slate-500 font-semibold">Beban Alokasi</span>
                <span className="font-bold text-slate-900">132 JP (39 Pekan Efektif)</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-semibold">Pilar Kurikulum</span>
                <span className="font-bold text-emerald-800 text-right">
                  {coverData.book1Title} • {coverData.book2Title} • {coverData.book3Title}
                </span>
              </div>
            </div>

            {/* Teacher & Headmaster Info Grid */}
            <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto w-full">
              {/* Teacher Info */}
              <div className="bg-white/92 backdrop-blur-md py-3 px-4 rounded-2xl border border-slate-300/90 shadow-sm space-y-0.5 text-center">
                <p className="text-[10px] text-slate-500 italic font-medium">Disusun Oleh:</p>
                <p className="text-sm font-black text-slate-950 underline decoration-emerald-700 decoration-2 underline-offset-2 tracking-tight">
                  {coverData.teacherName}
                </p>
                <p className="text-[11px] font-mono font-bold text-slate-800 pt-0.5">
                  {coverData.teacherIdType || 'NIP'}. {coverData.teacherNip}
                </p>
              </div>

              {/* Headmaster Info */}
              <div className="bg-white/92 backdrop-blur-md py-3 px-4 rounded-2xl border border-slate-300/90 shadow-sm space-y-0.5 text-center">
                <p className="text-[10px] text-slate-500 italic font-medium">Mengetahui / Disahkan:</p>
                <p className="text-sm font-black text-slate-950 underline decoration-emerald-700 decoration-2 underline-offset-2 tracking-tight">
                  {coverData.headmasterName || schoolProfile.headmasterName}
                </p>
                <p className="text-[11px] font-mono font-bold text-slate-800 pt-0.5">
                  {coverData.headmasterIdType || schoolProfile.headmasterIdType || 'NIP'}. {coverData.headmasterNip || schoolProfile.headmasterNip}
                </p>
              </div>
            </div>

            {/* Bottom School Identity & Motto */}
            <div className="bg-emerald-950/95 text-white p-4 rounded-2xl border border-amber-400/50 shadow-md space-y-1.5">
              <p className="font-black text-sm sm:text-base text-amber-300 uppercase tracking-wide">
                {coverData.schoolName}
              </p>
              {coverData.programKeahlian && (
                <div className="text-[11px] text-emerald-100 font-medium border-y border-emerald-800/80 py-1 my-1">
                  <span className="text-amber-200/90 font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                    Program Keahlian:
                  </span>
                  <p className="whitespace-pre-line text-[11px] leading-tight text-emerald-100">
                    {coverData.programKeahlian}
                  </p>
                </div>
              )}
              <p className="text-[11px] text-emerald-100 font-medium italic">
                "{coverData.schoolMotto}"
              </p>
              <div className="text-emerald-200/90 text-[10px] pt-0.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
                <span>📍 {coverData.address || schoolProfile.address}</span>
                {(coverData.phone || schoolProfile.phone) && (
                  <span>📞 Telp: {coverData.phone || schoolProfile.phone}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: LEMBAR PENGESAHAN RESMI (LEGALITAS KEPALA SEKOLAH & GURU)
          ========================================================= */}
      {(activeTab === 'pengesahan' || activeTab === 'semua') && (
        <div className="w-full max-w-2xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border-4 border-double border-slate-900 shadow-xl min-h-[820px] flex flex-col justify-between text-left relative overflow-hidden">
          {/* Top Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-700 via-emerald-600 to-teal-800" />

          {/* Kop Surat Resmi (Yayasan / Dinas Tanpa Jurusan) */}
          <KopSurat
            schoolProfile={{
              ...schoolProfile,
              schoolName: coverData.schoolName || schoolProfile.schoolName,
              npsn: coverData.npsn || schoolProfile.npsn,
              programKeahlian: coverData.programKeahlian || schoolProfile.programKeahlian,
              akreditasi: coverData.akreditasi || schoolProfile.akreditasi,
              phone: coverData.phone || schoolProfile.phone,
              address: coverData.address || schoolProfile.address,
            }}
            onLeftLogoClick={() => leftLogoInputRef.current?.click()}
            onRightLogoClick={() => rightLogoInputRef.current?.click()}
            leftLogoUrl={coverData.leftLogoUrl || coverData.logoUrl}
            rightLogoUrl={coverData.rightLogoUrl}
            isEditable={true}
          />

          {/* Heading Lembar Pengesahan */}
          <div className="text-center space-y-1 pb-3 border-b-2 border-slate-800">
            <h3 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
              LEMBAR PENGESAHAN DOKUMEN PERANGKAT PEMBELAJARAN
            </h3>
            <p className="text-xs sm:text-sm font-extrabold text-emerald-800 uppercase tracking-wide">
              KURIKULUM MERDEKA TAHUN AJARAN {coverData.academicYear}
            </p>
            <p className="text-xs font-mono text-slate-700 font-bold pt-0.5">
              Nomor: {legalData.nomorDokumen}
            </p>
          </div>

          {/* Legalization Content & Identity Box */}
          <div className="space-y-4 text-xs text-slate-800 leading-relaxed text-justify py-3 font-sans">
            <p className="indent-8 text-slate-700 leading-relaxed">
              Setelah melalui proses telaah, verifikasi, dan validasi kurikulum oleh Tim Pengembang Kurikulum Satuan
              Pendidikan, Dokumen Perangkat Pembelajaran Kurikulum Merdeka yang memuat Capaian Pembelajaran (CP),
              Alur Tujuan Pembelajaran (ATP), Rincian Pekan Efektif (RPE), Program Tahunan (PROTA), Program Semester
              (PROMES), Modul Ajar Terpadu, Lembar Kerja Peserta Didik (LKPD), serta Instrumen Penilaian & Kriteria
              Ketercapaian Tujuan Pembelajaran (KKTP) untuk:
            </p>

            {/* Boxed Details matching reference screenshot */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/95 border border-slate-200/90 text-xs space-y-2 font-sans text-left shadow-2xs">
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-5 sm:col-span-4 font-bold text-slate-600">Satuan Pendidikan</span>
                <span className="col-span-7 sm:col-span-8 font-black text-slate-950 uppercase">
                  : {coverData.schoolName}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-5 sm:col-span-4 font-bold text-slate-600">Mata Pelajaran</span>
                <span className="col-span-7 sm:col-span-8 font-extrabold text-slate-900">
                  : {coverData.subject}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-5 sm:col-span-4 font-bold text-slate-600">Fase / Kelas</span>
                <span className="col-span-7 sm:col-span-8 font-medium text-slate-800">
                  : Fase {schoolProfile.fase} (Kelas 10 SMA/SMK) / Kelas {coverData.gradeText}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-5 sm:col-span-4 font-bold text-slate-600">Tahun Ajaran / Semester</span>
                <span className="col-span-7 sm:col-span-8 font-medium text-slate-800">
                  : {coverData.academicYear} / Semester 1 & 2 (1 Tahun Penuh)
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-5 sm:col-span-4 font-bold text-slate-600">Guru Penyusun</span>
                <span className="col-span-7 sm:col-span-8 font-extrabold text-slate-950">
                  : {coverData.teacherName}
                </span>
              </div>
              <div className="grid grid-cols-12 gap-2 items-baseline">
                <span className="col-span-5 sm:col-span-4 font-bold text-slate-600">
                  {coverData.teacherIdType || 'NIP'} Guru
                </span>
                <span className="col-span-7 sm:col-span-8 font-mono font-semibold text-slate-800">
                  : {coverData.teacherNip}
                </span>
              </div>
            </div>

            <p className="indent-8 text-slate-700 leading-relaxed">
              Disahkan dan ditetapkan untuk diberlakukan sebagai pedoman dan acuan operasional resmi pelaksanaan
              Kegiatan Belajar Mengajar (KBM) serta pelaksanaan evaluasi asesmen pada{' '}
              <span className="font-extrabold text-slate-950 uppercase">{coverData.schoolName}</span> untuk Tahun
              Ajaran {coverData.academicYear}.
            </p>
          </div>

          {/* Signature Grid (Resmi 2 Pihak: Kepala Sekolah & Guru) */}
          <div className="pt-4 space-y-6">
            <div className="text-right text-xs font-semibold text-slate-700">
              {schoolProfile.signaturePlaceDate}
            </div>

            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              {/* Kepala Sekolah */}
              <div className="flex flex-col justify-between min-h-40">
                <div>
                  <p className="text-slate-600 font-medium">Mengetahui,</p>
                  <p className="font-bold text-slate-900">Kepala Sekolah</p>
                </div>
                <div
                  onClick={() => headmasterSignInputRef.current?.click()}
                  title="Klik untuk upload / ganti Tanda Tangan Kepala Sekolah"
                  className="my-1.5 flex items-center justify-center h-20 cursor-pointer group"
                >
                  {coverData.headmasterSignatureUrl || schoolProfile.headmasterSignatureUrl ? (
                    <img
                      src={coverData.headmasterSignatureUrl || schoolProfile.headmasterSignatureUrl}
                      alt="Tanda Tangan Kepala Sekolah"
                      className="max-h-20 max-w-[180px] object-contain mx-auto group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-300 group-hover:text-emerald-600 border border-dashed border-transparent group-hover:border-emerald-300 px-3 py-2 rounded-lg transition-all">
                      + Klik Upload TTD Kepala Sekolah
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-slate-950 underline decoration-slate-900">
                    {coverData.headmasterName || schoolProfile.headmasterName}
                  </p>
                  <p className="text-[11px] font-mono text-slate-700 font-semibold">
                    {coverData.headmasterIdType || schoolProfile.headmasterIdType || 'NIP'}. {coverData.headmasterNip || schoolProfile.headmasterNip}
                  </p>
                </div>
              </div>

              {/* Guru Pengampu */}
              <div className="flex flex-col justify-between min-h-40">
                <div>
                  <p className="text-slate-600 font-medium">Disusun Oleh,</p>
                  <p className="font-bold text-slate-900">Guru Mata Pelajaran</p>
                </div>
                <div
                  onClick={() => teacherSignInputRef.current?.click()}
                  title="Klik untuk upload / ganti Tanda Tangan Guru"
                  className="my-1.5 flex items-center justify-center h-20 cursor-pointer group"
                >
                  {coverData.teacherSignatureUrl || schoolProfile.teacherSignatureUrl ? (
                    <img
                      src={coverData.teacherSignatureUrl || schoolProfile.teacherSignatureUrl}
                      alt="Tanda Tangan Guru"
                      className="max-h-20 max-w-[180px] object-contain mx-auto group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <span className="text-[10px] text-slate-300 group-hover:text-teal-600 border border-dashed border-transparent group-hover:border-teal-300 px-3 py-2 rounded-lg transition-all">
                      + Klik Upload TTD Guru
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-extrabold text-slate-950 underline decoration-slate-900">
                    {coverData.teacherName}
                  </p>
                  <p className="text-[11px] font-mono text-slate-700 font-semibold">
                    {coverData.teacherIdType || 'NIP'}. {coverData.teacherNip}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Security Seal Badge */}
            <div className="pt-4 flex items-center justify-between border-t border-slate-200 text-slate-500 text-[10px]">
              <span>Dokumen Perangkat Pembelajaran Kurikulum Merdeka</span>
              <div className="border border-emerald-700/60 bg-emerald-50/80 rounded-lg px-2.5 py-1 text-[9px] font-bold text-emerald-900 flex items-center gap-1 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>SAH & DIVERIFIKASI SATUAN PENDIDIKAN</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: DAFTAR ISI BUNDEL PERANGKAT PEMBELAJARAN (A4)
          ========================================================= */}
      {(activeTab === 'daftar_isi' || activeTab === 'semua') && (
        <div className="w-full max-w-2xl mx-auto bg-white p-8 sm:p-12 rounded-3xl border-4 border-double border-slate-900 shadow-xl min-h-[820px] flex flex-col justify-between text-left relative overflow-hidden">
          {/* Top Border Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-800 via-teal-600 to-emerald-800" />

          <div className="space-y-4">
            {/* Kop Surat Resmi (Yayasan / Dinas Tanpa Jurusan) */}
            <KopSurat
              schoolProfile={{
                ...schoolProfile,
                schoolName: coverData.schoolName || schoolProfile.schoolName,
                npsn: coverData.npsn || schoolProfile.npsn,
                programKeahlian: coverData.programKeahlian || schoolProfile.programKeahlian,
                akreditasi: coverData.akreditasi || schoolProfile.akreditasi,
                phone: coverData.phone || schoolProfile.phone,
                address: coverData.address || schoolProfile.address,
              }}
              onLeftLogoClick={() => leftLogoInputRef.current?.click()}
              onRightLogoClick={() => rightLogoInputRef.current?.click()}
              leftLogoUrl={coverData.leftLogoUrl || coverData.logoUrl}
              rightLogoUrl={coverData.rightLogoUrl}
              isEditable={true}
            />

            {/* Heading Daftar Isi Bundel */}
            <div className="text-center space-y-1 pb-2 border-b border-slate-300">
              <h3 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
                DAFTAR ISI BUNDEL PERANGKAT PEMBELAJARAN
              </h3>
              <p className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">
                {coverData.curriculumSubtitle} & {coverData.learningApproach} • TAHUN AJARAN {coverData.academicYear}
              </p>
              <p className="text-[11px] text-slate-600 font-sans font-semibold">
                Mata Pelajaran: {coverData.subject} | Fase/Kelas: {coverData.gradeText} | Guru: {coverData.teacherName}
              </p>
            </div>

            {/* Table of Contents (10 Dokumen Utama 1 Tahun) */}
            <div className="overflow-hidden rounded-xl border border-slate-300 font-sans">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-900 text-white text-[11px] uppercase">
                    <th className="py-2.5 px-3 font-bold w-12 text-center">Bag.</th>
                    <th className="py-2.5 px-3 font-bold">Nama Dokumen Perangkat Pembelajaran</th>
                    <th className="py-2.5 px-3 font-bold w-32 hidden sm:table-cell">Keterangan / JP</th>
                    <th className="py-2.5 px-3 font-bold w-24 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {[
                    {
                      romawi: 'I',
                      title: 'Sampul Resmi (Cover) & Lembar Pengesahan',
                      desc: 'Identitas & Legalitas KS',
                      view: 'cover' as const,
                    },
                    {
                      romawi: 'II',
                      title: 'Kalender Pendidikan (Kaldik) Tahun Ajaran 2026/2027',
                      desc: 'Semester 1 & Semester 2',
                      view: 'kaldik' as const,
                    },
                    {
                      romawi: 'III',
                      title: 'Rincian Pekan Efektif (RPE) & Distribusi Jam',
                      desc: '39 Pekan Efektif / 132 JP',
                      view: 'rpe' as const,
                    },
                    {
                      romawi: 'IV',
                      title: 'Analisis Capaian Pembelajaran (CP) & Alur Tujuan (ATP)',
                      desc: '7 Tujuan Pembelajaran',
                      view: 'cp_atp' as const,
                    },
                    {
                      romawi: 'V',
                      title: 'Analisis Taksonomi Bloom & Pemetaan HOTS (C1–C6)',
                      desc: '71% Kategori HOTS',
                      view: 'bloom' as const,
                    },
                    {
                      romawi: 'VI',
                      title: 'Program Tahunan (PROTA) Kurikulum Merdeka',
                      desc: 'Alokasi 132 JP (1 Tahun)',
                      view: 'prota' as const,
                    },
                    {
                      romawi: 'VII',
                      title: 'Program Semester (PROMES) Ganjil & Genap',
                      desc: 'Matriks Sebaran Mingguan',
                      view: 'promes' as const,
                    },
                    {
                      romawi: 'VIII',
                      title: 'Modul Ajar Terpadu & Deep Learning (Mindful, Meaningful, Joyful)',
                      desc: '7 Unit Modul Berdiferensiasi',
                      view: 'modul_ajar' as const,
                    },
                    {
                      romawi: 'IX',
                      title: 'Lembar Kerja Peserta Didik (LKPD) Setiap Pertemuan',
                      desc: '7 Bab + Kunci Jawaban',
                      view: 'lkpd' as const,
                    },
                    {
                      romawi: 'X',
                      title: 'Instrumen Asesmen, Rubrik KKTP, & Rekap Nilai Rapor',
                      desc: 'Formatif, Sumatif & Rapor',
                      view: 'asesmen' as const,
                    },
                  ].map((item, index) => (
                    <tr
                      key={item.romawi}
                      onClick={() => {
                        if (item.view !== 'cover') setActiveView(item.view);
                      }}
                      className={`${
                        index % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'
                      } hover:bg-emerald-50/70 transition-colors cursor-pointer`}
                      title="Klik untuk membuka dokumen terkait"
                    >
                      <td className="py-2 px-3 font-bold text-center text-emerald-900 font-mono">
                        {item.romawi}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-900">{item.title}</td>
                      <td className="py-2 px-3 text-slate-600 hidden sm:table-cell">{item.desc}</td>
                      <td className="py-2 px-3 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Lengkap</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Daftar Isi */}
          <div className="pt-5 space-y-4 font-sans">
            <div className="flex items-center justify-between text-xs text-slate-700 px-2">
              <div>
                <p className="text-[11px] text-slate-500">Status Kelengkapan Berkas 1 Tahun:</p>
                <p className="font-extrabold text-emerald-800">10 dari 10 Dokumen Utama Siap Cetak & Jilid (100%)</p>
              </div>
              <div className="text-right">
                <p className="text-slate-600">{schoolProfile.signaturePlaceDate}</p>
                <p className="font-bold text-slate-900 mt-0.5">Guru Mata Pelajaran,</p>
                <div
                  onClick={() => teacherSignInputRef.current?.click()}
                  title="Klik untuk upload / ganti Tanda Tangan Guru"
                  className="my-1 flex items-center justify-end h-16 cursor-pointer"
                >
                  {(coverData.teacherSignatureUrl || schoolProfile.teacherSignatureUrl) && (
                    <img
                      src={coverData.teacherSignatureUrl || schoolProfile.teacherSignatureUrl}
                      alt="Tanda Tangan Guru"
                      className="max-h-16 max-w-[160px] object-contain"
                    />
                  )}
                </div>
                <p className="font-extrabold text-slate-950 underline decoration-slate-900">
                  {coverData.teacherName}
                </p>
                <p className="text-[11px] font-mono text-slate-700 font-semibold">
                  {coverData.teacherIdType || 'NIP'}. {coverData.teacherNip}
                </p>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between border-t border-slate-200 text-slate-500 text-[10px]">
              <span>Bundel Master Administrasi Guru • {coverData.schoolName}</span>
              <span className="font-bold text-emerald-800">TA {coverData.academicYear}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

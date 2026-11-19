export type JenjangKey = 'PAUD' | 'SD' | 'SMP' | 'SMA_SMK';
export type KurikulumBookType = 'K13' | 'Kurikulum Merdeka' | 'Kurikulum Mendalam' | 'Buku Madrasah';
export type EraTerbitKey = 'Semua Tahun' | 'Terbaru 2026' | '2024 - 2025' | '2021 - 2023' | '2016 - 2020 (Terbitan Lama)';

export interface BabItem {
  kodeBab: string;
  judulBab: string;
  subBab: string[];
  semester: 1 | 2;
  alokasiJp: number;
}

export interface DetectedBookItem {
  id: string;
  judulBuku: string;
  pengarang: string;
  penerbit: string;
  tahunTerbit: number;
  eraTerbit: Exclude<EraTerbitKey, 'Semua Tahun'>;
  tahunTerbitCetakan: string;
  isbn: string;
  mapel: string;
  jenjang: JenjangKey;
  faseCode: string;
  faseLabel: string;
  kelasDefault: string;
  jpDefault: number;
  kepka: string;
  elemenCount: number;
  elemenList: string[];
  desc: string;
  provider: string;
  providerBadge: string;
  katalogUrl: string;
  tahunRevisi: string;
  defaultKurikulumTypes: KurikulumBookType[];
  coverImageUrl: string;
  coverStyle: {
    gradient: string;
    spineColor: string;
    icon: string;
    instansiHeader: string;
    edisiBadge: string;
  };
  babList: BabItem[];
}

export const OFFICIAL_BOOK_PROVIDERS: string[] = [
  'Semua Penyedia',
  'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
  'Buku Madrasah Kemenag RI (KMA 1503/2025 & KMA 183)',
  'PT Penerbit Erlangga',
  'PT Intan Pariwara',
  'PT Tiga Serangkai Pustaka Mandiri',
  'PT Bumi Aksara & Yudhistira',
  'CV Mediatama & Andi Offset (Vokasi SMK)',
  'Penerbit Yrama Widya & Grafindo',
];

export const ERA_TERBIT_OPTIONS: EraTerbitKey[] = [
  'Semua Tahun',
  'Terbaru 2026',
  '2024 - 2025',
  '2021 - 2023',
  '2016 - 2020 (Terbitan Lama)',
];

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapTextLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    if (!current) {
      current = w;
    } else if ((current + ' ' + w).length <= maxCharsPerLine) {
      current += ' ' + w;
    } else {
      lines.push(current);
      current = w;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

/**
 * Generates an authentic, high-resolution Indonesian publisher textbook cover SVG Data URI
 * resembling real printed textbooks from Kemendikdasmen, Kemenag, Erlangga, Intan Pariwara,
 * Tiga Serangkai, Bumi Aksara, Yudhistira, Mediatama, Andi Offset, and Yrama Widya.
 */
export function generateAuthenticPublisherCoverDataUri(params: {
  judulBuku: string;
  mapel: string;
  kelas: string;
  pengarang: string;
  penerbit: string;
  tahunTerbit: number;
  edisiBadge: string;
  isbn: string;
  variantIndex: number;
}): string {
  const { judulBuku, mapel, kelas, pengarang, penerbit, tahunTerbit, edisiBadge, isbn, variantIndex } = params;
  const m = mapel.toLowerCase();
  const p = penerbit.toLowerCase();

  // Determine publisher visual identity
  const isKemenag = p.includes('kemenag') || p.includes('madrasah') || p.includes('ma’arif');
  const isErlangga = p.includes('erlangga');
  const isIntan = p.includes('intan pariwara');
  const isTigaSerangkai = p.includes('tiga serangkai');
  const isMediatamaAndi = p.includes('mediatama') || p.includes('andi');
  const isBumiYudhistira = p.includes('bumi aksara') || p.includes('yudhistira');
  const isYramaGrafindo = p.includes('yrama') || p.includes('grafindo');

  // Color palette based on subject & publisher
  let primaryBg = '#0f4c81';
  let secondaryBg = '#1e3a8a';
  let accentColor = '#f59e0b';
  let softPanelBg = '#f8fafc';
  let subjectIllustration = '';

  if (isKemenag || m.includes('qur') || m.includes('akidah') || m.includes('fikih') || m.includes('ski') || m.includes('arab') || m.includes('agama')) {
    primaryBg = '#065f46';
    secondaryBg = '#022c22';
    accentColor = '#fbbf24';
    softPanelBg = '#f0fdf4';
    subjectIllustration = `
      <g opacity="0.92">
        <!-- Islamic Dome & Archway -->
        <path d="M90 295 L90 215 Q160 155 230 215 L230 295 Z" fill="#047857" stroke="#fbbf24" stroke-width="2.5"/>
        <circle cx="160" cy="175" r="24" fill="#fbbf24" opacity="0.25"/>
        <path d="M130 245 Q160 205 190 245 L190 295 L130 295 Z" fill="#064e3b" stroke="#fde68a" stroke-width="1.5"/>
        <!-- Open Al-Qur'an / Kitab on Rehal -->
        <path d="M115 268 L160 256 L205 268 L195 286 L160 276 L125 286 Z" fill="#fef3c7" stroke="#d97706" stroke-width="1.8"/>
        <line x1="160" y1="256" x2="160" y2="278" stroke="#b45309" stroke-width="1.8"/>
        <!-- Geometric Star -->
        <polygon points="160,142 165,154 178,154 168,162 172,174 160,166 148,174 152,162 142,154 155,154" fill="#fbbf24"/>
      </g>
    `;
  } else if (m.includes('indonesia') || judulBuku.toLowerCase().includes('cerdas cergas')) {
    const isCerdasCergas = judulBuku.toLowerCase().includes('cerdas cergas') || !isErlangga;
    primaryBg = isCerdasCergas ? '#b91c1c' : '#9f1239';
    secondaryBg = isCerdasCergas ? '#7f1d1d' : '#4c0519';
    accentColor = '#fbbf24';
    softPanelBg = '#fffbeb';
    subjectIllustration = `
      <g opacity="0.98">
        <!-- Warm Cream Literary Canvas like Official Kemendikdasmen "Cerdas Cergas" Cover -->
        <rect x="34" y="174" width="252" height="120" rx="10" fill="#fef3c7" stroke="#f59e0b" stroke-width="2"/>
        <!-- Traditional Nusantara Cloud & Batik Accent -->
        <circle cx="82" cy="212" r="24" fill="#fde68a"/>
        <circle cx="238" cy="208" r="20" fill="#fed7aa"/>
        <!-- Illustrated Indonesian Students Reading & Discussing Literature -->
        <circle cx="122" cy="214" r="13" fill="#78350f"/>
        <path d="M102 258 Q122 230 142 258 Z" fill="#dc2626"/>
        <circle cx="196" cy="214" r="13" fill="#1e293b"/>
        <path d="M176 258 Q196 230 216 258 Z" fill="#0284c7"/>
        <!-- Open Book & Quill in Center -->
        <path d="M126 248 L160 238 L194 248 L188 268 L160 258 L132 268 Z" fill="#ffffff" stroke="#b91c1c" stroke-width="2"/>
        <line x1="160" y1="238" x2="160" y2="260" stroke="#b91c1c" stroke-width="2"/>
        <!-- Banner Ribbon inside Artwork -->
        <rect x="52" y="268" width="216" height="20" rx="5" fill="#991b1b"/>
        <text x="160" y="282" text-anchor="middle" font-family="Georgia, serif" font-size="9.5" font-weight="bold" fill="#fef08a">CERDAS CERGAS BERBAHASA &amp; BERSASTRA</text>
      </g>
    `;
  } else if (m.includes('matematika')) {
    primaryBg = variantIndex % 2 === 0 ? '#1d4ed8' : '#0369a1';
    secondaryBg = '#0f172a';
    accentColor = '#38bdf8';
    softPanelBg = '#eff6ff';
    subjectIllustration = `
      <g opacity="0.95">
        <!-- Coordinate Grid, Parabola & 3D Prism -->
        <rect x="88" y="170" width="144" height="112" rx="10" fill="#0f172a" opacity="0.55" stroke="#60a5fa" stroke-width="1.5"/>
        <path d="M98 258 Q160 165 222 258" fill="none" stroke="#38bdf8" stroke-width="3.5"/>
        <polygon points="160,182 202,252 118,252" fill="#3b82f6" fill-opacity="0.35" stroke="#fde047" stroke-width="2.2"/>
        <circle cx="160" cy="182" r="4.5" fill="#fde047"/>
        <circle cx="118" cy="252" r="4.5" fill="#fde047"/>
        <circle cx="202" cy="252" r="4.5" fill="#fde047"/>
        <text x="160" y="274" text-anchor="middle" font-family="monospace" font-size="12" font-weight="bold" fill="#e0f2fe">f(x) = ax² + bx + c • ∑ π</text>
      </g>
    `;
  } else if (m.includes('informatika') || m.includes('jaringan') || m.includes('tkj') || m.includes('tjkt') || m.includes('komputer')) {
    primaryBg = '#0284c7';
    secondaryBg = '#082f49';
    accentColor = '#22d3ee';
    softPanelBg = '#f0f9ff';
    subjectIllustration = `
      <g opacity="0.95">
        <!-- Laptop, Code Terminal & AI Network Nodes -->
        <rect x="96" y="178" width="128" height="80" rx="8" fill="#0f172a" stroke="#38bdf8" stroke-width="2.5"/>
        <rect x="104" y="186" width="112" height="62" rx="4" fill="#020617"/>
        <text x="112" y="206" font-family="monospace" font-size="10" fill="#22d3ee">&lt;AI_DeepLearning/&gt;</text>
        <text x="112" y="222" font-family="monospace" font-size="9.5" fill="#4ade80">01101001 11010110</text>
        <text x="112" y="238" font-family="monospace" font-size="9.5" fill="#fbbf24">TCP/IP • 5G • Cloud</text>
        <path d="M80 260 L240 260 L226 274 L94 274 Z" fill="#94a3b8" stroke="#e2e8f0" stroke-width="1.5"/>
        <circle cx="92" cy="172" r="6" fill="#fde047"/>
        <circle cx="228" cy="172" r="6" fill="#22d3ee"/>
        <line x1="92" y1="172" x2="120" y2="186" stroke="#fde047" stroke-width="1.5"/>
        <line x1="228" y1="172" x2="200" y2="186" stroke="#22d3ee" stroke-width="1.5"/>
      </g>
    `;
  } else if (m.includes('perkantoran') || m.includes('mplb') || m.includes('ekonomi') || m.includes('akuntansi') || m.includes('kewirausahaan')) {
    primaryBg = '#0d9488';
    secondaryBg = '#115e59';
    accentColor = '#fbbf24';
    softPanelBg = '#f0fdfa';
    subjectIllustration = `
      <g opacity="0.95">
        <!-- Modern Office Building, Analytics Chart & Briefcase -->
        <rect x="92" y="180" width="52" height="98" rx="4" fill="#ccfbf1" opacity="0.9" stroke="#0f766e" stroke-width="2"/>
        <rect x="148" y="164" width="76" height="114" rx="5" fill="#ffffff" stroke="#0f766e" stroke-width="2"/>
        <!-- Bar Charts -->
        <rect x="160" y="236" width="12" height="30" rx="2" fill="#14b8a6"/>
        <rect x="178" y="218" width="12" height="48" rx="2" fill="#0d9488"/>
        <rect x="196" y="196" width="12" height="70" rx="2" fill="#f59e0b"/>
        <polyline points="162,228 182,208 202,186" fill="none" stroke="#be123c" stroke-width="2.5"/>
        <circle cx="202" cy="186" r="4" fill="#be123c"/>
      </g>
    `;
  } else if (m.includes('inggris')) {
    primaryBg = '#6d28d9';
    secondaryBg = '#2e1065';
    accentColor = '#f472b6';
    softPanelBg = '#f5f3ff';
    subjectIllustration = `
      <g opacity="0.95">
        <!-- Globe, Speech Bubbles & English Landmark -->
        <circle cx="160" cy="228" r="48" fill="#ddd6fe" opacity="0.28" stroke="#c4b5fd" stroke-width="2"/>
        <ellipse cx="160" cy="228" rx="24" ry="48" fill="none" stroke="#c4b5fd" stroke-width="1.5"/>
        <line x1="112" y1="228" x2="208" y2="228" stroke="#c4b5fd" stroke-width="1.5"/>
        <rect x="92" y="176" width="68" height="32" rx="8" fill="#ffffff" stroke="#7c3aed" stroke-width="2"/>
        <text x="126" y="196" text-anchor="middle" font-family="sans-serif" font-size="11" font-weight="bold" fill="#5b21b6">Hello World!</text>
        <rect x="158" y="238" width="72" height="32" rx="8" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
        <text x="194" y="258" text-anchor="middle" font-family="sans-serif" font-size="10.5" font-weight="bold" fill="#713f12">English Class</text>
      </g>
    `;
  } else {
    primaryBg = '#047857';
    secondaryBg = '#064e3b';
    accentColor = '#34d399';
    softPanelBg = '#ecfdf5';
    subjectIllustration = `
      <g opacity="0.95">
        <!-- Science / General Education Flask, Atom & Microscope -->
        <circle cx="160" cy="225" r="50" fill="none" stroke="#6ee7b7" stroke-width="1.8" stroke-dasharray="5,3"/>
        <ellipse cx="160" cy="225" rx="52" ry="20" transform="rotate(30 160 225)" fill="none" stroke="#fde047" stroke-width="2"/>
        <ellipse cx="160" cy="225" rx="52" ry="20" transform="rotate(-30 160 225)" fill="none" stroke="#38bdf8" stroke-width="2"/>
        <path d="M148 195 L172 195 L172 212 L192 256 Q195 266 184 266 L136 266 Q125 266 128 256 L148 212 Z" fill="#ffffff" fill-opacity="0.9" stroke="#059669" stroke-width="2"/>
        <path d="M134 244 L186 244 L190 262 L130 262 Z" fill="#34d399"/>
      </g>
    `;
  }

  // Publisher top header emblem & label
  let publisherTopName = 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH RI';
  let publisherSubName = 'PUSAT PERBUKUAN BSKAP • SIBI RESMI';
  let publisherHeaderBg = '#ffffff';
  let publisherHeaderTextColor = '#0f172a';
  let publisherLogoColor = '#0284c7';

  if (isKemenag) {
    publisherTopName = 'KEMENTERIAN AGAMA REPUBLIK INDONESIA';
    publisherSubName = 'DIREKTORAT KSKK MADRASAH • LP MA’ARIF NU';
    publisherLogoColor = '#059669';
  } else if (isErlangga) {
    publisherTopName = 'PENERBIT ERLANGGA • ANGGOTA IKAPI';
    publisherSubName = 'BUKU TEKS PENDAMPING KURIKULUM NASIONAL';
    publisherHeaderBg = '#eff6ff';
    publisherHeaderTextColor = '#1e3a8a';
    publisherLogoColor = '#1d4ed8';
  } else if (isIntan) {
    publisherTopName = 'PT INTAN PARIWARA • BUKU INTERAKTIF';
    publisherSubName = 'TERINTEGRASI DIGITAL & ASESMEN KOMPETENSI';
    publisherHeaderBg = '#f0fdf4';
    publisherHeaderTextColor = '#14532d';
    publisherLogoColor = '#16a34a';
  } else if (isTigaSerangkai) {
    publisherTopName = 'PT TIGA SERANGKAI PUSTAKA MANDIRI';
    publisherSubName = 'SERI PLATINUM PENDIDIKAN NASIONAL';
    publisherHeaderBg = '#fffbeb';
    publisherHeaderTextColor = '#78350f';
    publisherLogoColor = '#d97706';
  } else if (isMediatamaAndi) {
    publisherTopName = 'CV MEDIATAMA & PENERBIT ANDI OFFSET';
    publisherSubName = 'SERI VOKASI SMK PUSAT KEUNGGULAN (DUDIKA)';
    publisherHeaderBg = '#f0f9ff';
    publisherHeaderTextColor = '#0c4a6e';
    publisherLogoColor = '#0284c7';
  } else if (isBumiYudhistira) {
    publisherTopName = 'PT BUMI AKSARA & YUDHISTIRA GHALIA';
    publisherSubName = 'BUKU TEKS LOLOS PENILAIAN PUSBUK';
    publisherHeaderBg = '#fef2f2';
    publisherHeaderTextColor = '#7f1d1d';
    publisherLogoColor = '#dc2626';
  } else if (isYramaGrafindo) {
    publisherTopName = 'PENERBIT YRAMA WIDYA & GRAFINDO';
    publisherSubName = 'BUKU TEKS UTAMA & PENGAYAAN NASIONAL';
    publisherHeaderBg = '#f5f3ff';
    publisherHeaderTextColor = '#4c1d95';
    publisherLogoColor = '#7c3aed';
  }

  // If the book title contains "Cerdas Cergas" or "Cakap Berbahasa", highlight "CERDAS CERGAS" right on the cover header!
  const jLower = judulBuku.toLowerCase();
  const displayMainTitle = jLower.includes('cerdas cergas')
    ? 'CERDAS CERGAS'
    : jLower.includes('cakap berbahasa')
    ? 'CAKAP BERBAHASA'
    : jLower.includes('cerdas berbahasa')
    ? 'CERDAS BERBAHASA'
    : mapel.toUpperCase();

  const titleLines = jLower.includes('cerdas cergas')
    ? ['CERDAS CERGAS', 'BERBAHASA & BERSASTRA INDONESIA']
    : jLower.includes('cakap berbahasa')
    ? ['CAKAP BERBAHASA', '& BERSASTRA INDONESIA']
    : jLower.includes('cerdas berbahasa')
    ? ['CERDAS BERBAHASA', '& BERSASTRA INDONESIA']
    : wrapTextLines(displayMainTitle, 20, 2);

  const subtitleLines = wrapTextLines(judulBuku, 36, 2);
  const authorShort = pengarang.length > 38 ? pengarang.slice(0, 36) + '...' : pengarang;
  const kelasBadge = kelas.replace('Kelas ', 'KLS ').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 450" width="320" height="450">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryBg}"/>
        <stop offset="60%" stop-color="${secondaryBg}"/>
        <stop offset="100%" stop-color="#090d16"/>
      </linearGradient>
      <linearGradient id="spineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#000000" stop-opacity="0.55"/>
        <stop offset="65%" stop-color="#ffffff" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="#000000" stop-opacity="0.25"/>
      </linearGradient>
    </defs>

    <!-- Main Book Cover Background -->
    <rect width="320" height="450" rx="12" fill="url(#bgGrad)"/>

    <!-- Decorative Modern Geometric Cover Waves -->
    <circle cx="290" cy="140" r="110" fill="${accentColor}" opacity="0.12"/>
    <circle cx="40" cy="340" r="130" fill="#ffffff" opacity="0.06"/>
    <path d="M0 320 Q160 285 320 335 L320 450 L0 450 Z" fill="${softPanelBg}"/>

    <!-- Top Official Publisher Header Bar -->
    <rect x="0" y="0" width="320" height="54" fill="${publisherHeaderBg}"/>
    <rect x="0" y="51" width="320" height="4" fill="${accentColor}"/>

    <!-- Official Publisher / Ministry Emblem Icon -->
    <circle cx="34" cy="26" r="16" fill="${publisherLogoColor}"/>
    <polygon points="34,14 38,22 46,22 40,27 42,35 34,30 26,35 28,27 22,22 30,22" fill="#fde047"/>
    <text x="58" y="23" font-family="Arial, sans-serif" font-size="8.5" font-weight="900" fill="${publisherHeaderTextColor}" letter-spacing="0.4">${escapeXml(publisherTopName)}</text>
    <text x="58" y="36" font-family="Arial, sans-serif" font-size="7.5" font-weight="700" fill="#475569">${escapeXml(publisherSubName)}</text>

    <!-- Top-Right Edition & Year Ribbon -->
    <rect x="198" y="64" width="110" height="22" rx="11" fill="${accentColor}"/>
    <text x="253" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="8.5" font-weight="900" fill="#0f172a">${escapeXml(edisiBadge.toUpperCase())}</text>

    <!-- Top-Left Curriculum Pill -->
    <rect x="18" y="64" width="112" height="22" rx="6" fill="#ffffff" fill-opacity="0.18" stroke="#ffffff" stroke-opacity="0.4"/>
    <text x="74" y="78" text-anchor="middle" font-family="Arial, sans-serif" font-size="8.5" font-weight="800" fill="#ffffff">TERBITAN ${tahunTerbit}</text>

    <!-- Main Subject Title on Cover -->
    <text x="22" y="114" font-family="Arial, sans-serif" font-size="19" font-weight="900" fill="#ffffff" letter-spacing="0.3">${escapeXml(titleLines[0] || mapel.toUpperCase())}</text>
    ${
      titleLines[1]
        ? `<text x="22" y="135" font-family="Arial, sans-serif" font-size="13.5" font-weight="900" fill="#fde047">${escapeXml(titleLines[1])}</text>`
        : ''
    }

    <!-- Subtitle / Book Series Name -->
    <text x="22" y="${titleLines[1] ? 152 : 136}" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="#e2e8f0">${escapeXml(subtitleLines[0] || '')}</text>
    ${
      subtitleLines[1]
        ? `<text x="22" y="${titleLines[1] ? 164 : 148}" font-family="Arial, sans-serif" font-size="8" font-weight="600" fill="#cbd5e1">${escapeXml(subtitleLines[1])}</text>`
        : ''
    }

    <!-- Center Framed Subject Artwork / Illustration -->
    <rect x="24" y="168" width="272" height="132" rx="14" fill="#ffffff" fill-opacity="0.1" stroke="#ffffff" stroke-opacity="0.28" stroke-width="1.5"/>
    ${subjectIllustration}

    <!-- Grade / Class Shield Badge on Cover -->
    <circle cx="264" cy="316" r="28" fill="${primaryBg}" stroke="#ffffff" stroke-width="3.5"/>
    <text x="264" y="312" text-anchor="middle" font-family="Arial, sans-serif" font-size="7.5" font-weight="800" fill="#fde047">TINGKAT</text>
    <text x="264" y="325" text-anchor="middle" font-family="Arial, sans-serif" font-size="10.5" font-weight="900" fill="#ffffff">${escapeXml(kelasBadge)}</text>

    <!-- Bottom Light Typography Panel (Author, Publisher, ISBN & Barcode) -->
    <text x="22" y="336" font-family="Arial, sans-serif" font-size="8" font-weight="800" fill="#64748b" letter-spacing="0.6">TIM PENULIS / PENGARANG:</text>
    <text x="22" y="350" font-family="Arial, sans-serif" font-size="9.5" font-weight="800" fill="#0f172a">${escapeXml(authorShort)}</text>

    <line x1="22" y1="360" x2="298" y2="360" stroke="#cbd5e1" stroke-width="1"/>

    <text x="22" y="376" font-family="Arial, sans-serif" font-size="8" font-weight="800" fill="#475569">PENERBIT RESMI:</text>
    <text x="22" y="389" font-family="Arial, sans-serif" font-size="9" font-weight="900" fill="${primaryBg}">${escapeXml(penerbit.length > 36 ? penerbit.slice(0, 34) + '...' : penerbit)}</text>

    <!-- Bottom Footer Strip with ISBN & Barcode Graphic -->
    <rect x="0" y="404" width="320" height="46" fill="#0f172a"/>
    <text x="22" y="423" font-family="monospace" font-size="8.5" font-weight="700" fill="#f8fafc">ISBN: ${escapeXml(isbn)}</text>
    <text x="22" y="437" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="#38bdf8">TAHUN TERBIT ${tahunTerbit} • CETAKAN RESMI</text>

    <!-- Simulated Barcode Box -->
    <rect x="234" y="411" width="68" height="30" rx="3" fill="#ffffff"/>
    <g fill="#0f172a">
      <rect x="240" y="415" width="2" height="18"/>
      <rect x="244" y="415" width="4" height="18"/>
      <rect x="250" y="415" width="1.5" height="18"/>
      <rect x="254" y="415" width="3" height="18"/>
      <rect x="260" y="415" width="2" height="18"/>
      <rect x="264" y="415" width="4.5" height="18"/>
      <rect x="271" y="415" width="1.5" height="18"/>
      <rect x="275" y="415" width="3" height="18"/>
      <rect x="280" y="415" width="2" height="18"/>
      <rect x="285" y="415" width="4" height="18"/>
      <rect x="291" y="415" width="2" height="18"/>
      <text x="268" y="439" text-anchor="middle" font-family="monospace" font-size="5.5" font-weight="bold">978602244</text>
    </g>

    <!-- 3D Book Spine Crease Effect on Left -->
    <rect x="0" y="0" width="12" height="450" fill="url(#spineGrad)"/>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

interface PublisherEditionTemplate {
  suffixId: string;
  provider: string;
  providerBadge: string;
  penerbit: string;
  tahunTerbit: number;
  eraTerbit: Exclude<EraTerbitKey, 'Semua Tahun'>;
  tahunTerbitCetakan: string;
  tahunRevisi: string;
  edisiBadge: string;
  isbnPrefix: string;
  titlePrefix: string;
  titleSuffix: string;
  defaultKurikulumTypes: KurikulumBookType[];
  customTitleBuilder?: (mapel: string, kelas: string) => string;
  authorOverride?: (mapel: string, kelas?: string) => string;
}

const PUBLISHER_EDITION_TEMPLATES: PublisherEditionTemplate[] = [
  // 1. SIBI Kemendikdasmen Terbaru 2026 (Deep Learning & BSKAP 046/2025)
  {
    suffixId: 'sibi-2026',
    provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
    providerBadge: 'SIBI Kemendikdasmen RI 2026',
    penerbit: 'Pusat Perbukuan BSKAP Kemendikdasmen RI',
    tahunTerbit: 2026,
    eraTerbit: 'Terbaru 2026',
    tahunTerbitCetakan: 'Tahun Terbit 2026 • Cetakan Ke-1 (Edisi Revisi Terbaru Kurikulum Mendalam & BSKAP 046/2025)',
    tahunRevisi: 'Edisi Terbaru 2026',
    edisiBadge: 'EDISI REVISI 2026',
    isbnPrefix: '978-623-118',
    titlePrefix: 'Buku Teks Utama',
    titleSuffix: 'Edisi Revisi Terbaru 2026 (Pembelajaran Mendalam)',
    defaultKurikulumTypes: ['Kurikulum Merdeka', 'Kurikulum Mendalam'],
    customTitleBuilder: (mapel, kelas) => {
      const m = mapel.toLowerCase();
      if (m.includes('indonesia') && m.includes('lanjut')) {
        return `Bahasa Indonesia Tingkat Lanjut: Cakap Berbahasa dan Bersastra Indonesia untuk SMA/MA ${kelas} (Edisi Revisi Terbaru 2026)`;
      }
      if (m.includes('indonesia')) {
        return `Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA ${kelas} (Edisi Revisi Terbaru 2026)`;
      }
      return `Buku Teks Utama ${mapel} untuk ${kelas} — Edisi Revisi Terbaru 2026 (Pembelajaran Mendalam)`;
    },
    authorOverride: (mapel, kelas = '') => {
      const m = mapel.toLowerCase();
      if (m.includes('indonesia')) {
        if (kelas.includes('11') || kelas.includes('XI')) return 'Heny Marwati, K. Waskitaningtyas';
        if (kelas.includes('12') || kelas.includes('XII')) return 'Bambang Trimansyah';
        return 'Fadillah Tri Aulia, Sefi Indra Gumilar';
      }
      return '';
    },
  },
  // 2. SIBI Kemendikdasmen Edisi Revisi 2023/2024 (Buku Siswa Resmi)
  {
    suffixId: 'sibi-2024',
    provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
    providerBadge: 'SIBI Kemendikdasmen RI',
    penerbit: 'Pusat Perbukuan BSKAP Kemendikdasmen RI',
    tahunTerbit: 2024,
    eraTerbit: '2024 - 2025',
    tahunTerbitCetakan: 'Tahun Terbit 2024 • Cetakan Ke-3 (Edisi Revisi Resmi SIBI Kemendikdasmen)',
    tahunRevisi: 'Edisi Revisi 2023/2024',
    edisiBadge: 'EDISI REVISI',
    isbnPrefix: '978-602-244',
    titlePrefix: 'Buku Siswa & Panduan Guru',
    titleSuffix: 'Kurikulum Merdeka Edisi Revisi (2024)',
    defaultKurikulumTypes: ['Kurikulum Merdeka', 'Kurikulum Mendalam'],
    customTitleBuilder: (mapel, kelas) => {
      const m = mapel.toLowerCase();
      if (m.includes('indonesia') && m.includes('lanjut')) {
        return `Bahasa Indonesia Tingkat Lanjut: Cakap Berbahasa dan Bersastra Indonesia untuk SMA/MA ${kelas} (Edisi Revisi 2024)`;
      }
      if (m.includes('indonesia')) {
        return `Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA ${kelas} (Edisi Revisi 2023/2024)`;
      }
      return `Buku Panduan Guru & Siswa ${mapel} ${kelas} — Kurikulum Merdeka Edisi Revisi (2024)`;
    },
    authorOverride: (mapel, kelas = '') => {
      const m = mapel.toLowerCase();
      if (m.includes('indonesia')) {
        if (kelas.includes('11') || kelas.includes('XI')) return 'Heny Marwati, K. Waskitaningtyas';
        if (kelas.includes('12') || kelas.includes('XII')) return 'Bambang Trimansyah';
        return 'Fadillah Tri Aulia, Sefi Indra Gumilar';
      }
      return '';
    },
  },
  // 2B. SIBI Kemendikbudristek Cetakan Perdana 2021 (Edisi 1 Kurikulum Merdeka)
  {
    suffixId: 'sibi-2021',
    provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
    providerBadge: 'Pusbuk Kemendikbudristek 2021',
    penerbit: 'Pusat Kurikulum dan Perbukuan Balitbang Kemendikbudristek RI',
    tahunTerbit: 2021,
    eraTerbit: '2021 - 2023',
    tahunTerbitCetakan: 'Tahun Terbit 2021 • Cetakan Ke-1 (Edisi Perdana Kurikulum Merdeka)',
    tahunRevisi: 'Cetakan Ke-1 (2021)',
    edisiBadge: 'CETAKAN 1 (2021)',
    isbnPrefix: '978-602-244',
    titlePrefix: 'Buku Teks Utama',
    titleSuffix: 'Kurikulum Merdeka Cetakan Ke-1 (2021)',
    defaultKurikulumTypes: ['Kurikulum Merdeka'],
    customTitleBuilder: (mapel, kelas) => {
      const m = mapel.toLowerCase();
      if (m.includes('indonesia')) {
        return `Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK ${kelas} (Cetakan Ke-1 Tahun 2021)`;
      }
      return `Buku Siswa ${mapel} untuk ${kelas} — Cetakan Ke-1 Tahun 2021`;
    },
    authorOverride: (mapel, kelas = '') => {
      const m = mapel.toLowerCase();
      if (m.includes('indonesia')) {
        if (kelas.includes('11') || kelas.includes('XI')) return 'Heny Marwati, K. Waskitaningtyas';
        if (kelas.includes('12') || kelas.includes('XII')) return 'Bambang Trimansyah';
        return 'Fadillah Tri Aulia, Sefi Indra Gumilar';
      }
      return '';
    },
  },
  // 3. PT Penerbit Erlangga Terbaru 2026 (Cerdas Berbahasa / Bupena & Deep Learning)
  {
    suffixId: 'erlangga-2026',
    provider: 'PT Penerbit Erlangga',
    providerBadge: 'Penerbit Erlangga 2026',
    penerbit: 'PT Penerbit Erlangga (Anggota IKAPI)',
    tahunTerbit: 2026,
    eraTerbit: 'Terbaru 2026',
    tahunTerbitCetakan: 'Tahun Terbit 2026 • Cetakan Ke-1 (Seri Unggulan Kurikulum Merdeka & Mendalam 2026)',
    tahunRevisi: 'Terbitan Baru 2026',
    edisiBadge: 'ERLANGGA 2026',
    isbnPrefix: '978-623-266',
    titlePrefix: 'Buku Teks Pendamping:',
    titleSuffix: 'Kurikulum Merdeka & Deep Learning (2026)',
    defaultKurikulumTypes: ['K13', 'Kurikulum Merdeka', 'Kurikulum Mendalam'],
    customTitleBuilder: (mapel, kelas) => {
      if (mapel.toLowerCase().includes('indonesia')) {
        return `Cerdas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA ${kelas} — Edisi Kurikulum Merdeka & Deep Learning 2026 (Erlangga)`;
      }
      return `Buku Teks Pendamping ${mapel} ${kelas} — Kurikulum Merdeka & Deep Learning (2026)`;
    },
    authorOverride: (mapel) => {
      const m = mapel.toLowerCase();
      if (m.includes('indonesia')) return 'Dr. Engkos Kosasih, M.Pd., Prof. Dr. Maman Suryaman';
      if (m.includes('matematika')) return 'B.K. Noormandiri, Drs. Sukino, M.Sc.';
      if (m.includes('inggris')) return 'Th. M. Sudarwati, Eudia Grace, S.Pd.';
      if (m.includes('fisika')) return 'Marthen Kanginan, M.Sc.';
      if (m.includes('kimia')) return 'Unggul Sudarmo, S.Pd., M.Si.';
      if (m.includes('biologi')) return 'Irnaningtyas, M.Pd., Sylva Sagita, S.Si.';
      return 'Tim Editor Ahli PT Penerbit Erlangga';
    },
  },
  // 4. PT Intan Pariwara Terbaru 2025/2026 (PR Buku Interaktif)
  {
    suffixId: 'intan-2025',
    provider: 'PT Intan Pariwara',
    providerBadge: 'PT Intan Pariwara',
    penerbit: 'PT Penerbit Intan Pariwara (Klaten)',
    tahunTerbit: 2025,
    eraTerbit: '2024 - 2025',
    tahunTerbitCetakan: 'Tahun Terbit 2025 • Cetakan Ke-2 (Buku Interaktif PR Kurikulum Merdeka & HOTS)',
    tahunRevisi: 'Cetakan 2025/2026',
    edisiBadge: 'INTAN PARIWARA',
    isbnPrefix: '978-979-28',
    titlePrefix: 'Buku Interaktif PR',
    titleSuffix: 'Terintegrasi Asesmen Nasional & HOTS (Intan Pariwara)',
    defaultKurikulumTypes: ['Kurikulum Merdeka', 'Kurikulum Mendalam'],
    authorOverride: (mapel) => `Anna Permanasari, Miyanto, Tim Redaksi Intan Pariwara (${mapel})`,
  },
  // 5. PT Tiga Serangkai Pustaka Mandiri (Seri Platinum 2025)
  {
    suffixId: 'tigaserangkai-2025',
    provider: 'PT Tiga Serangkai Pustaka Mandiri',
    providerBadge: 'Tiga Serangkai Platinum',
    penerbit: 'PT Tiga Serangkai Pustaka Mandiri (Solo)',
    tahunTerbit: 2025,
    eraTerbit: '2024 - 2025',
    tahunTerbitCetakan: 'Tahun Terbit 2025 • Cetakan Ke-1 (Seri Platinum Kurikulum Merdeka)',
    tahunRevisi: 'Platinum 2025',
    edisiBadge: 'PLATINUM 2025',
    isbnPrefix: '978-623-328',
    titlePrefix: 'Platinum: Buku Teks Pendamping',
    titleSuffix: 'Edisi Kurikulum Merdeka (Tiga Serangkai)',
    defaultKurikulumTypes: ['K13', 'Kurikulum Merdeka'],
    authorOverride: (mapel) => `Sri Handayani, Budi Purwanto, Tim Penulis Tiga Serangkai (${mapel})`,
  },
  // 6. PT Bumi Aksara & Yudhistira (2023 / Kurikulum Merdeka Awal)
  {
    suffixId: 'bumiaksara-2023',
    provider: 'PT Bumi Aksara & Yudhistira',
    providerBadge: 'Bumi Aksara / Yudhistira',
    penerbit: 'PT Bumi Aksara & PT Yudhistira Ghalia Indonesia',
    tahunTerbit: 2023,
    eraTerbit: '2021 - 2023',
    tahunTerbitCetakan: 'Tahun Terbit 2023 • Cetakan Ke-2 (SK Lolos Penilaian Pusbuk Kemendikbudristek)',
    tahunRevisi: 'Edisi 2022/2023',
    edisiBadge: 'PUSBUK 2023',
    isbnPrefix: '978-602-444',
    titlePrefix: 'Eksplorasi Konsep & Aplikasi',
    titleSuffix: 'Kurikulum Merdeka (Bumi Aksara & Yudhistira)',
    defaultKurikulumTypes: ['Kurikulum Merdeka'],
    authorOverride: () => 'Prof. Dr. Nana Supriatna, M.Ed., Kun Maryati, Juju Suryawati',
  },
  // 7. CV Mediatama & Penerbit Andi Offset (Vokasi SMK 2026 & 2022)
  {
    suffixId: 'mediatama-2026',
    provider: 'CV Mediatama & Andi Offset (Vokasi SMK)',
    providerBadge: 'Mediatama & Andi Offset SMK',
    penerbit: 'CV Mediatama Surakarta & Penerbit Andi Offset Yogyakarta',
    tahunTerbit: 2026,
    eraTerbit: 'Terbaru 2026',
    tahunTerbitCetakan: 'Tahun Terbit 2026 • Cetakan Ke-1 (Standar SKKNI, DUDIKA & Teaching Factory SMK)',
    tahunRevisi: 'Vokasi SMK 2026',
    edisiBadge: 'SMK PK 2026',
    isbnPrefix: '978-623-01',
    titlePrefix: 'Seri Vokasi SMK Pusat Keunggulan:',
    titleSuffix: 'Berbasis Proyek Industri & SKKNI (2026)',
    defaultKurikulumTypes: ['K13', 'Kurikulum Merdeka', 'Kurikulum Mendalam'],
    authorOverride: () => 'Andi Novianto, S.Kom., M.Kom., Dra. Sri Endang R., Tim Litbang Madcoms',
  },
  // 8. Penerbit Yrama Widya & Grafindo Media Pratama (2022)
  {
    suffixId: 'yrama-2022',
    provider: 'Penerbit Yrama Widya & Grafindo',
    providerBadge: 'Yrama Widya & Grafindo',
    penerbit: 'CV Yrama Widya & PT Grafindo Media Pratama (Bandung)',
    tahunTerbit: 2022,
    eraTerbit: '2021 - 2023',
    tahunTerbitCetakan: 'Tahun Terbit 2022 • Cetakan Ke-1 (Edisi Perdana Kurikulum Merdeka)',
    tahunRevisi: 'Cetakan 2022',
    edisiBadge: 'EDISI 2022',
    isbnPrefix: '978-623-205',
    titlePrefix: 'Buku Teks Utama & Pengayaan',
    titleSuffix: '(Yrama Widya & Grafindo Bandung)',
    defaultKurikulumTypes: ['K13', 'Kurikulum Merdeka'],
    authorOverride: () => 'Prof. Dr. H. Suherli, M.Pd., Nunung Nurhayati, Resty Wijayanti',
  },
  // 9. Terbitan Lama Kemendikbud & Erlangga K-13 Revisi (2017 / 2018)
  {
    suffixId: 'k13-2018',
    provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
    providerBadge: 'Buku K-13 Revisi (Terbitan Lama)',
    penerbit: 'Pusat Kurikulum dan Perbukuan Kemendikbud RI & PT Penerbit Erlangga',
    tahunTerbit: 2018,
    eraTerbit: '2016 - 2020 (Terbitan Lama)',
    tahunTerbitCetakan: 'Tahun Terbit 2018 • Cetakan Ke-4 (Kurikulum 2013 Edisi Revisi 2017/2018)',
    tahunRevisi: 'K-13 Revisi 2017/2018',
    edisiBadge: 'K-13 REVISI 2018',
    isbnPrefix: '978-602-427',
    titlePrefix: 'Buku Siswa & Guru Kurikulum 2013 Revisi:',
    titleSuffix: '(Edisi Lama K-13 Tahun 2017/2018)',
    defaultKurikulumTypes: ['K13'],
    authorOverride: () => 'Prof. Dr. H. Suherli, M.Pd., Maman Suryaman, Aji Septiaji, Istiqomah',
  },
];

export function buildExpandedDetectedBooks(params: {
  mataPelajaran: string;
  tingkatKelas: string;
  selectedJenjang: JenjangKey;
  selectedFaseLabel: string;
  jpPerMinggu: number;
  filteredLibrary: Array<{
    id: string;
    jenjang: JenjangKey;
    faseCode: string;
    faseLabel: string;
    kelasDefault: string;
    mapel: string;
    jpDefault: number;
    kepka: string;
    elemenCount: number;
    elemenList: string[];
    desc: string;
    bukuRef: string;
  }>;
  kmaItems: Array<{
    id: string;
    jenjang: JenjangKey;
    faseCode: string;
    faseLabel: string;
    kelasDefault: string;
    mapel: string;
    jpDefault: number;
    kepka: string;
    elemenCount: number;
    elemenList: string[];
    desc: string;
    bukuRef: string;
  }>;
  generateBabListForSubject: (mapel: string, kelas: string) => BabItem[];
  getBookAuthorAndCoverMeta: (
    mapel: string,
    isPartner: boolean,
    isMadrasah: boolean,
    idx: number
  ) => {
    pengarang: string;
    penerbit: string;
    tahunTerbitCetakan: string;
    isbn: string;
    defaultKurikulumTypes: KurikulumBookType[];
    coverStyle: DetectedBookItem['coverStyle'];
  };
}): DetectedBookItem[] {
  const {
    mataPelajaran,
    tingkatKelas,
    selectedJenjang,
    selectedFaseLabel,
    jpPerMinggu,
    filteredLibrary,
    kmaItems,
    generateBabListForSubject,
    getBookAuthorAndCoverMeta,
  } = params;

  const results: DetectedBookItem[] = [];
  const extractedFaseCode = selectedFaseLabel.includes('Fase A')
    ? 'A'
    : selectedFaseLabel.includes('Fase B')
    ? 'B'
    : selectedFaseLabel.includes('Fase C')
    ? 'C'
    : selectedFaseLabel.includes('Fase D')
    ? 'D'
    : selectedFaseLabel.includes('Fase F')
    ? 'F'
    : selectedFaseLabel.includes('Fondasi')
    ? 'Fondasi'
    : 'E';

  // 0. Dedicated Complete "Cerdas Cergas Berbahasa dan Bersastra Indonesia" Official Series (Kelas X, XI, XII & Panduan Guru)
  const cerdasCergasSeries: Array<{
    id: string;
    judulBuku: string;
    pengarang: string;
    penerbit: string;
    tahunTerbit: number;
    eraTerbit: Exclude<EraTerbitKey, 'Semua Tahun'>;
    tahunTerbitCetakan: string;
    isbn: string;
    kelas: string;
    faseCode: string;
    faseLabel: string;
    jp: number;
    edisiBadge: string;
    tahunRevisi: string;
    provider: string;
    providerBadge: string;
    defaultKurikulumTypes: KurikulumBookType[];
    desc: string;
  }> = [
    {
      id: 'cerdas-cergas-x-revisi-2026',
      judulBuku: 'Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA Kelas X (Edisi Revisi Terbaru 2026)',
      pengarang: 'Fadillah Tri Aulia, Sefi Indra Gumilar',
      penerbit: 'Pusat Perbukuan BSKAP Kementerian Pendidikan Dasar dan Menengah RI',
      tahunTerbit: 2026,
      eraTerbit: 'Terbaru 2026',
      tahunTerbitCetakan: 'Tahun Terbit 2026 • Cetakan Ke-4 (Edisi Revisi Terbaru Kurikulum Merdeka & Mendalam 2026)',
      isbn: '978-623-118-367-5',
      kelas: 'Kelas 10',
      faseCode: 'E',
      faseLabel: 'Fase E (Kelas 10 SMA/SMK/MA)',
      jp: 4,
      edisiBadge: 'EDISI REVISI 2026',
      tahunRevisi: 'Edisi Revisi Terbaru 2026',
      provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
      providerBadge: 'SIBI Kemendikdasmen RI 2026',
      defaultKurikulumTypes: ['Kurikulum Merdeka', 'Kurikulum Mendalam'],
      desc: 'Buku Teks Utama Resmi "Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA Kelas X" karya Fadillah Tri Aulia & Sefi Indra Gumilar. Mencakup 6 Bab lengkap: (1) Mengungkap Fakta Alam secara Objektif / LHO, (2) Mengungkapkan Kritik Lewat Senyuman / Teks Anekdot, (3) Menyusuri Nilai dalam Cerita Lintas Zaman / Hikayat & Cerpen, (4) Belajar Menjadi Negosiator Ulung / Teks Negosiasi, (5) Memetik Keteladanan dari Biografi Tokoh Inspiratif, dan (6) Berkarya dan Berekspresi melalui Puisi.',
    },
    {
      id: 'cerdas-cergas-x-revisi-2024',
      judulBuku: 'Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA Kelas X (Edisi Revisi 2023/2024)',
      pengarang: 'Fadillah Tri Aulia, Sefi Indra Gumilar',
      penerbit: 'Pusat Perbukuan BSKAP Kemendikbudristek / Kemendikdasmen RI',
      tahunTerbit: 2024,
      eraTerbit: '2024 - 2025',
      tahunTerbitCetakan: 'Tahun Terbit 2023/2024 • Cetakan Ke-3 (Edisi Revisi Resmi SIBI Kemendikdasmen)',
      isbn: '978-623-118-367-5',
      kelas: 'Kelas 10',
      faseCode: 'E',
      faseLabel: 'Fase E (Kelas 10 SMA/SMK/MA)',
      jp: 4,
      edisiBadge: 'EDISI REVISI',
      tahunRevisi: 'Edisi Revisi 2023/2024',
      provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
      providerBadge: 'SIBI Kemendikdasmen RI',
      defaultKurikulumTypes: ['Kurikulum Merdeka', 'Kurikulum Mendalam'],
      desc: 'Buku Siswa "Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA Kelas X Edisi Revisi" yang diterbitkan resmi oleh Pusat Perbukuan BSKAP pada laman buku.kemendikdasmen.go.id.',
    },
    {
      id: 'cerdas-cergas-x-cetakan1-2021',
      judulBuku: 'Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK Kelas X (Cetakan Ke-1 Tahun 2021)',
      pengarang: 'Fadillah Tri Aulia, Sefi Indra Gumilar',
      penerbit: 'Pusat Kurikulum dan Perbukuan Balitbang dan Perbukuan Kemendikbudristek',
      tahunTerbit: 2021,
      eraTerbit: '2021 - 2023',
      tahunTerbitCetakan: 'Tahun Terbit 2021 • Cetakan Ke-1 (Edisi Perdana Kurikulum Merdeka)',
      isbn: '978-602-244-325-4',
      kelas: 'Kelas 10',
      faseCode: 'E',
      faseLabel: 'Fase E (Kelas 10 SMA/SMK)',
      jp: 4,
      edisiBadge: 'CETAKAN KE-1 (2021)',
      tahunRevisi: 'Cetakan Pertama 2021',
      provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
      providerBadge: 'Pusbuk Kemendikbudristek 2021',
      defaultKurikulumTypes: ['Kurikulum Merdeka'],
      desc: 'Edisi perdana (Cetakan Ke-1 Tahun 2021) buku "Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK Kelas X" oleh Fadillah Tri Aulia & Sefi Indra Gumilar (ISBN 978-602-244-325-4 / 978-602-244-326-1).',
    },
    {
      id: 'cerdas-cergas-panduan-guru-x-2024',
      judulBuku: 'Buku Panduan Guru Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA Kelas X (Edisi Revisi)',
      pengarang: 'Sefi Indra Gumilar, Fadillah Tri Aulia',
      penerbit: 'Pusat Perbukuan BSKAP Kemendikdasmen RI',
      tahunTerbit: 2024,
      eraTerbit: '2024 - 2025',
      tahunTerbitCetakan: 'Tahun Terbit 2024 • Cetakan Ke-2 (Buku Panduan Guru Edisi Revisi)',
      isbn: '978-602-244-327-8',
      kelas: 'Kelas 10',
      faseCode: 'E',
      faseLabel: 'Fase E (Kelas 10 SMA/SMK/MA)',
      jp: 4,
      edisiBadge: 'PANDUAN GURU',
      tahunRevisi: 'Panduan Guru Revisi 2024',
      provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
      providerBadge: 'Buku Panduan Guru SIBI',
      defaultKurikulumTypes: ['Kurikulum Merdeka', 'Kurikulum Mendalam'],
      desc: 'Buku Panduan Guru resmi pendamping buku siswa "Cerdas Cergas Berbahasa dan Bersastra Indonesia Kelas X", dilengkapi skenario pembelajaran terdiferensiasi, kunci jawaban, dan rubrik asesmen.',
    },
    {
      id: 'cerdas-cergas-xi-revisi-2026',
      judulBuku: 'Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA Kelas XI (Edisi Revisi 2025/2026)',
      pengarang: 'Heny Marwati, K. Waskitaningtyas',
      penerbit: 'Pusat Perbukuan BSKAP Kementerian Pendidikan Dasar dan Menengah RI',
      tahunTerbit: 2026,
      eraTerbit: 'Terbaru 2026',
      tahunTerbitCetakan: 'Tahun Terbit 2026 • Cetakan Ke-3 (Edisi Revisi Fase F Kelas XI SMA/SMK/MA)',
      isbn: '978-602-244-662-0',
      kelas: 'Kelas 11',
      faseCode: 'F',
      faseLabel: 'Fase F (Kelas 11-12 SMA/SMK/MA)',
      jp: 3,
      edisiBadge: 'KELAS XI REVISI',
      tahunRevisi: 'Edisi Revisi 2025/2026',
      provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
      providerBadge: 'SIBI Kemendikdasmen RI',
      defaultKurikulumTypes: ['Kurikulum Merdeka', 'Kurikulum Mendalam'],
      desc: 'Buku Teks Utama "Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA Kelas XI" karya Heny Marwati & K. Waskitaningtyas. Memuat 6 Bab: Teks Argumentasi Pangan Lokal, Teks Berita & Vlog Inovasi, Cerpen Sejarah Indonesia, Puisi Inspiratif, Pertunjukan Drama Keberagaman, dan Karya Ilmiah Konservasi Alam.',
    },
    {
      id: 'cerdas-cergas-xii-revisi-2026',
      judulBuku: 'Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA Kelas XII (Edisi Revisi 2025/2026)',
      pengarang: 'Bambang Trimansyah',
      penerbit: 'Pusat Perbukuan BSKAP Kementerian Pendidikan Dasar dan Menengah RI',
      tahunTerbit: 2026,
      eraTerbit: 'Terbaru 2026',
      tahunTerbitCetakan: 'Tahun Terbit 2026 • Cetakan Ke-2 (Edisi Revisi Fase F Kelas XII SMA/SMK/MA)',
      isbn: '978-602-244-738-2',
      kelas: 'Kelas 12',
      faseCode: 'F',
      faseLabel: 'Fase F (Kelas 11-12 SMA/SMK/MA)',
      jp: 3,
      edisiBadge: 'KELAS XII REVISI',
      tahunRevisi: 'Edisi Revisi 2025/2026',
      provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
      providerBadge: 'SIBI Kemendikdasmen RI',
      defaultKurikulumTypes: ['Kurikulum Merdeka', 'Kurikulum Mendalam'],
      desc: 'Buku Teks Utama "Cerdas Cergas Berbahasa dan Bersastra Indonesia untuk SMA/SMK/MA Kelas XII" karya Bambang Trimansyah. Memuat 6 Bab: Mengkritisi Informasi Tokoh, Mempresentasikan Ide Kewirausahaan, Mendiskusikan Fenomena Kecerdasan Buatan (AI), Menyampaikan Opini tentang Perundungan, Narasi Kearifan Lokal, dan Menulis Praktik Baik Lingkungan.',
    },
    {
      id: 'cakap-berbahasa-lanjut-xi-2025',
      judulBuku: 'Bahasa Indonesia Tingkat Lanjut: Cakap Berbahasa dan Bersastra Indonesia untuk SMA/MA Kelas XI',
      pengarang: 'Rahmah Purwahida, Maman',
      penerbit: 'Pusat Perbukuan BSKAP Kemendikdasmen RI',
      tahunTerbit: 2025,
      eraTerbit: '2024 - 2025',
      tahunTerbitCetakan: 'Tahun Terbit 2025 • Cetakan Ke-2 (Edisi Revisi Bahasa Indonesia Tingkat Lanjut)',
      isbn: '978-602-244-685-9',
      kelas: 'Kelas 11',
      faseCode: 'F',
      faseLabel: 'Fase F (Kelas 11-12 SMA/MA)',
      jp: 5,
      edisiBadge: 'TINGKAT LANJUT',
      tahunRevisi: 'Edisi Revisi 2025',
      provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
      providerBadge: 'SIBI Kemendikdasmen RI',
      defaultKurikulumTypes: ['Kurikulum Merdeka', 'Kurikulum Mendalam'],
      desc: 'Buku Teks Utama Bahasa Indonesia Tingkat Lanjut "Cakap Berbahasa dan Bersastra Indonesia untuk SMA/MA Kelas XI" karya Rahmah Purwahida & Maman.',
    },
    {
      id: 'erlangga-cerdas-berbahasa-x-2026',
      judulBuku: 'Cerdas Berbahasa dan Bersastra Indonesia untuk SMA/MA/SMK Kelas X (Kurikulum Merdeka & Deep Learning 2026)',
      pengarang: 'Dr. Engkos Kosasih, M.Pd.',
      penerbit: 'PT Penerbit Erlangga (Anggota IKAPI)',
      tahunTerbit: 2026,
      eraTerbit: 'Terbaru 2026',
      tahunTerbitCetakan: 'Tahun Terbit 2026 • Cetakan Ke-1 (Seri Cerdas Berbahasa & Bersastra Indonesia Erlangga)',
      isbn: '978-623-266-714-0',
      kelas: 'Kelas 10',
      faseCode: 'E',
      faseLabel: 'Fase E (Kelas 10 SMA/SMK/MA)',
      jp: 4,
      edisiBadge: 'ERLANGGA 2026',
      tahunRevisi: 'Terbitan Baru 2026',
      provider: 'PT Penerbit Erlangga',
      providerBadge: 'Penerbit Erlangga 2026',
      defaultKurikulumTypes: ['K13', 'Kurikulum Merdeka', 'Kurikulum Mendalam'],
      desc: 'Buku Teks Pendamping unggulan PT Penerbit Erlangga "Cerdas Berbahasa dan Bersastra Indonesia" oleh Dr. Engkos Kosasih, M.Pd., selaras dengan Bab & Sub-Bab Cerdas Cergas Kemendikdasmen.',
    },
  ];

  cerdasCergasSeries.forEach((cc, ccIdx) => {
    const babsForCc = generateBabListForSubject('Bahasa Indonesia', cc.kelas);
    const coverDataUri = generateAuthenticPublisherCoverDataUri({
      judulBuku: cc.judulBuku,
      mapel: 'Bahasa Indonesia',
      kelas: cc.kelas,
      pengarang: cc.pengarang,
      penerbit: cc.penerbit,
      tahunTerbit: cc.tahunTerbit,
      edisiBadge: cc.edisiBadge,
      isbn: cc.isbn,
      variantIndex: ccIdx,
    });

    results.push({
      id: cc.id,
      judulBuku: cc.judulBuku,
      pengarang: cc.pengarang,
      penerbit: cc.penerbit,
      tahunTerbit: cc.tahunTerbit,
      eraTerbit: cc.eraTerbit,
      tahunTerbitCetakan: cc.tahunTerbitCetakan,
      isbn: cc.isbn,
      mapel: cc.id.includes('lanjut') ? 'Bahasa Indonesia Tingkat Lanjut' : 'Bahasa Indonesia',
      jenjang: 'SMA_SMK',
      faseCode: cc.faseCode,
      faseLabel: cc.faseLabel,
      kelasDefault: cc.kelas,
      jpDefault: cc.jp,
      kepka: 'KepKa BSKAP No. 046/H/KR/2025',
      elemenCount: 4,
      elemenList: ['Menyimak', 'Membaca dan Memirsa', 'Berbicara dan Mempresentasikan', 'Menulis'],
      desc: cc.desc,
      provider: cc.provider,
      providerBadge: cc.providerBadge,
      katalogUrl: 'https://buku.kemendikdasmen.go.id/katalog?search=Cerdas+Cergas+Berbahasa+dan+Bersastra+Indonesia',
      tahunRevisi: cc.tahunRevisi,
      defaultKurikulumTypes: cc.defaultKurikulumTypes,
      coverImageUrl: coverDataUri,
      coverStyle: {
        gradient: 'from-rose-600 via-red-700 to-rose-950',
        spineColor: 'bg-rose-950',
        icon: '🇮🇩',
        instansiHeader: cc.providerBadge.toUpperCase(),
        edisiBadge: cc.edisiBadge,
      },
      babList: babsForCc,
    });
  });

  // 1. Generate all Publisher & Year Editions (2018 to 2026) for the currently selected Mata Pelajaran so the user immediately sees a rich variety of old & 2026 books for their active subject!
  const activeBabList = generateBabListForSubject(mataPelajaran, tingkatKelas);
  const baseActiveMeta = getBookAuthorAndCoverMeta(mataPelajaran, false, false, 0);

  PUBLISHER_EDITION_TEMPLATES.forEach((tpl, tplIdx) => {
    const customAuthor = tpl.authorOverride ? tpl.authorOverride(mataPelajaran, tingkatKelas) : '';
    const authorName = customAuthor || baseActiveMeta.pengarang;
    const bookTitle = tpl.customTitleBuilder
      ? tpl.customTitleBuilder(mataPelajaran, tingkatKelas)
      : `${tpl.titlePrefix} ${mataPelajaran} ${tingkatKelas} — ${tpl.titleSuffix}`.trim();
    const isbnCode = `${tpl.isbnPrefix}-${310 + tplIdx * 11}-${(tplIdx % 9) + 1}`;
    const coverImg = generateAuthenticPublisherCoverDataUri({
      judulBuku: bookTitle,
      mapel: mataPelajaran,
      kelas: tingkatKelas,
      pengarang: authorName,
      penerbit: tpl.penerbit,
      tahunTerbit: tpl.tahunTerbit,
      edisiBadge: tpl.edisiBadge,
      isbn: isbnCode,
      variantIndex: tplIdx,
    });

    results.push({
      id: `active-${mataPelajaran.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${tpl.suffixId}`,
      judulBuku: bookTitle,
      pengarang: authorName,
      penerbit: tpl.penerbit,
      tahunTerbit: tpl.tahunTerbit,
      eraTerbit: tpl.eraTerbit,
      tahunTerbitCetakan: tpl.tahunTerbitCetakan,
      isbn: isbnCode,
      mapel: mataPelajaran,
      jenjang: selectedJenjang,
      faseCode: extractedFaseCode,
      faseLabel: selectedFaseLabel,
      kelasDefault: tingkatKelas,
      jpDefault: jpPerMinggu,
      kepka: tpl.tahunTerbit <= 2020 ? 'Permendikbud No. 37 Tahun 2018 (K-13 Revisi)' : 'KepKa BSKAP No. 046/H/KR/2025',
      elemenCount: 4,
      elemenList: ['Pemahaman Konsep Esensial', 'Keterampilan Proses', 'Penalaran Kritis & HOTS', 'Aplikasi Kontekstual'],
      desc: `Buku resmi terbitan ${tpl.penerbit} (${tpl.tahunTerbitCetakan}) untuk mata pelajaran ${mataPelajaran} (${tingkatKelas}), lengkap dengan pemetaan Bab & Sub-Bab yang dapat langsung diterapkan.`,
      provider: tpl.provider,
      providerBadge: tpl.providerBadge,
      katalogUrl: `https://buku.kemendikdasmen.go.id/katalog?search=${encodeURIComponent(mataPelajaran)}`,
      tahunRevisi: tpl.tahunRevisi,
      defaultKurikulumTypes: tpl.defaultKurikulumTypes,
      coverImageUrl: coverImg,
      coverStyle: {
        ...baseActiveMeta.coverStyle,
        instansiHeader: tpl.providerBadge.toUpperCase(),
        edisiBadge: tpl.edisiBadge,
      },
      babList: activeBabList,
    });
  });

  // 2. For every item in filteredLibrary, generate 4 distinct publisher/year editions (2026 Kemendikdasmen, 2026 Erlangga, 2024/2025 Intan Pariwara/Tiga Serangkai/Mediatama, and 2018 K-13 Lama)
  filteredLibrary.forEach((item, idx) => {
    // Skip duplicate primary active subject if already added above, or add cross-grade variants
    const babs = generateBabListForSubject(item.mapel, item.kelasDefault);
    const mainMeta = getBookAuthorAndCoverMeta(item.mapel, false, false, idx);
    const partnerMeta = getBookAuthorAndCoverMeta(item.mapel, true, false, idx);

    // Edition A: SIBI Kemendikdasmen Edisi Revisi 2024/2025
    const coverA = generateAuthenticPublisherCoverDataUri({
      judulBuku: item.bukuRef,
      mapel: item.mapel,
      kelas: item.kelasDefault,
      pengarang: mainMeta.pengarang,
      penerbit: mainMeta.penerbit,
      tahunTerbit: 2024 + (idx % 2),
      edisiBadge: 'SIBI REVISI',
      isbn: mainMeta.isbn,
      variantIndex: idx,
    });

    results.push({
      id: item.id,
      judulBuku: item.bukuRef,
      pengarang: mainMeta.pengarang,
      penerbit: mainMeta.penerbit,
      tahunTerbit: 2024 + (idx % 2),
      eraTerbit: '2024 - 2025',
      tahunTerbitCetakan: mainMeta.tahunTerbitCetakan,
      isbn: mainMeta.isbn,
      mapel: item.mapel,
      jenjang: item.jenjang,
      faseCode: item.faseCode,
      faseLabel: item.faseLabel,
      kelasDefault: item.kelasDefault,
      jpDefault: item.jpDefault,
      kepka: item.kepka,
      elemenCount: item.elemenCount,
      elemenList: item.elemenList,
      desc: item.desc,
      provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
      providerBadge: 'SIBI Kemendikdasmen RI',
      katalogUrl: `https://buku.kemendikdasmen.go.id/katalog?search=${encodeURIComponent(item.mapel)}`,
      tahunRevisi: 'Edisi Revisi 2024/2025',
      defaultKurikulumTypes: mainMeta.defaultKurikulumTypes,
      coverImageUrl: coverA,
      coverStyle: mainMeta.coverStyle,
      babList: babs,
    });

    // Edition B: Terbitan Terbaru 2026 (Erlangga / Intan Pariwara / Tiga Serangkai / Mediatama)
    const pubChoice =
      idx % 4 === 0
        ? {
            prov: 'PT Penerbit Erlangga',
            badge: 'Penerbit Erlangga 2026',
            pen: 'PT Penerbit Erlangga (Anggota IKAPI)',
            edisi: 'ERLANGGA 2026',
          }
        : idx % 4 === 1
        ? {
            prov: 'PT Intan Pariwara',
            badge: 'Intan Pariwara 2026',
            pen: 'PT Penerbit Intan Pariwara',
            edisi: 'PR INTERAKTIF 2026',
          }
        : idx % 4 === 2
        ? {
            prov: 'PT Tiga Serangkai Pustaka Mandiri',
            badge: 'Tiga Serangkai 2026',
            pen: 'PT Tiga Serangkai Pustaka Mandiri',
            edisi: 'PLATINUM 2026',
          }
        : {
            prov: 'CV Mediatama & Andi Offset (Vokasi SMK)',
            badge: 'Mediatama & Andi 2026',
            pen: 'CV Mediatama & Penerbit Andi Offset',
            edisi: 'VOKASI 2026',
          };

    const titleB = `Buku Teks Pendamping ${item.mapel} ${item.kelasDefault} Edisi Kurikulum Mendalam 2026 (${pubChoice.badge})`;
    const isbnB = `978-623-266-${720 + idx * 3}-${(idx % 8) + 1}`;
    const coverB = generateAuthenticPublisherCoverDataUri({
      judulBuku: titleB,
      mapel: item.mapel,
      kelas: item.kelasDefault,
      pengarang: partnerMeta.pengarang,
      penerbit: pubChoice.pen,
      tahunTerbit: 2026,
      edisiBadge: pubChoice.edisi,
      isbn: isbnB,
      variantIndex: idx + 1,
    });

    results.push({
      id: `${item.id}-partner-2026`,
      judulBuku: titleB,
      pengarang: partnerMeta.pengarang,
      penerbit: pubChoice.pen,
      tahunTerbit: 2026,
      eraTerbit: 'Terbaru 2026',
      tahunTerbitCetakan: 'Tahun Terbit 2026 • Cetakan Ke-1 (Edisi Terbaru Kurikulum Merdeka & Mendalam 2026)',
      isbn: isbnB,
      mapel: item.mapel,
      jenjang: item.jenjang,
      faseCode: item.faseCode,
      faseLabel: item.faseLabel,
      kelasDefault: item.kelasDefault,
      jpDefault: item.jpDefault,
      kepka: item.kepka,
      elemenCount: item.elemenCount,
      elemenList: item.elemenList,
      desc: `Buku Teks Pendamping Resmi Terbitan Terbaru 2026 oleh ${pubChoice.pen} yang selaras dengan Bab & Sub-Bab ${item.bukuRef} serta KepKa BSKAP No. 046/H/KR/2025.`,
      provider: pubChoice.prov,
      providerBadge: pubChoice.badge,
      katalogUrl: `https://buku.kemendikdasmen.go.id/katalog?search=${encodeURIComponent(item.mapel)}`,
      tahunRevisi: 'Terbitan Baru 2026',
      defaultKurikulumTypes: ['K13', 'Kurikulum Merdeka', 'Kurikulum Mendalam'],
      coverImageUrl: coverB,
      coverStyle: {
        ...partnerMeta.coverStyle,
        instansiHeader: pubChoice.badge.toUpperCase(),
        edisiBadge: pubChoice.edisi,
      },
      babList: babs,
    });

    // Edition C: Terbitan Lama K-13 Revisi (2017 - 2020) or Kurikulum Merdeka Awal (2021 - 2023)
    const isOldK13 = idx % 2 === 0;
    const yearC = isOldK13 ? 2017 + (idx % 4) : 2021 + (idx % 3);
    const eraC: Exclude<EraTerbitKey, 'Semua Tahun'> = isOldK13 ? '2016 - 2020 (Terbitan Lama)' : '2021 - 2023';
    const provC = isOldK13 ? 'PT Bumi Aksara & Yudhistira' : 'Penerbit Yrama Widya & Grafindo';
    const penC = isOldK13
      ? 'PT Bumi Aksara & Yudhistira Ghalia Indonesia'
      : 'CV Yrama Widya & PT Grafindo Media Pratama';
    const titleC = isOldK13
      ? `Buku Teks ${item.mapel} ${item.kelasDefault} Kurikulum 2013 Edisi Revisi (${yearC})`
      : `Buku Penggerak ${item.mapel} ${item.kelasDefault} Kurikulum Merdeka Cetakan Perdana (${yearC})`;
    const isbnC = `978-602-444-${210 + idx * 5}-${(idx % 7) + 2}`;
    const coverC = generateAuthenticPublisherCoverDataUri({
      judulBuku: titleC,
      mapel: item.mapel,
      kelas: item.kelasDefault,
      pengarang: partnerMeta.pengarang,
      penerbit: penC,
      tahunTerbit: yearC,
      edisiBadge: isOldK13 ? `K-13 (${yearC})` : `CETAKAN ${yearC}`,
      isbn: isbnC,
      variantIndex: idx + 2,
    });

    results.push({
      id: `${item.id}-archive-${yearC}`,
      judulBuku: titleC,
      pengarang: partnerMeta.pengarang,
      penerbit: penC,
      tahunTerbit: yearC,
      eraTerbit: eraC,
      tahunTerbitCetakan: isOldK13
        ? `Tahun Terbit ${yearC} • Cetakan Ke-4 (Edisi Revisi Kurikulum 2013)`
        : `Tahun Terbit ${yearC} • Cetakan Ke-1 (Edisi Kurikulum Merdeka Awal)`,
      isbn: isbnC,
      mapel: item.mapel,
      jenjang: item.jenjang,
      faseCode: item.faseCode,
      faseLabel: item.faseLabel,
      kelasDefault: item.kelasDefault,
      jpDefault: item.jpDefault,
      kepka: isOldK13 ? 'Permendikbud No. 37 Tahun 2018 (K-13)' : item.kepka,
      elemenCount: item.elemenCount,
      elemenList: item.elemenList,
      desc: `Koleksi pustaka buku teks ${item.mapel} terbitan tahun ${yearC} oleh ${penC}, mendukung penyelarasan materi lintas kurikulum (K-13 Revisi & Kurikulum Merdeka).`,
      provider: provC,
      providerBadge: isOldK13 ? `Bumi Aksara / Yudhistira (${yearC})` : `Yrama Widya / Grafindo (${yearC})`,
      katalogUrl: `https://buku.kemendikdasmen.go.id/katalog?search=${encodeURIComponent(item.mapel)}`,
      tahunRevisi: `Terbitan Tahun ${yearC}`,
      defaultKurikulumTypes: isOldK13 ? ['K13'] : ['K13', 'Kurikulum Merdeka'],
      coverImageUrl: coverC,
      coverStyle: {
        ...partnerMeta.coverStyle,
        instansiHeader: penC.slice(0, 22).toUpperCase(),
        edisiBadge: `TAHUN ${yearC}`,
      },
      babList: babs,
    });
  });

  // 3. Include All KMA 1503/2025 (2025/2026) AND KMA 183/2019 (Terbitan Lama 2019/2020) Madrasah / Kemenag Books
  kmaItems.forEach((kma, idx) => {
    const madrasahMeta = getBookAuthorAndCoverMeta(kma.mapel, false, true, idx);
    const babs = generateBabListForSubject(kma.mapel, kma.kelasDefault);

    // 2025 / 2026 Edition (KMA 1503 Tahun 2025)
    const yearNew = idx % 2 === 0 ? 2026 : 2025;
    const coverKmaNew = generateAuthenticPublisherCoverDataUri({
      judulBuku: kma.bukuRef,
      mapel: kma.mapel,
      kelas: kma.kelasDefault,
      pengarang: madrasahMeta.pengarang,
      penerbit: madrasahMeta.penerbit,
      tahunTerbit: yearNew,
      edisiBadge: `KMA 1503 (${yearNew})`,
      isbn: madrasahMeta.isbn,
      variantIndex: idx,
    });

    results.push({
      id: kma.id,
      judulBuku: `${kma.bukuRef} — Cetakan Terbaru ${yearNew}`,
      pengarang: madrasahMeta.pengarang,
      penerbit: madrasahMeta.penerbit,
      tahunTerbit: yearNew,
      eraTerbit: yearNew === 2026 ? 'Terbaru 2026' : '2024 - 2025',
      tahunTerbitCetakan: `Tahun Terbit ${yearNew} • Cetakan Ke-1 (Standar KMA Nomor 1503 Tahun 2025)`,
      isbn: madrasahMeta.isbn,
      mapel: kma.mapel,
      jenjang: kma.jenjang,
      faseCode: kma.faseCode,
      faseLabel: kma.faseLabel,
      kelasDefault: kma.kelasDefault,
      jpDefault: kma.jpDefault,
      kepka: kma.kepka,
      elemenCount: kma.elemenCount,
      elemenList: kma.elemenList,
      desc: kma.desc,
      provider: 'Buku Madrasah Kemenag RI (KMA 1503/2025 & KMA 183)',
      providerBadge: `Kemenag RI • KMA 1503 (${yearNew})`,
      katalogUrl: 'https://buku.kemendikdasmen.go.id/katalog',
      tahunRevisi: `Edisi KMA 1503 (${yearNew})`,
      defaultKurikulumTypes: ['Buku Madrasah', 'Kurikulum Merdeka', 'Kurikulum Mendalam'],
      coverImageUrl: coverKmaNew,
      coverStyle: madrasahMeta.coverStyle,
      babList: babs,
    });

    // 2019 / 2020 Edition (KMA 183 Tahun 2019 — Terbitan Lama Madrasah)
    if (idx < 5) {
      const yearOld = 2019 + (idx % 2);
      const isbnOld = `978-602-293-${110 + idx * 9}-4`;
      const titleOld = `Buku Siswa ${kma.mapel} ${kma.kelasDefault} Madrasah (KMA Nomor 183 Tahun 2019)`;
      const coverKmaOld = generateAuthenticPublisherCoverDataUri({
        judulBuku: titleOld,
        mapel: kma.mapel,
        kelas: kma.kelasDefault,
        pengarang: madrasahMeta.pengarang,
        penerbit: 'Direktorat KSKK Madrasah Kemenag RI & LP Ma’arif NU',
        tahunTerbit: yearOld,
        edisiBadge: `KMA 183 (${yearOld})`,
        isbn: isbnOld,
        variantIndex: idx + 3,
      });

      results.push({
        id: `${kma.id}-kma183-${yearOld}`,
        judulBuku: titleOld,
        pengarang: madrasahMeta.pengarang,
        penerbit: 'Direktorat KSKK Madrasah Kemenag RI & LP Ma’arif NU',
        tahunTerbit: yearOld,
        eraTerbit: '2016 - 2020 (Terbitan Lama)',
        tahunTerbitCetakan: `Tahun Terbit ${yearOld} • Cetakan Ke-2 (Regulasi KMA 183 Tahun 2019 & K-13)`,
        isbn: isbnOld,
        mapel: kma.mapel,
        jenjang: kma.jenjang,
        faseCode: kma.faseCode,
        faseLabel: kma.faseLabel,
        kelasDefault: kma.kelasDefault,
        jpDefault: kma.jpDefault,
        kepka: 'KMA Nomor 183 Tahun 2019',
        elemenCount: kma.elemenCount,
        elemenList: kma.elemenList,
        desc: `Buku Teks PAI & Bahasa Arab terbitan Direktorat KSKK Madrasah Kemenag RI Tahun ${yearOld} (KMA 183/2019) yang tetap menjadi rujukan pendamping materi klasik.`,
        provider: 'Buku Madrasah Kemenag RI (KMA 1503/2025 & KMA 183)',
        providerBadge: `Kemenag RI • KMA 183 (${yearOld})`,
        katalogUrl: 'https://buku.kemendikdasmen.go.id/katalog',
        tahunRevisi: `Terbitan Lama ${yearOld}`,
        defaultKurikulumTypes: ['K13', 'Buku Madrasah'],
        coverImageUrl: coverKmaOld,
        coverStyle: {
          ...madrasahMeta.coverStyle,
          edisiBadge: `KMA 183 (${yearOld})`,
        },
        babList: babs,
      });
    }
  });

  return results;
}

import {
  SchoolProfile,
  RpeState,
  TujuanPembelajaran,
  ProtaItem,
  PromesItem,
  ModulAjarItem,
  LkpdItem,
  CpElement,
} from '../types';
import { CP_LIBRARY_ITEMS } from '../data/cpLibrary';

/**
 * Pure calculation logic for Indonesian Kurikulum Merdeka & Administrasi Guru
 */

export interface MonthRpe {
  month: string;
  totalWeeks: number;
  nonEffectiveWeeks: number;
  nonEffectiveNote: string;
  effectiveWeeks: number;
}

export interface BloomItem {
  id: string;
  code: string;
  bloomLevel: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
}

export interface StudentScoreRecord {
  id: string;
  name: string;
  nilaiAkhir: number;
}

/**
 * Calculates effective weeks and lesson hours for a semester
 */
export function calculateRpeTotals(
  months: MonthRpe[],
  jpPerWeek: number,
  cadanganJp: number = 4
) {
  const totalWeeks = months.reduce((acc, m) => acc + m.totalWeeks, 0);
  const nonEffectiveWeeks = months.reduce((acc, m) => acc + m.nonEffectiveWeeks, 0);
  const effectiveWeeks = totalWeeks - nonEffectiveWeeks;
  const grossJp = effectiveWeeks * jpPerWeek;
  const netJp = Math.max(0, grossJp - cadanganJp);

  return {
    totalWeeks,
    nonEffectiveWeeks,
    effectiveWeeks,
    grossJp,
    cadanganJp,
    netJp,
  };
}

/**
 * Calculates Taksonomi Bloom HOTS (C4, C5, C6) ratio
 */
export function calculateBloomStats(items: BloomItem[]) {
  if (!items || items.length === 0) {
    return { total: 0, hotsCount: 0, motsCount: 0, lotsCount: 0, hotsPercentage: 0 };
  }

  let hotsCount = 0; // C4, C5, C6
  let motsCount = 0; // C3
  let lotsCount = 0; // C1, C2

  for (const item of items) {
    if (['C4', 'C5', 'C6'].includes(item.bloomLevel)) {
      hotsCount++;
    } else if (item.bloomLevel === 'C3') {
      motsCount++;
    } else {
      lotsCount++;
    }
  }

  const hotsPercentage = Math.round((hotsCount / items.length) * 100);

  return {
    total: items.length,
    hotsCount,
    motsCount,
    lotsCount,
    hotsPercentage,
  };
}

/**
 * Calculates class mastery (Ketuntasan Siswa) based on KKTP threshold (default 75)
 */
export function calculateClassMastery(students: StudentScoreRecord[], kktpThreshold: number = 75) {
  if (!students || students.length === 0) {
    return {
      totalStudents: 0,
      tuntasCount: 0,
      belumTuntasCount: 0,
      masteryRate: 0,
      classAverage: 0,
    };
  }

  let totalScore = 0;
  let tuntasCount = 0;

  for (const s of students) {
    totalScore += s.nilaiAkhir;
    if (s.nilaiAkhir >= kktpThreshold) {
      tuntasCount++;
    }
  }

  const classAverage = Number((totalScore / students.length).toFixed(1));
  const masteryRate = Math.round((tuntasCount / students.length) * 100);

  return {
    totalStudents: students.length,
    tuntasCount,
    belumTuntasCount: students.length - tuntasCount,
    masteryRate,
    classAverage,
  };
}

/**
 * Audits curriculum alignment across documents
 */
export function auditCurriculumAlignment(params: {
  rpeTotalJp: number;
  protaTotalJp: number;
  promesTotalJp: number;
  tpCount: number;
  modulCount: number;
  lkpdCount: number;
  studentsEvaluated: number;
}) {
  const checks = [
    {
      name: 'PROTA vs RPE JP',
      valid: params.protaTotalJp === params.rpeTotalJp,
      detail: `${params.protaTotalJp} JP vs ${params.rpeTotalJp} JP`,
    },
    {
      name: 'PROMES vs PROTA JP',
      valid: params.promesTotalJp === params.protaTotalJp,
      detail: `${params.promesTotalJp} JP vs ${params.protaTotalJp} JP`,
    },
    {
      name: 'Modul Ajar Coverage',
      valid: params.modulCount > 0 && params.modulCount >= params.tpCount,
      detail: `${params.modulCount} Modul untuk ${params.tpCount} TP`,
    },
    {
      name: 'LKPD Readiness',
      valid: params.lkpdCount >= params.modulCount,
      detail: `${params.lkpdCount} LKPD aktif`,
    },
    {
      name: 'Penilaian Siswa',
      valid: params.studentsEvaluated > 0,
      detail: `${params.studentsEvaluated} Siswa ternilai`,
    },
  ];

  const passedChecks = checks.filter((c) => c.valid).length;
  const alignmentPercentage = Math.round((passedChecks / checks.length) * 100);

  return {
    isFullyAligned: alignmentPercentage === 100,
    alignmentPercentage,
    passedChecks,
    totalChecks: checks.length,
    checks,
  };
}

export interface ProtaSyncInput {
  id: string;
  semester: number;
  babNumber: number;
  babTitle: string;
  materiPembelajaran?: string;
  tpCode: string;
  tpDescription: string;
  alokasiJp: number;
  keterangan?: string;
}

export interface PromesSyncOutput {
  id: string;
  semester: number;
  babNumber: number;
  babTitle: string;
  materiPembelajaran?: string;
  tpCode: string;
  tpDescription: string;
  alokasiJp: number;
  distribution: { [monthWeekKey: string]: number };
}

const SEMESTER_1_MONTH_WEEKS: { label: string; weeks: string[]; skipMode: 'start' | 'middle' | 'end' }[] = [
  { label: 'Juli', weeks: ['Jul-1', 'Jul-2', 'Jul-3', 'Jul-4'], skipMode: 'start' },
  { label: 'Agustus', weeks: ['Agu-1', 'Agu-2', 'Agu-3', 'Agu-4', 'Agu-5'], skipMode: 'end' },
  { label: 'September', weeks: ['Sep-1', 'Sep-2', 'Sep-3', 'Sep-4'], skipMode: 'middle' },
  { label: 'Oktober', weeks: ['Okt-1', 'Okt-2', 'Okt-3', 'Okt-4', 'Okt-5'], skipMode: 'end' },
  { label: 'November', weeks: ['Nov-1', 'Nov-2', 'Nov-3', 'Nov-4'], skipMode: 'end' },
  { label: 'Desember', weeks: ['Des-1', 'Des-2', 'Des-3', 'Des-4', 'Des-5'], skipMode: 'end' },
];

const SEMESTER_2_MONTH_WEEKS: { label: string; weeks: string[]; skipMode: 'start' | 'middle' | 'end' }[] = [
  { label: 'Januari', weeks: ['Jan-1', 'Jan-2', 'Jan-3', 'Jan-4'], skipMode: 'start' },
  { label: 'Februari', weeks: ['Feb-1', 'Feb-2', 'Feb-3', 'Feb-4'], skipMode: 'end' },
  { label: 'Maret', weeks: ['Mar-1', 'Mar-2', 'Mar-3', 'Mar-4', 'Mar-5'], skipMode: 'start' },
  { label: 'April', weeks: ['Apr-1', 'Apr-2', 'Apr-3', 'Apr-4'], skipMode: 'start' },
  { label: 'Mei', weeks: ['Mei-1', 'Mei-2', 'Mei-3', 'Mei-4', 'Mei-5'], skipMode: 'end' },
  { label: 'Juni', weeks: ['Jun-1', 'Jun-2', 'Jun-3', 'Jun-4'], skipMode: 'end' },
];

function getEffectiveWeekKeysForSemester(
  semester: 1 | 2,
  rpeMonths?: MonthRpe[]
): string[] {
  const monthDefs = semester === 1 ? SEMESTER_1_MONTH_WEEKS : SEMESTER_2_MONTH_WEEKS;
  const effectiveKeys: string[] = [];

  monthDefs.forEach((mDef, idx) => {
    const rpeMonth = rpeMonths?.[idx];
    const totalW = mDef.weeks.length;
    const targetEffective = rpeMonth
      ? Math.max(0, Math.min(totalW, rpeMonth.effectiveWeeks))
      : totalW;
    const nonEffCount = totalW - targetEffective;

    if (nonEffCount <= 0) {
      effectiveKeys.push(...mDef.weeks);
    } else if (mDef.skipMode === 'start') {
      effectiveKeys.push(...mDef.weeks.slice(nonEffCount));
    } else if (mDef.skipMode === 'middle') {
      // Skip middle week(s) e.g. Sep-3 for STS
      const kept: string[] = [];
      const skipStartIdx = Math.floor((totalW - nonEffCount) / 2);
      mDef.weeks.forEach((w, wIdx) => {
        if (wIdx < skipStartIdx || wIdx >= skipStartIdx + nonEffCount) {
          kept.push(w);
        }
      });
      effectiveKeys.push(...kept);
    } else {
      effectiveKeys.push(...mDef.weeks.slice(0, targetEffective));
    }
  });

  // Also append remaining weeks at the end as overflow fallback so all JP are always allocated
  const allWeeks = monthDefs.flatMap((m) => m.weeks);
  for (const w of allWeeks) {
    if (!effectiveKeys.includes(w)) {
      effectiveKeys.push(w);
    }
  }

  return effectiveKeys;
}

/**
 * Generates synchronized PROMES items from PROTA items and RPE effective weeks
 */
export function buildPromesFromProta(
  protaList: ProtaSyncInput[],
  rpeState?: {
    semester1: { jpPerWeek: number; months: MonthRpe[] };
    semester2: { jpPerWeek: number; months: MonthRpe[] };
  },
  existingPromes: PromesSyncOutput[] = [],
  mode: 'auto_rpe' | 'preserve_custom' = 'auto_rpe'
): PromesSyncOutput[] {
  const result: PromesSyncOutput[] = [];

  ([1, 2] as const).forEach((sem) => {
    const semProta = protaList.filter((p) => Number(p.semester) === sem);
    const jpPerWeek =
      (sem === 1 ? rpeState?.semester1?.jpPerWeek : rpeState?.semester2?.jpPerWeek) || 4;
    const rpeMonths =
      sem === 1 ? rpeState?.semester1?.months : rpeState?.semester2?.months;
    const weekOrder = getEffectiveWeekKeysForSemester(sem, rpeMonths);

    let currentWeekIdx = 0;
    let currentWeekRemainingCap = jpPerWeek;

    semProta.forEach((pItem, idx) => {
      const existingMatch = existingPromes.find(
        (ep) =>
          ep.tpCode === pItem.tpCode ||
          ep.id === pItem.id.replace('prota-', 'promes-')
      );

      const existingSum = existingMatch
        ? Object.values(existingMatch.distribution || {}).reduce((a, b) => a + (Number(b) || 0), 0)
        : -1;

      const formattedBabTitle = pItem.babTitle.toLowerCase().startsWith('bab')
        ? pItem.babTitle
        : `Bab ${pItem.babNumber}: ${pItem.babTitle}`;

      if (
        mode === 'preserve_custom' &&
        existingMatch &&
        existingMatch.semester === sem &&
        existingSum === pItem.alokasiJp &&
        existingSum > 0
      ) {
        result.push({
          id: existingMatch.id || `promes-${sem}-${idx + 1}`,
          semester: sem,
          babNumber: pItem.babNumber,
          babTitle: formattedBabTitle,
          tpCode: pItem.tpCode,
          tpDescription: pItem.tpDescription,
          alokasiJp: pItem.alokasiJp,
          distribution: { ...existingMatch.distribution },
        });
        return;
      }

      // Sequential distribution across effective weeks
      const distribution: { [monthWeekKey: string]: number } = {};
      let jpToAllocate = Math.max(0, Number(pItem.alokasiJp) || 0);

      while (jpToAllocate > 0 && currentWeekIdx < weekOrder.length) {
        const weekKey = weekOrder[currentWeekIdx];
        if (currentWeekRemainingCap <= 0) {
          currentWeekIdx++;
          currentWeekRemainingCap = jpPerWeek;
          continue;
        }
        const alloc = Math.min(jpToAllocate, currentWeekRemainingCap);
        if (alloc > 0) {
          distribution[weekKey] = (distribution[weekKey] || 0) + alloc;
          jpToAllocate -= alloc;
          currentWeekRemainingCap -= alloc;
        }
        if (currentWeekRemainingCap <= 0) {
          currentWeekIdx++;
          currentWeekRemainingCap = jpPerWeek;
        }
      }

      // If still has remaining JP (exceeded total weeks in semester), place in the last effective week
      if (jpToAllocate > 0 && weekOrder.length > 0) {
        const fallbackKey = weekOrder[Math.min(currentWeekIdx, weekOrder.length - 1)];
        distribution[fallbackKey] = (distribution[fallbackKey] || 0) + jpToAllocate;
      }

      result.push({
        id: existingMatch?.id || `promes-${pItem.id.replace('prota-', '')}`,
        semester: sem,
        babNumber: pItem.babNumber,
        babTitle: formattedBabTitle,
        materiPembelajaran: pItem.materiPembelajaran || pItem.babTitle,
        tpCode: pItem.tpCode,
        tpDescription: pItem.tpDescription,
        alokasiJp: pItem.alokasiJp,
        distribution,
      });
    });
  });

  return result;
}

/**
 * Formats a human-readable summary of allocated weeks in PROMES (e.g. "Jul M3-M4, Agu M1-M3 (5 Pekan)")
 */
export function formatPromesWeekSummary(distribution?: { [weekKey: string]: number }): string {
  if (!distribution) return 'Belum terjadwal di PROMES';
  const activeEntries = Object.entries(distribution).filter(([, jp]) => Number(jp) > 0);
  if (activeEntries.length === 0) return 'Belum terjadwal di PROMES';

  const byMonth: Record<string, number[]> = {};
  activeEntries.forEach(([key]) => {
    const [m, w] = key.split('-');
    const wNum = parseInt(w, 10);
    if (m && !isNaN(wNum)) {
      if (!byMonth[m]) byMonth[m] = [];
      byMonth[m].push(wNum);
    }
  });

  const parts = Object.entries(byMonth).map(([m, weeks]) => {
    weeks.sort((a, b) => a - b);
    if (weeks.length === 1) return `${m} M${weeks[0]}`;
    return `${m} M${weeks[0]}–M${weeks[weeks.length - 1]}`;
  });

  return `${parts.join(', ')} (${activeEntries.length} Pekan)`;
}

/**
 * Retrieves official synchronized sub-chapters for a given subject, grade, and babNumber from the textbook catalog
 */
export function getSyncedSubChaptersForBab(
  subject: string,
  grade: string,
  babNumber: number
): string[] {
  const m = (subject || '').toLowerCase();
  const k = (grade || '').toLowerCase();

  let chapters: { kodeBab: string; subBab: string[] }[] = [];

  if (m.includes('indo') || m.includes('bahasa indonesia')) {
    if (k.includes('11') || k.includes('xi')) {
      chapters = [
        { kodeBab: 'Bab 1', subBab: ['1.1 Menggali Nilai Sejarah dalam Cerita Pendek / Novel Sejarah', '1.2 Analisis Unsur Intrinsik & Ekstrinsik Teks Fiksi Sejarah', '1.3 Nilai Sosial & Budaya dalam Latar Sejarah', '1.4 Menulis Cerita Sejarah Pribadi / Kreatif', '1.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 1'] },
        { kodeBab: 'Bab 2', subBab: ['2.1 Menguak Fakta & Opini dalam Artikel Ilmiah Populer', '2.2 Struktur Penulisan Artikel & Kaidah Bahasa', '2.3 Analisis Argumen & Sudut Pandang Penulis', '2.4 Menulis & Memublikasikan Artikel Opini', '2.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 2'] },
        { kodeBab: 'Bab 3', subBab: ['3.1 Menyusun Kritik Sastra & Esai Pujian/Kritik', '3.2 Menganalisis Pandangan Pengarang dalam Karya Sastra', '3.3 Evaluasi Estetika & Nilai Buku', '3.4 Praktik Diskusi Panel & Resensi Buku', '3.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 3'] },
        { kodeBab: 'Bab 4', subBab: ['4.1 Merancang Proposal Kegiatan Ilmiah / Bakti Sosial', '4.2 Sistematika & Kebahasaan Proposal', '4.3 Anggaran Biaya & Jadwal Kegiatan Proposal', '4.4 Presentasi & Pertahanan Proposal', '4.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 4'] },
        { kodeBab: 'Bab 5', subBab: ['5.1 Menelusuri Nilai Kehidupan dalam Drama Modern', '5.2 Karakter Tokoh & Konflik Dramatik', '5.3 Pementasan & Apresiasi Pementasan Drama', '5.4 Kritik Pertunjukan Teater', '5.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 5'] },
        { kodeBab: 'Bab 6', subBab: ['6.1 Sistematika & Struktur Karya Ilmiah', '6.2 Ragam Bahasa & Kutipan Ilmiah (Catatan Kaki & Daftar Pustaka)', '6.3 Teknik Penyusunan Instrumen & Data Penelitian', '6.4 Menulis & Mempresentasikan Karya Ilmiah Konservasi', '6.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 6'] },
      ];
    } else if (k.includes('12') || k.includes('xii')) {
      chapters = [
        { kodeBab: 'Bab 1', subBab: ['1.1 Menemukan Informasi Akurat tentang Tokoh Sastra', '1.2 Kaidah Ejaan, Tanda Baca & Kalimat Efektif', '1.3 Refleksi Perjalanan Hidup Tokoh Inspiratif', '1.4 Menyajikan Infografik & Narasi Tokoh', '1.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 1'] },
        { kodeBab: 'Bab 2', subBab: ['2.1 Memahami Teks Prosedur Kompleks & Proposal Usaha', '2.2 Kosakata Baru Bidang Kewirausahaan & Digital', '2.3 Strategi Pemasaran & Perhitungan Usaha', '2.4 Presentasi Ide Wirausaha Kreatif', '2.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 2'] },
        { kodeBab: 'Bab 3', subBab: ['3.1 Mengulik Informasi Teks Eksplanasi & Teknologi AI', '3.2 Tanggapan Kritis & Etika Penggunaan AI', '3.3 Analisis Dampak Sosial Perkembangan Teknologi', '3.4 Diskusi Panel & Menulis Esai Fenomena AI', '3.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 3'] },
        { kodeBab: 'Bab 4', subBab: ['4.1 Mengungkap Fakta dan Opini dalam Artikel', '4.2 Menganalisis Tajuk Rencana / Editorial', '4.3 Investigasi Isu Aktual di Masyarakat', '4.4 Kampanye Anti-Perundungan & Esai Opini', '4.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 4'] },
        { kodeBab: 'Bab 5', subBab: ['5.1 Menelusuri Nilai Kearifan Lokal dalam Novel & Cerita', '5.2 Kaidah Kebahasaan Teks Narasi & Deskripsi', '5.3 Pelestarian Budaya Lokal Melalui Sastra', '5.4 Menulis Esai & Antologi Kearifan Lokal', '5.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 5'] },
        { kodeBab: 'Bab 6', subBab: ['6.1 Menyimak & Membaca Kisah Praktik Baik Lingkungan', '6.2 Penyuntingan Naskah & Publikasi Buku', '6.3 Strategi Pengelolaan Lingkungan Berkelanjutan', '6.4 Proyek Penulisan Buku Antologi Kelas XII', '6.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 6'] },
      ];
    } else {
      chapters = [
        { kodeBab: 'Bab 1', subBab: ['1.1 Memahami Informasi Teks Laporan Hasil Observasi (LHO)', '1.2 Struktur & Kaidah Kebahasaan Teks LHO', '1.3 Analisis Objek & Sumber Rujukan Observasi', '1.4 Menulis & Mempresentasikan Laporan Hasil Observasi', '1.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 1'] },
        { kodeBab: 'Bab 2', subBab: ['2.1 Mengevaluasi Gagasan Teks Anekdot & Humor', '2.2 Kritik Sosial dalam Anekdot & Komik Strip', '2.3 Kaidah Bahasa & Retorika Teks Anekdot', '2.4 Menampilkan Lawakan Tunggal (Stand Up Comedy)', '2.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 2'] },
        { kodeBab: 'Bab 3', subBab: ['3.1 Karakteristik & Nilai-Nilai dalam Hikayat', '3.2 Unsur Intrinsik & Kebahasaan Cerita Rakyat', '3.3 Alih Wahana Hikayat ke Cerpen Modern', '3.4 Publikasi & Pameran Karya Fiksi', '3.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 3'] },
        { kodeBab: 'Bab 4', subBab: ['4.1 Faktor Penentu Keberhasilan Negosiasi', '4.2 Surat Penawaran & Struktur Negosiasi Bisnis', '4.3 Taktik Negosiasi Persuasif & Sengketa Kepentingan', '4.4 Praktik Bermain Peran Negosiasi Wirausaha', '4.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 4'] },
        { kodeBab: 'Bab 5', subBab: ['5.1 Ide Pokok & Keteladanan Tokoh Biografi', '5.2 Analisis Karakter, Perjuangan & Hambatan Tokoh', '5.3 Kaidah Kebahasaan Teks Biografi', '5.4 Menulis Biografi & Infografik Tokoh', '5.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 5'] },
        { kodeBab: 'Bab 6', subBab: ['6.1 Diksi, Majas, dan Citraan dalam Puisi', '6.2 Resensi & Apresiasi Antologi Puisi', '6.3 Musikalisasi & Deklamasi Puisi', '6.4 Publikasi Kreatif Puisi Nusantara', '6.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 6'] },
      ];
    }
  } else if (m.includes('matematika')) {
    chapters = [
      { kodeBab: 'Bab 1', subBab: ['1.1 Sifat-Sifat Eksponen & Fungsi Eksponensial', '1.2 Bentuk Akar & Merasionalkan Penyebut', '1.3 Konsep & Sifat Logaritma Terapan', '1.4 Pemodelan Persamaan Eksponen & Logaritma', '1.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 1'] },
      { kodeBab: 'Bab 2', subBab: ['2.1 Barisan & Deret Aritmetika', '2.2 Barisan & Deret Geometri', '2.3 Deret Geometri Tak Hingga & Bunga Majemuk', '2.4 Penerapan Finansial Barisan & Deret', '2.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 2'] },
      { kodeBab: 'Bab 3', subBab: ['3.1 Sistem Persamaan Linear Tiga Variabel (SPLTV)', '3.2 Sistem Pertidaksamaan Linear Dua Variabel', '3.3 Pemodelan Matematika Kontekstual & Program Linear', '3.4 Metode Optimum Penyelesaian Masalah', '3.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 3'] },
      { kodeBab: 'Bab 4', subBab: ['4.1 Ukuran Sudut & Rasio Trigonometri Segitiga Siku-Siku', '4.2 Sudut Istimewa & Identitas Dasar Trigonometri', '4.3 Aturan Sinus & Cosinus', '4.4 Aplikasi Trigonometri dalam Pengukuran Vokasi', '4.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 4'] },
      { kodeBab: 'Bab 5', subBab: ['5.1 Karakteristik Grafik Fungsi Kuadrat', '5.2 Rekonstruksi Persamaan Fungsi Kuadrat', '5.3 Diskriminan & Titik Ekstrem', '5.4 Penyelesaian Masalah Optimasi Kontekstual', '5.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 5'] },
      { kodeBab: 'Bab 6', subBab: ['6.1 Ukuran Pemusatan & Letak Data Berkelompok', '6.2 Ukuran Penyebaran Data (Simpangan & Varians)', '6.3 Peluang Kejadian Majemuk & Bersyarat', '6.4 Analisis Statistika Deskriptif Data Vokasi', '6.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 6'] },
    ];
  } else if (m.includes('informatika') || m.includes('komputer')) {
    chapters = [
      { kodeBab: 'Bab 1', subBab: ['1.1 Pencarian (Searching) & Pengurutan (Sorting)', '1.2 Tumpukan (Stack) & Antrean (Queue)', '1.3 Graf & Pohon Keputusan (Tree)', '1.4 Dekomposisi & Algoritma Pemecahan Masalah Vokasi', '1.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 1'] },
      { kodeBab: 'Bab 2', subBab: ['2.1 Integrasi Aplikasi Perkantoran & Cloud Computing', '2.2 Keamanan Siber, Enkripsi & Jejak Digital', '2.3 Etika & Legalitas Kecerdasan Artifisial (AI)', '2.4 Kolaborasi Berbasis Jaringan Cloud', '2.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 2'] },
      { kodeBab: 'Bab 3', subBab: ['3.1 Arsitektur Perangkat Keras & Sistem Operasi', '3.2 Topologi Jaringan, IP Address & Routing Dasar', '3.3 Konfigurasi Konektivitas Jaringan & IoT', '3.4 Troubleshooting Perangkat & Jaringan', '3.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 3'] },
      { kodeBab: 'Bab 4', subBab: ['4.1 Pengumpulan & Pembersihan Data (Data Cleaning)', '4.2 Pengolahan Data Tabel, Pivot & Grafik', '4.3 Visualisasi Data Interaktif', '4.4 Interpretasi Data Berbasis Projek Industri', '4.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 4'] },
      { kodeBab: 'Bab 5', subBab: ['5.1 Diagram Alir (Flowchart) & Pseudocode', '5.2 Percabangan, Perulangan & Modularisasi Fungsi', '5.3 Pengujian & Debugging Kode Program', '5.4 Pengembangan Aplikasi Mini Berbasis Vokasi', '5.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 5'] },
      { kodeBab: 'Bab 6', subBab: ['6.1 Perencanaan & Desain Solusi Digital (UI/UX)', '6.2 Implementasi Kode & Pengujian Sistem', '6.3 Presentasi & Dokumentasi Teknis Projek', '6.4 Evaluasi & Pemeliharaan Perangkat Lunak', '6.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 6'] },
    ];
  } else if (m.includes('inggris')) {
    chapters = [
      { kodeBab: 'Bab 1', subBab: ['1.1 Listening & Speaking: Describing People/Places', '1.2 Reading Descriptive Texts & Specific Details', '1.3 Grammar in Context: Adjectives & Simple Present', '1.4 Writing & Presenting Professional Profiles', '1.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 1'] },
      { kodeBab: 'Bab 2', subBab: ['2.1 Past Experiences & Chronological Events', '2.2 Analyzing Structure of Recount Text', '2.3 Past Tense & Time Connectors', '2.4 Writing Personal/Factual Recount Reports', '2.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 2'] },
      { kodeBab: 'Bab 3', subBab: ['3.1 Imperatives & Action Verbs in Instructions', '3.2 Reading Manuals, SOPs & Operating Guides', '3.3 Vocabulary Building for Workplace Safety', '3.4 Presenting Vocational Procedures', '3.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 3'] },
      { kodeBab: 'Bab 4', subBab: ['4.1 Expressing Opinions, Agreement & Arguments', '4.2 Evaluating Analytical Exposition Texts', '4.3 Connectors of Cause, Effect & Contrast', '4.4 Drafting Persuasive Vocational Essays', '4.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 4'] },
      { kodeBab: 'Bab 5', subBab: ['5.1 Exploring Pros, Cons & Global Issues', '5.2 Critical Reading of Multimodal Texts', '5.3 Argumentative Language Expressions', '5.4 Group Debate & Structured Presentation', '5.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 5'] },
      { kodeBab: 'Bab 6', subBab: ['6.1 Intrinsic Elements of Narrative Stories', '6.2 Moral Values & Character Analysis', '6.3 Narrative Tenses & Direct/Indirect Speech', '6.4 Creative Digital Storytelling & Performance', '6.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 6'] },
    ];
  } else if (m.includes('ekonomi')) {
    chapters = [
      { kodeBab: 'Bab 1', subBab: ['1.1 Pengertian Ilmu Ekonomi, Pembagian Ilmu Ekonomi & Masalah Kelangkaan', '1.2 Kebutuhan Manusia, Skala Prioritas & Biaya Peluang (Opportunity Cost)', '1.3 Literasi Keuangan, Pengelolaan Anggaran Pribadi & Prinsip Ekonomi', '1.4 Menganalisis Biaya Peluang dalam Pengambilan Keputusan Ekonomi Sehari-hari', '1.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 1'] },
      { kodeBab: 'Bab 2', subBab: ['2.1 Masalah Pokok Ekonomi Klasik & Modern (What, How, For Whom)', '2.2 Analisis Sistem Ekonomi Tradisional, Komando, Pasar, dan Campuran', '2.3 Karakteristik Sistem Ekonomi Pancasila Berdasarkan UUD 1945 Pasal 33', '2.4 Studi Komparatif Efektivitas Sistem Ekonomi dalam Menyejahterakan Masyarakat', '2.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 2'] },
      { kodeBab: 'Bab 3', subBab: ['3.1 Peran Pelaku Ekonomi (RTK, RTP, RTG/Pemerintah, dan Masyarakat Luar Negeri)', '3.2 Diagram Alir Lingkar Kegiatan Ekonomi (Circular Flow Diagram 2, 3, dan 4 Sektor)', '3.3 Hukum Permintaan, Penawaran, Fungsi Permintaan/Penawaran & Elastisitas Harga', '3.4 Terbentuknya Harga Keseimbangan Pasar (Equilibrium) & Struktur Pasar di Indonesia', '3.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 3'] },
      { kodeBab: 'Bab 4', subBab: ['4.1 Peran, Tugas, Wewenang & Fungsi Otoritas Jasa Keuangan (OJK)', '4.2 Perbankan Konvensional dan Syariah (Fungsi Intermediasi, Produk Tabungan & Kredit)', '4.3 Pasar Modal (Bursa Efek Indonesia), Saham, Obligasi, Reksadana & Investasi Legal', '4.4 Perasuransian, Lembaga Pembiayaan, Dana Pensiun, Pegadaian & Waspada FinTech Ilegal', '4.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 4'] },
      { kodeBab: 'Bab 5', subBab: ['5.1 Kedudukan, Tujuan, Tugas & Wewenang Bank Indonesia (BI) sebagai Bank Sentral', '5.2 Konsep Sistem Pembayaran Tunai & Nontunai (BI-FAST, RTGS, Kliring SKNBI)', '5.3 Sejarah Uang, Syarat, Fungsi Asli & Turunan Uang serta Pengelolaan Uang Rupiah (PUR)', '5.4 Alat Pembayaran Digital, Uang Elektronik, Transaksi QRIS & Keamanan Finansial', '5.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 5'] },
      { kodeBab: 'Bab 6', subBab: ['6.1 Badan Usaha Milik Negara (BUMN), BUMD, dan Badan Usaha Milik Swasta (BUMS)', '6.2 Prinsip, Asas, Jenis & Perhitungan Sisa Hasil Usaha (SHU) Koperasi Indonesia', '6.3 Konsep Manajemen: Fungsi Manajemen (POAC), Unsur 6M & Bidang-Bidang Manajemen', '6.4 Perencanaan Usaha Kreatif Siswa, Business Model Canvas (BMC) & Kewirausahaan Vokasi', '6.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 6'] },
    ];
  } else {
    chapters = [
      { kodeBab: 'Bab 1', subBab: [`1.1 Hakikat, Konsep & Prinsip Dasar ${subject}`, '1.2 Identifikasi Fenomena Kontekstual & Studi Kasus', '1.3 Keterampilan Proses, Eksperimen & Observasi Awal', '1.4 Pengorganisasian Data & Analisis Temuan', '1.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 1'] },
      { kodeBab: 'Bab 2', subBab: ['2.1 Klasifikasi, Taksonomi & Struktur Materi Esensial', '2.2 Eksplorasi Data Mendalam dan Studi Kasus Industri', '2.3 Sintesis Informasi & Pemecahan Masalah Kontekstual', '2.4 Diskusi Bermakna (Meaningful Dialogue) & Presentasi', '2.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 2'] },
      { kodeBab: 'Bab 3', subBab: ['3.1 Prosedur Kerja Standar & Pemecahan Masalah Kompleks', '3.2 Integrasi Literasi, Numerasi & Profil Pelajar Pancasila', '3.3 Simulasi Penerapan Konsep dalam Kejuruan', '3.4 Evaluasi Kinerja, Refleksi & Umpan Balik', '3.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 3'] },
      { kodeBab: 'Bab 4', subBab: ['4.1 Analisis Sistem, Variabel & Hubungan Sebab-Akibat', '4.2 Pemanfaatan Teknologi, Alat Ukur & Perangkat Pendukung', '4.3 Eksperimen, Simulasi & Praktikum Terbimbing', '4.4 Penyusunan Laporan Praktik Kerja Lapangan', '4.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 4'] },
      { kodeBab: 'Bab 5', subBab: ['5.1 Perencanaan Projek Berbasis Masalah (PjBL) & Desain Solusi', '5.2 Pelaksanaan, Kolaborasi & Monitoring Projek Kelompok', '5.3 Pengujian Prototype / Hasil Karya Nyata', '5.4 Refleksi Kinerja & Umpan Balik Konstruktif', '5.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 5'] },
      { kodeBab: 'Bab 6', subBab: ['6.1 Gelar Karya / Presentasi Hasil Projek (Joyful Learning)', '6.2 Asesmen Sumatif Akhir Semester & Portofolio', '6.3 Refleksi Pencapaian Kompetensi & Rencana Tindak Lanjut', '6.4 Pengayaan Materi & Persiapan Asesmen Tingkat lanjut', '6.5 Ulangan Harian (UH) & Asesmen Sumatif Bab 6'] },
    ];
  }

  const match = chapters.find(
    (c) => c.kodeBab.toLowerCase() === `bab ${babNumber}` || c.kodeBab.toLowerCase().includes(`bab ${babNumber}`)
  );
  if (match && match.subBab) {
    return match.subBab;
  }
  return [
    `${babNumber}.1 Konsep Utama & Prinsip Dasar ${subject}`,
    `${babNumber}.2 Analisis Kontekstual & Studi Kasus Terapan`,
    `${babNumber}.3 Eksplorasi Keterampilan Proses Vokasi`,
    `${babNumber}.4 Praktik Terbimbing & Pemecahan Masalah`,
    `${babNumber}.5 Ulangan Harian (UH) & Asesmen Sumatif Bab ${babNumber}`
  ];
}

export function getCompleteBookSourceString(profile: SchoolProfile, customBookTitle?: string): string {
  if (customBookTitle) {
    return `Sumber Buku Resmi: ${customBookTitle}, KepKa BSKAP No. 046/H/KR/2025`;
  }
  const mapel = profile.subject || 'Mata Pelajaran';
  const kelas = profile.grade || 'X';
  const fase = profile.fase || 'E';
  const isMadrasah = (profile.schoolName || '').toLowerCase().includes('madrasah') || (profile.schoolName || '').toLowerCase().includes('mts') || (profile.schoolName || '').toLowerCase().includes('ma ');
  if (isMadrasah) {
    return `Sumber Buku Resmi: Buku Teks Utama KMA / Kurikulum Merdeka Madrasah (${mapel} Kelas ${kelas} Fase ${fase}), Penerbit: Direktorat KSKK Madrasah Kementerian Agama RI & Pusat Perbukuan BSKAP Kemendikdasmen RI (SIBI buku.kemendikdasmen.go.id), KepKa BSKAP No. 046/H/KR/2025`;
  }
  return `Sumber Buku Resmi: Buku Teks Utama Kurikulum Merdeka Edisi Revisi (${mapel} Kelas ${kelas} Fase ${fase}), Penerbit: Pusat Perbukuan Badan Standar, Kurikulum, dan Asesmen Pendidikan (BSKAP) Kementerian Pendidikan Dasar dan Menengah RI (Akses SIBI: buku.kemendikdasmen.go.id), ISBN: 978-602-244-325-4, KepKa BSKAP No. 046/H/KR/2025`;
}

/**
 * Normalizes Modul Ajar into official Kemendikdasmen Deep Learning Template format (from reference photos)
 */
export function ensureOfficialKemendikdasmenModul(modul: any, profile: SchoolProfile) {
  const subChapters = getSyncedSubChaptersForBab(profile.subject, profile.grade, modul.babNumber);
  const bookSource = getCompleteBookSourceString(profile);

  // A. INFORMASI UMUM
  const informasiUmum = {
    namaSekolah: profile.schoolName || 'SMK MA\'ARIF 1 SENDANG AGUNG',
    namaGuru: profile.teacherName || 'Nanang Arifin, S.Pd.',
    mataPelajaran: profile.subject,
    kelasFase: `${profile.grade} / Fase ${profile.fase}`,
    semester: `Semester ${modul.semester || profile.semester || 1}`,
    tahunPelajaran: profile.academicYear || '2026/2027',
    alokasiWaktu: `${modul.alokasiJp || 18} JP (${modul.pertemuanCount || 6} Pertemuan)`,
    tanggalPenyusunan: modul.tanggalPenyusunan || '14 Oktober 2026',
    sumberCp: `Dokumen BSKAP Kemendikdasmen, Fase ${profile.fase} (${bookSource})`,
  };

  // B. IDENTIFIKASI
  const identifikasi = {
    kesiapanAwal: modul.identifikasi?.kesiapanAwal || 'Dari 36 siswa, 24 sudah memahami konsep dasar, 8 masih perlu pendampingan, 4 siap materi pendampingan/pengayaan.',
    gayaBelajar: modul.identifikasi?.gayaBelajar || 'Guru memperhatikan gaya belajar (visual, auditori, kinestetik) dan menerapkan diferensiasi sesuai kebutuhan.',
    materiFaktual: modul.identifikasi?.materiFaktual || `Terminologi, istilah, fakta, dan data konkret yang relevan dengan topik ${profile.subject} Bab ${modul.babNumber}.`,
    materiKonseptual: modul.identifikasi?.materiKonseptual || `Prinsip, teori, dan hubungan antar konsep yang membentuk pemahaman mendalam tentang ${modul.babTitle}.`,
    materiProsedural: modul.identifikasi?.materiProsedural || `Langkah-langkah sistematis dan teknik spesifik dalam ${profile.subject} yang perlu dikuasai peserta didik.`,
    materiMetakognitif: modul.identifikasi?.materiMetakognitif || `Strategi belajar mandiri dan evaluasi diri terhadap hasil belajar dalam konteks ${profile.subject}.`,
    pesertaDidik: modul.identifikasi?.pesertaDidik || 'Identifikasi kesiapan peserta didik mencakup pengetahuan awal, minat belajar, latar belakang, dan gaya belajar.',
    materiPelajaran: modul.identifikasi?.materiPelajaran || `Analisis materi ${profile.subject} Bab ${modul.babNumber} mencakup jenis pengetahuan faktual, konseptual, prosedural, dan metakognitif.`,
    dimensiProfilLulusan: modul.identifikasi?.dimensiProfilLulusan || ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian', 'Kreativitas', 'Komunikasi', 'Keimanan dan Ketakwaan terhadap Tuhan YME'],
  };

  // C. DESAIN PEMBELAJARAN
  const desainPembelajaran = {
    capaianPembelajaran: modul.desainPembelajaran?.capaianPembelajaran || `Pemahaman terhadap materi ${profile.subject} meliputi definisi dan konsep yang dikaitkan dengan fenomena dan masalah ekonomi/kontekstual yang terjadi.`,
    tujuanPembelajaran: modul.desainPembelajaran?.tujuanPembelajaran && modul.desainPembelajaran.tujuanPembelajaran.length > 0
      ? modul.desainPembelajaran.tujuanPembelajaran
      : (modul.tujuanPembelajaran ? modul.tujuanPembelajaran : [`Memahami masalah ${profile.subject} dan menyelesaikannya secara bertanggung jawab melalui sikap kritis, inovatif, dan kreatif.`]),
    lintasDisiplinIlmu: modul.desainPembelajaran?.lintasDisiplinIlmu || `Interdisipliner: ${profile.subject}, Matematika, IPS, PKn, Geografi, Informatika.`,
    modelPembelajaran: modul.desainPembelajaran?.modelPembelajaran || modul.modelPembelajaran || 'Problem Based Learning (PBL) dipadukan dengan Pembelajaran Berbasis Proyek (PjBL) & Deep Learning.',
    metodePembelajaran: modul.desainPembelajaran?.metodePembelajaran || 'Diskusi Kelompok, Tanya Jawab, Presentasi.',
    saranaPrasarana: modul.desainPembelajaran?.saranaPrasarana || modul.saranaPrasarana || 'PID | Laptop | Gawai / Smartphone | LKPD (Lembar Kerja Peserta Didik) | Whiteboard & Spidol',
    targetPesertaDidik: modul.desainPembelajaran?.targetPesertaDidik || modul.targetPesertaDidik || 'Murid Reguler / Umum',
    kemitraanPembelajaran: modul.desainPembelajaran?.kemitraanPembelajaran || 'Orang tua/wali sebagai mitra pendampingan di rumah; komunitas lokal sebagai sumber belajar kontekstual; narasumber terkait untuk menghubungkan materi dengan dunia nyata.',
    lingkunganFisik: modul.desainPembelajaran?.lingkunganFisik || 'Ruang kelas tertata mendukung kolaborasi. LKPD (Lembar Kerja Peserta Didik), Whiteboard & Spidol.',
    lingkunganVirtual: modul.desainPembelajaran?.lingkunganVirtual || 'PID, Laptop, Gawai / Smartphone, Platform LMS.',
    lingkunganBudaya: modul.desainPembelajaran?.lingkunganBudaya || 'Suasana kelas yang aman, inklusif, dan mendorong pertumbuhan (growth mindset).',
    praktikPedagogis: modul.desainPembelajaran?.praktikPedagogis || 'Problem Based Learning (PBL) & Deep Learning',
    lingkunganPembelajaran: modul.desainPembelajaran?.lingkunganPembelajaran || 'Fisik: Ruang kelas kolaboratif, LKPD | Virtual: PID & Gawai | Budaya: Suasana aman & Growth Mindset',
    pemanfaatanDigital: modul.desainPembelajaran?.pemanfaatanDigital || 'PID, Laptop, Gawai / Smartphone, Video Kasus Interaktif, e-learning LMS, aplikasi penilaian online.',
  };

  // D. PETA PENGALAMAN BELAJAR
  const petaPengalamanBelajar = modul.petaPengalamanBelajar || [
    {
      tahap: '1. Memahami',
      deskripsi: `Peserta didik terlibat langsung mengamati fenomena/kasus terkait ${profile.subject}, difasilitasi pertanyaan pemantik untuk membangun pemahaman awal terhadap tujuan pembelajaran "memahami masalah ${profile.subject} dan menyelesaikannya secara bertanggung jawab...".`,
    },
    {
      tahap: '2. Mengaplikasikan',
      deskripsi: `Melalui Problem Based Learning (PBL), peserta didik menerapkan konsep pada tantangan kontekstual secara kolaboratif untuk mencapai tujuan pembelajaran tersebut.`,
    },
    {
      tahap: '3. Merefleksi',
      deskripsi: `Peserta didik menuliskan refleksi singkat tentang apa yang dipahami dan apa yang masih membingungkan, lalu melakukan teach-back kepada teman sebaya.`,
    },
  ];

  // E. LANGKAH-LANGKAH PEMBELAJARAN
  const pengalamanBelajar = {
    kegiatanAwal: {
      prinsip: modul.pengalamanBelajar?.kegiatanAwal?.prinsip || 'Pendahuluan (±15 Menit) - Berkesadaran, Bermakna, Menggembirakan',
      deskripsi: modul.pengalamanBelajar?.kegiatanAwal?.deskripsi || [
        'Guru membuka kelas dengan salam, doa, dan presensi sambil memperhatikan kondisi emosional peserta didik.',
        'Kesepakatan kelas, sesi check-in emosional singkat: "Dengan kata atau simbol apa kalian menggambarkan kondisi belajar hari ini?"',
        'Guru menyampaikan tujuan pembelajaran: "memahami masalah ' + profile.subject + ' dan menyelesaikannya secara bertanggung jawab melalui sikap kritis, inovatif, dan kreatif".',
        'Guru mengajukan pertanyaan pemantik untuk memancing rasa ingin tahu peserta didik terhadap topik hari ini:',
        '1. Dari mana asal barang atau jasa yang kita gunakan setiap hari?',
        '2. Apa yang terjadi jika tidak ada kegiatan produksi?',
        '3. Apa perbedaan antara membuat barang dan memberikan jasa?',
      ],
    },
    kegiatanInti: {
      prinsip: modul.pengalamanBelajar?.kegiatanInti?.prinsip || 'Kegiatan Inti (Mengikuti Urutan Siklus D)',
      memahami: {
        prinsip: 'Tahap 1 — Memahami',
        deskripsi: modul.pengalamanBelajar?.kegiatanInti?.memahami?.deskripsi || [
          'Guru membentuk kelompok fleksibel terdiri dari 4-7 murid (maksimal 7 peserta didik per kelompok, total hingga 36 siswa per kelas), menggunakan aplikasi spin atau berdasarkan peta kesiapan.',
          'Murid diarahkan mengamati video kasus/masalah terkait kegiatan pembelajaran.',
          'Guru memastikan setiap kelompok memahami isi kasus dan setiap kelompok menentukan pembagian peran pada saat diskusi dan presentasi.',
          'Guru membagikan LKPD.',
          'Guru menyampaikan bahwa "Kesulitan yang kalian temukan bukan tanda bahwa kalian tidak mampu. Kesulitan membantu kalian menentukan strategi belajar yang tepat. Kalian boleh menulis \'belum memahami\' karena dari situlah proses perbaikan dimulai."',
          ...subChapters.slice(0, 2).map((s: string, i: number) => `Menganalisis dan memahami sub-materi 1.${i + 1}: ${s}`),
        ],
      },
      mengaplikasi: {
        prinsip: 'Tahap 2 — Mengaplikasikan',
        deskripsi: modul.pengalamanBelajar?.kegiatanInti?.mengaplikasi?.deskripsi || [
          'Murid mendiskusikan kasus dan menjawab pertanyaan yang ada di LKPD.',
          'Murid bekerjasama dengan penuh tanggung jawab dalam diskusi.',
          'Guru berkeliling & membimbing siswa dalam menganalisis masalah serta memberikan bantuan kepada kelompok yang memerlukan pendampingan.',
          'Guru secara acak menunjuk perwakilan kelompok untuk membacakan hasil diskusi, kelompok lain memberikan tanggapan berupa "hal yang sudah baik dan saran perbaikan".',
          'Guru mengarahkan murid agar memberikan umpan balik terhadap ide, strategi, bukti, dan proses kerja, bukan memberikan label kepada individu.',
          'Contoh umpan balik yang dianjurkan: "Alasan kalian sudah menghubungkan bahan baku dengan biaya produksi", "Strategi kalian akan lebih kuat jika disertai alasan mengenai biaya."',
          ...subChapters.slice(2, 4).map((s: string, i: number) => `Mengaplikasikan kompetensi pada kegiatan 2.${i + 1}: ${s}`),
        ],
      },
      merefleksi: {
        prinsip: 'Tahap 3 — Merefleksi',
        deskripsi: modul.pengalamanBelajar?.kegiatanInti?.merefleksi?.deskripsi || [
          'Beberapa murid melakukan teach-back, yaitu menjelaskan kembali konsep kegiatan kepada teman menggunakan bahasa mereka sendiri.',
          'Pola teach-back: "Menurut saya, kegiatan ini dipengaruhi oleh ... karena ... . Jika salah satu faktor mengalami masalah, maka ... . Oleh karena itu, kita perlu ... ."',
          'Guru bersama murid menyimpulkan bahwa kegiatan dipengaruhi oleh ketersediaan bahan baku, tenaga kerja, modal, teknologi, kewirausahaan, efisiensi.',
          'Metode yang digunakan sepanjang kegiatan inti: Diskusi Kelompok, Tanya Jawab, Presentasi.',
        ],
      },
    },
    kegiatanPenutup: {
      prinsip: modul.pengalamanBelajar?.kegiatanPenutup?.prinsip || 'Penutup (±10 Menit)',
      deskripsi: modul.pengalamanBelajar?.kegiatanPenutup?.deskripsi || [
        'Guru memandu refleksi akhir, merangkum poin penting bersama murid.',
        'Guru menyampaikan gambaran materi pertemuan berikutnya.',
        'Guru menutup pembelajaran dan salam.',
      ],
    },
  };

  // F. ASESMEN PEMBELAJARAN
  const asesmenPembelajaran = {
    assessmentAsLearning: modul.asesmenPembelajaran?.assessmentAsLearning || 'Penilaian Sejawat & Penilaian Diri (Refleksi Mandiri & Antarteman)',
    assessmentForLearning: modul.asesmenPembelajaran?.assessmentForLearning || 'Observasi Aktivitas Diskusi, Pertanyaan Lisan (Socratic), & Exit Ticket Formatif',
    assessmentOfLearning: modul.asesmenPembelajaran?.assessmentOfLearning || 'Tes Tertulis (PG & Esai HOTS), Penilaian Produk, & Portofolio Proyek',
    contohInstrumen: modul.asesmenPembelajaran?.contohInstrumen || [
      'Penilaian Sejawat',
      'Penilaian Diri',
      'Penilaian Proyek',
      'Penilaian Produk',
      'Observasi',
      'Portofolio',
      'Penilaian Berbasis Kelas',
      'Penilaian Kinerja',
      'Tes tertulis',
      'Tes lisan',
    ],
    // Asesmen Formatif F.1.a, F.1.b, F.1.c
    asesmenDiagnostikAwal: {
      pertanyaanPemantik: [
        '1. Sebelum mempelajari materi ini, dari mana asal barang atau jasa yang kita gunakan setiap hari?',
        '2. Apa yang terjadi jika tidak ada kegiatan produksi?',
        '3. Apa perbedaan antara membuat barang dan memberikan jasa?',
      ],
      caraPenilaian: 'Bersifat kualitatif dan tidak diberi skor angka. Guru membaca jawaban singkat peserta didik lalu memetakannya ke salah satu dari tiga kelompok kesiapan: Perlu Pendampingan, Reguler, atau Siap Pengayaan.',
      outputPenilaian: 'Peta kesiapan awal peserta didik (per kelompok), menjadi dasar pembentukan kelompok diferensiasi pada Kegiatan Inti.',
    },
    asesmenProsesRubrik: {
      teknik: 'Observasi aktif selama diskusi/kerja kelompok, pertanyaan lisan (teknik Socratic/cold calling), dan pengamatan keterlibatan peserta didik sepanjang Kegiatan Inti.',
      aspekList: [
        { aspek: 'Keterlibatan Aktif', sb: 'Selalu aktif, berinisiatif (4)', b: 'Sering aktif (3)', c: 'Kadang aktif jika diminta (2)', pb: 'Pasif (1)' },
        { aspek: 'Kemampuan Analisis', sb: 'Analisis mendalam & kritis (4)', b: 'Analisis logis (3)', c: 'Analisis dasar (2)', pb: 'Belum mampu mandiri (1)' },
        { aspek: 'Kolaborasi Tim', sb: 'Kontribusi aktif (4)', b: 'Bekerja sama baik (3)', c: 'Kontribusi minimal (2)', pb: 'Sulit bekerja tim (1)' },
      ],
      outputPenilaian: 'Checklist partisipasi per peserta didik dan catatan anekdotal guru selama kegiatan berlangsung — dipakai sebagai bahan umpan balik langsung, bukan nilai rapor.',
    },
    exitTicket: {
      pertanyaanRefleksi: [
        '1. Sebutkan 1 hal paling penting yang kamu pelajari hari ini tentang ' + profile.subject + '.',
        '2. Apakah ada bagian yang masih membingungkan? Jelaskan.',
        '3. Pada skala 1-4, seberapa yakin kamu sudah mencapai tujuan pembelajaran hari ini? (1 = belum sama sekali, 4 = sangat yakin)',
      ],
      caraPenilaian: 'Exit ticket dinilai cepat oleh guru sebagai indikator pemahaman mandiri peserta didik terhadap TP hari ini — bukan skor akademik formal.',
      outputPenilaian: 'Rekap sebaran skala pemahaman (1-4) seluruh kelas, menjadi dasar keputusan: melanjutkan ke topik berikutnya, atau melakukan pengulangan singkat di awal pertemuan berikutnya.',
    },
    pedomanPenskoranSumatif: {
      bobotPG: 'Pilihan Ganda (10 soal): 30% — Skor benar × 3, maks 30 poin.',
      bobotEsai: 'Esai (5 soal): 50% — Tiap soal maks 20 poin, mengukur analisis dan sintesis.',
      bobotProyekPortofolio: 'Portofolio/Proyek: 20% — Penilaian proses dan produk pembelajaran.',
      konversiNilai: 'Konversi Nilai: 90-100 = A | 80-89 = B | 70-79 = C | 60-69 = D | <60 = E',
    },
    remedialDanPengayaan: {
      remedial: 'Remedial: Re-teaching konsep kunci dengan pendekatan berbeda, tutor sebaya, dan latihan berjenjang dari LOTS menuju MOTS bagi peserta didik di bawah KKM.',
      pengayaan: 'Pengayaan: Proyek mandiri terkait ' + profile.subject + ', literatur lanjutan, atau partisipasi kompetisi bagi peserta didik yang telah mencapai KKM.',
    },
    rekapitulasiPenilaian: [
      { no: 1, nama: 'Aditya Pratama', catatanFormatif: 'Aktif, pemahaman baik', nilaiPG: 27, nilaiEsai: 45, nilaiAkhir: 92, predikat: 'A' },
      { no: 2, nama: 'Budi Santoso', catatanFormatif: 'Perlu pendampingan esai', nilaiPG: 21, nilaiEsai: 35, nilaiAkhir: 76, predikat: 'C' },
      { no: 3, nama: 'Citra Dewi', catatanFormatif: 'Sangat aktif & kritis', nilaiPG: 30, nilaiEsai: 48, nilaiAkhir: 98, predikat: 'A' },
    ],
  };

  // G. DIFERENSIASI PEMBELAJARAN
  const diferensiasiPembelajaran = modul.diferensiasiPembelajaran || {
    konten: 'Materi disajikan multimodal (teks, visual, audio/video) untuk mengakomodasi gaya belajar berbeda.',
    proses: 'Diferensiasi proses melalui pilihan kegiatan, tugas bertingkat, dan pengelompokan fleksibel sesuai kebutuhan.',
    produk: 'Peserta didik memilih bentuk produk sesuai minat: laporan tertulis, poster, video singkat, atau demonstrasi langsung.',
  };

  // H. LAMPIRAN
  const lampiran = modul.lampiran || {
    daftarPustaka: [
      `1. Kemendikdasmen. (2026). Panduan Pembelajaran Mendalam Kurikulum Merdeka. Jakarta: Badan Standar, Kurikulum, dan Asesmen Pendidikan.`,
      `2. Kemendikdasmen. (2026). Capaian Pembelajaran ${profile.subject} — Kurikulum Merdeka.`,
      `3. Platform Merdeka Mengajar (PMM). Modul Ajar dan Perangkat Pembelajaran ${profile.subject}. guru.kemdikbud.go.id`,
    ],
    lkpdSummary: `LKPD Terintegrasi: ${modul.babTitle}`,
    pascaObservasi: `Pasca Observasi & Catatan Tindak Lanjut: 1. Mengoptimalkan manajemen waktu, 2. Menekankan kesepakatan pembelajaran bersama peserta didik.`,
  };

  return {
    ...modul,
    informasiUmum,
    identifikasi,
    desainPembelajaran,
    petaPengalamanBelajar,
    pengalamanBelajar,
    asesmenPembelajaran,
    diferensiasiPembelajaran,
    lampiran,
  };
}

/**
 * Generates synchronized pipeline dataset (TP, Prota, Promes, Modul Ajar, LKPD) from a selected book item
 */
export function generateSyncedPipelineFromBook(
  book: {
    mapel: string;
    kelasDefault?: string;
    kelas?: string;
    faseCode?: string;
    faseLabel?: string;
    judulBuku?: string;
    pengarang?: string;
    penerbit?: string;
    elemenList?: string[];
    desc?: string;
    babList?: Array<{
      kodeBab: string;
      judulBab: string;
      subBab: string[];
      semester: 1 | 2;
      alokasiJp: number;
    }>;
  },
  profile: SchoolProfile,
  rpeState: RpeState
) {
  const mapelName = book.mapel || profile.subject || 'Bahasa Indonesia';
  const gradeStr = book.kelasDefault || book.kelas || profile.grade || 'Kelas 10';
  const gradeMatch = gradeStr.match(/\d+/);
  const gradeDigit = gradeMatch ? gradeMatch[0] : (gradeStr.includes('XI') ? '11' : gradeStr.includes('XII') ? '12' : '10');
  const faseCode = book.faseCode || profile.fase || 'E';

  // 0. Obtain Official BSKAP 046/H/KR/2025 & Permendikbudristek No. 12 Tahun 2024 CP Elements first
  const { cpElements: generatedCpElements } = getSubjectRasionalAndCpElements(
    mapelName,
    gradeStr,
    faseCode,
    book
  );

  // Calculate RPE Net JP per semester to align total JP if needed
  const s1Rpe = calculateRpeTotals(
    rpeState.semester1.months,
    rpeState.semester1.jpPerWeek,
    rpeState.semester1.cadanganJp
  );
  const s2Rpe = calculateRpeTotals(
    rpeState.semester2.months,
    rpeState.semester2.jpPerWeek,
    rpeState.semester2.cadanganJp
  );

  // 1. Get or build bab list
  let babs = book.babList || [];
  if (!babs || babs.length === 0) {
    const defaultBabs = [1, 2, 3, 4, 5, 6];
    const s1PerBab = Math.max(6, Math.round((s1Rpe.netJp || 54) / 3));
    const s2PerBab = Math.max(6, Math.round((s2Rpe.netJp || 54) / 3));
    babs = defaultBabs.map((num) => {
      const subs = getSyncedSubChaptersForBab(mapelName, gradeStr, num);
      let judulBab = `Materi Utama Bab ${num}: ${mapelName} ${gradeStr}`;
      if (mapelName.toLowerCase().includes('ekonomi')) {
        const ekoTitles = [
          'Konsep Dasar Ilmu Ekonomi, Kelangkaan & Skala Prioritas',
          'Masalah Pokok Ekonomi & Sistem Perekonomian',
          'Pelaku Ekonomi, Peran Pasar & Keseimbangan Harga',
          'Lembaga Jasa Keuangan dalam Perekonomian Indonesia',
          'Bank Sentral, Sistem Pembayaran & Alat Pembayaran (Uang & QRIS)',
          'Badan Usaha, Koperasi & Manajemen Kewirausahaan'
        ];
        judulBab = ekoTitles[num - 1] || judulBab;
      } else if (mapelName.toLowerCase().includes('indonesia')) {
        const indoTitles = [
          'Laporan Hasil Observasi (LHO) Objektif & Kritis',
          'Mengungkap Kritik Lewat Anekdot & Humor Cerdas',
          'Hikayat dan Cerpen Lintas Zaman Nusantara',
          'Teks Negosiasi Praktis dalam Dunia Kerja & Usaha',
          'Teks Biografi Tokoh Inspiratif & Teladan Bangsa',
          'Teks Puisi Modern & Pergelaran Estetika Bahasa'
        ];
        judulBab = indoTitles[num - 1] || judulBab;
      }
      const sem = (num <= 3 ? 1 : 2) as 1 | 2;
      return {
        kodeBab: `Bab ${num}`,
        judulBab,
        subBab: subs,
        semester: sem,
        alokasiJp: sem === 1 ? s1PerBab : s2PerBab,
      };
    });
  }

  // 2. Generate Tujuan Pembelajaran (CP & ATP) synchronized with Official BSKAP 046/2025 CP Elements
  const isEkonomi = mapelName.toLowerCase().includes('ekonomi');

  const newTpList: TujuanPembelajaran[] = babs.map((bab, idx) => {
    const babNum = idx + 1;
    const tpCode = `${gradeDigit}.${babNum}`;
    const sem = bab.semester || (babNum <= Math.ceil(babs.length / 2) ? 1 : 2);
    const subChapters = bab.subBab && bab.subBab.length > 0
      ? bab.subBab
      : getSyncedSubChaptersForBab(mapelName, gradeStr, babNum);

    const matchedElement =
      generatedCpElements[idx % generatedCpElements.length] ||
      generatedCpElements[0] || {
        id: 'el-default',
        name: `Pemahaman Konsep ${mapelName}`,
        deskripsi: `Peserta didik memahami dan menganalisis konsep esensial ${mapelName} sesuai KepKa BSKAP No. 046/H/KR/2025.`,
        kompetensi: ['Menganalisis konsep (C4)'],
        materi: [bab.judulBab],
        variasiKeterampilan: 'Penalaran kritis dan literasi terapan.',
      };

    if (isEkonomi && babNum === 1) {
      return {
        id: `tp-${babNum}`,
        code: tpCode,
        element: generatedCpElements[0]?.name || 'Pemahaman Konsep Ekonomi',
        description: 'Peserta didik mampu menghitung biaya peluang (opportunity cost) dari alternatif pilihan keputusan ekonomi dan menyusun rencana anggaran keuangan bulanan remaja secara rasional.',
        indikatorKinerja: '• Siswa dapat memecahkan soal studi kasus biaya peluang kuliah vs langsung bekerja dengan kalkulasi matematis tepat.',
        materiPokok: 'Kelangkaan Sumber Daya & Seni Mengelola Keuangan Pribadi',
        subMateri: '• Masalah pokok ekonomi klasik dan modern\n• Menghitung biaya peluang implicit vs explicit\n• Penyusunan skala prioritas 50/30/20 budget',
        profilPelajarPancasila: ['Bernalar Kritis', 'Mandiri'],
        rencanaAsesmen: 'Formatif: Latihan studi kasus anggaran; Sumatif: Tes tertulis perhitungan ekonomi',
        variasiKeterampilan: 'Kecakapan kalkulasi kuantitatif pasar dan literasi finansial cerdas.',
        bloomLevel: 'C3',
        hotsCategory: 'MOTS',
        jpAllocation: bab.alokasiJp || 18,
        semester: 1,
        babId: `bab-${babNum}`,
        kataKunci: ['Kelangkaan', 'Biaya Peluang', 'Skala Prioritas', 'Literasi Finansial'],
      };
    }

    if (isEkonomi && babNum === 2) {
      return {
        id: `tp-${babNum}`,
        code: tpCode,
        element: generatedCpElements[0]?.name || 'Pemahaman Konsep Ekonomi',
        description: 'Peserta didik dapat menghitung fungsi permintaan dan fungsi penawaran linier serta menggambarkan grafik titik keseimbangan pasar (Ekuilibrium) beserta dampaknya akibat pergeseran kurva.',
        indikatorKinerja: '• Siswa mampu menghitung harga keseimbangan pasar (P) dan jumlah keseimbangan (Q) dari dua fungsi linier dengan tepat.',
        materiPokok: 'Mekanisme Pasar: Hukum Permintaan, Penawaran, & Harga Keseimbangan',
        subMateri: '• Hukum permintaan & penawaran ceteris paribus\n• Perhitungan matematis fungsi P dan Q\n• Pengaruh pajak dan subsidi terhadap titik ekuilibrium',
        profilPelajarPancasila: ['Bernalar Kritis', 'Mandiri'],
        rencanaAsesmen: 'Formatif: Latihan kalkulasi fungsi kurva LKPD; Sumatif: Ujian tertulis analisis kurva pasar',
        variasiKeterampilan: 'Analisis kurva keseimbangan pasar dan komputasi fungsi matematis ekonomi.',
        bloomLevel: 'C4',
        hotsCategory: 'HOTS',
        jpAllocation: bab.alokasiJp || 18,
        semester: babs.length <= 2 ? 2 : (sem as 1 | 2),
        babId: `bab-${babNum}`,
        kataKunci: ['Hukum Permintaan', 'Penawaran', 'Ekuilibrium', 'Elastisitas'],
      };
    }

    const subBullets = subChapters.slice(0, 3).map((s) => `• ${s}`).join('\n');

    return {
      id: `tp-${babNum}`,
      code: tpCode,
      element: matchedElement.name,
      description: `Melalui elemen ${matchedElement.name}, peserta didik mampu menganalisis, mengevaluasi, dan mengaplikasikan konsep ${bab.judulBab} dalam pemecahan persoalan nyata secara kritis sesuai KepKa BSKAP No. 046/H/KR/2025.`,
      indikatorKinerja: `• Siswa mampu menganalisis konsep inti ${bab.judulBab} pada elemen ${matchedElement.name} dan menyelesaikan studi kasus kontekstual dengan bukti akurat.`,
      materiPokok: bab.judulBab,
      subMateri: subBullets || `• Konsep dasar ${bab.judulBab}\n• Prosedur analisis terapan\n• Evaluasi dan refleksi hasil`,
      profilPelajarPancasila: ['Bernalar Kritis', 'Mandiri', 'Gotong Royong'],
      rencanaAsesmen: `Formatif: Penugasan LKPD & Kuis (${matchedElement.name}); Sumatif: Tes Tertulis & Portofolio Karya ${bab.judulBab}`,
      variasiKeterampilan: matchedElement.variasiKeterampilan || `Kecakapan analisis kritis materi ${bab.judulBab} dan literasi terapan.`,
      bloomLevel: (babNum % 3 === 0 ? 'C5' : babNum % 2 === 0 ? 'C4' : 'C3') as any,
      hotsCategory: (babNum % 3 === 0 || babNum % 2 === 0 ? 'HOTS' : 'MOTS') as any,
      jpAllocation: bab.alokasiJp || 18,
      semester: sem as 1 | 2,
      babId: `bab-${babNum}`,
      kataKunci: [mapelName, matchedElement.name, bab.kodeBab, 'BSKAP 046/2025'],
    };
  });

  // 3. Generate PROTA (Synchronized with TP & Elemen CP)
  const newProta: ProtaItem[] = newTpList.map((tp, idx) => ({
    id: `prota-${idx + 1}`,
    semester: tp.semester,
    babNumber: idx + 1,
    babTitle: tp.materiPokok,
    materiPembelajaran: `[Elemen CP: ${tp.element}] ${tp.materiPokok}`,
    tpCode: tp.code,
    tpDescription: tp.description,
    alokasiJp: tp.jpAllocation,
    keterangan: `Elemen: ${tp.element} · Formatif & Sumatif Bab ${idx + 1}`,
  }));

  // 4. Generate PROMES (Synchronized with PROTA & RPE)
  const newPromes = buildPromesFromProta(newProta, rpeState, [], 'auto_rpe');

  // 5. Generate Modul Ajar List (Synchronized with Official CP Elements & TP)
  const newModulAjarList: ModulAjarItem[] = babs.map((bab, idx) => {
    const babNum = idx + 1;
    const tpMatch = newTpList[idx];
    const elMatch =
      generatedCpElements.find((e) => e.name === tpMatch.element) ||
      generatedCpElements[idx % generatedCpElements.length] ||
      generatedCpElements[0];
    const subChapters = bab.subBab && bab.subBab.length > 0
      ? bab.subBab
      : getSyncedSubChaptersForBab(mapelName, gradeStr, babNum);

    const officialCpText = elMatch
      ? `[Elemen CP Resmi BSKAP 046/H/KR/2025: ${elMatch.name}] ${elMatch.deskripsi} (Sumber: https://kurikulum.kemendikdasmen.go.id/ — KepKa BSKAP No. 046/H/KR/2025 & Permendikbudristek No. 12 Tahun 2024)`
      : `Pemahaman terhadap materi ${mapelName} ${faseCode} sesuai KepKa BSKAP No. 046/H/KR/2025.`;

    const baseModul: any = {
      id: `modul-${babNum}`,
      babNumber: babNum,
      babTitle: bab.judulBab,
      semester: bab.semester || (babNum <= 3 ? 1 : 2),
      alokasiJp: bab.alokasiJp || 18,
      pertemuanCount: Math.ceil((bab.alokasiJp || 18) / 3),
      kompetensiAwal: `Penguasaan prasyarat elemen ${tpMatch.element} pada materi sebelumnya.`,
      profilPelajarPancasila: ['Penalaran Kritis', 'Kreativitas', 'Gotong Royong'],
      modelPembelajaran: 'Problem Based Learning (PBL) & Deep Learning',
      saranaPrasarana: 'PID | Laptop | Gawai / Smartphone | LKPD | Whiteboard & Spidol',
      targetPesertaDidik: 'Murid Reguler / Umum',
      pemahamanBermakna: `Melalui elemen ${tpMatch.element}, siswa memahami pentingnya ${bab.judulBab} dalam kehidupan sehari-hari dan dunia nyata.`,
      pertanyaanPemantik: [
        `Mengapa konsep ${bab.judulBab} (${tpMatch.element}) penting dalam kehidupan nyata?`,
        `Bagaimana dampak penerapan ${bab.judulBab} terhadap pemecahan masalah sehari-hari?`,
        `Langkah kreatif apa yang bisa diterapkan jika menemukan kendala pada materi ini?`,
      ],
      deepLearning: {
        berkesadaran: 'Mengintegrasikan refleksi diri dalam setiap tahap pembelajaran.',
        bermakna: 'Menghubungkan materi dengan realita dunia kerja dan kehidupan nyata.',
        menggembirakan: 'Menggunakan metode kolaboratif dan media interaktif untuk menciptakan lingkungan belajar yang positif.'
      },
      tujuanPembelajaran: [tpMatch.description],
      langkahPembelajaran: {
        pendahuluan: [
          'Guru membuka kelas dengan salam, doa, dan presensi sambil memperhatikan kondisi emosional peserta didik.',
          'Kesepakatan kelas & sesi check-in emosional singkat.',
          `Guru menyampaikan Elemen CP (${tpMatch.element}) dan Tujuan Pembelajaran: "${tpMatch.description}".`,
          `Guru mengajukan pertanyaan pemantik terkait ${bab.judulBab}.`,
        ],
        inti: {
          diferensiasiKonten: ['Penyediaan materi multimodal (teks, video, infografis) sesuai gaya belajar.'],
          diferensiasiProses: ['Guru membentuk kelompok fleksibel terdiri dari 4-7 murid (maksimal 7 peserta didik per kelompok, total hingga 36 siswa per kelas).', 'Pendampingan khusus bagi kelompok perlu bimbingan.'],
          diferensiasiProduk: ['Peserta didik memilih bentuk laporan/karya sesuai minat (tulisan, poster, video, atau presentasi).']
        },
        penutup: [
          'Guru memberikan apresiasi atas partisipasi aktif peserta didik.',
          'Penyampaian rencana pembelajaran pada pertemuan berikutnya.',
          'Doa penutup dan salam.',
        ]
      },
      asesmen: {
        diagnostik: 'Pemetaan diagnostik kognitif dan non-kognitif awal.',
        formatif: 'Observasi diskusi kelompok, pertanyaan lisan (teknik Socratic), lembar refleksi.',
        sumatif: 'Penilaian proyek, tes tertulis (PG & Esai), portofolio karya.'
      },
      rubrik: [
        { kriteria: `Penguasaan Elemen ${tpMatch.element}`, baruBerkembang: 'Perlu bimbingan', layak: 'Cukup', cakap: 'Baik', mahir: 'Sangat Baik' },
        { kriteria: 'Kolaborasi & Penalaran Kritis', baruBerkembang: 'Pasif', layak: 'Kontribusi minimal', cakap: 'Kontribusi aktif', mahir: 'Memimpin kolaborasi' }
      ],
      identifikasi: {
        pesertaDidik: 'Dari 36 siswa, 24 sudah memahami konsep dasar, 8 masih perlu pendampingan, 4 siap materi pengayaan.',
        materiPelajaran: `Analisis materi ${mapelName} ${bab.kodeBab} (Elemen CP: ${tpMatch.element}) mencakup jenis pengetahuan faktual, konseptual, prosedural, dan metakognitif.`,
        dimensiProfilLulusan: ['Penalaran Kritis', 'Kolaborasi', 'Kemandirian', 'Kreativitas', 'Komunikasi', 'Keimanan dan Ketakwaan terhadap Tuhan YME'],
      },
      desainPembelajaran: {
        capaianPembelajaran: officialCpText,
        tujuanPembelajaran: [tpMatch.description],
        lintasDisiplinIlmu: `Interdisipliner: ${mapelName}, Matematika, IPS, PKn, Geografi, Informatika`,
        praktikPedagogis: 'Problem Based Learning (PBL) & Deep Learning',
        kemitraanPembelajaran: 'Orang tua/wali sebagai mitra pendampingan di rumah; komunitas lokal sebagai sumber belajar kontekstual.',
        lingkunganPembelajaran: 'Fisik: Ruang kelas kolaboratif, LKPD | Virtual: PID & Gawai | Budaya: Suasana aman & Growth Mindset',
        pemanfaatanDigital: 'PID, Laptop, Gawai, Video Kasus Interaktif, e-learning LMS, aplikasi penilaian online.',
      },
      petaPengalamanBelajar: [
        {
          tahap: '1. Memahami',
          deskripsi: `Peserta didik mengamati fenomena/kasus terkait ${bab.judulBab} (Elemen CP: ${tpMatch.element}), difasilitasi pertanyaan pemantik untuk membangun pemahaman awal.`,
        },
        {
          tahap: '2. Mengaplikasikan',
          deskripsi: `Melalui Problem Based Learning (PBL), peserta didik menerapkan konsep ${bab.judulBab} pada tantangan kontekstual secara kolaboratif.`,
        },
        {
          tahap: '3. Merefleksi',
          deskripsi: `Peserta didik menuliskan refleksi tentang apa yang dipahami dan melakukan teach-back kepada teman sebaya.`,
        },
      ],
      pengalamanBelajar: {
        kegiatanAwal: {
          prinsip: 'Pendahuluan (±15 Menit) - Berkesadaran, Bermakna, Menggembirakan',
          deskripsi: [
            'Guru membuka kelas dengan salam, doa, dan presensi sambil memperhatikan kondisi emosional peserta didik.',
            'Kesepakatan kelas & sesi check-in emosional singkat.',
            `Guru menyampaikan Elemen CP (${tpMatch.element}) & Tujuan Pembelajaran: "${tpMatch.description}".`,
            `Guru mengajukan pertanyaan pemantik terkait ${bab.judulBab}.`,
          ],
        },
        kegiatanInti: {
          prinsip: 'Kegiatan Inti (Siklus Memahami, Mengaplikasikan, Merefleksi)',
          memahami: {
            prinsip: 'Tahap 1 — Memahami',
            deskripsi: [
              'Guru membentuk kelompok fleksibel terdiri dari 4-7 murid (maksimal 7 peserta didik per kelompok, total hingga 36 siswa per kelas).',
              `Murid mengamati video/kasus terkait ${bab.judulBab} (${tpMatch.element}).`,
              'Guru membagikan LKPD dan memastikan pembagian peran kelompok.',
              ...subChapters.slice(0, 2).map((s: string, i: number) => `Menganalisis sub-materi 1.${i + 1}: ${s}`),
            ],
          },
          mengaplikasi: {
            prinsip: 'Tahap 2 — Mengaplikasikan',
            deskripsi: [
              'Murid mendiskusikan kasus dan menjawab pertanyaan di LKPD.',
              'Guru membimbing kelompok yang memerlukan pendampingan.',
              'Perwakilan kelompok membacakan hasil diskusi dan menerima umpan balik.',
              ...subChapters.slice(2, 4).map((s: string, i: number) => `Mengaplikasikan kompetensi 2.${i + 1}: ${s}`),
            ],
          },
          merefleksi: {
            prinsip: 'Tahap 3 — Merefleksi',
            deskripsi: [
              'Peserta didik menyimpulkan poin penting materi hari ini.',
              'Guru mengonfirmasi pemahaman dan meluruskan miskonsepsi.',
              'Peserta didik mengisi exit ticket / lembar refleksi diri.',
            ],
          },
        },
        kegiatanPenutup: {
          prinsip: 'Penutup (±10 Menit) - Berkesadaran, Bermakna, Menggembirakan',
          deskripsi: [
            'Guru memberikan apresiasi atas partisipasi aktif peserta didik.',
            'Penyampaian rencana pembelajaran pada pertemuan berikutnya.',
            'Doa penutup dan salam.',
          ],
        },
      },
    };

    const currentProfile: SchoolProfile = {
      ...profile,
      subject: mapelName,
      grade: gradeStr,
      fase: faseCode,
    };

    return ensureOfficialKemendikdasmenModul(baseModul, currentProfile);
  });

  // 6. Generate LKPD List (Synchronized with Official CP Elements & TP)
  const newLkpdList: LkpdItem[] = babs.map((bab, idx) => {
    const babNum = idx + 1;
    const tpMatch = newTpList[idx];
    const subChapters = bab.subBab && bab.subBab.length > 0
      ? bab.subBab
      : getSyncedSubChaptersForBab(mapelName, gradeStr, babNum);

    return {
      id: `lkpd-${babNum}`,
      babId: `bab-${babNum}`,
      babNumber: babNum,
      babTitle: bab.judulBab,
      pertemuan: 1,
      title: `LKPD Bab ${babNum}: ${bab.judulBab} (${tpMatch.element})`,
      waktu: '2 x 45 Menit (3 JP)',
      petunjuk: [
        'Bentuk kelompok fleksibel (maksimal 7 siswa per kelompok, total kelas hingga 36 siswa).',
        `Pelajari Elemen Capaian Pembelajaran (${tpMatch.element}) dan Tujuan Pembelajaran (${tpMatch.code}).`,
        `Eksplorasi dan amati studi kasus terkait ${bab.judulBab}.`,
        'Diskusikan pertanyaan di bawah ini bersama anggota kelompok secara runtut dan tuliskan di lembar jawaban.',
      ],
      materiRingkas: `[Elemen CP BSKAP 046/2025: ${tpMatch.element} | Kode TP ${tpMatch.code}] Ringkasan Konsep Bab ${babNum}: ${bab.judulBab} (${mapelName} ${gradeStr}). Membahas ${subChapters.join('; ')}.`,
      aktivitas: `Penyelidikan Kolaboratif (${tpMatch.element}): Analisis masalah kontekstual pada ${bab.judulBab} dan rumuskan solusi inovatif kelompok.`,
      pertanyaanDiskusi: [
        `Mengapa ${subChapters[0] || bab.judulBab} penting untuk dipahami dalam konteks elemen ${tpMatch.element}?`,
        `Bagaimana dampak penerapan ${subChapters[1] || bab.judulBab} dalam situasi nyata?`,
        `Analisis hambatan yang mungkin timbul pada ${subChapters[2] || bab.judulBab} dan berikan solusinya!`,
      ],
      tugasMandiri: `Tugas Mandiri (${tpMatch.code} — ${tpMatch.element}): Buatlah rangkuman reflektif 1 halaman mengenai ${bab.judulBab} dan penerapannya dalam kehidupan sehari-hari.`,
      kunciJawaban: `Kunci Jawaban Guru: Pembuktian konsep ${bab.judulBab} (Elemen CP: ${tpMatch.element}) harus didasarkan pada data/fakta yang logis, konsisten dengan indikator TP ${tpMatch.code}.`,
    };
  });

  return {
    updatedProfile: {
      ...profile,
      subject: mapelName,
      grade: gradeStr,
      fase: faseCode,
    },
    newCpElements: generatedCpElements,
    newTpList,
    newProta,
    newPromes,
    newModulAjarList,
    newLkpdList,
  };
}

/**
 * Retrieves Official BSKAP No. 046/H/KR/2025 & Permendikbudristek No. 12 Tahun 2024
 * Rasional & Elemen Capaian Pembelajaran (https://kurikulum.kemendikdasmen.go.id/)
 */
export function getSubjectRasionalAndCpElements(
  mapelName: string,
  gradeStr: string = 'Kelas 10',
  faseCode: string = 'E',
  bookOverride?: { elemenList?: string[]; desc?: string; judulBuku?: string }
): { rasional: string; cpElements: CpElement[] } {
  const m = (mapelName || '').toLowerCase();

  // Lookup matching entry in official CP_LIBRARY_ITEMS (151 modules from BSKAP 046/H/KR/2025)
  const matchedLibItem = CP_LIBRARY_ITEMS.find(
    (item) =>
      item.mapel.toLowerCase() === m &&
      (item.faseCode.toLowerCase() === (faseCode || '').toLowerCase() ||
        item.kelasDefault.toLowerCase() === (gradeStr || '').toLowerCase())
  ) || CP_LIBRARY_ITEMS.find((item) => item.mapel.toLowerCase().includes(m) || m.includes(item.mapel.toLowerCase()));

  const isEkonomi = m.includes('ekonomi');
  const isIndo = m.includes('indonesia');
  const isInggris = m.includes('inggris');
  const isMtk = m.includes('matematika');
  const isPancasila = m.includes('pancasila') || m.includes('pkn') || m.includes('ppkn');
  const isInformatika = m.includes('informatika') || m.includes('koding') || m.includes('komputer') || m.includes('rpl') || m.includes('tjkt');
  const isPai = m.includes('agama') || m.includes('pai') || m.includes('quran') || m.includes('akidah') || m.includes('fikih') || m.includes('kebudayaan islam') || m.includes('ski');
  const isIpa = m.includes('ipa') || m.includes('fisika') || m.includes('kimia') || m.includes('biologi') || m.includes('sains');
  const isIps = m.includes('ips') || m.includes('sejarah') || m.includes('geografi') || m.includes('sosiologi') || m.includes('antropologi');
  const isPjok = m.includes('pjok') || m.includes('jasmani') || m.includes('olahraga');
  const isSeni = m.includes('seni') || m.includes('prakarya') || m.includes('dkv') || m.includes('musik') || m.includes('rupa') || m.includes('tari') || m.includes('teater');
  const isPaud = m.includes('paud') || m.includes('tk') || m.includes('ra ') || m.includes('fondasi') || (faseCode || '').toLowerCase().includes('fondasi');

  if (isEkonomi) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran Ekonomi Fase ${faseCode} (${gradeStr}) mencakup konsep kelangkaan (scarcity), biaya peluang (opportunity cost), skala prioritas dan literasi keuangan, peran pelaku kegiatan ekonomi dalam circular flow diagram, mekanisme pembentukan harga pasar (permintaan, penawaran, elastisitas), serta sistem pembayaran dan lembaga jasa keuangan (Bank Indonesia, OJK, perbankan, pasar modal).`,
      cpElements: [
        {
          id: 'el-eko-1',
          name: 'Pemahaman Konsep Ekonomi',
          deskripsi: 'Pada akhir fase ini, peserta didik memahami konsep kelangkaan, biaya peluang, pilihan rasional, interaksi pelaku ekonomi dalam circular flow diagram, permintaan, penawaran, keseimbangan pasar dan elastisitas, serta fungsi sistem pembayaran dan lembaga jasa keuangan bank maupun nonbank dalam perekonomian Indonesia.',
          kompetensi: ['Menghitung biaya peluang (C3)', 'Menganalisis kurva keseimbangan pasar (C4)', 'Menyusun skala prioritas keuangan (C3)'],
          materi: ['Kelangkaan dan skala prioritas', 'Circular flow diagram 4 sektor', 'Keseimbangan harga pasar dan elastisitas', 'OJK dan sistem pembayaran digital (QRIS, e-wallet)'],
          variasiKeterampilan: 'Kecakapan kalkulasi kuantitatif pasar dan literasi finansial cerdas.',
        },
        {
          id: 'el-eko-2',
          name: 'Keterampilan Proses',
          deskripsi: 'Pada akhir fase ini, peserta didik mampu mengamati fenomena kelangkaan dan fluktuasi harga pasar di lingkungan sekitar, merumuskan pertanyaan analitis, mengumpulkan dan mengolah data transaksi ekonomi, menarik kesimpulan secara kritis, serta mengomunikasikan rekomendasi keputusan finansial yang etis dan bijak.',
          kompetensi: ['Mengamati fenomena pasar', 'Mengumpulkan data harga & transaksi', 'Menganalisis rasio keuangan (C4)', 'Mengomunikasikan rekomendasi finansial'],
          materi: ['Survei harga pasar komoditas', 'Wawancara pelaku UMKM & Koperasi', 'Analisis instrumen investasi legal OJK', 'Penyusunan anggaran keuangan pribadi 50/30/20'],
          variasiKeterampilan: 'Kecakapan investigasi lapangan ekonomi mikro-makro dan presentasi solusi finansial.',
        },
      ],
    };
  }

  if (isIndo) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran Bahasa Indonesia Fase ${faseCode} (${gradeStr}) membekali peserta didik dengan kemahiran berbahasa dan bersastra secara reseptif (Menyimak, Membaca dan Memirsa) serta produktif (Berbicara dan Mempresentasikan, Menulis) secara kritis, kreatif, dan berkarakter Profil Pelajar Pancasila.`,
      cpElements: [
        {
          id: 'el-indo-1',
          name: 'Menyimak',
          deskripsi: 'Peserta didik mampu mengevaluasi dan mengkreasi informasi berupa gagasan, pikiran, perasaan, pandangan, arahan atau pesan yang akurat dari menyimak berbagai tipe teks (nonfiksi dan fiksi) dalam bentuk monolog, dialog, dan gelar wicara.',
          kompetensi: ['Mengevaluasi akurasi informasi (C5)', 'Mengkreasi tanggapan kritis (C6)', 'Menganalisis ide pokok & pesan tersirat (C4)'],
          materi: ['Teks Laporan Hasil Observasi (LHO)', 'Teks Anekdot & Kritik Sosial', 'Hikayat & Cerita Rakyat', 'Gelar Wicara & Diskusi Panel'],
          variasiKeterampilan: 'Kecakapan menyimak kritis, analisis fakta vs opini, dan empati komunikasi.',
        },
        {
          id: 'el-indo-2',
          name: 'Membaca dan Memirsa',
          deskripsi: 'Peserta didik mampu mengevaluasi informasi berupa gagasan, pikiran, pandangan, arahan atau pesan dari berbagai jenis teks visual dan audiovisual untuk menemukan makna yang tersurat dan tersirat, serta menginterpretasi informasi untuk mengungkapkan gagasan dan perasaan simpati, peduli, dan empati.',
          kompetensi: ['Menginterpretasi makna tersurat & tersirat (C4)', 'Mengevaluasi akurasi & kualitas teks multimodal (C5)', 'Membandingkan struktur & kaidah kebahasaan (C4)'],
          materi: ['Infografik & Data Riset LHO', 'Struktur & Kaidah Teks Anekdot', 'Nilai Karakter Hikayat & Cerpen', 'Teks Biografi Tokoh Inspiratif'],
          variasiKeterampilan: 'Literasi membaca mendalam, berpikir analitis, dan sintesis multimodal.',
        },
        {
          id: 'el-indo-3',
          name: 'Berbicara dan Mempresentasikan',
          deskripsi: 'Peserta didik mampu mengolah dan menyajikan gagasan, pikiran, pandangan, arahan atau pesan untuk tujuan pengajuan usul, perumusan masalah, dan solusi dalam bentuk monolog, dialog, dan gelar wicara secara logis, runtut, kritis, dan kreatif.',
          kompetensi: ['Mempresentasikan hasil riset secara runtut (C4)', 'Bernegosiasi taktis & santun (C3)', 'Mengartikulasikan argumen berbasis bukti (C5)'],
          materi: ['Teks Negosiasi Bisnis & Kewirausahaan', 'Debat Isu Aktual & Kebijakan Publik', 'Musikalisasi & Deklamasi Puisi'],
          variasiKeterampilan: 'Retorika persuasif, artikulasi santun, dan keberanian berbicara di depan publik.',
        },
        {
          id: 'el-indo-4',
          name: 'Menulis',
          deskripsi: 'Peserta didik mampu menulis gagasan, pikiran, pandangan, arahan atau pesan tertulis untuk berbagai tujuan secara logis, kritis, dan kreatif dalam bentuk teks informasional dan/atau fiksi serta memublikasikannya di media cetak maupun digital.',
          kompetensi: ['Menulis laporan riset objektif (C4)', 'Menulis esai & kritik sastra (C5)', 'Mengalihwahanakan hikayat ke cerpen/komik (C6)'],
          materi: ['Laporan Observasi Lingkungan', 'Naskah Anekdot & Komik Strip', 'Teks Biografi Naratif', 'Antologi Puisi Nusantara'],
          variasiKeterampilan: 'Keterampilan sintesis tulisan ilmiah-populer dan kreativitas literasi sastra.',
        },
      ],
    };
  }

  if (isMtk) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran Matematika Fase ${faseCode} (${gradeStr}) mengembangkan penalaran logis-deduktif, pemodelan matematis, koneksi antartopik, dan kemampuan pemecahan masalah (problem-solving) melalui lima elemen konten terpadu.`,
      cpElements: [
        {
          id: 'el-mtk-1',
          name: 'Bilangan',
          deskripsi: 'Peserta didik dapat menggeneralisasi sifat-sifat bilangan berpangkat (termasuk bilangan pangkat pecahan), menerapkan barisan dan deret aritmetika serta geometri, termasuk masalah yang terkait bunga tunggal dan bunga majemuk.',
          kompetensi: ['Menggeneralisasi sifat eksponen & logaritma (C3)', 'Memecahkan masalah barisan & deret (C4)', 'Menghitung model bunga majemuk finansial (C4)'],
          materi: ['Eksponen & Bentuk Akar', 'Logaritma Terapan', 'Barisan & Deret Aritmetika/Geometri', 'Bunga Tunggal & Majemuk'],
          variasiKeterampilan: 'Kecakapan kalkulasi simbolik, estimasi numerik, dan literasi finansial.',
        },
        {
          id: 'el-mtk-2',
          name: 'Aljabar dan Fungsi',
          deskripsi: 'Peserta didik dapat menyelesaikan masalah yang berkaitan dengan sistem persamaan linear tiga variabel dan sistem pertidaksamaan linear dua variabel, serta menyelesaikan masalah yang berkaitan dengan persamaan dan fungsi kuadrat serta fungsi eksponensial.',
          kompetensi: ['Memodelkan SPLTV & SPtLDV (C4)', 'Menganalisis karakteristik grafik fungsi kuadrat (C4)', 'Menyelesaikan optimasi kontekstual (C5)'],
          materi: ['Sistem Persamaan Linear Tiga Variabel (SPLTV)', 'Sistem Pertidaksamaan Linear Dua Variabel', 'Fungsi Kuadrat & Fungsi Eksponensial'],
          variasiKeterampilan: 'Pemodelan aljabar, representasi grafik fungsi, dan pemecahan masalah optimasi.',
        },
        {
          id: 'el-mtk-3',
          name: 'Geometri',
          deskripsi: 'Peserta didik dapat menyelesaikan permasalahan segitiga siku-siku yang melibatkan perbandingan trigonometri dan aplikasinya dalam pengukuran jarak serta tinggi objek secara tidak langsung.',
          kompetensi: ['Menentukan rasio trigonometri sudut istimewa (C3)', 'Memecahkan masalah sudut elevasi & depresi (C4)', 'Membuktikan identitas dasar trigonometri (C4)'],
          materi: ['Perbandingan Trigonometri Segitiga Siku-Siku', 'Sudut Elevasi & Depresi', 'Aplikasi Trigonometri dalam Pengukuran'],
          variasiKeterampilan: 'Visualisasi spasial geometri, pengukuran klinometer, dan penalaran deduktif.',
        },
        {
          id: 'el-mtk-4',
          name: 'Analisis Data dan Peluang',
          deskripsi: 'Peserta didik dapat merepresentasikan dan menginterpretasi data dengan cara menentukan jangkauan kuartil dan interkuartil, membuat dan menginterpretasi box plot (box-and-whisker plot) dan histogram, serta menjelaskan peluang dan frekuensi harapan kejadian majemuk.',
          kompetensi: ['Menginterpretasi boxplot, histogram & dot plot (C4)', 'Menganalisis ukuran pemusatan & penyebaran data (C4)', 'Menghitung peluang kejadian saling lepas & bebas (C4)'],
          materi: ['Statistika Deskriptif (Kuartil, Boxplot, Simpangan Baku)', 'Regresi & Korelasi Bivariat', 'Peluang Kejadian Majemuk'],
          variasiKeterampilan: 'Literasi data statistik autentik, komputasi probabilitas, dan inferensi logis.',
        },
      ],
    };
  }

  if (isInggris) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran Bahasa Inggris Fase ${faseCode} (${gradeStr}) berfokus pada penguatan kecakapan berkomunikasi lisan, tulisan, dan multimodal (teks visual, audio, dan audiovisual) setara tingkat kemahiran CEFR melalui tiga elemen kecakapan berbahasa terpadu.`,
      cpElements: [
        {
          id: 'el-ing-1',
          name: 'Menyimak - Berbicara (Listening - Speaking)',
          deskripsi: 'Peserta didik menggunakan bahasa Inggris untuk berkomunikasi dengan guru, teman sebaya, dan orang lain dalam berbagai macam situasi dan tujuan; memahami dan merespons teks lisan, visual, dan/atau multimodal untuk mempelajari sesuatu dan menyampaikan opini secara santun.',
          kompetensi: ['Merespons percakapan & diskusi dalam bahasa Inggris (C3)', 'Menyampaikan opini, argumen & presentasi lisan (C4)', 'Mengevaluasi informasi utama dari audio/video (C4)'],
          materi: ['Transactional & Interpersonal Dialogues', 'Expressing Opinions & Arguments', 'Oral Presentation & Group Discussion'],
          variasiKeterampilan: 'Kecakapan komunikasi lisan global, pelafalan akurat, dan kolaborasi lintas budaya.',
        },
        {
          id: 'el-ing-2',
          name: 'Membaca - Memirsa (Reading - Viewing)',
          deskripsi: 'Peserta didik membaca dan merespons berbagai macam teks seperti narasi, deskripsi, prosedur, eksposisi, recount, dan report secara mandiri untuk menemukan ide pokok, detail spesifik, makna tersirat, serta mengevaluasi tujuan penulis pada teks cetak maupun digital.',
          kompetensi: ['Mengidentifikasi ide pokok & detail spesifik teks (C3)', 'Menganalisis struktur generik & unsur kebahasaan (C4)', 'Mengevaluasi informasi tersirat pada infografik/teks (C5)'],
          materi: ['Descriptive & Recount Texts', 'Procedure & Manual SOP Texts', 'Analytical Exposition & Narrative Texts'],
          variasiKeterampilan: 'Literasi kritis bahasa asing, membaca memindai (scanning/skimming), dan analisis multimodal.',
        },
        {
          id: 'el-ing-3',
          name: 'Menulis - Mempresentasikan (Writing - Presenting)',
          deskripsi: 'Peserta didik menulis berbagai jenis teks fiksi dan nonfiksi melalui aktivitas yang dipandu dan mandiri, menunjukkan kesadaran peserta didik terhadap tujuan dan target pembaca, serta menyajikan gagasannya menggunakan berbagai mode presentasi cetak dan digital.',
          kompetensi: ['Merancang & menyusun draf teks fiksi/nonfiksi (C5)', 'Menyunting tata bahasa, kosakata & tanda baca (C4)', 'Mempresentasikan proyek digital/poster berbahasa Inggris (C6)'],
          materi: ['Writing Professional Profiles & Recounts', 'Drafting Manuals & Persuasive Essays', 'Digital Storytelling & Project Presentation'],
          variasiKeterampilan: 'Penulisan akademik-vokasi berbahasa Inggris dan presentasi kreatif digital.',
        },
      ],
    };
  }

  if (isInformatika) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran ${mapelName} Fase ${faseCode} (${gradeStr}) membangun cara berpikir komputasional, kecakapan literasi digital, rekayasa algoritma, pengolahan data, serta etika kecerdasan artifisial (AI).`,
      cpElements: [
        {
          id: 'el-inf-1',
          name: 'Berpikir Komputasional (BK)',
          deskripsi: 'Peserta didik mampu menerapkan strategi algoritmik standar untuk menghasilkan beberapa solusi persoalan dengan data diskrit bervolume tidak kecil pada kehidupan sehari-hari maupun implementasi dalam program komputer.',
          kompetensi: ['Mendekomposisi masalah kompleks (C4)', 'Menerapkan algoritma pencarian & pengurutan (C3)', 'Merancang struktur data stack, queue & graf (C5)'],
          materi: ['Dekomposisi, Pengenalan Pola & Abstraksi', 'Algoritma Searching & Sorting', 'Struktur Data Tumpukan (Stack) & Antrean (Queue)'],
          variasiKeterampilan: 'Berpikir algoritmik sistematis, efisiensi komputasi, dan pemecahan masalah logis.',
        },
        {
          id: 'el-inf-2',
          name: 'Literasi Digital (LD)',
          deskripsi: 'Peserta didik mampu memanfaatkan berbagai aplikasi secara bersamaan dan optimal untuk berkomunikasi, mencari sumber data yang akan diolah menjadi informasi, serta menerapkan keamanan siber (cybersecurity), privasi data, dan etika pemanfaatan Kecerdasan Artifisial (AI).',
          kompetensi: ['Mengintegrasikan layanan cloud & perkantoran (C3)', 'Mengevaluasi validitas informasi digital & hoaks (C5)', 'Menerapkan proteksi keamanan siber & etika AI (C4)'],
          materi: ['Integrasi Aplikasi Perkantoran & Cloud', 'Arsitektur Komputer & Jaringan Internet', 'Keamanan Siber, Jejak Digital & Etika AI'],
          variasiKeterampilan: 'Kecakapan warga digital beretika, kolaborasi cloud, dan ketahanan keamanan siber.',
        },
        {
          id: 'el-inf-3',
          name: 'Analisis Data (AD)',
          deskripsi: 'Peserta didik mampu memahami aspek privasi dan keamanan data, mengumpulkan data secara otomatis dari berbagai sumber data, memodelkan data berbagai bidang, serta menerapkan siklus pengolahan data (pengumpulan, pengolahan, visualisasi, analisis, interpretasi, dan publikasi).',
          kompetensi: ['Mengumpulkan & membersihkan dataset (C3)', 'Membuat visualisasi grafik & tabel pivot (C4)', 'Menafsirkan pola data untuk pengambilan keputusan (C5)'],
          materi: ['Siklus Pengolahan Data & Data Cleaning', 'Visualisasi Data Interaktif', 'Interpretasi & Prediksi Berbasis Data'],
          variasiKeterampilan: 'Literasi data analitik, visualisasi informasi, dan pengambilan keputusan berbasis bukti.',
        },
        {
          id: 'el-inf-4',
          name: 'Algoritma dan Pemrograman (AP)',
          deskripsi: 'Peserta didik mampu menerapkan praktik baik konsep pemrograman prosedural dalam salah satu bahasa pemrograman prosedural dan mampu mengembangkan program yang terstruktur dalam notasi algoritma atau notasi lainnya berdasarkan strategi algoritmik yang tepat.',
          kompetensi: ['Merancang flowchart & pseudocode (C4)', 'Mengimplementasikan percabangan, perulangan & fungsi (C4)', 'Mengembangkan & menguji prototipe aplikasi (C6)'],
          materi: ['Flowchart & Pseudocode', 'Struktur Kontrol, Array & Modularisasi Fungsi', 'Pengembangan Proyek Perangkat Lunak Terpadu'],
          variasiKeterampilan: 'Koding terstruktur, debugging sistematis, dan rekayasa solusi perangkat lunak.',
        },
      ],
    };
  }

  if (isPancasila) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran Pendidikan Pancasila Fase ${faseCode} (${gradeStr}) menumbuhkan kesadaran berbangsa dan bernegara melalui empat elemen utama pilar kebangsaan Indonesia.`,
      cpElements: [
        {
          id: 'el-pkn-1',
          name: 'Pancasila',
          deskripsi: 'Peserta didik mampu menganalisis cara pandang para pendiri negara tentang rumusan Pancasila sebagai dasar negara, fungsi dan kedudukan Pancasila sebagai dasar negara, ideologi negara, dan identitas nasional, serta menerapkan nilai-nilai Pancasila dalam kehidupan keseharian.',
          kompetensi: ['Menganalisis gagasan pendiri bangsa tentang Pancasila (C4)', 'Mengevaluasi tantangan penerapan ideologi Pancasila (C5)', 'Mengaktualisasikan nilai Pancasila dalam proyek kewarganegaraan (C4)'],
          materi: ['Sejarah Perumusan & Kedudukan Pancasila', 'Pancasila sebagai Ideologi Terbuka', 'Aktualisasi Nilai Pancasila di Era Digital'],
          variasiKeterampilan: 'Penalaran kritis kebangsaan, musyawarah mufakat, dan keteladanan karakter.',
        },
        {
          id: 'el-pkn-2',
          name: 'Undang-Undang Dasar Negara Republik Indonesia Tahun 1945',
          deskripsi: 'Peserta didik mampu menganalisis produk perundang-undangan dan mengevaluasi ketidaksesuaian antarproduk perundang-undangan, serta mempraktikkan sikap dan perilaku dalam menjaga keutuhan UUD NRI Tahun 1945 disertai keseimbangan pelaksanaan hak dan kewajiban warga negara.',
          kompetensi: ['Menganalisis hierarki peraturan perundang-undangan (C4)', 'Mengevaluasi pelaksanaan hak & kewajiban warga negara (C5)', 'Memecahkan kasus pelanggaran hak konstitusional (C4)'],
          materi: ['Konstitusi & Hierarki Peraturan Perundang-undangan', 'Hak dan Kewajiban Warga Negara dalam UUD NRI 1945', 'Kesadaran Hukum & Kepatuhan Norma'],
          variasiKeterampilan: 'Literasi konstitusional, analisis produk hukum, dan advokasi hak warga negara.',
        },
        {
          id: 'el-pkn-3',
          name: 'Bhinneka Tunggal Ika',
          deskripsi: 'Peserta didik mampu mengidentifikasi pengaruh keanggotaan kelompok lokal, regional, nasional, dan global terhadap pembentukan identitas, serta memahami makna dan nilai dari keragaman serta merespons secara memadai terhadap kondisi dan keadaan yang ada di lingkungan dan masyarakat.',
          kompetensi: ['Mengidentifikasi pembentukan identitas dalam kebinekaan (C3)', 'Menganalisis potensi konflik & harmoni sosial (C4)', 'Merancang kampanye toleransi & kolaborasi lintas budaya (C6)'],
          materi: ['Identitas Individu dan Kelompok dalam Kebinekaan', 'Harmoni dalam Keberagaman Suku, Agama, Ras, dan Antargolongan', 'Gotong Royong dan Kolaborasi Lintas Budaya'],
          variasiKeterampilan: 'Empati sosial, resolusi konflik damai, dan kepemimpinan inklusif.',
        },
        {
          id: 'el-pkn-4',
          name: 'Negara Kesatuan Republik Indonesia',
          deskripsi: 'Peserta didik mampu mengkaji peran dan kedudukannya sebagai warga negara Indonesia dalam menjaga keutuhan NKRI, memahami sistem pertahanan dan keamanan negara, serta menganalisis peran Indonesia dalam hubungan antarbangsa dan perdamaian dunia.',
          kompetensi: ['Menganalisis konsep bela negara & kedaulatan wilayah (C4)', 'Mengevaluasi ancaman terhadap integrasi nasional (C5)', 'Menyajikan gagasan kontribusi pemuda bagi NKRI (C5)'],
          materi: ['Kedaulatan Wilayah & Sengketa Perbatasan NKRI', 'Kesadaran Bela Negara & Ketahanan Nasional', 'Peran Aktif Indonesia dalam Perdamaian Dunia'],
          variasiKeterampilan: 'Wawasan nusantara, bela negara kontekstual, dan diplomasi kebangsaan.',
        },
      ],
    };
  }

  if (isPai) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025, Permendikbudristek No. 12 Tahun 2024, dan KMA No. 1503 Tahun 2025 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran ${mapelName} Fase ${faseCode} (${gradeStr}) mengintegrasikan pemahaman wahyu, kemantapan akidah, kemuliaan akhlak, ketertiban ibadah/muamalah, dan keteladanan sejarah peradaban Islam yang rahmatan lil 'alamin.`,
      cpElements: [
        {
          id: 'el-pai-1',
          name: 'Al-Qur\'an dan Hadis',
          deskripsi: 'Peserta didik mampu menganalisis ayat Al-Qur\'an dan hadis tentang perintah berlomba-lomba dalam kebaikan, etos kerja, berpikir kritis, dan iptek; dapat membaca Al-Qur\'an dengan tartil, menghafal dengan fasih dan lancar, serta menyajikan kandungan ayat dan hadis dalam kehidupan sehari-hari.',
          kompetensi: ['Membaca & mengidentifikasi hukum tajwid dengan tartil (C3)', 'Menganalisis asbabunnuzul & kandungan ayat/hadis (C4)', 'Menghafal & mendemonstrasikan pesan ayat (C3)'],
          materi: ['Q.S. Al-Maidah/5: 48 tentang Kompetisi dalam Kebaikan', 'Q.S. At-Taubah/9: 105 tentang Etos Kerja', 'Hadis Shahih tentang Kejujuran dan Tanggung Jawab'],
          variasiKeterampilan: 'Tilawah tartil, tafsir kontekstual ayat, dan internalisasi nilai Qur\'ani.',
        },
        {
          id: 'el-pai-2',
          name: 'Akidah',
          deskripsi: 'Peserta didik menganalisis makna Syu\'abul Iman (cabang-cabang iman), pengertian, dalil, macam, dan manfaatnya; serta mempresentasikan makna Syu\'abul Iman sehingga terwujud ketauhidan yang kukuh dan ketenangan jiwa.',
          kompetensi: ['Menganalisis dimensi Syu\'abul Iman dalam hati, lisan, dan amal (C4)', 'Mengaitkan Asmaul Husna dengan perilaku sehari-hari (C4)', 'Mengevaluasi problematika keimanan remaja (C5)'],
          materi: ['Hakikat dan Cabang-Cabang Iman (Syu\'abul Iman)', 'Keteladanan Asmaul Husna (Al-Karim, Al-Mu\'min, Al-Wakil, Al-Matin)', 'Moderasi Beragama dan Toleransi'],
          variasiKeterampilan: 'Refleksi spiritual, keteguhan prinsip akidah, dan moderasi beragama.',
        },
        {
          id: 'el-pai-3',
          name: 'Akhlak',
          deskripsi: 'Peserta didik menganalisis manfaat menghindari akhlak madzmumah (sikap hidup berfoya-foya, riya\', sum\'ah, takabur, dan hasad) serta membiasakan akhlak mahmudah (tawakal, ikhtiar, sabar, syukur, dan qana\'ah) agar tercipta kesalehan individual dan sosial.',
          kompetensi: ['Menganalisis bahaya penyakit hati & pergaulan bebas (C4)', 'Membiasakan adab berbusana, bermedia sosial & menghormati guru/orang tua (C3)', 'Merancang kampanye akhlak mulia di sekolah (C6)'],
          materi: ['Menghindari Sifat Berfoya-foya, Riya\', Takabur, dan Hasad', 'Adab Bermedia Sosial & Pergaulan Remaja Islami', 'Syaja\'ah (Membela Kebenaran) dan Husnudzon'],
          variasiKeterampilan: 'Kecerdasan emosional-spiritual (ESQ), keteladanan adab, dan kontrol diri.',
        },
        {
          id: 'el-pai-4',
          name: 'Fikih',
          deskripsi: 'Peserta didik mampu menganalisis implementasi fikih muamalah (asuransi, bank, dan koperasi syariah di masyarakat) serta ketentuan ibadah mahdhah dan ghairu mahdhah sesuai syariat Islam.',
          kompetensi: ['Menganalisis ketentuan hukum syirkah, perbankan & asuransi syariah (C4)', 'Mempraktikkan tata cara pengurusan jenazah & khutbah/dakwah (C3)', 'Memecahkan masalah muamalah kontemporer (C5)'],
          materi: ['Prinsip Fikih Muamalah & Keuangan Syariah', 'Tata Cara Ibadah, Zakat Produktif, dan Wakaf', 'Hukum Keluarga dan Kemasyarakatan Islam'],
          variasiKeterampilan: 'Praktik ibadah sahih, literasi ekonomi syariah, dan pemecahan masalah fikih.',
        },
        {
          id: 'el-pai-5',
          name: 'Sejarah Peradaban Islam',
          deskripsi: 'Peserta didik mampu menganalisis sejarah dan peran tokoh ulama penyebar ajaran Islam di Indonesia (Walisongo dan ulama Nusantara) serta perkembangan peradaban Islam dunia sebagai inspirasi kemajuan ilmu pengetahuan.',
          kompetensi: ['Menganalisis strategi dakwah damai Walisongo di Nusantara (C4)', 'Mengevaluasi kontribusi ulama Indonesia dalam kemerdekaan & keilmuan (C5)', 'Menyajikan infografik jejak peradaban Islam (C6)'],
          materi: ['Jejak Dakwah & Kearifan Budaya Walisongo', 'Peran Organisasi Islam & Ulama Nusantara', 'Kejayaan Peradaban dan Ilmuwan Muslim Dunia'],
          variasiKeterampilan: 'Literasi historis Islam Nusantara, keteladanan tokoh, dan dakwah kultural santun.',
        },
      ],
    };
  }

  if (isIpa) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran ${mapelName} Fase ${faseCode} (${gradeStr}) mengintegrasikan elemen Pemahaman Sains/IPA dan Keterampilan Proses inkuiri ilmiah untuk memecahkan permasalahan nyata di bidang kesehatan, teknologi, energi, dan lingkungan berkelanjutan.`,
      cpElements: [
        {
          id: 'el-ipa-1',
          name: `Pemahaman ${mapelName.includes('Fisika') ? 'Fisika' : mapelName.includes('Kimia') ? 'Kimia' : mapelName.includes('Biologi') ? 'Biologi' : 'IPA / Sains'}`,
          deskripsi: `Peserta didik memahami konsep, hukum, dan teori esensial ${mapelName} pada Fase ${faseCode}, serta mampu mengaitkan fenomena fisis, kimiawi, maupun biologis dengan pemecahan masalah krisis energi, perubahan iklim, keanekaragaman hayati, dan inovasi teknologi ramah lingkungan.`,
          kompetensi: ['Menganalisis konsep, hukum & prinsip sains (C4)', 'Menghitung variabel fisis/kimiawi secara akurat (C3)', 'Mengevaluasi dampak penerapan teknologi terhadap lingkungan (C5)'],
          materi: getSyncedSubChaptersForBab(mapelName, gradeStr, 1).slice(0, 4),
          variasiKeterampilan: 'Penalaran ilmiah kuantitatif-kualitatif, literasi sains, dan kesadaran ekologis.',
        },
        {
          id: 'el-ipa-2',
          name: 'Keterampilan Proses',
          deskripsi: 'Peserta didik menerapkan enam tahapan keterampilan proses inkuiri ilmiah secara terpadu: (1) Mengamati fenomena, (2) Mempertanyakan dan memprediksi hipotesis, (3) Merencanakan dan melakukan penyelidikan/praktikum, (4) Memproses, menganalisis data dan informasi, (5) Mengevaluasi dan refleksi, serta (6) Mengomunikasikan hasil penelitian.',
          kompetensi: ['Merancang & melaksanakan eksperimen laboratorium (C4)', 'Mengolah & menafsirkan data hasil pengamatan (C4)', 'Mengomunikasikan laporan ilmiah berbasis bukti (C6)'],
          materi: ['Metodologi Ilmiah & Keselamatan Kerja Laboratorium', 'Pengukuran, Pengolahan Data & Ketidakpastian', 'Proyek Riset Terpadu & Publikasi Ilmiah'],
          variasiKeterampilan: 'Keterampilan praktikum laboratorium, analisis data empiris, dan penulisan laporan ilmiah.',
        },
      ],
    };
  }

  if (isIps) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran ${mapelName} Fase ${faseCode} (${gradeStr}) membekali peserta didik dengan pemahaman konsep sosial-humaniora serta keterampilan proses inkuiri sosial untuk memahami dinamika masyarakat, ruang, dan waktu.`,
      cpElements: [
        {
          id: 'el-ips-1',
          name: `Pemahaman Konsep ${mapelName}`,
          deskripsi: `Peserta didik memahami konsep-konsep dasar ${mapelName}, menganalisis interaksi manusia dengan lingkungan alam, sosial, budaya, dan ekonomi dalam dimensi ruang dan waktu, serta mengevaluasi dinamika perubahan sosial untuk mewujudkan pembangunan berkelanjutan.`,
          kompetensi: ['Menganalisis fenomena & dinamika sosial-kemasyarakatan (C4)', 'Mengevaluasi faktor penyebab & dampak perubahan sosial/historis/keruangan (C5)', 'Merumuskan rekomendasi pemecahan masalah sosial (C6)'],
          materi: getSyncedSubChaptersForBab(mapelName, gradeStr, 1).slice(0, 4),
          variasiKeterampilan: 'Berpikir kritis historis-spasial-sosiologis dan kepekaan terhadap isu kemasyarakatan.',
        },
        {
          id: 'el-ips-2',
          name: 'Keterampilan Proses',
          deskripsi: 'Peserta didik mampu mengamati fenomena kehidupan masyarakat, menanya dan merumuskan masalah penelitian sosial, mengumpulkan dan memverifikasi sumber data primer/sekunder, mengorganisasikan dan menganalisis informasi, menarik kesimpulan, serta mengomunikasikan hasil kajian secara etis.',
          kompetensi: ['Melakukan observasi lapangan & wawancara sosial (C3)', 'Memverifikasi & mengolah data kualitatif/kuantitatif (C4)', 'Mempresentasikan laporan riset sosial (C5)'],
          materi: ['Desain Penelitian Sosial & Kajian Pustaka', 'Teknik Pengumpulan Data & Pemetaan Sosial', 'Publikasi Laporan Kajian & Rekomendasi Kebijakan'],
          variasiKeterampilan: 'Inkuiri sosial lapangan, verifikasi sumber primer, dan komunikasi publik.',
        },
      ],
    };
  }

  if (isPjok) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran PJOK Fase ${faseCode} (${gradeStr}) mengembangkan literasi jasmani (physical literacy) peserta didik melalui empat elemen terpadu agar aktif bergerak sepanjang hayat.`,
      cpElements: [
        {
          id: 'el-pjok-1',
          name: 'Terampil Bergerak',
          deskripsi: 'Peserta didik merancang, menerapkan, dan menghaluskan keterampilan gerak spesifik di dalam berbagai situasi gerak yang menantang serta menyesuaikan strategi gerak untuk mendapatkan keberhasilan praktik.',
          kompetensi: ['Mempraktikkan variasi & kombinasi gerak spesifik (C3)', 'Menganalisis biomekanika & efisiensi gerak olahraga (C4)'],
          materi: ['Permainan Invasi, Net, dan Lapangan', 'Olahraga Atletik, Bela Diri, dan Senam Kebugaran'],
          variasiKeterampilan: 'Koordinasi motorik, kelincahan taktis, dan kemahiran teknik olahraga.',
        },
        {
          id: 'el-pjok-2',
          name: 'Belajar melalui Gerak',
          deskripsi: 'Peserta didik menerapkan strategi gerak, kepemimpinan, kerja sama tim, sportivitas (fair play), dan pengambilan keputusan etis dalam berbagai aktivitas jasmani dan olahraga permainan.',
          kompetensi: ['Menerapkan taktik & strategi permainan beregu (C3)', 'Menunjukkan kepemimpinan, sportivitas & kepatuhan wasit (C4)'],
          materi: ['Taktik Permainan Beregu & Perwasitan', 'Kepemimpinan Tim, Fair Play & Manajemen Pertandingan'],
          variasiKeterampilan: 'Kerja sama tim, sportivitas tinggi, dan pengambilan keputusan cepat.',
        },
        {
          id: 'el-pjok-3',
          name: 'Bergaya Hidup Aktif',
          deskripsi: 'Peserta didik berpartisipasi dalam aktivitas kebugaran jasmani terkait kesehatan dan keterampilan, serta merancang program latihan kebugaran pribadi secara terukur dan berkelanjutan.',
          kompetensi: ['Mengukur tingkat kebugaran jasmani pribadi (TKJI) (C3)', 'Merancang program latihan daya tahan, kekuatan & kelenturan (C5)'],
          materi: ['Komponen Kebugaran Jasmani (Kardiorespirasi, Kekuatan, Kelenturan)', 'Tes dan Pengukuran Kebugaran Jasmani'],
          variasiKeterampilan: 'Disiplin berolahraga mandiri dan manajemen kebugaran fisik.',
        },
        {
          id: 'el-pjok-4',
          name: 'Memilih Hidup yang Menyehatkan',
          deskripsi: 'Peserta didik menganalisis prinsip pola makan sehat, gizi seimbang, pencegahan cedera olahraga, pertolongan pertama (P3K), serta bahaya pergaulan bebas, rokok, dan NAPZA.',
          kompetensi: ['Menganalisis kebutuhan gizi seimbang remaja (C4)', 'Mempraktikkan prosedur P3K & pencegahan cedera (C3)'],
          materi: ['Gizi Seimbang & Kesehatan Reproduksi Remaja', 'Pencegahan Cedera, P3K, dan Bahaya NAPZA'],
          variasiKeterampilan: 'Kesadaran kesehatan holistik, keterampilan P3K, dan pola hidup bersih sehat.',
        },
      ],
    };
  }

  if (isSeni) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran ${mapelName} Fase ${faseCode} (${gradeStr}) mengembangkan kepekaan estetik, ekspresi kreatif, dan apresiasi budaya Nusantara melalui lima elemen siklus berkesenian.`,
      cpElements: [
        {
          id: 'el-seni-1',
          name: 'Mengalami (Experiencing)',
          deskripsi: 'Peserta didik mengamati, mengenal, merasakan, dan mengidentifikasi unsur-unsur karya seni/prakarya serta mengeksplorasi medium, teknik, dan kearifan lokal budaya Nusantara.',
          kompetensi: ['Mengidentifikasi unsur & prinsip estetik karya (C3)', 'Mengeksplorasi teknik, bahan, dan medium berkarya (C4)'],
          materi: ['Eksplorasi Unsur Estetik & Medium Seni', 'Kajian Seni Tradisional dan Kontemporer Nusantara'],
          variasiKeterampilan: 'Kepekaan indrawi, observasi estetik, dan apresiasi kearifan lokal.',
        },
        {
          id: 'el-seni-2',
          name: 'Merefleksikan (Reflecting)',
          deskripsi: 'Peserta didik menilai, mengapresiasi, dan mengevaluasi efektivitas pesan, nilai estetika, serta konteks sosial-budaya dari karya seni milik sendiri maupun orang lain secara santun dan kritis.',
          kompetensi: ['Menganalisis makna simbolik & pesan karya (C4)', 'Mengevaluasi kualitas karya melalui kritik seni konstruktif (C5)'],
          materi: ['Apresiasi & Kritik Karya Seni', 'Refleksi Nilai Filosofis dan Budaya Karya'],
          variasiKeterampilan: 'Apresiasi kritis, empati estetik, dan evaluasi kuratorial.',
        },
        {
          id: 'el-seni-3',
          name: 'Berpikir dan Bekerja Artistik (Thinking and Working Artistically)',
          deskripsi: 'Peserta didik merancang konsep, bereksperimen dengan berbagai alternatif teknik dan prosedur keselamatan kerja, serta mengembangkan gagasan orisinal secara kolaboratif.',
          kompetensi: ['Merancang konsep & sketsa/desain prototipe karya (C5)', 'Bereksperimen dengan teknik & medium inovatif (C4)'],
          materi: ['Perancangan Konsep & Desain Artistik', 'Eksperimen Bahan, Alat, dan K3 Studio'],
          variasiKeterampilan: 'Inovasi desain, problem-solving artistik, dan ketekunan berkarya.',
        },
        {
          id: 'el-seni-4',
          name: 'Menciptakan (Making/Creating)',
          deskripsi: 'Peserta didik memproduksi karya seni atau produk kreatif yang orisinal, estetis, dan fungsional sesuai tahapan prosedur yang telah dirancang.',
          kompetensi: ['Menciptakan karya seni/produk kreatif orisinal (C6)', 'Menyelesaikan detail penyajian/finishing karya (C4)'],
          materi: ['Produksi Karya Orisinal & Kreatif', 'Penyajian dan Pengemasan Karya'],
          variasiKeterampilan: 'Keterampilan motorik halus/teknis, kreativitas tinggi, dan produktivitas karya.',
        },
        {
          id: 'el-seni-5',
          name: 'Berdampak (Impacting)',
          deskripsi: 'Peserta didik memamerkan, mempertunjukkan, atau memublikasikan karya seni kepada masyarakat luas sehingga memberikan dampak positif bagi diri sendiri, lingkungan sekolah, dan pelestarian budaya.',
          kompetensi: ['Menyelenggarakan pameran/pergelaran karya (C6)', 'Mengevaluasi dampak apresiasi publik terhadap karya (C5)'],
          materi: ['Manajemen Pameran / Pergelaran Karya', 'Publikasi Digital & Portofolio Kreatif'],
          variasiKeterampilan: 'Manajemen acara/kurasi pameran, komunikasi publik, dan jiwa kewirausahaan kreatif.',
        },
      ],
    };
  }

  if (isPaud) {
    return {
      rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran Fase Fondasi (${gradeStr}) dirancang untuk membangun fondasi kematangan emosional, spiritual, motorik, sosial, serta kematangan kognitif pra-literasi dan pra-numerasi yang menyenangkan dan holistik.`,
      cpElements: [
        {
          id: 'el-paud-1',
          name: 'Nilai Agama dan Budi Pekerti',
          deskripsi: 'Anak percaya kepada Tuhan Yang Maha Esa, mulai mengenal dan mempraktikkan ajaran pokok sesuai dengan agama dan kepercayaannya; anak berpartisipasi aktif dalam menjaga kebersihan, kesehatan, dan keselamatan diri sebagai bentuk rasa sayang terhadap dirinya dan rasa syukur kepada Tuhan Yang Maha Esa; anak menghargai sesama manusia dengan berbagai perbedaannya dan mempraktikkan perilaku baik dan berakhlak mulia; serta anak menghargai alam dengan cara merawatnya.',
          kompetensi: ['Mengenal ciptaan Tuhan & membiasakan doa harian (C2)', 'Mempraktikkan perilaku santun, jujur & berbagi dengan teman (C3)', 'Menjaga kebersihan diri dan merawat tanaman/hewan (C3)'],
          materi: ['Doa Harian, Syukur & Mengenal Ciptaan Tuhan', 'Pembiasaan Akhlak Mulia, Jujur, dan Tolong-menolong', 'Kebersihan Diri (PHBS) & Cinta Lingkungan'],
          variasiKeterampilan: 'Pembiasaan spiritual-moral, kemandirian merawat diri, dan empati sosial.',
        },
        {
          id: 'el-paud-2',
          name: 'Jati Diri',
          deskripsi: 'Anak mengenali, mengekspresikan, dan mengelola emosi diri serta membangun hubungan sosial secara sehat; anak mengenal dan memiliki perilaku positif terhadap identitas dan perannya sebagai bagian dari keluarga, sekolah, masyarakat, dan anak Indonesia sehingga dapat menyesuaikan diri dengan lingkungan, aturan, dan norma yang berlaku; serta anak menggunakan fungsi gerak (motorik kasar, halus, dan taktil) untuk mengeksplorasi dan memanipulasi berbagai objek dan lingkungan sekitar.',
          kompetensi: ['Mengenali & mengelola emosi diri secara sehat (C3)', 'Mematuhi kesepakatan aturan bermain bersama (C3)', 'Melakukan koordinasi gerak motorik kasar & halus (C3)'],
          materi: ['Pengenalan Identitas Diri, Keluarga & Budaya Indonesia', 'Regulasi Emosi & Sosialisasi Teman Sebaya', 'Eksplorasi Motorik Kasar, Halus, dan Taktil'],
          variasiKeterampilan: 'Kematangan sosial-emosional, koordinasi sensorimotorik, dan kepercayaan diri.',
        },
        {
          id: 'el-paud-3',
          name: 'Dasar-dasar Literasi, Matematika, Sains, Teknologi, Rekayasa, dan Seni',
          deskripsi: 'Anak mengenali dan memahami berbagai informasi, mengomunikasikan perasaan dan pikiran secara lisan, tulisan, atau menggunakan berbagai media serta membangun percakapan; anak menunjukkan minat, kegemaran, dan berpartisipasi dalam kegiatan pramembaca dan pramenulis; anak mengenali dan menggunakan konsep pramatematika untuk memecahkan masalah di dalam kehidupan sehari-hari; anak menunjukkan kemampuan dasar berpikir kritis, kreatif, dan kolaboratif melalui eksplorasi sains, teknologi sederhana, rekayasa, dan karya seni.',
          kompetensi: ['Menceritakan kembali kisah & mengenal simbol huruf/bunyi (C3)', 'Mengelompokkan pola, bentuk geometri & membilang benda konkret (C3)', 'Melakukan eksperimen sains sederhana & berkarya seni (C4)'],
          materi: ['Keaksaraan Awal (Pramembaca, Pramenulis & Bercerita)', 'Pramatematika (Pola, Bilangan, Ukuran & Bentuk)', 'Eksplorasi Sains Kontekstual, Rekayasa Balok & Ekspresi Seni'],
          variasiKeterampilan: 'Kesiapan keaksaraan-numerasi, rasa ingin tahu saintifik, dan imajinasi kreatif.',
        },
      ],
    };
  }

  // Dynamic synthesis from official CP_LIBRARY_ITEMS or bookOverride if available
  const activeElemenNames =
    (bookOverride?.elemenList && bookOverride.elemenList.length > 0
      ? bookOverride.elemenList
      : matchedLibItem?.elemenList) || [
      `Pemahaman Konsep ${mapelName}`,
      'Keterampilan Proses & Aplikasi Kontekstual',
    ];
  const baseDesc =
    bookOverride?.desc ||
    matchedLibItem?.desc ||
    `Peserta didik mampu menganalisis konsep-konsep esensial ${mapelName}, mengaitkan teori dengan fenomena kontekstual, serta memecahkan persoalan nyata secara sistematis dan kritis sesuai KepKa BSKAP No. 046/H/KR/2025.`;

  return {
    rasional: `Berdasarkan Keputusan Kepala BSKAP Kemendikdasmen No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024 (https://kurikulum.kemendikdasmen.go.id/), Capaian Pembelajaran ${mapelName} Fase ${faseCode} (${gradeStr}) dirancang untuk mengembangkan penguasaan kompetensi mendalam (deep learning), penalaran kritis, dan keterampilan aplikatif peserta didik. ${baseDesc}`,
    cpElements: activeElemenNames.map((elName, idx) => ({
      id: `el-bskap-${idx + 1}`,
      name: elName,
      deskripsi:
        idx === 0
          ? `Pada akhir Fase ${faseCode} (${gradeStr}), dalam elemen ${elName}, ${baseDesc.charAt(0).toLowerCase() + baseDesc.slice(1)}`
          : `Pada akhir Fase ${faseCode} (${gradeStr}), dalam elemen ${elName}, peserta didik mampu menerapkan prosedur penyelidikan, menganalisis data dan kasus nyata, mengevaluasi alternatif solusi, serta mengomunikasikan hasil karya/praktik ${mapelName} secara kolaboratif, etis, dan bertanggung jawab sesuai standar KepKa BSKAP No. 046/H/KR/2025.`,
      kompetensi: [
        `Menganalisis konsep inti ${elName} (C4)`,
        `Mengaplikasikan prosedur & studi kasus ${elName} (C3)`,
        `Mengevaluasi & menyajikan solusi pada elemen ${elName} (C5)`,
      ],
      materi: getSyncedSubChaptersForBab(mapelName, gradeStr, idx + 1).slice(0, 4),
      variasiKeterampilan: `Penalaran kritis pada elemen ${elName}, pemecahan masalah kontekstual, dan literasi terapan.`,
    })),
  };
}

export interface CpValidationDiscrepancy {
  elementName: string;
  issueType: 'missing_element' | 'description_mismatch' | 'extra_element';
  currentDescription?: string;
  officialDescription: string;
  message: string;
}

export interface CpValidationResult {
  isValid: boolean;
  updateAvailable: boolean;
  statusLabel: string;
  regulationRef: string;
  totalOfficial: number;
  matchedCount: number;
  discrepancies: CpValidationDiscrepancy[];
  officialElements: CpElement[];
}

/**
 * Validates active CP elements against the official KepKa BSKAP No. 046/H/KR/2025 elements
 */
export function validateCpElementsAgainstBskap2025(
  currentElements: CpElement[],
  officialElements: CpElement[]
): CpValidationResult {
  const norm = (s?: string) => (s || '').trim().replace(/\s+/g, ' ');
  const discrepancies: CpValidationDiscrepancy[] = [];
  let matchedCount = 0;

  const safeCurrent = Array.isArray(currentElements) ? currentElements : [];
  const safeOfficial = Array.isArray(officialElements) ? officialElements : [];

  for (const offEl of safeOfficial) {
    const found = safeCurrent.find(
      (c) => norm(c.name).toLowerCase() === norm(offEl.name).toLowerCase()
    );

    if (!found) {
      discrepancies.push({
        elementName: offEl.name,
        issueType: 'missing_element',
        officialDescription: offEl.deskripsi,
        message: `Elemen CP resmi "${offEl.name}" sesuai KepKa BSKAP 046/2025 belum tersedia pada data aktif.`,
      });
    } else if (norm(found.deskripsi) !== norm(offEl.deskripsi)) {
      discrepancies.push({
        elementName: offEl.name,
        issueType: 'description_mismatch',
        currentDescription: found.deskripsi,
        officialDescription: offEl.deskripsi,
        message: `Deskripsi elemen "${offEl.name}" berbeda dengan teks resmi KepKa BSKAP No. 046/H/KR/2025.`,
      });
    } else {
      matchedCount++;
    }
  }

  for (const curEl of safeCurrent) {
    const existsInOfficial = safeOfficial.some(
      (o) => norm(o.name).toLowerCase() === norm(curEl.name).toLowerCase()
    );
    if (!existsInOfficial) {
      discrepancies.push({
        elementName: curEl.name,
        issueType: 'extra_element',
        currentDescription: curEl.deskripsi,
        officialDescription: '-',
        message: `Elemen "${curEl.name}" berasal dari versi lama/kustom dan berbeda dengan struktur elemen resmi KepKa BSKAP No. 046/H/KR/2025.`,
      });
    }
  }

  const isValid = discrepancies.length === 0 && safeOfficial.length > 0;

  return {
    isValid,
    updateAvailable: !isValid,
    statusLabel: isValid
      ? 'Terverifikasi Sesuai KepKa BSKAP 046/2025'
      : 'Pembaruan Tersedia',
    regulationRef: 'KepKa BSKAP No. 046/H/KR/2025 & Permendikbudristek No. 12 Tahun 2024',
    totalOfficial: safeOfficial.length,
    matchedCount,
    discrepancies,
    officialElements: safeOfficial,
  };
}

export type TeachingDayName = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export const ALL_TEACHING_DAYS: TeachingDayName[] = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const DAY_NAME_TO_UTC_DAY: Record<TeachingDayName, number> = {
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

const UTC_DAY_TO_DAY_NAME: Record<number, TeachingDayName> = {
  1: 'Senin',
  2: 'Selasa',
  3: 'Rabu',
  4: 'Kamis',
  5: 'Jumat',
  6: 'Sabtu',
};

const INDONESIAN_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export interface AffectedTeachingDate {
  dateStr: string;
  formattedDate: string;
  dayName: TeachingDayName;
  monthName: string;
  semester: 1 | 2;
  eventName: string;
  eventType: string;
  eventNotes: string;
}

export interface MonthlyRealTeachingStat {
  monthName: string;
  year: number;
  semester: 1 | 2;
  scheduledCount: number;
  holidayCount: number;
  effectiveCount: number;
  affectedSummary: string;
}

export interface DayOfWeekHolidayStat {
  dayName: TeachingDayName;
  totalInYear: number;
  holidayInYear: number;
  effectiveInYear: number;
}

export interface RealTeachingScheduleAnalysis {
  selectedDays: TeachingDayName[];
  academicYear: string;
  semester1: {
    scheduledDays: number;
    holidayAffectedDays: number;
    effectiveMeetings: number;
    effectiveJp: number;
    months: MonthlyRealTeachingStat[];
    affectedDates: AffectedTeachingDate[];
  };
  semester2: {
    scheduledDays: number;
    holidayAffectedDays: number;
    effectiveMeetings: number;
    effectiveJp: number;
    months: MonthlyRealTeachingStat[];
    affectedDates: AffectedTeachingDate[];
  };
  totalScheduledDays: number;
  totalHolidayAffectedDays: number;
  totalEffectiveMeetings: number;
  totalEffectiveJp: number;
  affectedDates: AffectedTeachingDate[];
  dayOfWeekStats: Record<TeachingDayName, DayOfWeekHolidayStat>;
}

/**
 * Menganalisis jadwal hari mengajar riil guru di kelas terhadap tanggal libur/kegiatan di Kalender Pendidikan
 */
export function analyzeRealTeachingSchedule(params: {
  academicYear: string;
  selectedDays: TeachingDayName[];
  kaldikEvents: {
    id?: string;
    name: string;
    dateStart: string;
    dateEnd: string;
    type: string;
    notes?: string;
  }[];
  jpPerMeetingS1?: number;
  jpPerMeetingS2?: number;
  jpPerWeekS1?: number;
  jpPerWeekS2?: number;
}): RealTeachingScheduleAnalysis {
  const {
    academicYear = '2026/2027',
    selectedDays = [],
    kaldikEvents = [],
    jpPerMeetingS1,
    jpPerMeetingS2,
    jpPerWeekS1 = 4,
    jpPerWeekS2 = 4,
  } = params;

  const daysPerWeekCount = Math.max(1, selectedDays.length);
  const effectiveJpPerMeetingS1 =
    jpPerMeetingS1 !== undefined ? jpPerMeetingS1 : jpPerWeekS1 / daysPerWeekCount;
  const effectiveJpPerMeetingS2 =
    jpPerMeetingS2 !== undefined ? jpPerMeetingS2 : jpPerWeekS2 / daysPerWeekCount;

  const yearParts = academicYear.split('/').map((p) => parseInt(p.trim(), 10));
  const startYear = !isNaN(yearParts[0]) ? yearParts[0] : 2026;
  const endYear = !isNaN(yearParts[1]) ? yearParts[1] : startYear + 1;

  const selectedDayNumbers = new Set(
    selectedDays.map((d) => DAY_NAME_TO_UTC_DAY[d]).filter(Boolean)
  );

  const dayOfWeekStats: Record<TeachingDayName, DayOfWeekHolidayStat> = {
    Senin: { dayName: 'Senin', totalInYear: 0, holidayInYear: 0, effectiveInYear: 0 },
    Selasa: { dayName: 'Selasa', totalInYear: 0, holidayInYear: 0, effectiveInYear: 0 },
    Rabu: { dayName: 'Rabu', totalInYear: 0, holidayInYear: 0, effectiveInYear: 0 },
    Kamis: { dayName: 'Kamis', totalInYear: 0, holidayInYear: 0, effectiveInYear: 0 },
    Jumat: { dayName: 'Jumat', totalInYear: 0, holidayInYear: 0, effectiveInYear: 0 },
    Sabtu: { dayName: 'Sabtu', totalInYear: 0, holidayInYear: 0, effectiveInYear: 0 },
  };

  const semesterMonthsConfig: { year: number; monthIdx: number; semester: 1 | 2 }[] = [
    { year: startYear, monthIdx: 6, semester: 1 }, // Juli
    { year: startYear, monthIdx: 7, semester: 1 }, // Agustus
    { year: startYear, monthIdx: 8, semester: 1 }, // September
    { year: startYear, monthIdx: 9, semester: 1 }, // Oktober
    { year: startYear, monthIdx: 10, semester: 1 }, // November
    { year: startYear, monthIdx: 11, semester: 1 }, // Desember
    { year: endYear, monthIdx: 0, semester: 2 }, // Januari
    { year: endYear, monthIdx: 1, semester: 2 }, // Februari
    { year: endYear, monthIdx: 2, semester: 2 }, // Maret
    { year: endYear, monthIdx: 3, semester: 2 }, // April
    { year: endYear, monthIdx: 4, semester: 2 }, // Mei
    { year: endYear, monthIdx: 5, semester: 2 }, // Juni
  ];

  const s1Months: MonthlyRealTeachingStat[] = [];
  const s2Months: MonthlyRealTeachingStat[] = [];
  const s1Affected: AffectedTeachingDate[] = [];
  const s2Affected: AffectedTeachingDate[] = [];

  for (const cfg of semesterMonthsConfig) {
    const { year, monthIdx, semester } = cfg;
    const monthName = INDONESIAN_MONTH_NAMES[monthIdx];
    const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();

    let scheduledCount = 0;
    let holidayCount = 0;
    const monthAffectedItems: string[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const utcDay = new Date(Date.UTC(year, monthIdx, day)).getUTCDay();
      const dayName = UTC_DAY_TO_DAY_NAME[utcDay];
      if (!dayName) continue; // Minggu (0)

      const mm = String(monthIdx + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;

      const matchedEvent = kaldikEvents.find(
        (ev) => ev.dateStart <= dateStr && dateStr <= ev.dateEnd
      );

      // Update per-weekday stats across the full academic year
      dayOfWeekStats[dayName].totalInYear += 1;
      if (matchedEvent) {
        dayOfWeekStats[dayName].holidayInYear += 1;
      } else {
        dayOfWeekStats[dayName].effectiveInYear += 1;
      }

      if (!selectedDayNumbers.has(utcDay)) {
        continue;
      }

      scheduledCount += 1;

      if (matchedEvent) {
        holidayCount += 1;
        const formattedDate = `${day} ${monthName} ${year}`;
        const affectedRecord: AffectedTeachingDate = {
          dateStr,
          formattedDate,
          dayName,
          monthName,
          semester,
          eventName: matchedEvent.name,
          eventType: matchedEvent.type,
          eventNotes: matchedEvent.notes || '',
        };
        if (semester === 1) {
          s1Affected.push(affectedRecord);
        } else {
          s2Affected.push(affectedRecord);
        }
        monthAffectedItems.push(`${dayName}, ${day} ${monthName.slice(0, 3)} (${matchedEvent.name})`);
      }
    }

    const effectiveCount = Math.max(0, scheduledCount - holidayCount);
    const stat: MonthlyRealTeachingStat = {
      monthName,
      year,
      semester,
      scheduledCount,
      holidayCount,
      effectiveCount,
      affectedSummary:
        monthAffectedItems.length > 0
          ? monthAffectedItems.join('; ')
          : scheduledCount > 0
          ? 'Efektif Penuh (Tidak Terkena Libur)'
          : '-',
    };

    if (semester === 1) {
      s1Months.push(stat);
    } else {
      s2Months.push(stat);
    }
  }

  const s1Scheduled = s1Months.reduce((a, m) => a + m.scheduledCount, 0);
  const s1Holiday = s1Months.reduce((a, m) => a + m.holidayCount, 0);
  const s1Effective = s1Months.reduce((a, m) => a + m.effectiveCount, 0);

  const s2Scheduled = s2Months.reduce((a, m) => a + m.scheduledCount, 0);
  const s2Holiday = s2Months.reduce((a, m) => a + m.holidayCount, 0);
  const s2Effective = s2Months.reduce((a, m) => a + m.effectiveCount, 0);

  const s1EffectiveJp = Math.round(s1Effective * effectiveJpPerMeetingS1);
  const s2EffectiveJp = Math.round(s2Effective * effectiveJpPerMeetingS2);

  return {
    selectedDays,
    academicYear,
    semester1: {
      scheduledDays: s1Scheduled,
      holidayAffectedDays: s1Holiday,
      effectiveMeetings: s1Effective,
      effectiveJp: s1EffectiveJp,
      months: s1Months,
      affectedDates: s1Affected,
    },
    semester2: {
      scheduledDays: s2Scheduled,
      holidayAffectedDays: s2Holiday,
      effectiveMeetings: s2Effective,
      effectiveJp: s2EffectiveJp,
      months: s2Months,
      affectedDates: s2Affected,
    },
    totalScheduledDays: s1Scheduled + s2Scheduled,
    totalHolidayAffectedDays: s1Holiday + s2Holiday,
    totalEffectiveMeetings: s1Effective + s2Effective,
    totalEffectiveJp: s1EffectiveJp + s2EffectiveJp,
    affectedDates: [...s1Affected, ...s2Affected],
    dayOfWeekStats,
  };
}

export interface CalendarDayCell {
  dateStr: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isSunday: boolean;
  dayName: TeachingDayName | 'Minggu';
  isTeachingDay: boolean;
  events: {
    id?: string;
    name: string;
    type: string;
  }[];
}

export interface AcademicCalendarMonthGrid {
  year: number;
  monthIdx: number;
  monthName: string;
  semester: 1 | 2;
  leadingEmptyCount: number;
  days: CalendarDayCell[];
}

/**
 * Membangun grid kalender 12 bulan (Juli s.d. Juni) untuk Tahun Pelajaran tertentu
 * lengkap dengan penandaan hari mengajar & event Kalender Pendidikan.
 */
export function buildAcademicYearCalendarMonths(params: {
  academicYear: string;
  selectedDays: TeachingDayName[];
  weekStartsOn?: 'monday' | 'sunday';
  kaldikEvents: {
    id?: string;
    name: string;
    dateStart: string;
    dateEnd: string;
    type: string;
  }[];
}): AcademicCalendarMonthGrid[] {
  const {
    academicYear = '2026/2027',
    selectedDays = [],
    weekStartsOn = 'monday',
    kaldikEvents = [],
  } = params;
  const yearParts = academicYear.split('/').map((p) => parseInt(p.trim(), 10));
  const startYear = !isNaN(yearParts[0]) ? yearParts[0] : 2026;
  const endYear = !isNaN(yearParts[1]) ? yearParts[1] : startYear + 1;

  const selectedDayNumbers = new Set(
    selectedDays.map((d) => DAY_NAME_TO_UTC_DAY[d]).filter(Boolean)
  );

  const monthsOrder: { year: number; monthIdx: number; semester: 1 | 2 }[] = [
    { year: startYear, monthIdx: 6, semester: 1 },
    { year: startYear, monthIdx: 7, semester: 1 },
    { year: startYear, monthIdx: 8, semester: 1 },
    { year: startYear, monthIdx: 9, semester: 1 },
    { year: startYear, monthIdx: 10, semester: 1 },
    { year: startYear, monthIdx: 11, semester: 1 },
    { year: endYear, monthIdx: 0, semester: 2 },
    { year: endYear, monthIdx: 1, semester: 2 },
    { year: endYear, monthIdx: 2, semester: 2 },
    { year: endYear, monthIdx: 3, semester: 2 },
    { year: endYear, monthIdx: 4, semester: 2 },
    { year: endYear, monthIdx: 5, semester: 2 },
  ];

  return monthsOrder.map(({ year, monthIdx, semester }) => {
    const firstUtcDay = new Date(Date.UTC(year, monthIdx, 1)).getUTCDay();
    const leadingEmptyCount =
      weekStartsOn === 'sunday'
        ? firstUtcDay
        : firstUtcDay === 0
        ? 6
        : firstUtcDay - 1;
    const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
    const mm = String(monthIdx + 1).padStart(2, '0');

    const days: CalendarDayCell[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const utcDay = new Date(Date.UTC(year, monthIdx, d)).getUTCDay();
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      const isSunday = utcDay === 0;
      const dayName: TeachingDayName | 'Minggu' = isSunday
        ? 'Minggu'
        : UTC_DAY_TO_DAY_NAME[utcDay] || 'Senin';

      const matchingEvents = kaldikEvents
        .filter((ev) => ev.dateStart <= dateStr && dateStr <= ev.dateEnd)
        .map((ev) => ({ id: ev.id, name: ev.name, type: ev.type }));

      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isSunday,
        dayName,
        isTeachingDay: !isSunday && selectedDayNumbers.has(utcDay),
        events: matchingEvents,
      });
    }

    return {
      year,
      monthIdx,
      monthName: INDONESIAN_MONTH_NAMES[monthIdx],
      semester,
      leadingEmptyCount,
      days,
    };
  });
}

const SHORT_MONTH_NAMES_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Menghasilkan label bulan & tahun dalam Bahasa Indonesia dari YYYY-MM-DD (mis. "Juli 2026").
 */
export function getIndonesianMonthYearLabel(dateStr: string): string {
  const parts = (dateStr || '').split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  if (isNaN(year) || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) {
    return dateStr;
  }
  return `${INDONESIAN_MONTH_NAMES[monthIdx]} ${year}`;
}

/**
 * Memformat rentang tanggal menjadi teks ringkas Indonesia (mis. "1 - 11 Juli 2026" atau "17 Agustus 2026").
 */
export function formatDateRangeLabelId(dateStart: string, dateEnd: string): string {
  const startParts = (dateStart || '').split('-').map((n) => parseInt(n, 10));
  const endParts = (dateEnd || dateStart || '').split('-').map((n) => parseInt(n, 10));
  if (startParts.length !== 3 || startParts.some(isNaN)) return dateStart;
  if (endParts.length !== 3 || endParts.some(isNaN)) return dateStart;

  const [sy, sm, sd] = startParts;
  const [ey, em, ed] = endParts;
  const sMonthFull = INDONESIAN_MONTH_NAMES[sm - 1] || '';
  const eMonthFull = INDONESIAN_MONTH_NAMES[em - 1] || '';
  const sMonthShort = SHORT_MONTH_NAMES_ID[sm - 1] || '';
  const eMonthShort = SHORT_MONTH_NAMES_ID[em - 1] || '';

  if (sy === ey && sm === em && sd === ed) {
    return `${sd} ${sMonthFull} ${sy}`;
  }
  if (sy === ey && sm === em) {
    return `${sd} - ${ed} ${sMonthFull} ${sy}`;
  }
  if (sy === ey) {
    return `${sd} ${sMonthShort} - ${ed} ${eMonthShort} ${sy}`;
  }
  return `${sd} ${sMonthShort} ${sy} - ${ed} ${eMonthShort} ${ey}`;
}

/**
 * Memformat ringkasan tanggal event untuk footer kartu bulan (mis. "1-11 Jul", "17 Agu").
 */
export function formatMonthBulletDateRange(
  dateStart: string,
  dateEnd: string,
  targetYear: number,
  targetMonthIdx: number
): string {
  const monthStartStr = `${targetYear}-${String(targetMonthIdx + 1).padStart(2, '0')}-01`;
  const daysInMonth = new Date(Date.UTC(targetYear, targetMonthIdx + 1, 0)).getUTCDate();
  const monthEndStr = `${targetYear}-${String(targetMonthIdx + 1).padStart(2, '0')}-${String(
    daysInMonth
  ).padStart(2, '0')}`;

  const clampedStart = dateStart > monthStartStr ? dateStart : monthStartStr;
  const clampedEnd = (dateEnd || dateStart) < monthEndStr ? (dateEnd || dateStart) : monthEndStr;

  const sDay = parseInt(clampedStart.split('-')[2] || '1', 10);
  const eDay = parseInt(clampedEnd.split('-')[2] || String(sDay), 10);
  const shortMonth = SHORT_MONTH_NAMES_ID[targetMonthIdx] || '';

  if (sDay === eDay) {
    return `${sDay} ${shortMonth}`;
  }
  return `${sDay}-${eDay} ${shortMonth}`;
}

function shiftIsoDateByYears(dateStr: string, deltaYears: number): string {
  const parts = (dateStr || '').split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) return dateStr;
  const [y, m, d] = parts;
  const nextYear = y + deltaYears;
  const maxDayInMonth = new Date(Date.UTC(nextYear, m, 0)).getUTCDate();
  const clampedDay = Math.min(d, maxDayInMonth);
  return `${nextYear}-${String(m).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

/**
 * Menyesuaikan seluruh agenda Kalender Pendidikan ke Tahun Pelajaran target (mis. 2027/2028)
 * dengan menggeser tanggal, label Tahun Pelajaran, serta tahun referensi pada uraian.
 */
export function adaptKaldikEventsToAcademicYear<
  T extends {
    id: string;
    dateStart: string;
    dateEnd: string;
    name: string;
    type: string;
    color: string;
    notes: string;
  }
>(events: T[], targetAcademicYear: string): T[] {
  const targetParts = targetAcademicYear.split('/').map((p) => parseInt(p.trim(), 10));
  const targetStartYear = !isNaN(targetParts[0]) ? targetParts[0] : 2026;
  const targetEndYear = !isNaN(targetParts[1]) ? targetParts[1] : targetStartYear + 1;

  // Detect current base startYear from existing Jul-Dec events (or earliest event)
  let baseStartYear = targetStartYear;
  const sem1Event = events.find((ev) => {
    const m = parseInt((ev.dateStart || '').split('-')[1] || '0', 10);
    return m >= 7 && m <= 12;
  });
  const refEvent = sem1Event || events[0];
  if (refEvent && refEvent.dateStart) {
    const refYear = parseInt(refEvent.dateStart.split('-')[0], 10);
    const refMonth = parseInt(refEvent.dateStart.split('-')[1], 10);
    if (!isNaN(refYear) && !isNaN(refMonth)) {
      baseStartYear = refMonth >= 7 ? refYear : refYear - 1;
    }
  }

  const deltaYears = targetStartYear - baseStartYear;
  if (deltaYears === 0) return events;

  const baseEndYear = baseStartYear + 1;
  const replaceYearsInText = (text: string): string => {
    let out = text || '';
    // Update Indonesian independence anniversary count if present ("ke-81" -> "ke-82")
    out = out.replace(/ke-(\d{2,3})/gi, (_m, numStr) => {
      const n = parseInt(numStr, 10);
      return isNaN(n) ? _m : `ke-${n + deltaYears}`;
    });
    // Replace academic year pairs and standalone year references via non-colliding tokens
    out = out
      .replace(new RegExp(`${baseStartYear}/${baseEndYear}`, 'g'), '__ACAD_YEAR_TOKEN__')
      .replace(new RegExp(`\\b${baseStartYear}\\b`, 'g'), '__START_YEAR_TOKEN__')
      .replace(new RegExp(`\\b${baseEndYear}\\b`, 'g'), '__END_YEAR_TOKEN__')
      .replace(/__ACAD_YEAR_TOKEN__/g, `${targetStartYear}/${targetEndYear}`)
      .replace(/__START_YEAR_TOKEN__/g, String(targetStartYear))
      .replace(/__END_YEAR_TOKEN__/g, String(targetEndYear));
    return out;
  };

  return events.map((ev) => ({
    ...ev,
    dateStart: shiftIsoDateByYears(ev.dateStart, deltaYears),
    dateEnd: shiftIsoDateByYears(ev.dateEnd || ev.dateStart, deltaYears),
    name: replaceYearsInText(ev.name),
    notes: replaceYearsInText(ev.notes),
  }));
}

/**
 * Ringkasan kesesuaian Alokasi Waktu TP dengan ketersediaan JP Efektif pada RPE
 */
export function summarizeTpTimeAllocation(params: {
  rpeNetJpS1: number;
  rpeNetJpS2: number;
  protaItems: { semester: number; alokasiJp: number }[];
}) {
  const s1AllocatedJp = params.protaItems
    .filter((p) => Number(p.semester) === 1)
    .reduce((acc, p) => acc + (Number(p.alokasiJp) || 0), 0);
  const s2AllocatedJp = params.protaItems
    .filter((p) => Number(p.semester) === 2)
    .reduce((acc, p) => acc + (Number(p.alokasiJp) || 0), 0);

  const totalRpeNetJp = params.rpeNetJpS1 + params.rpeNetJpS2;
  const totalAllocatedJp = s1AllocatedJp + s2AllocatedJp;

  return {
    s1RpeNetJp: params.rpeNetJpS1,
    s1AllocatedJp,
    s1Diff: params.rpeNetJpS1 - s1AllocatedJp,
    s2RpeNetJp: params.rpeNetJpS2,
    s2AllocatedJp,
    s2Diff: params.rpeNetJpS2 - s2AllocatedJp,
    totalRpeNetJp,
    totalAllocatedJp,
    totalDiff: totalRpeNetJp - totalAllocatedJp,
    isAligned: totalRpeNetJp === totalAllocatedJp,
  };
}

/**
 * Menghitung ulang RPE 12 bulan standar langsung dari daftar agenda Kalender Pendidikan (Kaldik)
 * dan mereset override jumlah pertemuan manual.
 */
export function buildStandardYearRpeFromKaldik(params: {
  kaldikEvents: {
    dateStart: string;
    dateEnd: string;
    name: string;
    type: string;
  }[];
  jpPerWeekS1: number;
  jpPerWeekS2: number;
  cadanganJpS1: number;
  cadanganJpS2: number;
  academicYear: string;
}) {
  const {
    kaldikEvents,
    jpPerWeekS1,
    jpPerWeekS2,
    cadanganJpS1,
    cadanganJpS2,
    academicYear = '2026/2027',
  } = params;

  const yearParts = academicYear.split('/').map((p) => parseInt(p.trim(), 10));
  const startYear = !isNaN(yearParts[0]) ? yearParts[0] : 2026;
  const endYear = !isNaN(yearParts[1]) ? yearParts[1] : startYear + 1;

  const monthsSpec: { year: number; monthIdx: number; semester: 1 | 2 }[] = [
    { year: startYear, monthIdx: 6, semester: 1 },
    { year: startYear, monthIdx: 7, semester: 1 },
    { year: startYear, monthIdx: 8, semester: 1 },
    { year: startYear, monthIdx: 9, semester: 1 },
    { year: startYear, monthIdx: 10, semester: 1 },
    { year: startYear, monthIdx: 11, semester: 1 },
    { year: endYear, monthIdx: 0, semester: 2 },
    { year: endYear, monthIdx: 1, semester: 2 },
    { year: endYear, monthIdx: 2, semester: 2 },
    { year: endYear, monthIdx: 3, semester: 2 },
    { year: endYear, monthIdx: 4, semester: 2 },
    { year: endYear, monthIdx: 5, semester: 2 },
  ];

  const computeMonthRow = (year: number, monthIdx: number, semester: 1 | 2) => {
    const daysInMonth = new Date(Date.UTC(year, monthIdx + 1, 0)).getUTCDate();
    let mondays = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      if (new Date(Date.UTC(year, monthIdx, d)).getUTCDay() === 1) {
        mondays += 1;
      }
    }
    const totalWeeks = Math.max(4, mondays);
    const mm = String(monthIdx + 1).padStart(2, '0');
    const monthStart = `${year}-${mm}-01`;
    const monthEnd = `${year}-${mm}-${String(daysInMonth).padStart(2, '0')}`;

    const overlapping = kaldikEvents
      .filter((ev) => ev.dateStart <= monthEnd && (ev.dateEnd || ev.dateStart) >= monthStart)
      .sort((a, b) => a.dateStart.localeCompare(b.dateStart));

    // Count distinct non-Sunday days covered by non-KBM events in this month
    let nonEffectiveDays = 0;
    let hasFullWeekAssessment = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const utcDay = new Date(Date.UTC(year, monthIdx, d)).getUTCDay();
      if (utcDay === 0) continue;
      const dateStr = `${year}-${mm}-${String(d).padStart(2, '0')}`;
      const dayEvents = overlapping.filter(
        (ev) => ev.dateStart <= dateStr && dateStr <= (ev.dateEnd || ev.dateStart)
      );
      const blocksKbm = dayEvents.some(
        (ev) =>
          ev.type === 'libur_semester' ||
          ev.type === 'libur_nasional' ||
          ev.type === 'sts' ||
          ev.type === 'sas' ||
          ev.name.toLowerCase().includes('mpls') ||
          ev.name.toLowerCase().includes('ujian') ||
          ev.name.toLowerCase().includes('rapor')
      );
      if (blocksKbm) {
        nonEffectiveDays += 1;
      }
    }

    if (overlapping.some((ev) => ev.type === 'sts' || ev.type === 'sas')) {
      hasFullWeekAssessment += 1;
    }

    const weeksFromDays = Math.round(nonEffectiveDays / 5);
    const nonEffectiveWeeks = Math.min(
      totalWeeks,
      Math.max(weeksFromDays, hasFullWeekAssessment)
    );
    const effectiveWeeks = Math.max(0, totalWeeks - nonEffectiveWeeks);

    const summaryParts = overlapping.slice(0, 3).map((ev) => {
      const dateLabel = formatMonthBulletDateRange(ev.dateStart, ev.dateEnd, year, monthIdx);
      return `${dateLabel} ${ev.name}`;
    });

    const nonEffectiveNote =
      summaryParts.length > 0
        ? summaryParts.join(', ')
        : `Minggu Efektif KBM Semester ${semester === 1 ? 'Ganjil' : 'Genap'}`;

    return {
      month: `${INDONESIAN_MONTH_NAMES[monthIdx]} ${year}`,
      totalWeeks,
      nonEffectiveWeeks,
      nonEffectiveNote,
      effectiveWeeks,
      effectiveMeetings: undefined,
    };
  };

  const s1Months = monthsSpec
    .filter((m) => m.semester === 1)
    .map((m) => computeMonthRow(m.year, m.monthIdx, 1));
  const s2Months = monthsSpec
    .filter((m) => m.semester === 2)
    .map((m) => computeMonthRow(m.year, m.monthIdx, 2));

  return {
    semester1: {
      jpPerWeek: jpPerWeekS1,
      cadanganJp: cadanganJpS1,
      months: s1Months,
    },
    semester2: {
      jpPerWeek: jpPerWeekS2,
      cadanganJp: cadanganJpS2,
      months: s2Months,
    },
  };
}

/**
 * Menyelaraskan pembaruan antar tabel (Analisis Minggu Efektif 12 Bulan ↔ Distribusi Smt 1 ↔ Distribusi Smt 2)
 * sehingga perubahan Pekan Non-Efektif, Jumlah Pekan, Pertemuan Efektif, maupun Keterangan otomatis sinkron.
 */
export function syncMonthRpeDetailUpdate<
  T extends {
    month: string;
    totalWeeks: number;
    nonEffectiveWeeks: number;
    nonEffectiveNote: string;
    effectiveWeeks: number;
    effectiveMeetings?: number;
  }
>(
  currentMonth: T,
  updates: Partial<T>,
  defaultRealMeetings: number,
  meetingsPerWeek: number
): T {
  const prevEffectiveWeeks = Math.max(
    0,
    currentMonth.totalWeeks - currentMonth.nonEffectiveWeeks
  );
  const nextTotalWeeks =
    updates.totalWeeks !== undefined ? Math.max(1, updates.totalWeeks) : currentMonth.totalWeeks;
  const nextNonEffectiveWeeks =
    updates.nonEffectiveWeeks !== undefined
      ? Math.max(0, Math.min(nextTotalWeeks, updates.nonEffectiveWeeks))
      : Math.min(nextTotalWeeks, currentMonth.nonEffectiveWeeks);
  const nextEffectiveWeeks = Math.max(0, nextTotalWeeks - nextNonEffectiveWeeks);

  let nextEffectiveMeetings = currentMonth.effectiveMeetings;
  if (updates.effectiveMeetings !== undefined) {
    nextEffectiveMeetings = Math.max(0, updates.effectiveMeetings);
  } else if (
    (updates.totalWeeks !== undefined || updates.nonEffectiveWeeks !== undefined) &&
    nextEffectiveWeeks !== prevEffectiveWeeks
  ) {
    if (nextEffectiveWeeks === 0) {
      nextEffectiveMeetings = 0;
    } else {
      const baseMeetings =
        currentMonth.effectiveMeetings !== undefined
          ? currentMonth.effectiveMeetings
          : defaultRealMeetings;
      const weekDelta = nextEffectiveWeeks - prevEffectiveWeeks;
      nextEffectiveMeetings = Math.max(
        0,
        baseMeetings + weekDelta * Math.max(1, meetingsPerWeek)
      );
    }
  }

  return {
    ...currentMonth,
    ...updates,
    totalWeeks: nextTotalWeeks,
    nonEffectiveWeeks: nextNonEffectiveWeeks,
    effectiveWeeks: nextEffectiveWeeks,
    effectiveMeetings: nextEffectiveMeetings,
  };
}

const PROMES_SHORT_TO_FULL_MONTH: Record<string, { full: string; order: number; semester: 1 | 2 }> = {
  Jul: { full: 'Juli', order: 0, semester: 1 },
  Agu: { full: 'Agustus', order: 1, semester: 1 },
  Sep: { full: 'September', order: 2, semester: 1 },
  Okt: { full: 'Oktober', order: 3, semester: 1 },
  Nov: { full: 'November', order: 4, semester: 1 },
  Des: { full: 'Desember', order: 5, semester: 1 },
  Jan: { full: 'Januari', order: 6, semester: 2 },
  Feb: { full: 'Februari', order: 7, semester: 2 },
  Mar: { full: 'Maret', order: 8, semester: 2 },
  Apr: { full: 'April', order: 9, semester: 2 },
  Mei: { full: 'Mei', order: 10, semester: 2 },
  Jun: { full: 'Juni', order: 11, semester: 2 },
};

/**
 * Menghasilkan label perkiraan bulan (misal "Juli - Agustus 2026" atau "Oktober 2026")
 * secara otomatis dari distribusi minggu aktif pada PROMES dan Tahun Ajaran.
 */
export function deriveEstimatedMonthRangeFromDistribution(
  distribution?: { [weekKey: string]: number },
  semester: number = 1,
  academicYear: string = '2026/2027'
): string {
  const yearParts = (academicYear || '2026/2027').split('/').map((p) => parseInt(p.trim(), 10));
  const startYear = !isNaN(yearParts[0]) ? yearParts[0] : 2026;
  const endYear = !isNaN(yearParts[1]) ? yearParts[1] : startYear + 1;

  if (distribution) {
    const activeMonths = new Set<string>();
    Object.entries(distribution).forEach(([key, jp]) => {
      if (Number(jp) > 0) {
        const shortM = key.split('-')[0];
        if (PROMES_SHORT_TO_FULL_MONTH[shortM]) {
          activeMonths.add(shortM);
        }
      }
    });

    if (activeMonths.size > 0) {
      const sorted = Array.from(activeMonths).sort(
        (a, b) => PROMES_SHORT_TO_FULL_MONTH[a].order - PROMES_SHORT_TO_FULL_MONTH[b].order
      );
      const first = PROMES_SHORT_TO_FULL_MONTH[sorted[0]];
      const last = PROMES_SHORT_TO_FULL_MONTH[sorted[sorted.length - 1]];
      const firstYear = first.semester === 1 ? startYear : endYear;
      const lastYear = last.semester === 1 ? startYear : endYear;

      if (sorted.length === 1) {
        return `${first.full} ${firstYear}`;
      }
      if (firstYear === lastYear) {
        return `${first.full} - ${last.full} ${firstYear}`;
      }
      return `${first.full} ${firstYear} - ${last.full} ${lastYear}`;
    }
  }

  return Number(semester) === 2
    ? `Januari - Juni ${endYear}`
    : `Juli - Desember ${startYear}`;
}

/**
 * Mendeteksi semester (1 atau 2) dari label Kode / Jenis TP jika pengguna mengetik kata Ganjil/Genap/Sem 1/Sem 2.
 */
export function inferSemesterFromKodeJenis(
  kodeJenis: string,
  fallbackSemester: number = 1
): 1 | 2 {
  const normalized = (kodeJenis || '').toLowerCase();
  if (
    normalized.includes('genap') ||
    normalized.includes('sem 2') ||
    normalized.includes('sem. 2') ||
    normalized.includes('smt 2') ||
    /\btp\s*2\./i.test(normalized)
  ) {
    return 2;
  }
  if (
    normalized.includes('ganjil') ||
    normalized.includes('sem 1') ||
    normalized.includes('sem. 1') ||
    normalized.includes('smt 1') ||
    /\btp\s*1\./i.test(normalized)
  ) {
    return 1;
  }
  return Number(fallbackSemester) === 2 ? 2 : 1;
}

/**
 * Meratakan alokasi JP dan jumlah pertemuan per TP/Agenda secara otomatis
 * agar jumlah total JP persis sama dengan Total JP Efektif dari RPE.
 */
export function autoBalanceTpAllocations<
  T extends {
    id: string;
    semester: number;
    tpCode: string;
    alokasiJp: number;
    jmlPertemuan?: number;
  }
>(
  items: T[],
  params: {
    targetTotalJpS1: number;
    targetTotalJpS2: number;
    jpPerMeetingS1: number;
    jpPerMeetingS2: number;
  }
): T[] {
  if (items.length === 0) return [];

  const s1Items = items.filter((i) => Number(i.semester) === 1);
  const s2Items = items.filter((i) => Number(i.semester) === 2);

  const distributeWithinGroup = (
    group: T[],
    targetJp: number,
    jpPerMeeting: number
  ): Map<string, { alokasiJp: number; jmlPertemuan: number }> => {
    const result = new Map<string, { alokasiJp: number; jmlPertemuan: number }>();
    if (group.length === 0) return result;

    const safeTarget = Math.max(0, Math.round(targetJp));
    const safePerMeeting = Math.max(1, Math.round(jpPerMeeting));

    const reserveRows = group.filter((g) => g.tpCode.toLowerCase().includes('cadangan'));
    const regularRows = group.filter((g) => !g.tpCode.toLowerCase().includes('cadangan'));

    const allocated = new Array<number>(group.length).fill(0);
    let remainingJp = safeTarget;

    // Beri porsi wajar ke baris Cadangan terlebih dahulu (1 pertemuan bila ada baris TP reguler)
    if (reserveRows.length > 0 && regularRows.length > 0) {
      group.forEach((item, idx) => {
        if (item.tpCode.toLowerCase().includes('cadangan')) {
          const share = Math.min(remainingJp, safePerMeeting);
          allocated[idx] = share;
          remainingJp -= share;
        }
      });
    }

    const targetIndices =
      regularRows.length > 0
        ? group
            .map((item, idx) => (!item.tpCode.toLowerCase().includes('cadangan') ? idx : -1))
            .filter((idx) => idx >= 0)
        : group.map((_, idx) => idx);

    // Distribusikan dalam kelipatan jam per pertemuan terlebih dahulu agar Jml Pertemuan rapi
    const totalMeetingsAvail = Math.floor(remainingJp / safePerMeeting);
    const baseMeetingsPerRow = Math.floor(totalMeetingsAvail / targetIndices.length);
    let extraMeetings = totalMeetingsAvail % targetIndices.length;

    targetIndices.forEach((idx) => {
      const rowMeetings = baseMeetingsPerRow + (extraMeetings > 0 ? 1 : 0);
      if (extraMeetings > 0) extraMeetings--;
      const rowJp = rowMeetings * safePerMeeting;
      allocated[idx] += rowJp;
      remainingJp -= rowJp;
    });

    // Sisa JP (bila target tidak habis dibagi jpPerMeeting) ditambahkan ke baris target terakhir/pertama
    let cursor = 0;
    while (remainingJp > 0 && targetIndices.length > 0) {
      const idx = targetIndices[cursor % targetIndices.length];
      allocated[idx] += 1;
      remainingJp -= 1;
      cursor++;
    }

    group.forEach((item, idx) => {
      const jp = allocated[idx];
      const meetings = jp === 0 ? 0 : Math.max(1, Math.round(jp / safePerMeeting));
      result.set(item.id, { alokasiJp: jp, jmlPertemuan: meetings });
    });

    return result;
  };

  let s1Map: Map<string, { alokasiJp: number; jmlPertemuan: number }>;
  let s2Map: Map<string, { alokasiJp: number; jmlPertemuan: number }>;

  if (s1Items.length > 0 && s2Items.length > 0) {
    s1Map = distributeWithinGroup(s1Items, params.targetTotalJpS1, params.jpPerMeetingS1);
    s2Map = distributeWithinGroup(s2Items, params.targetTotalJpS2, params.jpPerMeetingS2);
  } else if (s1Items.length > 0) {
    s1Map = distributeWithinGroup(
      s1Items,
      params.targetTotalJpS1 + params.targetTotalJpS2,
      params.jpPerMeetingS1
    );
    s2Map = new Map();
  } else {
    s1Map = new Map();
    s2Map = distributeWithinGroup(
      s2Items,
      params.targetTotalJpS1 + params.targetTotalJpS2,
      params.jpPerMeetingS2
    );
  }

  return items.map((item) => {
    const found = s1Map.get(item.id) || s2Map.get(item.id);
    if (!found) return item;
    return {
      ...item,
      alokasiJp: found.alokasiJp,
      jmlPertemuan: found.jmlPertemuan,
    };
  });
}

/**
 * Mengambil hari jadwal mengajar terpilih dari localStorage secara aman
 */
export function getStoredTeachingDays(
  fallback: TeachingDayName[] = ['Senin', 'Rabu']
): TeachingDayName[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('guru_selected_teaching_days_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as TeachingDayName[];
        }
      }
    }
  } catch {
    // ignore storage access issues
  }
  return fallback;
}

export interface UnifiedRpeExportInput {
  rpe: {
    semester1: {
      months: {
        month: string;
        totalWeeks: number;
        nonEffectiveWeeks: number;
        nonEffectiveNote: string;
        effectiveWeeks: number;
        effectiveMeetings?: number;
      }[];
      jpPerWeek: number;
      cadanganJp: number;
    };
    semester2: {
      months: {
        month: string;
        totalWeeks: number;
        nonEffectiveWeeks: number;
        nonEffectiveNote: string;
        effectiveWeeks: number;
        effectiveMeetings?: number;
      }[];
      jpPerWeek: number;
      cadanganJp: number;
    };
  };
  academicYear?: string;
  kaldikEvents?: {
    id: string;
    dateStart: string;
    dateEnd: string;
    name: string;
    type: string;
    notes?: string;
  }[];
  prota?: {
    id: string;
    semester: number;
    babNumber: number;
    babTitle: string;
    tpCode: string;
    tpDescription: string;
    alokasiJp: number;
    keterangan: string;
    jmlPertemuan?: number;
    perkiraanBulan?: string;
  }[];
  promes?: {
    id: string;
    tpCode: string;
    distribution: { [key: string]: number };
  }[];
  selectedDays?: TeachingDayName[];
}

export function formatKaldikCategoryExportLabel(type: string): string {
  switch (type) {
    case 'libur_nasional':
      return 'Libur Nasional';
    case 'libur_semester':
      return 'Libur Semester / Akhir Tahun';
    case 'sts':
      return 'Asesmen Tengah Semester (ATS/STS)';
    case 'sas':
      return 'Asesmen Sumatif Akhir (ASAS/SAT)';
    case 'kegiatan_sekolah':
      return 'Kegiatan Khusus Sekolah';
    default:
      return 'Hari Efektif / Awal Masuk';
  }
}

/**
 * Menyusun payload terpadu untuk seluruh ekspor (Excel, Word, PDF/Cetak) pada menu Kalender & RPE
 * sehingga memuat Langkah 1 (Jadwal Riil), Langkah 2 (Kaldik), Langkah 3 (3 Tabel Sinkron), dan Langkah 4 (Program Alokasi Waktu TP).
 */
export function buildUnifiedRpeExportPayload(input: UnifiedRpeExportInput) {
  const academicYear = input.academicYear || '2026/2027';
  const selectedDays =
    input.selectedDays && input.selectedDays.length > 0
      ? input.selectedDays
      : getStoredTeachingDays();
  const kaldikEvents = input.kaldikEvents || [];
  const prota = input.prota || [];
  const promes = input.promes || [];

  const realAnalysis = analyzeRealTeachingSchedule({
    academicYear,
    selectedDays,
    kaldikEvents,
    jpPerWeekS1: input.rpe.semester1.jpPerWeek,
    jpPerWeekS2: input.rpe.semester2.jpPerWeek,
  });

  const s1Totals = calculateRpeTotals(
    input.rpe.semester1.months,
    input.rpe.semester1.jpPerWeek,
    input.rpe.semester1.cadanganJp
  );
  const s2Totals = calculateRpeTotals(
    input.rpe.semester2.months,
    input.rpe.semester2.jpPerWeek,
    input.rpe.semester2.cadanganJp
  );

  const buildSemesterMonthRows = (
    sem: 1 | 2,
    months: UnifiedRpeExportInput['rpe']['semester1']['months'],
    realMonths: MonthlyRealTeachingStat[],
    jpPerWeek: number,
    noOffset: number
  ) =>
    months.map((m, idx) => {
      const effectiveWeeks = Math.max(0, m.totalWeeks - m.nonEffectiveWeeks);
      const realM = realMonths[idx];
      const fallbackMeetings =
        effectiveWeeks === 0 ? 0 : realM ? realM.effectiveCount : effectiveWeeks;
      const effectiveMeetings =
        m.effectiveMeetings !== undefined ? m.effectiveMeetings : fallbackMeetings;
      return {
        no: noOffset + idx + 1,
        semNo: idx + 1,
        semester: sem,
        month: m.month,
        totalWeeks: m.totalWeeks,
        nonEffectiveWeeks: m.nonEffectiveWeeks,
        effectiveWeeks,
        effectiveMeetings,
        effectiveJp: effectiveWeeks * jpPerWeek,
        note: m.nonEffectiveNote || 'KBM Efektif',
        scheduledCount: realM ? realM.scheduledCount : 0,
        holidayCount: realM ? realM.holidayCount : 0,
        affectedSummary: realM ? realM.affectedSummary : '-',
      };
    });

  const s1Rows = buildSemesterMonthRows(
    1,
    input.rpe.semester1.months,
    realAnalysis.semester1.months,
    input.rpe.semester1.jpPerWeek,
    0
  );
  const s2Rows = buildSemesterMonthRows(
    2,
    input.rpe.semester2.months,
    realAnalysis.semester2.months,
    input.rpe.semester2.jpPerWeek,
    s1Rows.length
  );
  const twelveMonthRows = [...s1Rows, ...s2Rows];

  const s1Meetings = s1Rows.reduce((a, b) => a + b.effectiveMeetings, 0);
  const s2Meetings = s2Rows.reduce((a, b) => a + b.effectiveMeetings, 0);

  const s1Summary = {
    ...s1Totals,
    effectiveMeetings: s1Meetings,
    jpPerWeek: input.rpe.semester1.jpPerWeek,
    cadanganJp: input.rpe.semester1.cadanganJp,
  };
  const s2Summary = {
    ...s2Totals,
    effectiveMeetings: s2Meetings,
    jpPerWeek: input.rpe.semester2.jpPerWeek,
    cadanganJp: input.rpe.semester2.cadanganJp,
  };
  const annualSummary = {
    totalWeeks: s1Summary.totalWeeks + s2Summary.totalWeeks,
    nonEffectiveWeeks: s1Summary.nonEffectiveWeeks + s2Summary.nonEffectiveWeeks,
    effectiveWeeks: s1Summary.effectiveWeeks + s2Summary.effectiveWeeks,
    effectiveMeetings: s1Meetings + s2Meetings,
    grossJp: s1Summary.grossJp + s2Summary.grossJp,
    cadanganJp: s1Summary.cadanganJp + s2Summary.cadanganJp,
    netJp: s1Summary.netJp + s2Summary.netJp,
  };

  const sortedEvents = [...kaldikEvents].sort((a, b) =>
    (a.dateStart || '').localeCompare(b.dateStart || '')
  );
  const kaldikRows = sortedEvents.map((ev, idx) => ({
    no: idx + 1,
    monthLabel: getIndonesianMonthYearLabel(ev.dateStart),
    dateRangeLabel: formatDateRangeLabelId(ev.dateStart, ev.dateEnd),
    name: ev.name,
    categoryLabel: formatKaldikCategoryExportLabel(ev.type),
    notes: ev.notes || '-',
  }));

  const meetingsPerWeek = Math.max(1, selectedDays.length);
  const jpPerMeetingS1 = Math.max(
    1,
    Math.round((input.rpe.semester1.jpPerWeek || 4) / meetingsPerWeek)
  );
  const jpPerMeetingS2 = Math.max(
    1,
    Math.round((input.rpe.semester2.jpPerWeek || 4) / meetingsPerWeek)
  );

  const tpRows = prota.map((item, idx) => {
    const perMeeting = Number(item.semester) === 2 ? jpPerMeetingS2 : jpPerMeetingS1;
    const jmlPertemuan =
      item.jmlPertemuan !== undefined
        ? Math.max(0, item.jmlPertemuan)
        : item.alokasiJp === 0
        ? 0
        : Math.max(1, Math.round((Number(item.alokasiJp) || 0) / perMeeting));
    const matchedPromes = promes.find(
      (pm) => pm.tpCode === item.tpCode || pm.id === item.id.replace('prota-', 'promes-')
    );
    const perkiraanBulan =
      item.perkiraanBulan !== undefined
        ? item.perkiraanBulan
        : deriveEstimatedMonthRangeFromDistribution(
            matchedPromes?.distribution,
            item.semester,
            academicYear
          );

    return {
      no: idx + 1,
      semester: item.semester,
      tpCode: item.tpCode,
      lingkupMateri: item.babTitle || item.tpDescription,
      jmlPertemuan,
      alokasiJp: Number(item.alokasiJp) || 0,
      perkiraanBulan,
    };
  });

  const totalTpMeetings = tpRows.reduce((a, b) => a + b.jmlPertemuan, 0);
  const totalTpJp = tpRows.reduce((a, b) => a + b.alokasiJp, 0);
  const targetEffectiveJp = annualSummary.grossJp;
  const diffJp = targetEffectiveJp - totalTpJp;

  const tpSummary = {
    totalMeetings: totalTpMeetings,
    totalAllocatedJp: totalTpJp,
    targetEffectiveJp,
    diffJp,
    isBalanced: diffJp === 0,
  };

  return {
    academicYear,
    selectedDays,
    s1Rows,
    s2Rows,
    twelveMonthRows,
    s1Summary,
    s2Summary,
    annualSummary,
    kaldikRows,
    tpRows,
    tpSummary,
  };
}




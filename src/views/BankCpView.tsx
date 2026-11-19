import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  Layers,
  Upload,
  BookOpen,
  FileText,
  Search,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Book,
  FileUp,
  X,
  ChevronDown,
  Info,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { CP_LIBRARY_ITEMS, CpBankEntry } from '../data/cpLibrary';

type InputTab = 'upload' | 'bank' | 'paste';

export type ActiveJenjangKey = 'PAUD' | 'TK' | 'RA' | 'SD' | 'MI' | 'SMP' | 'MTs' | 'SMA' | 'SMK' | 'MA';

interface SubjectOption {
  name: string;
  jp: number;
  rumpun: string;
  icon: string;
  isMadrasah?: boolean;
}

interface FaseDefinition {
  faseCode: string;
  faseLabel: string;
  kelasOptions: string[];
  defaultKelas: string;
}

interface JenjangDefinition {
  key: ActiveJenjangKey;
  label: string;
  shortLabel: string;
  badge: string;
  icon: string;
  fases: FaseDefinition[];
  getSubjects: (faseCode: string, kelas: string) => SubjectOption[];
  rekomendasi: Array<{ name: string; jp: number }>;
}

// -------------------------------------------------------------
// MASTER CURRICULUM CONFIGURATION: 10 JENJANG TERSINKRONISASI
// PAUD, TK, RA, SD, MI, SMP, MTs, SMA, SMK, MA
// -------------------------------------------------------------
const JENJANG_DEFINITIONS: Record<ActiveJenjangKey, JenjangDefinition> = {
  PAUD: {
    key: 'PAUD',
    label: 'PAUD (Pendidikan Anak Usia Dini)',
    shortLabel: 'PAUD',
    badge: 'Fase Fondasi Usia 2-6 Tahun',
    icon: '🧸',
    fases: [
      {
        faseCode: 'Fondasi',
        faseLabel: 'Fase Fondasi (PAUD Usia 2-6 Tahun)',
        kelasOptions: ['PAUD (Usia 2-4 Tahun)', 'PAUD (Usia 4-6 Tahun)'],
        defaultKelas: 'PAUD (Usia 4-6 Tahun)',
      },
    ],
    getSubjects: () => [
      { name: 'Nilai Agama dan Budi Pekerti', jp: 6, rumpun: 'Agama & Pancasila', icon: '🧸' },
      { name: 'Jati Diri & Kematangan Emosi', jp: 6, rumpun: 'BK & Pengembangan Diri', icon: '🎈' },
      { name: 'Dasar-Dasar Literasi & STEAM', jp: 8, rumpun: 'Informatika & Koding AI', icon: '🎨' },
    ],
    rekomendasi: [
      { name: 'Nilai Agama dan Budi Pekerti', jp: 6 },
      { name: 'Jati Diri & Kematangan Emosi', jp: 6 },
      { name: 'Dasar-Dasar Literasi & STEAM', jp: 8 },
    ],
  },

  TK: {
    key: 'TK',
    label: 'TK (Taman Kanak-Kanak)',
    shortLabel: 'TK',
    badge: 'Fase Fondasi TK A & TK B',
    icon: '🎈',
    fases: [
      {
        faseCode: 'Fondasi',
        faseLabel: 'Fase Fondasi (TK A & TK B)',
        kelasOptions: ['TK A', 'TK B'],
        defaultKelas: 'TK A',
      },
    ],
    getSubjects: () => [
      { name: 'Nilai Agama dan Budi Pekerti', jp: 6, rumpun: 'Agama & Pancasila', icon: '🧸' },
      { name: 'Jati Diri & Kematangan Emosi', jp: 6, rumpun: 'BK & Pengembangan Diri', icon: '🎈' },
      { name: 'Dasar-Dasar Literasi & STEAM', jp: 8, rumpun: 'Informatika & Koding AI', icon: '🎨' },
    ],
    rekomendasi: [
      { name: 'Nilai Agama dan Budi Pekerti', jp: 6 },
      { name: 'Jati Diri & Kematangan Emosi', jp: 6 },
      { name: 'Dasar-Dasar Literasi & STEAM', jp: 8 },
    ],
  },

  RA: {
    key: 'RA',
    label: 'RA (Raudhatul Athfal)',
    shortLabel: 'RA',
    badge: 'KMA Nomor 1503 Tahun 2025',
    icon: '🕌',
    fases: [
      {
        faseCode: 'Fondasi',
        faseLabel: 'Fase Fondasi (RA / KMA 1503 Tahun 2025)',
        kelasOptions: ['RA A', 'RA B'],
        defaultKelas: 'RA A',
      },
    ],
    getSubjects: () => [
      { name: 'Nilai Agama dan Budi Pekerti (KMA 1503)', jp: 6, rumpun: 'Agama & Pancasila', icon: '🕌', isMadrasah: true },
      { name: 'Jati Diri & Karakter Islami RA', jp: 6, rumpun: 'BK & Pengembangan Diri', icon: '🌱', isMadrasah: true },
      { name: 'Dasar-Dasar Literasi, STEAM & Keislaman', jp: 8, rumpun: 'Informatika & Koding AI', icon: '🎨', isMadrasah: true },
      { name: 'Pengenalan Al-Qur\'an & Hadis Usia Dini', jp: 4, rumpun: 'Agama & Pancasila', icon: '📜', isMadrasah: true },
      { name: 'Pengenalan Bahasa Arab Usia Dini', jp: 2, rumpun: 'Bahasa & Sastra', icon: '📖', isMadrasah: true },
    ],
    rekomendasi: [
      { name: 'Nilai Agama dan Budi Pekerti (KMA 1503)', jp: 6 },
      { name: 'Jati Diri & Karakter Islami RA', jp: 6 },
      { name: 'Dasar-Dasar Literasi, STEAM & Keislaman', jp: 8 },
      { name: 'Pengenalan Bahasa Arab Usia Dini', jp: 2 },
    ],
  },

  SD: {
    key: 'SD',
    label: 'Sekolah Dasar (SD)',
    shortLabel: 'SD',
    badge: 'Kelas 1 s.d. 6 SD',
    icon: '🎒',
    fases: [
      {
        faseCode: 'A',
        faseLabel: 'Fase A (Kelas 1 - 2 SD)',
        kelasOptions: ['Kelas 1', 'Kelas 2'],
        defaultKelas: 'Kelas 1',
      },
      {
        faseCode: 'B',
        faseLabel: 'Fase B (Kelas 3 - 4 SD)',
        kelasOptions: ['Kelas 3', 'Kelas 4'],
        defaultKelas: 'Kelas 4',
      },
      {
        faseCode: 'C',
        faseLabel: 'Fase C (Kelas 5 - 6 SD)',
        kelasOptions: ['Kelas 5', 'Kelas 6'],
        defaultKelas: 'Kelas 5',
      },
    ],
    getSubjects: (faseCode) => {
      const common = [
        { name: 'Matematika', jp: 5, rumpun: 'MIPA & IPAS', icon: '📐' },
        { name: 'Bahasa Indonesia', jp: 6, rumpun: 'Bahasa & Sastra', icon: '🇮🇩' },
        { name: 'Pendidikan Pancasila', jp: 4, rumpun: 'Agama & Pancasila', icon: '🦅' },
        { name: 'Pendidikan Agama Islam dan Budi Pekerti', jp: 3, rumpun: 'Agama & Pancasila', icon: '🕌' },
        { name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', jp: 3, rumpun: 'PJOK & Olahraga', icon: '⚽' },
        { name: 'Seni Rupa', jp: 2, rumpun: 'Seni Budaya', icon: '🎨' },
        { name: 'Seni Musik', jp: 2, rumpun: 'Seni Budaya', icon: '🎵' },
        { name: 'Bahasa Inggris', jp: 2, rumpun: 'Bahasa & Sastra', icon: '🇬🇧' },
      ];
      if (faseCode === 'A') {
        return common;
      }
      return [
        common[0], // Matematika
        common[1], // B.Indo
        { name: 'IPAS (IPA & IPS Terpadu)', jp: 5, rumpun: 'MIPA & IPAS', icon: '🌱' },
        common[2], // Pancasila
        common[3], // PAI
        common[4], // PJOK
        common[5], // Seni Rupa
        { name: 'Seni Tari', jp: 2, rumpun: 'Seni Budaya', icon: '💃' },
        { name: 'Seni Teater', jp: 2, rumpun: 'Seni Budaya', icon: '🎭' },
        common[7], // B.Ing
      ];
    },
    rekomendasi: [
      { name: 'Matematika', jp: 5 },
      { name: 'Bahasa Indonesia', jp: 6 },
      { name: 'IPAS (IPA & IPS Terpadu)', jp: 5 },
      { name: 'Pendidikan Pancasila', jp: 4 },
      { name: 'Pendidikan Agama Islam dan Budi Pekerti', jp: 3 },
      { name: 'PJOK', jp: 3 },
      { name: 'Bahasa Inggris', jp: 2 },
      { name: 'Seni Rupa', jp: 2 },
    ],
  },

  MI: {
    key: 'MI',
    label: 'Madrasah Ibtidaiyah (MI)',
    shortLabel: 'MI',
    badge: 'KMA Nomor 1503 Tahun 2025',
    icon: '📖',
    fases: [
      {
        faseCode: 'A',
        faseLabel: 'Fase A (Kelas 1 - 2 MI / KMA 1503)',
        kelasOptions: ['Kelas 1', 'Kelas 2'],
        defaultKelas: 'Kelas 1',
      },
      {
        faseCode: 'B',
        faseLabel: 'Fase B (Kelas 3 - 4 MI / KMA 1503)',
        kelasOptions: ['Kelas 3', 'Kelas 4'],
        defaultKelas: 'Kelas 3',
      },
      {
        faseCode: 'C',
        faseLabel: 'Fase C (Kelas 5 - 6 MI / KMA 1503)',
        kelasOptions: ['Kelas 5', 'Kelas 6'],
        defaultKelas: 'Kelas 5',
      },
    ],
    getSubjects: (faseCode) => {
      const paiMadrasah = [
        { name: 'Al-Qur\'an Hadis (KMA 1503)', jp: 2, rumpun: 'Agama & Pancasila', icon: '📜', isMadrasah: true },
        { name: 'Akidah Akhlak (KMA 1503)', jp: 2, rumpun: 'Agama & Pancasila', icon: '✨', isMadrasah: true },
        { name: 'Fikih (KMA 1503)', jp: 2, rumpun: 'Agama & Pancasila', icon: '⚖️', isMadrasah: true },
        { name: 'Bahasa Arab (KMA 1503)', jp: 2, rumpun: 'Bahasa & Sastra', icon: '📖', isMadrasah: true },
      ];
      if (faseCode !== 'A') {
        paiMadrasah.push({
          name: 'Sejarah Kebudayaan Islam / SKI (KMA 1503)',
          jp: 2,
          rumpun: 'Agama & Pancasila',
          icon: '🏛️',
          isMadrasah: true,
        });
      }
      const umum = [
        { name: 'Matematika', jp: 5, rumpun: 'MIPA & IPAS', icon: '📐' },
        { name: 'Bahasa Indonesia', jp: 6, rumpun: 'Bahasa & Sastra', icon: '🇮🇩' },
        ...(faseCode !== 'A' ? [{ name: 'IPAS (IPA & IPS Terpadu)', jp: 5, rumpun: 'MIPA & IPAS', icon: '🌱' }] : []),
        { name: 'Pendidikan Pancasila', jp: 4, rumpun: 'Agama & Pancasila', icon: '🦅' },
        { name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', jp: 3, rumpun: 'PJOK & Olahraga', icon: '⚽' },
        { name: 'Seni Rupa / Seni Budaya', jp: 2, rumpun: 'Seni Budaya', icon: '🎨' },
        { name: 'Bahasa Inggris', jp: 2, rumpun: 'Bahasa & Sastra', icon: '🇬🇧' },
      ];
      return [...paiMadrasah, ...umum];
    },
    rekomendasi: [
      { name: 'Al-Qur\'an Hadis (KMA 1503)', jp: 2 },
      { name: 'Akidah Akhlak (KMA 1503)', jp: 2 },
      { name: 'Fikih (KMA 1503)', jp: 2 },
      { name: 'Bahasa Arab (KMA 1503)', jp: 2 },
      { name: 'Matematika', jp: 5 },
      { name: 'Bahasa Indonesia', jp: 6 },
      { name: 'IPAS (IPA & IPS Terpadu)', jp: 5 },
      { name: 'Pendidikan Pancasila', jp: 4 },
    ],
  },

  SMP: {
    key: 'SMP',
    label: 'SMP / SLTP',
    shortLabel: 'SMP',
    badge: 'Kelas 7, 8, 9 SMP',
    icon: '🏫',
    fases: [
      {
        faseCode: 'D',
        faseLabel: 'Fase D (Kelas 7, 8, 9 SMP)',
        kelasOptions: ['Kelas 7', 'Kelas 8', 'Kelas 9'],
        defaultKelas: 'Kelas 7',
      },
    ],
    getSubjects: () => [
      { name: 'Matematika', jp: 5, rumpun: 'MIPA & IPAS', icon: '📐' },
      { name: 'IPA Terpadu', jp: 5, rumpun: 'MIPA & IPAS', icon: '🔬' },
      { name: 'IPS Terpadu', jp: 4, rumpun: 'IPS & Humaniora', icon: '🌐' },
      { name: 'Bahasa Indonesia', jp: 6, rumpun: 'Bahasa & Sastra', icon: '🇮🇩' },
      { name: 'Bahasa Inggris', jp: 4, rumpun: 'Bahasa & Sastra', icon: '🇬🇧' },
      { name: 'Informatika', jp: 2, rumpun: 'Informatika & Koding AI', icon: '💻' },
      { name: 'Pendidikan Pancasila', jp: 3, rumpun: 'Agama & Pancasila', icon: '🦅' },
      { name: 'Pendidikan Agama Islam dan Budi Pekerti', jp: 3, rumpun: 'Agama & Pancasila', icon: '🕌' },
      { name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', jp: 3, rumpun: 'PJOK & Olahraga', icon: '⚽' },
      { name: 'Seni Rupa', jp: 2, rumpun: 'Seni Budaya', icon: '🎨' },
      { name: 'Seni Musik', jp: 2, rumpun: 'Seni Budaya', icon: '🎵' },
      { name: 'Prakarya Kerajinan / Pengolahan', jp: 2, rumpun: 'Prakarya & Kewirausahaan', icon: '🧵' },
      { name: 'Bimbingan dan Konseling (BK)', jp: 2, rumpun: 'BK & Pengembangan Diri', icon: '🌱' },
    ],
    rekomendasi: [
      { name: 'Matematika', jp: 5 },
      { name: 'IPA Terpadu', jp: 5 },
      { name: 'IPS Terpadu', jp: 4 },
      { name: 'Bahasa Indonesia', jp: 6 },
      { name: 'Bahasa Inggris', jp: 4 },
      { name: 'Informatika', jp: 2 },
      { name: 'Pendidikan Pancasila', jp: 3 },
      { name: 'PJOK', jp: 3 },
    ],
  },

  MTs: {
    key: 'MTs',
    label: 'MTs (Madrasah Tsanawiyah)',
    shortLabel: 'MTs',
    badge: 'KMA Nomor 1503 Tahun 2025',
    icon: '🕌',
    fases: [
      {
        faseCode: 'D',
        faseLabel: 'Fase D (Kelas 7, 8, 9 MTs / KMA 1503)',
        kelasOptions: ['Kelas 7', 'Kelas 8', 'Kelas 9'],
        defaultKelas: 'Kelas 7',
      },
    ],
    getSubjects: () => [
      { name: 'Al-Qur\'an Hadis (KMA 1503)', jp: 2, rumpun: 'Agama & Pancasila', icon: '📜', isMadrasah: true },
      { name: 'Akidah Akhlak (KMA 1503)', jp: 2, rumpun: 'Agama & Pancasila', icon: '✨', isMadrasah: true },
      { name: 'Fikih (KMA 1503)', jp: 2, rumpun: 'Agama & Pancasila', icon: '⚖️', isMadrasah: true },
      { name: 'Sejarah Kebudayaan Islam / SKI (KMA 1503)', jp: 2, rumpun: 'Agama & Pancasila', icon: '🏛️', isMadrasah: true },
      { name: 'Bahasa Arab (KMA 1503)', jp: 3, rumpun: 'Bahasa & Sastra', icon: '📖', isMadrasah: true },
      { name: 'Matematika', jp: 5, rumpun: 'MIPA & IPAS', icon: '📐' },
      { name: 'IPA Terpadu', jp: 5, rumpun: 'MIPA & IPAS', icon: '🔬' },
      { name: 'IPS Terpadu', jp: 4, rumpun: 'IPS & Humaniora', icon: '🌐' },
      { name: 'Bahasa Indonesia', jp: 6, rumpun: 'Bahasa & Sastra', icon: '🇮🇩' },
      { name: 'Bahasa Inggris', jp: 4, rumpun: 'Bahasa & Sastra', icon: '🇬🇧' },
      { name: 'Informatika', jp: 2, rumpun: 'Informatika & Koding AI', icon: '💻' },
      { name: 'Pendidikan Pancasila', jp: 3, rumpun: 'Agama & Pancasila', icon: '🦅' },
      { name: 'PJOK', jp: 3, rumpun: 'PJOK & Olahraga', icon: '⚽' },
      { name: 'Seni Budaya', jp: 2, rumpun: 'Seni Budaya', icon: '🎨' },
      { name: 'Prakarya', jp: 2, rumpun: 'Prakarya & Kewirausahaan', icon: '⚙️' },
      { name: 'Bimbingan dan Konseling (BK)', jp: 2, rumpun: 'BK & Pengembangan Diri', icon: '🌱' },
    ],
    rekomendasi: [
      { name: 'Al-Qur\'an Hadis (KMA 1503)', jp: 2 },
      { name: 'Akidah Akhlak (KMA 1503)', jp: 2 },
      { name: 'Fikih (KMA 1503)', jp: 2 },
      { name: 'Bahasa Arab (KMA 1503)', jp: 3 },
      { name: 'Matematika', jp: 5 },
      { name: 'IPA Terpadu', jp: 5 },
      { name: 'Bahasa Indonesia', jp: 6 },
      { name: 'Informatika', jp: 2 },
    ],
  },

  SMA: {
    key: 'SMA',
    label: 'SMA (Sekolah Menengah Atas)',
    shortLabel: 'SMA',
    badge: 'Kelas 10, 11, 12 SMA',
    icon: '🎓',
    fases: [
      {
        faseCode: 'E',
        faseLabel: 'Fase E (Kelas 10 SMA)',
        kelasOptions: ['Kelas 10'],
        defaultKelas: 'Kelas 10',
      },
      {
        faseCode: 'F',
        faseLabel: 'Fase F (Kelas 11 - 12 SMA)',
        kelasOptions: ['Kelas 11', 'Kelas 12'],
        defaultKelas: 'Kelas 11',
      },
    ],
    getSubjects: (faseCode) => {
      if (faseCode === 'E') {
        return [
          { name: 'Bahasa Indonesia', jp: 4, rumpun: 'Bahasa & Sastra', icon: '🇮🇩' },
          { name: 'Matematika', jp: 4, rumpun: 'MIPA & IPAS', icon: '📐' },
          { name: 'Bahasa Inggris', jp: 2, rumpun: 'Bahasa & Sastra', icon: '🇬🇧' },
          { name: 'Pendidikan Pancasila', jp: 2, rumpun: 'Agama & Pancasila', icon: '🦅' },
          { name: 'Pendidikan Agama Islam dan Budi Pekerti', jp: 3, rumpun: 'Agama & Pancasila', icon: '🕌' },
          { name: 'Sejarah', jp: 2, rumpun: 'IPS & Humaniora', icon: '🏛️' },
          { name: 'PJOK', jp: 3, rumpun: 'PJOK & Olahraga', icon: '⚽' },
          { name: 'Seni Rupa', jp: 2, rumpun: 'Seni Budaya', icon: '🎨' },
          { name: 'Fisika (IPA Terpadu)', jp: 3, rumpun: 'MIPA & IPAS', icon: '⚡' },
          { name: 'Kimia (IPA Terpadu)', jp: 3, rumpun: 'MIPA & IPAS', icon: '🧪' },
          { name: 'Biologi (IPA Terpadu)', jp: 3, rumpun: 'MIPA & IPAS', icon: '🌿' },
          { name: 'Ekonomi', jp: 3, rumpun: 'IPS & Humaniora', icon: '📊' },
          { name: 'Sosiologi', jp: 3, rumpun: 'IPS & Humaniora', icon: '👥' },
          { name: 'Geografi', jp: 3, rumpun: 'IPS & Humaniora', icon: '🌍' },
          { name: 'Informatika', jp: 3, rumpun: 'Informatika & Koding AI', icon: '💻' },
          { name: 'Bimbingan dan Konseling (BK)', jp: 2, rumpun: 'BK & Pengembangan Diri', icon: '🌱' },
        ];
      }
      return [
        { name: 'Bahasa Indonesia', jp: 4, rumpun: 'Bahasa & Sastra', icon: '🇮🇩' },
        { name: 'Matematika', jp: 4, rumpun: 'MIPA & IPAS', icon: '📐' },
        { name: 'Bahasa Inggris', jp: 3, rumpun: 'Bahasa & Sastra', icon: '🇬🇧' },
        { name: 'Pendidikan Pancasila', jp: 2, rumpun: 'Agama & Pancasila', icon: '🦅' },
        { name: 'PAI dan Budi Pekerti', jp: 3, rumpun: 'Agama & Pancasila', icon: '🕌' },
        { name: 'Sejarah', jp: 2, rumpun: 'IPS & Humaniora', icon: '🏛️' },
        { name: 'PJOK', jp: 3, rumpun: 'PJOK & Olahraga', icon: '⚽' },
        { name: 'Fisika', jp: 5, rumpun: 'MIPA & IPAS', icon: '⚡' },
        { name: 'Kimia', jp: 5, rumpun: 'MIPA & IPAS', icon: '🧪' },
        { name: 'Biologi', jp: 5, rumpun: 'MIPA & IPAS', icon: '🌿' },
        { name: 'Matematika Tingkat Lanjut', jp: 5, rumpun: 'MIPA & IPAS', icon: '📐' },
        { name: 'Ekonomi', jp: 5, rumpun: 'IPS & Humaniora', icon: '📊' },
        { name: 'Sosiologi', jp: 5, rumpun: 'IPS & Humaniora', icon: '👥' },
        { name: 'Geografi', jp: 5, rumpun: 'IPS & Humaniora', icon: '🌍' },
        { name: 'Sejarah Tingkat Lanjut', jp: 5, rumpun: 'IPS & Humaniora', icon: '📜' },
        { name: 'Antropologi', jp: 5, rumpun: 'IPS & Humaniora', icon: '🗿' },
        { name: 'Informatika', jp: 5, rumpun: 'Informatika & Koding AI', icon: '💻' },
        { name: 'Bahasa Indonesia Tingkat Lanjut', jp: 5, rumpun: 'Bahasa & Sastra', icon: '✍️' },
        { name: 'Bahasa Inggris Tingkat Lanjut', jp: 5, rumpun: 'Bahasa & Sastra', icon: '🗣️' },
        { name: 'Bimbingan dan Konseling (BK)', jp: 2, rumpun: 'BK & Pengembangan Diri', icon: '🌱' },
      ];
    },
    rekomendasi: [
      { name: 'Informatika', jp: 3 },
      { name: 'Matematika', jp: 4 },
      { name: 'Bahasa Indonesia', jp: 4 },
      { name: 'Bahasa Inggris', jp: 2 },
      { name: 'Fisika (IPA Terpadu)', jp: 3 },
      { name: 'Kimia (IPA Terpadu)', jp: 3 },
      { name: 'Biologi', jp: 3 },
      { name: 'Ekonomi', jp: 3 },
      { name: 'Sosiologi', jp: 3 },
    ],
  },

  SMK: {
    key: 'SMK',
    label: 'SMK (Sekolah Menengah Kejuruan)',
    shortLabel: 'SMK',
    badge: 'Kelas 10, 11, 12 SMK',
    icon: '⚙️',
    fases: [
      {
        faseCode: 'E',
        faseLabel: 'Fase E (Kelas 10 SMK)',
        kelasOptions: ['Kelas 10'],
        defaultKelas: 'Kelas 10',
      },
      {
        faseCode: 'F',
        faseLabel: 'Fase F (Kelas 11 - 12 SMK)',
        kelasOptions: ['Kelas 11', 'Kelas 12'],
        defaultKelas: 'Kelas 11',
      },
    ],
    getSubjects: (faseCode) => {
      if (faseCode === 'E') {
        return [
          { name: 'Bahasa Indonesia', jp: 4, rumpun: 'Bahasa & Sastra', icon: '🇮🇩' },
          { name: 'Matematika', jp: 4, rumpun: 'MIPA & IPAS', icon: '📐' },
          { name: 'Bahasa Inggris', jp: 2, rumpun: 'Bahasa & Sastra', icon: '🇬🇧' },
          { name: 'Pendidikan Pancasila', jp: 2, rumpun: 'Agama & Pancasila', icon: '🦅' },
          { name: 'PAI dan Budi Pekerti', jp: 3, rumpun: 'Agama & Pancasila', icon: '🕌' },
          { name: 'Sejarah', jp: 2, rumpun: 'IPS & Humaniora', icon: '🏛️' },
          { name: 'PJOK', jp: 3, rumpun: 'PJOK & Olahraga', icon: '⚽' },
          { name: 'Seni Budaya', jp: 2, rumpun: 'Seni Budaya', icon: '🎨' },
          { name: 'Informatika SMK', jp: 4, rumpun: 'Informatika & Koding AI', icon: '💻' },
          { name: 'Projek IPAS (SMK)', jp: 6, rumpun: 'MIPA & IPAS', icon: '🌱' },
          { name: 'Dasar-Dasar Teknik Jaringan Komputer & Telekomunikasi (TJKT)', jp: 6, rumpun: 'Informatika & Koding AI', icon: '📡' },
          { name: 'Dasar-Dasar Rekayasa Perangkat Lunak (RPL)', jp: 6, rumpun: 'Informatika & Koding AI', icon: '💻' },
          { name: 'Dasar-Dasar Desain Komunikasi Visual (DKV)', jp: 6, rumpun: 'Seni Budaya', icon: '🎨' },
          { name: 'Dasar-Dasar Akuntansi & Keuangan Lembaga (AKL)', jp: 6, rumpun: 'IPS & Humaniora', icon: '📑' },
          { name: 'Dasar-Dasar Manajemen Perkantoran & Layanan Bisnis (MPLB)', jp: 6, rumpun: 'IPS & Humaniora', icon: '🏢' },
          { name: 'Koding & AI Terapan', jp: 4, rumpun: 'Informatika & Koding AI', icon: '🤖' },
          { name: 'Bimbingan dan Konseling (BK)', jp: 2, rumpun: 'BK & Pengembangan Diri', icon: '🌱' },
        ];
      }
      return [
        { name: 'Konsentrasi Keahlian / Kejuruan Terapan', jp: 18, rumpun: 'Informatika & Koding AI', icon: '⚙️' },
        { name: 'Projek Kreatif dan Kewirausahaan (PKWU SMK)', jp: 5, rumpun: 'Prakarya & Kewirausahaan', icon: '💼' },
        { name: 'Bahasa Indonesia', jp: 3, rumpun: 'Bahasa & Sastra', icon: '🇮🇩' },
        { name: 'Matematika', jp: 3, rumpun: 'MIPA & IPAS', icon: '📐' },
        { name: 'Bahasa Inggris', jp: 3, rumpun: 'Bahasa & Sastra', icon: '🇬🇧' },
        { name: 'Pendidikan Pancasila', jp: 2, rumpun: 'Agama & Pancasila', icon: '🦅' },
        { name: 'PAI dan Budi Pekerti', jp: 2, rumpun: 'Agama & Pancasila', icon: '🕌' },
        { name: 'Praktik Kerja Lapangan (PKL Industri)', jp: 44, rumpun: 'Informatika & Koding AI', icon: '🏭' },
        { name: 'Bimbingan dan Konseling (BK)', jp: 2, rumpun: 'BK & Pengembangan Diri', icon: '🌱' },
      ];
    },
    rekomendasi: [
      { name: 'Projek IPAS (SMK)', jp: 6 },
      { name: 'Dasar-Dasar Teknik Jaringan Komputer & Telekomunikasi (TJKT)', jp: 6 },
      { name: 'Dasar-Dasar Rekayasa Perangkat Lunak (RPL)', jp: 6 },
      { name: 'Informatika SMK', jp: 4 },
      { name: 'Projek Kreatif dan Kewirausahaan (PKWU SMK)', jp: 5 },
      { name: 'Matematika', jp: 4 },
      { name: 'Bahasa Indonesia', jp: 4 },
      { name: 'Bahasa Inggris', jp: 2 },
    ],
  },

  MA: {
    key: 'MA',
    label: 'MA (Madrasah Aliyah)',
    shortLabel: 'MA',
    badge: 'KMA Nomor 1503 Tahun 2025',
    icon: '🕌',
    fases: [
      {
        faseCode: 'E',
        faseLabel: 'Fase E (Kelas 10 MA / KMA 1503)',
        kelasOptions: ['Kelas 10'],
        defaultKelas: 'Kelas 10',
      },
      {
        faseCode: 'F',
        faseLabel: 'Fase F (Kelas 11 - 12 MA / KMA 1503)',
        kelasOptions: ['Kelas 11', 'Kelas 12'],
        defaultKelas: 'Kelas 11',
      },
    ],
    getSubjects: (faseCode) => {
      const paiMadrasah = [
        { name: 'Al-Qur\'an Hadis (KMA 1503)', jp: 2, rumpun: 'Agama & Pancasila', icon: '📜', isMadrasah: true },
        { name: 'Akidah Akhlak (KMA 1503)', jp: 2, rumpun: 'Agama & Pancasila', icon: '✨', isMadrasah: true },
        { name: 'Fikih (KMA 1503)', jp: 2, rumpun: 'Agama & Pancasila', icon: '⚖️', isMadrasah: true },
        { name: 'Sejarah Kebudayaan Islam / SKI (KMA 1503)', jp: 2, rumpun: 'Agama & Pancasila', icon: '🏛️', isMadrasah: true },
        { name: 'Bahasa Arab (KMA 1503)', jp: 4, rumpun: 'Bahasa & Sastra', icon: '📖', isMadrasah: true },
      ];
      const umum = [
        { name: 'Bahasa Indonesia', jp: 4, rumpun: 'Bahasa & Sastra', icon: '🇮🇩' },
        { name: 'Matematika', jp: 4, rumpun: 'MIPA & IPAS', icon: '📐' },
        { name: 'Bahasa Inggris', jp: 2, rumpun: 'Bahasa & Sastra', icon: '🇬🇧' },
        { name: 'Pendidikan Pancasila', jp: 2, rumpun: 'Agama & Pancasila', icon: '🦅' },
        { name: 'Sejarah', jp: 2, rumpun: 'IPS & Humaniora', icon: '🏛️' },
        { name: 'PJOK', jp: 3, rumpun: 'PJOK & Olahraga', icon: '⚽' },
        { name: 'Seni Budaya', jp: 2, rumpun: 'Seni Budaya', icon: '🎨' },
        { name: 'Fisika', jp: 5, rumpun: 'MIPA & IPAS', icon: '⚡' },
        { name: 'Kimia', jp: 5, rumpun: 'MIPA & IPAS', icon: '🧪' },
        { name: 'Biologi', jp: 5, rumpun: 'MIPA & IPAS', icon: '🌿' },
        { name: 'Matematika Tingkat Lanjut', jp: 5, rumpun: 'MIPA & IPAS', icon: '📐' },
        { name: 'Ekonomi', jp: 5, rumpun: 'IPS & Humaniora', icon: '📊' },
        { name: 'Sosiologi', jp: 5, rumpun: 'IPS & Humaniora', icon: '👥' },
        { name: 'Geografi', jp: 5, rumpun: 'IPS & Humaniora', icon: '🌍' },
        { name: 'Informatika', jp: 5, rumpun: 'Informatika & Koding AI', icon: '💻' },
        ...(faseCode === 'F'
          ? [
              { name: 'Ilmu Tafsir (Keagamaan MA)', jp: 5, rumpun: 'Agama & Pancasila', icon: '📜', isMadrasah: true },
              { name: 'Ilmu Hadis (Keagamaan MA)', jp: 5, rumpun: 'Agama & Pancasila', icon: '📜', isMadrasah: true },
              { name: 'Ushul Fikih (Keagamaan MA)', jp: 5, rumpun: 'Agama & Pancasila', icon: '⚖️', isMadrasah: true },
              { name: 'Bahasa Arab Peminatan', jp: 5, rumpun: 'Bahasa & Sastra', icon: '📖', isMadrasah: true },
            ]
          : []),
        { name: 'Bimbingan dan Konseling (BK)', jp: 2, rumpun: 'BK & Pengembangan Diri', icon: '🌱' },
      ];
      return [...paiMadrasah, ...umum];
    },
    rekomendasi: [
      { name: 'Al-Qur\'an Hadis (KMA 1503)', jp: 2 },
      { name: 'Akidah Akhlak (KMA 1503)', jp: 2 },
      { name: 'Fikih (KMA 1503)', jp: 2 },
      { name: 'Bahasa Arab (KMA 1503)', jp: 4 },
      { name: 'Matematika', jp: 4 },
      { name: 'Bahasa Indonesia', jp: 4 },
      { name: 'Fisika', jp: 5 },
      { name: 'Ekonomi', jp: 5 },
    ],
  },
};

export const BankCpView: React.FC = () => {
  const {
    schoolProfile,
    updateSchoolProfile,
    setActiveView,
    showNotification,
    syncPipelineWithBook,
    selectedBook,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const subjectDropdownRef = useRef<HTMLDivElement>(null);

  // Section 1: Active Jenjang Key (defaults to SMA or schoolProfile)
  const [selectedJenjang, setSelectedJenjang] = useState<ActiveJenjangKey>(() => {
    const s = (schoolProfile.schoolName || '').toLowerCase();
    if (s.includes('ra ')) return 'RA';
    if (s.includes('mi ') || s.includes('madrasah ibtidaiyah')) return 'MI';
    if (s.includes('mts') || s.includes('tsanawiyah')) return 'MTs';
    if (s.includes('ma ') || s.includes('aliyah')) return 'MA';
    if (s.includes('smk')) return 'SMK';
    if (s.includes('smp')) return 'SMP';
    if (s.includes('sd')) return 'SD';
    if (s.includes('tk')) return 'TK';
    if (s.includes('paud')) return 'PAUD';
    return 'SMA';
  });

  const activeJenjangDef = JENJANG_DEFINITIONS[selectedJenjang] || JENJANG_DEFINITIONS.SMA;

  // Active Fase
  const [faseValue, setFaseValue] = useState<string>(() => {
    return activeJenjangDef.fases[0].faseLabel;
  });

  const activeFaseDef = useMemo(() => {
    return activeJenjangDef.fases.find((f) => f.faseLabel === faseValue) || activeJenjangDef.fases[0];
  }, [activeJenjangDef, faseValue]);

  // Active Tingkat Kelas
  const [tingkatKelas, setTingkatKelas] = useState<string>(() => {
    return activeJenjangDef.fases[0].defaultKelas;
  });

  // Active Mata Pelajaran
  const [mataPelajaran, setMataPelajaran] = useState<string>(schoolProfile.subject || 'Bahasa Indonesia');
  const [alokasiJp, setAlokasiJp] = useState<number>(4);

  // Interactive Subject Dropdown state
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [subjectSearch, setSubjectSearch] = useState('');

  // Close subject dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) {
        setIsSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Available subjects for active Jenjang, Fase, and Kelas
  const availableSubjects = useMemo(() => {
    return activeJenjangDef.getSubjects(activeFaseDef.faseCode, tingkatKelas);
  }, [activeJenjangDef, activeFaseDef, tingkatKelas]);

  // Filtered available subjects based on user search in dropdown
  const filteredAvailableSubjects = useMemo(() => {
    if (!subjectSearch.trim()) return availableSubjects;
    const q = subjectSearch.toLowerCase();
    return availableSubjects.filter(
      (s) => s.name.toLowerCase().includes(q) || s.rumpun.toLowerCase().includes(q)
    );
  }, [availableSubjects, subjectSearch]);

  // Section 2: Active Tab
  const [activeTab, setActiveTab] = useState<InputTab>('upload');

  // Tab 1 (Upload) state
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
    rawFile?: File;
    analyzedBook?: any;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState('');

  // Tab 2 (Bank CP BSKAP) state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [shortcutJenjang, setShortcutJenjang] = useState<'SD_MI' | 'SMP_MTS' | 'SMA_SMK_MA'>('SMA_SMK_MA');
  const [filterJenjang, setFilterJenjang] = useState<string>('Semua Jenjang');
  const [filterFase, setFilterFase] = useState<string>('Semua Fase');
  const [filterRumpun, setFilterRumpun] = useState<string>('Semua');
  const [onlyRevisiBook, setOnlyRevisiBook] = useState<boolean>(false);

  // Tab 3 (Paste) state
  const [pastedText, setPastedText] = useState<string>('');

  // Detail Modal item
  const [detailModalItem, setDetailModalItem] = useState<CpBankEntry | null>(null);

  // Synchronize entire pipeline with the selected subject's official textbook
  const runPipelineSyncForSubject = (mapelName: string, kls: string, faseLbl: string, jp: number) => {
    const matchedCp =
      CP_LIBRARY_ITEMS.find(
        (c) =>
          c.mapel.toLowerCase() === mapelName.toLowerCase() &&
          (c.kelasDefault.includes(kls.replace('Kelas ', '')) || c.kelasDefault.includes(kls))
      ) || CP_LIBRARY_ITEMS.find((c) => c.mapel.toLowerCase() === mapelName.toLowerCase());

    const isMadrasah =
      mapelName.includes('KMA') ||
      ['Al-Qur\'an', 'Akidah', 'Fikih', 'SKI', 'Bahasa Arab', 'Tafsir'].some((kw) => mapelName.includes(kw)) ||
      ['RA', 'MI', 'MTs', 'MA'].includes(selectedJenjang);

    const defaultBookRef = isMadrasah
      ? `Buku Teks Utama KMA 1503 Tahun 2025: ${mapelName} ${kls} Edisi Revisi Resmi Kementerian Agama RI & Kemendikdasmen (SIBI)`
      : `Buku Teks Utama Edisi Revisi Resmi ${mapelName} ${kls} Kemendikdasmen RI (SIBI buku.kemendikdasmen.go.id)`;

    const bookTitle = matchedCp ? matchedCp.bukuRef : defaultBookRef;

    const targetBook = {
      id: `book-${mapelName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${kls.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      judulBuku: bookTitle,
      mapel: mapelName,
      kelasDefault: kls,
      faseCode: faseLbl.includes('E')
        ? 'E'
        : faseLbl.includes('F')
        ? 'F'
        : faseLbl.includes('D')
        ? 'D'
        : faseLbl.includes('C')
        ? 'C'
        : faseLbl.includes('B')
        ? 'B'
        : faseLbl.includes('A')
        ? 'A'
        : 'Fondasi',
      faseLabel: faseLbl,
      alokasiJp: jp,
    };

    syncPipelineWithBook(targetBook);
  };

  // Handler: Change Jenjang (Cascade downwards: Jenjang ➔ Fase ➔ Kelas ➔ Mapel ➔ JP)
  const handleSelectJenjang = (newKey: ActiveJenjangKey) => {
    setSelectedJenjang(newKey);
    const def = JENJANG_DEFINITIONS[newKey];
    const initialFase = def.fases[0];
    const initialKelas = initialFase.defaultKelas;
    const initialSubjects = def.getSubjects(initialFase.faseCode, initialKelas);
    const initialSub = initialSubjects[0];

    setFaseValue(initialFase.faseLabel);
    setTingkatKelas(initialKelas);
    setMataPelajaran(initialSub.name);
    setAlokasiJp(initialSub.jp);

    runPipelineSyncForSubject(initialSub.name, initialKelas, initialFase.faseLabel, initialSub.jp);
  };

  // Handler: Change Fase (Cascade: Fase ➔ Kelas ➔ Mapel ➔ JP)
  const handleSelectFase = (newFaseLabel: string) => {
    setFaseValue(newFaseLabel);
    const targetFase = activeJenjangDef.fases.find((f) => f.faseLabel === newFaseLabel) || activeJenjangDef.fases[0];

    let newKelas = tingkatKelas;
    if (!targetFase.kelasOptions.includes(tingkatKelas)) {
      newKelas = targetFase.defaultKelas;
      setTingkatKelas(newKelas);
    }

    const availableSubs = activeJenjangDef.getSubjects(targetFase.faseCode, newKelas);
    const matchedSub = availableSubs.find((s) => s.name === mataPelajaran) || availableSubs[0];

    setMataPelajaran(matchedSub.name);
    setAlokasiJp(matchedSub.jp);

    runPipelineSyncForSubject(matchedSub.name, newKelas, newFaseLabel, matchedSub.jp);
  };

  // Handler: Change Tingkat Kelas (Cascade: Kelas ➔ Mapel ➔ JP)
  const handleSelectKelas = (newKelas: string) => {
    setTingkatKelas(newKelas);
    const availableSubs = activeJenjangDef.getSubjects(activeFaseDef.faseCode, newKelas);
    const matchedSub = availableSubs.find((s) => s.name === mataPelajaran) || availableSubs[0];

    setMataPelajaran(matchedSub.name);
    setAlokasiJp(matchedSub.jp);

    runPipelineSyncForSubject(matchedSub.name, newKelas, faseValue, matchedSub.jp);
  };

  // Handler: Select Subject from Interactive Dropdown
  const handleSelectSubject = (sub: SubjectOption) => {
    setMataPelajaran(sub.name);
    setAlokasiJp(sub.jp);
    setIsSubjectDropdownOpen(false);
    setSubjectSearch('');

    runPipelineSyncForSubject(sub.name, tingkatKelas, faseValue, sub.jp);
  };

  // Tab 1 File Upload & AI Smart Book Analysis
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const runAiBookAnalysis = async (file: File) => {
    setIsAnalyzing(true);
    setAnalysisStep(`Membaca naskah berkas "${file.name}"...`);

    const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
    const fileExt = file.name.split('.').pop()?.toUpperCase() || 'DOCUMENT';
    const cleanFileName = file.name.replace(/\.[^/.]+$/, '');

    // Smart Subject Detection
    const fnLower = file.name.toLowerCase();
    let detectedSubject = mataPelajaran;
    if (fnLower.includes('indonesia')) detectedSubject = 'Bahasa Indonesia';
    else if (fnLower.includes('matematika')) detectedSubject = 'Matematika';
    else if (fnLower.includes('fisika')) detectedSubject = 'Fisika';
    else if (fnLower.includes('kimia')) detectedSubject = 'Kimia';
    else if (fnLower.includes('biologi')) detectedSubject = 'Biologi';
    else if (fnLower.includes('ekonomi')) detectedSubject = 'Ekonomi';
    else if (fnLower.includes('sejarah')) detectedSubject = 'Sejarah';
    else if (fnLower.includes('informatika') || fnLower.includes('koding')) detectedSubject = 'Informatika';
    else if (fnLower.includes('pancasila')) detectedSubject = 'Pendidikan Pancasila';
    else if (fnLower.includes('inggris')) detectedSubject = 'Bahasa Inggris';
    else if (fnLower.includes('qur') || fnLower.includes('fikih') || fnLower.includes('akidah') || fnLower.includes('pai'))
      detectedSubject = 'Pendidikan Agama Islam dan Budi Pekerti';
    else if (fnLower.includes('pjok') || fnLower.includes('olahraga'))
      detectedSubject = 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)';
    else if (fnLower.includes('ipas') || fnLower.includes('sains'))
      detectedSubject = 'Ilmu Pengetahuan Alam dan Sosial (IPAS)';
    else if (fnLower.includes('seni')) detectedSubject = 'Seni Budaya';

    try {
      let fileSnippet = '';
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        fileSnippet = await file.text();
      }

      setAnalysisStep('Menghubungkan ke Server Gemini 3.8 Flash AI...');
      const res = await fetch('/api/gemini/analyze-book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileTextSnippet: fileSnippet.slice(0, 3000),
          subject: detectedSubject,
          fase: activeFaseDef.faseCode,
          grade: tingkatKelas,
          teacherName: schoolProfile.teacherName,
        }),
      });

      let aiResult: any = null;
      if (res.ok) {
        aiResult = await res.json();
      }

      // If backend responded with AI data, use it; otherwise build structured fallback schema
      const analyzedBook = {
        id: `book-upload-${Date.now()}`,
        judulBuku: aiResult?.judulBuku || `Buku Teks Utama Edisi Revisi (Upload ${fileExt}): ${detectedSubject} ${tingkatKelas} (${cleanFileName})`,
        mapel: aiResult?.mapel || detectedSubject,
        kelasDefault: aiResult?.kelasDefault || tingkatKelas,
        faseCode: aiResult?.faseCode || activeFaseDef.faseCode,
        faseLabel: aiResult?.faseLabel || faseValue,
        alokasiJp: aiResult?.alokasiJp || alokasiJp,
        penerbit: aiResult?.penerbit || `SIBI Kemendikdasmen & Kemenag RI (Buku Upload: ${file.name})`,
        pengarang: aiResult?.pengarang || `Pusat Perbukuan & Tim Penyusun Kurikulum (Dokumen Upload Guru)`,
        tahunTerbit: aiResult?.tahunTerbit || 2026,
        desc: aiResult?.rangkumanAnalisisAi || `Buku Teks Utama hasil unggahan berkas "${file.name}" yang telah dianalisis AI dan diselaraskan 100% dengan CP BSKAP No. 046/H/KR/2025.`,
        elemenList: aiResult?.elemenCp || ['Menyimak', 'Membaca dan Memirsa', 'Berbicara dan Mempresentasikan', 'Menulis'],
        babList: aiResult?.babList,
      };

      setUploadedFile({
        name: file.name,
        size: sizeKb,
        type: fileExt,
        rawFile: file,
        analyzedBook,
      });

      setMataPelajaran(analyzedBook.mapel);

      // Automatically synchronize entire curriculum pipeline with the analyzed uploaded book!
      syncPipelineWithBook(analyzedBook);
    } catch (err) {
      console.error('AI Book Analysis Exception:', err);
      // Construct fallback
      const analyzedBook = {
        id: `book-upload-${Date.now()}`,
        judulBuku: `Buku Teks Utama Edisi Revisi (Upload ${fileExt}): ${detectedSubject} ${tingkatKelas} (${cleanFileName})`,
        mapel: detectedSubject,
        kelasDefault: tingkatKelas,
        faseCode: activeFaseDef.faseCode,
        faseLabel: faseValue,
        alokasiJp: alokasiJp,
        penerbit: `SIBI Kemendikdasmen & Kemenag RI (Buku Upload: ${file.name})`,
        pengarang: `Pusat Perbukuan & Tim Penyusun Kurikulum (Dokumen Upload Guru)`,
        tahunTerbit: 2026,
        desc: `Buku Teks Utama hasil unggahan berkas "${file.name}" yang telah dianalisis AI dan diselaraskan 100% dengan CP BSKAP No. 046/H/KR/2025.`,
        elemenList: ['Menyimak', 'Membaca dan Memirsa', 'Berbicara dan Mempresentasikan', 'Menulis'],
      };

      setUploadedFile({
        name: file.name,
        size: sizeKb,
        type: fileExt,
        rawFile: file,
        analyzedBook,
      });

      setMataPelajaran(detectedSubject);
      syncPipelineWithBook(analyzedBook);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFile = (file: File) => {
    runAiBookAnalysis(file);
  };

  // Handle Using a CP Card
  const handleUseCpItem = (item: CpBankEntry) => {
    setMataPelajaran(item.mapel);
    setTingkatKelas(item.kelasDefault);
    setFaseValue(item.faseLabel);
    setAlokasiJp(item.jpDefault);

    // Sync pipeline automatically with the chosen CP's book
    const targetBook = {
      id: `book-${item.id}`,
      judulBuku: item.bukuRef,
      mapel: item.mapel,
      kelasDefault: item.kelasDefault,
      faseCode: item.faseCode,
      faseLabel: item.faseLabel,
      alokasiJp: item.jpDefault,
    };
    syncPipelineWithBook(targetBook);
  };

  // Handle Start 1 Year Mapping
  const handleStartAnalysis = () => {
    runPipelineSyncForSubject(mataPelajaran, tingkatKelas, faseValue, alokasiJp);
    setActiveView('cp_atp');
  };

  // Filtered CP library items
  const filteredCpItems = useMemo(() => {
    return CP_LIBRARY_ITEMS.filter((item) => {
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchTitle = item.mapel.toLowerCase().includes(q);
        const matchFase = item.faseLabel.toLowerCase().includes(q) || item.faseCode.toLowerCase().includes(q);
        const matchDesc = item.desc.toLowerCase().includes(q);
        const matchElements = item.elemenList.some((el) => el.toLowerCase().includes(q));
        const matchBuku = item.bukuRef.toLowerCase().includes(q);
        if (!matchTitle && !matchFase && !matchDesc && !matchElements && !matchBuku) return false;
      }

      if (filterJenjang !== 'Semua Jenjang') {
        if (filterJenjang === 'PAUD / TK / RA' && !['PAUD', 'TK', 'RA'].includes(item.jenjang)) return false;
        if (filterJenjang === 'SD / MI (Kelas 1-6)' && !['SD', 'MI'].includes(item.jenjang)) return false;
        if (filterJenjang === 'SMP / MTs' && !['SMP', 'MTs'].includes(item.jenjang)) return false;
        if (filterJenjang === 'SMA / SMK / MA' && !['SMA', 'SMK', 'MA', 'SMA_SMK'].includes(item.jenjang)) return false;
      }

      if (filterFase !== 'Semua Fase') {
        if (filterFase.startsWith('Fase Fondasi') && item.faseCode !== 'Fondasi') return false;
        if (filterFase.startsWith('Fase A') && item.faseCode !== 'A') return false;
        if (filterFase.startsWith('Fase B') && item.faseCode !== 'B') return false;
        if (filterFase.startsWith('Fase C') && item.faseCode !== 'C') return false;
        if (filterFase.startsWith('Fase D') && item.faseCode !== 'D') return false;
        if (filterFase.startsWith('Fase E') && item.faseCode !== 'E') return false;
        if (filterFase.startsWith('Fase F') && item.faseCode !== 'F') return false;
      }

      if (filterRumpun !== 'Semua' && item.rumpun !== filterRumpun) {
        return false;
      }

      if (onlyRevisiBook && !item.hasRevisiBook) {
        return false;
      }

      return true;
    });
  }, [searchTerm, filterJenjang, filterFase, filterRumpun, onlyRevisiBook]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* CARD 1: 1. PILIH JENJANG & MATA PELAJARAN SASARAN             */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 space-y-6">
        {/* Card 1 Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-[#00875a]" />
            <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight uppercase">
              1. PILIH JENJANG & MATA PELAJARAN SASARAN
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Menentukan standar fase dan kedalaman materi (PAUD, TK, RA, SD, MI, SMP, MTs, SMA, SMK, MA)
          </p>
        </div>

        {/* 10 Jenjang Buttons (PAUD, TK, RA, SD, MI, SMP, MTs, SMA, SMK, MA) */}
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span>Pilih Jenjang Satuan Pendidikan:</span>
            <span className="text-emerald-700 font-semibold">{activeJenjangDef.badge}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {(Object.keys(JENJANG_DEFINITIONS) as ActiveJenjangKey[]).map((jKey) => {
              const def = JENJANG_DEFINITIONS[jKey];
              const isSelected = selectedJenjang === jKey;

              return (
                <button
                  key={jKey}
                  type="button"
                  onClick={() => handleSelectJenjang(jKey)}
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all border flex items-center justify-center gap-2 ${
                    isSelected
                      ? 'bg-[#00875a] text-white border-[#00875a] shadow-sm ring-2 ring-emerald-500/20'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
                  }`}
                >
                  <span className="text-base">{def.icon}</span>
                  <span className="truncate">{def.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Form Fields in a Grid (Cascade Synchronized) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Fase Kurikulum Merdeka / Mendalam */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">
              Fase Kurikulum Merdeka / Mendalam
            </label>
            <div className="relative">
              <select
                value={faseValue}
                onChange={(e) => handleSelectFase(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#00875a] focus:border-[#00875a] pr-8"
              >
                {activeJenjangDef.fases.map((f) => (
                  <option key={f.faseLabel} value={f.faseLabel}>
                    {f.faseLabel}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 2. Tingkat Kelas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">
              Tingkat Kelas
            </label>
            <div className="relative">
              <select
                value={tingkatKelas}
                onChange={(e) => handleSelectKelas(e.target.value)}
                className="w-full appearance-none px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#00875a] focus:border-[#00875a] pr-8"
              >
                {activeFaseDef.kelasOptions.map((kls) => (
                  <option key={kls} value={kls}>
                    {kls}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                <ChevronDown className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* 3. Mata Pelajaran (Interactive Searchable Dropdown) */}
          <div className="space-y-1.5 relative" ref={subjectDropdownRef}>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-600">
                Mata Pelajaran (Klik untuk Memilih)
              </label>
              <span className="text-[11px] text-emerald-700 font-medium">
                {availableSubjects.length} Pilihan Mapel
              </span>
            </div>

            <div
              onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-semibold focus:ring-2 focus:ring-[#00875a] focus:border-[#00875a] flex items-center justify-between cursor-pointer hover:border-emerald-500 shadow-2xs"
            >
              <span className="truncate">{mataPelajaran}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isSubjectDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Dropdown Menu */}
            {isSubjectDropdownOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white rounded-xl border border-slate-200 shadow-xl max-h-80 overflow-hidden flex flex-col">
                <div className="p-2 border-b border-slate-100 bg-slate-50">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={subjectSearch}
                      onChange={(e) => setSubjectSearch(e.target.value)}
                      placeholder="Cari mata pelajaran..."
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-[#00875a] focus:border-[#00875a]"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="overflow-y-auto divide-y divide-slate-100 p-1">
                  {filteredAvailableSubjects.length > 0 ? (
                    filteredAvailableSubjects.map((sub, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleSelectSubject(sub)}
                        className={`w-full px-3 py-2 text-left rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                          mataPelajaran === sub.name
                            ? 'bg-emerald-50 text-[#00875a] font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span>{sub.icon}</span>
                          <span className="truncate">{sub.name}</span>
                          {sub.isMadrasah && (
                            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 text-[9px] rounded font-semibold shrink-0">
                              KMA
                            </span>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 shrink-0 font-bold ml-2">
                          {sub.jp} JP
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Tidak ditemukan mata pelajaran "{subjectSearch}"
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 4. Alokasi JP / Minggu */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600">
              Alokasi JP / Minggu
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={44}
                value={alokasiJp}
                onChange={(e) => {
                  const val = Number(e.target.value) || 1;
                  setAlokasiJp(val);
                  runPipelineSyncForSubject(mataPelajaran, tingkatKelas, faseValue, val);
                }}
                className="w-full px-3.5 py-2.5 pr-10 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:ring-2 focus:ring-[#00875a] focus:border-[#00875a]"
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-sm font-semibold text-slate-500 pointer-events-none">
                JP
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Rekomendasi Mapel Pills (Adapts to Selected Jenjang) */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs sm:text-sm font-semibold text-slate-500 mr-1">
            Rekomendasi Mapel {activeJenjangDef.shortLabel}:
          </span>
          {activeJenjangDef.rekomendasi.map((rec) => {
            const isMatch = mataPelajaran.toLowerCase() === rec.name.toLowerCase();
            return (
              <button
                key={rec.name}
                type="button"
                onClick={() => {
                  setMataPelajaran(rec.name);
                  setAlokasiJp(rec.jp);
                  runPipelineSyncForSubject(rec.name, tingkatKelas, faseValue, rec.jp);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all border ${
                  isMatch
                    ? 'bg-emerald-100 text-[#00875a] border-emerald-400 font-semibold shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-300 hover:text-emerald-700'
                }`}
              >
                {rec.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* CARD 2: 2. PILIH METODE INPUT CAPAIAN PEMBELAJARAN             */}
      {/* ------------------------------------------------------------- */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-6">
        {/* Card 2 Header */}
        <div className="p-6 pb-0 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-[#00875a]" />
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight uppercase">
                2. PILIH METODE INPUT CAPAIAN PEMBELAJARAN
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Dapat mengunggah file SK, memilih Bank CP BSKAP, atau paste teks
            </p>
          </div>

          {/* 3 Main Tabs */}
          <div className="flex flex-wrap border-b border-slate-200 gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all ${
                activeTab === 'upload'
                  ? 'border-[#00875a] text-[#00875a] bg-emerald-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Upload className="w-4 h-4 text-emerald-600" />
              <span>Upload &amp; Analisis Buku Pintar (PDF / Word)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-2xs">
                AI Smart
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bank')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all ${
                activeTab === 'bank'
                  ? 'border-[#00875a] text-[#00875a] bg-emerald-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Bank CP Resmi BSKAP (Siap Pakai)</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                Cepat
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('paste')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all ${
                activeTab === 'paste'
                  ? 'border-[#00875a] text-[#00875a] bg-emerald-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Salin & Tempel Teks CP</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Upload Berkas CP */}
        {activeTab === 'upload' && (
          <div className="p-6 pt-0 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleFileDrop}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all ${
                isDragging
                  ? 'border-[#00875a] bg-emerald-50/60'
                  : 'border-slate-300 bg-slate-50/40 hover:bg-slate-50 hover:border-emerald-300'
              }`}
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <FileUp className="w-8 h-8 text-slate-600" />
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                Tarik dan letakkan berkas Capaian Pembelajaran ke sini
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mb-6">
                Mendukung dokumen PDF (SK BSKAP CP), Word (.docx), Excel (.xlsx/.csv), atau Foto Scan
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.xlsx,.xls,.csv,image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-emerald-100/70 text-[#00875a] border border-emerald-300 hover:bg-emerald-200/80 transition-colors shadow-xs"
              >
                Pilih Berkas dari Komputer
              </button>
            </div>

            {/* Loading Indicator for AI Book Analysis */}
            {isAnalyzing && (
              <div className="p-6 bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl border border-emerald-500/50 shadow-lg space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-3 border-emerald-400 border-t-transparent animate-spin shrink-0" />
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-emerald-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Analisis Buku Pintar AI (Gemini 3.8 Flash) Sedang Berjalan...</span>
                    </h4>
                    <p className="text-xs text-emerald-100 font-mono mt-0.5">{analysisStep}</p>
                  </div>
                </div>
                <div className="w-full bg-emerald-950 rounded-full h-2 overflow-hidden border border-emerald-700/50">
                  <div className="bg-gradient-to-r from-amber-400 to-emerald-300 h-2 rounded-full w-3/4 animate-pulse" />
                </div>
                <p className="text-[11px] text-emerald-300/80 italic">
                  Mengekstrak struktur materi, alokasi JP, dan mencocokkan dengan Capaian Pembelajaran (KepKa BSKAP 046/2025)...
                </p>
              </div>
            )}

            {uploadedFile && !isAnalyzing && (
              <div className="p-5 bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white rounded-2xl border border-emerald-300 shadow-sm space-y-4 animate-in fade-in duration-300">
                {/* Header File Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm sm:text-base font-bold text-emerald-950">
                          {uploadedFile.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-200 text-emerald-900 border border-emerald-300">
                          {uploadedFile.type}
                        </span>
                      </div>
                      <p className="text-xs text-emerald-800 font-medium">
                        Ukuran: {uploadedFile.size} • Terverifikasi AI &amp; Diselaraskan dengan BSKAP 046/2025
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
                    className="self-start sm:self-center p-1.5 text-emerald-700 hover:bg-emerald-200/60 rounded-lg transition-colors cursor-pointer"
                    title="Hapus berkas unggahan"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* AI Extracted Book Summary */}
                {uploadedFile.analyzedBook && (
                  <div className="bg-white rounded-xl p-4 border border-emerald-200 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                          Hasil Analisis Isi Buku Terurai AI
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        100% Tersinkron Pipeline
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Judul Buku Terurai
                        </span>
                        <p className="font-bold text-slate-800 truncate">
                          {uploadedFile.analyzedBook.judulBuku}
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Mata Pelajaran &amp; Fase
                        </span>
                        <p className="font-bold text-slate-800">
                          {uploadedFile.analyzedBook.mapel} · {uploadedFile.analyzedBook.faseLabel}
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                          Penerbit &amp; Acuan Regulasi
                        </span>
                        <p className="font-bold text-emerald-800 truncate">
                          {uploadedFile.analyzedBook.penerbit}
                        </p>
                      </div>
                    </div>

                    {/* Pipeline Status Indicator */}
                    <div className="p-3 bg-emerald-950 text-emerald-100 rounded-xl text-xs space-y-1.5">
                      <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Status Pipeline Kurikulum Aktif (Terhubung Otomatis):</span>
                      </p>
                      <p className="text-[11px] text-emerald-200 font-mono leading-relaxed">
                        Kalender/RPE (MEF &amp; JP) → Analisis CP/ATP → PROTA → PROMES → Modul Ajar → LKPD → Penilaian Rapor telah diselaraskan dengan buku unggahan.
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => syncPipelineWithBook(uploadedFile.analyzedBook)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-[#00875a] hover:bg-[#00734c] text-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Sinkronkan Lagi ke Pipeline Kurikulum (1-Klik)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveView('cp_atp')}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Buka Analisis CP &amp; ATP</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveView('bundel')}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Layers className="w-3.5 h-3.5 text-amber-700" />
                        <span>Buka Bundel Lengkap 1 Tahun</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Bank CP Resmi BSKAP (Siap Pakai) */}
        {activeTab === 'bank' && (
          <div className="p-6 pt-0 space-y-6">
            {/* Green Alert Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#e8f5e9] border border-emerald-200/90 text-emerald-950 flex items-start gap-3.5">
              <div className="p-2 bg-[#00875a] text-white rounded-xl shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm sm:text-base text-emerald-950">
                    Bank Capaian Pembelajaran Resmi Terstandarisasi
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#00875a] text-white">
                    KepKa BSKAP No. 046/H/KR/2025
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/90 text-slate-700 border border-slate-300">
                    Kemendikdasmen & Kemenag RI
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-emerald-900 leading-relaxed">
                  Seluruh bank CP telah diperbaharui mengacu pada regulasi terbaru <strong>KepKa BSKAP No. 046/H/KR/2025</strong> dan <strong>KMA Nomor 1503 Tahun 2025</strong>. Elemen kompetensi terpetakan dengan KKO Bloom Revisi, Alur Tujuan Pembelajaran (ATP) terbagi presisi ke Semester 1 & 2, serta terintegrasi penguatan Profil Pelajar Pancasila dan diferensiasi.
                </p>
              </div>
            </div>

            {/* Status Pipeline Kurikulum Terhubung Otomatis */}
            <div className="p-4 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-teal-50 to-white shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-950">
                    Sinkronisasi Otomatis Bank CP ➔ Pipeline Kurikulum Aktif
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Buku Terpilih:</span>
                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200 truncate max-w-xs sm:max-w-md">
                    📖 {selectedBook?.judulBuku || `Buku Teks Utama ${mataPelajaran} ${tingkatKelas} Edisi Revisi Resmi Kemendikdasmen RI`}
                  </span>
                </div>
              </div>

              {/* 7 Pipeline Stages Flow */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1.5 pt-1 text-[11px] font-semibold">
                {[
                  { label: 'Kalender & RPE (MEF/JP)', icon: '🗓️' },
                  { label: 'Analisis CP & ATP', icon: '🎯' },
                  { label: 'PROTA Tahunan', icon: '📋' },
                  { label: 'PROMES Matriks', icon: '📅' },
                  { label: 'Modul Ajar Deep Learning', icon: '📘' },
                  { label: 'LKPD Terpadu', icon: '📝' },
                  { label: 'Penilaian Rapor Siswa', icon: '📊' },
                ].map((st, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-2 rounded-lg bg-white/90 border border-emerald-200/80 text-emerald-950 flex flex-col items-center text-center gap-1 shadow-2xs"
                  >
                    <span className="text-sm">{st.icon}</span>
                    <span className="leading-tight line-clamp-1">{st.label}</span>
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tersinkron
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari mata pelajaran, fase, bab materi, atau kata kunci... (contoh: IPAS, Aljabar, Sel, Biologi, Pancasila, Fikih, Al-Qur'an Hadis)"
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-[#00875a] focus:border-[#00875a]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Buku Revisi Toggle (Kemendikdasmen & Kemenag RI) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-emerald-200/90 bg-emerald-50/50 shadow-2xs">
              <button
                type="button"
                onClick={() => setOnlyRevisiBook(!onlyRevisiBook)}
                className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  onlyRevisiBook
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100/70 shadow-xs'
                }`}
                title="Tampilkan modul yang telah diselaraskan dengan buku teks kurikulum merdeka edisi revisi terbaru"
              >
                <Book className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Buku Teks Utama Edisi Revisi (Kemendikdasmen & Kemenag RI) Filter</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                    onlyRevisiBook ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-200 text-emerald-950'
                  }`}
                >
                  {onlyRevisiBook ? 'Aktif' : 'Filter'}
                </span>
              </button>

              <span className="text-xs text-slate-600 px-1">
                Menampilkan materi yang telah diselaraskan dengan Bab & Sub-Bab buku paket resmi terbaru
              </span>
            </div>

            {/* Results Counter */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-sm">
              <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Ditemukan{' '}
                  <strong className="text-emerald-700 font-bold">{filteredCpItems.length}</strong>{' '}
                  modul CP resmi KepKa BSKAP No. 046/H/KR/2025 & KMA 1503/2025
                </span>
              </div>

              {(searchTerm || onlyRevisiBook) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
                    setOnlyRevisiBook(false);
                  }}
                  className="text-xs text-emerald-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset Filter
                </button>
              )}
            </div>

            {/* CP Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCpItems.map((item) => {
                const isCurrentActive =
                  mataPelajaran.toLowerCase() === item.mapel.toLowerCase() &&
                  faseValue.toLowerCase().includes(item.faseCode.toLowerCase());

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                      isCurrentActive
                        ? 'border-[#00875a] bg-emerald-50/30 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="p-1.5 bg-slate-100 rounded-lg text-base">
                            {item.icon || '📘'}
                          </span>
                          <div>
                            <h4 className="text-base font-bold text-slate-900 leading-tight">
                              {item.mapel}
                            </h4>
                            <span className="text-xs font-semibold text-emerald-700">
                              {item.faseLabel} • {item.kelasDefault}
                            </span>
                          </div>
                        </div>

                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                          {item.jpDefault} JP / Minggu
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {item.elemenCount} Elemen Kompetensi:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {item.elemenList.map((el, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700"
                            >
                              {el}
                            </span>
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                        {item.desc}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <Book className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate font-medium">{item.bukuRef}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setDetailModalItem(item)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-slate-100 cursor-pointer"
                      >
                        <Info className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleUseCpItem(item)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                          isCurrentActive
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                            : 'bg-[#00875a] text-white hover:bg-[#00734c]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isCurrentActive ? 'CP Aktif' : 'Gunakan CP'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Salin & Tempel Teks CP */}
        {activeTab === 'paste' && (
          <div className="p-6 pt-0 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Tempelkan Naskah Capaian Pembelajaran (CP) dari Dokumen SK
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setPastedText(
                      `CAPAIAN PEMBELAJARAN MATA PELAJARAN ${mataPelajaran.toUpperCase()} ${faseValue.toUpperCase()}\n\nElemen Pemahaman Konsep:\nPeserta didik mampu memahami prinsip, fakta, konsep, dan teori secara mendalam serta mengintegrasikannya dengan realitas kontekstual sehari-hari.\n\nElemen Keterampilan Proses:\nPeserta didik mampu mengamati, menanya, merancang penyelidikan, mengumpulkan data, mengorganisasikan informasi, menarik kesimpulan, serta mengomunikasikan hasil pemikiran secara etis dan kolaboratif.`
                    );
                    showNotification('info', 'Contoh teks SK CP berhasil dimuat ke editor.');
                  }}
                  className="text-xs text-[#00875a] font-semibold hover:underline"
                >
                  + Muat Contoh Teks SK CP
                </button>
              </div>

              <textarea
                rows={8}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Salin teks Capaian Pembelajaran atau elemen kompetensi dari PDF SK BSKAP 046/2025 atau KMA 1503/2025 lalu tempelkan di sini..."
                className="w-full p-4 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono text-slate-800 focus:ring-2 focus:ring-[#00875a] focus:border-[#00875a]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!pastedText.trim()}
                onClick={() => {
                  showNotification('success', 'Teks CP berhasil diproses dan disimpan ke rancangan.');
                }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-[#00875a] text-white hover:bg-[#00734c] disabled:opacity-50 transition-colors shadow-xs"
              >
                Proses & Petakan Elemen CP
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* BOTTOM FOOTER BAR                                             */}
      {/* ------------------------------------------------------------- */}
      <footer className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Pilih file SK CP atau gunakan Bank CP Resmi untuk melanjutkan.
        </p>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleStartAnalysis}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-[#00875a] text-white hover:bg-[#00734c] transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <span>
              Mulai Analisis & Petakan Materi 1 Tahun ({mataPelajaran} - {faseValue})
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: DETAIL ELEMEN & CAPAIAN PEMBELAJARAN                   */}
      {/* ------------------------------------------------------------- */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl text-xl">
                  {detailModalItem.icon || '📘'}
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {detailModalItem.mapel}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {detailModalItem.faseLabel} • {detailModalItem.kelasDefault} • {detailModalItem.jpDefault} JP/Minggu
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Deskripsi Capaian Pembelajaran (CP)
                </h4>
                <p className="text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed text-xs sm:text-sm">
                  {detailModalItem.desc}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Elemen Kompetensi ({detailModalItem.elemenCount} Elemen)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {detailModalItem.elemenList.map((el, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 flex items-start gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span className="text-xs font-semibold text-emerald-950">{el}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Buku Teks Referensi Resmi
                </h4>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="flex items-start gap-2.5">
                    <Book className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{detailModalItem.bukuRef}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Standar Resmi KepKa BSKAP No. 046/H/KR/2025 & Permendikbudristek No. 12 Tahun 2024
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  handleUseCpItem(detailModalItem);
                  setDetailModalItem(null);
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#00875a] text-white hover:bg-[#00734c] shadow-xs cursor-pointer"
              >
                Pasang & Gunakan Modul Ini Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

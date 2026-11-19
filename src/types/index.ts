export type MenuKey =
  | 'dashboard'
  | 'cover'
  | 'bundel'
  | 'cp_atp'
  | 'bloom'
  | 'analisis_perangkat'
  | 'kaldik'
  | 'rpe'
  | 'prota'
  | 'promes'
  | 'modul_ajar'
  | 'lkpd'
  | 'asesmen'
  | 'sinkronisasi'
  | 'profil'
  | 'bank_cp'
  | 'sinkron_modul'
  | 'pusat_unduh'
  | 'backup'
  | 'database'
  | 'ai_asisten';

export type MenuCategory = 'Semua' | 'Perencanaan' | 'Program' | 'Pelaksanaan' | 'Pengaturan & Berkas';

export type CpSource = 'BSKAP_046' | 'Permendikbud_12' | 'KMA_1503';

export interface SchoolProfile {
  schoolName: string;
  npsn: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  akreditasi?: string;
  programKeahlian?: string | string[];
  headmasterName: string;
  headmasterNip: string;
  headmasterIdType?: string;
  teacherName: string;
  teacherNip: string;
  teacherNuptk?: string;
  teacherIdType?: string;
  subject: string;
  fase: string;
  grade: string;
  academicYear: string;
  semester: number;
  kurikulum: string;
  pendekatan: string;
  signaturePlaceDate: string;
  city: string;
  logoUrl?: string;
  leftLogoUrl?: string;
  rightLogoUrl?: string;
  headmasterSignatureUrl?: string;
  teacherSignatureUrl?: string;
  coverBackgroundUrl?: string;
  coverOverlayOpacity?: number;
  kktpThreshold?: number;
  activeCpSource: CpSource;
  kopType?: 'yayasan' | 'dinas';
}

export interface TujuanPembelajaran {
  id: string;
  code: string;
  element: string;
  description: string;
  bloomLevel: 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';
  hotsCategory: 'LOTS' | 'MOTS' | 'HOTS';
  jpAllocation: number;
  semester: number;
  babId: string;
  materiPokok: string;
  kataKunci: string[];
  indikatorKinerja?: string;
  subMateri?: string;
  profilPelajarPancasila?: string[];
  rencanaAsesmen?: string;
  variasiKeterampilan?: string;
}

export interface CpElement {
  id: string;
  name: string;
  deskripsi: string;
  kompetensi: string[];
  materi: string[];
  variasiKeterampilan?: string;
}

export interface KaldikEvent {
  id: string;
  dateStart: string;
  dateEnd: string;
  name: string;
  type: 'libur_nasional' | 'libur_semester' | 'kbm' | 'sts' | 'sas' | 'kegiatan_sekolah';
  color: string;
  notes: string;
}

export interface MonthRpeDetail {
  month: string;
  totalWeeks: number;
  nonEffectiveWeeks: number;
  nonEffectiveNote: string;
  effectiveWeeks: number;
  effectiveMeetings?: number;
}

export interface RpeState {
  semester1: {
    months: MonthRpeDetail[];
    jpPerWeek: number;
    cadanganJp: number;
  };
  semester2: {
    months: MonthRpeDetail[];
    jpPerWeek: number;
    cadanganJp: number;
  };
}

export interface ProtaItem {
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
}

export interface PromesItem {
  id: string;
  semester: number;
  babNumber: number;
  babTitle: string;
  materiPembelajaran?: string;
  tpCode: string;
  tpDescription: string;
  alokasiJp: number;
  // monthly weeks mapping: e.g. "Jul-1": 0, "Jul-2": 4, etc.
  distribution: { [key: string]: number };
}

export interface DeepLearningPillars {
  mindful: {
    title: string;
    description: string;
    kegiatanHeningCipta: string;
    refleksiFokus: string;
  };
  meaningful: {
    title: string;
    description: string;
    masalahNyata: string;
    aplikasiHidup: string;
  };
  joyful: {
    title: string;
    description: string;
    pameranKarya: string;
    apresiasiKolaboratif: string;
  };
}

export interface RubrikLevel {
  kriteria: string;
  baruBerkembang: string;
  layak: string;
  cakap: string;
  mahir: string;
}

export interface IdentifikasiKemendikdasmen {
  pesertaDidik?: string;
  materiPelajaran?: string;
  dimensiProfilLulusan: string[];
}

export interface DesainPembelajaranKemendikdasmen {
  capaianPembelajaran?: string;
  lintasDisiplinIlmu?: string;
  tujuanPembelajaran: string[];
  topikPembelajaran?: string;
  praktikPedagogis: string;
  kemitraanPembelajaran?: string;
  lingkunganPembelajaran: string;
  pemanfaatanDigital?: string;
}

export interface PengalamanBelajarKemendikdasmen {
  kegiatanAwal?: {
    prinsip: string;
    deskripsi: string[];
  };
  kegiatanInti: {
    prinsip: string;
    memahami: {
      prinsip: string;
      deskripsi: string[];
    };
    mengaplikasi: {
      prinsip: string;
      deskripsi: string[];
    };
    merefleksi: {
      prinsip: string;
      deskripsi: string[];
    };
  };
  kegiatanPenutup?: {
    prinsip: string;
    deskripsi: string[];
  };
}

export interface AsesmenPembelajaranKemendikdasmen {
  assessmentAsLearning: string;
  assessmentForLearning: string;
  assessmentOfLearning: string;
  contohInstrumen?: string[];
}

export interface ModulAjarItem {
  id: string;
  babNumber: number;
  babTitle: string;
  semester: number;
  alokasiJp: number;
  pertemuanCount: number;
  kompetensiAwal: string;
  profilPelajarPancasila: string[];
  saranaPrasarana: string;
  targetPesertaDidik: string;
  modelPembelajaran: string;
  tujuanPembelajaran: string[];
  pemahamanBermakna: string;
  pertanyaanPemantik: string[];
  deepLearning: DeepLearningPillars;
  langkahPembelajaran: {
    pendahuluan: string[];
    inti: {
      diferensiasiKonten: string[];
      diferensiasiProses: string[];
      diferensiasiProduk: string[];
    };
    penutup: string[];
  };
  asesmen: {
    diagnostik: string;
    formatif: string;
    sumatif: string;
  };
  rubrik: RubrikLevel[];

  // Official Kemendikdasmen Deep Learning Template (from uploaded reference photos)
  identifikasi?: IdentifikasiKemendikdasmen;
  desainPembelajaran?: DesainPembelajaranKemendikdasmen;
  petaPengalamanBelajar?: Array<{ tahap: string; deskripsi: string }>;
  pengalamanBelajar?: PengalamanBelajarKemendikdasmen;
  asesmenPembelajaran?: AsesmenPembelajaranKemendikdasmen;
}

export interface LkpdItem {
  id: string;
  babId: string;
  babNumber: number;
  babTitle: string;
  semester?: number;
  pertemuan: number;
  title: string;
  waktu: string;
  petunjuk: string[];
  materiRingkas: string;
  aktivitas: string;
  pertanyaanDiskusi: string[];
  tugasMandiri: string;
  kunciJawaban: string;
}

export type CpMasteryLevel = 'Perlu Bimbingan' | 'Cukup' | 'Cakap' | 'Mahir';

export interface StudentCpTarget {
  elementId?: string;
  elementName: string;
  tpCode: string;
  targetLevel: CpMasteryLevel;
  skor: number;
  status: 'Tercapai' | 'Dalam Proses' | 'Perlu Penguatan';
  catatanGuru: string;
  updatedAt?: string;
}

export interface StudentRecord {
  id: string;
  nisn: string;
  name: string;
  gender: 'L' | 'P';
  formatifScores: { [tpCode: string]: number };
  sumatifLmScores: { [babKey: string]: number };
  sumatifAkhir: number;
  nilaiAkhir: number;
  predikat: 'A' | 'B' | 'C' | 'D';
  kktpStatus: 'Tuntas' | 'Perlu Bimbingan';
  deskripsi: string;
  cpTargets?: { [tpCode: string]: StudentCpTarget };
  catatanDiferensiasi?: string;
}

export interface MenuItemInfo {
  key: MenuKey;
  number: number;
  title: string;
  badge: string;
  category: MenuCategory;
  description: string;
  statusInfo: string;
  buttonLabel?: string;
  secondaryButton?: {
    label: string;
    actionKey: string;
  };
}

export interface DatabaseEntityRecordSummary {
  key: string;
  tableColumn: string;
  label: string;
  recordCount: number;
  unitLabel: string;
  estimatedBytes: number;
  estimatedKb: string;
  syncedToLocal: boolean;
  previewSample: unknown;
}

export interface SupabaseValidationResult {
  valid: boolean;
  error?: string;
}

export interface DatabaseIntegrationStateInput {
  schoolProfile: any;
  cpElements: any[];
  tujuanPembelajaran: any[];
  rpe: any;
  prota: any[];
  promes: any[];
  modulAjarList: any[];
  lkpdList: any[];
  students: any[];
  kaldikEvents: any[];
}

export function validateSupabaseCredentials(url: string, anonKey: string): SupabaseValidationResult {
  const trimmedUrl = (url || '').trim();
  const trimmedKey = (anonKey || '').trim();

  if (!trimmedUrl) {
    return { valid: false, error: 'Project URL Supabase wajib diisi.' };
  }

  try {
    const parsed = new URL(trimmedUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return { valid: false, error: 'URL Supabase harus diawali dengan https://.' };
    }
  } catch {
    return { valid: false, error: 'Format Project URL Supabase tidak valid (contoh: https://xxx.supabase.co).' };
  }

  if (!trimmedKey || trimmedKey.length < 20) {
    return { valid: false, error: 'Anon / Public Key Supabase wajib diisi (minimal 20 karakter).' };
  }

  return { valid: true };
}

export function estimateJsonBytes(value: unknown): number {
  try {
    const str = JSON.stringify(value ?? null);
    return new TextEncoder().encode(str).length;
  } catch {
    return 0;
  }
}

export function formatBytesToKb(bytes: number): string {
  if (bytes <= 0) return '0.0 KB';
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function buildDatabaseEntityInventory(
  state: DatabaseIntegrationStateInput,
  localStorageKeys: string[] = []
): {
  entities: DatabaseEntityRecordSummary[];
  totalRecords: number;
  totalBytes: number;
  totalKb: string;
} {
  const rpeMonthsCount =
    (state.rpe?.semester1?.months?.length || 0) + (state.rpe?.semester2?.months?.length || 0);

  const hasKey = (suffix: string) =>
    localStorageKeys.some((k) => k.endsWith(suffix));

  const rawItems: Omit<DatabaseEntityRecordSummary, 'estimatedBytes' | 'estimatedKb'>[] = [
    {
      key: 'schoolProfile',
      tableColumn: 'school_profile',
      label: 'Identitas Satuan & Guru',
      recordCount: state.schoolProfile ? 1 : 0,
      unitLabel: 'Profil',
      syncedToLocal: hasKey('_profile'),
      previewSample: state.schoolProfile,
    },
    {
      key: 'cpElements',
      tableColumn: 'cp_elements',
      label: 'Elemen Capaian Pembelajaran',
      recordCount: state.cpElements?.length || 0,
      unitLabel: 'Elemen',
      syncedToLocal: hasKey('_cp_elements'),
      previewSample: state.cpElements,
    },
    {
      key: 'tujuanPembelajaran',
      tableColumn: 'tujuan_pembelajaran',
      label: 'Tujuan Pembelajaran & ATP',
      recordCount: state.tujuanPembelajaran?.length || 0,
      unitLabel: 'TP',
      syncedToLocal: hasKey('_tp'),
      previewSample: state.tujuanPembelajaran,
    },
    {
      key: 'rpe',
      tableColumn: 'rpe',
      label: 'Rincian Pekan Efektif (RPE)',
      recordCount: rpeMonthsCount,
      unitLabel: 'Bulan',
      syncedToLocal: hasKey('_rpe'),
      previewSample: state.rpe,
    },
    {
      key: 'prota',
      tableColumn: 'prota',
      label: 'Program Tahunan (PROTA)',
      recordCount: state.prota?.length || 0,
      unitLabel: 'Bab',
      syncedToLocal: hasKey('_prota'),
      previewSample: state.prota,
    },
    {
      key: 'promes',
      tableColumn: 'promes',
      label: 'Program Semester (PROMES)',
      recordCount: state.promes?.length || 0,
      unitLabel: 'Baris',
      syncedToLocal: hasKey('_promes'),
      previewSample: state.promes,
    },
    {
      key: 'modulAjarList',
      tableColumn: 'modul_ajar',
      label: 'Modul Ajar Deep Learning',
      recordCount: state.modulAjarList?.length || 0,
      unitLabel: 'Modul',
      syncedToLocal: hasKey('_modul'),
      previewSample: state.modulAjarList,
    },
    {
      key: 'lkpdList',
      tableColumn: 'lkpd',
      label: 'Lembar Kerja Siswa (LKPD)',
      recordCount: state.lkpdList?.length || 0,
      unitLabel: 'LKPD',
      syncedToLocal: hasKey('_lkpd'),
      previewSample: state.lkpdList,
    },
    {
      key: 'students',
      tableColumn: 'students',
      label: 'Data Siswa & Asesmen Rapor',
      recordCount: state.students?.length || 0,
      unitLabel: 'Siswa',
      syncedToLocal: hasKey('_students'),
      previewSample: state.students,
    },
    {
      key: 'kaldikEvents',
      tableColumn: 'kaldik',
      label: 'Kalender Pendidikan (Kaldik)',
      recordCount: state.kaldikEvents?.length || 0,
      unitLabel: 'Agenda',
      syncedToLocal: hasKey('_kaldik'),
      previewSample: state.kaldikEvents,
    },
  ];

  let totalRecords = 0;
  let totalBytes = 0;

  const entities: DatabaseEntityRecordSummary[] = rawItems.map((item) => {
    const bytes = estimateJsonBytes(item.previewSample);
    totalRecords += item.recordCount;
    totalBytes += bytes;
    return {
      ...item,
      estimatedBytes: bytes,
      estimatedKb: formatBytesToKb(bytes),
    };
  });

  return {
    entities,
    totalRecords,
    totalBytes,
    totalKb: formatBytesToKb(totalBytes),
  };
}

export const SUPABASE_CURRICULUM_SQL_SCHEMA = `-- SQL Table Schema untuk Supabase (tabel curriculum_documents)
create table if not exists curriculum_documents (
  id text primary key,
  user_email text,
  teacher_name text,
  school_profile jsonb,
  cp_elements jsonb,
  tujuan_pembelajaran jsonb,
  rpe jsonb,
  prota jsonb,
  promes jsonb,
  modul_ajar jsonb,
  lkpd jsonb,
  students jsonb,
  kaldik jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table curriculum_documents enable row level security;

create policy "Allow public access or authenticated teacher"
  on curriculum_documents for all
  using (true)
  with check (true);`;

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateSupabaseCredentials } from '../utils/databaseIntegrationLogic';

const SUPABASE_URL_KEY = 'ADM_GURU_SUPABASE_URL';
const SUPABASE_KEY_KEY = 'ADM_GURU_SUPABASE_KEY';
const SUPABASE_LAST_SYNC_KEY = 'ADM_GURU_SUPABASE_LAST_SYNC';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  return {
    url: localStorage.getItem(SUPABASE_URL_KEY) || envUrl,
    anonKey: localStorage.getItem(SUPABASE_KEY_KEY) || envKey,
  };
};

export const getSupabaseLastSyncAt = (): string | null => {
  return localStorage.getItem(SUPABASE_LAST_SYNC_KEY);
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getStoredSupabaseConfig();
  return validateSupabaseCredentials(url, anonKey).valid;
};

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export const saveSupabaseConfig = (config: SupabaseConfig) => {
  localStorage.setItem(SUPABASE_URL_KEY, config.url.trim());
  localStorage.setItem(SUPABASE_KEY_KEY, config.anonKey.trim());
  cachedClient = null;
  cachedUrl = '';
  cachedKey = '';
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem(SUPABASE_URL_KEY);
  localStorage.removeItem(SUPABASE_KEY_KEY);
  localStorage.removeItem(SUPABASE_LAST_SYNC_KEY);
  cachedClient = null;
  cachedUrl = '';
  cachedKey = '';
};

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, anonKey } = getStoredSupabaseConfig();
  const validation = validateSupabaseCredentials(url, anonKey);
  if (!validation.valid) return null;

  if (cachedClient && cachedUrl === url && cachedKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedUrl = url;
    cachedKey = anonKey;
    return cachedClient;
  } catch (e) {
    console.error('Failed to create Supabase client:', e);
    return null;
  }
};

export const testSupabaseConnection = async (
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> => {
  const validation = validateSupabaseCredentials(url, anonKey);
  if (!validation.valid) {
    return { success: false, message: validation.error || 'Konfigurasi Supabase tidak valid.' };
  }

  try {
    const tempClient = createClient(url.trim(), anonKey.trim());
    const { error } = await tempClient.from('curriculum_documents').select('id').limit(1);
    if (error) {
      if (
        error.code === 'PGRST116' ||
        error.message.includes('does not exist') ||
        error.code === '42P01' ||
        error.message.includes('Could not find the table')
      ) {
        return {
          success: true,
          message:
            'Koneksi ke proyek Supabase berhasil! (Catatan: Jalankan skrip SQL di tab SQL Schema untuk membuat tabel curriculum_documents).',
        };
      }
      return { success: false, message: `Gagal terhubung: ${error.message}` };
    }
    return {
      success: true,
      message: 'Koneksi ke Supabase dan tabel curriculum_documents berhasil terhubung!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Koneksi gagal: ${err.message || 'Periksa kembali URL dan Anon Key Anda.'}`,
    };
  }
};

export const syncStateToSupabase = async (appState: {
  schoolProfile: any;
  cpElements?: any[];
  tujuanPembelajaran: any[];
  rpe: any;
  prota: any[];
  promes: any[];
  modulAjarList: any[];
  lkpdList: any[];
  students: any[];
  kaldikEvents: any[];
}): Promise<{ success: boolean; message: string; syncedAt?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return {
      success: false,
      message: 'Klien Supabase belum dikonfigurasi. Masukkan URL & Key terlebih dahulu.',
    };
  }

  try {
    const nowIso = new Date().toISOString();
    const payload = {
      id: 'main-curriculum-state',
      user_email: appState.schoolProfile?.email || 'arifinnanang8@gmail.com',
      teacher_name: appState.schoolProfile?.teacherName || 'NANANG ARIFIN',
      school_profile: appState.schoolProfile,
      cp_elements: appState.cpElements || [],
      tujuan_pembelajaran: appState.tujuanPembelajaran,
      rpe: appState.rpe,
      prota: appState.prota,
      promes: appState.promes,
      modul_ajar: appState.modulAjarList,
      lkpd: appState.lkpdList,
      students: appState.students,
      kaldik: appState.kaldikEvents,
      updated_at: nowIso,
    };

    const { error } = await client.from('curriculum_documents').upsert(payload);
    if (error) {
      return { success: false, message: `Gagal menyimpan ke Supabase: ${error.message}` };
    }
    const displayTime = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    localStorage.setItem(SUPABASE_LAST_SYNC_KEY, displayTime);
    return {
      success: true,
      syncedAt: displayTime,
      message: 'Data administrasi berhasil disinkronkan ke Supabase cloud database!',
    };
  } catch (err: any) {
    return { success: false, message: `Kesalahan sinkronisasi: ${err.message}` };
  }
};

export const fetchStateFromSupabase = async (): Promise<{
  success: boolean;
  data?: any;
  message: string;
}> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Klien Supabase belum dikonfigurasi.' };
  }

  try {
    const { data, error } = await client
      .from('curriculum_documents')
      .select('*')
      .eq('id', 'main-curriculum-state')
      .single();

    if (error) {
      return { success: false, message: `Gagal memuat dari Supabase: ${error.message}` };
    }

    if (!data) {
      return { success: false, message: 'Belum ada data tersimpan di Supabase.' };
    }

    const displayTime = new Date().toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    localStorage.setItem(SUPABASE_LAST_SYNC_KEY, displayTime);

    return {
      success: true,
      data: {
        schoolProfile: data.school_profile,
        cpElements: data.cp_elements,
        tujuanPembelajaran: data.tujuan_pembelajaran,
        rpe: data.rpe,
        prota: data.prota,
        promes: data.promes,
        modulAjarList: data.modul_ajar,
        lkpdList: data.lkpd,
        students: data.students,
        kaldikEvents: data.kaldik,
      },
      message: 'Seluruh data perangkat ajar berhasil ditarik dari Supabase cloud!',
    };
  } catch (err: any) {
    return { success: false, message: `Kesalahan penarikan data: ${err.message}` };
  }
};

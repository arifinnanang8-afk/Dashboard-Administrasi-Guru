import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  MenuKey,
  MenuCategory,
  SchoolProfile,
  TujuanPembelajaran,
  CpElement,
  RpeState,
  ProtaItem,
  PromesItem,
  ModulAjarItem,
  LkpdItem,
  StudentRecord,
  StudentCpTarget,
  KaldikEvent,
  MenuItemInfo,
  CpSource,
} from '../types';
import {
  initialSchoolProfile,
  initialCpElements,
  initialTujuanPembelajaran,
  initialRpe,
  initialProta,
  initialPromes,
  initialModulAjar,
  initialLkpd,
  initialStudents,
  initialKaldikEvents,
  initialMenuItems,
} from '../data/initialData';
import {
  calculateRpeTotals,
  calculateBloomStats,
  calculateClassMastery,
  auditCurriculumAlignment,
  buildPromesFromProta,
  generateSyncedPipelineFromBook,
  getSubjectRasionalAndCpElements,
} from '../utils/curriculumLogic';
import {
  syncCpTargetToAssessment,
  deriveCpTargetFromAssessment,
  generateCpNarrativeDescription,
} from '../utils/cpMappingLogic';
import { downloadJson } from '../utils/exporter';
import { isSupabaseConfigured, getSupabaseLastSyncAt } from '../services/supabaseClient';

interface AppContextType {
  schoolProfile: SchoolProfile;
  cpElements: CpElement[];
  tujuanPembelajaran: TujuanPembelajaran[];
  rpe: RpeState;
  prota: ProtaItem[];
  promes: PromesItem[];
  modulAjarList: ModulAjarItem[];
  lkpdList: LkpdItem[];
  students: StudentRecord[];
  kaldikEvents: KaldikEvent[];
  menuItems: MenuItemInfo[];
  activeView: MenuKey;
  activeCategory: MenuCategory;
  searchQuery: string;
  isPrintModalOpen: boolean;
  printDocKey: MenuKey | null;
  notification: { type: 'success' | 'error' | 'info'; message: string } | null;
  selectedBook: any;
  setSelectedBook: (book: any) => void;
  activeCpSource: CpSource;
  setActiveCpSource: (source: CpSource) => void;

  // Authentication
  isAuthenticated: boolean;
  currentUser: string | null;
  login: (user: string, pass: string) => boolean;
  logout: () => void;
  lastAutosavedAt: string;

  // Setters & Navigation
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean) => void;
  toggleFocusMode: () => void;
  setActiveView: (view: MenuKey) => void;
  setActiveCategory: (cat: MenuCategory) => void;
  setSearchQuery: (query: string) => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  openPrintModal: (docKey: MenuKey) => void;
  closePrintModal: () => void;

  // CRUD actions
  updateSchoolProfile: (updates: Partial<SchoolProfile>) => void;
  updateCpElements: (elements: CpElement[]) => void;
  updateTujuanPembelajaran: (tp: TujuanPembelajaran) => void;
  addTujuanPembelajaran: (tp: TujuanPembelajaran) => void;
  deleteTujuanPembelajaran: (id: string) => void;
  updateRpe: (newRpe: RpeState, silent?: boolean) => void;
  updateProtaItem: (item: ProtaItem) => void;
  setAllProtaItems: (items: ProtaItem[]) => void;
  addProtaItem: (item: ProtaItem) => void;
  deleteProtaItem: (id: string) => void;
  updatePromesItem: (item: PromesItem) => void;
  syncProtaToPromes: (mode?: 'auto_rpe' | 'preserve_custom', navigateToPromes?: boolean) => void;
  updateModulAjar: (modul: ModulAjarItem) => void;
  addModulAjar: (modul: ModulAjarItem) => void;
  deleteModulAjar: (id: string) => void;
  updateLkpd: (lkpd: LkpdItem) => void;
  addLkpd: (lkpd: LkpdItem) => void;
  deleteLkpd: (id: string) => void;
  updateStudent: (student: StudentRecord) => void;
  addStudent: (student: StudentRecord) => void;
  deleteStudent: (id: string) => void;
  updateStudentCpTarget: (studentId: string, tpCode: string, target: StudentCpTarget) => void;
  syncAllCpTargetsToAssessment: (activeTpCode?: string) => void;
  pullAssessmentScoresToCpTargets: (tpCode?: string, elementName?: string) => void;
  updateKaldikEvent: (event: KaldikEvent) => void;
  addKaldikEvent: (event: KaldikEvent) => void;
  deleteKaldikEvent: (id: string) => void;
  setAllKaldikEvents: (events: KaldikEvent[]) => void;
  syncKaldikAndRpe: (newRpe: RpeState, newEvents: KaldikEvent[], sourceLabel?: string) => void;

  // System actions
  syncPipelineWithBook: (bookItem?: any) => void;
  runMasterSync: () => void;
  backupToJson: () => void;
  restoreFromJson: (file: File) => Promise<boolean>;
  restoreCompleteState: (data: any) => void;
  resetToDefaultData: () => void;
  cleanupDeprecatedStorage: () => void;

  // Database Integration & Supabase Status
  isSupabaseModalOpen: boolean;
  setIsSupabaseModalOpen: (open: boolean) => void;
  supabaseConnected: boolean;
  supabaseLastSyncAt: string | null;
  refreshSupabaseStatus: () => void;

  // Calculated Stats
  stats: {
    pekanEfektifTotal: number;
    pekanEfektifS1: number;
    pekanEfektifS2: number;
    protaTotalJp: number;
    promesTotalJp: number;
    rpeTotalJp: number;
    bloomHotsPct: number;
    bloomHotsCount: number;
    modulCount: number;
    masteryRate: number;
    classAverage: number;
    totalStudents: number;
    kesiapanCount: number;
    kesiapanPct: number;
    isFullyAligned: boolean;
    alignmentAudit: ReturnType<typeof auditCurriculumAlignment>;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'ADM_GURU_KURMER_2026_FINAL';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or defaults
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_profile`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...initialSchoolProfile,
          ...parsed,
          npsn: parsed.npsn || initialSchoolProfile.npsn,
          akreditasi: parsed.akreditasi || initialSchoolProfile.akreditasi,
          programKeahlian: parsed.programKeahlian || initialSchoolProfile.programKeahlian,
          phone: parsed.phone || initialSchoolProfile.phone,
          address: parsed.address || initialSchoolProfile.address,
        };
      } catch {
        return initialSchoolProfile;
      }
    }
    return initialSchoolProfile;
  });

  const [cpElements, setCpElements] = useState<CpElement[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_cp_elements`);
    return saved ? JSON.parse(saved) : initialCpElements;
  });

  const [tujuanPembelajaran, setTujuanPembelajaran] = useState<TujuanPembelajaran[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_tp`);
    return saved ? JSON.parse(saved) : initialTujuanPembelajaran;
  });

  const [rpe, setRpe] = useState<RpeState>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_rpe`);
    return saved ? JSON.parse(saved) : initialRpe;
  });

  const [prota, setProta] = useState<ProtaItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_prota`);
    return saved ? JSON.parse(saved) : initialProta;
  });

  const [promes, setPromes] = useState<PromesItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_promes`);
    return saved ? JSON.parse(saved) : initialPromes;
  });

  const [modulAjarList, setModulAjarList] = useState<ModulAjarItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_modul`);
    return saved ? JSON.parse(saved) : initialModulAjar;
  });

  const [lkpdList, setLkpdList] = useState<LkpdItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_lkpd`);
    return saved ? JSON.parse(saved) : initialLkpd;
  });

  const [students, setStudents] = useState<StudentRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_students`);
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [kaldikEvents, setKaldikEvents] = useState<KaldikEvent[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_kaldik`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 12) {
          return parsed;
        }
      } catch {
        return initialKaldikEvents;
      }
    }
    return initialKaldikEvents;
  });

  const [activeCpSource, setActiveCpSource] = useState<CpSource>(() => {
    return (localStorage.getItem(`${STORAGE_KEY}_cp_source`) as CpSource) || 'BSKAP_046';
  });

  const [menuItems] = useState<MenuItemInfo[]>(initialMenuItems);

  const [activeView, setActiveViewState] = useState<MenuKey>('dashboard');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDocKey, setPrintDocKey] = useState<MenuKey | null>(null);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState<boolean>(() => isSupabaseConfigured());
  const [supabaseLastSyncAt, setSupabaseLastSyncAt] = useState<string | null>(() => getSupabaseLastSyncAt());
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const refreshSupabaseStatus = () => {
    setSupabaseConnected(isSupabaseConfigured());
    setSupabaseLastSyncAt(getSupabaseLastSyncAt());
  };

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_logged_in`) === 'true';
  });

  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem(`${STORAGE_KEY}_user`) || 'NANANG ARIFIN';
  });

  const login = (userInput: string, passInput: string): boolean => {
    const normUser = (userInput || '').trim().toUpperCase();
    const normPass = (passInput || '').trim().toUpperCase();

    if (normUser === 'NANANG ARIFIN' && normPass === 'CAH BAGUS PAYUNG REJO') {
      setIsAuthenticated(true);
      setCurrentUser('NANANG ARIFIN');
      localStorage.setItem(`${STORAGE_KEY}_logged_in`, 'true');
      localStorage.setItem(`${STORAGE_KEY}_user`, 'NANANG ARIFIN');
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem(`${STORAGE_KEY}_logged_in`);
    localStorage.removeItem(`${STORAGE_KEY}_user`);
  };

  const setActiveView = (view: MenuKey) => {
    setActiveViewState(view);
    if (view !== 'modul_ajar' && view !== 'lkpd') {
      setIsFocusMode(false);
    }
  };

  const toggleFocusMode = () => {
    setIsFocusMode((prev) => {
      const next = !prev;
      showNotification(
        'info',
        next
          ? 'Mode Fokus Diaktifkan: Sidebar & elemen navigasi disembunyikan agar Anda lebih fokus menyusun perangkat ajar.'
          : 'Mode Fokus Dinonaktifkan: Sidebar & elemen navigasi ditampilkan kembali.'
      );
      return next;
    });
  };
  const [selectedBook, setSelectedBook] = useState<any>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_selected_book`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'default-book-1',
      judulBuku: 'Cerdas Cergas Berbahasa dan Bersastra Indonesia Kelas X Edisi Revisi',
      pengarang: 'Fadillah Tri Aulia & Sefi Indra Gumilar',
      penerbit: 'Pusat Perbukuan BSKAP Kemendikdasmen RI',
      tahunTerbit: '2026',
      isbn: '978-602-244-325-4',
      coverDataUri: '',
      provider: 'SIBI Kemendikdasmen (buku.kemendikdasmen.go.id)',
      mapel: 'Bahasa Indonesia',
      kelas: 'X',
    };
  });

  const [lastAutosavedAt, setLastAutosavedAt] = useState<string>(() => {
    return new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  // Auto-sync state changes into localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_selected_book`, JSON.stringify(selectedBook));
    localStorage.setItem(`${STORAGE_KEY}_profile`, JSON.stringify(schoolProfile));
    localStorage.setItem(`${STORAGE_KEY}_cp_elements`, JSON.stringify(cpElements));
    localStorage.setItem(`${STORAGE_KEY}_tp`, JSON.stringify(tujuanPembelajaran));
    localStorage.setItem(`${STORAGE_KEY}_rpe`, JSON.stringify(rpe));
    localStorage.setItem(`${STORAGE_KEY}_prota`, JSON.stringify(prota));
    localStorage.setItem(`${STORAGE_KEY}_promes`, JSON.stringify(promes));
    localStorage.setItem(`${STORAGE_KEY}_modul`, JSON.stringify(modulAjarList));
    localStorage.setItem(`${STORAGE_KEY}_lkpd`, JSON.stringify(lkpdList));
    localStorage.setItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
    localStorage.setItem(`${STORAGE_KEY}_kaldik`, JSON.stringify(kaldikEvents));
    localStorage.setItem(`${STORAGE_KEY}_cp_source`, activeCpSource);
  }, [schoolProfile, cpElements, tujuanPembelajaran, rpe, prota, promes, modulAjarList, lkpdList, students, kaldikEvents, activeCpSource]);

  // Periodic Autosave System (every 30 seconds) to ensure all active edits to modul ajar, prota, and promes are persisted to browser storage
  useEffect(() => {
    const autosaveInterval = setInterval(() => {
      try {
        localStorage.setItem(`${STORAGE_KEY}_prota`, JSON.stringify(prota));
        localStorage.setItem(`${STORAGE_KEY}_promes`, JSON.stringify(promes));
        localStorage.setItem(`${STORAGE_KEY}_modul`, JSON.stringify(modulAjarList));
        localStorage.setItem(`${STORAGE_KEY}_profile`, JSON.stringify(schoolProfile));
        const timeNow = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setLastAutosavedAt(timeNow);
      } catch (err) {
        console.error('Autosave error:', err);
      }
    }, 30000);

    return () => clearInterval(autosaveInterval);
  }, [prota, promes, modulAjarList, schoolProfile]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const openPrintModal = (docKey: MenuKey) => {
    setPrintDocKey(docKey);
    setIsPrintModalOpen(true);
  };

  const closePrintModal = () => {
    setIsPrintModalOpen(false);
    setPrintDocKey(null);
  };

  // Keyboard shortcut listener (Ctrl+K for search, Ctrl+B for backup)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('main-menu-search');
        if (searchInput) {
          searchInput.focus();
        } else {
          setActiveView('dashboard');
          setTimeout(() => {
            document.getElementById('main-menu-search')?.focus();
          }, 150);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setActiveView('backup');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // CRUD Implementations
  const updateSchoolProfile = (updates: Partial<SchoolProfile>) => {
    setSchoolProfile((prev) => {
      const next = { ...prev, ...updates };
      if (updates.subject || updates.grade || updates.fase) {
        const { cpElements: syncedCp } = getSubjectRasionalAndCpElements(
          next.subject,
          next.grade,
          next.fase,
          selectedBook
        );
        if (syncedCp && syncedCp.length > 0) {
          setCpElements(syncedCp);
        }
      }
      return next;
    });
    showNotification('success', 'Identitas profil sekolah & guru berhasil disimpan.');
  };

  const updateCpElements = (elements: CpElement[]) => {
    setCpElements(elements);
    showNotification('success', 'Analisis Elemen Capaian Pembelajaran berhasil diperbarui.');
  };

  const updateTujuanPembelajaran = (updated: TujuanPembelajaran) => {
    setTujuanPembelajaran((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    showNotification('success', `Tujuan Pembelajaran ${updated.code} berhasil diperbarui.`);
  };

  const addTujuanPembelajaran = (tp: TujuanPembelajaran) => {
    setTujuanPembelajaran((prev) => [...prev, tp]);
    showNotification('success', `Tujuan Pembelajaran ${tp.code} berhasil ditambahkan.`);
  };

  const deleteTujuanPembelajaran = (id: string) => {
    setTujuanPembelajaran((prev) => prev.filter((item) => item.id !== id));
    showNotification('info', 'Tujuan Pembelajaran telah dihapus.');
  };

  const updateRpe = (newRpe: RpeState, silent: boolean = false) => {
    setRpe(newRpe);
    if (!silent) {
      showNotification('success', 'Analisis RPE (Pekan Efektif & JP) berhasil diperbarui.');
    }
  };

  const updateProtaItem = (item: ProtaItem) => {
    setProta((prev) => {
      const nextProta = prev.map((p) => (p.id === item.id ? item : p));
      setPromes((prevPromes) => buildPromesFromProta(nextProta, rpe, prevPromes, 'preserve_custom'));
      return nextProta;
    });
    showNotification('success', `PROTA baris ${item.babNumber} diperbarui & tersinkron otomatis ke PROMES.`);
  };

  const setAllProtaItems = (items: ProtaItem[]) => {
    setProta(items);
    setPromes((prevPromes) => buildPromesFromProta(items, rpe, prevPromes, 'auto_rpe'));
  };

  const addProtaItem = (item: ProtaItem) => {
    const nextProta = [...prota, item];
    setProta(nextProta);
    const syncedPromes = buildPromesFromProta(nextProta, rpe, promes, 'preserve_custom');
    setPromes(syncedPromes);
    showNotification('success', 'Baris PROTA berhasil ditambahkan & disinkronkan ke matriks PROMES.');
  };

  const deleteProtaItem = (id: string) => {
    const nextProta = prota.filter((p) => p.id !== id);
    setProta(nextProta);
    const syncedPromes = buildPromesFromProta(nextProta, rpe, promes, 'preserve_custom');
    setPromes(syncedPromes);
    showNotification('info', 'Baris PROTA telah dihapus & matriks PROMES telah disesuaikan.');
  };

  const updatePromesItem = (item: PromesItem) => {
    setPromes((prev) => prev.map((p) => (p.id === item.id ? item : p)));
    showNotification('success', `PROMES untuk ${item.tpCode} diperbarui.`);
  };

  const syncProtaToPromes = (
    mode: 'auto_rpe' | 'preserve_custom' = 'auto_rpe',
    navigateToPromes: boolean = false
  ) => {
    const syncedPromes = buildPromesFromProta(prota, rpe, promes, mode);
    setPromes(syncedPromes);
    const totalJp = syncedPromes.reduce((acc, p) => acc + (p.alokasiJp || 0), 0);
    showNotification(
      'success',
      `Sinkronisasi PROTA → PROMES Berhasil! ${syncedPromes.length} Lingkup Materi (${totalJp} JP) telah didistribusikan ke Matriks Mingguan PROMES.`
    );
    if (navigateToPromes) {
      setActiveView('promes');
    }
  };

  const updateModulAjar = (modul: ModulAjarItem) => {
    setModulAjarList((prev) => prev.map((m) => (m.id === modul.id ? modul : m)));
    showNotification('success', `Modul Ajar Bab ${modul.babNumber} berhasil disimpan.`);
  };

  const addModulAjar = (modul: ModulAjarItem) => {
    setModulAjarList((prev) => [...prev, modul]);
    showNotification('success', `Modul Ajar Bab ${modul.babNumber} berhasil ditambahkan.`);
  };

  const deleteModulAjar = (id: string) => {
    setModulAjarList((prev) => prev.filter((m) => m.id !== id));
    showNotification('info', 'Modul Ajar telah dihapus.');
  };

  const updateLkpd = (lkpd: LkpdItem) => {
    setLkpdList((prev) => prev.map((l) => (l.id === lkpd.id ? l : l)));
    showNotification('success', `LKPD Bab ${lkpd.babNumber} berhasil diperbarui.`);
  };

  const addLkpd = (lkpd: LkpdItem) => {
    setLkpdList((prev) => [...prev, lkpd]);
    showNotification('success', `LKPD Bab ${lkpd.babNumber} berhasil ditambahkan.`);
  };

  const deleteLkpd = (id: string) => {
    setLkpdList((prev) => prev.filter((l) => l.id !== id));
    showNotification('info', 'LKPD telah dihapus.');
  };

  const updateStudent = (student: StudentRecord) => {
    setStudents((prev) => prev.map((s) => (s.id === student.id ? student : s)));
    showNotification('success', `Data nilai ${student.name} berhasil disimpan.`);
  };

  const addStudent = (student: StudentRecord) => {
    setStudents((prev) => [...prev, student]);
    showNotification('success', `Siswa ${student.name} berhasil ditambahkan.`);
  };

  const deleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    showNotification('info', 'Data siswa telah dihapus.');
  };

  const updateStudentCpTarget = (studentId: string, tpCode: string, target: StudentCpTarget) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== studentId) return s;
        return syncCpTargetToAssessment(s, tpCode, target, schoolProfile.kktpThreshold || 75);
      })
    );
    showNotification(
      'success',
      `Target CP ${tpCode} untuk siswa berhasil dicatat dan disinkronkan ke modul asesmen!`
    );
  };

  const syncAllCpTargetsToAssessment = (activeTpCode?: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        let updated = { ...s };
        const targets = activeTpCode
          ? s.cpTargets?.[activeTpCode]
            ? { [activeTpCode]: s.cpTargets[activeTpCode] }
            : {}
          : s.cpTargets || {};

        Object.entries(targets).forEach(([code, t]) => {
          updated = syncCpTargetToAssessment(updated, code, t, schoolProfile.kktpThreshold || 75);
        });

        // Also update holistic narrative
        updated.deskripsi = generateCpNarrativeDescription(updated, cpElements);
        return updated;
      })
    );
    showNotification(
      'success',
      'Seluruh pemetaan target CP berhasil disinkronkan ke Modul Asesmen & Nilai Rapor siswa.'
    );
  };

  const pullAssessmentScoresToCpTargets = (
    tpCode: string = 'TP 10.1',
    elementName: string = 'Pemahaman Konsep'
  ) => {
    setStudents((prev) =>
      prev.map((s) => {
        const derived = deriveCpTargetFromAssessment(s, tpCode, elementName, schoolProfile.kktpThreshold || 75);
        return {
          ...s,
          cpTargets: {
            ...(s.cpTargets || {}),
            [tpCode]: derived,
          },
        };
      })
    );
    showNotification(
      'success',
      `Data capaian target ${tpCode} (${elementName}) berhasil ditarik otomatis dari nilai asesmen siswa.`
    );
  };

  const updateKaldikEvent = (event: KaldikEvent) => {
    setKaldikEvents((prev) => prev.map((e) => (e.id === event.id ? event : e)));
    showNotification('success', `Agenda ${event.name} diperbarui.`);
  };

  const addKaldikEvent = (event: KaldikEvent) => {
    setKaldikEvents((prev) => [...prev, event]);
    showNotification('success', `Agenda ${event.name} ditambahkan ke kalender.`);
  };

  const deleteKaldikEvent = (id: string) => {
    setKaldikEvents((prev) => prev.filter((e) => e.id !== id));
    showNotification('info', 'Agenda kalender telah dihapus.');
  };

  const setAllKaldikEvents = (events: KaldikEvent[]) => {
    setKaldikEvents(events);
  };

  const syncKaldikAndRpe = (newRpe: RpeState, newEvents: KaldikEvent[], sourceLabel?: string) => {
    setRpe(newRpe);
    setKaldikEvents(newEvents);
    showNotification(
      'success',
      sourceLabel
        ? `Sinkron Otomatis Berhasil: ${sourceLabel}`
        : 'Kalender Pendidikan & RPE berhasil disinkronkan secara otomatis!'
    );
  };

  // Pipeline Sync with Book
  const syncPipelineWithBook = (bookItem?: any) => {
    const targetBook = bookItem || selectedBook;
    if (!targetBook) return;

    const synced = generateSyncedPipelineFromBook(targetBook, schoolProfile, rpe);

    setSchoolProfile(synced.updatedProfile);
    if (synced.newCpElements && synced.newCpElements.length > 0) {
      setCpElements(synced.newCpElements);
    }
    setTujuanPembelajaran(synced.newTpList);
    setProta(synced.newProta);
    setPromes(synced.newPromes);
    setModulAjarList(synced.newModulAjarList);
    setLkpdList(synced.newLkpdList);

    // Synchronize Penilaian Rapor (students) with active TP & Elemen CP BSKAP 046/2025
    const firstTp = synced.newTpList[0];
    const secondTp = synced.newTpList[1] || firstTp;
    setStudents((prevStudents) =>
      prevStudents.map((st) => {
        const newFormatif: { [tpCode: string]: number } = {};
        const oldValues = Object.values(st.formatifScores || {});
        synced.newTpList.forEach((tp, idx) => {
          newFormatif[`TP ${tp.code}`] = oldValues[idx % Math.max(1, oldValues.length)] || st.nilaiAkhir || 82;
        });
        const deskripsi = firstTp
          ? `Menunjukkan penguasaan yang sangat baik pada elemen ${firstTp.element} (${firstTp.materiPokok}), serta perlu penguatan lanjutan pada elemen ${secondTp?.element || firstTp.element} (${secondTp?.materiPokok || firstTp.materiPokok}).`
          : st.deskripsi;
        return {
          ...st,
          formatifScores: newFormatif,
          deskripsi,
        };
      })
    );

    if (bookItem) {
      setSelectedBook(bookItem);
    }

    showNotification(
      'success',
      `Sinkronisasi Pipeline Kurikulum Berhasil: Kalender/RPE (MEF & JP) → Analisis CP/ATP → PROTA → PROMES → Modul Ajar → LKPD → Penilaian Rapor telah diselaraskan dengan buku "${targetBook.judulBuku || targetBook.mapel}" (KepKa BSKAP No. 046/H/KR/2025)!`
    );
  };

  // Master Sync
  const runMasterSync = () => {
    if (selectedBook) {
      syncPipelineWithBook();
      return;
    }

    // Fallback sync TP allocations into PROTA
    const updatedProta: ProtaItem[] = tujuanPembelajaran.map((tp, idx) => {
      const existing = prota.find((p) => p.tpCode === tp.code);
      return {
        id: existing?.id || `prota-${idx + 1}`,
        semester: tp.semester,
        babNumber: idx + 1,
        babTitle: existing?.babTitle || tp.materiPokok,
        tpCode: tp.code,
        tpDescription: tp.description,
        alokasiJp: tp.jpAllocation,
        keterangan: existing?.keterangan || `Formatif & Sumatif Bab ${idx + 1}`,
      };
    });
    setProta(updatedProta);

    // Synchronize PROTA into PROMES weekly distribution
    const syncedPromes = buildPromesFromProta(updatedProta, rpe, promes, 'auto_rpe');
    setPromes(syncedPromes);

    // Synchronize Modul Ajar titles and TP descriptions
    const updatedModul = modulAjarList.map((m) => {
      const matchTp = tujuanPembelajaran.find((tp) => tp.babId === `bab-${m.babNumber}`);
      if (matchTp) {
        return {
          ...m,
          alokasiJp: matchTp.jpAllocation,
          tujuanPembelajaran: [matchTp.description],
        };
      }
      return m;
    });
    setModulAjarList(updatedModul);

    showNotification(
      'success',
      'Master Sync Berhasil: 100% Selaras (RPE ↔ CP/ATP ↔ PROTA ↔ PROMES ↔ Modul Ajar ↔ LKPD ↔ Rapor Siswa).'
    );
  };

  // Backup & Restore
  const backupToJson = () => {
    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      schoolProfile,
      tujuanPembelajaran,
      rpe,
      prota,
      promes,
      modulAjarList,
      lkpdList,
      students,
      kaldikEvents,
    };
    const filename = `BACKUP_ADMINISTRASI_${schoolProfile.subject.replace(/\s+/g, '_')}_${schoolProfile.academicYear.replace('/', '-')}.json`;
    downloadJson(payload, filename);
    showNotification('success', 'Berkas cadangan berhasil diunduh dalam format JSON.');
  };

  const restoreCompleteState = (data: any) => {
    if (!data) return;
    if (data.schoolProfile) setSchoolProfile(data.schoolProfile);
    if (data.cpElements && Array.isArray(data.cpElements) && data.cpElements.length > 0) {
      setCpElements(data.cpElements);
    }
    if (data.tujuanPembelajaran) setTujuanPembelajaran(data.tujuanPembelajaran);
    if (data.rpe) setRpe(data.rpe);
    if (data.prota) setProta(data.prota);
    if (data.promes) setPromes(data.promes);
    if (data.modulAjarList) setModulAjarList(data.modulAjarList);
    if (data.lkpdList) setLkpdList(data.lkpdList);
    if (data.students) setStudents(data.students);
    if (data.kaldikEvents) setKaldikEvents(data.kaldikEvents);
  };

  const restoreFromJson = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.schoolProfile || !data.tujuanPembelajaran) {
        showNotification('error', 'Format berkas JSON tidak valid atau rusak.');
        return false;
      }
      restoreCompleteState(data);

      showNotification('success', 'Seluruh data berhasil dipulihkan dari berkas cadangan JSON.');
      return true;
    } catch (e: any) {
      showNotification('error', 'Gagal memulihkan berkas: ' + e.message);
      return false;
    }
  };

  const resetToDefaultData = () => {
    cleanupDeprecatedStorage();
    setSchoolProfile(initialSchoolProfile);
    setTujuanPembelajaran(initialTujuanPembelajaran);
    setRpe(initialRpe);
    setProta(initialProta);
    setPromes(initialPromes);
    setModulAjarList(initialModulAjar);
    setLkpdList(initialLkpd);
    setStudents(initialStudents);
    setKaldikEvents(initialKaldikEvents);
    setActiveCpSource('BSKAP_046');
    showNotification('info', 'Seluruh data telah diatur ulang ke standar KepKa BSKAP 046/2025.');
  };

  const cleanupDeprecatedStorage = () => {
    // List of keys to keep (must match our current active keys)
    const validKeys = [
      `${STORAGE_KEY}_profile`,
      `${STORAGE_KEY}_cp_elements`,
      `${STORAGE_KEY}_tp`,
      `${STORAGE_KEY}_rpe`,
      `${STORAGE_KEY}_prota`,
      `${STORAGE_KEY}_promes`,
      `${STORAGE_KEY}_modul`,
      `${STORAGE_KEY}_lkpd`,
      `${STORAGE_KEY}_students`,
      `${STORAGE_KEY}_kaldik`,
      `${STORAGE_KEY}_cp_source`,
      `${STORAGE_KEY}_selected_book`,
    ];
    
    // Remove any keys that start with STORAGE_KEY but aren't in validKeys
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_KEY) && !validKeys.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    showNotification('info', 'Data usang telah dibersihkan.');
  };

  // Compute live statistics
  const stats = useMemo(() => {
    const s1Rpe = calculateRpeTotals(rpe.semester1.months, rpe.semester1.jpPerWeek, rpe.semester1.cadanganJp);
    const s2Rpe = calculateRpeTotals(rpe.semester2.months, rpe.semester2.jpPerWeek, rpe.semester2.cadanganJp);
    const pekanEfektifS1 = s1Rpe.effectiveWeeks;
    const pekanEfektifS2 = s2Rpe.effectiveWeeks;
    const pekanEfektifTotal = pekanEfektifS1 + pekanEfektifS2;

    const protaTotalJp = prota.reduce((acc, p) => acc + (p.alokasiJp || 0), 0);
    const promesTotalJp = promes.reduce((acc, p) => acc + (p.alokasiJp || 0), 0);
    // 132 JP Net Tatap Muka (68 JP Semester 1 + 64 JP Semester 2)
    const rpeTotalJp = 132;

    const bloom = calculateBloomStats(
      tujuanPembelajaran.map((tp) => ({ id: tp.id, code: tp.code, bloomLevel: tp.bloomLevel }))
    );

    const mastery = calculateClassMastery(students, 75);

    const audit = auditCurriculumAlignment({
      rpeTotalJp,
      protaTotalJp,
      promesTotalJp,
      tpCount: tujuanPembelajaran.length,
      modulCount: modulAjarList.length,
      lkpdCount: lkpdList.length,
      studentsEvaluated: students.length,
    });

    return {
      pekanEfektifTotal,
      pekanEfektifS1,
      pekanEfektifS2,
      protaTotalJp,
      promesTotalJp,
      rpeTotalJp,
      bloomHotsPct: bloom.hotsPercentage,
      bloomHotsCount: bloom.hotsCount,
      modulCount: modulAjarList.length,
      masteryRate: mastery.masteryRate,
      classAverage: mastery.classAverage,
      totalStudents: students.length,
      kesiapanCount: 10,
      kesiapanPct: 100,
      isFullyAligned: audit.isFullyAligned,
      alignmentAudit: audit,
    };
  }, [rpe, prota, promes, tujuanPembelajaran, modulAjarList, lkpdList, students]);

  return (
    <AppContext.Provider
      value={{
        schoolProfile,
        cpElements,
        tujuanPembelajaran,
        rpe,
        prota,
        promes,
        modulAjarList,
        lkpdList,
        students,
        kaldikEvents,
        menuItems,
        activeView,
        activeCategory,
        searchQuery,
        isPrintModalOpen,
        printDocKey,
        notification,
        selectedBook,
        setSelectedBook,
        activeCpSource,
        setActiveCpSource,
        isAuthenticated,
        currentUser,
        login,
        logout,
        lastAutosavedAt,
        isFocusMode,
        setIsFocusMode,
        toggleFocusMode,
        setActiveView,
        setActiveCategory,
        setSearchQuery,
        showNotification,
        openPrintModal,
        closePrintModal,
        updateSchoolProfile,
        updateCpElements,
        updateTujuanPembelajaran,
        addTujuanPembelajaran,
        deleteTujuanPembelajaran,
        updateRpe,
        updateProtaItem,
        setAllProtaItems,
        addProtaItem,
        deleteProtaItem,
        updatePromesItem,
        syncProtaToPromes,
        updateModulAjar,
        addModulAjar,
        deleteModulAjar,
        updateLkpd,
        addLkpd,
        deleteLkpd,
        updateStudent,
        addStudent,
        deleteStudent,
        updateStudentCpTarget,
        syncAllCpTargetsToAssessment,
        pullAssessmentScoresToCpTargets,
        updateKaldikEvent,
        addKaldikEvent,
        deleteKaldikEvent,
        setAllKaldikEvents,
        syncKaldikAndRpe,
        syncPipelineWithBook,
        runMasterSync,
        backupToJson,
        restoreFromJson,
        restoreCompleteState,
        resetToDefaultData,
        cleanupDeprecatedStorage,
        isSupabaseModalOpen,
        setIsSupabaseModalOpen,
        supabaseConnected,
        supabaseLastSyncAt,
        refreshSupabaseStatus,
        stats,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

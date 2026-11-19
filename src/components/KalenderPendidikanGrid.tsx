import React, { useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  Info,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { KaldikEvent } from '../types';
import {
  TeachingDayName,
  buildAcademicYearCalendarMonths,
  formatDateRangeLabelId,
  formatMonthBulletDateRange,
  getIndonesianMonthYearLabel,
} from '../utils/curriculumLogic';

interface KalenderPendidikanGridProps {
  academicYear: string;
  selectedDays: TeachingDayName[];
  kaldikEvents: KaldikEvent[];
  onAddKaldikEvent?: (event: KaldikEvent) => void;
  onUpdateKaldikEvent?: (event: KaldikEvent) => void;
  onDeleteKaldikEvent?: (id: string) => void;
  onAdaptCalendarToYear?: (nextAcademicYear: string) => void;
}

const WEEKDAY_HEADERS = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

const ACADEMIC_YEAR_OPTIONS = [
  '2025/2026',
  '2026/2027',
  '2027/2028',
  '2028/2029',
  '2029/2030',
];

const STATUS_CATEGORY_OPTIONS: { value: KaldikEvent['type']; label: string; color: string }[] = [
  { value: 'libur_semester', label: 'Libur Akhir Tahun / Semester', color: '#ec4899' },
  { value: 'libur_nasional', label: 'Libur Nasional', color: '#ef4444' },
  { value: 'kegiatan_sekolah', label: 'Hari Efektif / Kegiatan Khusus', color: '#f59e0b' },
  { value: 'sts', label: 'Asesmen Tengah Semester (STS/ATS)', color: '#f59e0b' },
  { value: 'sas', label: 'Asesmen Akhir Semester (SAS/SAT)', color: '#f59e0b' },
  { value: 'kbm', label: 'Hari Efektif KBM', color: '#10b981' },
];

export const KalenderPendidikanGrid: React.FC<KalenderPendidikanGridProps> = ({
  academicYear,
  selectedDays,
  kaldikEvents,
  onAddKaldikEvent,
  onUpdateKaldikEvent,
  onDeleteKaldikEvent,
  onAdaptCalendarToYear,
}) => {
  const [semesterFilter, setSemesterFilter] = useState<'all' | 1 | 2>('all');
  const [selectedDateInfo, setSelectedDateInfo] = useState<{
    dateStr: string;
    dayName: string;
    isTeachingDay: boolean;
    events: { id?: string; name: string; type: string }[];
  } | null>(null);

  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<KaldikEvent['type']>('kegiatan_sekolah');
  const addSectionRef = useRef<HTMLDivElement>(null);

  const [isTableAddOpen, setIsTableAddOpen] = useState(false);
  const [tableNewStart, setTableNewStart] = useState('');
  const [tableNewEnd, setTableNewEnd] = useState('');
  const [tableNewName, setTableNewName] = useState('');
  const [tableNewType, setTableNewType] = useState<KaldikEvent['type']>('kegiatan_sekolah');

  const yearParts = (academicYear || '2026/2027').split('/').map((p) => parseInt(p.trim(), 10));
  const startYear = !isNaN(yearParts[0]) ? yearParts[0] : 2026;
  const endYear = !isNaN(yearParts[1]) ? yearParts[1] : startYear + 1;

  // Detect if active Kaldik events belong to a different academic year than selected academicYear
  const eventsMismatchYear = useMemo(() => {
    if (kaldikEvents.length === 0) return false;
    const expectedPrefixStart = `${startYear}-`;
    const expectedPrefixEnd = `${endYear}-`;
    const matchesCurrentYear = kaldikEvents.some(
      (ev) =>
        ev.dateStart?.startsWith(expectedPrefixStart) ||
        ev.dateStart?.startsWith(expectedPrefixEnd)
    );
    return !matchesCurrentYear;
  }, [kaldikEvents, startYear, endYear]);

  const months = useMemo(
    () =>
      buildAcademicYearCalendarMonths({
        academicYear,
        selectedDays,
        weekStartsOn: 'sunday',
        kaldikEvents,
      }),
    [academicYear, selectedDays, kaldikEvents]
  );

  const visibleMonths = useMemo(() => {
    if (semesterFilter === 'all') return months;
    return months.filter((m) => m.semester === semesterFilter);
  }, [months, semesterFilter]);

  const sortedEvents = useMemo(() => {
    return [...kaldikEvents].sort((a, b) =>
      (a.dateStart || '').localeCompare(b.dateStart || '')
    );
  }, [kaldikEvents]);

  const getCellStyle = (
    isSunday: boolean,
    isTeachingDay: boolean,
    events: { type: string }[]
  ) => {
    if (events.length > 0) {
      const hasHoliday = events.some(
        (e) => e.type === 'libur_nasional' || e.type === 'libur_semester'
      );
      if (hasHoliday) {
        return isTeachingDay
          ? 'bg-rose-500 text-white font-black ring-2 ring-amber-300'
          : 'bg-rose-100 text-rose-800 font-bold';
      }
      const hasAssessmentOrActivity = events.some(
        (e) => e.type === 'sts' || e.type === 'sas' || e.type === 'kegiatan_sekolah'
      );
      if (hasAssessmentOrActivity) {
        return 'bg-amber-100 text-amber-900 font-bold border border-amber-200';
      }
      return 'bg-emerald-100 text-emerald-900 font-bold border border-emerald-300';
    }
    if (isSunday) {
      return 'bg-rose-50/80 text-rose-600 font-semibold';
    }
    if (isTeachingDay) {
      return 'bg-emerald-100 text-emerald-900 font-black border border-emerald-400';
    }
    return 'text-slate-700 hover:bg-slate-100';
  };

  const openAddAgendaWithDate = (prefillDate?: string) => {
    const defaultDate = prefillDate || `${startYear}-07-13`;
    setNewStart(defaultDate);
    setNewEnd(defaultDate);
    setNewName('');
    setNewType('kegiatan_sekolah');
    setIsAddFormOpen(true);
    setTimeout(() => {
      addSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const handleSaveNewAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newStart) return;
    const statusOpt = STATUS_CATEGORY_OPTIONS.find((s) => s.value === newType);
    const created: KaldikEvent = {
      id: `kaldik-ev-${Date.now()}`,
      dateStart: newStart,
      dateEnd: newEnd && newEnd >= newStart ? newEnd : newStart,
      name: newName.trim(),
      type: newType,
      color: statusOpt?.color || '#f59e0b',
      notes: `Agenda Kalender Pendidikan TP ${academicYear}`,
    };
    onAddKaldikEvent?.(created);
    setNewName('');
    setIsAddFormOpen(false);
  };

  const openTableAddRow = () => {
    const defaultDate = `${startYear}-07-13`;
    setTableNewStart(defaultDate);
    setTableNewEnd(defaultDate);
    setTableNewName('');
    setTableNewType('kegiatan_sekolah');
    setIsTableAddOpen(true);
  };

  const handleSaveTableAddRow = () => {
    if (!tableNewName.trim() || !tableNewStart) return;
    const statusOpt = STATUS_CATEGORY_OPTIONS.find((s) => s.value === tableNewType);
    const created: KaldikEvent = {
      id: `kaldik-ev-${Date.now()}`,
      dateStart: tableNewStart,
      dateEnd: tableNewEnd && tableNewEnd >= tableNewStart ? tableNewEnd : tableNewStart,
      name: tableNewName.trim(),
      type: tableNewType,
      color: statusOpt?.color || '#f59e0b',
      notes: `Agenda Kalender Pendidikan TP ${academicYear}`,
    };
    onAddKaldikEvent?.(created);
    setTableNewName('');
    setIsTableAddOpen(false);
  };

  const handleUpdateField = (ev: KaldikEvent, updates: Partial<KaldikEvent>) => {
    if (!onUpdateKaldikEvent) return;
    const next: KaldikEvent = {
      ...ev,
      ...updates,
    };
    if (updates.type) {
      const matchedOpt = STATUS_CATEGORY_OPTIONS.find((o) => o.value === updates.type);
      if (matchedOpt) next.color = matchedOpt.color;
    }
    if (next.dateEnd < next.dateStart) {
      next.dateEnd = next.dateStart;
    }
    onUpdateKaldikEvent(next);
  };

  const availableYearOptions = useMemo(() => {
    if (ACADEMIC_YEAR_OPTIONS.includes(academicYear)) return ACADEMIC_YEAR_OPTIONS;
    return [academicYear, ...ACADEMIC_YEAR_OPTIONS];
  }, [academicYear]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
      {/* Top Header matching photo + Dynamic Academic Year switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-2.5 min-w-0">
          <CalendarDays className="w-5 h-5 text-[#0d5c3e] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-black text-slate-900 leading-snug">
              Kalender Pendidikan TP {academicYear} (Juli {startYear} s.d. Juni {endYear})
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Menampilkan kalender lengkap Semester Ganjil (Juli - Desember {startYear}) dan Semester Genap (Januari - Juni {endYear}).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onAdaptCalendarToYear && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">
                Tahun Pelajaran:
              </span>
              <select
                aria-label="Pilih Tahun Pelajaran Kalender"
                value={academicYear}
                onChange={(e) => onAdaptCalendarToYear(e.target.value)}
                className="text-xs font-extrabold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
              >
                {availableYearOptions.map((yr) => (
                  <option key={yr} value={yr}>
                    TP {yr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {onAddKaldikEvent && (
            <button
              type="button"
              onClick={() => openAddAgendaWithDate()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#109848] hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Agenda Sekolah</span>
            </button>
          )}
        </div>
      </div>

      {/* Auto-adapt banner if academicYear was changed externally (e.g., Step 1) without shifting dates yet */}
      {eventsMismatchYear && onAdaptCalendarToYear && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="text-amber-900 font-semibold">
            Daftar agenda kalender saat ini belum disesuaikan ke Tahun Pelajaran <strong>{academicYear}</strong>.
          </div>
          <button
            type="button"
            onClick={() => onAdaptCalendarToYear(academicYear)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs whitespace-nowrap cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sesuaikan Agenda ke TP {academicYear}</span>
          </button>
        </div>
      )}

      {/* Semester Filters & Legend */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-100 border border-rose-300 inline-block" />
            Libur Nasional / Semester
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300 inline-block" />
            Kegiatan Sekolah / STS / SAS
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400 inline-block" />
            Hari Mengajar Kelas ({selectedDays.length > 0 ? selectedDays.join(', ') : '-'})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
            Jadwal Mengajar Terkena Libur
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setSemesterFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              semesterFilter === 'all'
                ? 'bg-[#0d5c3e] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua (12 Bulan)
          </button>
          <button
            type="button"
            onClick={() => setSemesterFilter(1)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              semesterFilter === 1
                ? 'bg-[#0d5c3e] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semester Ganjil (Jul–Des)
          </button>
          <button
            type="button"
            onClick={() => setSemesterFilter(2)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              semesterFilter === 2
                ? 'bg-[#0d5c3e] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semester Genap (Jan–Jun)
          </button>
        </div>
      </div>

      {/* Inline Add Agenda Form */}
      <div ref={addSectionRef}>
        {isAddFormOpen && (
          <form
            onSubmit={handleSaveNewAgenda}
            className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 grid grid-cols-1 md:grid-cols-12 gap-3 items-end text-xs"
          >
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={newStart}
                onChange={(e) => {
                  setNewStart(e.target.value);
                  if (!newEnd || newEnd < e.target.value) setNewEnd(e.target.value);
                }}
                required
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={newEnd}
                min={newStart}
                onChange={(e) => setNewEnd(e.target.value)}
                required
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-medium"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Uraian Kegiatan / Hari Libur
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Contoh: Kegiatan Tengah Semester / Pembagian Rapor..."
                required
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                Kategori Status
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as KaldikEvent['type'])}
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg font-semibold"
              >
                {STATUS_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2 flex items-center gap-1.5">
              <button
                type="submit"
                className="flex-1 py-2 px-3 rounded-lg bg-[#109848] hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddFormOpen(false)}
                className="p-2 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Batal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Selected Date Popup Detail */}
      {selectedDateInfo && (
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-[#0d5c3e] shrink-0 mt-0.5" />
            <div>
              <p className="font-black text-slate-900">
                {selectedDateInfo.dayName}, {formatDateRangeLabelId(selectedDateInfo.dateStr, selectedDateInfo.dateStr)}{' '}
                {selectedDateInfo.isTeachingDay && (
                  <span className="ml-1.5 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                    Jadwal Mengajar Kelas
                  </span>
                )}
              </p>
              {selectedDateInfo.events.length > 0 ? (
                <ul className="mt-1 space-y-0.5 text-rose-700 font-semibold">
                  {selectedDateInfo.events.map((ev, i) => (
                    <li key={i}>• {ev.name}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-600 mt-0.5">
                  {selectedDateInfo.isTeachingDay
                    ? 'Hari KBM Efektif (Tidak ada benturan libur Kaldik).'
                    : 'Tidak ada agenda khusus Kaldik pada tanggal ini.'}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onAddKaldikEvent && (
              <button
                type="button"
                onClick={() => openAddAgendaWithDate(selectedDateInfo.dateStr)}
                className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px] hover:bg-emerald-100 cursor-pointer"
              >
                + Agenda di Tanggal Ini
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedDateInfo(null)}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* 12 Month Cards Grid (3 Columns Desktop matching attached photo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleMonths.map((month) => {
          const effectiveCount = month.days.filter(
            (d) => d.isTeachingDay && d.events.length === 0
          ).length;
          const holidayTeachingCount = month.days.filter(
            (d) => d.isTeachingDay && d.events.some((e) => e.type === 'libur_nasional' || e.type === 'libur_semester')
          ).length;

          const monthStartIso = `${month.year}-${String(month.monthIdx + 1).padStart(2, '0')}-01`;
          const daysInMonth = month.days.length;
          const monthEndIso = `${month.year}-${String(month.monthIdx + 1).padStart(2, '0')}-${String(
            daysInMonth
          ).padStart(2, '0')}`;

          const monthEvents = sortedEvents.filter(
            (ev) => ev.dateStart <= monthEndIso && (ev.dateEnd || ev.dateStart) >= monthStartIso
          );

          return (
            <div
              key={`${month.year}-${month.monthIdx}`}
              className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Dark Green Card Header */}
                <div className="bg-[#0d5c3e] text-white px-3.5 py-2.5 flex items-center justify-between gap-2">
                  <h4 className="text-xs font-black tracking-wide uppercase">
                    {month.monthName.toUpperCase()} {month.year}
                  </h4>
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/15 text-white border border-white/25 whitespace-nowrap">
                    {month.semester === 1 ? 'Sem. Ganjil' : 'Sem. Genap'}
                  </span>
                </div>

                {/* Calendar Body */}
                <div className="p-3">
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-600 mb-1.5">
                    {WEEKDAY_HEADERS.map((h, idx) => (
                      <span
                        key={`${h}-${idx}`}
                        className={idx === 0 ? 'text-rose-600' : ''}
                      >
                        {h}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-xs">
                    {Array.from({ length: month.leadingEmptyCount }).map((_, idx) => (
                      <span key={`empty-${idx}`} className="h-7" />
                    ))}
                    {month.days.map((day) => (
                      <button
                        key={day.dateStr}
                        type="button"
                        onClick={() =>
                          setSelectedDateInfo({
                            dateStr: day.dateStr,
                            dayName: day.dayName,
                            isTeachingDay: day.isTeachingDay,
                            events: day.events,
                          })
                        }
                        title={
                          day.events.length > 0
                            ? `${day.dayName}, ${day.dateStr}: ${day.events.map((e) => e.name).join(', ')}`
                            : `${day.dayName}, ${day.dateStr}`
                        }
                        className={`h-7 rounded-md flex items-center justify-center transition-colors cursor-pointer ${getCellStyle(
                          day.isSunday,
                          day.isTeachingDay,
                          day.events
                        )}`}
                      >
                        {day.dayNumber}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer: Monthly Agenda Bullet Summaries + KBM Riil Count */}
              <div className="px-3.5 py-2.5 bg-slate-50/70 border-t border-slate-100 space-y-1.5">
                <ul className="space-y-0.5 text-[11px] text-slate-600 leading-snug">
                  {monthEvents.length > 0 ? (
                    monthEvents.slice(0, 4).map((ev) => (
                      <li key={ev.id} className="truncate" title={ev.name}>
                        •{' '}
                        <span className="font-semibold text-slate-700">
                          {formatMonthBulletDateRange(
                            ev.dateStart,
                            ev.dateEnd,
                            month.year,
                            month.monthIdx
                          )}
                          :
                        </span>{' '}
                        {ev.name}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-600">
                      • Minggu Efektif KBM {month.semester === 1 ? 'Semester Ganjil' : 'Semester Genap'}
                    </li>
                  )}
                  {monthEvents.length > 4 && (
                    <li className="text-[10px] font-semibold text-emerald-700">
                      + {monthEvents.length - 4} agenda lainnya
                    </li>
                  )}
                </ul>

                <div className="pt-1 border-t border-slate-200/70 flex items-center justify-between text-[10px] font-bold">
                  <span className="text-emerald-700">KBM Riil: {effectiveCount} hr</span>
                  <span className={holidayTeachingCount > 0 ? 'text-rose-600' : 'text-slate-400'}>
                    Libur Jadwal: {holidayTeachingCount} hr
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Editable & Addable Rincian Agenda & Hari Libur Table matching attached photo */}
      <div className="pt-2 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">
              RINCIAN AGENDA & HARI LIBUR KALENDER PENDIDIKAN (DAPAT DIEDIT & DITAMBAH):
            </h4>
            <p className="text-[11px] text-slate-500">
              Ubah tanggal, uraian kegiatan, kategori status, atau tambah agenda baru secara langsung untuk menyesuaikan kalender sekolah & tahun pelajaran terbaru.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg whitespace-nowrap">
              {sortedEvents.length} Agenda Tersimpan
            </span>
            {onAddKaldikEvent && (
              <button
                type="button"
                onClick={openTableAddRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#109848] hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Agenda</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse min-w-[820px]">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 text-[11px] font-bold">
                <th className="py-2.5 px-2.5 w-32">Bulan</th>
                <th className="py-2.5 px-2.5 w-56">Rentang Tanggal</th>
                <th className="py-2.5 px-2.5 min-w-[260px]">Uraian Kegiatan / Hari Libur</th>
                <th className="py-2.5 px-2.5 w-52">Kategori Status</th>
                <th className="py-2.5 px-2 w-20 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {isTableAddOpen && (
                <tr className="bg-emerald-50/70">
                  <td className="p-2 align-middle">
                    <div className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-white text-emerald-800 font-bold text-xs whitespace-nowrap">
                      {getIndonesianMonthYearLabel(tableNewStart)}
                    </div>
                  </td>
                  <td className="p-2 align-middle">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          aria-label="Tanggal mulai agenda baru"
                          value={tableNewStart}
                          onChange={(e) => {
                            setTableNewStart(e.target.value);
                            if (!tableNewEnd || tableNewEnd < e.target.value) {
                              setTableNewEnd(e.target.value);
                            }
                          }}
                          className="w-full px-2 py-1 text-[11px] font-semibold text-slate-800 bg-white border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                        <span className="text-slate-400 text-[10px] font-bold">-</span>
                        <input
                          type="date"
                          aria-label="Tanggal selesai agenda baru"
                          value={tableNewEnd || tableNewStart}
                          min={tableNewStart}
                          onChange={(e) => setTableNewEnd(e.target.value)}
                          className="w-full px-2 py-1 text-[11px] font-semibold text-slate-800 bg-white border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-emerald-700 font-semibold px-1">
                        {formatDateRangeLabelId(tableNewStart, tableNewEnd)}
                      </p>
                    </div>
                  </td>
                  <td className="p-2 align-middle">
                    <input
                      type="text"
                      aria-label="Uraian kegiatan agenda baru"
                      value={tableNewName}
                      onChange={(e) => setTableNewName(e.target.value)}
                      placeholder="Tulis uraian kegiatan / hari libur baru..."
                      autoFocus
                      className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-900 bg-white border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </td>
                  <td className="p-2 align-middle">
                    <select
                      aria-label="Kategori status agenda baru"
                      value={tableNewType}
                      onChange={(e) => setTableNewType(e.target.value as KaldikEvent['type'])}
                      className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-emerald-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                    >
                      {STATUS_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={handleSaveTableAddRow}
                        disabled={!tableNewName.trim()}
                        title="Simpan Agenda Baru"
                        aria-label="Simpan agenda baru di tabel"
                        className="p-1.5 rounded-lg bg-[#109848] hover:bg-emerald-700 disabled:opacity-40 text-white cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsTableAddOpen(false)}
                        title="Batal"
                        aria-label="Batal tambah agenda di tabel"
                        className="p-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 hover:bg-slate-100 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
              {sortedEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-50/70">
                  <td className="p-2 align-middle">
                    <div className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-semibold text-xs whitespace-nowrap">
                      {getIndonesianMonthYearLabel(ev.dateStart)}
                    </div>
                  </td>
                  <td className="p-2 align-middle">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <input
                          type="date"
                          aria-label={`Tanggal mulai ${ev.name}`}
                          value={ev.dateStart}
                          onChange={(e) => handleUpdateField(ev, { dateStart: e.target.value })}
                          className="w-full px-2 py-1 text-[11px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                        <span className="text-slate-400 text-[10px] font-bold">-</span>
                        <input
                          type="date"
                          aria-label={`Tanggal selesai ${ev.name}`}
                          value={ev.dateEnd || ev.dateStart}
                          min={ev.dateStart}
                          onChange={(e) => handleUpdateField(ev, { dateEnd: e.target.value })}
                          className="w-full px-2 py-1 text-[11px] font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 font-medium px-1">
                        {formatDateRangeLabelId(ev.dateStart, ev.dateEnd)}
                      </p>
                    </div>
                  </td>
                  <td className="p-2 align-middle">
                    <input
                      type="text"
                      aria-label={`Uraian kegiatan ${ev.id}`}
                      value={ev.name}
                      onChange={(e) => handleUpdateField(ev, { name: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs font-medium text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                    />
                  </td>
                  <td className="p-2 align-middle">
                    <select
                      aria-label={`Kategori status ${ev.name}`}
                      value={ev.type}
                      onChange={(e) =>
                        handleUpdateField(ev, { type: e.target.value as KaldikEvent['type'] })
                      }
                      className="w-full px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                    >
                      {STATUS_CATEGORY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 align-middle text-center">
                    {onDeleteKaldikEvent && (
                      <button
                        type="button"
                        onClick={() => onDeleteKaldikEvent(ev.id)}
                        title="Hapus Agenda"
                        aria-label={`Hapus agenda ${ev.name}`}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {sortedEvents.length === 0 && !isTableAddOpen && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500 text-xs">
                    Belum ada agenda Kalender Pendidikan. Klik tombol{' '}
                    <strong>Tambah Agenda</strong> di atas untuk menambahkan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

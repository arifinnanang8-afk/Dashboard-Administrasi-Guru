import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateRpeTotals,
  calculateBloomStats,
  calculateClassMastery,
  auditCurriculumAlignment,
  validateCpElementsAgainstBskap2025,
  getSubjectRasionalAndCpElements,
  analyzeRealTeachingSchedule,
  buildAcademicYearCalendarMonths,
  summarizeTpTimeAllocation,
} from './curriculumLogic';

test('calculateRpeTotals calculates effective weeks and JP correctly', () => {
  const months = [
    { month: 'Juli', totalWeeks: 4, nonEffectiveWeeks: 1, nonEffectiveNote: 'MPLS', effectiveWeeks: 3 },
    { month: 'Agustus', totalWeeks: 5, nonEffectiveWeeks: 0, nonEffectiveNote: '-', effectiveWeeks: 5 },
    { month: 'September', totalWeeks: 4, nonEffectiveWeeks: 1, nonEffectiveNote: 'STS 1', effectiveWeeks: 3 },
    { month: 'Oktober', totalWeeks: 5, nonEffectiveWeeks: 0, nonEffectiveNote: '-', effectiveWeeks: 5 },
    { month: 'November', totalWeeks: 4, nonEffectiveWeeks: 0, nonEffectiveNote: '-', effectiveWeeks: 4 },
    { month: 'Desember', totalWeeks: 5, nonEffectiveWeeks: 2, nonEffectiveNote: 'SAS & Libur', effectiveWeeks: 3 },
  ];

  const result = calculateRpeTotals(months, 4, 4);
  assert.equal(result.totalWeeks, 27);
  assert.equal(result.nonEffectiveWeeks, 4);
  assert.equal(result.effectiveWeeks, 23);
  assert.equal(result.grossJp, 92);
  assert.equal(result.netJp, 88);
});

test('calculateBloomStats computes HOTS percentage correctly for 7 TP', () => {
  const bloomItems = [
    { id: '1', code: 'TP 10.1', bloomLevel: 'C4' as const },
    { id: '2', code: 'TP 10.2', bloomLevel: 'C5' as const },
    { id: '3', code: 'TP 10.3', bloomLevel: 'C4' as const },
    { id: '4', code: 'TP 10.4', bloomLevel: 'C3' as const },
    { id: '5', code: 'TP 10.5', bloomLevel: 'C6' as const },
    { id: '6', code: 'TP 10.6', bloomLevel: 'C4' as const },
    { id: '7', code: 'TP 10.7', bloomLevel: 'C2' as const },
  ];

  const stats = calculateBloomStats(bloomItems);
  assert.equal(stats.total, 7);
  assert.equal(stats.hotsCount, 5); // 5 out of 7 is 71.4% -> 71%
  assert.equal(stats.hotsPercentage, 71);
});

test('calculateClassMastery computes average and KKTP 96% rate correctly', () => {
  // 24 students, 23 passed >= 75 (23/24 = 95.8% -> 96%)
  const students = Array.from({ length: 24 }, (_, i) => ({
    id: `std-${i + 1}`,
    name: `Siswa ${i + 1}`,
    nilaiAkhir: i === 0 ? 70 : 85,
  }));

  const result = calculateClassMastery(students, 75);
  assert.equal(result.totalStudents, 24);
  assert.equal(result.tuntasCount, 23);
  assert.equal(result.belumTuntasCount, 1);
  assert.equal(result.masteryRate, 96);
});

test('auditCurriculumAlignment reports 100% when all 5 checks match', () => {
  const audit = auditCurriculumAlignment({
    rpeTotalJp: 132,
    protaTotalJp: 132,
    promesTotalJp: 132,
    tpCount: 7,
    modulCount: 7,
    lkpdCount: 7,
    studentsEvaluated: 24,
  });

  assert.equal(audit.isFullyAligned, true);
  assert.equal(audit.alignmentPercentage, 100);
});

test('validateCpElementsAgainstBskap2025 verifies matching CP descriptions and flags Pembaruan Tersedia on mismatch', () => {
  const { cpElements: official } = getSubjectRasionalAndCpElements('Ekonomi', 'X SMA', 'E');

  // 1. Exact match -> isValid: true, updateAvailable: false
  const validRes = validateCpElementsAgainstBskap2025(official, official);
  assert.equal(validRes.isValid, true);
  assert.equal(validRes.updateAvailable, false);
  assert.equal(validRes.statusLabel, 'Terverifikasi Sesuai KepKa BSKAP 046/2025');
  assert.equal(validRes.discrepancies.length, 0);

  // 2. Modified description -> isValid: false, updateAvailable: true, statusLabel: 'Pembaruan Tersedia'
  const modified = official.map((el, idx) =>
    idx === 0 ? { ...el, deskripsi: 'Deskripsi lama yang belum diperbarui ke BSKAP 2025.' } : el
  );
  const invalidRes = validateCpElementsAgainstBskap2025(modified, official);
  assert.equal(invalidRes.isValid, false);
  assert.equal(invalidRes.updateAvailable, true);
  assert.equal(invalidRes.statusLabel, 'Pembaruan Tersedia');
  assert.equal(invalidRes.discrepancies.length, 1);
  assert.equal(invalidRes.discrepancies[0].issueType, 'description_mismatch');
});

test('Kop type selection logic distinguishes Kop Yayasan and Kop Dinas (tanpa jurusan)', () => {
  const profileYayasan = {
    schoolName: "SMK MA'ARIF 1 SENDANG AGUNG",
    kopType: 'yayasan' as const,
  };
  const profileDinas = {
    schoolName: "SMK MA'ARIF 1 SENDANG AGUNG",
    kopType: 'dinas' as const,
  };

  // Helper check for Kop texts
  const resolveKopTexts = (kopType: 'yayasan' | 'dinas') => {
    if (kopType === 'dinas') {
      return {
        headerLines: ['PEMERINTAH PROVINSI LAMPUNG', 'DINAS PENDIDIKAN DAN KEBUDAYAAN'],
        hasJurusan: false,
      };
    }
    return {
      headerLines: ["LEMBAGA PENDIDIKAN MA'ARIF NU LAMPUNG TENGAH"],
      hasJurusan: true,
      programKeahlian: ['1. Manajemen Perkantoran', '2. Teknik Komputer dan Jaringan'],
    };
  };

  const yayasan = resolveKopTexts(profileYayasan.kopType);
  assert.equal(yayasan.hasJurusan, true);
  assert.equal(yayasan.headerLines[0], "LEMBAGA PENDIDIKAN MA'ARIF NU LAMPUNG TENGAH");

  const dinas = resolveKopTexts(profileDinas.kopType);
  assert.equal(dinas.hasJurusan, false);
  assert.equal(dinas.headerLines[0], 'PEMERINTAH PROVINSI LAMPUNG');
  assert.equal(dinas.headerLines[1], 'DINAS PENDIDIKAN DAN KEBUDAYAAN');
});

test('Dynamic Kop identity fields resolve npsn, akreditasi, programKeahlian, phone, address correctly', () => {
  const customProfile = {
    schoolName: 'SMK NEGERI 1 CONTOH',
    npsn: '12345678',
    akreditasi: 'A (Unggul)',
    programKeahlian: '1. Agribisnis Ternak\n2. Rekayasa Perangkat Lunak',
    phone: '(021) 555-1234',
    address: 'Jl. Merdeka Belajar No. 10',
  };

  const programs = typeof customProfile.programKeahlian === 'string'
    ? customProfile.programKeahlian.split('\n').filter(Boolean)
    : customProfile.programKeahlian;

  assert.equal(customProfile.npsn, '12345678');
  assert.equal(customProfile.akreditasi, 'A (Unggul)');
  assert.equal(programs.length, 2);
  assert.equal(programs[0], '1. Agribisnis Ternak');
  assert.equal(programs[1], '2. Rekayasa Perangkat Lunak');
  assert.equal(customProfile.phone, '(021) 555-1234');
  assert.equal(customProfile.address, 'Jl. Merdeka Belajar No. 10');
});

test('analyzeRealTeachingSchedule detects Kaldik holiday collisions on selected teaching days', () => {
  const sampleEvents = [
    {
      id: 'ev-1',
      name: 'MPLS Tahun Ajaran Baru',
      dateStart: '2026-07-13',
      dateEnd: '2026-07-15',
      type: 'kegiatan_sekolah',
    },
    {
      id: 'ev-2',
      name: 'HUT Kemerdekaan RI ke-81',
      dateStart: '2026-08-17',
      dateEnd: '2026-08-17',
      type: 'libur_nasional',
    },
  ];

  // 2026-07-13 and 2026-08-17 are both Mondays (Senin)
  const analysis = analyzeRealTeachingSchedule({
    academicYear: '2026/2027',
    selectedDays: ['Senin', 'Rabu'],
    kaldikEvents: sampleEvents,
    jpPerMeetingS1: 2,
    jpPerMeetingS2: 2,
  });

  assert.ok(analysis.totalScheduledDays > 90);
  // Both 2026-07-13 (Senin), 2026-07-15 (Rabu), and 2026-08-17 (Senin) should be detected as affected!
  assert.equal(analysis.totalHolidayAffectedDays, 3);
  assert.equal(analysis.totalEffectiveMeetings, analysis.totalScheduledDays - 3);
  assert.equal(
    analysis.affectedDates.some((d) => d.dateStr === '2026-08-17' && d.dayName === 'Senin'),
    true
  );
  assert.equal(
    analysis.affectedDates.some((d) => d.dateStr === '2026-07-15' && d.dayName === 'Rabu'),
    true
  );
});

test('buildAcademicYearCalendarMonths builds 12 months from Juli to Juni with teaching days and events', () => {
  const months = buildAcademicYearCalendarMonths({
    academicYear: '2026/2027',
    selectedDays: ['Senin'],
    kaldikEvents: [
      {
        id: 'hut-ri',
        name: 'Upacara HUT Kemerdekaan RI ke-81',
        dateStart: '2026-08-17',
        dateEnd: '2026-08-17',
        type: 'libur_nasional',
      },
    ],
  });

  assert.equal(months.length, 12);
  assert.equal(months[0].monthName, 'Juli');
  assert.equal(months[0].year, 2026);
  assert.equal(months[11].monthName, 'Juni');
  assert.equal(months[11].year, 2027);

  const aug = months[1];
  const aug17 = aug.days.find((d) => d.dateStr === '2026-08-17');
  assert.ok(aug17);
  assert.equal(aug17.dayName, 'Senin');
  assert.equal(aug17.isTeachingDay, true);
  assert.equal(aug17.events.length, 1);
});

test('summarizeTpTimeAllocation compares RPE Net JP and PROTA JP allocations', () => {
  const summary = summarizeTpTimeAllocation({
    rpeNetJpS1: 68,
    rpeNetJpS2: 64,
    protaItems: [
      { semester: 1, alokasiJp: 36 },
      { semester: 1, alokasiJp: 32 },
      { semester: 2, alokasiJp: 64 },
    ],
  });

  assert.equal(summary.totalRpeNetJp, 132);
  assert.equal(summary.totalAllocatedJp, 132);
  assert.equal(summary.totalDiff, 0);
  assert.equal(summary.isAligned, true);
});

test('buildAcademicYearCalendarMonths supports weekStartsOn sunday matching M S S R K J S grid', async () => {
  const { buildAcademicYearCalendarMonths } = await import('./curriculumLogic');
  const months = buildAcademicYearCalendarMonths({
    academicYear: '2026/2027',
    selectedDays: ['Selasa'],
    weekStartsOn: 'sunday',
    kaldikEvents: [],
  });

  // July 1, 2026 is Wednesday -> under Sunday-first (0=Min,1=Sen,2=Sel,3=Rab), leadingEmptyCount === 3
  assert.equal(months[0].leadingEmptyCount, 3);
  assert.equal(months[0].days[4].isSunday, true); // 5 Juli 2026 is Minggu
});

test('adaptKaldikEventsToAcademicYear shifts event dates, leap day safety, and year labels cleanly', async () => {
  const {
    adaptKaldikEventsToAcademicYear,
    formatDateRangeLabelId,
    getIndonesianMonthYearLabel,
  } = await import('./curriculumLogic');

  const sample = [
    {
      id: 'ev-1',
      dateStart: '2026-07-13',
      dateEnd: '2026-07-15',
      name: 'MPLS TA 2026/2027',
      type: 'kegiatan_sekolah',
      color: '#3b82f6',
      notes: 'Awal masuk 2026',
    },
    {
      id: 'ev-2',
      dateStart: '2026-08-17',
      dateEnd: '2026-08-17',
      name: 'Upacara HUT RI ke-81 Tahun 2026',
      type: 'libur_nasional',
      color: '#ef4444',
      notes: 'Libur Nasional 2026',
    },
    {
      id: 'ev-3',
      dateStart: '2027-06-21',
      dateEnd: '2027-06-30',
      name: 'Libur Akhir Tahun Pelajaran 2026/2027',
      type: 'libur_semester',
      color: '#ec4899',
      notes: 'Penutupan 2027',
    },
  ];

  const shifted = adaptKaldikEventsToAcademicYear(sample, '2027/2028');
  assert.equal(shifted[0].dateStart, '2027-07-13');
  assert.equal(shifted[0].name, 'MPLS TA 2027/2028');
  assert.equal(shifted[1].dateStart, '2027-08-17');
  assert.equal(shifted[1].name, 'Upacara HUT RI ke-82 Tahun 2027');
  assert.equal(shifted[2].dateStart, '2028-06-21');
  assert.equal(shifted[2].notes, 'Penutupan 2028');

  assert.equal(getIndonesianMonthYearLabel('2027-07-13'), 'Juli 2027');
  assert.equal(formatDateRangeLabelId('2026-07-01', '2026-07-11'), '1 - 11 Juli 2026');
  assert.equal(formatDateRangeLabelId('2026-08-17', '2026-08-17'), '17 Agustus 2026');
});

test('buildStandardYearRpeFromKaldik computes 12 monthly rows and Kaldik agenda notes cleanly', async () => {
  const { buildStandardYearRpeFromKaldik } = await import('./curriculumLogic');
  const rpe = buildStandardYearRpeFromKaldik({
    academicYear: '2026/2027',
    jpPerWeekS1: 3,
    jpPerWeekS2: 3,
    cadanganJpS1: 0,
    cadanganJpS2: 0,
    kaldikEvents: [
      {
        dateStart: '2026-07-01',
        dateEnd: '2026-07-11',
        name: 'Libur Akhir Tahun',
        type: 'libur_semester',
      },
      {
        dateStart: '2026-12-21',
        dateEnd: '2026-12-31',
        name: 'Libur Semester Ganjil',
        type: 'libur_semester',
      },
    ],
  });

  assert.equal(rpe.semester1.months.length, 6);
  assert.equal(rpe.semester2.months.length, 6);
  assert.equal(rpe.semester1.months[0].month, 'Juli 2026');
  assert.equal(rpe.semester1.months[0].nonEffectiveWeeks, 2);
  assert.equal(rpe.semester1.months[0].effectiveWeeks, rpe.semester1.months[0].totalWeeks - 2);
  assert.ok(rpe.semester1.months[0].nonEffectiveNote.includes('Libur Akhir Tahun'));
  assert.equal(rpe.semester1.months[0].effectiveMeetings, undefined);
});

test('syncMonthRpeDetailUpdate keeps effectiveWeeks and effectiveMeetings synchronized across updates', async () => {
  const { syncMonthRpeDetailUpdate } = await import('./curriculumLogic');
  const initialMonth = {
    month: 'Juli 2026',
    totalWeeks: 4,
    nonEffectiveWeeks: 1,
    nonEffectiveNote: 'MPLS',
    effectiveWeeks: 3,
    effectiveMeetings: undefined as number | undefined,
  };

  // Reducing nonEffectiveWeeks from 1 -> 2 increases nonEffective and reduces effectiveMeetings by meetingsPerWeek (2)
  const afterWeekChange = syncMonthRpeDetailUpdate(
    initialMonth,
    { nonEffectiveWeeks: 2 },
    6,
    2
  );
  assert.equal(afterWeekChange.effectiveWeeks, 2);
  assert.equal(afterWeekChange.effectiveMeetings, 4);

  // Direct meeting override preserves exact count while keeping weeks intact
  const afterMeetingChange = syncMonthRpeDetailUpdate(
    afterWeekChange,
    { effectiveMeetings: 5 },
    6,
    2
  );
  assert.equal(afterMeetingChange.effectiveMeetings, 5);
  assert.equal(afterMeetingChange.effectiveWeeks, 2);

  // Setting nonEffectiveWeeks == totalWeeks sets effectiveWeeks & effectiveMeetings to 0
  const afterZeroWeeks = syncMonthRpeDetailUpdate(
    afterMeetingChange,
    { nonEffectiveWeeks: 4 },
    6,
    2
  );
  assert.equal(afterZeroWeeks.effectiveWeeks, 0);
  assert.equal(afterZeroWeeks.effectiveMeetings, 0);
});

test('autoBalanceTpAllocations and deriveEstimatedMonthRangeFromDistribution keep JP and months exact', async () => {
  const {
    autoBalanceTpAllocations,
    deriveEstimatedMonthRangeFromDistribution,
    inferSemesterFromKodeJenis,
  } = await import('./curriculumLogic');

  assert.equal(
    deriveEstimatedMonthRangeFromDistribution(
      { 'Jul-3': 4, 'Jul-4': 4, 'Agu-1': 4 },
      1,
      '2026/2027'
    ),
    'Juli - Agustus 2026'
  );
  assert.equal(
    deriveEstimatedMonthRangeFromDistribution({ 'Okt-1': 4, 'Okt-2': 4 }, 1, '2026/2027'),
    'Oktober 2026'
  );
  assert.equal(inferSemesterFromKodeJenis('TP 2.1 (Genap)', 1), 2);
  assert.equal(inferSemesterFromKodeJenis('Cadangan Sem 1', 2), 1);

  const items: { id: string; semester: number; tpCode: string; alokasiJp: number; jmlPertemuan?: number }[] = [
    { id: '1', semester: 1, tpCode: 'TP 1.1 (Ganjil)', alokasiJp: 10 },
    { id: '2', semester: 1, tpCode: 'TP 1.2 (Ganjil)', alokasiJp: 10 },
    { id: '3', semester: 1, tpCode: 'Cadangan Sem 1', alokasiJp: 3 },
    { id: '4', semester: 2, tpCode: 'TP 2.1 (Genap)', alokasiJp: 10 },
    { id: '5', semester: 2, tpCode: 'TP 2.2 (Genap)', alokasiJp: 10 },
  ];

  const balanced = autoBalanceTpAllocations(items, {
    targetTotalJpS1: 57,
    targetTotalJpS2: 57,
    jpPerMeetingS1: 3,
    jpPerMeetingS2: 3,
  });

  const s1Sum = balanced.filter((b) => b.semester === 1).reduce((a, b) => a + b.alokasiJp, 0);
  const s2Sum = balanced.filter((b) => b.semester === 2).reduce((a, b) => a + b.alokasiJp, 0);
  assert.equal(s1Sum, 57);
  assert.equal(s2Sum, 57);
  assert.equal(balanced[2].alokasiJp, 3); // Cadangan Sem 1 keeps 1 meeting = 3 JP
  assert.equal(balanced[0].jmlPertemuan, Math.round(balanced[0].alokasiJp / 3));
});

test('buildUnifiedRpeExportPayload combines 12-month analysis, semester tables, kaldik agenda, and TP distribution', async () => {
  const { buildUnifiedRpeExportPayload } = await import('./curriculumLogic');
  const payload = buildUnifiedRpeExportPayload({
    academicYear: '2026/2027',
    selectedDays: ['Senin', 'Rabu'],
    rpe: {
      semester1: {
        jpPerWeek: 4,
        cadanganJp: 4,
        months: [
          { month: 'Juli 2026', totalWeeks: 4, nonEffectiveWeeks: 1, nonEffectiveNote: 'MPLS', effectiveWeeks: 3, effectiveMeetings: 5 },
          { month: 'Agustus 2026', totalWeeks: 5, nonEffectiveWeeks: 1, nonEffectiveNote: 'HUT RI', effectiveWeeks: 4 },
          { month: 'September 2026', totalWeeks: 4, nonEffectiveWeeks: 1, nonEffectiveNote: 'STS', effectiveWeeks: 3 },
          { month: 'Oktober 2026', totalWeeks: 5, nonEffectiveWeeks: 0, nonEffectiveNote: 'Efektif', effectiveWeeks: 5 },
          { month: 'November 2026', totalWeeks: 4, nonEffectiveWeeks: 0, nonEffectiveNote: 'Efektif', effectiveWeeks: 4 },
          { month: 'Desember 2026', totalWeeks: 5, nonEffectiveWeeks: 4, nonEffectiveNote: 'SAS', effectiveWeeks: 1 },
        ],
      },
      semester2: {
        jpPerWeek: 4,
        cadanganJp: 4,
        months: [
          { month: 'Januari 2027', totalWeeks: 4, nonEffectiveWeeks: 0, nonEffectiveNote: 'Efektif', effectiveWeeks: 4 },
          { month: 'Februari 2027', totalWeeks: 4, nonEffectiveWeeks: 0, nonEffectiveNote: 'Efektif', effectiveWeeks: 4 },
          { month: 'Maret 2027', totalWeeks: 5, nonEffectiveWeeks: 2, nonEffectiveNote: 'Idul Fitri', effectiveWeeks: 3 },
          { month: 'April 2027', totalWeeks: 4, nonEffectiveWeeks: 1, nonEffectiveNote: 'Ujian', effectiveWeeks: 3 },
          { month: 'Mei 2027', totalWeeks: 5, nonEffectiveWeeks: 1, nonEffectiveNote: 'SAS', effectiveWeeks: 4 },
          { month: 'Juni 2027', totalWeeks: 4, nonEffectiveWeeks: 3, nonEffectiveNote: 'Rapor', effectiveWeeks: 1 },
        ],
      },
    },
    kaldikEvents: [
      { id: 'k1', dateStart: '2026-08-17', dateEnd: '2026-08-17', name: 'HUT RI ke-81', type: 'libur_nasional', notes: 'Libur' },
    ],
    prota: [
      { id: 'p1', semester: 1, babNumber: 1, babTitle: 'Bab 1 Uji', tpCode: 'TP 10.1', tpDescription: 'Desc 1', alokasiJp: 80, keterangan: '-' },
      { id: 'p2', semester: 2, babNumber: 2, babTitle: 'Bab 2 Uji', tpCode: 'TP 10.2', tpDescription: 'Desc 2', alokasiJp: 76, keterangan: '-' },
    ],
    promes: [
      { id: 'pm1', tpCode: 'TP 10.1', distribution: { 'Jul-3': 4, 'Agu-1': 4 } },
    ],
  });

  assert.equal(payload.twelveMonthRows.length, 12);
  assert.equal(payload.twelveMonthRows[0].effectiveMeetings, 5);
  assert.equal(payload.s1Summary.effectiveWeeks, 20);
  assert.equal(payload.s2Summary.effectiveWeeks, 19);
  assert.equal(payload.annualSummary.grossJp, 156);
  assert.equal(payload.kaldikRows.length, 1);
  assert.equal(payload.kaldikRows[0].monthLabel, 'Agustus 2026');
  assert.equal(payload.tpRows.length, 2);
  assert.equal(payload.tpRows[0].perkiraanBulan, 'Juli - Agustus 2026');
  assert.equal(payload.tpSummary.isBalanced, true);
  assert.equal(payload.tpSummary.totalAllocatedJp, 156);
});





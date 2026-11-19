import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveCpTargetFromAssessment,
  syncCpTargetToAssessment,
  calculateCpMappingStats,
  generateCpNarrativeDescription,
} from './cpMappingLogic';
import { StudentRecord, StudentCpTarget } from '../types';

const mockStudent: StudentRecord = {
  id: 'std-1',
  nisn: '0081234001',
  name: 'Aditya Pratama Putra',
  gender: 'L',
  formatifScores: { 'TP 10.1': 88, 'TP 10.2': 85 },
  sumatifLmScores: { 'Bab 1': 88 },
  sumatifAkhir: 90,
  nilaiAkhir: 88,
  predikat: 'A',
  kktpStatus: 'Tuntas',
  deskripsi: 'Siswa berprestasi baik.',
};

test('deriveCpTargetFromAssessment accurately maps student assessment score to CP target level and note', () => {
  // 1. High score (>=90) -> Mahir, Tercapai
  const studentHigh: StudentRecord = { ...mockStudent, formatifScores: { 'TP 10.1': 94 } };
  const targetMahir = deriveCpTargetFromAssessment(studentHigh, 'TP 10.1', 'Menyimak');
  assert.equal(targetMahir.targetLevel, 'Mahir');
  assert.equal(targetMahir.status, 'Tercapai');
  assert.equal(targetMahir.skor, 94);
  assert.ok(targetMahir.catatanGuru.includes('Sangat menguasai'));

  // 2. Passing score (85 >= 75) -> Cakap, Tercapai
  const targetCakap = deriveCpTargetFromAssessment(mockStudent, 'TP 10.2', 'Membaca dan Memirsa');
  assert.equal(targetCakap.targetLevel, 'Cakap');
  assert.equal(targetCakap.status, 'Tercapai');
  assert.equal(targetCakap.skor, 85);

  // 3. Low score (<65) -> Perlu Bimbingan, Perlu Penguatan
  const studentLow: StudentRecord = { ...mockStudent, formatifScores: { 'TP 10.3': 60 } };
  const targetLow = deriveCpTargetFromAssessment(studentLow, 'TP 10.3', 'Menulis');
  assert.equal(targetLow.targetLevel, 'Perlu Bimbingan');
  assert.equal(targetLow.status, 'Perlu Penguatan');
  assert.equal(targetLow.skor, 60);
  assert.ok(targetLow.catatanGuru.includes('intervensi'));
});

test('syncCpTargetToAssessment updates student formatif score, recalculates final grade and syncs report notes', () => {
  const newTarget: StudentCpTarget = {
    elementName: 'Menyimak',
    tpCode: 'TP 10.1',
    targetLevel: 'Mahir',
    skor: 96,
    status: 'Tercapai',
    catatanGuru: 'Capaian evaluasi akurasi fakta LHO sangat unggul.',
  };

  const updated = syncCpTargetToAssessment(mockStudent, 'TP 10.1', newTarget, 75);

  assert.equal(updated.formatifScores['TP 10.1'], 96);
  assert.equal(updated.cpTargets?.['TP 10.1']?.skor, 96);
  assert.equal(updated.cpTargets?.['TP 10.1']?.targetLevel, 'Mahir');
  assert.equal(updated.deskripsi, 'Capaian evaluasi akurasi fakta LHO sangat unggul.');
  assert.equal(updated.kktpStatus, 'Tuntas');
});

test('calculateCpMappingStats computes correct counts, averages and mastery distributions', () => {
  const students: StudentRecord[] = [
    {
      ...mockStudent,
      id: 's1',
      cpTargets: {
        'TP 10.1': {
          elementName: 'Menyimak',
          tpCode: 'TP 10.1',
          targetLevel: 'Mahir',
          skor: 92,
          status: 'Tercapai',
          catatanGuru: '',
        },
      },
    },
    {
      ...mockStudent,
      id: 's2',
      cpTargets: {
        'TP 10.1': {
          elementName: 'Menyimak',
          tpCode: 'TP 10.1',
          targetLevel: 'Cakap',
          skor: 80,
          status: 'Tercapai',
          catatanGuru: '',
        },
      },
    },
    {
      ...mockStudent,
      id: 's3',
      cpTargets: {
        'TP 10.1': {
          elementName: 'Menyimak',
          tpCode: 'TP 10.1',
          targetLevel: 'Perlu Bimbingan',
          skor: 62,
          status: 'Perlu Penguatan',
          catatanGuru: '',
        },
      },
    },
  ];

  const stats = calculateCpMappingStats(students, 'TP 10.1');

  assert.equal(stats.totalStudents, 3);
  assert.equal(stats.totalMapped, 3);
  assert.equal(stats.targetAchievedCount, 2);
  assert.equal(stats.needInterventionCount, 1);
  assert.equal(stats.achievementPercentage, 67); // 2 out of 3 = 66.6% -> 67%
  assert.equal(stats.averageScore, 78); // (92 + 80 + 62) / 3 = 78
  assert.equal(stats.masteryDistribution.mahir, 1);
  assert.equal(stats.masteryDistribution.cakap, 1);
  assert.equal(stats.masteryDistribution.perluBimbingan, 1);
});

test('generateCpNarrativeDescription constructs a holistic Kurikulum Merdeka description', () => {
  const studentWithTargets: StudentRecord = {
    ...mockStudent,
    cpTargets: {
      'TP 10.1': {
        elementName: 'Menyimak',
        tpCode: 'TP 10.1',
        targetLevel: 'Mahir',
        skor: 95,
        status: 'Tercapai',
        catatanGuru: '',
      },
      'TP 10.2': {
        elementName: 'Menulis',
        tpCode: 'TP 10.2',
        targetLevel: 'Perlu Bimbingan',
        skor: 65,
        status: 'Perlu Penguatan',
        catatanGuru: '',
      },
    },
  };

  const narrative = generateCpNarrativeDescription(studentWithTargets, []);
  assert.ok(narrative.includes('Menyimak (TP 10.1)'));
  assert.ok(narrative.includes('Menulis (TP 10.2)'));
  assert.ok(narrative.includes('penguasaan istimewa'));
  assert.ok(narrative.includes('Perlu bimbingan'));
});

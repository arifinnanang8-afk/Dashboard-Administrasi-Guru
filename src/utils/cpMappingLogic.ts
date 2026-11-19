import { StudentRecord, StudentCpTarget, CpMasteryLevel, CpElement } from '../types';

/**
 * Derives a default CP Target for a student from their existing formatif and sumatif scores.
 */
export function deriveCpTargetFromAssessment(
  student: StudentRecord,
  tpCode: string,
  elementName: string,
  kktpThreshold: number = 75
): StudentCpTarget {
  const existing = student.cpTargets?.[tpCode];
  if (existing) {
    return existing;
  }

  const score = student.formatifScores?.[tpCode] ?? student.nilaiAkhir ?? 80;

  let targetLevel: CpMasteryLevel = 'Cakap';
  let status: 'Tercapai' | 'Dalam Proses' | 'Perlu Penguatan' = 'Tercapai';

  if (score >= 90) {
    targetLevel = 'Mahir';
    status = 'Tercapai';
  } else if (score >= kktpThreshold) {
    targetLevel = 'Cakap';
    status = 'Tercapai';
  } else if (score >= 65) {
    targetLevel = 'Cukup';
    status = 'Dalam Proses';
  } else {
    targetLevel = 'Perlu Bimbingan';
    status = 'Perlu Penguatan';
  }

  const defaultNote =
    targetLevel === 'Mahir'
      ? `Sangat menguasai capaian ${elementName} (${tpCode}), siap pengayaan materi mandiri.`
      : targetLevel === 'Cakap'
      ? `Telah mencapai target kompetensi ${elementName} (${tpCode}) secara mandiri dan tuntas.`
      : targetLevel === 'Cukup'
      ? `Perlu penguatan konsep dan latihan terpandu pada elemen ${elementName} (${tpCode}).`
      : `Membutuhkan intervensi khusus dan pendampingan personal untuk elemen ${elementName} (${tpCode}).`;

  return {
    elementName,
    tpCode,
    targetLevel,
    skor: score,
    status,
    catatanGuru: defaultNote,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Synchronizes an updated CP Target into the student's formatif score and final grade.
 */
export function syncCpTargetToAssessment(
  student: StudentRecord,
  tpCode: string,
  target: StudentCpTarget,
  kktpThreshold: number = 75
): StudentRecord {
  const updatedCpTargets = {
    ...(student.cpTargets || {}),
    [tpCode]: {
      ...target,
      updatedAt: new Date().toISOString(),
    },
  };

  const updatedFormatifScores = {
    ...(student.formatifScores || {}),
    [tpCode]: target.skor,
  };

  const fScores = Object.values(updatedFormatifScores);
  const avgF = fScores.length ? fScores.reduce((a, b) => a + b, 0) / fScores.length : target.skor;
  const finalScore = Math.round(avgF * 0.5 + (student.sumatifAkhir || 80) * 0.5);

  const predikat = finalScore >= 88 ? 'A' : finalScore >= 78 ? 'B' : finalScore >= kktpThreshold ? 'C' : 'D';
  const kktpStatus = finalScore >= kktpThreshold ? 'Tuntas' : 'Perlu Bimbingan';

  // Construct holistic description if notes available
  let updatedDeskripsi = student.deskripsi;
  if (target.catatanGuru && target.catatanGuru.trim().length > 0) {
    updatedDeskripsi = target.catatanGuru;
  }

  return {
    ...student,
    formatifScores: updatedFormatifScores,
    nilaiAkhir: finalScore,
    predikat,
    kktpStatus,
    deskripsi: updatedDeskripsi,
    cpTargets: updatedCpTargets,
  };
}

export interface CpMappingStats {
  totalStudents: number;
  totalMapped: number;
  targetAchievedCount: number;
  inProgressCount: number;
  needInterventionCount: number;
  achievementPercentage: number;
  averageScore: number;
  masteryDistribution: {
    mahir: number;
    cakap: number;
    cukup: number;
    perluBimbingan: number;
  };
}

/**
 * Calculates aggregated statistics for specific or all CP Targets across students.
 */
export function calculateCpMappingStats(
  students: StudentRecord[],
  activeTpCode?: string
): CpMappingStats {
  const totalStudents = students.length;
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      totalMapped: 0,
      targetAchievedCount: 0,
      inProgressCount: 0,
      needInterventionCount: 0,
      achievementPercentage: 0,
      averageScore: 0,
      masteryDistribution: { mahir: 0, cakap: 0, cukup: 0, perluBimbingan: 0 },
    };
  }

  let totalMapped = 0;
  let targetAchievedCount = 0;
  let inProgressCount = 0;
  let needInterventionCount = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  const distribution = {
    mahir: 0,
    cakap: 0,
    cukup: 0,
    perluBimbingan: 0,
  };

  students.forEach((std) => {
    const targets = activeTpCode
      ? std.cpTargets?.[activeTpCode] ? [std.cpTargets[activeTpCode]] : []
      : Object.values(std.cpTargets || {});

    if (targets.length > 0) {
      totalMapped++;
      targets.forEach((t) => {
        scoreSum += t.skor;
        scoreCount++;

        if (t.status === 'Tercapai') targetAchievedCount++;
        else if (t.status === 'Dalam Proses') inProgressCount++;
        else needInterventionCount++;

        if (t.targetLevel === 'Mahir') distribution.mahir++;
        else if (t.targetLevel === 'Cakap') distribution.cakap++;
        else if (t.targetLevel === 'Cukup') distribution.cukup++;
        else distribution.perluBimbingan++;
      });
    } else {
      // Fallback from raw formatifScores if not explicitly mapped
      const rawScore = activeTpCode
        ? std.formatifScores?.[activeTpCode] ?? std.nilaiAkhir
        : std.nilaiAkhir;

      if (rawScore !== undefined) {
        scoreSum += rawScore;
        scoreCount++;
        if (rawScore >= 75) {
          targetAchievedCount++;
          if (rawScore >= 90) distribution.mahir++;
          else distribution.cakap++;
        } else if (rawScore >= 65) {
          inProgressCount++;
          distribution.cukup++;
        } else {
          needInterventionCount++;
          distribution.perluBimbingan++;
        }
      }
    }
  });

  const averageScore = scoreCount > 0 ? Math.round((scoreSum / scoreCount) * 10) / 10 : 0;
  const achievementPercentage = scoreCount > 0 ? Math.round((targetAchievedCount / scoreCount) * 100) : 0;

  return {
    totalStudents,
    totalMapped,
    targetAchievedCount,
    inProgressCount,
    needInterventionCount,
    achievementPercentage,
    averageScore,
    masteryDistribution: distribution,
  };
}

/**
 * Generates an automated holistic achievement description for school report cards (Rapor Kurikulum Merdeka)
 * based on all recorded CP Targets.
 */
export function generateCpNarrativeDescription(
  student: StudentRecord,
  cpElements: CpElement[]
): string {
  const targets = Object.values(student.cpTargets || {});
  if (targets.length === 0) {
    return student.deskripsi || 'Menunjukkan pencapaian kompetensi yang baik sesuai kriteria ketercapaian.';
  }

  const highest = targets.filter((t) => t.targetLevel === 'Mahir' || t.skor >= 88);
  const lowest = targets.filter((t) => t.targetLevel === 'Perlu Bimbingan' || t.skor < 75);

  let narrative = '';

  if (highest.length > 0) {
    const highLabels = highest.map((h) => `${h.elementName} (${h.tpCode})`).join(', ');
    narrative += `Menunjukkan penguasaan istimewa dalam capaian ${highLabels}.`;
  } else {
    narrative += `Menunjukkan penguasaan kompetensi yang baik sesuai KKTP.`;
  }

  if (lowest.length > 0) {
    const lowLabels = lowest.map((l) => `${l.elementName} (${l.tpCode})`).join(', ');
    narrative += ` Perlu bimbingan dan penguatan lebih lanjut dalam capaian ${lowLabels}.`;
  } else {
    narrative += ` Mampu menyelesaikan seluruh target capaian pembelajaran dengan konsisten dan mandiri.`;
  }

  return narrative;
}

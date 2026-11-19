import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConsultationPrompt,
  generateContextualConsultationResponse,
} from './aiConsultationLogic';
import { initialSchoolProfile, initialCpElements, initialTujuanPembelajaran } from '../data/initialData';

test('buildConsultationPrompt incorporates BSKAP 046/2025 CP element and Bab material', () => {
  const prompt = buildConsultationPrompt({
    mode: 'deep_learning',
    schoolProfile: initialSchoolProfile,
    selectedCpElement: initialCpElements[0],
    selectedTp: initialTujuanPembelajaran[0],
  });

  assert.ok(prompt.includes('Deep Learning'));
  assert.ok(prompt.includes(initialCpElements[0].name));
  assert.ok(prompt.includes(initialTujuanPembelajaran[0].materiPokok));
});

test('buildConsultationPrompt preserves custom teacher consultation question with curriculum context', () => {
  const customQ = 'Bagaimana mengadaptasi materi ini untuk siswa kelas X SMK dengan waktu terbatas?';
  const prompt = buildConsultationPrompt({
    mode: 'cp_adaptation',
    customQuestion: customQ,
    schoolProfile: initialSchoolProfile,
    selectedCpElement: initialCpElements[1],
    selectedTp: initialTujuanPembelajaran[1],
  });

  assert.ok(prompt.includes(customQ));
  assert.ok(prompt.includes('KepKa BSKAP No. 046/H/KR/2025'));
  assert.ok(prompt.includes(initialCpElements[1].name));
});

test('generateContextualConsultationResponse returns structured 3 pillars and CP adaptation', () => {
  const result = generateContextualConsultationResponse({
    mode: 'cp_adaptation',
    schoolProfile: initialSchoolProfile,
    selectedCpElement: initialCpElements[0],
    selectedTp: initialTujuanPembelajaran[0],
  });

  assert.ok(result.summaryText.includes('KepKa BSKAP No. 046/H/KR/2025'));
  assert.ok(result.mindfulStep.includes('Mindful Inquiring'));
  assert.ok(result.meaningfulStep.includes('Meaningful Dialogue'));
  assert.ok(result.joyfulStep.includes('Joyful Celebration'));
  assert.ok(result.cpAdaptationSummary.includes(initialCpElements[0].name));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateSupabaseCredentials,
  buildDatabaseEntityInventory,
  formatBytesToKb,
  SUPABASE_CURRICULUM_SQL_SCHEMA,
} from './databaseIntegrationLogic';

test('validateSupabaseCredentials rejects missing or invalid URL and short keys', () => {
  assert.deepEqual(validateSupabaseCredentials('', 'key'), {
    valid: false,
    error: 'Project URL Supabase wajib diisi.',
  });

  assert.equal(validateSupabaseCredentials('not-a-url', '12345678901234567890').valid, false);
  assert.equal(validateSupabaseCredentials('ftp://example.supabase.co', '12345678901234567890').valid, false);
  assert.equal(validateSupabaseCredentials('https://demo.supabase.co', 'short-key').valid, false);

  const validRes = validateSupabaseCredentials(
    'https://xyzproject.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid_key'
  );
  assert.equal(validRes.valid, true);
  assert.equal(validRes.error, undefined);
});

test('buildDatabaseEntityInventory aggregates all 10 curriculum tables accurately', () => {
  const sampleState = {
    schoolProfile: { schoolName: "SMK MA'ARIF 1 SENDANG AGUNG" },
    cpElements: [{ id: '1' }, { id: '2' }, { id: '3' }, { id: '4' }],
    tujuanPembelajaran: [{ id: 'tp1' }, { id: 'tp2' }],
    rpe: {
      semester1: { months: [{ month: 'Juli' }, { month: 'Agustus' }] },
      semester2: { months: [{ month: 'Januari' }] },
    },
    prota: [{ id: 'p1' }],
    promes: [{ id: 'pr1' }, { id: 'pr2' }],
    modulAjarList: [{ id: 'm1' }],
    lkpdList: [{ id: 'l1' }],
    students: Array.from({ length: 36 }, (_, i) => ({ id: `s-${i}` })),
    kaldikEvents: [{ id: 'k1' }, { id: 'k2' }, { id: 'k3' }],
  };

  const localKeys = [
    'ADM_GURU_KURMER_2026_FINAL_profile',
    'ADM_GURU_KURMER_2026_FINAL_students',
    'ADM_GURU_KURMER_2026_FINAL_prota',
  ];

  const summary = buildDatabaseEntityInventory(sampleState, localKeys);

  assert.equal(summary.entities.length, 10);
  assert.equal(summary.totalRecords, 1 + 4 + 2 + 3 + 1 + 2 + 1 + 1 + 36 + 3);
  assert.ok(summary.totalBytes > 0);
  assert.equal(summary.entities.find((e) => e.tableColumn === 'students')?.recordCount, 36);
  assert.equal(summary.entities.find((e) => e.tableColumn === 'students')?.syncedToLocal, true);
  assert.equal(summary.entities.find((e) => e.tableColumn === 'lkpd')?.syncedToLocal, false);
});

test('formatBytesToKb formats zero and non-zero byte counts cleanly', () => {
  assert.equal(formatBytesToKb(0), '0.0 KB');
  assert.equal(formatBytesToKb(2048), '2.0 KB');
});

test('SUPABASE_CURRICULUM_SQL_SCHEMA defines curriculum_documents table with all JSONB columns', () => {
  assert.match(SUPABASE_CURRICULUM_SQL_SCHEMA, /create table if not exists curriculum_documents/i);
  assert.match(SUPABASE_CURRICULUM_SQL_SCHEMA, /cp_elements jsonb/i);
  assert.match(SUPABASE_CURRICULUM_SQL_SCHEMA, /students jsonb/i);
});

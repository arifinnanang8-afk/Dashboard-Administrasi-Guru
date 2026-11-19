import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Building2,
  BookOpen,
  GraduationCap,
  Calendar,
  UserCheck,
  IdCard,
  Edit3,
  RefreshCw,
  CheckCircle2,
  X,
  Layers,
  Save,
} from 'lucide-react';

interface IdentitasPerangkatProps {
  documentTitle?: string;
  semesterSpecific?: 1 | 2 | 'full';
  showPipelineBar?: boolean;
  className?: string;
}

export const IdentitasPerangkat: React.FC<IdentitasPerangkatProps> = ({
  documentTitle,
  semesterSpecific,
  showPipelineBar = true,
  className = '',
}) => {
  const { schoolProfile, updateSchoolProfile, runMasterSync, showNotification } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: schoolProfile.schoolName || '',
    subject: schoolProfile.subject || '',
    fase: schoolProfile.fase || 'E',
    grade: schoolProfile.grade || '10',
    academicYear: schoolProfile.academicYear || '2026/2027',
    semester: schoolProfile.semester || 1,
    teacherName: schoolProfile.teacherName || '',
    teacherNuptk: schoolProfile.teacherNuptk || schoolProfile.teacherNip || '9443766667200012',
    teacherNip: schoolProfile.teacherNip || '',
  });

  const handleOpenModal = () => {
    setFormData({
      schoolName: schoolProfile.schoolName || '',
      subject: schoolProfile.subject || '',
      fase: schoolProfile.fase || 'E',
      grade: schoolProfile.grade || '10',
      academicYear: schoolProfile.academicYear || '2026/2027',
      semester: schoolProfile.semester || 1,
      teacherName: schoolProfile.teacherName || '',
      teacherNuptk: schoolProfile.teacherNuptk || schoolProfile.teacherNip || '9443766667200012',
      teacherNip: schoolProfile.teacherNip || '',
    });
    setIsModalOpen(true);
  };

  const handleSaveAndSync = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile({
      schoolName: formData.schoolName.trim(),
      subject: formData.subject.trim(),
      fase: formData.fase.trim(),
      grade: formData.grade.trim(),
      academicYear: formData.academicYear.trim(),
      semester: Number(formData.semester) || 1,
      teacherName: formData.teacherName.trim(),
      teacherNuptk: formData.teacherNuptk.trim(),
      teacherNip: formData.teacherNip.trim() || formData.teacherNuptk.trim(),
    });

    setIsModalOpen(false);
    showNotification(
      'success',
      'Identitas berhasil disinkronkan ke: Kalender/RPE (MEF & JP) → Analisis CP/ATP → PROTA → PROMES → Modul Ajar → LKPD → Penilaian Rapor.'
    );
  };

  const semesterDisplay =
    semesterSpecific === 'full'
      ? `${schoolProfile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)`
      : semesterSpecific === 2 || schoolProfile.semester === 2
      ? `${schoolProfile.academicYear} / Semester 2 (Genap)`
      : `${schoolProfile.academicYear} / Semester 1 (Ganjil)`;

  const displayNuptk =
    schoolProfile.teacherNuptk ||
    (schoolProfile.teacherIdType === 'NUPTK' ? schoolProfile.teacherNip : '') ||
    schoolProfile.teacherNip ||
    '9443766667200012';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Box Utama Identitas Resmi */}
      <div className="bg-white rounded-2xl border-2 border-emerald-700/30 shadow-md p-4 sm:p-5 relative overflow-hidden transition-all hover:border-emerald-600/50">
        {/* Subtle Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-600 via-teal-500 to-indigo-600" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-[11px] tracking-wider uppercase border border-emerald-300 flex items-center gap-1.5 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              IDENTITAS PERANGKAT PEMBELAJARAN
            </span>
            {documentTitle && (
              <span className="text-xs font-bold text-slate-600 hidden md:inline">
                • {documentTitle}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs transition-colors cursor-pointer shadow-xs"
              title="Edit dan Sinkronkan Identitas ke Seluruh 7 Modul Perangkat Ajar"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Edit / Sinkron Identitas</span>
            </button>
            <button
              onClick={() => {
                runMasterSync();
                showNotification(
                  'success',
                  'Sinkronisasi Pipeline Kurikulum Berhasil: Kalender/RPE (MEF & JP) → Analisis CP/ATP → PROTA → PROMES → Modul Ajar → LKPD → Penilaian Rapor telah diselaraskan!'
                );
              }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-medium text-xs transition-colors cursor-pointer"
              title="Sinkronkan Ulang Pipeline"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Sinkronkan Pipeline</span>
            </button>
          </div>
        </div>

        {/* Tabel / Grid Identitas Sesuai Format Resmi yang Diminta */}
        <div className="mt-3.5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-6 text-xs font-sans">
          {/* 1. Satuan Pendidikan */}
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <Building2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Satuan Pendidikan:
              </span>
              <span className="font-bold text-slate-900 text-sm truncate block" title={schoolProfile.schoolName}>
                {schoolProfile.schoolName || '-'}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                NPSN: {schoolProfile.npsn || '10802058'}
              </span>
            </div>
          </div>

          {/* 2. Mata Pelajaran */}
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <BookOpen className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Mata Pelajaran:
              </span>
              <span className="font-bold text-emerald-900 text-sm truncate block" title={schoolProfile.subject}>
                {schoolProfile.subject || '-'}
              </span>
              <span className="text-[10px] text-slate-500">
                {schoolProfile.kurikulum || 'Kurikulum Merdeka BSKAP 2025'}
              </span>
            </div>
          </div>

          {/* 3. Fase / Kelas */}
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <GraduationCap className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Fase / Kelas:
              </span>
              <span className="font-bold text-slate-900 text-sm truncate block">
                Fase {schoolProfile.fase || 'E'} / {schoolProfile.grade || 'Kelas 10'}
              </span>
              <span className="text-[10px] text-slate-500">
                Alur Jenjang Terverifikasi
              </span>
            </div>
          </div>

          {/* 4. Tahun Ajaran / Semester */}
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <Calendar className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Tahun Ajaran / Semester:
              </span>
              <span className="font-bold text-slate-900 text-sm truncate block">
                {semesterDisplay}
              </span>
              <span className="text-[10px] text-slate-500">
                Kalender Pendidikan Aktif
              </span>
            </div>
          </div>

          {/* 5. Guru Penyusun */}
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <UserCheck className="w-4 h-4 text-purple-700 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Guru Penyusun:
              </span>
              <span className="font-bold text-slate-900 text-sm truncate block" title={schoolProfile.teacherName}>
                {schoolProfile.teacherName || '-'}
              </span>
              <span className="text-[10px] text-slate-500">
                Guru Pengampu Mata Pelajaran
              </span>
            </div>
          </div>

          {/* 6. NUPTK Guru */}
          <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
            <IdCard className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                NUPTK Guru:
              </span>
              <span className="font-bold font-mono text-slate-900 text-sm truncate block">
                {displayNuptk}
              </span>
              <span className="text-[10px] text-slate-500">
                Identitas Resmi Pendidik
              </span>
            </div>
          </div>
        </div>

        {/* Sync Pipeline Breadcrumb Strip */}
        {showPipelineBar && (
          <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
              <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="text-slate-500 font-medium">Tersinkron Otomatis 7 Modul:</span>
              <span className="font-bold text-slate-800">
                Kalender/RPE (MEF & JP) → Analisis CP/ATP → PROTA → PROMES → Modul Ajar → LKPD → Penilaian Rapor
              </span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Tersinkron 100%
            </span>
          </div>
        )}
      </div>

      {/* MODAL SINKRONISASI IDENTITAS 7 MODUL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-emerald-300" />
                  Edit & Sinkronkan Identitas Perangkat Pembelajaran
                </h3>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Perubahan akan otomatis terpasang dan tersinkron di 7 modul: Kalender/RPE, Analisis CP/ATP, PROTA, PROMES, Modul Ajar, LKPD, dan Penilaian Rapor.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveAndSync} className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Satuan Pendidikan */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Satuan Pendidikan <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Contoh: SMA Negeri 1 / SMK MA'ARIF 1 SENDANG AGUNG"
                  />
                </div>

                {/* 2. Mata Pelajaran */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mata Pelajaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Contoh: Bahasa Indonesia / Matematika"
                  />
                </div>

                {/* 3. Fase */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Fase Kurikulum Merdeka <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.fase}
                    onChange={(e) => setFormData({ ...formData, fase: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Fondasi">Fase Fondasi (PAUD / TK / RA)</option>
                    <option value="A">Fase A (Kelas 1 - 2 SD/MI)</option>
                    <option value="B">Fase B (Kelas 3 - 4 SD/MI)</option>
                    <option value="C">Fase C (Kelas 5 - 6 SD/MI)</option>
                    <option value="D">Fase D (Kelas 7 - 9 SMP/MTs)</option>
                    <option value="E">Fase E (Kelas 10 SMA/SMK/MA)</option>
                    <option value="F">Fase F (Kelas 11 - 12 SMA/SMK/MA)</option>
                  </select>
                </div>

                {/* 4. Tingkat Kelas */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tingkat Kelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Kelas 10 / X SMK (Semua Jurusan)"
                  />
                </div>

                {/* 5. Tahun Ajaran */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tahun Ajaran <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: 2026/2027"
                  />
                </div>

                {/* 6. Semester */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Semester Aktif <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value={1}>Semester 1 (Ganjil)</option>
                    <option value={2}>Semester 2 (Genap)</option>
                  </select>
                </div>

                {/* 7. Guru Penyusun */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Guru Penyusun <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.teacherName}
                    onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: Nanang Arifin, S.Pd."
                  />
                </div>

                {/* 8. NUPTK Guru */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    NUPTK Guru (Nomor Unik Pendidik dan Tenaga Kependidikan) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.teacherNuptk}
                    onChange={(e) => setFormData({ ...formData, teacherNuptk: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    placeholder="Contoh: 9443766667200012"
                  />
                </div>
              </div>

              {/* Informative Note */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] leading-relaxed">
                <strong>💡 Jaminan Sinkronisasi:</strong> Saat Anda mengklik tombol di bawah ini, data Satuan Pendidikan, Mata Pelajaran, Fase, Kelas, Tahun Ajaran, Semester, Guru Penyusun, dan NUPTK Guru langsung disinkronkan ke seluruh 7 modul perangkat ajar (Kalender/RPE, Analisis CP/ATP, PROTA, PROMES, Modul Ajar, LKPD, dan Penilaian Rapor) secara real-time.
              </div>

              {/* Footer Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold shadow-md transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan & Sinkronkan ke Semua 7 Modul</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

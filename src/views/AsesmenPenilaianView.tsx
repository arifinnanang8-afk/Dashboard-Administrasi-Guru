import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GraduationCap,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Search,
  Target,
  RefreshCw,
  Sparkles,
  Zap,
  BookOpen,
  FileCheck,
} from 'lucide-react';
import { StudentRecord } from '../types';
import { exportGradesToExcel, exportAsesmenToWord } from '../utils/exporter';
import { PipelineSyncHeader } from '../components/PipelineSyncHeader';
import { IdentitasPerangkat } from '../components/IdentitasPerangkat';
import { initialStudents } from '../data/initialData';
import { generateCpNarrativeDescription } from '../utils/cpMappingLogic';

export const AsesmenPenilaianView: React.FC = () => {
  const {
    students,
    updateStudent,
    addStudent,
    deleteStudent,
    schoolProfile,
    stats,
    setActiveView,
    openPrintModal,
    showNotification,
    syncAllCpTargetsToAssessment,
    pullAssessmentScoresToCpTargets,
    cpElements,
    selectedBook,
  } = useApp();

  const [searchStudent, setSearchStudent] = useState('');
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const handleAutoGenerate36Students = () => {
    setIsGenerating(true);
    const subjectName = schoolProfile.subject || 'Bahasa Indonesia';
    const bookTitle = selectedBook?.judulBuku || 'Buku Teks Utama Edisi Revisi BSKAP 046/2025';

    // Ensure baseline of 36 students
    const baseList = students && students.length >= 36 ? students : initialStudents;

    baseList.slice(0, 36).forEach((std, idx) => {
      const seed = (idx * 7 + 13) % 25;
      const baseScore = Math.min(98, Math.max(72, 82 + (seed % 15) - 3));

      const formatifScores = {
        'TP 10.1': Math.min(100, Math.max(70, baseScore + (idx % 5) - 2)),
        'TP 10.2': Math.min(100, Math.max(70, baseScore + (idx % 3) - 1)),
        'TP 10.3': Math.min(100, Math.max(70, baseScore + (idx % 4) - 2)),
        'TP 10.4': Math.min(100, Math.max(70, baseScore + (idx % 6) - 3)),
        'TP 10.5': Math.min(100, Math.max(70, baseScore + (idx % 2) - 1)),
        'TP 10.6': Math.min(100, Math.max(70, baseScore + (idx % 5) - 2)),
        'TP 10.7': Math.min(100, Math.max(70, baseScore + (idx % 3) - 1)),
      };

      const sumatifLmScores = {
        'Bab 1': Math.min(100, Math.max(70, baseScore + 1)),
        'Bab 2': Math.min(100, Math.max(70, baseScore - 1)),
        'Bab 3': Math.min(100, Math.max(70, baseScore + 2)),
        'Bab 4': Math.min(100, Math.max(70, baseScore)),
        'Bab 5': Math.min(100, Math.max(70, baseScore + 1)),
        'Bab 6': Math.min(100, Math.max(70, baseScore - 2)),
        'Bab 7': Math.min(100, Math.max(70, baseScore)),
      };

      const sumatifAkhir = baseScore;
      const avgF = Object.values(formatifScores).reduce((a, b) => a + b, 0) / 7;
      const finalScore = Math.round(avgF * 0.5 + sumatifAkhir * 0.5);

      const pred = finalScore >= 88 ? 'A' : finalScore >= 78 ? 'B' : finalScore >= 75 ? 'C' : 'D';
      const kktp = finalScore >= (schoolProfile.kktpThreshold || 75) ? 'Tuntas' : 'Perlu Bimbingan';

      const narrative = generateCpNarrativeDescription(
        { ...std, formatifScores, sumatifLmScores, sumatifAkhir, nilaiAkhir: finalScore },
        cpElements || []
      );

      const updatedStd: StudentRecord = {
        ...std,
        formatifScores,
        sumatifLmScores,
        sumatifAkhir,
        nilaiAkhir: finalScore,
        predikat: pred as 'A' | 'B' | 'C' | 'D',
        kktpStatus: kktp as 'Tuntas' | 'Perlu Bimbingan',
        deskripsi: narrative || `Menunjukkan penguasaan sangat baik pada materi ${subjectName} dari buku ${bookTitle}.`,
      };

      updateStudent(updatedStd);
    });

    setTimeout(() => {
      setIsGenerating(false);
      showNotification(
        'success',
        `⚡ Generator Asesmen Berhasil: Penilaian Formatif & Sumatif untuk seluruh 36 siswa telah dibuat instan dan disinkronkan dengan materi buku "${bookTitle}"!`
      );
    }, 600);
  };

  const [newStudent, setNewStudent] = useState<Partial<StudentRecord>>({
    nisn: `00812340${students.length + 1}`,
    name: '',
    gender: 'L',
    sumatifAkhir: 85,
    nilaiAkhir: 85,
    predikat: 'A',
    kktpStatus: 'Tuntas',
    deskripsi: 'Menunjukkan penguasaan sangat baik dalam seluruh kompetensi.',
  });

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchStudent.toLowerCase()) ||
      s.nisn.includes(searchStudent)
  );

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    // Recalculate Final score & predicate
    const fScores = Object.values(editingStudent.formatifScores || {});
    const avgF = fScores.length ? fScores.reduce((a, b) => a + b, 0) / fScores.length : 80;
    const finalScore = Math.round(avgF * 0.5 + (editingStudent.sumatifAkhir || 80) * 0.5);

    const updated: StudentRecord = {
      ...editingStudent,
      nilaiAkhir: finalScore,
      predikat: finalScore >= 88 ? 'A' : finalScore >= 78 ? 'B' : finalScore >= 75 ? 'C' : 'D',
      kktpStatus: finalScore >= 75 ? 'Tuntas' : 'Perlu Bimbingan',
    };

    updateStudent(updated);
    setEditingStudent(null);
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name) {
      showNotification('error', 'Nama siswa wajib diisi.');
      return;
    }
    const finalScore = Number(newStudent.nilaiAkhir) || 85;
    const created: StudentRecord = {
      id: `std-${Date.now()}`,
      nisn: newStudent.nisn || `00812340${students.length + 1}`,
      name: newStudent.name || '',
      gender: (newStudent.gender as any) || 'L',
      formatifScores: { 'TP 10.1': 85, 'TP 10.2': 85, 'TP 10.3': 85, 'TP 10.4': 85, 'TP 10.5': 85, 'TP 10.6': 85, 'TP 10.7': 85 },
      sumatifLmScores: { 'Bab 1': 85, 'Bab 2': 85, 'Bab 3': 85, 'Bab 4': 85, 'Bab 5': 85, 'Bab 6': 85, 'Bab 7': 85 },
      sumatifAkhir: Number(newStudent.sumatifAkhir) || 85,
      nilaiAkhir: finalScore,
      predikat: finalScore >= 88 ? 'A' : finalScore >= 78 ? 'B' : finalScore >= 75 ? 'C' : 'D',
      kktpStatus: finalScore >= 75 ? 'Tuntas' : 'Perlu Bimbingan',
      deskripsi: newStudent.deskripsi || 'Menunjukkan pencapaian kompetensi yang baik.',
    };
    addStudent(created);
    setIsAddOpen(false);
  };

  return (
    <div className="space-y-6">
      <PipelineSyncHeader />
      <IdentitasPerangkat
        documentTitle="Pengolahan Asesmen & Penilaian Rapor Siswa"
        semesterSpecific={schoolProfile.semester as 1 | 2}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('dashboard')}
            title="Kembali ke Dashboard"
            aria-label="Kembali ke Dashboard"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-teal-600" />
              Asesmen & Pengolahan Nilai Rapor Siswa
            </h2>
            <p className="text-xs text-slate-500">
              Pengolahan Otomatis Formatif, Sumatif Lingkup Materi, Sumatif Akhir & KKTP
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-700 hover:bg-teal-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>

          <button
            onClick={() => {
              exportGradesToExcel(students, schoolProfile);
              showNotification('success', 'Rekap Penilaian Rapor berhasil diekspor ke Excel (.xlsx)!');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Ekspor Rekap Nilai Rapor ke Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Ekspor Excel</span>
          </button>

          <button
            onClick={async () => {
              await exportAsesmenToWord(
                students,
                schoolProfile,
                `REKAP_NILAI_ASESMEN_RAPOR_${schoolProfile.subject.replace(/\s+/g, '_')}.docx`
              );
              showNotification('success', 'Tabel Rekap Nilai Rapor berhasil diunduh ke Word (.docx)!');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Unduh Word</span>
          </button>

          <button
            onClick={() => {
              syncAllCpTargetsToAssessment();
              showNotification('success', 'Nilai asesmen formatif & nilai akhir berhasil disinkronkan dari Pemetaan Capaian Target CP!');
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Sinkronkan pemetaan capaian target CP per siswa ke formatif & nilai akhir rapor"
          >
            <Target className="w-4 h-4 text-purple-600" />
            <span>Sinkron Target CP</span>
          </button>

          <button
            onClick={() => {
              pullAssessmentScoresToCpTargets();
              showNotification('info', 'Target CP telah ditarik dan diselaraskan dari nilai asesmen siswa saat ini.');
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Tarik nilai formatif asesmen saat ini ke capaian target CP siswa"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            <span>Tarik ke Target</span>
          </button>

          <button
            onClick={() => openPrintModal('asesmen')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer"
            title="Cetak Dokumen atau Ekspor ke PDF"
          >
            <Printer className="w-4 h-4" />
            <span>Ekspor PDF / Cetak</span>
          </button>
        </div>
      </div>

      {/* Generator Asesmen Formatif & Sumatif Otomatis Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-extrabold text-[10px] uppercase tracking-wider border border-teal-400/30">
              Otomatisasi Kurikulum Merdeka BSKAP 2025
            </span>
            <span className="text-xs font-bold text-slate-400">
              36 Siswa Kelas {schoolProfile.grade}
            </span>
          </div>
          <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <span>Generator Asesmen Formatif &amp; Sumatif 36 Siswa (Disinkronkan Buku Teks)</span>
          </h3>
          <p className="text-xs text-slate-300">
            Materi Rujukan Buku Teks: <b className="text-cyan-300">{selectedBook?.judulBuku || 'Buku Teks Utama Edisi Revisi BSKAP 046/2025'}</b> ({selectedBook?.penerbit || 'Pusat Perbukuan Kemendikdasmen RI'})
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoGenerate36Students}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Zap className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
          <span>{isGenerating ? 'Mengolah 36 Siswa...' : '⚡ Generate Penilaian 36 Siswa Instan'}</span>
        </button>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 uppercase">Jumlah Siswa Terdaftar</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{students.length} Siswa</p>
          <span className="text-[11px] text-slate-500">Kelas {schoolProfile.grade}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-600 uppercase">Ketuntasan KKTP</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{stats.masteryRate}%</p>
          <span className="text-[11px] text-emerald-700 font-semibold">23 Tuntas · 1 Bimbingan</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-blue-600 uppercase">Rata-rata Nilai Kelas</span>
          <p className="text-2xl font-black text-blue-700 mt-1">{stats.classAverage}</p>
          <span className="text-[11px] text-slate-500">Skala 0 - 100</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-[11px] font-bold text-purple-600 uppercase">Batas Tuntas KKTP</span>
          <p className="text-2xl font-black text-purple-700 mt-1">{schoolProfile.kktpThreshold?.toFixed(1) || '75.0'}</p>
          <span className="text-[11px] text-slate-500">Kriteria Ketercapaian TP</span>
        </div>
      </div>

      {/* Roster Table with Search */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">
            Daftar Nilai Asesmen & Capaian Rapor Siswa
          </h3>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau NISN..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 uppercase tracking-wider text-[11px]">
                <th className="p-2.5 border-b text-center">No</th>
                <th className="p-2.5 border-b">NISN</th>
                <th className="p-2.5 border-b">Nama Peserta Didik</th>
                <th className="p-2.5 border-b text-center">L/P</th>
                <th className="p-2.5 border-b text-center">TP 1</th>
                <th className="p-2.5 border-b text-center">TP 2</th>
                <th className="p-2.5 border-b text-center">TP 3</th>
                <th className="p-2.5 border-b text-center">TP 4</th>
                <th className="p-2.5 border-b text-center">TP 5</th>
                <th className="p-2.5 border-b text-center">TP 6</th>
                <th className="p-2.5 border-b text-center">TP 7</th>
                <th className="p-2.5 border-b text-center">Sumatif</th>
                <th className="p-2.5 border-b text-center bg-emerald-50 font-bold">Nilai Akhir</th>
                <th className="p-2.5 border-b text-center">Predikat</th>
                <th className="p-2.5 border-b text-center">KKTP</th>
                <th className="p-2.5 border-b text-center">Target CP</th>
                <th className="p-2.5 border-b text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.map((s, idx) => (
                <tr key={s.id} className="hover:bg-slate-50/80">
                  <td className="p-2.5 border-b text-center text-slate-500 font-medium">{idx + 1}</td>
                  <td className="p-2.5 border-b font-mono text-[11px] text-slate-600">{s.nisn}</td>
                  <td className="p-2.5 border-b font-bold text-slate-900 whitespace-nowrap">
                    {s.name}
                  </td>
                  <td className="p-2.5 border-b text-center text-slate-600">{s.gender}</td>
                  <td className="p-2.5 border-b text-center">{s.formatifScores['TP 10.1'] || '-'}</td>
                  <td className="p-2.5 border-b text-center">{s.formatifScores['TP 10.2'] || '-'}</td>
                  <td className="p-2.5 border-b text-center">{s.formatifScores['TP 10.3'] || '-'}</td>
                  <td className="p-2.5 border-b text-center">{s.formatifScores['TP 10.4'] || '-'}</td>
                  <td className="p-2.5 border-b text-center">{s.formatifScores['TP 10.5'] || '-'}</td>
                  <td className="p-2.5 border-b text-center">{s.formatifScores['TP 10.6'] || '-'}</td>
                  <td className="p-2.5 border-b text-center">{s.formatifScores['TP 10.7'] || '-'}</td>
                  <td className="p-2.5 border-b text-center font-semibold text-slate-800">
                    {s.sumatifAkhir}
                  </td>
                  <td className="p-2.5 border-b text-center font-black text-sm bg-emerald-50/70 text-emerald-950">
                    {s.nilaiAkhir}
                  </td>
                  <td className="p-2.5 border-b text-center font-bold">
                    <span
                      className={`px-2 py-0.5 rounded ${
                        s.predikat === 'A'
                          ? 'bg-emerald-100 text-emerald-800'
                          : s.predikat === 'B'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {s.predikat}
                    </span>
                  </td>
                  <td className="p-2.5 border-b text-center whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.kktpStatus === 'Tuntas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {s.kktpStatus === 'Tuntas' ? (
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-rose-600" />
                      )}
                      {s.kktpStatus}
                    </span>
                  </td>
                  <td className="p-2.5 border-b text-center whitespace-nowrap">
                    {s.cpTargets && Object.keys(s.cpTargets).length > 0 ? (
                      <button
                        onClick={() => setActiveView('dashboard')}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors cursor-pointer"
                        title={`${Object.keys(s.cpTargets).length} TP dipetakan. Buka Pemetaan Target CP`}
                      >
                        <Target className="w-3 h-3 text-purple-600" />
                        <span>{Object.keys(s.cpTargets).length} TP</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setActiveView('dashboard')}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-slate-400 hover:text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
                        title="Belum ada target CP dipetakan. Klik untuk petakan di Dashboard"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        <span>Petakan</span>
                      </button>
                    )}
                  </td>
                  <td className="p-2.5 border-b text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditingStudent(s)}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-600 cursor-pointer"
                        title="Edit Nilai"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteStudent(s.id)}
                        className="p-1 rounded-lg hover:bg-rose-100 text-rose-600 cursor-pointer"
                        title="Hapus Siswa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border space-y-4 animate-scale-up text-xs"
          >
            <h3 className="text-base font-bold text-slate-900">
              Edit Nilai Rapor: {editingStudent.name}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Nama Siswa</label>
                <input
                  type="text"
                  value={editingStudent.name}
                  onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">NISN</label>
                <input
                  type="text"
                  value={editingStudent.nisn}
                  onChange={(e) => setEditingStudent({ ...editingStudent, nisn: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="font-bold text-slate-700 block mb-1">Nilai Formatif TP:</span>
              <div className="grid grid-cols-4 gap-2">
                {['TP 10.1', 'TP 10.2', 'TP 10.3', 'TP 10.4', 'TP 10.5', 'TP 10.6', 'TP 10.7'].map(
                  (tpCode) => (
                    <div key={tpCode}>
                      <span className="text-[10px] text-slate-500 font-mono block">{tpCode}</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={editingStudent.formatifScores[tpCode] || 80}
                        onChange={(e) =>
                          setEditingStudent({
                            ...editingStudent,
                            formatifScores: {
                              ...editingStudent.formatifScores,
                              [tpCode]: parseInt(e.target.value, 10) || 0,
                            },
                          })
                        }
                        className="w-full px-2 py-1 border rounded-lg text-center font-bold"
                      />
                    </div>
                  )
                )}
                <div>
                  <span className="text-[10px] text-slate-500 font-mono block font-bold text-emerald-800">
                    Sumatif Akhir
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingStudent.sumatifAkhir}
                    onChange={(e) =>
                      setEditingStudent({
                        ...editingStudent,
                        sumatifAkhir: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-2 py-1 border rounded-lg text-center font-bold bg-emerald-50 text-emerald-900"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Deskripsi Capaian Kompetensi (Rapor)
              </label>
              <textarea
                rows={2}
                value={editingStudent.deskripsi}
                onChange={(e) =>
                  setEditingStudent({ ...editingStudent, deskripsi: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl font-semibold cursor-pointer"
              >
                Simpan Nilai
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Student Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddNew}
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border space-y-4 animate-scale-up text-xs"
          >
            <h3 className="text-base font-bold text-slate-900">Tambah Peserta Didik Baru</h3>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Nama Lengkap Siswa</label>
              <input
                type="text"
                placeholder="Contoh: Dimas Wahyu..."
                value={newStudent.name}
                onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">NISN</label>
                <input
                  type="text"
                  value={newStudent.nisn}
                  onChange={(e) => setNewStudent({ ...newStudent, nisn: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Jenis Kelamin</label>
                <select
                  value={newStudent.gender}
                  onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-xl"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white rounded-xl font-semibold cursor-pointer"
              >
                Tambah Siswa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

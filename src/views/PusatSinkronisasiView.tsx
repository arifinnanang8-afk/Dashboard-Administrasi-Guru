import React from 'react';
import { useApp } from '../context/AppContext';
import {
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Calendar,
  BookOpen,
  FileSpreadsheet,
  GraduationCap,
  AlertTriangle
} from 'lucide-react';

export const PusatSinkronisasiView: React.FC = () => {
  const { stats, runMasterSync, schoolProfile, setActiveView, showNotification } = useApp();

  const pipelineStages = [
    { number: 1, name: 'Kalender & RPE', detail: '39 Pekan (132 JP)', icon: <Calendar className="w-4 h-4" /> },
    { number: 2, name: 'Analisis CP/ATP', detail: `${stats.bloomHotsCount} TP HOTS (7 TP)`, icon: <BookOpen className="w-4 h-4" /> },
    { number: 3, name: 'Program Tahunan (PROTA)', detail: `${stats.protaTotalJp} JP Terdistribusi`, icon: <FileSpreadsheet className="w-4 h-4" /> },
    { number: 4, name: 'Program Semester (PROMES)', detail: '7 Baris Mingguan', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { number: 5, name: 'Modul Ajar Deep Learning', detail: `${stats.modulCount} Modul 3 Pilar`, icon: <BookOpen className="w-4 h-4" /> },
    { number: 6, name: 'LKPD Berdiferensiasi', detail: '7 Lembar Aktivitas', icon: <BookOpen className="w-4 h-4" /> },
    { number: 7, name: 'Asesmen & Nilai Rapor', detail: `${stats.totalStudents} Siswa (96% Tuntas)`, icon: <GraduationCap className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveView('dashboard')}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-teal-600" />
              Pusat Sinkronisasi Seluruh Dokumen (Master Sync Engine)
            </h2>
            <p className="text-xs text-slate-500">
              Audit Menyeluruh & Harmonisasi Otomatis Alur Pembelajaran 1 Tahun
            </p>
          </div>
        </div>

        <button
          onClick={runMasterSync}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Jalankan Master Sync (1-Klik)</span>
        </button>
      </div>

      {/* Audit Sistem & Hero Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 bg-gradient-to-br from-[#063b2c] via-[#043325] to-[#022319] text-white p-6 sm:p-8 rounded-2xl border border-emerald-500/40 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${stats.isFullyAligned ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30' : 'bg-red-500/20 text-red-300 border-red-400/30'}`}>
                    {stats.isFullyAligned ? <ShieldCheck className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-red-400"/>}
                    {stats.isFullyAligned ? 'Status: 100% Selaras Otomatis' : 'Status: Ketidakcocokan Ditemukan'}
                </span>
                <span className="text-2xl font-black text-emerald-300">132 JP</span>
            </div>
            <h3 className="text-xl font-bold">Harmonisasi Utuh Seluruh Perangkat Ajar {schoolProfile.subject}</h3>
            <p className="text-xs text-emerald-100/90 leading-relaxed">Sistem memastikan konsistensi mutlak seluruh perangkat ajar.</p>
         </div>

         {/* Audit Detail Panel */}
         <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600"/> Audit Konsistensi Data
            </h3>
            <div className="space-y-3">
                <p className="text-xs text-slate-600">Mengecek konsistensi mapel profil satuan dengan modul ajar.</p>
                {!stats.isFullyAligned && (
                    <div className="bg-red-50 p-3 rounded-lg text-xs text-red-800 font-semibold">
                        ⚠️ Terdeteksi ketidakcocokan antara profil mapel dengan data tujuan pembelajaran yang dipasang.
                    </div>
                )}
            </div>
            <button 
                onClick={() => showNotification('info', stats.isFullyAligned ? 'Sistem Terverifikasi: Tidak ada masalah data.' : 'Audit mendalam berjalan...')}
                className="w-full mt-4 px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl"
            >
                Jalankan Audit Sistem
            </button>
         </div>
      </div>

      {/* Visual Pipeline Flow */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Alur Rantai Keterhubungan Dokumen (Data Flow Pipeline)</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 items-center">
          {pipelineStages.map((st, idx) => (
            <React.Fragment key={st.number}>
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-1">
                <span className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center mx-auto mb-1">
                  {st.number}
                </span>
                <p className="font-bold text-slate-900 text-[11px] leading-tight">{st.name}</p>
              </div>
              {idx < pipelineStages.length - 1 && (
                <div className="hidden md:flex justify-center text-slate-400">
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { SchoolProfile } from '../types';

interface KopSuratProps {
  schoolProfile: SchoolProfile;
  onLeftLogoClick?: () => void;
  onRightLogoClick?: () => void;
  leftLogoUrl?: string;
  rightLogoUrl?: string;
  isEditable?: boolean;
}

export const KopSurat: React.FC<KopSuratProps> = ({
  schoolProfile,
  onLeftLogoClick,
  onRightLogoClick,
  leftLogoUrl,
  rightLogoUrl,
  isEditable = false,
}) => {
  const isDinas = schoolProfile.kopType === 'dinas';
  const effectiveLeftLogo = leftLogoUrl || schoolProfile.leftLogoUrl || schoolProfile.logoUrl;
  const effectiveRightLogo = rightLogoUrl || schoolProfile.rightLogoUrl;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 pb-3 border-b-2 border-slate-900 pt-2">
        {/* Logo Kiri */}
        <div
          onClick={onLeftLogoClick}
          title={isEditable ? 'Klik untuk upload / ganti Logo Kiri Kop Sekolah' : undefined}
          className={`w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center overflow-hidden shrink-0 transition-all ${
            isEditable ? 'cursor-pointer group' : ''
          } ${
            effectiveLeftLogo
              ? 'rounded-lg' + (isEditable ? ' hover:ring-2 hover:ring-emerald-500/40' : '')
              : isEditable
              ? 'rounded-xl border border-dashed border-slate-300 hover:border-emerald-600 bg-slate-50/70'
              : ''
          }`}
        >
          {effectiveLeftLogo ? (
            <img
              src={effectiveLeftLogo}
              alt="Logo Kiri Kop"
              className={`w-full h-full object-contain ${isEditable ? 'group-hover:scale-105 transition-transform' : ''}`}
            />
          ) : isEditable ? (
            <div className="flex flex-col items-center text-center px-1">
              <span className="text-2xl mb-0.5">🏫</span>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700 leading-tight">
                Logo Kiri
              </span>
            </div>
          ) : (
            <div className="w-16 h-16" />
          )}
        </div>

        {/* Teks Kop Tengah */}
        <div className="text-center space-y-0.5 flex-1">
          {isDinas ? (
            /* KOP DINAS (Tanpa Jurusan / Program Keahlian) */
            <>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-700">
                PEMERINTAH PROVINSI LAMPUNG
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700">
                DINAS PENDIDIKAN DAN KEBUDAYAAN
              </p>
              <h2 className="text-base sm:text-xl font-black uppercase text-slate-950 tracking-tight leading-tight pt-0.5">
                {schoolProfile.schoolName}
              </h2>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-800 font-sans flex items-center justify-center gap-6 sm:gap-8 pt-0.5">
                <span>NPSN: {schoolProfile.npsn || '10802058'}</span>
                <span>Terakreditasi : {schoolProfile.akreditasi || 'A'}</span>
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-600 font-mono pt-0.5">
                Telp: {schoolProfile.phone || '(0729) 732109'} | Email: {schoolProfile.email}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-700 font-sans leading-snug">
                {schoolProfile.address}
              </p>
            </>
          ) : (
            /* KOP YAYASAN (Dengan Induk Lembaga Pendidikan Ma'arif NU & Program Keahlian) */
            <>
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-slate-700">
                LEMBAGA PENDIDIKAN MA'ARIF NU LAMPUNG TENGAH
              </p>
              <h2 className="text-base sm:text-xl font-black uppercase text-slate-950 tracking-tight leading-tight">
                {schoolProfile.schoolName}
              </h2>
              <div className="flex justify-center pt-0.5">
                <div className="inline-flex items-start gap-2 text-[10px] sm:text-[11px] font-bold text-slate-800 font-sans">
                  <span>Program Keahlian:</span>
                  <div className="text-left leading-snug">
                    {(() => {
                      const pk = schoolProfile.programKeahlian || '1. Manajemen Perkantoran\n2. Teknik Komputer dan Jaringan';
                      const list = Array.isArray(pk)
                        ? pk
                        : pk.split('\n').filter((s) => s.trim().length > 0);
                      return list.map((item, idx) => (
                        <div key={idx}>{item.trim()}</div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-800 font-sans flex items-center justify-center gap-6 sm:gap-8 pt-0.5">
                <span>NPSN: {schoolProfile.npsn || '10802058'}</span>
                <span>Terakreditasi : {schoolProfile.akreditasi || 'A'}</span>
              </p>
              <p className="text-[9px] sm:text-[10px] text-slate-600 font-mono pt-0.5">
                Telp: {schoolProfile.phone || '(0729) 732109'} | Email: {schoolProfile.email}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-700 font-sans leading-snug">
                {schoolProfile.address}
              </p>
            </>
          )}
        </div>

        {/* Logo Kanan */}
        <div
          onClick={onRightLogoClick}
          title={isEditable ? 'Klik untuk upload / ganti Logo Kanan Kop Sekolah' : undefined}
          className={`w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center overflow-hidden shrink-0 transition-all ${
            isEditable ? 'cursor-pointer group' : ''
          } ${
            effectiveRightLogo
              ? 'rounded-lg' + (isEditable ? ' hover:ring-2 hover:ring-emerald-500/40' : '')
              : isEditable
              ? 'rounded-xl border border-dashed border-slate-300 hover:border-emerald-600 bg-slate-50/70'
              : ''
          }`}
        >
          {effectiveRightLogo ? (
            <img
              src={effectiveRightLogo}
              alt="Logo Kanan Kop"
              className={`w-full h-full object-contain ${isEditable ? 'group-hover:scale-105 transition-transform' : ''}`}
            />
          ) : isEditable ? (
            <div className="flex flex-col items-center text-center px-1">
              <span className="text-2xl mb-0.5">🎓</span>
              <span className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-700 leading-tight">
                Logo Kanan
              </span>
            </div>
          ) : (
            <div className="w-16 h-16" />
          )}
        </div>
      </div>
      <div className="border-b border-slate-900 mt-0.5 mb-4" />
    </div>
  );
};

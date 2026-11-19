import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Building2, ArrowLeft, Save, Upload, Trash2 } from 'lucide-react';
import { SchoolProfile } from '../types';
import { KopSurat } from '../components/KopSurat';

export const ProfilSatuanView: React.FC = () => {
  const { schoolProfile, updateSchoolProfile, setActiveView, showNotification } = useApp();
  const [formData, setFormData] = useState<SchoolProfile>(schoolProfile);
  const leftLogoInputRef = useRef<HTMLInputElement>(null);
  const rightLogoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFile = (side: 'left' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showNotification('error', 'File harus berupa gambar (PNG, JPG, SVG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64Url = reader.result as string;
      if (side === 'left') {
        const next = { ...formData, leftLogoUrl: base64Url, logoUrl: formData.logoUrl || base64Url };
        setFormData(next);
        updateSchoolProfile({ leftLogoUrl: base64Url, logoUrl: formData.logoUrl || base64Url });
        showNotification('success', 'Logo Kiri Kop Sekolah berhasil diupload.');
      } else {
        const next = { ...formData, rightLogoUrl: base64Url };
        setFormData(next);
        updateSchoolProfile({ rightLogoUrl: base64Url });
        showNotification('success', 'Logo Kanan Kop Sekolah berhasil diupload.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSchoolProfile(formData);
    showNotification('success', 'Identitas Sekolah & Kop Surat berhasil diperbarui.');
  };

  return (
    <div className="space-y-6">
      <input
        type="file"
        ref={leftLogoInputRef}
        onChange={(e) => handleLogoFile('left', e)}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={rightLogoInputRef}
        onChange={(e) => handleLogoFile('right', e)}
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        className="hidden"
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
              <Building2 className="w-5 h-5 text-rose-600" />
              Profil Satuan Pendidikan & Standar Kop Surat Resmi
            </h2>
            <p className="text-xs text-slate-500">
              Pengaturan Induk Identitas Sekolah, Logo Kop Kiri & Kanan, Guru, Kepala Sekolah, dan Format Dokumen
            </p>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Perubahan Identitas</span>
        </button>
      </div>

      {/* Kop Surat Live Preview */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-300 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pratinjau Kop Surat Resmi Dokumen A4 (Klik Logo Kiri / Kanan untuk Mengganti)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => leftLogoInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Logo Kiri</span>
            </button>
            <button
              type="button"
              onClick={() => rightLogoInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Logo Kanan</span>
            </button>
          </div>
        </div>

        <div className="border border-slate-200 p-6 rounded-xl bg-slate-50/50 relative space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Format Kop Surat Resmi:
            </span>
            <div className="inline-flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, kopType: 'yayasan' }));
                  updateSchoolProfile({ kopType: 'yayasan' });
                  showNotification('success', 'Kop Yayasan (LP Ma\'arif NU & Program Keahlian) aktif & tersinkron!');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  (formData.kopType || schoolProfile.kopType || 'yayasan') === 'yayasan'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Kop Yayasan (Ma'arif NU)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData((prev) => ({ ...prev, kopType: 'dinas' }));
                  updateSchoolProfile({ kopType: 'dinas' });
                  showNotification('success', 'Kop Dinas (Tanpa Jurusan) aktif & tersinkron!');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  (formData.kopType || schoolProfile.kopType) === 'dinas'
                    ? 'bg-emerald-800 text-white shadow-xs'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Kop Dinas (Tanpa Jurusan)
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <KopSurat
              schoolProfile={{
                ...schoolProfile,
                ...formData,
                kopType: formData.kopType || schoolProfile.kopType || 'yayasan',
              }}
              onLeftLogoClick={() => leftLogoInputRef.current?.click()}
              onRightLogoClick={() => rightLogoInputRef.current?.click()}
              leftLogoUrl={formData.leftLogoUrl || formData.logoUrl}
              rightLogoUrl={formData.rightLogoUrl}
              isEditable={true}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 max-w-3xl mx-auto px-1">
            <span>Klik logo kiri atau kanan untuk mengganti</span>
            <span className="font-semibold text-emerald-800">
              Format Aktif: {(formData.kopType || schoolProfile.kopType) === 'dinas' ? 'Kop Dinas (Tanpa Jurusan)' : 'Kop Yayasan (Ma\'arif NU)'}
            </span>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 text-xs"
      >
        <h3 className="text-sm font-bold text-slate-900 border-b pb-2">
          Formulir Data Induk Administrasi
        </h3>

        {/* Section 1: Sekolah */}
        <div className="space-y-3">
          <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wide">
            1. Identitas Satuan Sekolah
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Satuan Sekolah</label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">NPSN:</label>
              <input
                type="text"
                value={formData.npsn || ''}
                onChange={(e) => setFormData({ ...formData, npsn: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-mono font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Terakreditasi :</label>
              <input
                type="text"
                value={formData.akreditasi || ''}
                onChange={(e) => setFormData({ ...formData, akreditasi: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-bold text-emerald-800"
                placeholder="Contoh: A"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Program Keahlian:</label>
              <textarea
                rows={2}
                value={
                  typeof formData.programKeahlian === 'string'
                    ? formData.programKeahlian
                    : Array.isArray(formData.programKeahlian)
                    ? formData.programKeahlian.join('\n')
                    : ''
                }
                onChange={(e) => setFormData({ ...formData, programKeahlian: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                placeholder={`1. Manajemen Perkantoran\n2. Teknik Komputer dan Jaringan`}
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Telp:</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Email Sekolah</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Alamat:</label>
              <input
                type="text"
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Pimpinan & Guru */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wide">
            2. Pimpinan & Guru Pengampu
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Guru Pengampu</label>
              <input
                type="text"
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                NUPTK Guru (Nomor Unik Pendidik dan Tenaga Kependidikan)
              </label>
              <input
                type="text"
                value={formData.teacherNuptk || ''}
                onChange={(e) => setFormData({ ...formData, teacherNuptk: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                placeholder="Contoh: 9443766667200012"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Identitas Tambahan Guru ({formData.teacherIdType || 'NIP'} / NIPY / NIY)
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.teacherIdType || 'NIP'}
                  onChange={(e) => setFormData({ ...formData, teacherIdType: e.target.value })}
                  className="px-2.5 py-2 border rounded-xl font-bold bg-slate-50 text-slate-800 text-xs shrink-0 cursor-pointer"
                >
                  <option value="NIP">NIP</option>
                  <option value="NUPTK">NUPTK</option>
                  <option value="NIPY">NIPY</option>
                  <option value="NIY">NIY</option>
                  <option value="PegID">PegID</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <input
                  type="text"
                  value={formData.teacherNip}
                  onChange={(e) => setFormData({ ...formData, teacherNip: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                  placeholder="Nomor identitas (NIP / NUPTK / NIPY)"
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Nama Kepala Sekolah</label>
              <input
                type="text"
                value={formData.headmasterName}
                onChange={(e) => setFormData({ ...formData, headmasterName: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-bold"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Identitas Kepala Sekolah ({formData.headmasterIdType || 'NIP'} / NUPTK / NIPY)
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.headmasterIdType || 'NIP'}
                  onChange={(e) => setFormData({ ...formData, headmasterIdType: e.target.value })}
                  className="px-2.5 py-2 border rounded-xl font-bold bg-slate-50 text-slate-800 text-xs shrink-0 cursor-pointer"
                >
                  <option value="NIP">NIP</option>
                  <option value="NUPTK">NUPTK</option>
                  <option value="NIPY">NIPY</option>
                  <option value="NIY">NIY</option>
                  <option value="NIK">NIK</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
                <input
                  type="text"
                  value={formData.headmasterNip}
                  onChange={(e) => setFormData({ ...formData, headmasterNip: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl font-mono text-xs"
                  placeholder="Nomor identitas kepala sekolah"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Akademik & Titimangsa */}
        <div className="space-y-3 pt-4 border-t">
          <h4 className="font-bold text-emerald-800 text-xs uppercase tracking-wide">
            3. Mata Pelajaran, Tingkat & Tanggal Pengesahan
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mata Pelajaran</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-bold text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fase / Kelas</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Fase"
                  value={formData.fase}
                  onChange={(e) => setFormData({ ...formData, fase: e.target.value })}
                  className="px-3 py-2 border rounded-xl"
                  required
                />
                <input
                  type="text"
                  placeholder="Kelas"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="px-3 py-2 border rounded-xl"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tahun Ajaran</label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl font-mono"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Titimangsa Tanggal & Tempat Tanda Tangan
              </label>
              <input
                type="text"
                placeholder="Contoh: Sendang Agung, 15 Juli 2026"
                value={formData.signaturePlaceDate}
                onChange={(e) => setFormData({ ...formData, signaturePlaceDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Semester Aktif</label>
              <select
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 border rounded-xl"
              >
                <option value={1}>Semester 1 (Ganjil)</option>
                <option value={2}>Semester 2 (Genap)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-md cursor-pointer"
          >
            Simpan & Terapkan ke Seluruh Dokumen
          </button>
        </div>
      </form>
    </div>
  );
};

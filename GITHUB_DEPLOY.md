# Panduan Menghubungkan & Push ke GitHub

Repositori Git lokal untuk **Dashboard Administrasi Guru Kurikulum Merdeka & Deep Learning** telah berhasil diinisialisasi dan di-commit.

## Langkah Menghubungkan ke GitHub:

1. **Buat Repository Baru di GitHub**:
   - Buka [github.com](https://github.com) dan login ke akun Anda.
   - Klik tombol **New** (atau ikon `+` di kanan atas) untuk membuat repository baru.
   - Beri nama repository (contoh: `dashboard-administrasi-guru`).
   - Pilih **Public** atau **Private**, lalu klik **Create repository** (jangan centang Add a README file).

2. **Hubungkan Remote dan Push ke GitHub**:
   Salin dan jalankan perintah berikut di terminal / command line komputer Anda (atau hubungkan token Anda):

   ```bash
   git remote add origin https://github.com/USERNAME/NAMA_REPOSITORY.git
   git branch -M main
   git push -u origin main
   ```
   *(Ganti `USERNAME` dengan username GitHub Anda dan `NAMA_REPOSITORY` dengan nama repository yang baru dibuat).*

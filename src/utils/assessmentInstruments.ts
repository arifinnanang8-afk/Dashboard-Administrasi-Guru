import { SchoolProfile } from '../types';

export interface AssessmentInstrument {
  id: string;
  name: string;
  category: string;
  description: string;
  tableHeaders: string[];
  items: Array<{
    no: number;
    kriteria: string;
    indikator: string;
    skorMaksimal: number;
    bobot?: string;
  }>;
  rubrikPenilaian: Array<{
    skor: number;
    predikat: string;
    kriteriaDetail: string;
  }>;
  formatLembar: {
    instruksi: string;
    skalaSkor: string;
    formulaNilai: string;
  };
}

export interface WrittenTestItem {
  no: number;
  bentuk: 'Pilihan Ganda' | 'Uraian (HOTS)';
  soal: string;
  pilihan?: string[];
  kunciJawaban: string;
  bobotSkor: number;
  indikator: string;
}

export interface OralTestItem {
  no: number;
  pertanyaan: string;
  fokusKompetensi: string;
  kunciJawabanDanRubrik: string;
  skorMaks: number;
}

export function getTenAssessmentInstruments(
  subject: string,
  grade: string,
  babNumber: number,
  babTitle: string,
  profile: SchoolProfile
) {
  const subjName = subject || 'Mata Pelajaran';
  const babLabel = `Bab ${babNumber}: ${babTitle}`;

  // 1. Penilaian Sejawat (Peer Assessment)
  const penilaianSejawat: AssessmentInstrument = {
    id: 'sejawat',
    name: '1. Penilaian Sejawat (Peer-Assessment)',
    category: 'Assessment as Learning',
    description: `Instrumen penilaian antarteman dalam kelompok diskusi & kolaborasi kelompok pada ${subjName} ${babLabel}.`,
    tableHeaders: ['No', 'Aspek / Kriteria Penilaian Antarteman', 'Indikator Pengamatan Sikap Kolaboratif', 'Skor (1-4)'],
    items: [
      { no: 1, kriteria: 'Aktif Berkontribusi', indikator: 'Sering memberikan ide, gagasan, dan solusi kreatif saat diskusi kelompok.', skorMaksimal: 4 },
      { no: 2, kriteria: 'Menghargai Pendapat', indikator: 'Mendengarkan dengan santun dan menerima saran/kritik dari anggota kelompok lain.', skorMaksimal: 4 },
      { no: 3, kriteria: 'Tanggung Jawab Tugas', indikator: ' menyelesaikan bagian tugas kelompok tepat waktu sesuai kesepakatan bersama.', skorMaksimal: 4 },
      { no: 4, kriteria: 'Komunikasi Efektif', indikator: 'Menyampaikan argumen secara runtut, jelas, serta tidak mendominasi pembicaraan.', skorMaksimal: 4 },
      { no: 5, kriteria: 'Kerjasama & Bantuan', indikator: 'Sedia membantu teman sekelompok yang mengalami kesulitan memahami materi.', skorMaksimal: 4 },
    ],
    rubrikPenilaian: [
      { skor: 4, predikat: 'Sangat Baik (SB)', kriteriaDetail: 'Selalu menunjukkan indikator secara konsisten tanpa perlu diingatkan.' },
      { skor: 3, predikat: 'Baik (B)', kriteriaDetail: 'Sering menunjukkan indikator dan kadang perlu sedikit dorongan.' },
      { skor: 2, predikat: 'Cukup (C)', kriteriaDetail: 'Kadang-kadang menunjukkan indikator tetapi kurang konsisten.' },
      { skor: 1, predikat: 'Perlu Bimbingan (PB)', kriteriaDetail: 'Belum menunjukkan indikator dan perlu pendampingan intensif.' },
    ],
    formatLembar: {
      instruksi: 'Petunjuk: Berikan tanda centang (✓) atau angka skor (1–4) pada kolom yang sesuai dengan perilaku teman kelompokmu selama kegiatan belajar!',
      skalaSkor: 'Skor Total Maksimal = 20. Nilai Akhir = (Total Skor / 20) × 100',
      formulaNilai: 'Predikat: ≥85 (SB), 75-84 (B), 65-74 (C), <65 (PB)',
    },
  };

  // 2. Penilaian Diri (Self Assessment)
  const penilaianDiri: AssessmentInstrument = {
    id: 'diri',
    name: '2. Penilaian Diri (Self-Assessment)',
    category: 'Assessment as Learning',
    description: `Instrumen refleksi mandiri peserta didik mengenai penguasaan materi dan kesadaran belajar pada ${subjName} ${babLabel}.`,
    tableHeaders: ['No', 'Pernyataan Refleksi Kesadaran Belajar', 'Tingkat Pencapaian Diri', 'Skor (1-4)'],
    items: [
      { no: 1, kriteria: 'Pemahaman Konsep Dasar', indikator: 'Saya mampu menjelaskan kembali konsep esensial materi Bab ini dengan bahasa saya sendiri.', skorMaksimal: 4 },
      { no: 2, kriteria: 'Kesadaran Proses Belajar', indikator: 'Saya menyadari poin materi yang sudah saya kuasai dan bagian yang masih membutuhkan latihan.', skorMaksimal: 4 },
      { no: 3, kriteria: 'Kemampuan Pemecahan Masalah', indikator: 'Saya dapat menerapkan rumus/konsep materi untuk menyelesaikan soal kontekstual nyata.', skorMaksimal: 4 },
      { no: 4, kriteria: 'Pengelolaan Waktu & Belajar', indikator: 'Saya dapat mengelola waktu belajar secara mandiri dan mengumpulkan tugas tepat waktu.', skorMaksimal: 4 },
      { no: 5, kriteria: 'Rencana Perbaikan Diri', indikator: 'Saya memiliki strategi khusus untuk memperbaiki kekurangan dan meningkatkan prestasi belajar.', skorMaksimal: 4 },
    ],
    rubrikPenilaian: [
      { skor: 4, predikat: 'Sangat Paham / Mahir', kriteriaDetail: 'Memahami sepenuhnya, mampu mengajari teman lain.' },
      { skor: 3, predikat: 'Paham / Cakap', kriteriaDetail: 'Memahami konsep dengan baik, sedikit bimbingan guru.' },
      { skor: 2, predikat: 'Cukup Paham / Layak', kriteriaDetail: 'Cukup memahami tetapi masih sering bingung pada kasus kompleks.' },
      { skor: 1, predikat: 'Belum Paham / Berkembang', kriteriaDetail: 'Membutuhkan bantuan dan bimbingan guru secara bertahap.' },
    ],
    formatLembar: {
      instruksi: 'Jawablah dengan jujur sesuai dengan kondisi riil pemahaman dan pengalaman belajarmu!',
      skalaSkor: 'Skor Total Maksimal = 20. Nilai Refleksi Diri = (Total Skor / 20) × 100',
      formulaNilai: 'Catatan Refleksi: Tuliskan 1 hal yang paling kamu banggakan dan 1 hal yang ingin kamu perbaiki!',
    },
  };

  // 3. Penilaian Proyek (Project Assessment)
  const penilaianProyek: AssessmentInstrument = {
    id: 'proyek',
    name: '3. Penilaian Proyek (Project-Based Assessment)',
    category: 'Assessment for & of Learning',
    description: `Rubrik evaluasi pengerjaan projek kelompok/mandiri kontekstual pada ${subjName} ${babLabel}.`,
    tableHeaders: ['No', 'Tahapan Projek', 'Kriteria & Rincian Pengamatan Projek', 'Bobot (%)', 'Skor Maks (1-100)'],
    items: [
      { no: 1, kriteria: 'Perencanaan & Desain Projek', indikator: 'Kejelasan rumusan masalah, pembagian peran kelompok, serta rencana alur kerja projek.', bobot: '20%', skorMaksimal: 100 },
      { no: 2, kriteria: 'Pelaksanaan & Pengumpulan Data', indikator: 'Kedalaman analisis data/informasi, validitas sumber rujukan, dan prosedur K3LH/etika.', bobot: '35%', skorMaksimal: 100 },
      { no: 3, kriteria: 'Kualitas Hasil Laporan Projek', indikator: 'Ketersediaan data kuantitatif/kualitatif, keakuratan pembahasan, dan jawaban atas masalah.', bobot: '30%', skorMaksimal: 100 },
      { no: 4, kriteria: 'Presentasi & Pertahanan Produk', indikator: 'Kelancaran mempresentasikan hasil, penguasaan materi saat tanya jawab, dan media pendukung.', bobot: '15%', skorMaksimal: 100 },
    ],
    rubrikPenilaian: [
      { skor: 90, predikat: 'Sangat Mahir (90-100)', kriteriaDetail: 'Projek sempurna, inovatif, data sangat valid, presentasi sangat meyakinkan.' },
      { skor: 80, predikat: 'Cakap (80-89)', kriteriaDetail: 'Projek sesuai standar spesifikasi, analisis sistematis, kelancaran presentasi baik.' },
      { skor: 70, predikat: 'Layak (70-79)', kriteriaDetail: 'Projek cukup baik, ada sedikit kekurangan pada kelengkapan data/sintesis laporan.' },
      { skor: 60, predikat: 'Perlu Perbaikan (<70)', kriteriaDetail: 'Projek belum selesai sepenuhnya atau belum memenuhi kriteria dasar.' },
    ],
    formatLembar: {
      instruksi: 'Evaluasi projek dilakukan secara berkelanjutan mulai dari penyusunan proposal hingga pameran karya / presentasi!',
      skalaSkor: 'Nilai Akhir Proyek = (Skor 1 × 0.20) + (Skor 2 × 0.35) + (Skor 3 × 0.30) + (Skor 4 × 0.15)',
      formulaNilai: 'Kelulusan Proyek: KKM Satuan Pendidikan = 75',
    },
  };

  // 4. Penilaian Produk (Product Assessment)
  const penilaianProduk: AssessmentInstrument = {
    id: 'produk',
    name: '4. Penilaian Produk (Product Assessment)',
    category: 'Assessment of Learning',
    description: `Rubrik penilaian fisik / digital hasil karya peserta didik (Infografis, Laporan, Alat Peraga, Program, Naskah) pada ${subjName} ${babLabel}.`,
    tableHeaders: ['No', 'Aspek Kualitas Produk', 'Indikator Standar Mutu Karya', 'Skor Maksimal'],
    items: [
      { no: 1, kriteria: 'Kesesuaian Spesifikasi / Isi', indikator: 'Karya memuat seluruh elemen materi pokok secara tepat, akurat, dan komprehensif.', skorMaksimal: 25 },
      { no: 2, kriteria: 'Kreativitas & Orisinalitas', indikator: 'Menampilkan keunikan ide, inovasi tampilan, dan bebas dari unsur plagiarisme.', skorMaksimal: 25 },
      { no: 3, kriteria: 'Kerapihan & Estetika Visual', indikator: 'Tata letak (layout), pemilihan warna, tipografi, serta kerapihan fisik/digital produk sangat menarik.', skorMaksimal: 25 },
      { no: 4, kriteria: 'Kebergunaan & Kepraktisan', indikator: 'Produk mudah dipahami, dapat dimanfaatkan sebagai media belajar / aplikasi kontekstual.', skorMaksimal: 25 },
    ],
    rubrikPenilaian: [
      { skor: 25, predikat: 'Sangat Memuaskan (23-25)', kriteriaDetail: 'Memenuhi seluruh kriteria mutu secara sempurna.' },
      { skor: 20, predikat: 'Memuaskan (19-22)', kriteriaDetail: 'Memenuhi sebagian besar kriteria dengan kualitas baik.' },
      { skor: 15, predikat: 'Cukup Memuaskan (15-18)', kriteriaDetail: 'Memenuhi kriteria minimal, memerlukan sedikit kerapihan.' },
      { skor: 10, predikat: 'Kurang (<15)', kriteriaDetail: 'Produk tidak selesai atau tidak sesuai spesifikasi tugas.' },
    ],
    formatLembar: {
      instruksi: 'Gunakan rubrik ini saat menguji karya fisik/digital hasil penugasan modul!',
      skalaSkor: 'Total Nilai Produk = Jumlah Skor dari 4 Aspek (Skor Maksimal = 100)',
      formulaNilai: 'Kategori Mutu: ≥90 (Unggul), 80-89 (Baik), 75-79 (Standar), <75 (Revisi)',
    },
  };

  // 5. Observasi Sikap & Profil Pelajar Pancasila (Observation Checklist)
  const observasiSikap: AssessmentInstrument = {
    id: 'observasi',
    name: '5. Lembar Observasi Sikap & Dimensi Profil Pelajar Pancasila',
    category: 'Assessment for Learning',
    description: `Lembar pengamatan guru terhadap perkembangan dimensi Profil Lulusan selama PBM ${subjName} ${babLabel}.`,
    tableHeaders: ['No', 'Dimensi Profil Lulusan / Sikap', 'Indikator Perilaku Teramati (Behavioral Checklist)', 'Skor (1-4)'],
    items: [
      { no: 1, kriteria: 'Penalaran Kritis', indikator: 'Aktif bertanya, menganalisis kebenaran informasi, dan mengajukan argumen berbasis bukti.', skorMaksimal: 4 },
      { no: 2, kriteria: 'Kreativitas', indikator: 'Mampu menghasilkan gagasan alternatif yang fleksibel dan orisinal dalam pemecahan masalah.', skorMaksimal: 4 },
      { no: 3, kriteria: 'Kolaborasi', indikator: 'Bekerja sama dengan kompak, saling menghargai peran teman, dan bersikap inklusif.', skorMaksimal: 4 },
      { no: 4, kriteria: 'Kemandirian', indikator: 'Menunjukkan inisiatif belajar tanpa harus terus didorong, serta bertanggung jawab atas pilihan.', skorMaksimal: 4 },
      { no: 5, kriteria: 'Komunikasi', indikator: 'Menyampaikan gagasan secara lisan dan tertulis dengan santun, sistematis, dan efektif.', skorMaksimal: 4 },
      { no: 6, kriteria: 'Imtaq & Berakhlak Mulia', indikator: 'Mengawali dan mengakhiri kegiatan belajar dengan doa, bersikap jujur dan menghargai etika.', skorMaksimal: 4 },
    ],
    rubrikPenilaian: [
      { skor: 4, predikat: 'Sangat Baik (SB)', kriteriaDetail: 'Membudaya secara alami dalam interaksi sehari-hari.' },
      { skor: 3, predikat: 'Baik (B)', kriteriaDetail: 'Berkembang sesuai harapan dan konsisten.' },
      { skor: 2, predikat: 'Cukup (C)', kriteriaDetail: 'Mulai tampak tetapi masih perlu pembiasaan.' },
      { skor: 1, predikat: 'Perlu Bimbingan (PB)', kriteriaDetail: 'Belum terlihat dan memerlukan perhatian khusus guru.' },
    ],
    formatLembar: {
      instruksi: 'Guru mencatat jurnal observasi langsung di dalam kelas saat proses diskusi, eksplorasi, dan presentasi!',
      skalaSkor: 'Nilai Sikap = (Total Skor Pengamatan / 24) × 100',
      formulaNilai: 'Catatan Jurnal: Catat kejadian menonjol (positif/negatif) untuk tindak lanjut konseling/pembinaan.',
    },
  };

  // 6. Portofolio Pembelajaran (Portfolio Assessment)
  const portofolio: AssessmentInstrument = {
    id: 'portofolio',
    name: '6. Penilaian Portofolio Pembelajaran',
    category: 'Assessment of Learning',
    description: `Penilaian kumpulan dokumen karya, lembar kerja (LKPD), dan catatan refleksi peserta didik sepanjang ${subjName} ${babLabel}.`,
    tableHeaders: ['No', 'Komponen Portofolio', 'Indikator Kelengkapan & Kualitas Dokumen', 'Skor Maksimal'],
    items: [
      { no: 1, kriteria: 'Kelengkapan Berkas Tugas', indikator: 'Memuat seluruh LKPD, ringkasan materi, kuis, serta produk projek Bab secara lengkap.', skorMaksimal: 25 },
      { no: 2, kriteria: 'Sistematika & Kerapihan', indikator: 'Dokumen tertata rapi sesuai urutan kronologis pertemuan, dilengkapi daftar isi & sampul.', skorMaksimal: 25 },
      { no: 3, kriteria: 'Progres Perkembangan Hasil', indikator: 'Menunjukkan grafik perbaikan / peningkatkan kualitas revisi dari tugas awal ke tugas akhir.', skorMaksimal: 25 },
      { no: 4, kriteria: 'Kualitas Catatan Refleksi', indikator: 'Dilengkapi lembar refleksi pribadi yang mendalam tentang proses belajar yang dialami.', skorMaksimal: 25 },
    ],
    rubrikPenilaian: [
      { skor: 25, predikat: 'Sangat Baik (23-25)', kriteriaDetail: 'Dokumen sangat lengkap, penataan rapi, refleksi tajam dan bermakna.' },
      { skor: 20, predikat: 'Baik (19-22)', kriteriaDetail: 'Dokumen lengkap, penataan rapi, memuat refleksi standar.' },
      { skor: 15, predikat: 'Cukup (15-18)', kriteriaDetail: 'Ada beberapa berkas yang terlewat atau penataan kurang terstruktur.' },
      { skor: 10, predikat: 'Kurang (<15)', kriteriaDetail: 'Dokumen tidak lengkap dan tidak rapi.' },
    ],
    formatLembar: {
      instruksi: 'Portofolio dikumpulkan dan dinilai pada akhir Bab sebagai bukti rekam jejak capaian kompetensi!',
      skalaSkor: 'Nilai Portofolio = Total Skor (Skor Maksimal = 100)',
      formulaNilai: 'Bobot Portofolio dalam Nilai Rapor = 20%',
    },
  };

  // 7. Penilaian Berbasis Kelas (Classroom-Based Assessment)
  const penilaianBerbasisKelas: AssessmentInstrument = {
    id: 'pbk',
    name: '7. Penilaian Berbasis Kelas (Classroom-Based Assessment)',
    category: 'Assessment for Learning',
    description: `Instrumen integratif penilaian formatif harian kelas untuk memantau pemahaman siswa secara berkesinambungan pada ${subjName} ${babLabel}.`,
    tableHeaders: ['No', 'Komponen Asesmen Formatif Harian', 'Bentuk Kinerja / Respon Teramati', 'Skor Maksimal'],
    items: [
      { no: 1, kriteria: 'Kuis Singkat / Exit Ticket', indikator: 'Kemampuan menjawab 2-3 pertanyaan pemantik cepat di akhir sesi jam pelajaran.', skorMaksimal: 25 },
      { no: 2, kriteria: 'Keaktifan Diskusi Kelas', indikator: 'Frekuensi dan kualitas tanggapan dalam forum tanya jawab bersama guru & teman.', skorMaksimal: 25 },
      { no: 3, kriteria: 'Ketepatan Tugas Mandiri', indikator: 'Penyelesaian latihan soal pada LKPD harian secara mandiri dan akurat.', skorMaksimal: 25 },
      { no: 4, kriteria: 'Respon Umpan Balik', indikator: 'Kemauan memperbaiki kekeliruan berdasarkan umpan balik langsung dari guru.', skorMaksimal: 25 },
    ],
    rubrikPenilaian: [
      { skor: 25, predikat: 'Sangat Aktif & Tepat', kriteriaDetail: 'Respon cepat, jawaban tepat, aktif memberikan tanggapan bernilai tinggi.' },
      { skor: 20, predikat: 'Aktif', kriteriaDetail: 'Respon konsisten, jawaban secara umum benar.' },
      { skor: 15, predikat: 'Pasif', kriteriaDetail: 'Menjawab jika ditunjuk, memerlukan dorongan keaktifan.' },
      { skor: 10, predikat: 'Belum Merespon', kriteriaDetail: 'Tidak menyelesaikan latihan harian tepat waktu.' },
    ],
    formatLembar: {
      instruksi: 'Digunakan guru setiap tatap muka sebagai penilaian diagnostik dan formatif per pertemuan!',
      skalaSkor: 'Nilai PBK Harian = Total Skor (Skor Maksimal = 100)',
      formulaNilai: 'Tindak Lanjut: Siswa dengan nilai PBK < 75 mendapatkan pendampingan remediasi langsung.',
    },
  };

  // 8. Penilaian Kinerja / Unjuk Kerja (Performance Assessment)
  const penilaianKinerja: AssessmentInstrument = {
    id: 'kinerja',
    name: '8. Penilaian Kinerja / Unjuk Kerja (Performance Assessment)',
    category: 'Assessment for & of Learning',
    description: `Rubrik penilaian unjuk kerja praktik, simulasi, atau demonstrasi prosedur operasional pada ${subjName} ${babLabel}.`,
    tableHeaders: ['No', 'Langkah / Dimensi Kinerja Praktik', 'Indikator Keterampilan Operasional Teramati', 'Skor Maksimal'],
    items: [
      { no: 1, kriteria: 'Persiapan Alat, Bahan & K3LH', indikator: 'Menyiapkan peralatan dengan lengkap, bersih, serta menerapkan prosedur K3LH.', skorMaksimal: 20 },
      { no: 2, kriteria: 'Pelaksanaan Prosedur Kerja', indikator: 'Melakukan langkah-langkah kerja secara runtut, tepat, presisi, dan efisien.', skorMaksimal: 40 },
      { no: 3, kriteria: 'Sikap Kerja & Keselamatan', indikator: 'Fokus, tenang, cermat, menjaga kebersihan area kerja, dan tanggap atas potensi bahaya.', skorMaksimal: 20 },
      { no: 4, kriteria: 'Penyelesaian & Pengemasan', indikator: 'Menyelesaikan unjuk kerja tepat waktu, membersihkan alat, dan merapikan tempat kerja.', skorMaksimal: 20 },
    ],
    rubrikPenilaian: [
      { skor: 40, predikat: 'Sangat Terampil (36-40)', kriteriaDetail: 'Langkah kerja sangat lancar, tanpa ragu, presisi tinggi, K3LH sempurna.' },
      { skor: 32, predikat: 'Terampil (30-35)', kriteriaDetail: 'Langkah kerja lancar, sedikit petunjuk teknis, aman.' },
      { skor: 25, predikat: 'Cukup Terampil (25-29)', kriteriaDetail: 'Melakukan langkah kerja dengan bimbingan berkala.' },
      { skor: 15, predikat: 'Belum Terampil (<25)', kriteriaDetail: 'Belum menguasai urutan langkah kerja dasar.' },
    ],
    formatLembar: {
      instruksi: 'Pengamatan unjuk kerja dilakukan secara individual menggunakan lembar checklist performa!',
      skalaSkor: 'Nilai Kinerja Praktik = (Total Skor Teratai / 100) × 100',
      formulaNilai: 'Kelulusan Praktik Kinerja: 100% Wajib Memenuhi Standar K3LH',
    },
  };

  // 9. Tes Tertulis (Written Test)
  const tesTertulisItems: WrittenTestItem[] = [
    {
      no: 1,
      bentuk: 'Pilihan Ganda',
      soal: `Manakah dari pernyataan berikut yang paling tepat menggambarkan konsep dasar dalam ${subjName} ${babLabel}?`,
      pilihan: [
        `A. Penerapan teori tanpa memperhatikan relevansi kontekstual`,
        `B. Mengintegrasikan pengetahuan faktual, konseptual, dan pemecahan masalah kontekstual`,
        `C. Menghafal seluruh istilah teknis tanpa melakukan sintesis`,
        `D. Membatasi eksplorasi hanya pada satu sumber buku rujukan`,
      ],
      kunciJawaban: 'B. Mengintegrasikan pengetahuan faktual, konseptual, dan pemecahan masalah kontekstual',
      bobotSkor: 10,
      indikator: 'Mengidentifikasi konsep esensial Bab',
    },
    {
      no: 2,
      bentuk: 'Pilihan Ganda',
      soal: `Dalam analisis materi ${babTitle}, langkah awal yang paling krusial sebelum mengambil tindakan pemecahan masalah adalah...`,
      pilihan: [
        `A. Memulai pekerjaan tanpa perencanaan data`,
        `B. Mengidentifikasi fakta dasar dan merumuskan hipotesis/tujuan secara jelas`,
        `C. Menunggu petunjuk langsung dari pihak luar`,
        `D. Mengabaikan aspek keselamatan dan etika kerja`,
      ],
      kunciJawaban: 'B. Mengidentifikasi fakta dasar dan merumuskan hipotesis/tujuan secara jelas',
      bobotSkor: 10,
      indikator: 'Menganalisis alur pemecahan masalah',
    },
    {
      no: 3,
      bentuk: 'Pilihan Ganda',
      soal: `Manakah yang merupakan bentuk pengaplikasian nyata dari materi ${babTitle} di dunia industri/masyarakat?`,
      pilihan: [
        `A. Menyusun dokumen perencanaan yang akurat dan dapat dipertanggungjawabkan`,
        `B. Menunda penyelesaian tugas yang disepakati`,
        `C. Menghindari kolaborasi dengan tim interdisipliner`,
        `D. Menggunakan data acak tanpa validasi`,
      ],
      kunciJawaban: 'A. Menyusun dokumen perencanaan yang akurat dan dapat dipertanggungjawabkan',
      bobotSkor: 10,
      indikator: 'Penerapan kontekstual materi',
    },
    {
      no: 4,
      bentuk: 'Uraian (HOTS)',
      soal: `Analisislah sebuah studi kasus nyata di mana tim mengalami kendala saat menerapkan materi ${babTitle}. Jelaskan 3 langkah solusi strategis berbasis konsep pembelajaran yang telah kamu pelajari!`,
      kunciJawaban: 'Pedoman Penskoran Uraian (Skor Maks 35): 1) Penjelasan analisis masalah secara tajam (Skor 10), 2) Solusi strategis 3 langkah tepat dan berbasis konsep (Skor 20), 3) Sistematika bahasa dan kesimpulan yang runtut (Skor 5).',
      bobotSkor: 35,
      indikator: 'Analisis HOTS & sintesis solusi pemecahan masalah',
    },
    {
      no: 5,
      bentuk: 'Uraian (HOTS)',
      soal: `Rancanglah sebuah gagasan inovatif / rekomendasi perbaikan untuk meningkatkan efektivitas penerapan ${babTitle} di lingkungan sekolah atau kejuruanmu!`,
      kunciJawaban: 'Pedoman Penskoran Uraian (Skor Maks 35): 1) Orisinalitas dan relevansi gagasan (Skor 15), 2) Kelayakan implementasi di sekolah/DUDI (Skor 15), 3) Kejelasan argumen pendukung (Skor 5).',
      bobotSkor: 35,
      indikator: 'Kreasi HOTS & perancangan gagasan inovatif',
    },
  ];

  // 10. Tes Lisan (Oral Test)
  const tesLisanItems: OralTestItem[] = [
    {
      no: 1,
      pertanyaan: `Coba jelaskan secara singkat dan ringkas, apa gagasan utama dari ${babTitle} yang kamu pelajari pada Bab ini?`,
      fokusKompetensi: 'Pemahaman Konseptual & Kelancaran Berbicara',
      kunciJawabanDanRubrik: 'Siswa mampu menyebutkan definisi, inti masalah, dan 2-3 poin penting secara eksplisit. (Skor 1–25)',
      skorMaks: 25,
    },
    {
      no: 2,
      pertanyaan: `Bagaimana kamu mengaitkan materi ${babTitle} ini dengan contoh kasus nyata yang pernah kamu temui di kehidupan sehari-hari atau lingkungan kerja vokasi?`,
      fokusKompetensi: 'Koneksi Kontekstual & Penalaran Kritis',
      kunciJawabanDanRubrik: 'Siswa mampu memberikan contoh riil yang relevan dan menjelaskan hubungan sebab-akibatnya. (Skor 1–25)',
      skorMaks: 25,
    },
    {
      no: 3,
      pertanyaan: `Jika dalam kelompokmu terdapat perbedaan pendapat mengenai cara menyelesaikan masalah pada ${babTitle}, bagaimana caramu mengambil keputusan yang tepat?`,
      fokusKompetensi: 'Sikap Kolaboratif & Etika Berkomunikasi',
      kunciJawabanDanRubrik: 'Siswa menjelaskan pendekatan musyawarah, uji validasi data, dan kebersamaan secara bijak. (Skor 1–25)',
      skorMaks: 25,
    },
    {
      no: 4,
      pertanyaan: `Apa manfaat terbesar yang kamu rasakan setelah mempelajari Bab ini, dan apa yang ingin kamu pelajari lebih dalam lagi?`,
      fokusKompetensi: 'Refleksi Meta-Kognitif & Kesadaran Diri',
      kunciJawabanDanRubrik: 'Siswa menyampaikan refleksi jujur, menyebutkan aspek kemajuan, serta target belajar berikutnya. (Skor 1–25)',
      skorMaks: 25,
    },
  ];

  return {
    penilaianSejawat,
    penilaianDiri,
    penilaianProyek,
    penilaianProduk,
    observasiSikap,
    portofolio,
    penilaianBerbasisKelas,
    penilaianKinerja,
    tesTertulisItems,
    tesLisanItems,
  };
}

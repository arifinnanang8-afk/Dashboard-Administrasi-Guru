// server.ts
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
app.use(express.json({ limit: "10mb" }));
var apiKey = process.env.GEMINI_API_KEY;
var aiClient = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
app.post("/api/gemini/generate-cover", async (req, res) => {
  try {
    const { prompt, theme, schoolName, subject, grade, teacherName, academicYear } = req.body;
    if (!aiClient) {
      return res.status(503).json({
        error: "GEMINI_API_KEY_MISSING",
        message: "Menggunakan mesin generator desain vektor AI lokal berkecepatan tinggi."
      });
    }
    const coverPrompt = `Buat desain latar belakang sampul (cover) A4 modern tanpa teks untuk Perangkat Pembelajaran Kurikulum Merdeka & Pembelajaran Mendalam.
Sekolah: ${schoolName || "SMK MA'ARIF 1 SENDANG AGUNG"}
Mata Pelajaran: ${subject || "Bahasa Indonesia"} (${grade || "E / X SMK"})
Guru: ${teacherName || "Nanang Arifin, S.Pd"}
Tahun Ajaran: ${academicYear || "2026/2027"}
Tema Pilihan: ${theme || "Emerald Modern Kurikulum Merdeka"}
Instruksi Tambahan: ${prompt || "Desain gelombang geometris modern, elegan, profesional, bernuansa pendidikan masa depan"}

PENTING:
1. Hasilkan kode SVG lengkap pada field "svgCode" dengan atribut xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1131" width="800" height="1131".
2. JANGAN masukkan elemen <text> apa pun di dalam SVG agar tidak bertabrakan dengan teks sampul aplikasi.
3. Gunakan linearGradient, radialGradient, gelombang berlapis (layered waves), pola geometris modern, lingkaran cahaya lembut, dan ornamen abstrak buku/pendidikan yang estetis di bagian atas, samping, dan bawah, dengan area tengah yang bersih dan kontras agar teks sampul sangat mudah dibaca.
4. Berikan juga motto sekolah singkat dan slogan inspiratif pendidikan di bagian bawah.`;
    const response = await aiClient.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: coverPrompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            svgCode: {
              type: Type.STRING,
              description: 'Full valid SVG string (viewBox="0 0 800 1131") with modern gradients and shapes, NO <text> elements.'
            },
            schoolMotto: {
              type: Type.STRING,
              description: "Short inspiring school motto in Indonesian."
            },
            bottomMotto: {
              type: Type.STRING,
              description: "Inspiring educational footer quote in Indonesian."
            },
            themeName: {
              type: Type.STRING,
              description: "Name of the generated modern design style."
            }
          },
          required: ["svgCode", "schoolMotto", "bottomMotto", "themeName"]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (err) {
    console.error("Error in /api/gemini/generate-cover:", err);
    return res.status(500).json({
      error: "GEMINI_COVER_ERROR",
      message: err.message || "Gagal membuat sampul AI dari server, beralih ke generator cepat."
    });
  }
});
app.post("/api/gemini/assist", async (req, res) => {
  try {
    const { prompt, mode, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }
    if (!aiClient) {
      return res.status(503).json({
        error: "GEMINI_API_KEY_MISSING",
        message: "Kunci API Gemini belum dikonfigurasi di environment. Menggunakan konsultan kurikulum cerdas lokal."
      });
    }
    const systemInstruction = `Anda adalah "Asisten AI Pintar" \u2014 Konsultan Ahli Kurikulum Nasional Indonesia, Spesialis Pembelajaran Mendalam (Deep Learning: Mindful Inquiring, Meaningful Dialogue, Joyful Celebration), dan Pakar Penyesuaian Materi Ajar berdasarkan Capaian Pembelajaran (CP) terbaru (KepKa BSKAP No. 046/H/KR/2025 dan Permendikbudristek No. 12 Tahun 2024).

Konteks Kurikulum Aktif Guru:
- Guru: ${context?.teacherName || "Nanang Arifin, S.Pd."}
- Satuan Pendidikan: ${context?.schoolName || "SMK MA'ARIF 1 SENDANG AGUNG"}
- Mata Pelajaran: ${context?.subject || "Bahasa Indonesia"}
- Fase / Kelas: Fase ${context?.fase || "E"} (${context?.grade || "X SMK"})
- Tahun Ajaran: ${context?.academicYear || "2026/2027"}
- Fokus Konsultasi: ${mode || "Strategi Deep Learning & Penyesuaian Materi CP BSKAP 046/2025"}
- Elemen CP Aktif (BSKAP 046/H/KR/2025): ${context?.cpElemen || "Semua Elemen CP"} \u2014 "${context?.cpDeskripsi || "Sesuai BSKAP 046/2025"}"
- Bab & Materi Pokok: ${context?.bab || "Bab 1"} \u2014 ${context?.materiPokok || "Materi Pokok Kurikulum Merdeka"}
- Tujuan Pembelajaran (TP): ${context?.tujuanPembelajaran || "-"}

Tugas Anda:
1. Berikan konsultasi yang praktis, terstruktur, dan langsung siap diterapkan oleh guru di kelas.
2. Jelaskan secara spesifik:
   - Penyesuaian & Kontekstualisasi Materi Ajar berdasarkan bunyi Elemen CP terbaru (KepKa BSKAP No. 046/H/KR/2025).
   - Strategi 3 Pilar Pembelajaran Mendalam (Mindful Inquiring / Berkesadaran, Meaningful Dialogue / Bermakna, Joyful Celebration / Menggembirakan).
   - Diferensiasi pembelajaran (Kelompok Dasar, Menengah, Mahir) serta indikator asesmen formatif/KKTP.
3. Gunakan Bahasa Indonesia baku dan rapi dengan subjudul yang mudah dibaca.`;
    const response = await aiClient.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
    const outputText = response.text || "";
    return res.json({ result: outputText });
  } catch (err) {
    console.error("Error in /api/gemini/assist:", err);
    return res.status(500).json({
      error: "GEMINI_API_ERROR",
      message: err.message || "Terjadi kesalahan saat memproses permintaan AI."
    });
  }
});
app.post("/api/gemini/analyze-book", async (req, res) => {
  try {
    const { fileName, fileTextSnippet, subject, fase, grade, teacherName } = req.body;
    if (!aiClient) {
      return res.status(503).json({
        error: "GEMINI_API_KEY_MISSING",
        message: "Menggunakan Analisis Buku Pintar lokal yang siap disinkronkan ke pipeline."
      });
    }
    const analyzePrompt = `Anda adalah "Analisis Buku Pintar AI" untuk Kurikulum Merdeka & Pembelajaran Mendalam.
Tugas Anda: Analisis naskah/berkas buku teks yang diunggah berikut ini dan ekstrak struktur materi secara presisi ke dalam komponen pipeline kurikulum (Kalender/RPE, CP/ATP, PROTA, PROMES, Modul Ajar Deep Learning, LKPD, dan Penilaian Rapor) yang selaras dengan KepKa BSKAP No. 046/H/KR/2025 dan KMA No. 1503 Tahun 2025.

Informasi Berkas Unggahan:
- Nama Berkas: ${fileName || "Buku_Teks_Utama.pdf"}
- Potongan Teks / Isi Berkas: "${(fileTextSnippet || "").slice(0, 3e3)}"
- Konteks Sasaran: Mata Pelajaran ${subject || "Bahasa Indonesia"}, Fase ${fase || "E"} (${grade || "Kelas 10"}), Guru: ${teacherName || "Pengampu"}

Instruksi Output JSON:
1. "judulBuku": Judul resmi terurai lengkap (misal: "Buku Teks Utama [Subject] [Grade] Edisi Revisi Resmi 2026").
2. "penerbit": Penerbit resmi (misal: "Sistem Informasi Perbukuan Indonesia (SIBI) Kemendikdasmen RI & Kemenag RI").
3. "pengarang": Tim penyusun/pengarang.
4. "tahunTerbit": 2026.
5. "mapel": Mata pelajaran sasaran.
6. "faseCode": Kode fase ("A", "B", "C", "D", "E", "F", "Fondasi").
7. "faseLabel": Label lengkap fase.
8. "kelasDefault": Tingkat kelas (misal: "Kelas 10").
9. "alokasiJp": Total alokasi JP 1 tahun (default 132 atau sesuai mapel).
10. "elemenCp": Array string elemen CP resmi.
11. "kesesuaianRegulasi": Status keselarasan regulasi (misal: "100% Selaras KepKa BSKAP No. 046/H/KR/2025 & KMA 1503/2025").
12. "rangkumanAnalisisAi": Penjelasan terurai bagaimana struktur bab buku ini cocok & sinkron dengan CP/ATP aktif.
13. "babList": Array berisi 6-8 Bab terstruktur (masing-masing punya kodeBab, judulBab, subBab (array string), semester (1 atau 2), alokasiJp).`;
    const response = await aiClient.models.generateContent({
      model: "gemini-4-hydrogen",
      contents: analyzePrompt,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            judulBuku: { type: Type.STRING },
            penerbit: { type: Type.STRING },
            pengarang: { type: Type.STRING },
            tahunTerbit: { type: Type.INTEGER },
            mapel: { type: Type.STRING },
            faseCode: { type: Type.STRING },
            faseLabel: { type: Type.STRING },
            kelasDefault: { type: Type.STRING },
            alokasiJp: { type: Type.INTEGER },
            elemenCp: { type: Type.ARRAY, items: { type: Type.STRING } },
            kesesuaianRegulasi: { type: Type.STRING },
            rangkumanAnalisisAi: { type: Type.STRING },
            babList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  kodeBab: { type: Type.STRING },
                  judulBab: { type: Type.STRING },
                  subBab: { type: Type.ARRAY, items: { type: Type.STRING } },
                  semester: { type: Type.INTEGER },
                  alokasiJp: { type: Type.INTEGER }
                },
                required: ["kodeBab", "judulBab", "subBab", "semester", "alokasiJp"]
              }
            }
          },
          required: [
            "judulBuku",
            "penerbit",
            "pengarang",
            "tahunTerbit",
            "mapel",
            "faseCode",
            "faseLabel",
            "kelasDefault",
            "alokasiJp",
            "elemenCp",
            "kesesuaianRegulasi",
            "rangkumanAnalisisAi",
            "babList"
          ]
        }
      }
    });
    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (err) {
    console.error("Error in /api/gemini/analyze-book:", err);
    return res.status(500).json({
      error: "GEMINI_ANALYZE_ERROR",
      message: err.message || "Terjadi kesalahan saat menganalisis berkas buku dengan AI."
    });
  }
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", hasGeminiKey: Boolean(apiKey) });
});
async function startServer() {
  const isProduction = process.env.NODE_ENV === "production" || !fs.existsSync(path.resolve(__dirname, "src"));
  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
  app.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port} (${isProduction ? "production" : "development"})`);
  });
}
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});

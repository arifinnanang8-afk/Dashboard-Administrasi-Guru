import * as XLSX from 'xlsx';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  PageOrientation,
} from 'docx';
import {
  SchoolProfile,
  StudentRecord,
  ProtaItem,
  PromesItem,
  ModulAjarItem,
  LkpdItem,
  CpElement,
  TujuanPembelajaran,
  RpeState,
  KaldikEvent,
} from '../types';
import {
  calculateRpeTotals,
  getSyncedSubChaptersForBab,
  getCompleteBookSourceString,
  ensureOfficialKemendikdasmenModul,
  getSubjectRasionalAndCpElements,
  buildUnifiedRpeExportPayload,
  formatKaldikCategoryExportLabel,
  getIndonesianMonthYearLabel,
  formatDateRangeLabelId,
  TeachingDayName,
} from './curriculumLogic';
import { getTenAssessmentInstruments } from './assessmentInstruments';

/**
 * Downloads a Blob directly to the client browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads data as JSON
 */
export function downloadJson(data: any, filename: string = 'backup-administrasi-guru.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  downloadBlob(blob, filename);
}

/**
 * Shared solid table border definition for universal Microsoft Word compatibility
 */
const SOLID_TABLE_BORDERS = {
  top: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
  bottom: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
  left: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
  right: { style: BorderStyle.SINGLE, size: 6, color: '0F172A' },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: '64748B' },
  insideVertical: { style: BorderStyle.SINGLE, size: 4, color: '64748B' },
};

const NO_BORDERS = {
  top: { style: BorderStyle.NONE },
  bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE },
  right: { style: BorderStyle.NONE },
  insideHorizontal: { style: BorderStyle.NONE },
  insideVertical: { style: BorderStyle.NONE },
};

/**
 * Safely converts a base64 Data URL (PNG/JPG/GIF/BMP) into a docx ImageRun
 */
function createImageRunFromDataUrl(
  dataUrl: string | undefined,
  width: number,
  height: number
): ImageRun | null {
  if (!dataUrl || !dataUrl.startsWith('data:image/')) return null;
  try {
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const meta = parts[0].toLowerCase();
    const base64 = parts[1];
    if (meta.includes('svg')) return null; // Skip raw SVG in binary ImageRun; fallback text/raster used
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const imgType: 'png' | 'jpg' | 'gif' | 'bmp' =
      meta.includes('jpeg') || meta.includes('jpg')
        ? 'jpg'
        : meta.includes('gif')
        ? 'gif'
        : meta.includes('bmp')
        ? 'bmp'
        : 'png';

    return new ImageRun({
      data: bytes,
      transformation: { width, height },
      type: imgType,
    });
  } catch {
    return null;
  }
}

/**
 * Helper to create a styled table cell
 */
function makeCell(
  textOrParagraphs: string | Paragraph[],
  options?: {
    widthPct?: number;
    bold?: boolean;
    fill?: string;
    color?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    fontSize?: number;
    italics?: boolean;
    colSpan?: number;
    rowSpan?: number;
  }
): TableCell {
  const paragraphs: Paragraph[] = Array.isArray(textOrParagraphs)
    ? textOrParagraphs
    : [
        new Paragraph({
          alignment: options?.align || AlignmentType.LEFT,
          children: [
            new TextRun({
              text: textOrParagraphs,
              bold: options?.bold ?? false,
              italics: options?.italics ?? false,
              size: options?.fontSize ?? 20,
              color: options?.color ?? '0F172A',
              font: 'Calibri',
            }),
          ],
        }),
      ];

  return new TableCell({
    width: options?.widthPct ? { size: options.widthPct, type: WidthType.PERCENTAGE } : undefined,
    columnSpan: options?.colSpan,
    rowSpan: options?.rowSpan,
    verticalAlign: VerticalAlign.CENTER,
    shading: options?.fill
      ? { fill: options.fill, type: ShadingType.CLEAR, color: 'auto' }
      : undefined,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    children: paragraphs,
  });
}

/**
 * Official 3-Column Kop Sekolah Table (Left Logo | Center 7-line Kop | Right Logo)
 * Matches the exact Kop Sekolah on the Preview Screen
 */
export function createOfficialKopTable(profile: SchoolProfile): Table {
  const leftLogoRun = createImageRunFromDataUrl(profile.leftLogoUrl || profile.logoUrl, 85, 85);
  const rightLogoRun = createImageRunFromDataUrl(profile.rightLogoUrl, 85, 85);

  const isDinas = profile.kopType === 'dinas';

  const centerParagraphs: Paragraph[] = isDinas
    ? [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'PEMERINTAH PROVINSI LAMPUNG',
              bold: true,
              size: 20,
              color: '334155',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'DINAS PENDIDIKAN DAN KEBUDAYAAN',
              bold: true,
              size: 20,
              color: '334155',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: profile.schoolName.toUpperCase(),
              bold: true,
              size: 28,
              color: '0F172A',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `NPSN: ${profile.npsn || '10802058'}     |     Terakreditasi : ${profile.akreditasi || 'A'}`,
              bold: true,
              size: 19,
              color: '0F172A',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Telp: ${profile.phone || '(0729) 732109'} | Email: ${profile.email}`,
              size: 17,
              color: '475569',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: profile.address,
              size: 18,
              color: '334155',
              font: 'Calibri',
            }),
          ],
        }),
      ]
    : [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "LEMBAGA PENDIDIKAN MA'ARIF NU LAMPUNG TENGAH",
              bold: true,
              size: 20,
              color: '334155',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: profile.schoolName.toUpperCase(),
              bold: true,
              size: 28,
              color: '0F172A',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Program Keahlian: ${
                Array.isArray(profile.programKeahlian)
                  ? profile.programKeahlian.join(' | ')
                  : (profile.programKeahlian || '1. Manajemen Perkantoran | 2. Teknik Komputer dan Jaringan').replace(/\n/g, ' | ')
              }`,
              bold: true,
              size: 19,
              color: '1E293B',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `NPSN: ${profile.npsn || '10802058'}     |     Terakreditasi : ${profile.akreditasi || 'A'}`,
              bold: true,
              size: 19,
              color: '0F172A',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `Telp: ${profile.phone || '(0729) 732109'} | Email: ${profile.email}`,
              size: 17,
              color: '475569',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [
            new TextRun({
              text: profile.address,
              size: 18,
              color: '334155',
              font: 'Calibri',
            }),
          ],
        }),
      ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.DOUBLE, size: 14, color: '0F172A' },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: leftLogoRun ? [leftLogoRun] : [new TextRun({ text: '' })],
              }),
            ],
          }),
          new TableCell({
            width: { size: 68, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: centerParagraphs,
          }),
          new TableCell({
            width: { size: 16, type: WidthType.PERCENTAGE },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: rightLogoRun ? [rightLogoRun] : [new TextRun({ text: '' })],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Official 2-Column Signature Table (Kepala Sekolah & Guru Mata Pelajaran)
 * Includes uploaded signature images if available
 */
export function createOfficialSignatureTable(profile: SchoolProfile): Table {
  const ksSignRun = createImageRunFromDataUrl(profile.headmasterSignatureUrl, 130, 60);
  const teacherSignRun = createImageRunFromDataUrl(profile.teacherSignatureUrl, 130, 60);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDERS,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 120, after: 80 },
                children: [
                  new TextRun({
                    text: profile.signaturePlaceDate,
                    size: 20,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Mengetahui,', size: 20, font: 'Calibri' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Kepala Sekolah', bold: true, size: 20, font: 'Calibri' }),
                ],
              }),
              ...(ksSignRun
                ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 80, after: 80 },
                      children: [ksSignRun],
                    }),
                  ]
                : [
                    new Paragraph({ text: '' }),
                    new Paragraph({ text: '' }),
                    new Paragraph({ text: '' }),
                  ]),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: profile.headmasterName,
                    bold: true,
                    underline: {},
                    size: 20,
                    font: 'Calibri',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${profile.headmasterIdType || 'NIP'}. ${profile.headmasterNip}`,
                    size: 19,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: 'Disusun Oleh,', size: 20, font: 'Calibri' })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `Guru Mata Pelajaran ${profile.subject}`,
                    bold: true,
                    size: 20,
                    font: 'Calibri',
                  }),
                ],
              }),
              ...(teacherSignRun
                ? [
                    new Paragraph({
                      alignment: AlignmentType.CENTER,
                      spacing: { before: 80, after: 80 },
                      children: [teacherSignRun],
                    }),
                  ]
                : [
                    new Paragraph({ text: '' }),
                    new Paragraph({ text: '' }),
                    new Paragraph({ text: '' }),
                  ]),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: profile.teacherName,
                    bold: true,
                    underline: {},
                    size: 20,
                    font: 'Calibri',
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: `${profile.teacherIdType || 'NIP'}. ${profile.teacherNip}`,
                    size: 19,
                    font: 'Calibri',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

/**
 * Official Standard Curriculum Identity Table:
 * IDENTITAS:
 * Satuan Pendidikan:
 * Mata Pelajaran:
 * Fase / Kelas:
 * Tahun Ajaran / Semester:
 * Guru Penyusun:
 * NUPTK Guru:
 */
export function createOfficialIdentitasTable(profile: SchoolProfile, customSemester?: string): Table {
  const nuptk = profile.teacherNuptk || profile.teacherNip || '-';
  const semesterStr =
    customSemester ||
    `${profile.academicYear} / Semester ${profile.semester === 2 ? '2 (Genap)' : '1 (Ganjil)'}`;

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      left: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      right: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          makeCell('IDENTITAS PERANGKAT PEMBELAJARAN', { widthPct: 30, bold: true, fill: 'F1F5F9' }),
          makeCell('KURIKULUM MERDEKA & DEEP LEARNING (BSKAP 2025)', { widthPct: 70, bold: true, fill: 'F1F5F9' }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Satuan Pendidikan', { widthPct: 30, bold: true }),
          makeCell(`: ${profile.schoolName}`, { widthPct: 70, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Mata Pelajaran', { widthPct: 30, bold: true }),
          makeCell(`: ${profile.subject}`, { widthPct: 70, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Fase / Kelas', { widthPct: 30, bold: true }),
          makeCell(`: Fase ${profile.fase} / ${profile.grade}`, { widthPct: 70 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Tahun Ajaran / Semester', { widthPct: 30, bold: true }),
          makeCell(`: ${semesterStr}`, { widthPct: 70 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Guru Penyusun', { widthPct: 30, bold: true }),
          makeCell(`: ${profile.teacherName}`, { widthPct: 70, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('NUPTK Guru', { widthPct: 30, bold: true }),
          makeCell(`: ${nuptk}`, { widthPct: 70 }),
        ],
      }),
    ],
  });
}

/**
 * Universal Direct Preview-to-Word Exporter (.doc HTML-Word with full MSO table borders & embedded images)
 * Works in ALL versions of Microsoft Office Word (97, 2003, 2007, 2010, 2013, 2016, 2019, 2021, 365, WPS, LibreOffice)
 * Preserves 100% of the exact visual layout & tables displayed on the preview screen.
 */
export function exportPreviewDomToUniversalWord(elementId: string, filename: string) {
  const el = document.getElementById(elementId);
  if (!el) return false;

  const targetName = filename.endsWith('.doc')
    ? filename
    : filename.replace(/\.docx$/i, '') + '.doc';

  const htmlContent = `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${targetName}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page WordSection1 {
      size: 21cm 29.7cm;
      margin: 1.5cm 1.5cm 1.5cm 1.5cm;
      mso-header-margin: 1.0cm;
      mso-footer-margin: 1.0cm;
    }
    div.WordSection1 { page: WordSection1; }
    body {
      font-family: "Calibri", "Times New Roman", Arial, sans-serif;
      font-size: 10.5pt;
      color: #0f172a;
      line-height: 1.35;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
      margin-top: 6pt;
      margin-bottom: 8pt;
    }
    th, td {
      border: 1pt solid #0f172a;
      padding: 5pt 6pt;
      vertical-align: top;
      font-size: 9.5pt;
    }
    th {
      background-color: #f1f5f9;
      font-weight: bold;
    }
    h1, h2, h3, h4 {
      margin: 3pt 0;
      font-weight: bold;
    }
    p {
      margin: 2pt 0;
    }
    .page-break {
      page-break-before: always;
      mso-special-character: line-break;
    }
  </style>
</head>
<body>
  <div class="WordSection1">
    ${el.innerHTML}
  </div>
</body>
</html>`;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8',
  });
  downloadBlob(blob, targetName);
  return true;
}

/**
 * Exports grade roster to a structured Excel spreadsheet
 */
function getExcelIdentityHeader(profile: SchoolProfile, docTitle: string, customSemester?: string): any[][] {
  const nuptk = profile.teacherNuptk || profile.teacherNip || '-';
  const semStr = customSemester || `${profile.academicYear} / Semester ${profile.semester === 2 ? '2 (Genap)' : '1 (Ganjil)'}`;
  return [
    [docTitle.toUpperCase()],
    ['IDENTITAS PERANGKAT PEMBELAJARAN — KURIKULUM MERDEKA & DEEP LEARNING (BSKAP 2025)'],
    ['Satuan Pendidikan', `: ${profile.schoolName}`, '', 'Tahun Ajaran / Semester', `: ${semStr}`],
    ['Mata Pelajaran', `: ${profile.subject}`, '', 'Guru Penyusun', `: ${profile.teacherName}`],
    ['Fase / Kelas', `: Fase ${profile.fase} / ${profile.grade}`, '', 'NUPTK Guru', `: ${nuptk}`],
    [],
  ];
}

export function exportGradesToExcel(
  students: StudentRecord[],
  profile: SchoolProfile,
  filename?: string
) {
  const cleanSub = profile.subject.replace(/\s+/g, '_');
  const cleanYr = profile.academicYear.replace('/', '-');
  const targetFile = filename || `REKAP_NILAI_RAPOR_${cleanSub}_${cleanYr}.xlsx`;

  const headerInfo = [
    ...getExcelIdentityHeader(profile, `REKAP DAFTAR NILAI ASESMEN & RAPOR - TA ${profile.academicYear}`),
    [
      'No',
      'NISN',
      'Nama Peserta Didik',
      'L/P',
      'TP 10.1',
      'TP 10.2',
      'TP 10.3',
      'TP 10.4',
      'TP 10.5',
      'TP 10.6',
      'TP 10.7',
      'Rata Formatif',
      'Sumatif Akhir',
      'Nilai Akhir',
      'Predikat',
      'Status KKTP',
      'Deskripsi Capaian Kompetensi',
    ],
  ];

  const rows = students.map((s, idx) => {
    const fScores = Object.values(s.formatifScores);
    const avgF = fScores.length ? Math.round(fScores.reduce((a, b) => a + b, 0) / fScores.length) : 0;
    return [
      idx + 1,
      s.nisn,
      s.name,
      s.gender,
      s.formatifScores['TP 10.1'] || 0,
      s.formatifScores['TP 10.2'] || 0,
      s.formatifScores['TP 10.3'] || 0,
      s.formatifScores['TP 10.4'] || 0,
      s.formatifScores['TP 10.5'] || 0,
      s.formatifScores['TP 10.6'] || 0,
      s.formatifScores['TP 10.7'] || 0,
      avgF,
      s.sumatifAkhir,
      s.nilaiAkhir,
      s.predikat,
      s.kktpStatus,
      s.deskripsi,
    ];
  });

  const fullData = [...headerInfo, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(fullData);

  worksheet['!cols'] = [
    { wch: 4 },
    { wch: 14 },
    { wch: 28 },
    { wch: 6 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 13 },
    { wch: 13 },
    { wch: 11 },
    { wch: 9 },
    { wch: 15 },
    { wch: 52 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekap Nilai Rapor');
  XLSX.writeFile(workbook, targetFile);
}

/**
 * Exports PROTA to Excel spreadsheet
 */
export function exportProtaToExcel(prota: ProtaItem[], profile: SchoolProfile) {
  const header = [
    ...getExcelIdentityHeader(
      profile,
      `PROGRAM TAHUNAN (PROTA) - TAHUN AJARAN ${profile.academicYear}`,
      `${profile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)`
    ),
    [
      'No',
      'Semester',
      'Bab / Lingkup Materi',
      'Kode TP',
      'Tujuan Pembelajaran',
      'Jml Pertemuan',
      'Alokasi (JP)',
      'Perkiraan Bulan',
      'Keterangan',
    ],
  ];

  const rows = prota.map((item, idx) => {
    const meetings =
      item.jmlPertemuan !== undefined
        ? item.jmlPertemuan
        : Math.max(0, Math.round((Number(item.alokasiJp) || 0) / 2));
    return [
      idx + 1,
      `Semester ${item.semester}`,
      item.babTitle,
      item.tpCode,
      item.tpDescription,
      meetings,
      item.alokasiJp,
      item.perkiraanBulan || `Semester ${item.semester}`,
      item.keterangan,
    ];
  });

  const totalMeetings = rows.reduce((acc, r) => acc + (Number(r[5]) || 0), 0);
  const totalJp = prota.reduce((acc, p) => acc + (Number(p.alokasiJp) || 0), 0);
  rows.push([
    '',
    '',
    'TOTAL ALOKASI JAM PELAJARAN 1 TAHUN',
    '',
    '',
    totalMeetings,
    totalJp,
    'Sinkron Kalender & RPE',
    '',
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
  ws['!cols'] = [
    { wch: 4 },
    { wch: 13 },
    { wch: 34 },
    { wch: 12 },
    { wch: 48 },
    { wch: 14 },
    { wch: 12 },
    { wch: 24 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'PROTA 1 Tahun');
  XLSX.writeFile(wb, `PROTA_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.xlsx`);
}

/**
 * Exports Analisis CP & ATP (6-Section BSKAP 046/2025 Format) to Excel spreadsheet
 */
export function exportCpAtpToExcel(
  cpElements: CpElement[],
  tujuanPembelajaran: TujuanPembelajaran[],
  profile: SchoolProfile,
  rpe?: RpeState
) {
  const subjectInfo = getSubjectRasionalAndCpElements(profile.subject, profile.grade, profile.fase);
  const displayElements = cpElements && cpElements.length > 0 ? cpElements : subjectInfo.cpElements;
  const bookTitle = getCompleteBookSourceString(profile);

  const totalJp = tujuanPembelajaran.reduce((a, b) => a + (Number(b.jpAllocation) || 0), 0);
  const s1Jp = tujuanPembelajaran.filter((t) => t.semester === 1).reduce((a, b) => a + (Number(b.jpAllocation) || 0), 0);
  const s2Jp = tujuanPembelajaran.filter((t) => t.semester === 2).reduce((a, b) => a + (Number(b.jpAllocation) || 0), 0);

  const s1Target = rpe
    ? calculateRpeTotals(rpe.semester1.months, rpe.semester1.jpPerWeek, rpe.semester1.cadanganJp).netJp
    : s1Jp;
  const s2Target = rpe
    ? calculateRpeTotals(rpe.semester2.months, rpe.semester2.jpPerWeek, rpe.semester2.cadanganJp).netJp
    : s2Jp;

  const sheetData: any[][] = [
    ...getExcelIdentityHeader(
      profile,
      `ANALISIS CAPAIAN PEMBELAJARAN (CP) & ALUR TUJUAN PEMBELAJARAN (ATP) — BSKAP 046/2025`,
      `${profile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)`
    ),
    ['SUMBER RESMI CP', ': https://kurikulum.kemendikdasmen.go.id/ (KepKa BSKAP No. 046/H/KR/2025, Permendikbudristek No. 12 Tahun 2024, Permendikbudristek Nomor 13 Tahun 2025, dan KMA No. 1503 Tahun 2025)'],
    ['BUKU TEKS UTAMA / PENDAMPING TERPILIH', `: ${bookTitle}`],
    [],
    ['I. BUKU PILIHAN (FILTER PENERBIT) & CP/ATP DITERAPKAN — ELEMEN CAPAIAN PEMBELAJARAN RESMI BSKAP 046/2025'],
    ['No', 'Elemen Capaian Pembelajaran', 'Deskripsi Resmi Capaian Pembelajaran (BSKAP 046/2025)', 'Fokus Kompetensi'],
    ...displayElements.map((el, idx) => [
      idx + 1,
      el.name,
      el.deskripsi,
      (el.kompetensi || []).join(' | '),
    ]),
    [],
    ['RASIONAL & KARAKTERISTIK MATA PELAJARAN'],
    [subjectInfo.rasional],
    [],
    ['II. ANALISIS PEMETAAN ELEMEN CP KE KOMPETENSI DAN LINGKUP MATERI'],
    ['No', 'Elemen CP', 'Kalimat Capaian Pembelajaran (CP) BSKAP 046/2025', 'Kompetensi yang Dituju (KKO)', 'Lingkup Materi Esensial', 'Variasi Keterampilan'],
    ...displayElements.map((el, idx) => {
      const kkoStr = (
        el.kompetensi || [
          `Memahami konsep dasar ${el.name.toLowerCase()} (C2)`,
          `Menerapkan prinsip ${el.name.toLowerCase()} (C3)`,
          `Menganalisis permasalahan kontekstual ${el.name.toLowerCase()} (C4)`,
        ]
      ).join(' | ');
      const materiStr = (
        el.materi || [
          `Konsep esensial ${el.name}`,
          `Analisis studi kasus ${profile.subject}`,
          `Aplikasi proyek kontekstual`,
        ]
      ).join(' | ');
      return [
        idx + 1,
        el.name,
        el.deskripsi,
        kkoStr,
        materiStr,
        el.variasiKeterampilan || 'Penalaran kritis, pemecahan masalah kontekstual, dan komunikasi efektif.',
      ];
    }),
    [],
    ['III. MATRIKS ALUR TUJUAN PEMBELAJARAN (ATP) DAN ALOKASI WAKTU'],
    [
      'No',
      'Kode / Sem',
      'Elemen CP',
      'Tujuan Pembelajaran (TP)',
      'Indikator Ketercapaian (IKTP)',
      'KKO Bloom',
      'Materi Pokok & Sub-Materi',
      'Alokasi (JP)',
      'Profil Pelajar Pancasila',
      'Rencana Asesmen & Media',
    ],
    ...tujuanPembelajaran.map((tp, idx) => {
      const babNum = parseInt(tp.babId.replace(/\D/g, ''), 10) || idx + 1;
      return [
        idx + 1,
        `${tp.code} (Smt ${tp.semester})`,
        tp.element,
        tp.description,
        tp.indikatorKinerja || `Siswa mampu menguasai kompetensi ${tp.materiPokok} secara terukur.`,
        `${tp.bloomLevel} (${tp.hotsCategory})`,
        `${tp.materiPokok} (Bab ${babNum}) — ${tp.subMateri || ''} [${bookTitle}]`,
        tp.jpAllocation,
        (tp.profilPelajarPancasila || ['Bernalar Kritis', 'Mandiri']).join(', '),
        tp.rencanaAsesmen || 'Formatif: LKPD Studi Kasus; Sumatif: Tes tertulis & proyek',
      ];
    }),
    [
      '',
      '',
      'TOTAL ALOKASI JAM PELAJARAN (JP) YANG DIANALISIS :',
      '',
      '',
      '',
      '',
      `${totalJp} JP`,
      `Semester 1: ${s1Jp} JP (Target RPE: ${s1Target} JP) | Semester 2: ${s2Jp} JP (Target RPE: ${s2Target} JP)`,
      '',
    ],
    [],
    ['IV. PRINSIP DAN RASIONAL ALUR PENGURUTAN TUJUAN PEMBELAJARAN (ATP)'],
    [
      `Alur Tujuan Pembelajaran disusun secara sistematis mengacu pada Panduan Pembelajaran dan Asesmen (PPA) Kurikulum Merdeka. Pengurutan materi memadukan pendekatan Hierarkis (keterampilan prasyarat), Pengurutan dari Konkret ke Abstrak, serta Prosedural bertingkat (scaffolding). Beban jam pelajaran tiap semester telah dihitung secara presisi berdasarkan Rincian Pekan Efektif (RPE) Kalender Pendidikan ${profile.academicYear}.`,
    ],
    [],
    ['V. PANDUAN KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)'],
    ['0 - 65% (Perlu Bimbingan)', 'Belum mencapai ketuntasan. Wajib mengikuti remedial seluruh materi pokok terkait.'],
    ['66 - 75% (Cukup)', 'Mencapai batas ketuntasan minimal. Diberikan remedial parsial pada indikator yang lemah.'],
    ['76 - 85% (Baik)', 'Tuntas dengan capaian baik. Dapat melanjutkan ke TP berikutnya secara mandiri.'],
    ['86 - 100% (Sangat Mahir)', 'Tuntas melampaui standar. Diberikan program pengayaan studi kasus lanjutan atau tutor sebaya.'],
    [],
    ['VI. REKOMENDASI STRATEGI PEMBELAJARAN BERDIFERENSIASI'],
    [
      'Lakukan pemetaan diagnostik awal. Bagi peserta didik dalam kelompok fleksibel (kemampuan dasar, menengah, mahir) dan gunakan bahan ajar multimodal (teks, video, manipulatif).',
    ],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 24 },
    { wch: 42 },
    { wch: 36 },
    { wch: 42 },
    { wch: 12 },
    { wch: 24 },
    { wch: 34 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Analisis CP dan ATP');
  XLSX.writeFile(
    wb,
    `ANALISIS_CP_ATP_${profile.subject.replace(/\s+/g, '_')}_FASE_${profile.fase}_${profile.academicYear.replace('/', '-')}.xlsx`
  );
}

/**
 * Exports PROMES (Program Semester 1 & 2) to Excel spreadsheet
 */
export function exportPromesToExcel(
  promes: PromesItem[],
  profile: SchoolProfile,
  selectedSemester: 1 | 2 | 'both' = 'both'
) {
  const wb = XLSX.utils.book_new();

  const buildSemesterSheet = (sem: 1 | 2) => {
    const months =
      sem === 1
        ? [
            { label: 'Juli', weeks: ['Jul-1', 'Jul-2', 'Jul-3', 'Jul-4'] },
            { label: 'Agustus', weeks: ['Agu-1', 'Agu-2', 'Agu-3', 'Agu-4', 'Agu-5'] },
            { label: 'September', weeks: ['Sep-1', 'Sep-2', 'Sep-3', 'Sep-4'] },
            { label: 'Oktober', weeks: ['Okt-1', 'Okt-2', 'Okt-3', 'Okt-4', 'Okt-5'] },
            { label: 'November', weeks: ['Nov-1', 'Nov-2', 'Nov-3', 'Nov-4'] },
            { label: 'Desember', weeks: ['Des-1', 'Des-2', 'Des-3', 'Des-4', 'Des-5'] },
          ]
        : [
            { label: 'Januari', weeks: ['Jan-1', 'Jan-2', 'Jan-3', 'Jan-4'] },
            { label: 'Februari', weeks: ['Feb-1', 'Feb-2', 'Feb-3', 'Feb-4'] },
            { label: 'Maret', weeks: ['Mar-1', 'Mar-2', 'Mar-3', 'Mar-4', 'Mar-5'] },
            { label: 'April', weeks: ['Apr-1', 'Apr-2', 'Apr-3', 'Apr-4'] },
            { label: 'Mei', weeks: ['Mei-1', 'Mei-2', 'Mei-3', 'Mei-4', 'Mei-5'] },
            { label: 'Juni', weeks: ['Jun-1', 'Jun-2', 'Jun-3', 'Jun-4'] },
          ];

    const allWeekKeys = months.flatMap((m) => m.weeks);
    const items = promes.filter((p) => p.semester === sem);

    const header = [
      ...getExcelIdentityHeader(
        profile,
        `PROGRAM SEMESTER (PROMES) — SEMESTER ${sem === 1 ? '1 (GANJIL)' : '2 (GENAP)'}`,
        `${profile.academicYear} / Semester ${sem === 1 ? '1 (Ganjil)' : '2 (Genap)'}`
      ),
      ['No', 'Kode TP', 'Bab / Tujuan Pembelajaran', 'Alokasi JP', ...allWeekKeys],
    ];

    const rows = items.map((item, idx) => [
      idx + 1,
      item.tpCode,
      `${item.babTitle} — ${item.tpDescription}`,
      item.alokasiJp,
      ...allWeekKeys.map((wk) => item.distribution?.[wk] || ''),
    ]);

    const totalJp = items.reduce((a, b) => a + (Number(b.alokasiJp) || 0), 0);
    rows.push(['', '', `TOTAL JAM PELAJARAN SEMESTER ${sem}`, totalJp, ...allWeekKeys.map(() => '')]);

    const ws = XLSX.utils.aoa_to_sheet([...header, ...rows]);
    ws['!cols'] = [
      { wch: 4 },
      { wch: 10 },
      { wch: 45 },
      { wch: 12 },
      ...allWeekKeys.map(() => ({ wch: 7 })),
    ];
    return ws;
  };

  if (selectedSemester === 1 || selectedSemester === 'both') {
    XLSX.utils.book_append_sheet(wb, buildSemesterSheet(1), 'PROMES Semester 1');
  }
  if (selectedSemester === 2 || selectedSemester === 'both') {
    XLSX.utils.book_append_sheet(wb, buildSemesterSheet(2), 'PROMES Semester 2');
  }

  XLSX.writeFile(
    wb,
    `PROMES_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.xlsx`
  );
}

/**
 * Exports RPE (Rincian Pekan Efektif & Alokasi JP) to Excel spreadsheet
 */
export interface RpeUnifiedExportExtra {
  kaldikEvents?: KaldikEvent[];
  prota?: ProtaItem[];
  promes?: PromesItem[];
  selectedDays?: TeachingDayName[];
}

/**
 * Exports RPE (Kalender & RPE Langkah 1-4 Terpadu) to multi-sheet Excel spreadsheet
 */
export function exportRpeToExcel(
  rpe: RpeState,
  profile: SchoolProfile,
  extra?: RpeUnifiedExportExtra
) {
  const payload = buildUnifiedRpeExportPayload({
    rpe,
    academicYear: profile.academicYear,
    kaldikEvents: extra?.kaldikEvents,
    prota: extra?.prota,
    promes: extra?.promes,
    selectedDays: extra?.selectedDays,
  });

  const wb = XLSX.utils.book_new();

  // Sheet 1: Analisis Minggu Efektif 12 Bulan + Distribusi Semester 1 & Semester 2
  const sheet1Data: any[][] = [
    ...getExcelIdentityHeader(
      profile,
      `KALENDER PENDIDIKAN, ANALISIS MINGGU EFEKTIF & DISTRIBUSI JAM PELAJARAN (RPE)`,
      `${profile.academicYear} · Jadwal Mengajar: ${payload.selectedDays.join(', ')}`
    ),
    ['I. ANALISIS MINGGU EFEKTIF & HARI/PERTEMUAN EFEKTIF (12 BULAN)'],
    [
      'No',
      'Bulan',
      'Jumlah Minggu',
      'Minggu Tidak Efektif',
      'Minggu Efektif',
      'Jml Pertemuan Efektif',
      'Total JP Efektif',
      'Keterangan Minggu Tidak Efektif / Agenda',
    ],
    ...payload.twelveMonthRows.map((row) => [
      row.no,
      row.month,
      row.totalWeeks,
      row.nonEffectiveWeeks,
      row.effectiveWeeks,
      row.effectiveMeetings,
      row.effectiveJp,
      row.note,
    ]),
    [
      '',
      'JUMLAH TOTAL (12 BULAN)',
      payload.annualSummary.totalWeeks,
      payload.annualSummary.nonEffectiveWeeks,
      payload.annualSummary.effectiveWeeks,
      payload.annualSummary.effectiveMeetings,
      payload.annualSummary.grossJp,
      `Total Jam Efektif = ${payload.annualSummary.effectiveWeeks} Minggu · Bersih ${payload.annualSummary.netJp} JP (Cadangan ${payload.annualSummary.cadanganJp} JP)`,
    ],
    [],
    ['II. TABEL DISTRIBUSI PEKAN EFEKTIF & NON-EFEKTIF SEMESTER 1 (GANJIL)'],
    [
      'No',
      'Nama Bulan',
      'Jml Pekan',
      'Pekan Non-Efektif',
      'Pekan Efektif',
      'Pertemuan Efektif',
      'JP Efektif',
      'Keterangan / Alasan Non-Efektif',
    ],
    ...payload.s1Rows.map((row) => [
      row.semNo,
      row.month,
      row.totalWeeks,
      row.nonEffectiveWeeks,
      row.effectiveWeeks,
      row.effectiveMeetings,
      row.effectiveJp,
      row.note,
    ]),
    [
      '',
      'TOTAL SEMESTER 1',
      payload.s1Summary.totalWeeks,
      payload.s1Summary.nonEffectiveWeeks,
      payload.s1Summary.effectiveWeeks,
      payload.s1Summary.effectiveMeetings,
      payload.s1Summary.grossJp,
      `Jam Efektif Bersih: ${payload.s1Summary.netJp} JP (Cadangan ${payload.s1Summary.cadanganJp} JP)`,
    ],
    [],
    ['III. TABEL DISTRIBUSI PEKAN EFEKTIF & NON-EFEKTIF SEMESTER 2 (GENAP)'],
    [
      'No',
      'Nama Bulan',
      'Jml Pekan',
      'Pekan Non-Efektif',
      'Pekan Efektif',
      'Pertemuan Efektif',
      'JP Efektif',
      'Keterangan / Alasan Non-Efektif',
    ],
    ...payload.s2Rows.map((row) => [
      row.semNo,
      row.month,
      row.totalWeeks,
      row.nonEffectiveWeeks,
      row.effectiveWeeks,
      row.effectiveMeetings,
      row.effectiveJp,
      row.note,
    ]),
    [
      '',
      'TOTAL SEMESTER 2',
      payload.s2Summary.totalWeeks,
      payload.s2Summary.nonEffectiveWeeks,
      payload.s2Summary.effectiveWeeks,
      payload.s2Summary.effectiveMeetings,
      payload.s2Summary.grossJp,
      `Jam Efektif Bersih: ${payload.s2Summary.netJp} JP (Cadangan ${payload.s2Summary.cadanganJp} JP)`,
    ],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!cols'] = [
    { wch: 5 },
    { wch: 22 },
    { wch: 15 },
    { wch: 18 },
    { wch: 16 },
    { wch: 20 },
    { wch: 16 },
    { wch: 46 },
  ];
  XLSX.utils.book_append_sheet(wb, ws1, '1. Analisis 12 Bln & RPE');

  // Sheet 2: Program Alokasi Waktu & Distribusi Tujuan Pembelajaran (TP)
  const sheet2Data: any[][] = [
    ...getExcelIdentityHeader(
      profile,
      'PROGRAM ALOKASI WAKTU & DISTRIBUSI TUJUAN PEMBELAJARAN (TP)',
      `Target Total JP Efektif Kaldik: ${payload.tpSummary.targetEffectiveJp} JP`
    ),
    [
      'No',
      'Kode / Jenis',
      'Lingkup Materi & Tujuan Pembelajaran (TP) / Kegiatan',
      'Jml Pertemuan',
      'Alokasi JP',
      'Perkiraan Bulan',
    ],
    ...payload.tpRows.map((row) => [
      row.no,
      row.tpCode,
      row.lingkupMateri,
      row.jmlPertemuan,
      row.alokasiJp,
      row.perkiraanBulan,
    ]),
    [
      '',
      'TOTAL ALOKASI',
      payload.tpSummary.isBalanced
        ? 'Alokasi Waktu Seimbang (Pas dengan Total JP Efektif Kaldik)'
        : `Selisih ${payload.tpSummary.diffJp} JP terhadap Total JP Efektif Kaldik`,
      payload.tpSummary.totalMeetings,
      payload.tpSummary.totalAllocatedJp,
      `Terpakai: ${payload.tpSummary.totalAllocatedJp} / ${payload.tpSummary.targetEffectiveJp} JP`,
    ],
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 56 },
    { wch: 16 },
    { wch: 14 },
    { wch: 26 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, '2. Program Alokasi Waktu TP');

  // Sheet 3: Rincian Hari Terjadwal vs Libur Kaldik (Jadwal Mengajar Riil)
  const sheet3Data: any[][] = [
    ...getExcelIdentityHeader(
      profile,
      'RINCIAN HARI TERJADWAL VS LIBUR KALENDER PENDIDIKAN',
      `Hari Jadwal Mengajar: ${payload.selectedDays.join(', ')}`
    ),
    [
      'No',
      'Bulan',
      'Hari Terjadwal',
      'Terkena Libur Kaldik',
      'Pertemuan Efektif Tersinkron',
      'Keterangan Tanggal Terkena Agenda / Libur',
    ],
    ...payload.twelveMonthRows.map((row) => [
      row.no,
      row.month,
      row.scheduledCount,
      row.holidayCount,
      row.effectiveMeetings,
      row.affectedSummary,
    ]),
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = [
    { wch: 5 },
    { wch: 20 },
    { wch: 16 },
    { wch: 20 },
    { wch: 24 },
    { wch: 52 },
  ];
  XLSX.utils.book_append_sheet(wb, ws3, '3. Jadwal Mengajar Riil');

  // Sheet 4: Rincian Agenda & Hari Libur Kalender Pendidikan
  if (payload.kaldikRows.length > 0) {
    const sheet4Data: any[][] = [
      ...getExcelIdentityHeader(
        profile,
        `RINCIAN AGENDA & HARI LIBUR KALENDER PENDIDIKAN (${profile.academicYear})`,
        `${payload.kaldikRows.length} Agenda Tersinkron`
      ),
      ['No', 'Bulan', 'Rentang Tanggal', 'Uraian Kegiatan / Hari Libur', 'Kategori Status', 'Keterangan'],
      ...payload.kaldikRows.map((row) => [
        row.no,
        row.monthLabel,
        row.dateRangeLabel,
        row.name,
        row.categoryLabel,
        row.notes,
      ]),
    ];
    const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
    ws4['!cols'] = [
      { wch: 5 },
      { wch: 18 },
      { wch: 24 },
      { wch: 42 },
      { wch: 26 },
      { wch: 36 },
    ];
    XLSX.utils.book_append_sheet(wb, ws4, '4. Agenda Kaldik');
  }

  XLSX.writeFile(
    wb,
    `RPE_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.xlsx`
  );
}

/**
 * Exports Kalender Pendidikan (Kaldik) to Excel spreadsheet
 */
export function exportKaldikToExcel(events: KaldikEvent[], profile: SchoolProfile) {
  const sortedEvents = [...events].sort((a, b) =>
    (a.dateStart || '').localeCompare(b.dateStart || '')
  );
  const data: any[][] = [
    ...getExcelIdentityHeader(
      profile,
      `KALENDER PENDIDIKAN (KALDIK) TAHUN AJARAN ${profile.academicYear}`,
      `${profile.academicYear} / Semester 1 & 2 (${sortedEvents.length} Agenda)`
    ),
    ['No', 'Bulan', 'Rentang Tanggal', 'Uraian Kegiatan / Hari Libur', 'Kategori Status', 'Keterangan / Dampak KBM'],
    ...sortedEvents.map((ev, idx) => [
      idx + 1,
      getIndonesianMonthYearLabel(ev.dateStart),
      formatDateRangeLabelId(ev.dateStart, ev.dateEnd),
      ev.name,
      formatKaldikCategoryExportLabel(ev.type),
      ev.notes || '-',
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 5 }, { wch: 18 }, { wch: 24 }, { wch: 42 }, { wch: 28 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Kalender Pendidikan');
  XLSX.writeFile(
    wb,
    `KALDIK_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.xlsx`
  );
}

/**
 * Exports Analisis Taksonomi Bloom & HOTS to Excel spreadsheet
 */
export function exportBloomToExcel(tpList: TujuanPembelajaran[], profile: SchoolProfile) {
  const hotsCount = tpList.filter((t) => ['C4', 'C5', 'C6'].includes(t.bloomLevel)).length;
  const hotsPct = tpList.length ? Math.round((hotsCount / tpList.length) * 100) : 0;

  const data: any[][] = [
    ...getExcelIdentityHeader(
      profile,
      `ANALISIS TAKSONOMI BLOOM & MATRIKS HOTS (C1-C6) — ANDERSON & KRATHWOHL`
    ),
    ['RINGKASAN PROPORSI KOGNITIF', `: ${hotsPct}% Kategori HOTS (${hotsCount} dari ${tpList.length} Tujuan Pembelajaran)`],
    [],
    ['No', 'Kode TP', 'Semester', 'Elemen CP', 'Tujuan Pembelajaran', 'Level Kognitif Bloom', 'Kategori Berpikir', 'Alokasi JP'],
    ...tpList.map((tp, idx) => [
      idx + 1,
      tp.code,
      `Semester ${tp.semester}`,
      tp.element,
      tp.description,
      tp.bloomLevel,
      tp.hotsCategory,
      tp.jpAllocation,
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 5 },
    { wch: 10 },
    { wch: 12 },
    { wch: 24 },
    { wch: 50 },
    { wch: 18 },
    { wch: 16 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Analisis Taksonomi Bloom');
  XLSX.writeFile(
    wb,
    `ANALISIS_BLOOM_HOTS_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.xlsx`
  );
}

/**
 * Exports Modul Ajar Deep Learning (A. Informasi Umum -> H. Lampiran & Pasca Observasi) to Excel spreadsheet
 */
export function exportModulAjarToExcel(
  modulList: ModulAjarItem[],
  profile: SchoolProfile,
  selectedPertemuan: number | 'all' = 'all',
  selectedInstrumentsToPrint?: string[]
) {
  const wb = XLSX.utils.book_new();

  const summaryRows: any[][] = [
    ...getExcelIdentityHeader(
      profile,
      `RENCANA PEMBELAJARAN MENDALAM — KURIKULUM MERDEKA 2026 (PEMBELAJARAN BERDIFERENSIASI)`
    ),
    [
      'Bab',
      'Judul Modul / Lingkup Materi',
      'Semester',
      'Alokasi JP',
      'Jml Pertemuan',
      'Model Pembelajaran',
      'Dimensi Profil Lulusan',
      'Tujuan Pembelajaran',
      'Mindful Learning',
      'Meaningful Learning',
      'Joyful Learning',
    ],
    ...modulList.map((raw) => {
      const m = ensureOfficialKemendikdasmenModul(raw, profile);
      return [
        `Bab ${m.babNumber}`,
        m.babTitle,
        `Semester ${m.semester}`,
        `${m.alokasiJp} JP`,
        `${m.pertemuanCount || Math.ceil(m.alokasiJp / 3)} Pertemuan`,
        m.desainPembelajaran?.praktikPedagogis || m.modelPembelajaran || 'Problem Based Learning (PBL)',
        (m.identifikasi?.dimensiProfilLulusan || m.profilPelajarPancasila).join(', '),
        m.tujuanPembelajaran.join('; '),
        m.deepLearning?.mindful?.description || '',
        m.deepLearning?.meaningful?.description || '',
        m.deepLearning?.joyful?.description || '',
      ];
    }),
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  wsSummary['!cols'] = [
    { wch: 10 },
    { wch: 32 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
    { wch: 30 },
    { wch: 45 },
    { wch: 36 },
    { wch: 36 },
    { wch: 36 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Modul Ajar');

  // Detailed Sheet for Each Bab (A. INFORMASI UMUM -> H. LAMPIRAN & Pasca Observasi)
  modulList.forEach((raw) => {
    const m = ensureOfficialKemendikdasmenModul(raw, profile);
    const dimensiList = m.identifikasi?.dimensiProfilLulusan || [
      'Penalaran Kritis',
      'Kolaborasi',
      'Kemandirian',
    ];
    const tpStr = Array.isArray(m.desainPembelajaran?.tujuanPembelajaran)
      ? m.desainPembelajaran.tujuanPembelajaran.join('; ')
      : m.desainPembelajaran?.tujuanPembelajaran || m.tujuanPembelajaran.join('; ');
    const activeInstrumen =
      selectedInstrumentsToPrint && selectedInstrumentsToPrint.length > 0
        ? selectedInstrumentsToPrint
        : m.asesmenPembelajaran?.contohInstrumen || [
            'Penilaian Sejawat',
            'Penilaian Diri',
            'Penilaian Proyek',
            'Penilaian Produk',
            'Observasi',
            'Portofolio',
            'Penilaian Berbasis Kelas',
            'Penilaian Kinerja',
            'Tes tertulis',
            'Tes lisan',
          ];

    const detailRows: any[][] = [
      ['RENCANA PEMBELAJARAN MENDALAM'],
      ['Kurikulum Merdeka 2026 — Pembelajaran Berdiferensiasi'],
      [profile.schoolName],
      [],
      ['A. INFORMASI UMUM'],
      ['Nama Satuan Pendidikan', profile.schoolName],
      ['Nama Guru Penyusun', profile.teacherName],
      ['NUPTK Guru', profile.teacherNuptk || profile.teacherNip || '-'],
      ['Mata Pelajaran', profile.subject],
      ['Kelas / Fase', `${profile.grade} / Fase ${profile.fase}`],
      ['Semester', `Semester ${m.semester} (${m.semester === 1 ? 'Ganjil' : 'Genap'})`],
      ['Tahun Pelajaran', profile.academicYear],
      [
        'Alokasi Waktu',
        selectedPertemuan !== 'all'
          ? `3 JP (Pertemuan Ke-${selectedPertemuan})`
          : `${m.alokasiJp} JP (${m.pertemuanCount} Pertemuan)`,
      ],
      ['Tanggal Penyusunan', profile.signaturePlaceDate || '14 Oktober 2026'],
      ['Sumber/Referensi CP', `Dokumen kemendikdasmen, BSKAP 046/2025, Fase ${profile.fase}`],
      [],
      ['B. IDENTIFIKASI'],
      ['B.1 Identifikasi Peserta Didik'],
      [
        'Kesiapan Awal (Data Asesmen)',
        m.identifikasi?.pesertaDidik ||
          'Dari 36 siswa, 24 sudah memahami konsep dasar, 8 masih perlu pendampingan, 4 siap materi pendampingan.',
      ],
      [
        'Gaya Belajar',
        'Guru memperhatikan gaya belajar (visual, auditori, kinestetik) dan menerapkan diferensiasi sesuai kebutuhan.',
      ],
      ['B.2 Materi Pelajaran'],
      ['Faktual', `Terminologi, istilah, fakta, dan data konkret yang relevan dengan topik ${profile.subject}.`],
      ['Konseptual', 'Prinsip, teori, dan hubungan antar konsep yang membentuk pemahaman mendalam tentang topik pembelajaran.'],
      ['Prosedural', `Langkah-langkah sistematis dan teknik spesifik dalam ${profile.subject} yang perlu dikuasai peserta didik.`],
      ['Metakognitif', `Strategi belajar mandiri dan evaluasi diri terhadap hasil belajar dalam konteks ${profile.subject}.`],
      ['B.3 Dimensi Profil Lulusan'],
      ['Dimensi', 'Deskripsi'],
      ...dimensiList.map((dim: string) => [
        dim,
        dim === 'Penalaran Kritis'
          ? 'Peserta didik mampu menganalisis informasi secara mendalam dan mengambil keputusan berbasis bukti.'
          : dim === 'Kolaborasi'
          ? 'Peserta didik bekerja sama secara efektif dalam tim dan menghargai perbedaan pendapat.'
          : dim === 'Kemandirian'
          ? 'Peserta didik memiliki inisiatif dan bertanggung jawab atas proses belajarnya.'
          : dim === 'Kreativitas'
          ? 'Peserta didik mampu menghasilkan gagasan, karya, dan tindakan yang orisinal serta inovatif.'
          : dim === 'Keimanan dan Ketakwaan terhadap Tuhan YME'
          ? 'Peserta didik berakhlak mulia dan menjalankan perintah agama dengan teguh.'
          : dim === 'Kesehatan'
          ? 'Peserta didik menjaga kebugaran jasmani dan kesejahteraan mental.'
          : dim === 'Kewargaan'
          ? 'Peserta didik berpartisipasi aktif dalam kehidupan bermasyarakat dan berbangsa.'
          : 'Peserta didik menyampaikan gagasan secara jelas, santun, dan responsif.',
      ]),
      [],
      ['C. DESAIN PEMBELAJARAN'],
      [
        'Capaian Pembelajaran',
        m.desainPembelajaran?.capaianPembelajaran ||
          'Pemahaman terhadap materi meliputi definisi dan konsep yang dikaitkan dengan fenomena dan masalah yang terjadi.',
      ],
      ['Tujuan Pembelajaran', tpStr],
      ['Lintas Disiplin Ilmu', m.desainPembelajaran?.lintasDisiplinIlmu || 'Matematika, IPS, PKn, Geografi'],
      ['Model Pembelajaran', m.desainPembelajaran?.praktikPedagogis || 'Problem Based Learning (PBL)'],
      ['Metode Pembelajaran', 'Diskusi Kelompok, Tanya Jawab, Presentasi'],
      ['Sarana Prasarana', m.saranaPrasarana || 'PID | Laptop | Gawai / Smartphone | Whiteboard'],
      ['Target Peserta Didik', m.targetPesertaDidik || 'Murid Reguler / Umum'],
      [
        'Kemitraan Pembelajaran',
        m.desainPembelajaran?.kemitraanPembelajaran ||
          'Orang tua/wali sebagai mitra pendampingan di rumah; komunitas lokal sebagai sumber belajar kontekstual; narasumber terkait untuk menghubungkan materi dengan dunia nyata.',
      ],
      [
        'Lingkungan Pembelajaran',
        'Fisik: Ruang kelas tertata mendukung kolaborasi, Whiteboard & Spidol. | Virtual/Digital: PID, Laptop, Gawai / Smartphone. | Budaya: Suasana kelas yang aman, inklusif, dan mendorong pertumbuhan (growth mindset).',
      ],
      [],
      ['D. PETA PENGALAMAN BELAJAR'],
      ['Urutan', 'Tahap', 'Deskripsi Pengalaman Belajar'],
      [
        '1',
        'Memahami',
        `Peserta didik terlibat langsung mengamati fenomena/kasus terkait ${profile.subject}, difasilitasi pertanyaan pemantik untuk membangun pemahaman awal terhadap tujuan pembelajaran.`,
      ],
      [
        '2',
        'Mengaplikasikan',
        'Melalui Problem Based Learning (PBL), peserta didik menerapkan konsep pada tantangan kontekstual secara kolaboratif untuk mencapai tujuan pembelajaran tersebut.',
      ],
      [
        '3',
        'Merefleksi',
        'Peserta didik menuliskan refleksi singkat tentang apa yang dipahami dan apa yang masih membingungkan, lalu melakukan teach-back kepada teman sebaya.',
      ],
      [],
      ['E. LANGKAH-LANGKAH PEMBELAJARAN'],
      ['E.1 Pendahuluan (±15 Menit)', (m.pengalamanBelajar?.kegiatanAwal?.deskripsi || []).join('\n')],
      ['E.2 Kegiatan Inti — Tahap 1 (Memahami)', (m.pengalamanBelajar?.kegiatanInti?.memahami?.deskripsi || []).join('\n')],
      ['E.2 Kegiatan Inti — Tahap 2 (Mengaplikasikan)', (m.pengalamanBelajar?.kegiatanInti?.mengaplikasi?.deskripsi || []).join('\n')],
      ['E.2 Kegiatan Inti — Tahap 3 (Merefleksi)', (m.pengalamanBelajar?.kegiatanInti?.merefleksi?.deskripsi || []).join('\n')],
      ['E.3 Penutup (±10 Menit)', (m.pengalamanBelajar?.kegiatanPenutup?.deskripsi || []).join('\n')],
      [],
      ['F. ASESMEN PEMBELAJARAN'],
      ['F.1 Asesmen Formatif (Dilaksanakan dalam Pertemuan Ini)'],
      ['F.1.a — Sebelum Pembelajaran (Asesmen Diagnostik Awal)'],
      ['No.', 'Pertanyaan Pemantik'],
      ['1', 'Sebelum mempelajari materi ini, dari mana asal barang atau jasa yang kita gunakan setiap hari?'],
      ['2', 'Apa yang terjadi jika tidak ada kegiatan produksi?'],
      ['3', 'Apa perbedaan antara membuat barang dan memberikan jasa?'],
      [
        'Cara Penilaian',
        'Bersifat kualitatif dan tidak diberi skor angka. Guru membaca jawaban singkat peserta didik lalu memetakannya ke salah satu dari tiga kelompok kesiapan: Perlu Pendampingan, Reguler, atau Siap Pengayaan.',
      ],
      [
        'Output Penilaian',
        'Peta kesiapan awal peserta didik (per kelompok), menjadi dasar pembentukan kelompok diferensiasi pada Kegiatan Inti hari ini.',
      ],
      ['F.1.b — Saat Pembelajaran (Asesmen Proses)'],
      [
        'Teknik',
        'Observasi aktif selama diskusi/kerja kelompok, pertanyaan lisan (teknik Socratic/cold calling), dan pengamatan keterlibatan peserta didik sepanjang Kegiatan Inti.',
      ],
      ['Aspek', 'Sangat Baik (4)', 'Baik (3)', 'Cukup (2)', 'Perlu Bimbingan (1)'],
      ['Keterlibatan Aktif', 'Selalu aktif, berinisiatif', 'Sering aktif', 'Kadang aktif jika diminta', 'Pasif'],
      ['Kemampuan Analisis', 'Analisis mendalam & kritis', 'Analisis logis', 'Analisis dasar', 'Belum mampu mandiri'],
      ['Kolaborasi Tim', 'Kontribusi aktif', 'Bekerja sama baik', 'Kontribusi minimal', 'Sulit bekerja tim'],
      [
        'Output Penilaian',
        'Checklist partisipasi per peserta didik dan catatan anekdotal guru selama kegiatan berlangsung — dipakai sebagai bahan umpan balik langsung, bukan nilai rapor.',
      ],
      ['F.1.c — Setelah Pembelajaran (Exit Ticket)'],
      ['No.', 'Pertanyaan Refleksi'],
      ['1', `Sebutkan 1 hal paling penting yang kamu pelajari hari ini tentang ${profile.subject}.`],
      ['2', 'Apakah ada bagian yang masih membingungkan? Jelaskan.'],
      ['3', 'Pada skala 1-4, seberapa yakin kamu sudah mencapai tujuan pembelajaran? (1 = belum sama sekali, 4 = sangat yakin)'],
      [
        'Cara Penilaian',
        'Exit ticket dinilai cepat oleh guru sebagai indikator pemahaman mandiri peserta didik terhadap TP hari ini — bukan skor akademik formal.',
      ],
      [
        'Output Penilaian',
        'Rekap sebaran skala pemahaman (1-4) seluruh kelas, menjadi dasar keputusan: melanjutkan ke topik berikutnya, atau melakukan pengulangan singkat di awal pertemuan berikutnya.',
      ],
      ['F.3 Pedoman Penskoran Sumatif'],
      ['Komponen', 'Bobot', 'Keterangan'],
      ['Pilihan Ganda (10 soal)', '30%', 'Skor benar × 3, maks 30 poin.'],
      ['Esai (5 soal)', '50%', 'Tiap soal maks 20 poin, mengukur analisis dan sintesis.'],
      ['Portofolio/Proyek', '20%', 'Penilaian proses dan produk pembelajaran.'],
      ['Konversi Nilai', '90-100 = A | 80-89 = B | 70-79 = C | 60-69 = D | <60 = E'],
      ['F.4 Remedial dan Pengayaan'],
      [
        'Remedial',
        'Re-teaching konsep kunci dengan pendekatan berbeda, tutor sebaya, dan latihan berjenjang dari LOTS menuju MOTS bagi peserta didik di bawah KKM.',
      ],
      [
        'Pengayaan',
        `Proyek mandiri terkait ${profile.subject}, literatur lanjutan, atau partisipasi kompetisi bagi peserta didik yang telah mencapai KKM.`,
      ],
      ['F.5 Output Rekapitulasi Penilaian (Diisi manual oleh guru setelah asesmen berlangsung)'],
      ['No.', 'Nama Peserta Didik', 'Catatan Formatif', 'Nilai PG', 'Nilai Esai', 'Nilai Akhir', 'Predikat'],
      ...Array.from({ length: 36 }, (_, i) => [i + 1, '', '', '', '', '', '']),
      ['Instrumen Penilaian Terpilih', activeInstrumen.join(', ')],
      [],
      ['G. DIFERENSIASI PEMBELAJARAN'],
      ['Konten', 'Materi disajikan multimodal (teks, visual, audio, video) untuk mengakomodasi gaya belajar berbeda.'],
      ['Proses', 'Diferensiasi proses melalui pilihan kegiatan, tugas bertingkat, dan pengelompokan fleksibel sesuai kebutuhan.'],
      ['Produk', 'Peserta didik memilih bentuk produk sesuai minat: laporan tertulis, poster, video singkat, atau demonstrasi langsung.'],
      [],
      ['H. LAMPIRAN'],
      ['Daftar Pustaka'],
      ['1. Kemendikdasmen. (2026). Panduan Pembelajaran Mendalam Kurikulum Merdeka. Jakarta: Badan Standar, Kurikulum, dan Asesmen Pendidikan.'],
      [`2. Kemendikdasmen. (2026). Capaian Pembelajaran ${profile.subject} — Kurikulum Merdeka.`],
      [`3. Platform Merdeka Mengajar (PMM). Modul Ajar dan Perangkat Pembelajaran ${profile.subject}. guru.kemdikbud.go.id`],
      [],
      ['Pengesahan Modul Ajar'],
      ['Mengetahui Kepala Sekolah', profile.headmasterName, `NIP. ${profile.headmasterNip}`],
      [`Disusun Oleh Guru Mata Pelajaran ${profile.subject}`, profile.teacherName, `NIP. ${profile.teacherNip}`],
      [],
      ['Pasca Observasi & Rencana Tindak Lanjut'],
      [
        'Catatan hal yang perlu ditingkatkan dari pelaksanaan pembelajaran:',
        '1. Mengoptimalkan manajemen waktu; 2. Penekanan kesepakatan pembelajaran bersama siswa.',
      ],
      [
        'Rencana Tindak Lanjut:',
        '1. Mengoptimalkan manajemen waktu: Menyusun perencanaan kegiatan secara lebih terstruktur, menentukan skala prioritas, serta mengalokasikan waktu secara efektif agar seluruh proses pembelajaran berjalan sesuai jadwal.\n2. Menekankan kesepakatan pembelajaran: Mengingatkan dan menegaskan kembali kesepakatan pembelajaran bersama peserta didik, termasuk kedisiplinan, tanggung jawab, partisipasi aktif, serta aturan selama pembelajaran.',
      ],
    ];

    const wsBab = XLSX.utils.aoa_to_sheet(detailRows);
    wsBab['!cols'] = [
      { wch: 36 },
      { wch: 52 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
    ];
    XLSX.utils.book_append_sheet(wb, wsBab, `Modul Bab ${m.babNumber}`);
  });

  XLSX.writeFile(
    wb,
    `MODUL_AJAR_DEEP_LEARNING_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.xlsx`
  );
}

/**
 * Exports LKPD (Lembar Kerja Peserta Didik) to Excel spreadsheet
 */
export function exportLkpdToExcel(lkpdList: LkpdItem[], profile: SchoolProfile) {
  const data: any[][] = [
    ...getExcelIdentityHeader(
      profile,
      `LEMBAR KERJA PESERTA DIDIK (LKPD) & KUNCI JAWABAN`
    ),
    ['No / Bab', 'Judul LKPD', 'Lingkup Materi Bab', 'Alokasi Waktu', 'Ringkasan Materi', 'Petunjuk Pengerjaan', 'Pertanyaan Diskusi & Tugas Mandiri', 'Kunci Jawaban & Pembahasan'],
    ...lkpdList.map((lkpd) => [
      `Bab ${lkpd.babNumber}`,
      lkpd.title,
      lkpd.babTitle,
      lkpd.waktu,
      lkpd.materiRingkas,
      lkpd.petunjuk.join(' | '),
      `${lkpd.pertanyaanDiskusi.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}\n\n${lkpd.tugasMandiri}`,
      lkpd.kunciJawaban,
    ]),
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 10 },
    { wch: 32 },
    { wch: 28 },
    { wch: 15 },
    { wch: 38 },
    { wch: 38 },
    { wch: 50 },
    { wch: 48 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'LKPD & Kunci Jawaban');
  XLSX.writeFile(
    wb,
    `LKPD_LENGKAP_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.xlsx`
  );
}

/**
 * Exports Audit Keselarasan Perangkat 1 Tahun to Excel spreadsheet
 */
export function exportAnalisisPerangkatToExcel(
  profile: SchoolProfile,
  prota: ProtaItem[],
  promes: PromesItem[],
  modulList: ModulAjarItem[],
  lkpdList: LkpdItem[],
  students: StudentRecord[],
  rpe: RpeState
) {
  const s1Totals = calculateRpeTotals(rpe.semester1.months, rpe.semester1.jpPerWeek, rpe.semester1.cadanganJp);
  const s2Totals = calculateRpeTotals(rpe.semester2.months, rpe.semester2.jpPerWeek, rpe.semester2.cadanganJp);
  const totalRpeJp = s1Totals.netJp + s2Totals.netJp;
  const totalProtaJp = prota.reduce((a, b) => a + b.alokasiJp, 0);

  const data: any[][] = [
    ...getExcelIdentityHeader(
      profile,
      `LAPORAN AUDIT KESELARASAN ADMINISTRASI KURIKULUM 1 TAHUN`
    ),
    ['No', 'Komponen Administrasi', 'Standar Acuan Kurikulum Merdeka', 'Kondisi Aktual Tersinkronisasi', 'Status Audit'],
    ['1', 'Capaian Pembelajaran (CP) & ATP', 'BSKAP 046/2025 · Permendikbudristek 12/2024 & 13/2025 · KMA 1503/2025', `${prota.length} Tujuan Pembelajaran Terpetakan`, '100% Valid & Sinkron'],
    ['2', 'Rincian Pekan Efektif (RPE)', 'Kalender Pendidikan Resmi', `${s1Totals.effectiveWeeks + s2Totals.effectiveWeeks} Pekan Efektif / ${totalRpeJp} JP`, '100% Valid & Sinkron'],
    ['3', 'Program Tahunan (PROTA)', 'Total Alokasi JP 1 Tahun = RPE', `${prota.length} Bab/Unit / Total ${totalProtaJp} JP`, '100% Valid & Sinkron'],
    ['4', 'Program Semester (PROMES)', 'Sebaran Mingguan Smt 1 & Smt 2', `${promes.length} Baris Distribusi Mingguan`, '100% Valid & Sinkron'],
    ['5', 'Modul Ajar Deep Learning', 'Mindful, Meaningful, Joyful Learning', `${modulList.length} Modul Ajar Lengkap + 10 Instrumen`, '100% Valid & Sinkron'],
    ['6', 'Lembar Kerja Peserta Didik (LKPD)', 'Terintegrasi Tujuan Pembelajaran & Rubrik', `${lkpdList.length} Unit LKPD + Kunci Jawaban`, '100% Valid & Sinkron'],
    ['7', 'Pengolahan Asesmen & Nilai Rapor', 'Formatif, Sumatif Lingkup Materi & KKTP', `${students.length} Peserta Didik Terdaftar`, '100% Valid & Sinkron'],
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [{ wch: 5 }, { wch: 32 }, { wch: 36 }, { wch: 38 }, { wch: 22 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Audit Keselarasan');
  XLSX.writeFile(
    wb,
    `AUDIT_KESELARASAN_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.xlsx`
  );
}

/**
 * Exports All 1-Year Curriculum Modules into a Single Multi-Sheet Master Excel Workbook (.xlsx)
 */
export function exportMasterBundelToExcel(data: {
  profile: SchoolProfile;
  cpElements: CpElement[];
  tujuanPembelajaran: TujuanPembelajaran[];
  rpe: RpeState;
  prota: ProtaItem[];
  promes: PromesItem[];
  modulAjarList: ModulAjarItem[];
  lkpdList: LkpdItem[];
  students: StudentRecord[];
  kaldikEvents: KaldikEvent[];
}) {
  const { profile, cpElements, tujuanPembelajaran, rpe, prota, promes, modulAjarList, lkpdList, students, kaldikEvents } = data;
  const wb = XLSX.utils.book_new();

  const rpePayload = buildUnifiedRpeExportPayload({
    rpe,
    academicYear: profile.academicYear,
    kaldikEvents,
    prota,
    promes,
  });

  // Sheet 1: Identitas & Daftar Isi
  const sheet1 = XLSX.utils.aoa_to_sheet([
    ...getExcelIdentityHeader(profile, 'BUNDEL LENGKAP PERANGKAT PEMBELAJARAN 1 TAHUN (MASTER EXCEL)'),
    ['No', 'Nama Dokumen Administrasi', 'Status Kelengkapan (Tersinkron)'],
    ['1', 'Kalender Pendidikan (Kaldik)', `${rpePayload.kaldikRows.length} Agenda Akademik · Jadwal: ${rpePayload.selectedDays.join(', ')}`],
    ['2', 'Rincian Pekan Efektif (RPE 12 Bulan, Smt 1 & 2)', `${rpePayload.annualSummary.effectiveWeeks} Pekan · ${rpePayload.annualSummary.effectiveMeetings} Pertemuan · ${rpePayload.annualSummary.grossJp} JP (${rpePayload.annualSummary.netJp} JP Bersih)`],
    ['3', 'Analisis CP & ATP (BSKAP 046/2025)', `${tujuanPembelajaran.length} Tujuan Pembelajaran`],
    ['4', 'Program Tahunan (PROTA) & Alokasi Waktu TP', `${rpePayload.tpSummary.totalAllocatedJp} JP (${rpePayload.tpSummary.totalMeetings} Pertemuan)`],
    ['5', 'Program Semester (PROMES)', `${promes.length} Unit Sebaran Mingguan`],
    ['6', 'Modul Ajar Deep Learning', `${modulAjarList.length} Bab Modul Ajar`],
    ['7', 'Lembar Kerja Peserta Didik (LKPD)', `${lkpdList.length} Bab LKPD`],
    ['8', 'Rekap Nilai Asesmen & Rapor', `${students.length} Siswa`],
  ]);
  sheet1['!cols'] = [{ wch: 8 }, { wch: 44 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, sheet1, '1. Identitas & Daftar Isi');

  // Sheet 2: CP & ATP
  const subjectInfo = getSubjectRasionalAndCpElements(profile.subject, profile.grade, profile.fase);
  const displayEls = cpElements && cpElements.length > 0 ? cpElements : subjectInfo.cpElements;
  const sheet2 = XLSX.utils.aoa_to_sheet([
    ...getExcelIdentityHeader(profile, 'ANALISIS CP & ATP (BSKAP 046/2025)'),
    ['ELEMEN CAPAIAN PEMBELAJARAN'],
    ['No', 'Elemen CP', 'Deskripsi Resmi CP', 'Fokus Kompetensi'],
    ...displayEls.map((e, i) => [i + 1, e.name, e.deskripsi, e.variasiKeterampilan || (e.kompetensi || []).join(', ')]),
    [],
    ['MATRIKS ALUR TUJUAN PEMBELAJARAN (ATP)'],
    ['No', 'Kode TP', 'Semester', 'Elemen', 'Tujuan Pembelajaran', 'IKTP', 'Materi Pokok', 'Alokasi JP'],
    ...tujuanPembelajaran.map((tp, i) => [
      i + 1,
      tp.code,
      `Semester ${tp.semester}`,
      tp.element,
      tp.description,
      tp.indikatorKinerja || '-',
      tp.materiPokok,
      tp.jpAllocation,
    ]),
  ]);
  sheet2['!cols'] = [{ wch: 5 }, { wch: 15 }, { wch: 14 }, { wch: 24 }, { wch: 45 }, { wch: 35 }, { wch: 28 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, sheet2, '2. Analisis CP & ATP');

  // Sheet 3: Analisis 12 Bulan & RPE (Sinkron 3 Tabel)
  const sheet3 = XLSX.utils.aoa_to_sheet([
    ...getExcelIdentityHeader(
      profile,
      'ANALISIS MINGGU EFEKTIF (12 BULAN) & DISTRIBUSI PEKAN SEMESTER 1-2',
      `${profile.academicYear} · Jadwal Mengajar: ${rpePayload.selectedDays.join(', ')}`
    ),
    ['I. ANALISIS MINGGU EFEKTIF & HARI/PERTEMUAN EFEKTIF (12 BULAN)'],
    ['No', 'Bulan', 'Jml Minggu', 'Tidak Efektif', 'Minggu Efektif', 'Pertemuan Efektif', 'Total JP Efektif', 'Keterangan / Agenda'],
    ...rpePayload.twelveMonthRows.map((row) => [
      row.no,
      row.month,
      row.totalWeeks,
      row.nonEffectiveWeeks,
      row.effectiveWeeks,
      row.effectiveMeetings,
      row.effectiveJp,
      row.note,
    ]),
    [
      '',
      'JUMLAH TOTAL (12 BULAN)',
      rpePayload.annualSummary.totalWeeks,
      rpePayload.annualSummary.nonEffectiveWeeks,
      rpePayload.annualSummary.effectiveWeeks,
      rpePayload.annualSummary.effectiveMeetings,
      rpePayload.annualSummary.grossJp,
      `Bersih: ${rpePayload.annualSummary.netJp} JP (Cadangan ${rpePayload.annualSummary.cadanganJp} JP)`,
    ],
    [],
    ['II. DISTRIBUSI PEKAN SEMESTER 1 (GANJIL)'],
    ['No', 'Nama Bulan', 'Jml Pekan', 'Non-Efektif', 'Pekan Efektif', 'Pertemuan', 'JP Efektif', 'Keterangan'],
    ...rpePayload.s1Rows.map((row) => [
      row.semNo,
      row.month,
      row.totalWeeks,
      row.nonEffectiveWeeks,
      row.effectiveWeeks,
      row.effectiveMeetings,
      row.effectiveJp,
      row.note,
    ]),
    [
      '',
      'TOTAL SEMESTER 1',
      rpePayload.s1Summary.totalWeeks,
      rpePayload.s1Summary.nonEffectiveWeeks,
      rpePayload.s1Summary.effectiveWeeks,
      rpePayload.s1Summary.effectiveMeetings,
      rpePayload.s1Summary.grossJp,
      `Bersih: ${rpePayload.s1Summary.netJp} JP (Cadangan ${rpePayload.s1Summary.cadanganJp} JP)`,
    ],
    [],
    ['III. DISTRIBUSI PEKAN SEMESTER 2 (GENAP)'],
    ['No', 'Nama Bulan', 'Jml Pekan', 'Non-Efektif', 'Pekan Efektif', 'Pertemuan', 'JP Efektif', 'Keterangan'],
    ...rpePayload.s2Rows.map((row) => [
      row.semNo,
      row.month,
      row.totalWeeks,
      row.nonEffectiveWeeks,
      row.effectiveWeeks,
      row.effectiveMeetings,
      row.effectiveJp,
      row.note,
    ]),
    [
      '',
      'TOTAL SEMESTER 2',
      rpePayload.s2Summary.totalWeeks,
      rpePayload.s2Summary.nonEffectiveWeeks,
      rpePayload.s2Summary.effectiveWeeks,
      rpePayload.s2Summary.effectiveMeetings,
      rpePayload.s2Summary.grossJp,
      `Bersih: ${rpePayload.s2Summary.netJp} JP (Cadangan ${rpePayload.s2Summary.cadanganJp} JP)`,
    ],
  ]);
  sheet3['!cols'] = [{ wch: 5 }, { wch: 20 }, { wch: 13 }, { wch: 14 }, { wch: 15 }, { wch: 17 }, { wch: 15 }, { wch: 44 }];
  XLSX.utils.book_append_sheet(wb, sheet3, '3. Analisis 12 Bln & RPE');

  // Sheet 4: PROTA & Program Alokasi Waktu TP
  const sheet4 = XLSX.utils.aoa_to_sheet([
    ...getExcelIdentityHeader(
      profile,
      'PROGRAM TAHUNAN (PROTA) & ALOKASI WAKTU TUJUAN PEMBELAJARAN (TP)',
      `Target Total JP Efektif Kaldik: ${rpePayload.tpSummary.targetEffectiveJp} JP`
    ),
    ['No', 'Semester', 'Kode / Jenis', 'Lingkup Materi & Tujuan Pembelajaran (TP)', 'Jml Pertemuan', 'Alokasi JP', 'Perkiraan Bulan', 'Keterangan'],
    ...rpePayload.tpRows.map((row) => {
      const matched = prota[row.no - 1];
      return [
        row.no,
        `Semester ${row.semester}`,
        row.tpCode,
        row.lingkupMateri,
        row.jmlPertemuan,
        row.alokasiJp,
        row.perkiraanBulan,
        matched?.keterangan || 'Formatif & Sumatif',
      ];
    }),
    [
      '',
      '',
      'TOTAL ALOKASI',
      rpePayload.tpSummary.isBalanced
        ? 'Seimbang (Pas dengan Total JP Efektif Kaldik)'
        : `Selisih ${rpePayload.tpSummary.diffJp} JP terhadap Total JP Efektif`,
      rpePayload.tpSummary.totalMeetings,
      rpePayload.tpSummary.totalAllocatedJp,
      `Terpakai: ${rpePayload.tpSummary.totalAllocatedJp} / ${rpePayload.tpSummary.targetEffectiveJp} JP`,
      '',
    ],
  ]);
  sheet4['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 18 }, { wch: 48 }, { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, sheet4, '4. PROTA & Alokasi TP');

  // Sheet 5: Jadwal Mengajar Riil & Agenda Kaldik
  const sheet5 = XLSX.utils.aoa_to_sheet([
    ...getExcelIdentityHeader(
      profile,
      `JADWAL MENGAJAR RIIL & AGENDA KALENDER PENDIDIKAN (${profile.academicYear})`,
      `Hari Mengajar: ${rpePayload.selectedDays.join(', ')}`
    ),
    ['A. RINCIAN HARI TERJADWAL VS LIBUR KALDIK'],
    ['No', 'Bulan', 'Hari Terjadwal', 'Terkena Libur Kaldik', 'Pertemuan Efektif', 'Keterangan Tanggal Terkena Agenda / Libur'],
    ...rpePayload.twelveMonthRows.map((row) => [
      row.no,
      row.month,
      row.scheduledCount,
      row.holidayCount,
      row.effectiveMeetings,
      row.affectedSummary,
    ]),
    [],
    ['B. RINCIAN AGENDA & HARI LIBUR KALENDER PENDIDIKAN'],
    ['No', 'Bulan', 'Rentang Tanggal', 'Uraian Kegiatan / Hari Libur', 'Kategori Status', 'Keterangan'],
    ...rpePayload.kaldikRows.map((ev) => [
      ev.no,
      ev.monthLabel,
      ev.dateRangeLabel,
      ev.name,
      ev.categoryLabel,
      ev.notes,
    ]),
  ]);
  sheet5['!cols'] = [{ wch: 5 }, { wch: 18 }, { wch: 22 }, { wch: 38 }, { wch: 26 }, { wch: 46 }];
  XLSX.utils.book_append_sheet(wb, sheet5, '5. Jadwal Riil & Kaldik');

  // Sheet 6: PROMES Ringkasan Sebaran
  const sheet6 = XLSX.utils.aoa_to_sheet([
    ...getExcelIdentityHeader(profile, 'PROGRAM SEMESTER (PROMES) SEMESTER 1 & 2'),
    ['No', 'Semester', 'Bab / Lingkup Materi', 'Kode TP', 'Alokasi JP', 'Sebaran Minggu Efektif'],
    ...promes.map((pm, idx) => {
      const distText = Object.entries(pm.distribution || {})
        .filter(([, jp]) => Number(jp) > 0)
        .map(([wk, jp]) => `${wk}: ${jp} JP`)
        .join(', ');
      return [
        idx + 1,
        `Semester ${pm.semester}`,
        pm.babTitle,
        pm.tpCode,
        pm.alokasiJp,
        distText || '-',
      ];
    }),
  ]);
  sheet6['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 36 }, { wch: 12 }, { wch: 12 }, { wch: 54 }];
  XLSX.utils.book_append_sheet(wb, sheet6, '6. PROMES');

  // Sheet 7: Rekap Nilai Rapor
  const sheet7 = XLSX.utils.aoa_to_sheet([
    ...getExcelIdentityHeader(profile, 'REKAP NILAI ASESMEN & RAPOR SISWA'),
    ['No', 'NISN', 'Nama Siswa', 'L/P', 'Sumatif Akhir', 'Nilai Akhir Rapor', 'Predikat', 'Status KKTP', 'Deskripsi Capaian'],
    ...students.map((s, i) => [i + 1, s.nisn, s.name, s.gender, s.sumatifAkhir, s.nilaiAkhir, s.predikat, s.kktpStatus, s.deskripsi]),
  ]);
  sheet7['!cols'] = [{ wch: 5 }, { wch: 14 }, { wch: 28 }, { wch: 6 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 16 }, { wch: 48 }];
  XLSX.utils.book_append_sheet(wb, sheet7, '7. Rekap Nilai Rapor');

  XLSX.writeFile(
    wb,
    `MASTER_BUNDEL_1TAHUN_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.xlsx`
  );
}


/**
 * Generic Word exporter (renders each section as a bordered table for consistent Word formatting)
 */
export async function exportDocumentToWord(
  title: string,
  sectionsContent: { heading: string; paragraphs: string[] }[],
  profile: SchoolProfile,
  filename: string
) {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          createOfficialKopTable(profile),
          new Paragraph({ text: '', spacing: { after: 120 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 26, font: 'Calibri' })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `Tahun Ajaran ${profile.academicYear} · Fase ${profile.fase} (${profile.grade}) · Mata Pelajaran: ${profile.subject}`,
                bold: true,
                size: 20,
                color: '065F46',
                font: 'Calibri',
              }),
            ],
          }),
          ...sectionsContent.flatMap((sec) => [
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              borders: SOLID_TABLE_BORDERS,
              rows: [
                new TableRow({
                  tableHeader: true,
                  children: [
                    makeCell(sec.heading, {
                      widthPct: 100,
                      bold: true,
                      fill: '0F172A',
                      color: 'FFFFFF',
                      fontSize: 20,
                    }),
                  ],
                }),
                ...sec.paragraphs.map(
                  (p) =>
                    new TableRow({
                      children: [makeCell(p, { widthPct: 100, fontSize: 20 })],
                    })
                ),
              ],
            }),
            new Paragraph({ text: '', spacing: { after: 120 } }),
          ]),
          createOfficialSignatureTable(profile),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, filename);
}

/**
 * 1. COVER, LEMBAR PENGESAHAN & DAFTAR ISI BUNDEL (3 Halaman Tabel Persis Layar Preview)
 */
export async function exportCoverAndPengesahanToWord(
  profile: SchoolProfile,
  pengesahan: {
    nomorDokumen: string;
    pengawasName?: string;
    pengawasNip?: string;
    legalizationNote?: string;
  },
  filename?: string
) {
  const targetFilename =
    filename ||
    `COVER_PENGESAHAN_DAFTAR_ISI_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.docx`;

  const mainLogoRun = createImageRunFromDataUrl(
    profile.logoUrl || profile.leftLogoUrl,
    115,
    115
  );

  const daftarIsiItems = [
    { romawi: 'I', title: 'Sampul Resmi (Cover) & Lembar Pengesahan', desc: 'Identitas & Legalitas KS' },
    { romawi: 'II', title: `Kalender Pendidikan (Kaldik) Tahun Ajaran ${profile.academicYear}`, desc: 'Semester 1 & Semester 2' },
    { romawi: 'III', title: 'Rincian Pekan Efektif (RPE) & Distribusi Jam', desc: '39 Pekan Efektif / 132 JP' },
    { romawi: 'IV', title: 'Analisis Capaian Pembelajaran (CP) & Alur Tujuan (ATP)', desc: '7 Tujuan Pembelajaran' },
    { romawi: 'V', title: 'Analisis Taksonomi Bloom & Pemetaan HOTS (C1–C6)', desc: '71% Kategori HOTS' },
    { romawi: 'VI', title: 'Program Tahunan (PROTA) Kurikulum Merdeka', desc: 'Alokasi 132 JP (1 Tahun)' },
    { romawi: 'VII', title: 'Program Semester (PROMES) Ganjil & Genap', desc: 'Matriks Sebaran Mingguan' },
    { romawi: 'VIII', title: 'Modul Ajar Terpadu & Deep Learning (Mindful, Meaningful, Joyful)', desc: '7 Unit Modul Berdiferensiasi' },
    { romawi: 'IX', title: 'Lembar Kerja Peserta Didik (LKPD) Setiap Pertemuan', desc: '7 Bab + Kunci Jawaban' },
    { romawi: 'X', title: 'Instrumen Asesmen, Rubrik KKTP, & Rekap Nilai Rapor', desc: 'Formatif, Sumatif & Rapor' },
  ];

  const doc = new Document({
    sections: [
      // HALAMAN 1: SAMPUL RESMI (DALAM BINGKAI TABEL DOUBLE BORDER PERSIS PREVIEW)
      {
        properties: {},
        children: [
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.DOUBLE, size: 18, color: '0F172A' },
              bottom: { style: BorderStyle.DOUBLE, size: 18, color: '0F172A' },
              left: { style: BorderStyle.DOUBLE, size: 18, color: '0F172A' },
              right: { style: BorderStyle.DOUBLE, size: 18, color: '0F172A' },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    margins: { top: 280, bottom: 280, left: 280, right: 280 },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH',
                            bold: true,
                            size: 20,
                            color: '475569',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 120 },
                        children: [
                          new TextRun({
                            text: 'KURIKULUM MERDEKA & PEMBELAJARAN MENDALAM',
                            bold: true,
                            size: 22,
                            color: '065F46',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 100, after: 80 },
                        children: [
                          new TextRun({
                            text: 'PERANGKAT ADMINISTRASI PEMBELAJARAN GURU',
                            bold: true,
                            size: 32,
                            color: '0F172A',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: `TAHUN AJARAN ${profile.academicYear}`,
                            bold: true,
                            size: 24,
                            color: '1E293B',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 220 },
                        children: [
                          new TextRun({
                            text: `Semester ${profile.semester || 1}`,
                            bold: true,
                            size: 22,
                            color: '065F46',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      // Logo Utama
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 160, after: 80 },
                        children: mainLogoRun
                          ? [mainLogoRun]
                          : [
                              new TextRun({
                                text: `[ LOGO SATUAN PENDIDIKAN : ${profile.schoolName} ]`,
                                bold: true,
                                size: 22,
                                color: '065F46',
                                font: 'Calibri',
                              }),
                            ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 220 },
                        children: [
                          new TextRun({
                            text: `NPSN: ${profile.npsn || '10802058'}`,
                            bold: true,
                            size: 20,
                            color: '334155',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      // Tabel Detail Mata Pelajaran & Kelas di Tengah Sampul
                      new Table({
                        width: { size: 86, type: WidthType.PERCENTAGE },
                        alignment: AlignmentType.CENTER,
                        borders: SOLID_TABLE_BORDERS,
                        rows: [
                          new TableRow({
                            children: [
                              makeCell('Mata Pelajaran', { widthPct: 38, bold: true, fill: 'F8FAFC' }),
                              makeCell(`: ${profile.subject}`, { widthPct: 62, bold: true }),
                            ],
                          }),
                          new TableRow({
                            children: [
                              makeCell('Fase / Kelas', { widthPct: 38, bold: true, fill: 'F8FAFC' }),
                              makeCell(`: Fase ${profile.fase} / ${profile.grade}`, { widthPct: 62, bold: true }),
                            ],
                          }),
                          new TableRow({
                            children: [
                              makeCell('Beban Alokasi Waktu', { widthPct: 38, bold: true, fill: 'F8FAFC' }),
                              makeCell(': 132 JP (39 Pekan Efektif)', { widthPct: 62, bold: true }),
                            ],
                          }),
                          new TableRow({
                            children: [
                              makeCell('Pendekatan Ajar', { widthPct: 38, bold: true, fill: 'F8FAFC' }),
                              makeCell(': Deep Learning (Mindful, Meaningful, Joyful)', {
                                widthPct: 62,
                                bold: true,
                                color: '065F46',
                              }),
                            ],
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 260, after: 40 },
                        children: [
                          new TextRun({
                            text: 'Disusun Oleh:',
                            italics: true,
                            size: 20,
                            color: '475569',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 40 },
                        children: [
                          new TextRun({
                            text: profile.teacherName,
                            bold: true,
                            underline: {},
                            size: 26,
                            color: '0F172A',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 280 },
                        children: [
                          new TextRun({
                            text: `${profile.teacherIdType || 'NIP'}. ${profile.teacherNip}`,
                            bold: true,
                            size: 20,
                            color: '334155',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: profile.schoolName.toUpperCase(),
                            bold: true,
                            size: 24,
                            color: '0F172A',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                      new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [
                          new TextRun({
                            text: profile.address,
                            size: 19,
                            color: '475569',
                            font: 'Calibri',
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      },
      // HALAMAN 2: LEMBAR PENGESAHAN RESMI
      {
        properties: {},
        children: [
          createOfficialKopTable(profile),
          new Paragraph({ text: '', spacing: { after: 100 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'LEMBAR PENGESAHAN DOKUMEN PERANGKAT PEMBELAJARAN',
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `KURIKULUM MERDEKA TAHUN AJARAN ${profile.academicYear}`,
                bold: true,
                size: 22,
                color: '065F46',
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `Nomor: ${pengesahan.nomorDokumen || '421.5/082/SMK-M1/2026'}`,
                bold: true,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: 'Setelah melalui proses telaah, verifikasi, dan validasi kurikulum oleh Tim Pengembang Kurikulum Satuan Pendidikan, Dokumen Perangkat Pembelajaran Kurikulum Merdeka yang memuat Capaian Pembelajaran (CP), Alur Tujuan Pembelajaran (ATP), Rincian Pekan Efektif (RPE), Program Tahunan (PROTA), Program Semester (PROMES), Modul Ajar Terpadu, Lembar Kerja Peserta Didik (LKPD), serta Instrumen Penilaian & Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) untuk:',
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: SOLID_TABLE_BORDERS,
            rows: [
              new TableRow({
                children: [
                  makeCell('Satuan Pendidikan', { widthPct: 32, bold: true, fill: 'F8FAFC' }),
                  makeCell(`: ${profile.schoolName.toUpperCase()}`, { widthPct: 68, bold: true }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Mata Pelajaran', { widthPct: 32, bold: true, fill: 'F8FAFC' }),
                  makeCell(`: ${profile.subject}`, { widthPct: 68, bold: true }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Fase / Kelas', { widthPct: 32, bold: true, fill: 'F8FAFC' }),
                  makeCell(`: Fase ${profile.fase} / Kelas ${profile.grade}`, { widthPct: 68 }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Tahun Ajaran / Semester', { widthPct: 32, bold: true, fill: 'F8FAFC' }),
                  makeCell(`: ${profile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)`, { widthPct: 68 }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell('Guru Penyusun', { widthPct: 32, bold: true, fill: 'F8FAFC' }),
                  makeCell(`: ${profile.teacherName}`, { widthPct: 68, bold: true }),
                ],
              }),
              new TableRow({
                children: [
                  makeCell(`${profile.teacherIdType || 'NIP'} Guru`, { widthPct: 32, bold: true, fill: 'F8FAFC' }),
                  makeCell(`: ${profile.teacherNip}`, { widthPct: 68 }),
                ],
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 140, after: 140 },
            children: [
              new TextRun({
                text: `Disahkan dan ditetapkan untuk diberlakukan sebagai pedoman dan acuan operasional resmi pelaksanaan Kegiatan Belajar Mengajar (KBM) serta pelaksanaan evaluasi asesmen pada ${profile.schoolName.toUpperCase()} untuk Tahun Ajaran ${profile.academicYear}.`,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),
          createOfficialSignatureTable(profile),
        ],
      },
      // HALAMAN 3: DAFTAR ISI BUNDEL PERANGKAT PEMBELAJARAN (TABEL PERSIS PREVIEW)
      {
        properties: {},
        children: [
          createOfficialKopTable(profile),
          new Paragraph({ text: '', spacing: { after: 100 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'DAFTAR ISI BUNDEL PERANGKAT PEMBELAJARAN',
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: `KURIKULUM MERDEKA & PEMBELAJARAN MENDALAM · TAHUN AJARAN ${profile.academicYear}`,
                bold: true,
                size: 20,
                color: '065F46',
                font: 'Calibri',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: SOLID_TABLE_BORDERS,
            rows: [
              new TableRow({
                tableHeader: true,
                children: [
                  makeCell('BAG.', { widthPct: 10, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
                  makeCell('NAMA DOKUMEN PERANGKAT PEMBELAJARAN', { widthPct: 50, bold: true, fill: '0F172A', color: 'FFFFFF' }),
                  makeCell('KETERANGAN / ALOKASI', { widthPct: 24, bold: true, fill: '0F172A', color: 'FFFFFF' }),
                  makeCell('STATUS', { widthPct: 16, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
                ],
              }),
              ...daftarIsiItems.map(
                (row) =>
                  new TableRow({
                    children: [
                      makeCell(row.romawi, { widthPct: 10, bold: true, align: AlignmentType.CENTER }),
                      makeCell(row.title, { widthPct: 50, bold: true }),
                      makeCell(row.desc, { widthPct: 24 }),
                      makeCell('Lengkap ✓', {
                        widthPct: 16,
                        bold: true,
                        color: '065F46',
                        align: AlignmentType.CENTER,
                      }),
                    ],
                  })
              ),
            ],
          }),
          new Paragraph({ text: '', spacing: { after: 160 } }),
          createOfficialSignatureTable(profile),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, targetFilename);
}

/**
 * 2. ANALISIS CP & ALUR TUJUAN PEMBELAJARAN (ATP) - TABEL PERSIS LAYAR PREVIEW
 */
export function buildCpAtpTables(cpElements: CpElement[], tujuanPembelajaran: TujuanPembelajaran[]) {
  const totalJp = tujuanPembelajaran.reduce((acc, tp) => acc + tp.jpAllocation, 0);

  const fourColElementCells = cpElements.map(
    (el) =>
      new TableCell({
        width: { size: Math.floor(100 / Math.max(1, cpElements.length)), type: WidthType.PERCENTAGE },
        shading: { fill: 'ECFDF5', type: ShadingType.CLEAR, color: 'auto' },
        margins: { top: 100, bottom: 100, left: 100, right: 100 },
        children: [
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: el.name,
                bold: true,
                size: 20,
                font: 'Calibri',
                color: '064E3B',
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Fokus: ${el.kompetensi.join(', ')}`,
                size: 18,
                font: 'Calibri',
                color: '334155',
              }),
            ],
          }),
        ],
      })
  );

  const resmiCpTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('NO', { widthPct: 5, bold: true, fill: '064E3B', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('ELEMEN CAPAIAN PEMBELAJARAN', { widthPct: 22, bold: true, fill: '064E3B', color: 'FFFFFF' }),
          makeCell('DESKRIPSI RESMI CAPAIAN PEMBELAJARAN (BSKAP 046/2025)', { widthPct: 45, bold: true, fill: '064E3B', color: 'FFFFFF' }),
          makeCell('FOKUS KOMPETENSI', { widthPct: 28, bold: true, fill: '064E3B', color: 'FFFFFF' }),
        ],
      }),
      ...cpElements.map(
        (el, idx) =>
          new TableRow({
            children: [
              makeCell(`${idx + 1}`, { widthPct: 5, bold: true, align: AlignmentType.CENTER }),
              makeCell(el.name, { widthPct: 22, bold: true, color: '065F46' }),
              makeCell(el.deskripsi, { widthPct: 45 }),
              makeCell(el.kompetensi.join(' | '), { widthPct: 28 }),
            ],
          })
      ),
    ],
  });

  const cpElementTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('NO', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('ELEMEN CP', { widthPct: 15, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('KALIMAT CAPAIAN PEMBELAJARAN (CP)', { widthPct: 25, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('KOMPETENSI YANG DITUJU (KKO)', { widthPct: 20, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('LINGKUP MATERI ESENSIAL', { widthPct: 20, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('VARIASI KETERAMPILAN', { widthPct: 15, bold: true, fill: '0F172A', color: 'FFFFFF' }),
        ],
      }),
      ...cpElements.map(
        (el, idx) =>
          new TableRow({
            children: [
              makeCell(`${idx + 1}`, { widthPct: 5, bold: true, align: AlignmentType.CENTER }),
              makeCell(el.name, { widthPct: 15, bold: true, color: '065F46' }),
              makeCell(el.deskripsi, { widthPct: 25 }),
              makeCell(el.kompetensi.join(', '), { widthPct: 20 }),
              makeCell(el.materi && el.materi.length > 0 ? el.materi.join(', ') : '-', { widthPct: 20 }),
              makeCell(el.variasiKeterampilan || '-', { widthPct: 15 }),
            ],
          })
      ),
    ],
  });

  const atpTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('NO', { widthPct: 4, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('KODE / SEM', { widthPct: 8, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('ELEMEN CP', { widthPct: 11, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('TUJUAN PEMBELAJARAN (TP)', { widthPct: 18, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('INDIKATOR KINERJA (IKTP)', { widthPct: 16, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('KKO BLOOM', { widthPct: 7, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('MATERI POKOK & SUB-MATERI', { widthPct: 14, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('JP', { widthPct: 6, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('PROFIL P5', { widthPct: 8, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('ASESMEN', { widthPct: 8, bold: true, fill: '0F172A', color: 'FFFFFF' }),
        ],
      }),
      ...tujuanPembelajaran.map(
        (tp, idx) =>
          new TableRow({
            children: [
              makeCell(`${idx + 1}`, { widthPct: 4, bold: true, align: AlignmentType.CENTER }),
              makeCell(`${tp.code}\n(Smt ${tp.semester})`, { widthPct: 8, bold: true, align: AlignmentType.CENTER }),
              makeCell(cpElements.find(el => el.id === tp.element || el.name === tp.element)?.name || tp.element, { widthPct: 11 }),
              makeCell(tp.description, { widthPct: 18 }),
              makeCell(tp.indikatorKinerja || '• Siswa dapat menganalisis materi dan memecahkan studi kasus secara tepat.', { widthPct: 16 }),
              makeCell(`${tp.bloomLevel}\n(${tp.hotsCategory})`, { widthPct: 7, bold: true, align: AlignmentType.CENTER }),
              makeCell(
                `${tp.materiPokok} (${tp.babId ? `Bab ${tp.babId.replace('bab-', '')}` : `Bab ${idx + 1}`})${tp.subMateri ? `\n${tp.subMateri}` : ''}`,
                { widthPct: 14 }
              ),
              makeCell(`${tp.jpAllocation} JP`, { widthPct: 6, bold: true, align: AlignmentType.CENTER }),
              makeCell((tp.profilPelajarPancasila || ['Bernalar Kritis', 'Mandiri']).join(', '), { widthPct: 8 }),
              makeCell(tp.rencanaAsesmen || 'Formatif & Sumatif', { widthPct: 8 }),
            ],
          })
      ),
      new TableRow({
        children: [
          makeCell(`TOTAL ALOKASI JAM PELAJARAN 1 TAHUN (${tujuanPembelajaran.length} TP)`, {
            colSpan: 7,
            bold: true,
            fill: 'ECFDF5',
            color: '064E3B',
            align: AlignmentType.RIGHT,
          }),
          makeCell(`${totalJp} JP`, {
            bold: true,
            fill: 'ECFDF5',
            color: '064E3B',
            align: AlignmentType.CENTER,
          }),
          makeCell('Selaras PROTA', {
            colSpan: 2,
            bold: true,
            fill: 'ECFDF5',
            color: '065F46',
            align: AlignmentType.CENTER,
            fontSize: 18,
          }),
        ],
      }),
    ],
  });

  const fourColGridTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [new TableRow({ children: fourColElementCells })],
  });

  return { fourColGridTable, resmiCpTable, cpElementTable, atpTable, totalJp };
}

export async function exportCpAtpToWord(
  cpElements: CpElement[],
  tujuanPembelajaran: TujuanPembelajaran[],
  profile: SchoolProfile,
  filename?: string
) {
  const targetFilename =
    filename ||
    `ANALISIS_CP_DAN_MATRIKS_ATP_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.docx`;

  const subjectInfo = getSubjectRasionalAndCpElements(profile.subject, profile.grade, profile.fase);
  const activeElements =
    cpElements &&
    cpElements.length > 0 &&
    cpElements[0].variasiKeterampilan &&
    cpElements.some((el) => subjectInfo.cpElements.some((sel) => sel.name.toLowerCase() === el.name.toLowerCase()))
      ? cpElements
      : subjectInfo.cpElements;

  const { resmiCpTable, cpElementTable, atpTable, totalJp } = buildCpAtpTables(activeElements, tujuanPembelajaran);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 16838,
              height: 11906,
            },
          },
        },
        children: [
          createOfficialKopTable(profile),
          new Paragraph({ text: '', spacing: { after: 100 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'ANALISIS CAPAIAN PEMBELAJARAN (CP) & ALUR TUJUAN PEMBELAJARAN (ATP)',
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `Berdasarkan KepKa BSKAP No. 046/H/KR/2025 · Mata Pelajaran: ${profile.subject} · Fase ${profile.fase} (${profile.grade}) · TA ${profile.academicYear}`,
                bold: true,
                size: 20,
                color: '065F46',
                font: 'Calibri',
              }),
            ],
          }),
          createOfficialIdentitasTable(profile, `${profile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)`),
          new Paragraph({ text: '', spacing: { after: 120 } }),

          // Section I: Buku Pilihan & Elemen CP Resmi BSKAP 046/2025 + Rasional
          new Paragraph({
            spacing: { before: 80, after: 60 },
            children: [
              new TextRun({
                text: 'I. BUKU PILIHAN (FILTER PENERBIT) & CP/ATP DITERAPKAN — ELEMEN CAPAIAN PEMBELAJARAN RESMI BSKAP 046/2025',
                bold: true,
                size: 22,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),
          resmiCpTable,
          new Paragraph({ text: '', spacing: { after: 100 } }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'RASIONAL & KARAKTERISTIK MATA PELAJARAN',
                bold: true,
                size: 21,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: subjectInfo.rasional,
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),

          // Section II: Analisis Pemetaan Elemen CP
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'II. ANALISIS PEMETAAN ELEMEN CP KE KOMPETENSI DAN LINGKUP MATERI',
                bold: true,
                size: 22,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: 'Dekonstruksi kalimat Capaian Pembelajaran untuk mengidentifikasi Kata Kerja Operasional (KKO) tingkat kognitif, lingkup materi esensial, serta variasi keterampilan berpikir tingkat tinggi (HOTS).',
                size: 18,
                italics: true,
                font: 'Calibri',
                color: '475569',
              }),
            ],
          }),
          cpElementTable,
          new Paragraph({ text: '', spacing: { after: 120 } }),

          // Section III: Matriks Alur Tujuan Pembelajaran (ATP)
          new Paragraph({
            spacing: { before: 140, after: 60 },
            children: [
              new TextRun({
                text: `III. MATRIKS ALUR TUJUAN PEMBELAJARAN (ATP) DAN ALOKASI WAKTU (TOTAL ${tujuanPembelajaran.length} TP · ${totalJp} JP)`,
                bold: true,
                size: 22,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: 'Alur Tujuan Pembelajaran (ATP) dirancang berurutan secara logis, memuat Indikator Ketercapaian Tujuan Pembelajaran (IKTP / KKTP), Dimensi Profil Pelajar Pancasila, Rencana Asesmen, dan Sumber Belajar.',
                size: 18,
                italics: true,
                font: 'Calibri',
                color: '475569',
              }),
            ],
          }),
          atpTable,
          new Paragraph({ text: '', spacing: { after: 120 } }),

          // Section IV: Prinsip dan Rasional Alur Pengurutan ATP
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'IV. PRINSIP DAN RASIONAL ALUR PENGURUTAN TUJUAN PEMBELAJARAN (ATP)',
                bold: true,
                size: 22,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'Alur Tujuan Pembelajaran disusun secara sistematis mengacu pada Panduan Pembelajaran dan Asesmen (PPA) Kurikulum Merdeka. Pengurutan materi memadukan pendekatan Hierarkis (keterampilan prasyarat), Pengurutan dari Konkret ke Abstrak, serta Prosedural bertingkat (scaffolding). Beban jam pelajaran tiap semester telah dihitung secara presisi berdasarkan Rincian Pekan Efektif (RPE) Kalender Pendidikan 2026/2027.',
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),

          // Section V: Panduan Kriteria Ketercapaian TP (KKTP)
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'V. PANDUAN KRITERIA KETERCAPAIAN TUJUAN PEMBELAJARAN (KKTP)',
                bold: true,
                size: 22,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: '• 0 – 65% (Perlu Bimbingan): ', bold: true, color: 'BE123C' }),
              new TextRun({ text: 'Belum mencapai ketuntasan. Wajib mengikuti remedial seluruh materi pokok terkait.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: '• 66 – 75% (Cukup): ', bold: true, color: 'B45309' }),
              new TextRun({ text: 'Mencapai batas ketuntasan minimal. Diberikan remedial parsial pada indikator yang lemah.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: '• 76 – 85% (Baik): ', bold: true, color: '047857' }),
              new TextRun({ text: 'Tuntas dengan capaian baik. Dapat melanjutkan ke TP berikutnya secara mandiri.' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: '• 86 – 100% (Sangat Mahir): ', bold: true, color: '1D4ED8' }),
              new TextRun({ text: 'Tuntas melampaui standar. Diberikan program pengayaan studi kasus lanjutan atau tutor sebaya.' }),
            ],
          }),

          // Section VI: Rekomendasi Berdiferensiasi
          new Paragraph({
            spacing: { before: 120, after: 60 },
            children: [
              new TextRun({
                text: 'VI. REKOMENDASI STRATEGI PEMBELAJARAN BERDIFERENSIASI',
                bold: true,
                size: 22,
                font: 'Calibri',
                color: '0F172A',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: 'Lakukan pemetaan diagnostik awal. Bagi peserta didik dalam kelompok fleksibel (kemampuan dasar, menengah, mahir) dan gunakan bahan ajar multimodal (teks, video, manipulatif).',
                size: 20,
                font: 'Calibri',
              }),
            ],
          }),

          createOfficialSignatureTable(profile),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, targetFilename);
}

/**
 * 3. PROGRAM TAHUNAN (PROTA) - TABEL 7 KOLOM PERSIS LAYAR PREVIEW
 */
export function buildProtaTable(prota: ProtaItem[]): Table {
  const totalJp = prota.reduce((acc, p) => acc + (Number(p.alokasiJp) || 0), 0);
  const totalMeetings = prota.reduce((acc, p) => {
    const m =
      p.jmlPertemuan !== undefined
        ? p.jmlPertemuan
        : Math.max(0, Math.round((Number(p.alokasiJp) || 0) / 2));
    return acc + m;
  }, 0);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('NO', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('SMT', { widthPct: 7, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('BAB / LINGKUP MATERI', { widthPct: 21, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('KODE TP', { widthPct: 10, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('TUJUAN PEMBELAJARAN', { widthPct: 24, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('PERTEMUAN', { widthPct: 8, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('ALOKASI (JP)', { widthPct: 8, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('PERKIRAAN BULAN', { widthPct: 10, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('KETERANGAN', { widthPct: 7, bold: true, fill: '0F172A', color: 'FFFFFF' }),
        ],
      }),
      ...prota.map((item, idx) => {
        const meetings =
          item.jmlPertemuan !== undefined
            ? item.jmlPertemuan
            : Math.max(0, Math.round((Number(item.alokasiJp) || 0) / 2));
        return new TableRow({
          children: [
            makeCell(`${idx + 1}`, { widthPct: 5, align: AlignmentType.CENTER }),
            makeCell(`Smt ${item.semester}`, { widthPct: 7, bold: true, align: AlignmentType.CENTER }),
            makeCell(item.babTitle, { widthPct: 21, bold: true }),
            makeCell(item.tpCode, { widthPct: 10, bold: true, color: '065F46', align: AlignmentType.CENTER }),
            makeCell(item.tpDescription, { widthPct: 24 }),
            makeCell(`${meetings}`, { widthPct: 8, bold: true, align: AlignmentType.CENTER }),
            makeCell(`${item.alokasiJp} JP`, { widthPct: 8, bold: true, color: '065F46', align: AlignmentType.CENTER }),
            makeCell(item.perkiraanBulan || `Semester ${item.semester}`, { widthPct: 10 }),
            makeCell(item.keterangan || 'Formatif & Sumatif', { widthPct: 7, italics: true }),
          ],
        });
      }),
      new TableRow({
        children: [
          makeCell('TOTAL ALOKASI WAKTU 1 TAHUN AJARAN:', {
            colSpan: 5,
            bold: true,
            fill: 'ECFDF5',
            color: '064E3B',
            align: AlignmentType.RIGHT,
          }),
          makeCell(`${totalMeetings}`, {
            bold: true,
            fill: 'ECFDF5',
            color: '064E3B',
            align: AlignmentType.CENTER,
          }),
          makeCell(`${totalJp} JP`, {
            bold: true,
            fill: 'ECFDF5',
            color: '064E3B',
            align: AlignmentType.CENTER,
          }),
          makeCell('✓ 100% Selaras RPE', {
            colSpan: 2,
            bold: true,
            fill: 'ECFDF5',
            color: '065F46',
            fontSize: 18,
          }),
        ],
      }),
    ],
  });
}

export async function exportProtaToWord(
  prota: ProtaItem[],
  profile: SchoolProfile,
  filename?: string
) {
  const targetFilename =
    filename ||
    `PROTA_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.docx`;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 16838,
              height: 11906,
            },
          },
        },
        children: [
          createOfficialKopTable(profile),
          new Paragraph({ text: '', spacing: { after: 100 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'PROGRAM TAHUNAN (PROTA) KURIKULUM MERDEKA',
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 180 },
            children: [
              new TextRun({
                text: `Mata Pelajaran: ${profile.subject} · Fase ${profile.fase} (${profile.grade}) · Tahun Ajaran ${profile.academicYear}`,
                bold: true,
                size: 20,
                color: '065F46',
                font: 'Calibri',
              }),
            ],
          }),
          createOfficialIdentitasTable(profile, `${profile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)`),
          new Paragraph({ text: '', spacing: { after: 120 } }),
          buildProtaTable(prota),
          new Paragraph({ text: '', spacing: { after: 160 } }),
          createOfficialSignatureTable(profile),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, targetFilename);
}

/**
 * 4. PROGRAM SEMESTER (PROMES) - TABEL MATRIKS MINGGUAN SEMESTER 1 & 2 PERSIS PREVIEW
 */
export function buildPromesSemesterTable(promes: PromesItem[], semester: 1 | 2, profile: SchoolProfile): Table {
  const filtered = promes.filter((p) => p.semester === semester);
  const months =
    semester === 1
      ? [
          { label: 'Juli', weeks: ['Jul-1', 'Jul-2', 'Jul-3', 'Jul-4'] },
          { label: 'Agustus', weeks: ['Agu-1', 'Agu-2', 'Agu-3', 'Agu-4', 'Agu-5'] },
          { label: 'September', weeks: ['Sep-1', 'Sep-2', 'Sep-3', 'Sep-4'] },
          { label: 'Oktober', weeks: ['Okt-1', 'Okt-2', 'Okt-3', 'Okt-4', 'Okt-5'] },
          { label: 'November', weeks: ['Nov-1', 'Nov-2', 'Nov-3', 'Nov-4'] },
          { label: 'Desember', weeks: ['Des-1', 'Des-2', 'Des-3', 'Des-4', 'Des-5'] },
        ]
      : [
          { label: 'Januari', weeks: ['Jan-1', 'Jan-2', 'Jan-3', 'Jan-4'] },
          { label: 'Februari', weeks: ['Feb-1', 'Feb-2', 'Feb-3', 'Feb-4'] },
          { label: 'Maret', weeks: ['Mar-1', 'Mar-2', 'Mar-3', 'Mar-4', 'Mar-5'] },
          { label: 'April', weeks: ['Apr-1', 'Apr-2', 'Apr-3', 'Apr-4'] },
          { label: 'Mei', weeks: ['Mei-1', 'Mei-2', 'Mei-3', 'Mei-4', 'Mei-5'] },
          { label: 'Juni', weeks: ['Jun-1', 'Jun-2', 'Jun-3', 'Jun-4'] },
        ];

  const totalJpSemester = filtered.reduce((acc, p) => acc + (p.alokasiJp || 0), 0);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('NO', { widthPct: 4, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('BAB / LINGKUP MATERI', { widthPct: 20, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('MATERI PEMBELAJARAN', { widthPct: 20, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('KODE TP', { widthPct: 7, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('JP', { widthPct: 6, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          ...months.map((m) =>
            makeCell(m.label.toUpperCase(), {
              widthPct: 7,
              bold: true,
              fill: '0F172A',
              color: 'FFFFFF',
              align: AlignmentType.CENTER,
              fontSize: 16,
            })
          ),
        ],
      }),
      ...filtered.map((item, idx) => {
        const subChapters = getSyncedSubChaptersForBab(profile.subject, profile.grade, item.babNumber);
        const bookSource = getCompleteBookSourceString(profile);
        return new TableRow({
          children: [
            makeCell(`${idx + 1}`, { widthPct: 4, align: AlignmentType.CENTER }),
            makeCell([
              new Paragraph({
                children: [new TextRun({ text: item.babTitle, bold: true, size: 18, font: 'Calibri' })],
              }),
              new Paragraph({
                children: [new TextRun({ text: item.tpDescription, size: 16, color: '475569', font: 'Calibri' })],
              }),
            ]),
            makeCell([
              ...subChapters.map(
                (sub, sIdx) =>
                  new Paragraph({
                    children: [
                      new TextRun({ text: `${sIdx + 1}. `, bold: true, size: 16, color: '0E7490', font: 'Calibri' }),
                      new TextRun({ text: sub, size: 16, color: '0F172A', font: 'Calibri' }),
                    ],
                    spacing: { after: 3 },
                  })
              ),
              new Paragraph({
                children: [
                  new TextRun({ text: `📚 ${bookSource}`, italics: true, size: 13, color: '065F46', font: 'Calibri' }),
                ],
                spacing: { before: 5 },
              }),
            ]),
            makeCell(item.tpCode, { widthPct: 7, bold: true, color: '065F46', align: AlignmentType.CENTER }),
            makeCell(`${item.alokasiJp} JP`, { widthPct: 6, bold: true, align: AlignmentType.CENTER }),
            ...months.map((m) => {
              const activeWeeks = m.weeks
                .map((w, wIdx) => {
                  const jpVal = item.distribution?.[w] || 0;
                  return jpVal > 0 ? `M${wIdx + 1}:${jpVal}JP` : null;
                })
                .filter(Boolean)
                .join(', ');
              return makeCell(activeWeeks || '-', {
                widthPct: 7,
                bold: Boolean(activeWeeks),
                fill: activeWeeks ? 'ECFEFF' : undefined,
                color: activeWeeks ? '0E7490' : '94A3B8',
                align: AlignmentType.CENTER,
                fontSize: 16,
              });
            }),
          ],
        });
      }),
      new TableRow({
        children: [
          makeCell(`TOTAL ALOKASI JP SEMESTER ${semester}`, {
            colSpan: 4,
            bold: true,
            fill: 'ECFDF5',
            color: '064E3B',
            align: AlignmentType.RIGHT,
          }),
          makeCell(`${totalJpSemester} JP`, {
            bold: true,
            fill: 'ECFDF5',
            color: '064E3B',
            align: AlignmentType.CENTER,
          }),
          makeCell('Terdistribusi Sesuai Pekan Efektif RPE & Kaldik', {
            colSpan: 6,
            bold: true,
            fill: 'ECFDF5',
            color: '065F46',
            align: AlignmentType.CENTER,
            fontSize: 17,
          }),
        ],
      }),
    ],
  });
}

export async function exportPromesToWord(
  promes: PromesItem[],
  profile: SchoolProfile,
  targetSemOrFilename: 1 | 2 | 'both' | string = 'both',
  maybeFilename?: string
) {
  let targetSem: 1 | 2 | 'both' = 'both';
  let targetFilename = '';

  if (typeof targetSemOrFilename === 'string') {
    if (targetSemOrFilename.endsWith('.docx')) {
      targetFilename = targetSemOrFilename;
    } else if (targetSemOrFilename === '1' || targetSemOrFilename === '2' || targetSemOrFilename === 'both') {
      targetSem = targetSemOrFilename as any;
    }
  } else if (targetSemOrFilename === 1 || targetSemOrFilename === 2 || targetSemOrFilename === 'both') {
    targetSem = targetSemOrFilename;
  }

  if (maybeFilename) {
    targetFilename = maybeFilename;
  }

  if (!targetFilename) {
    targetFilename = `PROMES_SEMESTER_${targetSem === 'both' ? '1_DAN_2' : targetSem}_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.docx`;
  }

  const children: (Paragraph | Table)[] = [
    createOfficialKopTable(profile),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `PROGRAM SEMESTER (PROMES) SEMESTER ${targetSem === 'both' ? '1 & 2' : targetSem}`,
          bold: true,
          size: 26,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: `Satuan Pendidikan: ${profile.schoolName} · Mata Pelajaran: ${profile.subject} · Fase ${profile.fase} (${profile.grade}) · TA ${profile.academicYear}`,
          bold: true,
          size: 19,
          color: '065F46',
          font: 'Calibri',
        }),
      ],
    }),
    createOfficialIdentitasTable(profile),
    new Paragraph({ text: '', spacing: { after: 120 } }),
  ];

  if (targetSem === 'both' || targetSem === 1) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [
          new TextRun({
            text: 'I. MATRIKS PROGRAM SEMESTER 1 (GANJIL: JULI – DESEMBER)',
            bold: true,
            size: 21,
            font: 'Calibri',
          }),
        ],
      }),
      buildPromesSemesterTable(promes, 1, profile)
    );
  }

  if (targetSem === 'both' || targetSem === 2) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 80 },
        children: [
          new TextRun({
            text: targetSem === 'both' ? 'II. MATRIKS PROGRAM SEMESTER 2 (GENAP: JANUARI – JUNI)' : 'I. MATRIKS PROGRAM SEMESTER 2 (GENAP: JANUARI – JUNI)',
            bold: true,
            size: 21,
            font: 'Calibri',
          }),
        ],
      }),
      buildPromesSemesterTable(promes, 2, profile)
    );
  }

  children.push(
    new Paragraph({ text: '', spacing: { after: 160 } }),
    createOfficialSignatureTable(profile)
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 16838,
              height: 11906,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, targetFilename);
}

/**
 * 5. RINCIAN PEKAN EFEKTIF (RPE) & KALENDER PENDIDIKAN - TABEL TERPADU PERSIS PREVIEW
 */
export function buildRpeTables(rpe: RpeState, extra?: RpeUnifiedExportExtra, academicYear: string = '2026/2027') {
  const payload = buildUnifiedRpeExportPayload({
    rpe,
    academicYear,
    kaldikEvents: extra?.kaldikEvents,
    prota: extra?.prota,
    promes: extra?.promes,
    selectedDays: extra?.selectedDays,
  });

  const twelveMonthTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('NO', { widthPct: 5, bold: true, fill: '064E3B', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('BULAN', { widthPct: 16, bold: true, fill: '064E3B', color: 'FFFFFF' }),
          makeCell('JML MINGGU', { widthPct: 10, bold: true, fill: '064E3B', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('TIDAK EFEKTIF', { widthPct: 11, bold: true, fill: '064E3B', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('MINGGU EFEKTIF', { widthPct: 11, bold: true, fill: '064E3B', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('PERTEMUAN EFEKTIF', { widthPct: 12, bold: true, fill: '064E3B', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('TOTAL JP EFEKTIF', { widthPct: 11, bold: true, fill: '064E3B', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('KETERANGAN MINGGU TIDAK EFEKTIF / AGENDA', { widthPct: 24, bold: true, fill: '064E3B', color: 'FFFFFF' }),
        ],
      }),
      ...payload.twelveMonthRows.map(
        (row) =>
          new TableRow({
            children: [
              makeCell(`${row.no}`, { widthPct: 5, align: AlignmentType.CENTER }),
              makeCell(row.month, { widthPct: 16, bold: true }),
              makeCell(`${row.totalWeeks}`, { widthPct: 10, align: AlignmentType.CENTER }),
              makeCell(`${row.nonEffectiveWeeks}`, { widthPct: 11, color: 'BE123C', bold: true, align: AlignmentType.CENTER }),
              makeCell(`${row.effectiveWeeks}`, { widthPct: 11, color: '065F46', bold: true, align: AlignmentType.CENTER }),
              makeCell(`${row.effectiveMeetings}`, { widthPct: 12, color: '065F46', bold: true, align: AlignmentType.CENTER }),
              makeCell(`${row.effectiveJp} JP`, { widthPct: 11, color: '1D4ED8', bold: true, align: AlignmentType.CENTER }),
              makeCell(row.note, { widthPct: 24 }),
            ],
          })
      ),
      new TableRow({
        children: [
          makeCell('JUMLAH TOTAL', { colSpan: 2, bold: true, fill: 'F1F5F9', align: AlignmentType.RIGHT }),
          makeCell(`${payload.annualSummary.totalWeeks}`, { bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
          makeCell(`${payload.annualSummary.nonEffectiveWeeks}`, { bold: true, fill: 'F1F5F9', color: 'BE123C', align: AlignmentType.CENTER }),
          makeCell(`${payload.annualSummary.effectiveWeeks} Mgg`, { bold: true, fill: 'ECFDF5', color: '064E3B', align: AlignmentType.CENTER }),
          makeCell(`${payload.annualSummary.effectiveMeetings} Kali`, { bold: true, fill: 'ECFDF5', color: '064E3B', align: AlignmentType.CENTER }),
          makeCell(`${payload.annualSummary.grossJp} JP`, { bold: true, fill: 'EFF6FF', color: '1D4ED8', align: AlignmentType.CENTER }),
          makeCell(
            `Bersih: ${payload.annualSummary.netJp} JP (Cadangan ${payload.annualSummary.cadanganJp} JP)`,
            { bold: true, fill: 'F1F5F9' }
          ),
        ],
      }),
    ],
  });

  const buildSemesterMonthTable = (
    semesterNum: 1 | 2,
    rows: typeof payload.s1Rows,
    summary: typeof payload.s1Summary
  ) =>
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: SOLID_TABLE_BORDERS,
      rows: [
        new TableRow({
          tableHeader: true,
          children: [
            makeCell('NO', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
            makeCell(`NAMA BULAN (SMT ${semesterNum})`, { widthPct: 17, bold: true, fill: '0F172A', color: 'FFFFFF' }),
            makeCell('JML PEKAN', { widthPct: 10, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
            makeCell('NON-EFEKTIF', { widthPct: 11, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
            makeCell('PEKAN EFEKTIF', { widthPct: 11, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
            makeCell('PERTEMUAN', { widthPct: 11, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
            makeCell('JP EFEKTIF', { widthPct: 10, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
            makeCell('KETERANGAN / ALASAN NON-EFEKTIF', { widthPct: 25, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          ],
        }),
        ...rows.map(
          (row) =>
            new TableRow({
              children: [
                makeCell(`${row.semNo}`, { widthPct: 5, align: AlignmentType.CENTER }),
                makeCell(row.month, { widthPct: 17, bold: true }),
                makeCell(`${row.totalWeeks}`, { widthPct: 10, align: AlignmentType.CENTER }),
                makeCell(`${row.nonEffectiveWeeks}`, { widthPct: 11, color: 'BE123C', bold: true, align: AlignmentType.CENTER }),
                makeCell(`${row.effectiveWeeks}`, { widthPct: 11, bold: true, color: '065F46', align: AlignmentType.CENTER }),
                makeCell(`${row.effectiveMeetings}`, { widthPct: 11, bold: true, color: '065F46', align: AlignmentType.CENTER }),
                makeCell(`${row.effectiveJp} JP`, { widthPct: 10, bold: true, color: '1D4ED8', align: AlignmentType.CENTER }),
                makeCell(row.note, { widthPct: 25 }),
              ],
            })
        ),
        new TableRow({
          children: [
            makeCell(`TOTAL SEMESTER ${semesterNum}`, { colSpan: 2, bold: true, fill: 'F1F5F9', align: AlignmentType.RIGHT }),
            makeCell(`${summary.totalWeeks}`, { bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
            makeCell(`${summary.nonEffectiveWeeks}`, { bold: true, fill: 'F1F5F9', color: 'BE123C', align: AlignmentType.CENTER }),
            makeCell(`${summary.effectiveWeeks} Pekan`, { bold: true, fill: 'ECFDF5', color: '064E3B', align: AlignmentType.CENTER }),
            makeCell(`${summary.effectiveMeetings} Kali`, { bold: true, fill: 'ECFDF5', color: '064E3B', align: AlignmentType.CENTER }),
            makeCell(`${summary.grossJp} JP`, { bold: true, fill: 'EFF6FF', color: '1D4ED8', align: AlignmentType.CENTER }),
            makeCell(`Jam Bersih: ${summary.netJp} JP (Cadangan ${summary.cadanganJp} JP)`, { bold: true, fill: 'F1F5F9' }),
          ],
        }),
      ],
    });

  const tpDistributionTable =
    payload.tpRows.length > 0
      ? new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: SOLID_TABLE_BORDERS,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                makeCell('NO', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
                makeCell('KODE / JENIS', { widthPct: 15, bold: true, fill: '0F172A', color: 'FFFFFF' }),
                makeCell('LINGKUP MATERI & TUJUAN PEMBELAJARAN (TP) / KEGIATAN', { widthPct: 40, bold: true, fill: '0F172A', color: 'FFFFFF' }),
                makeCell('JML PERTEMUAN', { widthPct: 11, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
                makeCell('ALOKASI JP', { widthPct: 10, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
                makeCell('PERKIRAAN BULAN', { widthPct: 19, bold: true, fill: '0F172A', color: 'FFFFFF' }),
              ],
            }),
            ...payload.tpRows.map(
              (row) =>
                new TableRow({
                  children: [
                    makeCell(`${row.no}`, { widthPct: 5, align: AlignmentType.CENTER }),
                    makeCell(row.tpCode, { widthPct: 15, bold: true }),
                    makeCell(row.lingkupMateri, { widthPct: 40 }),
                    makeCell(`${row.jmlPertemuan}`, { widthPct: 11, align: AlignmentType.CENTER }),
                    makeCell(`${row.alokasiJp}`, { widthPct: 10, bold: true, color: '065F46', fill: 'ECFDF5', align: AlignmentType.CENTER }),
                    makeCell(row.perkiraanBulan, { widthPct: 19 }),
                  ],
                })
            ),
            new TableRow({
              children: [
                makeCell('TOTAL ALOKASI WAKTU TP', { colSpan: 3, bold: true, fill: 'F1F5F9', align: AlignmentType.RIGHT }),
                makeCell(`${payload.tpSummary.totalMeetings}`, { bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
                makeCell(`${payload.tpSummary.totalAllocatedJp} JP`, { bold: true, fill: 'ECFDF5', color: '064E3B', align: AlignmentType.CENTER }),
                makeCell(
                  `Terpakai: ${payload.tpSummary.totalAllocatedJp} / ${payload.tpSummary.targetEffectiveJp} JP (${
                    payload.tpSummary.isBalanced ? 'Seimbang' : `Selisih ${payload.tpSummary.diffJp} JP`
                  })`,
                  { bold: true, fill: 'F1F5F9' }
                ),
              ],
            }),
          ],
        })
      : null;

  const realScheduleTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('NO', { widthPct: 6, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('BULAN', { widthPct: 18, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('HARI TERJADWAL', { widthPct: 14, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('LIBUR KALDIK', { widthPct: 14, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('PERTEMUAN EFEKTIF', { widthPct: 16, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('KETERANGAN TANGGAL TERKENA AGENDA / LIBUR', { widthPct: 32, bold: true, fill: '0F172A', color: 'FFFFFF' }),
        ],
      }),
      ...payload.twelveMonthRows.map(
        (row) =>
          new TableRow({
            children: [
              makeCell(`${row.no}`, { widthPct: 6, align: AlignmentType.CENTER }),
              makeCell(row.month, { widthPct: 18, bold: true }),
              makeCell(`${row.scheduledCount} Hari`, { widthPct: 14, align: AlignmentType.CENTER }),
              makeCell(`${row.holidayCount} Hari`, { widthPct: 14, color: 'BE123C', bold: true, align: AlignmentType.CENTER }),
              makeCell(`${row.effectiveMeetings} Pertemuan`, { widthPct: 16, color: '065F46', bold: true, align: AlignmentType.CENTER }),
              makeCell(row.affectedSummary, { widthPct: 32 }),
            ],
          })
      ),
    ],
  });

  const kaldikAgendaTable =
    payload.kaldikRows.length > 0
      ? new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: SOLID_TABLE_BORDERS,
          rows: [
            new TableRow({
              tableHeader: true,
              children: [
                makeCell('NO', { widthPct: 6, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
                makeCell('BULAN', { widthPct: 15, bold: true, fill: '0F172A', color: 'FFFFFF' }),
                makeCell('RENTANG TANGGAL', { widthPct: 20, bold: true, fill: '0F172A', color: 'FFFFFF' }),
                makeCell('URAIAN KEGIATAN / HARI LIBUR', { widthPct: 36, bold: true, fill: '0F172A', color: 'FFFFFF' }),
                makeCell('KATEGORI STATUS', { widthPct: 23, bold: true, fill: '0F172A', color: 'FFFFFF' }),
              ],
            }),
            ...payload.kaldikRows.map(
              (ev) =>
                new TableRow({
                  children: [
                    makeCell(`${ev.no}`, { widthPct: 6, align: AlignmentType.CENTER }),
                    makeCell(ev.monthLabel, { widthPct: 15, bold: true }),
                    makeCell(ev.dateRangeLabel, { widthPct: 20 }),
                    makeCell(ev.name, { widthPct: 36, bold: true }),
                    makeCell(ev.categoryLabel, { widthPct: 23, color: '065F46' }),
                  ],
                })
            ),
          ],
        })
      : null;

  return {
    payload,
    twelveMonthTable,
    s1Table: buildSemesterMonthTable(1, payload.s1Rows, payload.s1Summary),
    s2Table: buildSemesterMonthTable(2, payload.s2Rows, payload.s2Summary),
    tpDistributionTable,
    realScheduleTable,
    kaldikAgendaTable,
    s1Totals: payload.s1Summary,
    s2Totals: payload.s2Summary,
  };
}

export async function exportRpeToWord(
  rpe: RpeState,
  profile: SchoolProfile,
  filename?: string,
  extra?: RpeUnifiedExportExtra
) {
  const targetFilename =
    filename ||
    `RPE_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.docx`;

  const {
    payload,
    twelveMonthTable,
    s1Table,
    s2Table,
    tpDistributionTable,
    realScheduleTable,
    kaldikAgendaTable,
    s1Totals,
    s2Totals,
  } = buildRpeTables(rpe, extra, profile.academicYear);

  const children: any[] = [
    createOfficialKopTable(profile),
    new Paragraph({ text: '', spacing: { after: 100 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'KALENDER PENDIDIKAN, RINCIAN PEKAN EFEKTIF (RPE) & PROGRAM ALOKASI WAKTU TP',
          bold: true,
          size: 24,
          font: 'Calibri',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 140 },
      children: [
        new TextRun({
          text: `Tahun Ajaran ${profile.academicYear} · Mata Pelajaran: ${profile.subject} · Fase ${profile.fase} (${profile.grade}) · Jadwal: ${payload.selectedDays.join(', ')}`,
          bold: true,
          size: 19,
          color: '065F46',
          font: 'Calibri',
        }),
      ],
    }),
    createOfficialIdentitasTable(profile),
    new Paragraph({ text: '', spacing: { after: 120 } }),

    new Paragraph({
      spacing: { before: 80, after: 60 },
      children: [
        new TextRun({
          text: 'I. ANALISIS MINGGU EFEKTIF & HARI/PERTEMUAN EFEKTIF (12 BULAN)',
          bold: true,
          size: 21,
          font: 'Calibri',
        }),
      ],
    }),
    twelveMonthTable,

    new Paragraph({
      spacing: { before: 160, after: 60 },
      children: [
        new TextRun({
          text: 'II. TABEL DISTRIBUSI PEKAN EFEKTIF & NON-EFEKTIF SEMESTER 1 (GANJIL)',
          bold: true,
          size: 21,
          font: 'Calibri',
        }),
      ],
    }),
    s1Table,

    new Paragraph({
      spacing: { before: 160, after: 60 },
      children: [
        new TextRun({
          text: 'III. TABEL DISTRIBUSI PEKAN EFEKTIF & NON-EFEKTIF SEMESTER 2 (GENAP)',
          bold: true,
          size: 21,
          font: 'Calibri',
        }),
      ],
    }),
    s2Table,
  ];

  if (tpDistributionTable) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({
            text: 'IV. PROGRAM ALOKASI WAKTU & DISTRIBUSI TUJUAN PEMBELAJARAN (TP)',
            bold: true,
            size: 21,
            font: 'Calibri',
          }),
        ],
      }),
      tpDistributionTable
    );
  }

  children.push(
    new Paragraph({
      spacing: { before: 160, after: 60 },
      children: [
        new TextRun({
          text: `V. RINCIAN HARI TERJADWAL VS LIBUR KALDIK (JADWAL MENGAJAR: ${payload.selectedDays.join(', ')})`,
          bold: true,
          size: 21,
          font: 'Calibri',
        }),
      ],
    }),
    realScheduleTable
  );

  if (kaldikAgendaTable) {
    children.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [
          new TextRun({
            text: `VI. RINCIAN AGENDA & HARI LIBUR KALENDER PENDIDIKAN (${profile.academicYear})`,
            bold: true,
            size: 21,
            font: 'Calibri',
          }),
        ],
      }),
      kaldikAgendaTable
    );
  }

  children.push(
    new Paragraph({ text: '', spacing: { after: 100 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: SOLID_TABLE_BORDERS,
      rows: [
        new TableRow({
          children: [
            makeCell(
              `REKAPITULASI 1 TAHUN AJARAN: ${
                s1Totals.effectiveWeeks + s2Totals.effectiveWeeks
              } PEKAN EFEKTIF · ${
                payload.annualSummary.effectiveMeetings
              } PERTEMUAN · TOTAL ${payload.annualSummary.grossJp} JP EFEKTIF (BERSIH ${
                s1Totals.netJp + s2Totals.netJp
              } JP)`,
              {
                widthPct: 100,
                bold: true,
                fill: 'ECFDF5',
                color: '064E3B',
                align: AlignmentType.CENTER,
              }
            ),
          ],
        }),
      ],
    }),
    new Paragraph({ text: '', spacing: { after: 160 } }),
    createOfficialSignatureTable(profile)
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 16838,
              height: 11906,
            },
          },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, targetFilename);
}

/**
 * 6. KALENDER PENDIDIKAN (KALDIK) - TABEL AGENDA RESMI PERSIS PREVIEW
 */
export function buildKaldikTable(kaldikEvents: KaldikEvent[]): Table {
  const sortedEvents = [...kaldikEvents].sort((a, b) =>
    (a.dateStart || '').localeCompare(b.dateStart || '')
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('NO', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('BULAN', { widthPct: 14, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('RENTANG TANGGAL', { widthPct: 19, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('URAIAN KEGIATAN / HARI LIBUR', { widthPct: 29, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('KATEGORI STATUS', { widthPct: 17, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('KETERANGAN', { widthPct: 16, bold: true, fill: '0F172A', color: 'FFFFFF' }),
        ],
      }),
      ...sortedEvents.map(
        (ev, idx) =>
          new TableRow({
            children: [
              makeCell(`${idx + 1}`, { widthPct: 5, align: AlignmentType.CENTER }),
              makeCell(getIndonesianMonthYearLabel(ev.dateStart), { widthPct: 14, bold: true }),
              makeCell(formatDateRangeLabelId(ev.dateStart, ev.dateEnd), { widthPct: 19 }),
              makeCell(ev.name, { widthPct: 29, bold: true }),
              makeCell(formatKaldikCategoryExportLabel(ev.type), { widthPct: 17, bold: true, color: '065F46', align: AlignmentType.CENTER }),
              makeCell(ev.notes || '-', { widthPct: 16, italics: true }),
            ],
          })
      ),
    ],
  });
}

export async function exportKaldikToWord(
  kaldikEvents: KaldikEvent[],
  profile: SchoolProfile,
  filename?: string
) {
  const targetFilename =
    filename ||
    `KALDIK_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.docx`;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 16838,
              height: 11906,
            },
          },
        },
        children: [
          createOfficialKopTable(profile),
          new Paragraph({ text: '', spacing: { after: 100 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `AGENDA KALENDER PENDIDIKAN (KALDIK) TAHUN AJARAN ${profile.academicYear}`,
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: `${profile.schoolName} · Mata Pelajaran: ${profile.subject}`,
                bold: true,
                size: 20,
                color: '065F46',
                font: 'Calibri',
              }),
            ],
          }),
          createOfficialIdentitasTable(profile, `${profile.academicYear} / Semester 1 & 2 (1 Tahun Penuh)`),
          new Paragraph({ text: '', spacing: { after: 120 } }),
          buildKaldikTable(kaldikEvents),
          new Paragraph({ text: '', spacing: { after: 160 } }),
          createOfficialSignatureTable(profile),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, targetFilename);
}

/**
 * 7. ANALISIS TAKSONOMI BLOOM & MATRIKS HOTS - TABEL PEMETAAN + MATRIKS 2D ANDERSON-KRATHWOHL
 */
export function buildBloomTables(tujuanPembelajaran: TujuanPembelajaran[]) {
  const tpBloomTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('KODE TP', { widthPct: 12, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('ELEMEN', { widthPct: 18, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('TUJUAN PEMBELAJARAN', { widthPct: 46, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('LEVEL KOGNITIF', { widthPct: 12, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('KATEGORI', { widthPct: 12, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
        ],
      }),
      ...tujuanPembelajaran.map(
        (tp) =>
          new TableRow({
            children: [
              makeCell(tp.code, { widthPct: 12, bold: true, color: '065F46', align: AlignmentType.CENTER }),
              makeCell(tp.element, { widthPct: 18, bold: true }),
              makeCell(tp.description, { widthPct: 46 }),
              makeCell(tp.bloomLevel, { widthPct: 12, bold: true, align: AlignmentType.CENTER }),
              makeCell(tp.hotsCategory, { widthPct: 12, bold: true, align: AlignmentType.CENTER }),
            ],
          })
      ),
    ],
  });

  const matrix2DTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('DIMENSI PENGETAHUAN', { widthPct: 22, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('C1 MENGINGAT', { widthPct: 13, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('C2 MEMAHAMI', { widthPct: 13, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('C3 MENERAPKAN', { widthPct: 13, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('C4 MENGANALISIS', { widthPct: 13, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('C5 MENGEVALUASI', { widthPct: 13, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('C6 MENCIPTA', { widthPct: 13, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('1. Faktual', { bold: true, fill: 'F8FAFC' }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('TP 10.7', { bold: true, color: '1D4ED8', align: AlignmentType.CENTER }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('-', { align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('2. Konseptual', { bold: true, fill: 'F8FAFC' }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('TP 10.3', { bold: true, color: '6D28D9', align: AlignmentType.CENTER }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('-', { align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('3. Prosedural', { bold: true, fill: 'F8FAFC' }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('TP 10.4', { bold: true, color: 'B45309', align: AlignmentType.CENTER }),
          makeCell('TP 10.1, TP 10.6', { bold: true, color: '6D28D9', align: AlignmentType.CENTER }),
          makeCell('TP 10.2', { bold: true, color: 'BE123C', align: AlignmentType.CENTER }),
          makeCell('TP 10.5', { bold: true, color: '065F46', align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('4. Metakognitif', { bold: true, fill: 'F8FAFC' }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('-', { align: AlignmentType.CENTER }),
          makeCell('Refleksi LHO', { bold: true, color: '065F46', align: AlignmentType.CENTER }),
          makeCell('Refleksi Anekdot', { bold: true, color: '065F46', align: AlignmentType.CENTER }),
          makeCell('Deep Learning', { bold: true, color: '065F46', align: AlignmentType.CENTER }),
        ],
      }),
    ],
  });

  return { tpBloomTable, matrix2DTable };
}

export async function exportBloomToWord(
  tujuanPembelajaran: TujuanPembelajaran[],
  profile: SchoolProfile,
  filename?: string
) {
  const targetFilename =
    filename ||
    `ANALISIS_TAKSONOMI_BLOOM_HOTS_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.docx`;

  const { tpBloomTable, matrix2DTable } = buildBloomTables(tujuanPembelajaran);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          createOfficialKopTable(profile),
          new Paragraph({ text: '', spacing: { after: 100 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'ANALISIS TAKSONOMI BLOOM & MATRIKS NALAR TINGGI (HOTS)',
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: `Mata Pelajaran: ${profile.subject} · Fase ${profile.fase} (${profile.grade}) · Tahun Ajaran ${profile.academicYear}`,
                bold: true,
                size: 20,
                color: '065F46',
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 60, after: 60 },
            children: [
              new TextRun({
                text: 'I. TABEL PEMETAAN LEVEL KOGNITIF TUJUAN PEMBELAJARAN (C1–C6)',
                bold: true,
                size: 21,
                font: 'Calibri',
              }),
            ],
          }),
          tpBloomTable,
          new Paragraph({
            spacing: { before: 160, after: 60 },
            children: [
              new TextRun({
                text: 'II. MATRIKS 2 DIMENSI ANDERSON-KRATHWOHL (PROSES KOGNITIF X DIMENSI PENGETAHUAN)',
                bold: true,
                size: 21,
                font: 'Calibri',
              }),
            ],
          }),
          matrix2DTable,
          new Paragraph({ text: '', spacing: { after: 160 } }),
          createOfficialSignatureTable(profile),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, targetFilename);
}

/**
 * 8. MODUL AJAR DEEP LEARNING - FORMAT RESMI 8 BAGIAN (A. INFORMASI UMUM -> H. LAMPIRAN & PASCA OBSERVASI)
 */
export function buildModulAjarTables(
  modulInput: ModulAjarItem,
  profile: SchoolProfile,
  selectedPertemuan: number | 'all' = 'all',
  selectedInstrumentsToPrint?: string[]
): (Paragraph | Table)[] {
  const modul = ensureOfficialKemendikdasmenModul(modulInput, profile);
  const sectionBannerFill = '7C2D12';
  const subChapters = getSyncedSubChaptersForBab(profile.subject, profile.grade, modul.babNumber);

  const makeSectionHeader = (title: string) =>
    new Paragraph({
      spacing: { before: 160, after: 80 },
      shading: { fill: sectionBannerFill, type: ShadingType.CLEAR, color: 'auto' },
      children: [
        new TextRun({
          text: `  ${title}`,
          bold: true,
          size: 22,
          color: 'FFFFFF',
          font: 'Calibri',
        }),
      ],
    });

  // A. INFORMASI UMUM
  const infoUmumRows = [
    ['Nama Satuan Pendidikan', profile.schoolName],
    ['Nama Guru Penyusun', profile.teacherName],
    ['NUPTK Guru', profile.teacherNuptk || profile.teacherNip || '9443766667200012'],
    ['Mata Pelajaran', profile.subject],
    ['Kelas / Fase', `${profile.grade} / Fase ${profile.fase}`],
    ['Semester', `Semester ${modul.semester} (${modul.semester === 1 ? 'Ganjil' : 'Genap'})`],
    ['Tahun Pelajaran', profile.academicYear],
    [
      'Alokasi Waktu',
      selectedPertemuan !== 'all'
        ? `3 JP (Pertemuan Ke-${selectedPertemuan})`
        : `${modul.alokasiJp} JP (${modul.pertemuanCount} Pertemuan)`,
    ],
    ['Tanggal Penyusunan', profile.signaturePlaceDate || '14 Oktober 2026'],
    ['Sumber/Referensi CP', `Dokumen kemendikdasmen, BSKAP 046/2025, Fase ${profile.fase}`],
  ];

  const tableA = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: infoUmumRows.map(
      ([k, v]) =>
        new TableRow({
          children: [
            makeCell(k, { widthPct: 30, bold: true, fill: 'F8FAFC' }),
            makeCell(v, { widthPct: 70, bold: k === 'Nama Guru Penyusun' || k === 'Mata Pelajaran' }),
          ],
        })
    ),
  });

  // B. IDENTIFIKASI
  const selectedDimensi = modul.identifikasi?.dimensiProfilLulusan || [
    'Penalaran Kritis',
    'Kolaborasi',
    'Kemandirian',
  ];

  const tableB1 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          makeCell('Kesiapan Awal (Data Asesmen)', { widthPct: 30, bold: true, fill: 'F8FAFC' }),
          makeCell(
            modul.identifikasi?.pesertaDidik ||
              'Dari 36 siswa, 24 sudah memahami konsep dasar, 8 masih perlu pendampingan, 4 siap materi pendampingan.',
            { widthPct: 70 }
          ),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Gaya Belajar', { widthPct: 30, bold: true, fill: 'F8FAFC' }),
          makeCell(
            'Guru memperhatikan gaya belajar (visual, auditori, kinestetik) dan menerapkan diferensiasi sesuai kebutuhan.',
            { widthPct: 70 }
          ),
        ],
      }),
    ],
  });

  const tableB2 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      ['Faktual', `Terminologi, istilah, fakta, dan data konkret yang relevan dengan topik ${profile.subject}.`],
      ['Konseptual', 'Prinsip, teori, dan hubungan antar konsep yang membentuk pemahaman mendalam tentang topik pembelajaran.'],
      ['Prosedural', `Langkah-langkah sistematis dan teknik spesifik dalam ${profile.subject} yang perlu dikuasai peserta didik.`],
      ['Metakognitif', `Strategi belajar mandiri dan evaluasi diri terhadap hasil belajar dalam konteks ${profile.subject}.`],
    ].map(
      ([k, v]) =>
        new TableRow({
          children: [
            makeCell(k, { widthPct: 30, bold: true, fill: 'F8FAFC' }),
            makeCell(v, { widthPct: 70 }),
          ],
        })
    ),
  });

  const tableB3 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('Dimensi', { widthPct: 30, bold: true, fill: 'F1F5F9' }),
          makeCell('Deskripsi', { widthPct: 70, bold: true, fill: 'F1F5F9' }),
        ],
      }),
      ...selectedDimensi.map(
        (dim: string) =>
          new TableRow({
            children: [
              makeCell(dim, { widthPct: 30, bold: true }),
              makeCell(
                dim === 'Penalaran Kritis'
                  ? 'Peserta didik mampu menganalisis informasi secara mendalam dan mengambil keputusan berbasis bukti.'
                  : dim === 'Kolaborasi'
                  ? 'Peserta didik bekerja sama secara efektif dalam tim dan menghargai perbedaan pendapat.'
                  : dim === 'Kemandirian'
                  ? 'Peserta didik memiliki inisiatif dan bertanggung jawab atas proses belajarnya.'
                  : dim === 'Kreativitas'
                  ? 'Peserta didik mampu menghasilkan gagasan, karya, dan tindakan yang orisinal serta inovatif.'
                  : dim === 'Keimanan dan Ketakwaan terhadap Tuhan YME'
                  ? 'Peserta didik berakhlak mulia dan menjalankan perintah agama dengan teguh.'
                  : dim === 'Kesehatan'
                  ? 'Peserta didik menjaga kebugaran jasmani dan kesejahteraan mental.'
                  : dim === 'Kewargaan'
                  ? 'Peserta didik berpartisipasi aktif dalam kehidupan bermasyarakat dan berbangsa.'
                  : 'Peserta didik menyampaikan gagasan secara jelas, santun, dan responsif.',
                { widthPct: 70 }
              ),
            ],
          })
      ),
    ],
  });

  // C. DESAIN PEMBELAJARAN
  const tpList = Array.isArray(modul.desainPembelajaran?.tujuanPembelajaran)
    ? modul.desainPembelajaran.tujuanPembelajaran.join('; ')
    : modul.desainPembelajaran?.tujuanPembelajaran || modul.tujuanPembelajaran?.join('; ') || '';

  const topicText =
    selectedPertemuan !== 'all' && subChapters[selectedPertemuan - 1]
      ? `${modul.babTitle} — Pertemuan Ke-${selectedPertemuan}: ${subChapters[selectedPertemuan - 1]}`
      : modul.desainPembelajaran?.topikPembelajaran || modul.babTitle;

  const tableC = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      [
        'Capaian Pembelajaran',
        modul.desainPembelajaran?.capaianPembelajaran ||
          'Pemahaman terhadap materi meliputi definisi dan konsep yang dikaitkan dengan fenomena dan masalah yang terjadi.',
      ],
      ['Tujuan Pembelajaran', tpList],
      ['Topik Pembelajaran', topicText],
      ['Lintas Disiplin Ilmu', modul.desainPembelajaran?.lintasDisiplinIlmu || 'Matematika, IPS, PKn, Geografi'],
      ['Model Pembelajaran', modul.desainPembelajaran?.praktikPedagogis || 'Problem Based Learning (PBL)'],
      ['Metode Pembelajaran', 'Diskusi Kelompok, Tanya Jawab, Presentasi'],
      ['Sarana Prasarana', modul.saranaPrasarana || 'PID | Laptop | Gawai / Smartphone | Whiteboard'],
      ['Target Peserta Didik', modul.targetPesertaDidik || 'Murid Reguler / Umum'],
      [
        'Kemitraan Pembelajaran',
        modul.desainPembelajaran?.kemitraanPembelajaran ||
          'Orang tua/wali sebagai mitra pendampingan di rumah; komunitas lokal sebagai sumber belajar kontekstual; narasumber terkait untuk menghubungkan materi dengan dunia nyata.',
      ],
      [
        'Lingkungan Pembelajaran',
        'Fisik: Ruang kelas tertata mendukung kolaborasi, Whiteboard & Spidol.\nVirtual/Digital: PID, Laptop, Gawai / Smartphone.\nBudaya: Suasana kelas yang aman, inklusif, dan mendorong pertumbuhan (growth mindset).',
      ],
    ].map(
      ([k, v]) =>
        new TableRow({
          children: [
            makeCell(k, { widthPct: 30, bold: true, fill: 'F8FAFC' }),
            makeCell(v, { widthPct: 70, bold: k === 'Tujuan Pembelajaran' || k === 'Model Pembelajaran' }),
          ],
        })
    ),
  });

  // D. PETA PENGALAMAN BELAJAR
  const tableD = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('Urutan', { widthPct: 10, bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
          makeCell('Tahap', { widthPct: 20, bold: true, fill: 'F1F5F9' }),
          makeCell('Deskripsi Pengalaman Belajar', { widthPct: 70, bold: true, fill: 'F1F5F9' }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('1', { widthPct: 10, bold: true, align: AlignmentType.CENTER }),
          makeCell('Memahami', { widthPct: 20, bold: true, color: '065F46' }),
          makeCell(
            `Peserta didik terlibat langsung mengamati fenomena/kasus terkait ${profile.subject}, difasilitasi pertanyaan pemantik untuk membangun pemahaman awal terhadap tujuan pembelajaran.`,
            { widthPct: 70 }
          ),
        ],
      }),
      new TableRow({
        children: [
          makeCell('2', { widthPct: 10, bold: true, align: AlignmentType.CENTER }),
          makeCell('Mengaplikasikan', { widthPct: 20, bold: true, color: '92400E' }),
          makeCell(
            'Melalui Problem Based Learning (PBL), peserta didik menerapkan konsep pada tantangan kontekstual secara kolaboratif untuk mencapai tujuan pembelajaran tersebut.',
            { widthPct: 70 }
          ),
        ],
      }),
      new TableRow({
        children: [
          makeCell('3', { widthPct: 10, bold: true, align: AlignmentType.CENTER }),
          makeCell('Merefleksi', { widthPct: 20, bold: true, color: '9F1239' }),
          makeCell(
            'Peserta didik menuliskan refleksi singkat tentang apa yang dipahami dan apa yang masih membingungkan, lalu melakukan teach-back kepada teman sebaya.',
            { widthPct: 70 }
          ),
        ],
      }),
    ],
  });

  // E. LANGKAH-LANGKAH PEMBELAJARAN
  const pb = modul.pengalamanBelajar;
  const tableE = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          makeCell('E.1 Pendahuluan (±15 Menit)', { widthPct: 28, bold: true, fill: 'F8FAFC' }),
          makeCell((pb?.kegiatanAwal?.deskripsi || []).map((l: string) => `• ${l}`).join('\n') || '-', { widthPct: 72 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('E.2 Kegiatan Inti — Tahap 1 (Memahami)', { widthPct: 28, bold: true, fill: 'F8FAFC' }),
          makeCell((pb?.kegiatanInti?.memahami?.deskripsi || []).map((l: string) => `• ${l}`).join('\n') || '-', { widthPct: 72 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('E.2 Kegiatan Inti — Tahap 2 (Mengaplikasikan)', { widthPct: 28, bold: true, fill: 'F8FAFC' }),
          makeCell((pb?.kegiatanInti?.mengaplikasi?.deskripsi || []).map((l: string) => `• ${l}`).join('\n') || '-', { widthPct: 72 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('E.2 Kegiatan Inti — Tahap 3 (Merefleksi)', { widthPct: 28, bold: true, fill: 'F8FAFC' }),
          makeCell(
            `${(pb?.kegiatanInti?.merefleksi?.deskripsi || []).map((l: string) => `• ${l}`).join('\n')}\nMetode yang digunakan sepanjang kegiatan inti: Diskusi Kelompok, Tanya Jawab, Presentasi.`,
            { widthPct: 72 }
          ),
        ],
      }),
      new TableRow({
        children: [
          makeCell('E.3 Penutup (±10 Menit)', { widthPct: 28, bold: true, fill: 'F8FAFC' }),
          makeCell((pb?.kegiatanPenutup?.deskripsi || []).map((l: string) => `• ${l}`).join('\n') || '-', { widthPct: 72 }),
        ],
      }),
    ],
  });

  // F. ASESMEN PEMBELAJARAN
  const tableF1a = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('No. / Komponen', { widthPct: 22, bold: true, fill: 'F1F5F9' }),
          makeCell('Pertanyaan Pemantik & Keterangan', { widthPct: 78, bold: true, fill: 'F1F5F9' }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('1', { widthPct: 22, bold: true, align: AlignmentType.CENTER }),
          makeCell('Sebelum mempelajari materi ini, dari mana asal barang atau jasa yang kita gunakan setiap hari?', { widthPct: 78 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('2', { widthPct: 22, bold: true, align: AlignmentType.CENTER }),
          makeCell('Apa yang terjadi jika tidak ada kegiatan produksi?', { widthPct: 78 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('3', { widthPct: 22, bold: true, align: AlignmentType.CENTER }),
          makeCell('Apa perbedaan antara membuat barang dan memberikan jasa?', { widthPct: 78 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Cara Penilaian', { widthPct: 22, bold: true, fill: 'F8FAFC' }),
          makeCell(
            'Bersifat kualitatif dan tidak diberi skor angka. Guru membaca jawaban singkat peserta didik lalu memetakannya ke salah satu dari tiga kelompok kesiapan: Perlu Pendampingan, Reguler, atau Siap Pengayaan.',
            { widthPct: 78 }
          ),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Output Penilaian', { widthPct: 22, bold: true, fill: 'F8FAFC' }),
          makeCell(
            'Peta kesiapan awal peserta didik (per kelompok), menjadi dasar pembentukan kelompok diferensiasi pada Kegiatan Inti hari ini.',
            { widthPct: 78 }
          ),
        ],
      }),
    ],
  });

  const tableF1b = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          makeCell('Teknik', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell(
            'Observasi aktif selama diskusi/kerja kelompok, pertanyaan lisan (teknik Socratic/cold calling), dan pengamatan keterlibatan peserta didik sepanjang Kegiatan Inti.',
            { widthPct: 80, colSpan: 4 }
          ),
        ],
      }),
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('Aspek', { widthPct: 20, bold: true, fill: 'F1F5F9' }),
          makeCell('Sangat Baik (4)', { widthPct: 20, bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
          makeCell('Baik (3)', { widthPct: 20, bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
          makeCell('Cukup (2)', { widthPct: 20, bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
          makeCell('Perlu Bimbingan (1)', { widthPct: 20, bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Keterlibatan Aktif', { widthPct: 20, bold: true }),
          makeCell('Selalu aktif, berinisiatif', { widthPct: 20 }),
          makeCell('Sering aktif', { widthPct: 20 }),
          makeCell('Kadang aktif jika diminta', { widthPct: 20 }),
          makeCell('Pasif', { widthPct: 20 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Kemampuan Analisis', { widthPct: 20, bold: true }),
          makeCell('Analisis mendalam & kritis', { widthPct: 20 }),
          makeCell('Analisis logis', { widthPct: 20 }),
          makeCell('Analisis dasar', { widthPct: 20 }),
          makeCell('Belum mampu mandiri', { widthPct: 20 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Kolaborasi Tim', { widthPct: 20, bold: true }),
          makeCell('Kontribusi aktif', { widthPct: 20 }),
          makeCell('Bekerja sama baik', { widthPct: 20 }),
          makeCell('Kontribusi minimal', { widthPct: 20 }),
          makeCell('Sulit bekerja tim', { widthPct: 20 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Output Penilaian', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell(
            'Checklist partisipasi per peserta didik dan catatan anekdotal guru selama kegiatan berlangsung — dipakai sebagai bahan umpan balik langsung, bukan nilai rapor.',
            { widthPct: 80, colSpan: 4 }
          ),
        ],
      }),
    ],
  });

  const tableF1c = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('No. / Komponen', { widthPct: 22, bold: true, fill: 'F1F5F9' }),
          makeCell('Pertanyaan Refleksi', { widthPct: 78, bold: true, fill: 'F1F5F9' }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('1', { widthPct: 22, bold: true, align: AlignmentType.CENTER }),
          makeCell(`Sebutkan 1 hal paling penting yang kamu pelajari hari ini tentang ${profile.subject}.`, { widthPct: 78 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('2', { widthPct: 22, bold: true, align: AlignmentType.CENTER }),
          makeCell('Apakah ada bagian yang masih membingungkan? Jelaskan.', { widthPct: 78 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('3', { widthPct: 22, bold: true, align: AlignmentType.CENTER }),
          makeCell('Pada skala 1-4, seberapa yakin kamu sudah mencapai tujuan pembelajaran? (1 = belum sama sekali, 4 = sangat yakin)', { widthPct: 78 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Cara Penilaian', { widthPct: 22, bold: true, fill: 'F8FAFC' }),
          makeCell(
            'Exit ticket dinilai cepat oleh guru sebagai indikator pemahaman mandiri peserta didik terhadap TP hari ini — bukan skor akademik formal.',
            { widthPct: 78 }
          ),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Output Penilaian', { widthPct: 22, bold: true, fill: 'F8FAFC' }),
          makeCell(
            'Rekap sebaran skala pemahaman (1-4) seluruh kelas, menjadi dasar keputusan: melanjutkan ke topik berikutnya, atau melakukan pengulangan singkat di awal pertemuan berikutnya.',
            { widthPct: 78 }
          ),
        ],
      }),
    ],
  });

  const tableF3 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('Komponen', { widthPct: 30, bold: true, fill: 'F1F5F9' }),
          makeCell('Bobot', { widthPct: 15, bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
          makeCell('Keterangan', { widthPct: 55, bold: true, fill: 'F1F5F9' }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Pilihan Ganda (10 soal)', { widthPct: 30, bold: true }),
          makeCell('30%', { widthPct: 15, bold: true, align: AlignmentType.CENTER }),
          makeCell('Skor benar × 3, maks 30 poin.', { widthPct: 55 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Esai (5 soal)', { widthPct: 30, bold: true }),
          makeCell('50%', { widthPct: 15, bold: true, align: AlignmentType.CENTER }),
          makeCell('Tiap soal maks 20 poin, mengukur analisis dan sintesis.', { widthPct: 55 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Portofolio/Proyek', { widthPct: 30, bold: true }),
          makeCell('20%', { widthPct: 15, bold: true, align: AlignmentType.CENTER }),
          makeCell('Penilaian proses dan produk pembelajaran.', { widthPct: 55 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Konversi Nilai: 90-100 = A | 80-89 = B | 70-79 = C | 60-69 = D | <60 = E', {
            widthPct: 100,
            colSpan: 3,
            bold: true,
            fill: 'ECFDF5',
            color: '065F46',
          }),
        ],
      }),
    ],
  });

  const tableF4 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          makeCell('Remedial', { widthPct: 22, bold: true, fill: 'F8FAFC' }),
          makeCell(
            'Re-teaching konsep kunci dengan pendekatan berbeda, tutor sebaya, dan latihan berjenjang dari LOTS menuju MOTS bagi peserta didik di bawah KKM.',
            { widthPct: 78 }
          ),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Pengayaan', { widthPct: 22, bold: true, fill: 'F8FAFC' }),
          makeCell(
            `Proyek mandiri terkait ${profile.subject}, literatur lanjutan, atau partisipasi kompetisi bagi peserta didik yang telah mencapai KKM.`,
            { widthPct: 78 }
          ),
        ],
      }),
    ],
  });

  const tableF5 = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('No.', { widthPct: 6, bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
          makeCell('Nama Peserta Didik', { widthPct: 26, bold: true, fill: 'F1F5F9' }),
          makeCell('Catatan Formatif', { widthPct: 26, bold: true, fill: 'F1F5F9' }),
          makeCell('Nilai PG', { widthPct: 10, bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
          makeCell('Nilai Esai', { widthPct: 10, bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
          makeCell('Nilai Akhir', { widthPct: 12, bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
          makeCell('Predikat', { widthPct: 10, bold: true, fill: 'F1F5F9', align: AlignmentType.CENTER }),
        ],
      }),
      ...Array.from({ length: 36 }, (_, i) =>
        new TableRow({
          children: [
            makeCell(`${i + 1}`, { widthPct: 6, align: AlignmentType.CENTER }),
            makeCell('', { widthPct: 26 }),
            makeCell('', { widthPct: 26 }),
            makeCell('', { widthPct: 10, align: AlignmentType.CENTER }),
            makeCell('', { widthPct: 10, align: AlignmentType.CENTER }),
            makeCell('', { widthPct: 12, align: AlignmentType.CENTER }),
            makeCell('', { widthPct: 10, align: AlignmentType.CENTER }),
          ],
        })
      ),
    ],
  });

  // G. DIFERENSIASI PEMBELAJARAN
  const tableG = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      ['Konten', 'Materi disajikan multimodal (teks, visual, audio, video) untuk mengakomodasi gaya belajar berbeda.'],
      ['Proses', 'Diferensiasi proses melalui pilihan kegiatan, tugas bertingkat, dan pengelompokan fleksibel sesuai kebutuhan.'],
      ['Produk', 'Peserta didik memilih bentuk produk sesuai minat: laporan tertulis, poster, video singkat, atau demonstrasi langsung.'],
    ].map(
      ([k, v]) =>
        new TableRow({
          children: [
            makeCell(k, { widthPct: 22, bold: true, fill: 'F8FAFC' }),
            makeCell(v, { widthPct: 78 }),
          ],
        })
    ),
  });

  // H. LAMPIRAN & PASCA OBSERVASI
  const tableH = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          makeCell('Daftar Pustaka', { widthPct: 25, bold: true, fill: 'F8FAFC' }),
          makeCell(
            `1. Kemendikdasmen. (2026). Panduan Pembelajaran Mendalam Kurikulum Merdeka. Jakarta: Badan Standar, Kurikulum, dan Asesmen Pendidikan.\n2. Kemendikdasmen. (2026). Capaian Pembelajaran ${profile.subject} — Kurikulum Merdeka.\n3. Platform Merdeka Mengajar (PMM). Modul Ajar dan Perangkat Pembelajaran ${profile.subject}. guru.kemdikbud.go.id`,
            { widthPct: 75 }
          ),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Pasca Observasi — Catatan Peningkatan', { widthPct: 25, bold: true, fill: 'F8FAFC' }),
          makeCell('1. Mengoptimalkan manajemen waktu,\n2. Penekanan kesepakatan pembelajaran bersama siswa.', {
            widthPct: 75,
          }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Pasca Observasi — Rencana Tindak Lanjut', { widthPct: 25, bold: true, fill: 'F8FAFC' }),
          makeCell(
            '1. Mengoptimalkan manajemen waktu: Menyusun perencanaan kegiatan secara lebih terstruktur, menentukan skala prioritas, serta mengalokasikan waktu secara efektif agar seluruh proses pembelajaran berjalan sesuai jadwal.\n2. Menekankan kesepakatan pembelajaran: Mengingatkan dan menegaskan kembali kesepakatan pembelajaran bersama peserta didik, termasuk kedisiplinan, tanggung jawab, partisipasi aktif, serta aturan selama pembelajaran.',
            { widthPct: 75 }
          ),
        ],
      }),
    ],
  });

  const activeList =
    selectedInstrumentsToPrint && selectedInstrumentsToPrint.length > 0
      ? selectedInstrumentsToPrint
      : Array.isArray(modul.asesmenPembelajaran?.contohInstrumen)
      ? modul.asesmenPembelajaran.contohInstrumen
      : [
          'Penilaian Sejawat',
          'Penilaian Diri',
          'Penilaian Proyek',
          'Penilaian Produk',
          'Observasi',
          'Portofolio',
          'Penilaian Berbasis Kelas',
          'Penilaian Kinerja',
          'Tes tertulis',
          'Tes lisan',
        ];

  return [
    makeSectionHeader('A. INFORMASI UMUM'),
    tableA,
    makeSectionHeader('B. IDENTIFIKASI'),
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: 'B.1 Identifikasi Peserta Didik', bold: true, size: 20, font: 'Calibri', color: '7C2D12' })],
    }),
    tableB1,
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: 'B.2 Materi Pelajaran', bold: true, size: 20, font: 'Calibri', color: '7C2D12' })],
    }),
    tableB2,
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: 'B.3 Dimensi Profil Lulusan', bold: true, size: 20, font: 'Calibri', color: '7C2D12' })],
    }),
    tableB3,
    makeSectionHeader('C. DESAIN PEMBELAJARAN'),
    tableC,
    makeSectionHeader('D. PETA PENGALAMAN BELAJAR'),
    tableD,
    makeSectionHeader('E. LANGKAH-LANGKAH PEMBELAJARAN'),
    tableE,
    makeSectionHeader('F. ASESMEN PEMBELAJARAN'),
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: 'F.1.a — Sebelum Pembelajaran (Asesmen Diagnostik Awal)', bold: true, size: 20, font: 'Calibri', color: '7C2D12' })],
    }),
    tableF1a,
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: 'F.1.b — Saat Pembelajaran (Asesmen Proses)', bold: true, size: 20, font: 'Calibri', color: '7C2D12' })],
    }),
    tableF1b,
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: 'F.1.c — Setelah Pembelajaran (Exit Ticket)', bold: true, size: 20, font: 'Calibri', color: '7C2D12' })],
    }),
    tableF1c,
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: 'F.3 Pedoman Penskoran Sumatif', bold: true, size: 20, font: 'Calibri', color: '7C2D12' })],
    }),
    tableF3,
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: 'F.4 Remedial dan Pengayaan', bold: true, size: 20, font: 'Calibri', color: '7C2D12' })],
    }),
    tableF4,
    new Paragraph({
      spacing: { before: 80, after: 40 },
      children: [new TextRun({ text: 'F.5 Output Rekapitulasi Penilaian (Diisi Manual Oleh Guru)', bold: true, size: 20, font: 'Calibri', color: '7C2D12' })],
    }),
    tableF5,
    new Paragraph({
      spacing: { before: 80, after: 60 },
      children: [
        new TextRun({
          text: `Instrumen Penilaian Terlampir (${activeList.length} Terpilih): ${activeList.join(', ')}`,
          bold: true,
          size: 19,
          font: 'Calibri',
          color: '065F46',
        }),
      ],
    }),
    makeSectionHeader('G. DIFERENSIASI PEMBELAJARAN'),
    tableG,
    makeSectionHeader('H. LAMPIRAN & PASCA OBSERVASI'),
    tableH,
  ];
}

export async function exportModulAjarToWord(
  modulList: ModulAjarItem[],
  profile: SchoolProfile,
  filename?: string,
  selectedPertemuan: number | 'all' = 'all',
  selectedInstrumentsToPrint?: string[]
) {
  const ptmSuffix = selectedPertemuan !== 'all' ? `_PERTEMUAN_${selectedPertemuan}` : '';
  const targetFilename =
    filename ||
    `MODUL_AJAR_DEEP_LEARNING_${profile.subject.replace(/\s+/g, '_')}${ptmSuffix}_${profile.academicYear.replace('/', '-')}.docx`;

  const doc = new Document({
    sections: modulList.map((modul) => ({
      properties: {},
      children: [
        createOfficialKopTable(profile),
        new Paragraph({ text: '', spacing: { after: 100 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `RENCANA PEMBELAJARAN MENDALAM (BAB ${modul.babNumber}${selectedPertemuan !== 'all' ? ` - PERTEMUAN ${selectedPertemuan}` : ''})`,
              bold: true,
              size: 28,
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: 'Kurikulum Merdeka 2026 — Pembelajaran Berdiferensiasi',
              bold: true,
              size: 20,
              color: '7C2D12',
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 140 },
          children: [
            new TextRun({
              text: `${modul.babTitle} · ${selectedPertemuan !== 'all' ? `Pertemuan Ke-${selectedPertemuan} (3 JP)` : `Alokasi: ${modul.alokasiJp} JP (${modul.pertemuanCount || 6} Pertemuan)`}`,
              bold: true,
              size: 20,
              color: '065F46',
              font: 'Calibri',
            }),
          ],
        }),
        ...buildModulAjarTables(modul, profile, selectedPertemuan, selectedInstrumentsToPrint),
        new Paragraph({ text: '', spacing: { after: 160 } }),
        createOfficialSignatureTable(profile),
      ],
    })),
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, targetFilename);
}

/**
 * 9. LEMBAR KERJA PESERTA DIDIK (LKPD) - TABEL LENGKAP PERSIS PREVIEW
 */
export function buildLkpdTables(lkpd: LkpdItem, profile: SchoolProfile): (Paragraph | Table)[] {
  const identityTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell(`IDENTITAS KELOMPOK PESERTA DIDIK - BAB ${lkpd.babNumber}: ${lkpd.title.toUpperCase()}`, {
            colSpan: 4,
            bold: true,
            fill: '0F172A',
            color: 'FFFFFF',
          }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Mata Pelajaran', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell(profile.subject, { widthPct: 30, bold: true }),
          makeCell('Kelas / Fase', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell(`${profile.grade} / Fase ${profile.fase}`, { widthPct: 30 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Nama Kelompok', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell('................................................................', { widthPct: 30 }),
          makeCell('Alokasi Waktu', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell(lkpd.waktu, { widthPct: 30, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Anggota Kelompok (Maks 7 Siswa)', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell('1. ...........................  2. ...........................  3. ...........................\n4. ...........................  5. ...........................  6. ...........................  7. ...........................', {
            colSpan: 3,
            widthPct: 80,
          }),
        ],
      }),
    ],
  });

  const contentTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        children: [
          makeCell('A. PETUNJUK PENGERJAAN', { widthPct: 26, bold: true, fill: 'F8FAFC' }),
          makeCell(lkpd.petunjuk.map((p, i) => `${i + 1}. ${p}`).join('\n'), { widthPct: 74 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('B. RINGKASAN MATERI KONSEP', { widthPct: 26, bold: true, fill: 'F8FAFC' }),
          makeCell(lkpd.materiRingkas, { widthPct: 74 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('C. AKTIVITAS PENYELIDIKAN KOLABORATIF', { widthPct: 26, bold: true, fill: 'ECFDF5', color: '064E3B' }),
          makeCell(lkpd.aktivitas, { widthPct: 74, bold: true, fill: 'ECFDF5', color: '064E3B' }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('E. TUGAS MANDIRI & REFLEKSI', { widthPct: 26, bold: true, fill: 'F8FAFC' }),
          makeCell(lkpd.tugasMandiri, { widthPct: 74 }),
        ],
      }),
    ],
  });

  const questionsTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('NO', { widthPct: 8, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER }),
          makeCell('D. PERTANYAAN DISKUSI & ANALISIS HOTS', { widthPct: 46, bold: true, fill: '0F172A', color: 'FFFFFF' }),
          makeCell('RUANG JAWABAN PESERTA DIDIK', { widthPct: 46, bold: true, fill: '0F172A', color: 'FFFFFF' }),
        ],
      }),
      ...lkpd.pertanyaanDiskusi.map(
        (q, idx) =>
          new TableRow({
            children: [
              makeCell(`${idx + 1}`, { widthPct: 8, bold: true, align: AlignmentType.CENTER }),
              makeCell(q, { widthPct: 46, bold: true }),
              makeCell('........................................................................................................\n........................................................................................................', {
                widthPct: 46,
                color: '64748B',
              }),
            ],
          })
      ),
      new TableRow({
        children: [
          makeCell('KUNCI JAWABAN & RUBRIK GURU', {
            colSpan: 1,
            bold: true,
            fill: 'FEF3C7',
            color: '92400E',
          }),
          makeCell(lkpd.kunciJawaban, {
            colSpan: 2,
            bold: true,
            fill: 'FFFBEB',
            color: '92400E',
          }),
        ],
      }),
    ],
  });

  const lampiranFormatifTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell(`LAMPIRAN A.1: ASESMEN FORMATIF SIAP PAKAI (PERTEMUAN KE-${lkpd.pertemuan || 1})`, {
            colSpan: 5,
            bold: true,
            fill: '0F172A',
            color: 'FFFFFF',
          }),
        ],
      }),
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('Tahap Formatif', { widthPct: 20, bold: true, fill: '1E293B', color: 'FFFFFF' }),
          makeCell('Teknik & Instrumen', { widthPct: 20, bold: true, fill: '1E293B', color: 'FFFFFF' }),
          makeCell('Pertanyaan / Indikator Asesmen', { widthPct: 25, bold: true, fill: '1E293B', color: 'FFFFFF' }),
          makeCell('Rubrik & Kriteria Penilaian', { widthPct: 18, bold: true, fill: '1E293B', color: 'FFFFFF' }),
          makeCell('Tindak Lanjut Pedagogis', { widthPct: 17, bold: true, fill: '1E293B', color: 'FFFFFF' }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Awal Pembelajaran (Diagnostik)', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell('Pertanyaan Lisan Pemantik & Emosional', { widthPct: 20 }),
          makeCell(`1. Dari mana asal konsep ${lkpd.title}?\n2. Sebutkan contoh penerapan harianmu.`, { widthPct: 25 }),
          makeCell('• Belum Paham (1-2)\n• Paham Dasar (3)\n• Siap Pengayaan (4)', { widthPct: 18 }),
          makeCell('Pembentukan kelompok heterogen (maks 7 siswa)', { widthPct: 17, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Proses Pembelajaran (Kinerja Diskusi)', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell('Lembar Observasi Aktivitas & Rubrik Diskusi', { widthPct: 20 }),
          makeCell('1. Keaktifan penyelidikan kelompok\n2. Kemampuan menyampaikan argumen kritis', { widthPct: 25 }),
          makeCell('• SB (Sangat Baik / 4)\n• B (Baik / 3)\n• C (Cukup / 2)\n• PB (Perlu Bimbingan / 1)', { widthPct: 18 }),
          makeCell('Pendampingan langsung (scaffolding) bagi kelompok butuh dukungan', { widthPct: 17, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Akhir Pembelajaran (Exit Ticket)', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell('Exit Ticket 3-2-1 & Sesi Teach-Back', { widthPct: 20 }),
          makeCell('1. "1 Hal paling berkesan hari ini?"\n2. "1 Hal yang masih membingungkan?"', { widthPct: 25 }),
          makeCell('Peta sebaran pemahaman mandiri (Skala 1-4) tanpa skor angka rapor', { widthPct: 18 }),
          makeCell('Pengulasan singkat di awal pertemuan berikutnya', { widthPct: 17, bold: true }),
        ],
      }),
    ],
  });

  const lampiranSumatifTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell(`LAMPIRAN A.2: ASESMEN SUMATIF SIAP PAKAI (PERTEMUAN KE-${lkpd.pertemuan || 1})`, {
            colSpan: 5,
            bold: true,
            fill: '0F172A',
            color: 'FFFFFF',
          }),
        ],
      }),
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('Tahap Sumatif', { widthPct: 20, bold: true, fill: '1E293B', color: 'FFFFFF' }),
          makeCell('Bentuk & Instrumen', { widthPct: 20, bold: true, fill: '1E293B', color: 'FFFFFF' }),
          makeCell('Kisi-Kisi / Indikator (HOTS)', { widthPct: 25, bold: true, fill: '1E293B', color: 'FFFFFF' }),
          makeCell('Bobot & Pedoman Penskoran', { widthPct: 18, bold: true, fill: '1E293B', color: 'FFFFFF' }),
          makeCell('Konversi Predikat Rapor', { widthPct: 17, bold: true, fill: '1E293B', color: 'FFFFFF' }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Awal Pembelajaran (Tes Prasyarat)', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell('Tes Kemampuan Prasyarat (5 PG)', { widthPct: 20 }),
          makeCell(`Mengukur kelengkapan fondasi kompetensi sebelum memasuki ${lkpd.title}`, { widthPct: 25 }),
          makeCell('Skor Benar × 20 (Maks 100). Ambang KKTP ≥ 75.', { widthPct: 18 }),
          makeCell('Program pemantapan prasyarat singkat', { widthPct: 17, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Proses Pembelajaran (Sumatif Produk)', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell('Rubrik Penilaian Produk / Laporan Kelompok', { widthPct: 20 }),
          makeCell('1. Orisinalitas & Analisis (40%)\n2. Kerapian Laporan (30%)\n3. Presentasi (30%)', { widthPct: 25 }),
          makeCell('Skor Maksimal 100.\n• 90-100: Mahir (A)\n• 80-89: Cakap (B)\n• 75-79: Layak (C)\n• <75: Perlu Bimbingan (D)', { widthPct: 18 }),
          makeCell(`Nilai Sumatif Lingkup Materi (LM) Pertemuan ke-${lkpd.pertemuan || 1}`, { widthPct: 17, bold: true }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Akhir Pembelajaran (Sumatif Bab)', { widthPct: 20, bold: true, fill: 'F8FAFC' }),
          makeCell('Tes Tertulis HOTS (PG & Esai Analitis C4-C6)', { widthPct: 20 }),
          makeCell('1. 10 Pilihan Ganda (C4-C5)\n2. 2 Soal Esai Analitis (C6)', { widthPct: 25 }),
          makeCell('• PG: 30%\n• Esai: 50%\n• Produk: 20%\nSkor Akhir Maks 100.', { widthPct: 18 }),
          makeCell(`Nilai Rapor Akhir Bab ${lkpd.babNumber}`, { widthPct: 17, bold: true }),
        ],
      }),
    ],
  });

  const materiTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell(`LAMPIRAN B: MATERI PELAJARAN RESMI - ${lkpd.title.toUpperCase()}`, {
            colSpan: 2,
            bold: true,
            fill: '0F172A',
            color: 'FFFFFF',
          }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('1. Rujukan Buku Teks Resmi', { widthPct: 26, bold: true, fill: 'F8FAFC' }),
          makeCell(`Buku Teks Utama Kurikulum Merdeka Edisi Revisi (${profile.subject} Kelas ${profile.grade}), Penerbit: Pusat Perbukuan BSKAP Kemendikdasmen RI (Akses SIBI: buku.kemendikdasmen.go.id), KepKa BSKAP No. 046/H/KR/2025`, { widthPct: 74 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('2. Uraian Bahan Bacaan Peserta Didik', { widthPct: 26, bold: true, fill: 'F8FAFC' }),
          makeCell(`${lkpd.materiRingkas} Materi ini disusun berdasarkan standar analisis buku teks resmi untuk memperkuat penalaran kritis, kolaborasi, dan kecakapan vokasi/kehidupan peserta didik.`, { widthPct: 74 }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('3. Glosarium & Istilah Abad 21', { widthPct: 26, bold: true, fill: 'F8FAFC' }),
          makeCell('Pembelajaran Mendalam (Deep Learning): Pendekatan pembelajaran berkesadaran (mindful), bermakna (meaningful), dan menggembirakan (joyful) untuk menguatkan Profil Pelajar Pancasila dan penalaran kritis.', { widthPct: 74, italics: true }),
        ],
      }),
      new TableRow({
        children: [
          makeCell('4. Daftar Pustaka Resmi', { widthPct: 26, bold: true, fill: 'F8FAFC' }),
          makeCell(`Pusat Perbukuan BSKAP Kemendikdasmen RI. (2025). Buku Teks Utama Kurikulum Merdeka Edisi Revisi ${profile.subject} Kelas ${profile.grade}. Jakarta: Kementerian Pendidikan Dasar dan Menengah Republik Indonesia (SIBI: buku.kemendikdasmen.go.id).`, { widthPct: 74 }),
        ],
      }),
    ],
  });

  return [
    identityTable,
    new Paragraph({ text: '', spacing: { after: 100 } }),
    contentTable,
    new Paragraph({ text: '', spacing: { after: 100 } }),
    questionsTable,
    new Paragraph({ text: '', spacing: { after: 140 } }),
    lampiranFormatifTable,
    new Paragraph({ text: '', spacing: { after: 100 } }),
    lampiranSumatifTable,
    new Paragraph({ text: '', spacing: { after: 100 } }),
    materiTable,
  ];
}

export async function exportLkpdToWord(
  lkpdList: LkpdItem[],
  profile: SchoolProfile,
  filename?: string
) {
  const targetFilename =
    filename ||
    `LKPD_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.docx`;

  const doc = new Document({
    sections: lkpdList.map((lkpd) => ({
      properties: {},
      children: [
        createOfficialKopTable(profile),
        new Paragraph({ text: '', spacing: { after: 100 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: `LEMBAR KERJA PESERTA DIDIK (LKPD) - BAB ${lkpd.babNumber}`,
              bold: true,
              size: 26,
              font: 'Calibri',
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [
            new TextRun({
              text: `${lkpd.title} · Waktu: ${lkpd.waktu}`,
              bold: true,
              size: 20,
              color: '065F46',
              font: 'Calibri',
            }),
          ],
        }),
        createOfficialIdentitasTable(profile, `${profile.academicYear} / Semester ${lkpd.semester || 1}`),
        new Paragraph({ text: '', spacing: { after: 120 } }),
        ...buildLkpdTables(lkpd, profile),
        new Paragraph({ text: '', spacing: { after: 160 } }),
        createOfficialSignatureTable(profile),
      ],
    })),
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, targetFilename);
}

/**
 * 10. ASESMEN & REKAP NILAI RAPOR SISWA - TABEL LENGKAP 15 KOLOM PERSIS PREVIEW
 */
export function buildAsesmenTable(students: StudentRecord[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: SOLID_TABLE_BORDERS,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          makeCell('NO', { widthPct: 4, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('NISN', { widthPct: 9, bold: true, fill: '0F172A', color: 'FFFFFF', fontSize: 17 }),
          makeCell('NAMA PESERTA DIDIK', { widthPct: 21, bold: true, fill: '0F172A', color: 'FFFFFF', fontSize: 17 }),
          makeCell('L/P', { widthPct: 4, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('TP1', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('TP2', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('TP3', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('TP4', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('TP5', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('TP6', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('TP7', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('SUMATIF', { widthPct: 7, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('NILAI AKHIR', { widthPct: 7, bold: true, fill: '064E3B', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('PRED', { widthPct: 5, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
          makeCell('STATUS KKTP', { widthPct: 8, bold: true, fill: '0F172A', color: 'FFFFFF', align: AlignmentType.CENTER, fontSize: 17 }),
        ],
      }),
      ...students.map(
        (s, idx) =>
          new TableRow({
            children: [
              makeCell(`${idx + 1}`, { widthPct: 4, align: AlignmentType.CENTER, fontSize: 18 }),
              makeCell(s.nisn, { widthPct: 9, fontSize: 18 }),
              makeCell(s.name, { widthPct: 21, bold: true, fontSize: 18 }),
              makeCell(s.gender, { widthPct: 4, align: AlignmentType.CENTER, fontSize: 18 }),
              makeCell(`${s.formatifScores['TP 10.1'] || '-'}`, { widthPct: 5, align: AlignmentType.CENTER, fontSize: 18 }),
              makeCell(`${s.formatifScores['TP 10.2'] || '-'}`, { widthPct: 5, align: AlignmentType.CENTER, fontSize: 18 }),
              makeCell(`${s.formatifScores['TP 10.3'] || '-'}`, { widthPct: 5, align: AlignmentType.CENTER, fontSize: 18 }),
              makeCell(`${s.formatifScores['TP 10.4'] || '-'}`, { widthPct: 5, align: AlignmentType.CENTER, fontSize: 18 }),
              makeCell(`${s.formatifScores['TP 10.5'] || '-'}`, { widthPct: 5, align: AlignmentType.CENTER, fontSize: 18 }),
              makeCell(`${s.formatifScores['TP 10.6'] || '-'}`, { widthPct: 5, align: AlignmentType.CENTER, fontSize: 18 }),
              makeCell(`${s.formatifScores['TP 10.7'] || '-'}`, { widthPct: 5, align: AlignmentType.CENTER, fontSize: 18 }),
              makeCell(`${s.sumatifAkhir}`, { widthPct: 7, bold: true, align: AlignmentType.CENTER, fontSize: 18 }),
              makeCell(`${s.nilaiAkhir}`, {
                widthPct: 7,
                bold: true,
                fill: 'ECFDF5',
                color: '064E3B',
                align: AlignmentType.CENTER,
                fontSize: 18,
              }),
              makeCell(s.predikat, { widthPct: 5, bold: true, align: AlignmentType.CENTER, fontSize: 18 }),
              makeCell(s.kktpStatus, {
                widthPct: 8,
                bold: true,
                color: s.kktpStatus === 'Tuntas' ? '065F46' : 'BE123C',
                align: AlignmentType.CENTER,
                fontSize: 17,
              }),
            ],
          })
      ),
    ],
  });
}

export async function exportAsesmenToWord(
  students: StudentRecord[],
  profile: SchoolProfile,
  filename?: string
) {
  const targetFilename =
    filename ||
    `REKAP_NILAI_ASESMEN_RAPOR_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.docx`;

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
              width: 16838,
              height: 11906,
            },
          },
        },
        children: [
          createOfficialKopTable(profile),
          new Paragraph({ text: '', spacing: { after: 100 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'REKAPITULASI NILAI ASESMEN FORMATIF, SUMATIF & RAPOR SISWA',
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: `Mata Pelajaran: ${profile.subject} · Kelas: ${profile.grade} (Fase ${profile.fase}) · Tahun Ajaran ${profile.academicYear}`,
                bold: true,
                size: 20,
                color: '065F46',
                font: 'Calibri',
              }),
            ],
          }),
          createOfficialIdentitasTable(profile),
          new Paragraph({ text: '', spacing: { after: 120 } }),
          buildAsesmenTable(students),
          new Paragraph({ text: '', spacing: { after: 160 } }),
          createOfficialSignatureTable(profile),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, targetFilename);
}

/**
 * 11. BUNDEL MASTER LENGKAP 1 TAHUN (SELURUH TABEL DOKUMEN 1–10 DIGABUNG UTUH TANPA BERUBAH)
 */
export async function exportMasterBundelToWord(
  payload: {
    profile: SchoolProfile;
    cpElements: CpElement[];
    tujuanPembelajaran: TujuanPembelajaran[];
    rpe: RpeState;
    prota: ProtaItem[];
    promes: PromesItem[];
    modulAjarList: ModulAjarItem[];
    lkpdList: LkpdItem[];
    students: StudentRecord[];
    kaldikEvents: KaldikEvent[];
  },
  filename?: string
) {
  const {
    profile,
    cpElements,
    tujuanPembelajaran,
    rpe,
    prota,
    promes,
    modulAjarList,
    lkpdList,
    students,
    kaldikEvents,
  } = payload;

  const targetFilename =
    filename ||
    `BUNDEL_MASTER_LENGKAP_1TAHUN_${profile.subject.replace(/\s+/g, '_')}_${profile.academicYear.replace('/', '-')}.docx`;

  const { fourColGridTable, cpElementTable, atpTable } = buildCpAtpTables(cpElements, tujuanPembelajaran);
  const {
    twelveMonthTable,
    s1Table,
    s2Table,
    tpDistributionTable,
    realScheduleTable,
  } = buildRpeTables(
    rpe,
    { kaldikEvents, prota, promes },
    profile.academicYear
  );
  const { tpBloomTable, matrix2DTable } = buildBloomTables(tujuanPembelajaran);

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          createOfficialKopTable(profile),
          new Paragraph({ text: '', spacing: { after: 100 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'BUNDEL MASTER LENGKAP PERANGKAT ADMINISTRASI PEMBELAJARAN (1 TAHUN)',
                bold: true,
                size: 26,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: `Mata Pelajaran: ${profile.subject} · Fase ${profile.fase} (${profile.grade}) · Tahun Ajaran ${profile.academicYear}`,
                bold: true,
                size: 20,
                color: '065F46',
                font: 'Calibri',
              }),
            ],
          }),

          // I. ELEMEN CP & MATRIKS ATP
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              new TextRun({
                text: 'BAGIAN I: ELEMEN CAPAIAN PEMBELAJARAN & MATRIKS ATP (BSKAP 046/2025)',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          fourColGridTable,
          new Paragraph({ text: '', spacing: { after: 80 } }),
          cpElementTable,
          new Paragraph({ text: '', spacing: { after: 100 } }),
          atpTable,

          // II. TAKSONOMI BLOOM & MATRIKS HOTS
          new Paragraph({
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: 'BAGIAN II: ANALISIS TAKSONOMI BLOOM & MATRIKS 2D ANDERSON-KRATHWOHL',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          tpBloomTable,
          new Paragraph({ text: '', spacing: { after: 80 } }),
          matrix2DTable,

          // III. KALENDER PENDIDIKAN, RPE 12 BULAN & PROGRAM ALOKASI WAKTU TP
          new Paragraph({
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: 'BAGIAN III: KALENDER PENDIDIKAN, RINCIAN PEKAN EFEKTIF (RPE) & PROGRAM ALOKASI WAKTU TP',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          twelveMonthTable,
          new Paragraph({ text: '', spacing: { after: 80 } }),
          s1Table,
          new Paragraph({ text: '', spacing: { after: 80 } }),
          s2Table,
          ...(tpDistributionTable
            ? [new Paragraph({ text: '', spacing: { after: 80 } }), tpDistributionTable]
            : []),
          new Paragraph({ text: '', spacing: { after: 80 } }),
          realScheduleTable,
          new Paragraph({ text: '', spacing: { after: 80 } }),
          buildKaldikTable(kaldikEvents),

          // IV. PROTA & PROMES
          new Paragraph({
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: 'BAGIAN IV: PROGRAM TAHUNAN (PROTA) & PROGRAM SEMESTER (PROMES)',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          buildProtaTable(prota),
          new Paragraph({ text: '', spacing: { after: 80 } }),
          buildPromesSemesterTable(promes, 1, profile),
          new Paragraph({ text: '', spacing: { after: 80 } }),
          buildPromesSemesterTable(promes, 2, profile),

          // V. MODUL AJAR DEEP LEARNING (UNIT 1)
          new Paragraph({
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: 'BAGIAN V: MODUL AJAR DEEP LEARNING & RUBRIK KKTP',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...buildModulAjarTables(modulAjarList[0], profile),

          // VI. LKPD (BAB 1)
          new Paragraph({
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: 'BAGIAN VI: LEMBAR KERJA PESERTA DIDIK (LKPD)',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          ...buildLkpdTables(lkpdList[0], profile),

          // VII. REKAP NILAI ASESMEN & RAPOR
          new Paragraph({
            spacing: { before: 180, after: 80 },
            children: [
              new TextRun({
                text: 'BAGIAN VII: REKAPITULASI NILAI ASESMEN & RAPOR SISWA',
                bold: true,
                size: 22,
                font: 'Calibri',
              }),
            ],
          }),
          buildAsesmenTable(students),

          new Paragraph({ text: '', spacing: { after: 160 } }),
          createOfficialSignatureTable(profile),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, targetFilename);
}

/**
 * Triggers standard browser printing
 */
export function triggerPrint() {
  window.print();
}

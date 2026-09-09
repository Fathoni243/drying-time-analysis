/**
 * exportMaterialCheck.js  (v3)
 *
 * Export data Pengecekan Kecukupan Material ke file .xlsx menggunakan
 * template resmi perusahaan (Form PPIC – Pengecekan Kedatangan Material).
 *
 * Perubahan v3 (dari REVISI_v3_exportMaterialCheck.md):
 *  1. Border "Nama Produk" kiri tidak hilang — set border di cell master saja
 *  2. Font Arial 8 di semua cell yang ditulis
 *  3. Footer (tanda tangan): catat merge lama → unmerge → spliceRows → restore merge
 *  4. Restrukturisasi blok B–D (8 baris, No PO & No Batch kosong, Nama Produk+Line gabung)
 *
 * Template diambil dari src/assets/ via Vite asset URL — tidak perlu file di public/.
 */

// Vite resolves ?url import ke URL string (dengan content-hash) dari src/assets/
import TEMPLATE_URL from '../../assets/excel/Template Export Data.xlsx?url';
import ExcelJS from 'exceljs';

// ── Konstanta ────────────────────────────────────────────────────────────────

const HEADER_START_ROW = 15; // Baris pertama data di template

// Nama bulan Indonesia
const BULAN_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// Warna fill cell Nama Produk per Line (ARGB)
const LINE_FILL_COLORS = {
  'LINE 1': 'FFBDD7EE', // Biru  — Accent5 Lighter 60%
  'LINE 2': 'FFC6E0B4', // Hijau — Accent6 Lighter 60%
  'LINE 3': 'FFF8CBAD', // Oren  — Accent2 Lighter 60%
};

// Font wajib untuk semua cell yang ditulis
const DATA_FONT = { name: 'Arial', size: 8 };

// Border tipis
const THIN = { style: 'thin' };

// ── Helper: tanggal ───────────────────────────────────────────────────────────

/**
 * Parse string ISO date "YYYY-MM-DD" ke Date object di UTC (bukan local time).
 * PENTING: exceljs serialize Date ke Excel serial number dalam UTC.
 * Jika pakai new Date(y, m-1, d) (local time), di timezone UTC+7 tanggal
 * akan ter-geser -1 hari (misal 08/09 jadi 07/09).
 * @param {string} iso
 * @returns {Date|null}
 */
function parseISODate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d)); // UTC agar tidak offset saat serialisasi
}

function formatPeriode(tglAwal, tglAkhir) {
  if (!tglAwal) return '';
  const fmt = (d) => `${d.getDate()} ${BULAN_ID[d.getMonth()]}`;
  if (!tglAkhir || tglAwal.getTime() === tglAkhir.getTime()) {
    return `Periode : ${fmt(tglAwal)} ${tglAwal.getFullYear()}`;
  }
  if (tglAwal.getFullYear() === tglAkhir.getFullYear()) {
    return `Periode : ${fmt(tglAwal)} - ${fmt(tglAkhir)} ${tglAkhir.getFullYear()}`;
  }
  return `Periode : ${fmt(tglAwal)} ${tglAwal.getFullYear()} - ${fmt(tglAkhir)} ${tglAkhir.getFullYear()}`;
}

function buildFilename(tglAwal, tglAkhir) {
  const fmt = (d) => {
    if (!d) return 'nodate';
    return `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  };
  const a = fmt(tglAwal);
  const b = tglAkhir && tglAwal?.getTime() !== tglAkhir?.getTime() ? `-${fmt(tglAkhir)}` : '';
  return `Pengecekan_Kedatangan_Material_${a}${b}.xlsx`;
}

// ── Helper: style ─────────────────────────────────────────────────────────────

function copyStyle(src, dst) {
  if (src.font)      dst.font      = JSON.parse(JSON.stringify(src.font));
  if (src.fill)      dst.fill      = JSON.parse(JSON.stringify(src.fill));
  if (src.border)    dst.border    = JSON.parse(JSON.stringify(src.border));
  if (src.alignment) dst.alignment = JSON.parse(JSON.stringify(src.alignment));
  if (src.numFmt)    dst.numFmt    = src.numFmt;
}

function copyRowStyle(srcRow, dstRow) {
  srcRow.eachCell({ includeEmpty: true }, (srcCell) => {
    copyStyle(srcCell, dstRow.getCell(srcCell.col));
  });
  dstRow.height = srcRow.height;
}

/**
 * Set value + font Arial 8 pada satu cell.
 */
function setCell(cell, value) {
  cell.value = value;
  cell.font  = { ...DATA_FONT };
}

/**
 * Ambil semua merge ranges sebagai full range strings (e.g. 'B19:E21').
 * exceljs menyimpan di _merges dengan key = master cell address,
 * value = object yang punya .shortRange = full range string.
 * @param {ExcelJS.Worksheet} ws
 * @returns {string[]}
 */
function getMergeRanges(ws) {
  return Object.values(ws._merges || {})
    .map(m => m && m.shortRange)
    .filter(Boolean);
}

/**
 * Merge cells secara aman — hapus semua merge yang overlap dulu.
 * Menggunakan getMergeRanges() untuk mendapat full range strings yang valid.
 * @param {ExcelJS.Worksheet} ws
 * @param {string} range  misal "B20:D21"
 */
function safeMergeCells(ws, range) {
  const [tl, br] = range.split(':');
  const r1 = ws.getCell(tl).row,  c1 = ws.getCell(tl).col;
  const r2 = ws.getCell(br).row,  c2 = ws.getCell(br).col;

  // Gunakan getMergeRanges untuk dapat full range strings yang benar
  const existingRanges = getMergeRanges(ws);
  for (const existingRange of existingRanges) {
    try {
      const [etl, ebr] = existingRange.split(':');
      const er1 = ws.getCell(etl).row, ec1 = ws.getCell(etl).col;
      const er2 = ws.getCell(ebr).row, ec2 = ws.getCell(ebr).col;
      const overlaps = er1 <= r2 && er2 >= r1 && ec1 <= c2 && ec2 >= c1;
      if (overlaps) {
        ws.unMergeCells(existingRange); // full range string — benar!
      }
    } catch { /* abaikan */ }
  }

  try { ws.mergeCells(range); } catch { /* biarkan jika tetap gagal */ }
}

// ── Helper: border ────────────────────────────────────────────────────────────

/**
 * Border sesuai spec:
 *  B–D : outline per-blok (kiri B, kanan D, atas baris-pertama, bawah baris-terakhir)
 *         KECUALI baris merge Nama Produk: set border langsung di cell master (B) —
 *         bukan loop per kolom — supaya sisi kiri tidak ketimpa.
 *  E–M : full grid tiap cell
 *
 * @param {ExcelJS.Worksheet} ws
 * @param {number} startRow
 * @param {number} rowCount
 * @param {number} namaProdukOffset  offset baris pertama merge Nama Produk (default 5)
 */
function applyBlockBorders(ws, startRow, rowCount, namaProdukOffset = 5) {
  const lastRow    = startRow + rowCount - 1;
  const namaProdukRow1 = startRow + namaProdukOffset;
  const namaProdukRow2 = startRow + namaProdukOffset + 1;

  for (let r = startRow; r <= lastRow; r++) {
    const isFirst = r === startRow;
    const isLast  = r === lastRow;
    const isNamaProdukMerge = (r === namaProdukRow1 || r === namaProdukRow2);

    if (isNamaProdukMerge) {
      // Merge cell — set border SEKALI di cell master (kolom B).
      // Hanya left dan right — tidak ada top/bottom karena cell ini
      // adalah baris internal blok (bukan baris pertama atau terakhir).
      ws.getCell(`B${r}`).border = {
        left:  THIN,
        right: THIN,
      };
    } else {
      // Baris normal — loop B, C, D dengan outline-only
      ['B', 'C', 'D'].forEach(col => {
        ws.getCell(`${col}${r}`).border = {
          top:    isFirst      ? THIN : undefined,
          bottom: isLast       ? THIN : undefined,
          left:   col === 'B'  ? THIN : undefined,
          right:  col === 'D'  ? THIN : undefined,
        };
      });
    }

    // Kolom E–M: full grid
    for (let colIdx = 5; colIdx <= 13; colIdx++) {
      ws.getCell(r, colIdx).border = {
        top: THIN, bottom: THIN, left: THIN, right: THIN,
      };
    }
  }
}

// ── Helper: isi blok B–D (struktur v3, 8 baris) ──────────────────────────────

/**
 * Struktur 8 baris (v3):
 *  offset 0: Tanggal        :  <tgl>
 *  offset 1: Kode produk    :  <kode>
 *  offset 2: No PO          :  (kosong)
 *  offset 3: No Batch       :  (kosong)
 *  offset 4: Production Plan:  <jumlahBatch>
 *  offset 5-6 (merge B:D 2 baris): <namaProduk>\n<line>  — warna + center
 *  offset 7: Qty Plan in (Kg): <qtyPlanKg>
 */
function fillEntryHeader(ws, startRow, entry) {
  const labels = [
    ['Tanggal',          ':', parseISODate(entry.tanggalProduksi)],
    ['Kode produk',      ':', entry.kodeProduk ?? ''],
    ['No PO',            ':', ''],
    ['No Batch',         ':', ''],
    ['Production Plan',  ':', entry.jumlahBatch !== '' ? Number(entry.jumlahBatch) : ''],
    null, // offset 5: merge Nama Produk + Line (handle di bawah)
    null, // offset 6: bagian ke-2 merge
    ['Qty Plan in (Kg)', ':', entry.qtyPlanKg ?? ''],
  ];

  for (let offset = 0; offset < 8; offset++) {
    const absRow = startRow + offset;
    const row    = ws.getRow(absRow);

    if (offset === 5) {
      // Merge 2 baris: isi teks NamaProduk + Line (dipisah newline)
      const mergeRef = `B${absRow}:D${absRow + 1}`;
      safeMergeCells(ws, mergeRef);

      const namaLine = [entry.namaProduk ?? '', entry.line ?? ''].filter(Boolean).join('\n');
      const cellNama = row.getCell('B');
      setCell(cellNama, namaLine);
      cellNama.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

      // Warna fill sesuai Line
      const normalizedLine = (entry.line || '').toString().trim().toUpperCase();
      const fillColor = LINE_FILL_COLORS[normalizedLine];
      if (fillColor) {
        cellNama.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      }
      continue;
    }

    if (offset === 6) continue; // bagian ke-2 merge, sudah diurus offset 5

    const [label, sep, val] = labels[offset];
    setCell(row.getCell('B'), label);
    setCell(row.getCell('C'), sep);
    setCell(row.getCell('D'), val ?? '');
  }
}

// ── Helper: isi baris bahan (E–M) ────────────────────────────────────────────

function fillBahanRow(row, bahan) {
  setCell(row.getCell('E'), bahan.tipe ?? (bahan.kodeBahan?.includes('PACK') ? 'PM' : 'RM'));
  setCell(row.getCell('F'), bahan.namaBahan ?? '');
  setCell(row.getCell('G'), bahan.kodeBahan ?? '');
  setCell(row.getCell('H'), typeof bahan.qtyBahanProduksi === 'number' ? bahan.qtyBahanProduksi : 0);
  setCell(row.getCell('I'), typeof bahan.qtyKedatangan    === 'number' ? bahan.qtyKedatangan    : 0);
  setCell(row.getCell('J'), typeof bahan.stokAwal         === 'number' ? bahan.stokAwal         : 0);
  setCell(row.getCell('K'), bahan.uom    ?? '');
  setCell(row.getCell('L'), bahan.status ?? '');
  setCell(row.getCell('M'), typeof bahan.sisaStok         === 'number' ? bahan.sisaStok         : 0);
}

// ── Main: export ──────────────────────────────────────────────────────────────

export async function exportMaterialCheckToExcel(computedEntries) {
  if (!computedEntries || computedEntries.length === 0) {
    throw new Error('Tidak ada data untuk di-export.');
  }

  // ── 1. Load template dari src/assets/ via Vite ?url import ───────────────
  let templateBuffer;
  try {
    const resp = await fetch(TEMPLATE_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
    templateBuffer = await resp.arrayBuffer();
  } catch (err) {
    throw new Error(
      `Gagal memuat template export. Detail: ${err.message}`
    );
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(templateBuffer);
  const ws = workbook.worksheets[0];

  // ── 2. Isi Periode (baris 11) ─────────────────────────────────────────────
  const allDates = computedEntries.map(e => parseISODate(e.tanggalProduksi)).filter(Boolean);
  const tglAwal  = allDates.length ? new Date(Math.min(...allDates.map(d => d.getTime()))) : null;
  const tglAkhir = allDates.length ? new Date(Math.max(...allDates.map(d => d.getTime()))) : null;
  ws.getRow(11).getCell('B').value = formatPeriode(tglAwal, tglAkhir);

  // ── 3. Simpan & unmerge SEMUA merge ≥ baris 15 sebelum spliceRows ─────────
  //    KRITIS: exceljs TIDAK otomatis menggeser merge saat spliceRows.
  //    Footer merges (B18:E18, B19:E21, B22:E22, dll.) akan TETAP di baris lama
  //    setelah insert, menyebabkan overlap dengan data entry pertama.
  //    Fix: snapshot → unmerge → spliceRows → restore di posisi baru.
  const savedMergeRanges = getMergeRanges(ws).filter(range => {
    const m = range.match(/^[A-Z]+?(\d+)/);
    return m && parseInt(m[1]) >= HEADER_START_ROW;
  });
  savedMergeRanges.forEach(range => { try { ws.unMergeCells(range); } catch {} });

  // ── 4. Simpan style baris template 15 (sebelum splice) ───────────────────
  const templateDataRow = ws.getRow(HEADER_START_ROW);

  // ── 5. Hitung total baris & spliceRows ──────────────────────────────────────
  // Minimum 8 baris per blok (v3: 8 baris header B–D)
  const blockSizes      = computedEntries.map(e => Math.max(8, (e.hasil ?? []).length));
  const totalInsertRows = blockSizes.reduce((sum, s) => sum + s + 1, 0); // +1 spacer

  if (totalInsertRows > 1) {
    ws.spliceRows(HEADER_START_ROW, 0, ...Array(totalInsertRows - 1).fill([]));
  }

  // ── 6. Restore footer merges di posisi baru (baris lama + rowShift) ───────
  const rowShift = totalInsertRows - 1;
  savedMergeRanges.forEach(range => {
    // Ganti setiap angka row dalam range string dengan angka + rowShift
    // Contoh: 'B19:E21' + rowShift=53 → 'B72:E74'
    const newRange = range.replace(/(\d+)/g, n => parseInt(n) + rowShift);
    try { ws.mergeCells(newRange); } catch { /* abaikan */ }
  });

  // ── 7. Isi setiap blok ───────────────────────────────────────────────────
  let currentRow = HEADER_START_ROW;

  for (let ei = 0; ei < computedEntries.length; ei++) {
    const entry     = computedEntries[ei];
    const hasil     = entry.hasil ?? [];
    const blokSize  = blockSizes[ei];
    const blokStart = currentRow;

    // Clone style template
    for (let offset = 0; offset < blokSize; offset++) {
      copyRowStyle(templateDataRow, ws.getRow(blokStart + offset));
    }

    // Isi header B–D (8 baris v3)
    fillEntryHeader(ws, blokStart, entry);

    // Isi baris bahan E–M
    for (let bi = 0; bi < hasil.length; bi++) {
      const row = ws.getRow(blokStart + bi);
      fillBahanRow(row, hasil[bi]);

      // Highlight merah muda jika KURANG
      if (hasil[bi].status === 'KURANG') {
        ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'].forEach(col => {
          row.getCell(col).fill = {
            type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFCCCC' },
          };
        });
      }

      row.commit();
    }

    // Terapkan border (offset Nama Produk = 5 di v3)
    applyBlockBorders(ws, blokStart, blokSize, 5);

    // Commit baris blok + spacer
    for (let offset = 0; offset < blokSize; offset++) {
      ws.getRow(blokStart + offset).commit();
    }
    ws.getRow(blokStart + blokSize).commit();

    currentRow = blokStart + blokSize + 1;
  }

  // ── 8. Generate & download ───────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = buildFilename(tglAwal, tglAkhir);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

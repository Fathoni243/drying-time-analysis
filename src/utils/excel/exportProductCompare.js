import * as XLSX from 'xlsx';

/**
 * Columns definition for the Product Compare export.
 */
const COLUMNS = [
  { header: 'No',             key: 'No',             wch: 5  },
  { header: 'Code Product',   key: 'Code Product',   wch: 20 },
  { header: 'Nama Produk',    key: 'Nama Produk',    wch: 38 },
  { header: 'Planning (Kg)',  key: 'Planning (Kg)',  wch: 14 },
  { header: 'Jumlah Batch',   key: 'Jumlah Batch',   wch: 13 },
  { header: 'Rata-rata',      key: 'Rata-rata',      wch: 12 },
  { header: 'Min',            key: 'Min',            wch: 12 },
  { header: 'Max',            key: 'Max',            wch: 12 },
];

/**
 * Converts grouped product rows into the flat shape expected by the worksheet.
 * Time columns (Rata-rata, Min, Max) are stored as Excel time fractions
 * (minutes / 1440) so Excel can render them with a proper hh:mm:ss format.
 * @param {Array} data - Items produced by groupByProduct (all rows, not sliced)
 * @returns {Array<Object>}
 */
function buildRows(data) {
  return data.map((row, i) => ({
    'No':            i + 1,
    'Code Product':  row.codeProduct,
    'Nama Produk':   row.productName,
    'Planning (Kg)': row.kg ?? '',
    'Jumlah Batch':  row.count,
    // Store as numeric Excel time fraction so we can apply hh:mm format
    'Rata-rata':     row.avgMinutes / 1440,
    'Min':           row.minMinutes / 1440,
    'Max':           row.maxMinutes / 1440,
  }));
}

/**
 * Exports the product-compare aggregated data to an .xlsx file.
 * @param {Array}  data      - Full aggregated list from groupByProduct (no slice limit)
 * @param {Object} meta      - { yearStart, yearEnd, yearBoundsMin, yearBoundsMax, line }
 * @param {string} [sheetName='Sheet1'] - Name of the Excel sheet
 */
export function exportProductCompareToExcel(data, meta = {}, sheetName = 'Sheet1') {
  const rows = buildRows(data);

  // ── Header offset ──────────────────────────────────────────────────────────
  // Row 1 (r=0) → Main title
  // Row 2 (r=1) → Rentang Tahun
  // Row 3 (r=2) → Line
  // Row 4 (r=3) → Empty spacer
  // Row 5 (r=4) → Column headers  ← XLSX origin
  // Row 6+      → Data rows
  const HEADER_OFFSET = 4;

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: COLUMNS.map(c => c.key),
    origin: HEADER_OFFSET, // push column-header + data rows down
  });

  // ── Resolve display strings ──────────────────────────────────────────────
  const yearStart = meta.yearStart || meta.yearBoundsMin || '–';
  const yearEnd   = meta.yearEnd   || meta.yearBoundsMax || '–';
  const yearText  = (String(yearStart) === String(yearEnd))
    ? `Tahun: ${yearStart}`
    : `Rentang Tahun: ${yearStart} s/d ${yearEnd}`;
  const lineText  = meta.line ? `Line: ${meta.line}` : 'Line: Semua Line';

  // ── Write title cells manually ───────────────────────────────────────────
  worksheet['A1'] = {
    v: 'Laporan Perbandingan Rata-rata Drying Time per Produk',
    t: 's',
    s: {
      font:      { bold: true, sz: 14 },
      alignment: { horizontal: 'left', vertical: 'center' },
    },
  };
  worksheet['A2'] = {
    v: yearText,
    t: 's',
    s: {
      font:      { bold: true, sz: 11 },
      alignment: { horizontal: 'left', vertical: 'center' },
    },
  };
  worksheet['A3'] = {
    v: lineText,
    t: 's',
    s: {
      font:      { bold: true, sz: 11 },
      alignment: { horizontal: 'left', vertical: 'center' },
    },
  };
  // Row 4 (A4) intentionally left empty as a visual spacer

  // ── Bold column header row (row index = HEADER_OFFSET) ──────────────────
  COLUMNS.forEach((_, colIdx) => {
    const addr = XLSX.utils.encode_cell({ r: HEADER_OFFSET, c: colIdx });
    if (worksheet[addr]) {
      worksheet[addr].s = {
        font:      { bold: true, sz: 11 },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }
  });

  // ── Extend worksheet ref range to include the new header rows ────────────
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  range.s.r = 0; // start from row index 0
  worksheet['!ref'] = XLSX.utils.encode_range(range);

  // ── Row heights ──────────────────────────────────────────────────────────
  worksheet['!rows'] = [
    { hpt: 24 }, // row 1 – main title (taller)
    { hpt: 18 }, // row 2 – year range
    { hpt: 18 }, // row 3 – line
    { hpt: 8  }, // row 4 – spacer
    { hpt: 18 }, // row 5 – column headers
  ];

  // ── Column widths ────────────────────────────────────────────────────────
  worksheet['!cols'] = COLUMNS.map(c => ({ wch: c.wch }));

  // ── Apply hh:mm number format to time columns ────────────────────────────
  // Data rows start at Excel row index HEADER_OFFSET+1 (after column header row)
  const TIME_COL_INDICES = [5, 6, 7];
  for (let r = HEADER_OFFSET + 1; r <= HEADER_OFFSET + rows.length; r++) {
    TIME_COL_INDICES.forEach(colIdx => {
      const addr = XLSX.utils.encode_cell({ r, c: colIdx });
      if (worksheet[addr]) {
        worksheet[addr].z = 'hh:mm';
      }
    });
  }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Filename: product-compare-YYYY-MM-DD.xlsx
  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `product-compare-${dateStamp}.xlsx`);
}

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
 * @param {Array} data - Full aggregated list from groupByProduct (no slice limit)
 * @param {string} [sheetName='Sheet1'] - Name of the Excel sheet
 */
export function exportProductCompareToExcel(data, sheetName = 'Sheet1') {
  const rows = buildRows(data);

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: COLUMNS.map(c => c.key),
  });

  // Apply column widths
  worksheet['!cols'] = COLUMNS.map(c => ({ wch: c.wch }));

  // Apply hh:mm number format to time columns (Rata-rata=col5, Min=col6, Max=col7)
  // Excel stores time as a fraction of a day; we set the display format via cell.z
  const TIME_COL_INDICES = [5, 6, 7];
  for (let r = 1; r <= rows.length; r++) {
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

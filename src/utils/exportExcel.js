import * as XLSX from 'xlsx';

/**
 * Columns definition for the Drying Time export.
 * Each entry maps a display header to the row field and its column width (wch).
 */
const COLUMNS = [
  { header: 'No',               key: 'No',               wch: 5  },
  { header: 'Tanggal',          key: 'Tanggal',          wch: 13 },
  { header: 'Batch No',         key: 'Batch No',         wch: 16 },
  { header: 'Product Name',     key: 'Product Name',     wch: 36 },
  { header: 'Planning (Kg)',    key: 'Planning (Kg)',    wch: 14 },
  { header: 'Sub Total Drying', key: 'Sub Total Drying', wch: 16 },
  { header: 'Tahun',            key: 'Tahun',            wch: 8  },
];

/**
 * Converts raw data rows into the flat object shape expected by the worksheet.
 * @param {Array} data - Sorted/filtered data rows from DataTable
 * @returns {Array<Object>} - Plain objects with Excel-friendly keys
 */
function buildRows(data) {
  return data.map((row, i) => ({
    'No':               i + 1,
    'Tanggal':          row.date,
    'Batch No':         row.batchNo,
    'Product Name':     row.productName,
    'Planning (Kg)':    row.planningKg,
    'Sub Total Drying': row.subTotalDrying,
    'Tahun':            row.year ?? '',
  }));
}

/**
 * Exports the given data array to an .xlsx file and triggers a browser download.
 * @param {Array} data - Rows to export (already sorted/filtered)
 * @param {string} [sheetName='Data Detail'] - Name of the Excel sheet
 */
export function exportToExcel(data, sheetName = 'Data Detail') {
  const rows = buildRows(data);

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: COLUMNS.map(c => c.key),
  });

  // Apply column widths
  worksheet['!cols'] = COLUMNS.map(c => ({ wch: c.wch }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Filename: drying-time-data-YYYY-MM-DD.xlsx
  const dateStamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `drying-time-data-${dateStamp}.xlsx`);
}

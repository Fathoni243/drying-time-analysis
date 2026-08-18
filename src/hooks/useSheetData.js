import { useState, useEffect, useCallback } from 'react';
import { timeToMinutes } from '../utils/timeUtils';

const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const API_KEY        = import.meta.env.VITE_GOOGLE_API_KEY;
const SHEET_NAME     = import.meta.env.VITE_SHEET_NAME || 'Sheet1';

// ── Source column toggle ────────────────────────────────────────────────────
//
// Ganti nilai di bawah untuk berpindah kolom sumber drying time:
//   'sub total drying'       → kolom "Sub Total Drying" (plain)
//   'sub total drying final' → kolom "Sub Total Drying Final"
//
const DRYING_COLUMN_SOURCE = 'sub total drying';

// ── Column detection helpers ────────────────────────────────────────────────

/**
 * Find the first column index whose lowercased header includes any of the given keywords.
 * @param {string[]} headers - Lowercased header array
 * @param {string[]} keywords - Keywords to match (checked in order)
 * @returns {number} Column index, or -1 if not found
 */
function findCol(headers, keywords) {
  for (const kw of keywords) {
    const i = headers.findIndex(h => h.includes(kw));
    if (i !== -1) return i;
  }
  return -1;
}

/**
 * Safely get a trimmed string value from a row at the given index.
 * Returns '' if index is -1 or the cell is undefined.
 */
function cell(row, idx) {
  return idx !== -1 ? (row[idx]?.toString().trim() ?? '') : '';
}

// ── Data shape (JSDoc) ──────────────────────────────────────────────────────
/**
 * @typedef {Object} DryingRow
 * @property {string}      date                - e.g. "02/01/2021"
 * @property {string}      batchNo             - e.g. "A21010200001"
 * @property {string}      codeProduct         - e.g. "9059783"
 * @property {string}      productName         - e.g. "Brown Sugar EF100"
 * @property {number}      planningKg          - e.g. 400
 * @property {string}      subTotalDryingFinal - "HH:MM" — the main drying time value (source: DRYING_COLUMN_SOURCE)
 * @property {number}      dryingMinutes       - Converted minutes from subTotalDryingFinal
 * @property {number|null} year                - e.g. 2021
 * @property {string}      variantName         - e.g. "Brown Sugar EF100 (400 kg)"
 */

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Custom hook: fetch and parse drying-time data from Google Sheets API v4.
 *
 * Columns fetched: A:L
 * Active source  : controlled by DRYING_COLUMN_SOURCE constant above
 *
 * @returns {{ data: DryingRow[], loading: boolean, error: string|null, refetch: Function, lastFetched: Date|null }}
 */
export function useSheetData() {
  const [data, setData]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch up to column L — covers both "Sub Total Drying" and "Sub Total Drying Final"
      const range = encodeURIComponent(`${SHEET_NAME}!A:L`);
      const url   = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;

      const response = await fetch(url);
      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody?.error?.message || `HTTP ${response.status}`);
      }

      const json = await response.json();
      const rows = json.values ?? [];

      if (rows.length < 2) {
        setData([]);
        return;
      }

      // ── Map headers to column indices ──────────────────────────────────────
      const headers = rows[0].map(h => h?.toString().trim().toLowerCase() ?? '');

      const idx = {
        date:                findCol(headers, ['date']),
        batchNo:             findCol(headers, ['batch no', 'batch']),
        codeProduct:         findCol(headers, ['code product', 'code']),
        productName:         findCol(headers, ['product name']),
        planningKg:          findCol(headers, ['planning']),
        year:                findCol(headers, ['year']),
        variantName:         findCol(headers, ['variant name', 'name+kg', 'namekg']),
        // Source column dipilih oleh konstanta DRYING_COLUMN_SOURCE di atas file ini.
        // Gunakan array jika ingin fallback: misalnya ['sub total drying final', 'sub total drying']
        subTotalDryingFinal: findCol(headers, [DRYING_COLUMN_SOURCE]),
      };

      // ── Parse data rows ────────────────────────────────────────────────────
      const parsed = rows.slice(1).map((row) => {
        const rawFinal    = cell(row, idx.subTotalDryingFinal);
        const rawPlanning = cell(row, idx.planningKg);
        const rawYear     = cell(row, idx.year);

        const planningKg    = parseFloat(rawPlanning.replace(/,/g, '')) || 0;
        const dryingMinutes = timeToMinutes(rawFinal);
        const year          = parseInt(rawYear, 10) || null;

        const productName = cell(row, idx.productName);
        const codeProduct = cell(row, idx.codeProduct);

        // Prefer "Variant Name" column; fall back to "Product (Kg)"
        const variantName = cell(row, idx.variantName) || `${productName} (${planningKg} kg)`;

        return {
          date:                cell(row, idx.date),
          batchNo:             cell(row, idx.batchNo),
          codeProduct,
          productName,
          planningKg,
          subTotalDryingFinal: rawFinal,
          dryingMinutes,
          year,
          variantName,
        };
      })
      // Drop rows without a batch number or a valid drying time
      .filter(r => r.batchNo && r.dryingMinutes > 0);

      setData(parsed);
      setLastFetched(new Date());

    } catch (err) {
      console.error('[useSheetData] fetch error:', err);
      setError(err.message || 'Gagal memuat data dari Google Sheets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, lastFetched };
}

import { useState, useEffect, useCallback } from 'react';

const API_KEY               = import.meta.env.VITE_GOOGLE_API_KEY;
const SPREADSHEET_ID        = import.meta.env.VITE_PRODUCTION_DELIVERY_SPREADSHEET_ID;
const PRODUCTION_SHEET_NAME = import.meta.env.VITE_PRODUCTION_SHEET_NAME || 'Sheet1';
const DELIVERY_SHEET_NAME   = import.meta.env.VITE_DELIVERY_SHEET_NAME || 'Sheet2';

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Find column index whose header matches or contains keyword (case-insensitive).
 * Exact match prioritized, then substring match.
 * @param {string[]} headers
 * @param {string[]} keywords
 * @returns {number}
 */
function findCol(headers, keywords) {
  // First pass: exact matches
  for (const kw of keywords) {
    const target = kw.toLowerCase().trim();
    const idx = headers.findIndex(h => h === target);
    if (idx !== -1) return idx;
  }
  // Second pass: substring includes
  for (const kw of keywords) {
    const target = kw.toLowerCase().trim();
    const idx = headers.findIndex(h => h.includes(target));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Safely get a trimmed string from row cell.
 */
function cell(row, idx) {
  return idx !== -1 ? (row[idx]?.toString().trim() ?? '') : '';
}

/**
 * Parse Indonesian/European numeric format (e.g. "1.117,96", "700,00", "748,68") or standard numbers.
 * @param {string|number} val
 * @returns {number}
 */
export function parseNumber(val) {
  if (val == null || val === '') return 0;
  if (typeof val === 'number') return val;
  const str = val.toString().trim();
  if (!str) return 0;

  // Handles "1.117,96" or "1,117.96"
  if (str.includes('.') && str.includes(',')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // European/Indonesian style: dot thousands, comma decimals
      return parseFloat(str.replace(/\./g, '').replace(',', '.')) || 0;
    }
    // US style: comma thousands, dot decimals
    return parseFloat(str.replace(/,/g, '')) || 0;
  }

  // Only comma: "748,68" -> 748.68
  if (str.includes(',')) {
    return parseFloat(str.replace(',', '.')) || 0;
  }

  return parseFloat(str) || 0;
}

// ── Types (JSDoc) ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} ProductionRow
 * @property {string}      tanggal         - e.g. "01/07/2019"
 * @property {string}      noBarang        - e.g. "14040101" / "14060109BB"
 * @property {string}      deskripsiBarang - e.g. "Jasa Makloon ALKALIZED COCOA POWDER"
 * @property {number}      ktsProduksi     - e.g. 1117.96 (parsed number)
 * @property {string}      ktsProduksiRaw  - e.g. "1.117,96" (original formatted string)
 * @property {string}      satuan          - e.g. "Kg"
 * @property {string}      nomorSeriBatch  - e.g. "111219A04"
 * @property {string}      month           - e.g. "Jan"
 * @property {number|null} year            - e.g. 2019
 * @property {string}      code            - e.g. "Coklat"
 * @property {string}      lineGv          - e.g. "GV LINE 1"
 */

/**
 * @typedef {Object} DeliveryRow
 * @property {string}      customer        - e.g. "GUNADI HARIYANTO"
 * @property {string}      tanggal         - e.g. "01/07/2019"
 * @property {string}      noRef           - e.g. "002/AVL/07/19"
 * @property {string}      keterangan      - e.g. "Delivery to GUNADI HARIYANTO"
 * @property {string}      noBarang        - e.g. "14040101" / "14060109BB"
 * @property {string}      deskripsiBarang - e.g. "Dipotassium Phospate"
 * @property {number}      ktsKeluar       - e.g. 748.68 (parsed number)
 * @property {string}      ktsKeluarRaw    - e.g. "748,68" (original formatted string)
 * @property {string}      nomorSeriBatch  - e.g. "111219A04"
 * @property {string}      month           - e.g. "Jan"
 * @property {number|null} year            - e.g. 2019
 * @property {string}      code            - e.g. "Coklat"
 * @property {string}      lineGv          - e.g. "GV LINE 1"
 */

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * Custom hook: fetch and parse Production & Delivery data from Google Sheets API v4.
 *
 * @returns {{
 *   productionData: ProductionRow[],
 *   deliveryData: DeliveryRow[],
 *   loading: boolean,
 *   error: string|null,
 *   refetch: Function,
 *   lastFetched: Date|null
 * }}
 */
export function useProductionDeliveryData() {
  const [productionData, setProductionData] = useState([]);
  const [deliveryData, setDeliveryData]     = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState(null);
  const [lastFetched, setLastFetched]       = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const prodRange = encodeURIComponent(`${PRODUCTION_SHEET_NAME}!A:Z`);
      const delRange  = encodeURIComponent(`${DELIVERY_SHEET_NAME}!A:Z`);

      const prodUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${prodRange}?key=${API_KEY}`;
      const delUrl  = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${delRange}?key=${API_KEY}`;

      const [prodRes, delRes] = await Promise.all([
        fetch(prodUrl),
        fetch(delUrl),
      ]);

      if (!prodRes.ok) {
        const errBody = await prodRes.json().catch(() => ({}));
        throw new Error(`Production Sheet: ${errBody?.error?.message || `HTTP ${prodRes.status}`}`);
      }
      if (!delRes.ok) {
        const errBody = await delRes.json().catch(() => ({}));
        throw new Error(`Delivery Sheet: ${errBody?.error?.message || `HTTP ${delRes.status}`}`);
      }

      const [prodJson, delJson] = await Promise.all([
        prodRes.json(),
        delRes.json(),
      ]);

      const prodRows = prodJson.values ?? [];
      const delRows  = delJson.values ?? [];

      // ── Parse Production ─────────────────────────────────────────────────
      let parsedProd = [];
      if (prodRows.length >= 2) {
        const headers = prodRows[0].map(h => h?.toString().trim().toLowerCase() ?? '');
        const idx = {
          tanggal:         findCol(headers, ['tanggal', 'date']),
          noBarang:        findCol(headers, ['no. barang', 'no barang']),
          deskripsiBarang: findCol(headers, ['deskripsi barang', 'deskripsi']),
          ktsProduksi:     findCol(headers, ['kts. produksi', 'kts produksi']),
          satuan:          findCol(headers, ['satuan']),
          nomorSeriBatch:  findCol(headers, ['nomor seri/batch', 'nomor seri', 'batch']),
          month:           findCol(headers, ['month']),
          year:            findCol(headers, ['year']),
          code:            findCol(headers, ['code']),
          lineGv:          findCol(headers, ['line gv', 'line']),
        };

        parsedProd = prodRows.slice(1)
          .filter(r => r && r.some(c => c !== undefined && c !== ''))
          .map((row) => {
            const rawKts  = cell(row, idx.ktsProduksi);
            const rawYear = cell(row, idx.year);
            return {
              tanggal:         cell(row, idx.tanggal),
              noBarang:        cell(row, idx.noBarang),
              deskripsiBarang: cell(row, idx.deskripsiBarang),
              ktsProduksi:     parseNumber(rawKts),
              ktsProduksiRaw:  rawKts,
              satuan:          cell(row, idx.satuan),
              nomorSeriBatch:  cell(row, idx.nomorSeriBatch),
              month:           cell(row, idx.month),
              year:            parseInt(rawYear, 10) || null,
              code:            cell(row, idx.code),
              lineGv:          cell(row, idx.lineGv),
            };
          });
      }

      // ── Parse Delivery ───────────────────────────────────────────────────
      let parsedDel = [];
      if (delRows.length >= 2) {
        const headers = delRows[0].map(h => h?.toString().trim().toLowerCase() ?? '');
        const idx = {
          customer:        findCol(headers, ['customer']),
          tanggal:         findCol(headers, ['tanggal', 'date']),
          noRef:           findCol(headers, ['no. ref', 'no ref', 'ref']),
          keterangan:      findCol(headers, ['keterangan']),
          noBarang:        findCol(headers, ['no. barang', 'no barang']),
          deskripsiBarang: findCol(headers, ['deskripsi barang', 'deskripsi']),
          ktsKeluar:       findCol(headers, ['kts. keluar', 'kts keluar']),
          nomorSeriBatch:  findCol(headers, ['nomor seri/batch', 'nomor seri', 'batch']),
          month:           findCol(headers, ['month']),
          year:            findCol(headers, ['year']),
          code:            findCol(headers, ['code']),
          lineGv:          findCol(headers, ['line gv', 'line']),
        };

        parsedDel = delRows.slice(1)
          .filter(r => r && r.some(c => c !== undefined && c !== ''))
          .map((row) => {
            const rawKts  = cell(row, idx.ktsKeluar);
            const rawYear = cell(row, idx.year);
            return {
              customer:        cell(row, idx.customer),
              tanggal:         cell(row, idx.tanggal),
              noRef:           cell(row, idx.noRef),
              keterangan:      cell(row, idx.keterangan),
              noBarang:        cell(row, idx.noBarang),
              deskripsiBarang: cell(row, idx.deskripsiBarang),
              ktsKeluar:       parseNumber(rawKts),
              ktsKeluarRaw:    rawKts,
              nomorSeriBatch:  cell(row, idx.nomorSeriBatch),
              month:           cell(row, idx.month),
              year:            parseInt(rawYear, 10) || null,
              code:            cell(row, idx.code),
              lineGv:          cell(row, idx.lineGv),
            };
          });
      }

      setProductionData(parsedProd);
      setDeliveryData(parsedDel);
      setLastFetched(new Date());

      console.log('Parsed Production:', parsedProd[0]);
      console.log('Parsed Delivery:', parsedDel[0]);

    } catch (err) {
      console.error('[useProductionDeliveryData] fetch error:', err);
      setError(err.message || 'Gagal memuat data Production & Delivery dari Google Sheets');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    productionData,
    deliveryData,
    loading,
    error,
    refetch: fetchData,
    lastFetched,
  };
}


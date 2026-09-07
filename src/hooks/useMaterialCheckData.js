import { useState, useCallback } from 'react';

// ── Env vars ─────────────────────────────────────────────────────────────────

const API_KEY         = import.meta.env.VITE_GOOGLE_API_KEY;
const SPREADSHEET_ID  = import.meta.env.VITE_MATERIAL_SPREADSHEET_ID;
const STOCK_SHEET     = import.meta.env.VITE_STOCK_SHEET_NAME     || 'wh-stock';
const INCOMING_SHEET  = import.meta.env.VITE_INCOMING_SHEET_NAME  || 'incoming';
const MATERIAL_SHEET  = import.meta.env.VITE_MATERIAL_SHEET_NAME  || 'prebatch-material';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Parse angka format Indonesia/Eropa (titik = ribuan, koma = desimal).
 * Contoh: "2.230,00" → 2230, "19,06" → 19.06, "-" → 0
 * @param {string|number|null|undefined} val
 * @returns {number}
 */
export function parseIDNumber(val) {
  if (val === null || val === undefined || val === '-' || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = val
    .toString()
    .trim()
    .replace(/\./g, '')   // hapus pemisah ribuan
    .replace(',', '.');   // koma jadi titik desimal
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/**
 * Normalisasi kode bahan ke string uppercase trimmed.
 * Menangani campur tipe number/string (76001, "76001", "76001.0", "PACK007226").
 * @param {string|number|null|undefined} val
 * @returns {string}
 */
export function normalizeCode(val) {
  if (val === null || val === undefined) return '';
  let s = val.toString().trim().toUpperCase();
  // Hilangkan trailing .0 jika ada (mis "76001.0" → "76001")
  s = s.replace(/\.0$/, '');
  return s;
}

// ── Google Sheets fetcher ────────────────────────────────────────────────────

/**
 * Fetch satu range dari Google Sheets API v4.
 * @param {string} sheetName
 * @param {string} range  misal "A:L"
 * @returns {Promise<string[][]>} rows (array of arrays of strings)
 */
async function fetchSheet(sheetName, range) {
  const encodedRange = encodeURIComponent(`'${sheetName}'!${range}`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${encodedRange}?key=${API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Gagal fetch sheet "${sheetName}": ${resp.status} ${resp.statusText} — ${text}`);
  }
  const data = await resp.json();
  return data.values || [];
}

// ── Precomputers ─────────────────────────────────────────────────────────────

/**
 * Build StockMap dari sheet wh-stock.
 * Kolom: A=No, B=Code, C=Material Name, D=Group, E=UoM, F-H=Batch/Qty/Exp(WH),
 *        I-K=Batch/Qty/Exp(Prod), L=Total
 *
 * Aturan: satu material bisa multi-baris (batch). Total hanya di baris pertama
 * yang punya Code (kolom B) terisi. Baris kosong diabaikan.
 *
 * @param {string[][]} rows
 * @returns {Record<string, number>} kodeBahan → totalStok
 */
function buildStockMap(rows) {
  const map = {};
  // Skip header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const code = normalizeCode(row[1]); // kolom B (index 1)
    if (!code) continue; // baris lanjutan atau kosong
    const total = parseIDNumber(row[11]); // kolom L (index 11)
    map[code] = total;
  }
  return map;
}

/**
 * Build IncomingMap dari sheet incoming.
 * Kolom: A=RM# (Kode Bahan), B=Material Description, C=Shipped Qty (KG)
 * Satu kode bisa muncul lebih dari sekali → jumlahkan.
 *
 * @param {string[][]} rows
 * @returns {Record<string, number>} kodeBahan → totalQtyKedatangan
 */
function buildIncomingMap(rows) {
  const map = {};
  // Skip header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const code = normalizeCode(row[0]); // kolom A (index 0)
    if (!code) continue;
    const qty = parseIDNumber(row[2]); // kolom C (index 2)
    map[code] = (map[code] ?? 0) + qty;
  }
  return map;
}

/**
 * Build ProductFormulaMap dari sheet prebatch-material.
 * Kolom: A=Kode Produk, B=Nama Produk, C=QTY Produk (ignored),
 *        D=Kode Bahan, E=Nama Bahan, F=Qty Bahan (per kg), G=Satuan
 * Satu Kode Produk punya banyak baris (satu baris = satu bahan).
 *
 * @param {string[][]} rows
 * @returns {Record<string, {kodeProduk: string, namaProduk: string, bahan: Array}>}
 */
function buildProductFormulaMap(rows) {
  const map = {};
  let lastKodeProduk = '';
  let lastNamaProduk = '';

  // Skip header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Kode Produk di kolom A (index 0) — bisa kosong untuk baris lanjutan
    const rawKode = row[0]?.toString().trim() ?? '';
    if (rawKode) {
      lastKodeProduk = rawKode.toUpperCase();
      lastNamaProduk = row[1]?.toString().trim() ?? '';
    }

    if (!lastKodeProduk) continue;

    const kodeBahan = normalizeCode(row[3]); // kolom D
    if (!kodeBahan) continue;

    const namaBahan   = row[4]?.toString().trim() ?? '';
    const qtyPerKg    = parseIDNumber(row[5]); // kolom F
    const uom         = row[6]?.toString().trim() ?? '';

    if (!map[lastKodeProduk]) {
      map[lastKodeProduk] = {
        kodeProduk: lastKodeProduk,
        namaProduk: lastNamaProduk,
        bahan: [],
      };
    }

    map[lastKodeProduk].bahan.push({ kodeBahan, namaBahan, qtyPerKg, uom });
  }

  return map;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook untuk fetch & precompute data material dari Google Sheets.
 *
 * @returns {{
 *   stockMap: Record<string, number>,
 *   incomingMap: Record<string, number>,
 *   productFormulaMap: Record<string, object>,
 *   loading: boolean,
 *   error: string|null,
 *   lastFetched: Date|null,
 *   refetch: () => void,
 * }}
 */
export function useMaterialCheckData() {
  const [stockMap, setStockMap]                   = useState({});
  const [incomingMap, setIncomingMap]             = useState({});
  const [productFormulaMap, setProductFormulaMap] = useState({});
  const [loading, setLoading]                     = useState(false);
  const [error, setError]                         = useState(null);
  const [lastFetched, setLastFetched]             = useState(null);
  const [hasFetched, setHasFetched]               = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stockRows, incomingRows, materialRows] = await Promise.all([
        fetchSheet(STOCK_SHEET,    'A:L'),
        fetchSheet(INCOMING_SHEET, 'A:C'),
        fetchSheet(MATERIAL_SHEET, 'A:G'),
      ]);

      setStockMap(buildStockMap(stockRows));
      setIncomingMap(buildIncomingMap(incomingRows));
      setProductFormulaMap(buildProductFormulaMap(materialRows));
      setLastFetched(new Date());
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat mengambil data.');
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, []);

  // Auto-fetch on first call (lazy: panggil fetchAll saat pertama dibutuhkan)
  const triggerFetch = useCallback(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    stockMap,
    incomingMap,
    productFormulaMap,
    loading,
    error,
    lastFetched,
    hasFetched,
    refetch: triggerFetch,
    fetchAll: triggerFetch,
  };
}

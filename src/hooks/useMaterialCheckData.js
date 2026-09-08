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

/**
 * Cari index kolom berdasarkan nama header (case-insensitive).
 * Prioritas: exact match dulu, lalu substring match.
 * @param {string[]} headers  - Header row yang sudah di-lowercase & trim
 * @param {string[]} keywords - Daftar keyword yang dicari (urutan = prioritas)
 * @returns {number}          - Index kolom, atau -1 jika tidak ditemukan
 */
function findCol(headers, keywords) {
  // Pass 1: exact match
  for (const kw of keywords) {
    const target = kw.toLowerCase().trim();
    const idx = headers.findIndex(h => h === target);
    if (idx !== -1) return idx;
  }
  // Pass 2: substring includes
  for (const kw of keywords) {
    const target = kw.toLowerCase().trim();
    const idx = headers.findIndex(h => h.includes(target));
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Ambil nilai cell sebagai string trimmed. Aman jika idx = -1 atau row pendek.
 * @param {string[]} row
 * @param {number}   idx
 * @returns {string}
 */
function cell(row, idx) {
  return idx !== -1 ? (row[idx]?.toString().trim() ?? '') : '';
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
 * Header yang dicari: "code" (kode bahan) dan "total" (total stok).
 *
 * Aturan: satu material bisa multi-baris (batch). Total hanya di baris pertama
 * yang punya Code terisi. Baris lanjutan (Code kosong) diabaikan.
 *
 * @param {string[][]} rows
 * @returns {Record<string, number>} kodeBahan → totalStok
 */
function buildStockMap(rows) {
  if (rows.length < 2) return {};

  // headers ada di baris 2 (index 1)
  const headers = rows[1].map(h => h?.toString().trim().toLowerCase() ?? '');
  const idx = {
    code:  findCol(headers, ['code']),
    total: findCol(headers, ['total']),
  };

  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const code = normalizeCode(cell(row, idx.code));
    if (!code) continue; // baris lanjutan atau kosong
    map[code] = parseIDNumber(cell(row, idx.total));
  }
  return map;
}

/**
 * Build IncomingMap dari sheet incoming.
 * Header yang dicari: "rm#" / "code" (kode bahan) dan "shipped qty" (qty kedatangan).
 * Satu kode bisa muncul lebih dari sekali → dijumlahkan.
 *
 * @param {string[][]} rows
 * @returns {Record<string, number>} kodeBahan → totalQtyKedatangan
 */
function buildIncomingMap(rows) {
  if (rows.length < 2) return {};

  const headers = rows[0].map(h => h?.toString().trim().toLowerCase() ?? '');
  const idx = {
    code: findCol(headers, ['rm#', 'rm #', 'kode bahan', 'code']),
    qty:  findCol(headers, ['shipped qty', 'qty', 'quantity']),
  };

  const map = {};
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const code = normalizeCode(cell(row, idx.code));
    if (!code) continue;
    map[code] = (map[code] ?? 0) + parseIDNumber(cell(row, idx.qty));
  }
  return map;
}

/**
 * Build ProductFormulaMap dari sheet prebatch-material.
 * Header yang dicari: kode produk, nama produk, kode bahan, nama bahan,
 *                     qty bahan (per kg), satuan.
 *
 * Satu Kode Produk punya banyak baris (satu baris = satu bahan).
 * Kolom Kode Produk bisa kosong pada baris lanjutan (carry-forward).
 *
 * @param {string[][]} rows
 * @returns {Record<string, {kodeProduk: string, namaProduk: string, bahan: Array}>}
 */
function buildProductFormulaMap(rows) {
  if (rows.length < 2) return {};

  const headers = rows[0].map(h => h?.toString().trim().toLowerCase() ?? '');
  const idx = {
    kodeProduk: findCol(headers, ['kode produk', 'product code', 'kode']),
    namaProduk: findCol(headers, ['nama produk', 'product name', 'nama']),
    kodeBahan:  findCol(headers, ['kode bahan', 'material code', 'rm#', 'rm #']),
    namaBahan:  findCol(headers, ['nama bahan', 'material name', 'material description']),
    qtyPerKg:   findCol(headers, ['qty bahan', 'qty per kg', 'qty']),
    uom:        findCol(headers, ['satuan', 'uom', 'unit']),
  };

  const map = {};
  let lastKodeProduk = '';
  let lastNamaProduk = '';

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];

    // Kode Produk bisa kosong pada baris lanjutan (carry-forward ke baris berikutnya)
    const rawKode = cell(row, idx.kodeProduk);
    if (rawKode) {
      lastKodeProduk = rawKode.toUpperCase();
      lastNamaProduk = cell(row, idx.namaProduk);
    }

    if (!lastKodeProduk) continue;

    const kodeBahan = normalizeCode(cell(row, idx.kodeBahan));
    if (!kodeBahan) continue;

    if (!map[lastKodeProduk]) {
      map[lastKodeProduk] = {
        kodeProduk: lastKodeProduk,
        namaProduk: lastNamaProduk,
        bahan: [],
      };
    }

    map[lastKodeProduk].bahan.push({
      kodeBahan,
      namaBahan: cell(row, idx.namaBahan),
      qtyPerKg:  parseIDNumber(cell(row, idx.qtyPerKg)),
      uom:       cell(row, idx.uom),
    });
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
        fetchSheet(STOCK_SHEET,    'A:Z'),
        fetchSheet(INCOMING_SHEET, 'A:Z'),
        fetchSheet(MATERIAL_SHEET, 'A:Z'),
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

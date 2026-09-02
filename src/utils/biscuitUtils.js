/**
 * Parse tanggal format DD/MM/YYYY → Date object.
 * Returns null jika format tidak valid.
 */
export function parseDDMMYYYY(str) {
  if (!str) return null;
  const parts = str.trim().split('/');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
  if (isNaN(date.getTime())) return null;
  return date;
}

/**
 * Parse tanggal DD/MM/YYYY → "YYYY-MM" string.
 * Returns '' jika tidak valid.
 */
export function toYearMonth(str) {
  const date = parseDDMMYYYY(str);
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Bandingkan "YYYY-MM" string: apakah ym termasuk dalam [start, end] (inklusif).
 * Jika start/end kosong, sisi tersebut dianggap terbuka.
 */
export function isInMonthRange(ym, start, end) {
  if (!ym) return false;
  if (start && ym < start) return false;
  if (end && ym > end) return false;
  return true;
}

/**
 * Format angka sebagai string Kg (ribuan dengan titik, 1 desimal jika ada).
 * e.g. 1117960.5 → "1.117.960,5 Kg"
 */
export function formatKg(val, decimals = 1) {
  if (!val && val !== 0) return '—';
  const num = Number(val);
  return num.toLocaleString('id-ID', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }) + ' Kg';
}

/**
 * Format angka bulat dengan pemisah ribuan.
 */
export function formatNumber(val) {
  if (!val && val !== 0) return '—';
  return Number(val).toLocaleString('id-ID');
}

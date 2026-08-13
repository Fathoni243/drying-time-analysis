import { useState, useEffect, useCallback } from 'react';
import { timeToMinutes } from '../utils/timeUtils';

const SPREADSHEET_ID = import.meta.env.VITE_SPREADSHEET_ID;
const API_KEY        = import.meta.env.VITE_GOOGLE_API_KEY;
const SHEET_NAME     = import.meta.env.VITE_SHEET_NAME || 'Sheet1';

/**
 * Custom hook that fetches and parses data from Google Sheets.
 * Returns: { data, loading, error, refetch }
 *
 * Each row in `data` is an object:
 * {
 *   date: string,
 *   batchNo: string,
 *   productName: string,
 *   planningKg: number,
 *   subTotalDrying: string,   // "HH:MM"
 *   dryingMinutes: number,    // converted
 *   year: number,
 *   nameKg: string,           // e.g. "Brown Sugar EF100 (400 kg)"
 * }
 */
export function useSheetData() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const range = encodeURIComponent(`${SHEET_NAME}!A:G`);
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
      const response = await fetch(url);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error?.message || `HTTP ${response.status}`);
      }

      const json = await response.json();
      const rows = json.values || [];

      if (rows.length < 2) {
        setData([]);
        return;
      }

      // Determine header mapping dynamically
      const headerRow = rows[0].map(h => h?.toString().trim().toLowerCase());
      const getIdx = (keywords) => {
        for (const kw of keywords) {
          const idx = headerRow.findIndex(h => h.includes(kw));
          if (idx !== -1) return idx;
        }
        return -1;
      };

      const dateIdx = getIdx(['date']);
      const batchIdx = getIdx(['batch']);
      const productIdx = getIdx(['product']);
      const planningIdx = getIdx(['planning']);
      const dryingIdx = getIdx(['sub total', 'drying']);
      const yearIdx = getIdx(['year']);
      const nameKgIdx = getIdx(['name+kg', 'namekg', 'name+']);

      const parsed = rows.slice(1).map((row) => {
        const rawPlanning = row[planningIdx] || '0';
        const rawDrying = row[dryingIdx] || '00:00';
        const rawYear = row[yearIdx] || '';
        const planningKg = parseFloat(rawPlanning.toString().replace(/,/g, '')) || 0;
        const dryingMinutes = timeToMinutes(rawDrying.toString().trim());
        const yearNum = parseInt(rawYear.toString().trim(), 10) || null;

        // Derive nameKg if column missing
        const productName = row[productIdx] || '';
        const nameKg = nameKgIdx !== -1 && row[nameKgIdx]
          ? row[nameKgIdx]
          : `${productName} (${planningKg} kg)`;

        return {
          date: row[dateIdx] || '',
          batchNo: row[batchIdx] || '',
          productName,
          planningKg,
          subTotalDrying: rawDrying.toString().trim(),
          dryingMinutes,
          year: yearNum,
          nameKg,
        };
      }).filter(r => r.batchNo && r.productName && r.dryingMinutes > 0);

      setData(parsed);
      setLastFetched(new Date());
    } catch (err) {
      console.error('Sheet fetch error:', err);
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

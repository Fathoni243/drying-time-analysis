import { useState, useMemo } from 'react';
import {
  ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronRight, TableProperties, FileDown
} from 'lucide-react';
import { exportDataDetailToExcel } from '../utils/excel/exportDataDetail';

const PAGE_SIZE = 15;

// ── Helpers ──────────────────────────────────────────────────────────────────

function SortIcon({ column, sortKey, sortDir }) {
  if (sortKey !== column) return <ChevronsUpDown className="w-3 h-3 text-slate-600" />;
  return sortDir === 'asc'
    ? <ChevronUp   className="w-3 h-3 text-amber-400" />
    : <ChevronDown className="w-3 h-3 text-amber-400" />;
}


// ── Column definitions ────────────────────────A2606170389────────────────────────────────

const COLUMNS = [
  { key: 'date',                label: 'Tanggal',      numeric: false },
  { key: 'batchNo',             label: 'Batch No',     numeric: false },
  { key: 'codeProduct',         label: 'Code Product', numeric: false },
  { key: 'productName',         label: 'Produk',       numeric: false },
  { key: 'planningKg',          label: 'Planning (Kg)',numeric: true  },
  { key: 'line',                label: 'Line',         numeric: false },
  { key: 'dryingMinutes',       label: 'Drying Time',  numeric: true  },
  { key: 'year',                label: 'Tahun',        numeric: false },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function DataTable({ filteredData }) {
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage]       = useState(1);
  const [exporting, setExporting] = useState(false);

  const handleSort = (key) => {
    setSortDir(prev => (sortKey === key ? (prev === 'asc' ? 'desc' : 'asc') : 'asc'));
    setSortKey(key);
    setPage(1);
  };

  const sorted = useMemo(() => {
    const col = COLUMNS.find(c => c.key === sortKey);
    return [...filteredData].sort((a, b) => {
      const va = col?.numeric ? Number(a[sortKey]) : String(a[sortKey] ?? '').toLowerCase();
      const vb = col?.numeric ? Number(b[sortKey]) : String(b[sortKey] ?? '').toLowerCase();
      if (col?.numeric) return sortDir === 'asc' ? va - vb : vb - va;
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [filteredData, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged      = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleExport = async () => {
    if (exporting || !sorted.length) return;
    setExporting(true);
    await new Promise(r => setTimeout(r, 300));
    exportDataDetailToExcel(sorted);
    setExporting(false);
  };

  // ── Shared class strings ─────────────────────────────────────────────────
  const thBase = `
    px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider
    cursor-pointer select-none hover:text-amber-400 transition-colors duration-200
  `;
  const td = "px-4 py-3 text-sm text-slate-300 whitespace-nowrap";

  return (
    <div className="glass-card mb-6 overflow-hidden fade-in-up">

      {/* ── Header bar ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05] flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <TableProperties className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-slate-200">Data Detail</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-400 text-xs">
            {filteredData.length} baris
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Export button */}
          <button
            id="btn-export-excel"
            onClick={handleExport}
            disabled={exporting || !sorted.length}
            title={!sorted.length ? 'Tidak ada data' : `Export ${sorted.length} baris ke Excel`}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border
              transition-all duration-200
              ${!sorted.length
                ? 'bg-slate-700/30 border-slate-600/30 text-slate-600 cursor-not-allowed'
                : exporting
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 cursor-wait'
                  : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/50'}
            `}
          >
            <FileDown className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
            {exporting ? 'Mengekspor…' : `Export Excel (${sorted.length})`}
          </button>

          {/* Pagination */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Page {page} / {totalPages || 1}</span>
            <button
              id="btn-table-prev"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg hover:bg-amber-500/10 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              id="btn-table-next"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-lg hover:bg-amber-500/10 hover:text-amber-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Export context note */}
      {sorted.length > 0 && (
        <div className="px-6 py-2 bg-emerald-500/5 border-b border-emerald-500/10">
          <p className="text-xs text-slate-500">
            💡 Export mengunduh{' '}
            <span className="text-emerald-400 font-medium">{sorted.length} baris</span>{' '}
            sesuai filter aktif
          </p>
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.05] bg-[#0d1528]/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider w-10">
                No
              </th>
              {COLUMNS.map(col => (
                <th key={col.key} className={thBase} onClick={() => handleSort(col.key)}>
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon column={col.key} sortKey={sortKey} sortDir={sortDir} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length + 1} className="px-4 py-12 text-center text-slate-500 text-sm">
                  Tidak ada data yang sesuai filter.
                </td>
              </tr>
            ) : (
              paged.map((row, i) => (
                <tr
                  key={`${row.batchNo}-${i}`}
                  className="border-b border-white/[0.03] table-row-hover transition-colors duration-150"
                >
                  <td className="px-4 py-3 text-xs text-slate-600 text-center">
                    {(page - 1) * PAGE_SIZE + i + 1}
                  </td>
                  <td className={td + " text-slate-400"}>{row.date}</td>
                  <td className={td}>
                    <span className="font-mono text-xs text-amber-300/80">{row.batchNo}</span>
                  </td>
                  <td className={td}>
                    <span className="font-mono text-xs text-sky-400/90">{row.codeProduct || '—'}</span>
                  </td>
                  <td className={td}>
                    <span className="max-w-[200px] block truncate" title={row.productName}>
                      {row.productName}
                    </span>
                  </td>
                  <td className={td + " text-center"}>
                    <span className="px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 text-xs">
                      {row.planningKg} kg
                    </span>
                  </td>
                  <td className={td + " text-center"}>
                    {row.line ? (
                      <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 text-xs border border-violet-500/25">
                        {row.line}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className={td}>
                    <span className="font-semibold text-amber-400">{row.subTotalDryingFinal}</span>
                  </td>
                  <td className={td + " text-slate-500"}>{row.year || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

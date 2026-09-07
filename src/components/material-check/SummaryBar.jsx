import { PackageCheck, CheckCircle2, AlertTriangle, RotateCcw } from 'lucide-react';
import { summarizeAll } from '../../utils/materialCheckUtils';

// ── GlobalSummary ─────────────────────────────────────────────────────────────

/**
 * Bar ringkasan global: jumlah produk dicek & jumlah bahan berstatus KURANG.
 * @param {{ entries: Array }} props
 */
export function GlobalSummary({ entries }) {
  const { totalProduk, totalBahanKurang } = summarizeAll(entries);

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/40 border border-white/[0.06] text-sm">
      <PackageCheck className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="text-slate-400">
        <span className="text-white font-medium">{totalProduk}</span> produk dicek
      </span>
      <span className="text-slate-700">•</span>
      {totalBahanKurang === 0 ? (
        <span className="text-emerald-400 font-medium flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Semua stok mencukupi
        </span>
      ) : (
        <span className="text-red-400 font-medium flex items-center gap-1">
          <AlertTriangle className="w-3.5 h-3.5" />
          {totalBahanKurang} bahan berstatus Kurang Stok
        </span>
      )}
    </div>
  );
}

// ── SummaryBar ─────────────────────────────────────────────────────────────────

/**
 * Bar yang menggabungkan GlobalSummary + tombol Kosongkan Daftar.
 * @param {{ entries: Array, onClearAll: () => void }} props
 */
export function SummaryBar({ entries, onClearAll }) {
  return (
    <div className="flex items-center justify-between gap-3 flex-wrap">
      <GlobalSummary entries={entries} />
      <button
        id="btn-kosongkan-daftar"
        onClick={onClearAll}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-red-400/70 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 text-xs transition-all"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Kosongkan Daftar
      </button>
    </div>
  );
}

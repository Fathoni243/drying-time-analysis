import { useState } from 'react';
import {
  AlertTriangle, Trash2, CheckCircle2, XCircle,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { summarizeEntry } from '../../utils/materialCheckUtils';
import { formatIDNumber } from '../../utils/materialCheckUtils';

// ── Helper ────────────────────────────────────────────────────────────────────

function formatDate(isoDate) {
  if (!isoDate) return '-';
  const [, m, d] = isoDate.split('-');
  const [y] = isoDate.split('-');
  return `${d}/${m}/${y}`;
}

// ── MetaChip ──────────────────────────────────────────────────────────────────

function MetaChip({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
      <span className="text-slate-600">{label}:</span>
      <span className="text-slate-400">{value}</span>
    </span>
  );
}

// ── StatusBadge (bahan) ───────────────────────────────────────────────────────

function StatusBadge({ status }) {
  if (status === 'OK') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" />
        OK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
      <XCircle className="w-3 h-3" />
      KURANG
    </span>
  );
}

// ── EntryCard ─────────────────────────────────────────────────────────────────

/**
 * Card satu entry produksi beserta tabel hasil pengecekan bahan.
 *
 * @param {{ entry: object, index: number, onDelete: (id:string)=>void }} props
 */
export default function EntryCard({ entry, index, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const { allOk, kurangCount } = summarizeEntry(entry.hasil);

  return (
    <div
      className="glass-card overflow-hidden fade-in-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* ── Card Header ── */}
      <div
        className={`
          flex items-start gap-3 px-5 py-4
          border-b border-white/[0.06]
          ${!allOk ? 'bg-red-950/20' : 'bg-white/[0.01]'}
        `}
      >
        {/* Nomor urut */}
        <div className="w-7 h-7 rounded-full bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-xs font-bold text-amber-400">{index + 1}</span>
        </div>

        {/* Title & meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-white truncate">{entry.namaProduk || '-'}</h3>
            <span className="text-xs text-slate-500 shrink-0">{entry.kodeProduk}</span>
          </div>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5">
            <MetaChip label="Tanggal" value={formatDate(entry.tanggalProduksi)} />
            <MetaChip label="Qty Plan" value={`${formatIDNumber(entry.qtyPlanKg, 0)} kg`} />
            <MetaChip label="Batch"   value={entry.jumlahBatch || '-'} />
            <MetaChip label="Line"    value={entry.line || '-'} />
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0 mt-0.5">
          {/* Status badge keseluruhan */}
          {allOk ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Stok Mencukupi
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
              <AlertTriangle className="w-3.5 h-3.5" />
              {kurangCount} Bahan Kurang
            </span>
          )}

          {/* Expand toggle */}
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-all"
            aria-label={expanded ? 'Lipat' : 'Buka'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Hapus */}
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            aria-label="Hapus entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Tabel bahan ── */}
      {expanded && (
        <div className="overflow-x-auto">
          {entry.hasil && entry.hasil.length > 0 ? (
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wide">
                  <th className="px-4 py-3 text-left font-semibold">Nama Bahan</th>
                  <th className="px-4 py-3 text-left font-semibold">Kode Bahan</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty Produksi</th>
                  <th className="px-4 py-3 text-right font-semibold">Qty Datang</th>
                  <th className="px-4 py-3 text-right font-semibold">Stok Awal</th>
                  <th className="px-4 py-3 text-left font-semibold">UoM</th>
                  <th className="px-4 py-3 text-right font-semibold">Sisa Stok</th>
                  <th className="px-4 py-3 text-center font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {entry.hasil.map((bahan, i) => (
                  <tr
                    key={`${bahan.kodeBahan}-${i}`}
                    className={`
                      border-t border-white/[0.04] transition-colors
                      ${bahan.status === 'KURANG'
                        ? 'bg-red-950/25 hover:bg-red-950/35'
                        : 'hover:bg-white/[0.025]'}
                    `}
                  >
                    <td className="px-4 py-2.5 text-slate-200">{bahan.namaBahan || '-'}</td>
                    <td className="px-4 py-2.5 text-slate-400 font-mono text-xs">{bahan.kodeBahan}</td>
                    <td className="px-4 py-2.5 text-right text-slate-200 tabular-nums">
                      {formatIDNumber(bahan.qtyBahanProduksi)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-200 tabular-nums">
                      {formatIDNumber(bahan.qtyKedatangan)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-200 tabular-nums">
                      {formatIDNumber(bahan.stokAwal)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-400 text-xs">{bahan.uom || '-'}</td>
                    <td className={`px-4 py-2.5 text-right font-semibold tabular-nums ${bahan.sisaStok < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {formatIDNumber(bahan.sisaStok)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <StatusBadge status={bahan.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-5 py-6 text-center text-slate-500 text-sm">
              Tidak ada data bahan untuk produk ini.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

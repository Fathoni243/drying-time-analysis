import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { BarChart2 } from 'lucide-react';

// ── Colors ───────────────────────────────────────────────────────────────────

const COLOR_PRODUKSI = '#f59e0b';  // amber/cocoa
const COLOR_DELIVERY = '#0d9488';  // teal

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const produksi = payload.find(p => p.dataKey === 'produksi')?.value ?? 0;
  const delivery = payload.find(p => p.dataKey === 'delivery')?.value ?? 0;
  const gap = produksi - delivery;
  const fmt = (v) => v.toLocaleString('id-ID', { maximumFractionDigits: 1 });

  return (
    <div className="glass-card border border-teal-500/25 px-4 py-3 shadow-2xl shadow-black/50 min-w-[220px] pointer-events-none">
      <p className="text-sm font-bold text-slate-200 mb-2">{label}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_PRODUKSI }} />
            Produksi
          </span>
          <span className="font-bold text-amber-300">{fmt(produksi)} Kg</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_DELIVERY }} />
            Delivery
          </span>
          <span className="font-bold text-teal-300">{fmt(delivery)} Kg</span>
        </div>
        <div className="border-t border-slate-700/60 my-1" />
        <div className="flex items-center justify-between gap-6">
          <span className="text-slate-500">Gap (Prod − Del)</span>
          <span className={`font-semibold ${gap >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {gap >= 0 ? '+' : ''}{fmt(gap)} Kg
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Legend ─────────────────────────────────────────────────────────────────────

function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-6 mb-4">
      {[
        { color: COLOR_PRODUKSI, label: 'Kts. Produksi' },
        { color: COLOR_DELIVERY, label: 'Kts. Keluar (Delivery)' },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="inline-block w-3 h-3 rounded-sm" style={{ background: color }} />
          {label}
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-56 gap-3 text-slate-600">
      <BarChart2 className="w-10 h-10 opacity-30" />
      <p className="text-sm">Tidak ada data untuk filter yang dipilih</p>
    </div>
  );
}

// ── Main GapAnalysisChart ─────────────────────────────────────────────────────

/**
 * Chart 2 — Gap Analysis per Code (Produksi − Delivery), grouped bar.
 *
 * @param {{ data: Array<{ code: string, produksi: number, delivery: number }> }} props
 */
export default function GapAnalysisChart({ data }) {
  const isEmpty = !data || data.length === 0;

  const formatYAxis = (val) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
    return val;
  };

  // Shorten code label for X axis
  const formatXAxis = (code) => code.replace('Biscuit-', '');

  return (
    <div className="glass-card p-6 fade-in-up" style={{ animationDelay: '80ms' }}>
      <div className="flex items-center gap-2 mb-1">
        <BarChart2 className="w-4 h-4 text-teal-400 shrink-0" />
        <h2 className="text-sm font-semibold text-slate-200">
          Gap Analysis per Code
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-4 ml-6">
        Total produksi vs delivery per code BISCUIT — lihat selisih tiap kategori
      </p>

      {isEmpty ? <EmptyState /> : (
        <>
          <CustomLegend />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
              barCategoryGap="30%"
              barGap={4}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="code"
                tickFormatter={formatXAxis}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />

              <Bar dataKey="produksi" name="Produksi" fill={COLOR_PRODUKSI} radius={[4, 4, 0, 0]} maxBarSize={48} />
              <Bar dataKey="delivery" name="Delivery" fill={COLOR_DELIVERY} radius={[4, 4, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

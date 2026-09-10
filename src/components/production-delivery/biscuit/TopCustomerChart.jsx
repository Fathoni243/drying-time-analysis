import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { Users } from 'lucide-react';

// ── Bar gradient colors (top-10 scale: teal → cyan) ──────────────────────────

const BAR_COLORS = [
  '#0d9488', '#0f9f9d', '#0ea5a0', '#14b8a6',
  '#0891b2', '#06b6d4', '#22d3ee', '#38bdf8',
  '#60a5fa', '#818cf8',
];

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass-card border border-teal-500/25 px-4 py-3 shadow-2xl shadow-black/50 min-w-[200px] pointer-events-none">
      <p className="text-sm font-bold text-slate-200 mb-2 leading-snug truncate max-w-[220px]">
        {d?.customer}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex items-center justify-between gap-6">
          <span className="text-slate-400">Total Delivery</span>
          <span className="font-bold text-teal-300">
            {(d?.ktsKeluar ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Kg
          </span>
        </div>
        {d?.rank && (
          <div className="flex items-center justify-between gap-6">
            <span className="text-slate-500">Ranking</span>
            <span className="font-medium text-slate-300">#{d.rank}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-56 gap-3 text-slate-600">
      <Users className="w-10 h-10 opacity-30" />
      <p className="text-sm">Tidak ada data customer untuk filter yang dipilih</p>
    </div>
  );
}

// ── Custom Y-axis tick (nama customer, truncated) ─────────────────────────────

function CustomerTick({ x, y, payload }) {
  const name = payload.value ?? '';
  const maxLen = 22;
  const display = name.length > maxLen ? name.slice(0, maxLen) + '…' : name;
  return (
    <text x={x} y={y} dy={4} textAnchor="end" fill="#94a3b8" fontSize={11}>
      {display}
    </text>
  );
}

// ── Main TopCustomerChart ─────────────────────────────────────────────────────

/**
 * Chart 3 — Top 10 Customer berdasarkan volume delivery BISCUIT.
 *
 * @param {{ data: Array<{ customer: string, ktsKeluar: number, rank: number }> }} props
 */
export default function TopCustomerChart({ data }) {
  const isEmpty = !data || data.length === 0;

  const formatXAxis = (val) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
    return val;
  };

  // Chart height adaptive: min 56px per bar
  const chartHeight = Math.max(280, data.length * 56);

  return (
    <div className="glass-card p-6 fade-in-up" style={{ animationDelay: '160ms' }}>
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-4 h-4 text-teal-400 shrink-0" />
        <h2 className="text-sm font-semibold text-slate-200">
          Top 10 Customer (Volume Delivery)
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-5 ml-6">
        Customer dengan total pengiriman BISCUIT terbesar pada periode yang dipilih
      </p>

      {isEmpty ? <EmptyState /> : (
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 70, left: 140, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.05)"
              horizontal={false}
            />
            <XAxis
              type="number"
              tickFormatter={formatXAxis}
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="customer"
              tick={<CustomerTick />}
              axisLine={false}
              tickLine={false}
              width={135}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />

            <Bar dataKey="ktsKeluar" radius={[0, 4, 4, 0]} maxBarSize={28}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
              <LabelList
                dataKey="ktsKeluar"
                position="right"
                formatter={(v) => `${(v / 1000).toFixed(1)}rb`}
                style={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

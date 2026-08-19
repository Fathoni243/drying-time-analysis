import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { minutesToTime } from '../utils/timeUtils';
import { BarChart2 } from 'lucide-react';

const BAR_COLORS = [
  '#f59e0b', '#f97316', '#ef4444', '#a855f7',
  '#3b82f6', '#10b981', '#06b6d4', '#ec4899',
  '#84cc16', '#f43f5e',
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass-card border border-amber-500/25 px-4 py-3 shadow-2xl shadow-black/50">
      <p className="text-amber-400 font-bold text-sm mb-1">{d?.codeProduct}</p>
      <p className="text-xs text-slate-500 mb-2 max-w-[200px] truncate">{d?.productName}</p>
      <div className="space-y-1 text-xs text-slate-300">
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Rata-rata Drying</span>
          <span className="font-bold text-amber-300">{d?.avgLabel}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Jumlah Batch</span>
          <span className="font-medium">{d?.count}</span>
        </div>
        {d?.kg && (
          <div className="flex justify-between gap-6">
            <span className="text-slate-500">Planning</span>
            <span className="font-medium">{d.kg} kg</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductCompareChart({ data, filters, yearBounds }) {
  // ── Resolusi label tahun ──
  // Gunakan filter aktif atau fallback ke batas dataset
  const effectiveYearStart = filters.yearStart || yearBounds?.min || '';
  const effectiveYearEnd   = filters.yearEnd   || yearBounds?.max || '';
  const isAllYears = effectiveYearStart === yearBounds?.min &&
                     effectiveYearEnd   === yearBounds?.max;
  const yearLabel = isAllYears
    ? 'Semua tahun'
    : `Tahun ${effectiveYearStart} s/d ${effectiveYearEnd}`;
  /**
   * Group data by Code Product (+ Kg if kg filter is active).
   * Apply Year and Kg filters, then compute average drying time per group.
   */
  const chartData = useMemo(() => {
    let source = data;
    if (filters.yearStart) source = source.filter(d => d.year >= parseInt(filters.yearStart));
    if (filters.yearEnd)   source = source.filter(d => d.year <= parseInt(filters.yearEnd));
    if (filters.kg)        source = source.filter(d => d.planningKg === parseFloat(filters.kg));

    // Group by codeProduct
    const groups = {};
    source.forEach(d => {
      const key = d.codeProduct || d.productName; // fallback if code missing
      if (!groups[key]) {
        groups[key] = {
          codeProduct: d.codeProduct || key,
          productName: d.productName,
          kg:          d.planningKg,
          minutes:     [],
        };
      }
      groups[key].minutes.push(d.dryingMinutes);
    });

    return Object.values(groups)
      .map(g => {
        const avg = g.minutes.reduce((a, b) => a + b, 0) / g.minutes.length;
        return {
          // Truncate long codes for Y-axis label
          label:       g.codeProduct.length > 18 ? g.codeProduct.slice(0, 16) + '…' : g.codeProduct,
          codeProduct: g.codeProduct,
          productName: g.productName,
          avgMinutes:  avg,
          avgLabel:    minutesToTime(avg),
          count:       g.minutes.length,
          kg:          g.kg,
        };
      })
      .sort((a, b) => b.avgMinutes - a.avgMinutes)
      .slice(0, 15); // cap at 15 bars for readability
  }, [data, filters]);

  if (!chartData.length) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center min-h-[260px]">
        <BarChart2 className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-slate-500 text-sm">Tidak ada data perbandingan.</p>
      </div>
    );
  }

  const chartHeight = Math.max(280, chartData.length * 42 + 80);

  return (
    <div className="glass-card p-6 fade-in-up">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            Perbandingan Rata-rata Drying Time per Produk
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {yearLabel}
            {filters.kg ? ` · ${filters.kg} kg` : ''}
            {' · '}{chartData.length} code product
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 80, left: 8, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            horizontal={false}
          />
          <XAxis
            type="number"
            tickFormatter={minutesToTime}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
          />
          <YAxis
            type="category"
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={130}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.04)' }} />
          <Bar dataKey="avgMinutes" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} opacity={0.85} />
            ))}
            <LabelList
              dataKey="avgLabel"
              position="right"
              style={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

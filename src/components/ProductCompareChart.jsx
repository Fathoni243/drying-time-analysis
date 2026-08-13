import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { minutesToTime, timeToMinutes } from '../utils/timeUtils';
import { BarChart2 } from 'lucide-react';

const COLORS = [
  '#f59e0b', '#f97316', '#ef4444', '#a855f7',
  '#3b82f6', '#10b981', '#06b6d4', '#ec4899',
  '#84cc16', '#f43f5e',
];

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass-card border border-amber-500/25 px-4 py-3 shadow-2xl shadow-black/50">
      <p className="text-amber-400 font-bold text-sm mb-2">{d?.productName}</p>
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

export default function ProductCompareChart({ data, filters }) {
  // Group by product (+ kg if set) within the selected year
  const chartData = useMemo(() => {
    let filtered = data;
    if (filters.year) filtered = filtered.filter(d => d.year === parseInt(filters.year));
    if (filters.kg) filtered = filtered.filter(d => d.planningKg === parseFloat(filters.kg));

    const grouped = {};
    filtered.forEach(d => {
      const key = filters.kg ? d.productName : d.nameKg || d.productName;
      if (!grouped[key]) grouped[key] = { minutes: [], count: 0, productName: d.productName, kg: d.planningKg };
      grouped[key].minutes.push(d.dryingMinutes);
      grouped[key].count++;
    });

    return Object.entries(grouped)
      .map(([name, val]) => {
        const avg = val.minutes.reduce((a, b) => a + b, 0) / val.minutes.length;
        return {
          name: name.length > 28 ? name.slice(0, 26) + '…' : name,
          productName: name,
          avgMinutes: avg,
          avgLabel: minutesToTime(avg),
          count: val.count,
          kg: val.kg,
        };
      })
      .sort((a, b) => b.avgMinutes - a.avgMinutes)
      .slice(0, 15); // max 15 bars
  }, [data, filters]);

  if (!chartData.length) {
    return (
      <div className="glass-card p-6 mb-6 flex flex-col items-center justify-center min-h-[260px]">
        <BarChart2 className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-slate-500 text-sm">Tidak ada data perbandingan.</p>
      </div>
    );
  }

  const chartHeight = Math.max(280, chartData.length * 40 + 80);

  return (
    <div className="glass-card p-6 mb-6 fade-in-up">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Perbandingan Rata-rata Drying per Produk</h2>
          <p className="text-xs text-slate-500 mt-1">
            {filters.year ? `Tahun ${filters.year}` : 'Semua tahun'}
            {filters.kg ? ` · ${filters.kg} kg` : ''}
            {' · '}{chartData.length} produk/varian
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
            dataKey="name"
            tick={{ fill: '#94a3b8', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            width={160}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.04)' }} />
          <Bar dataKey="avgMinutes" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.85} />
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

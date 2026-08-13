import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Dot, Area, AreaChart
} from 'recharts';
import { minutesToTime, timeToMinutes } from '../utils/timeUtils';
import { TrendingUp } from 'lucide-react';

// Custom dot for anomaly highlighting
function CustomDot(props) {
  const { cx, cy, payload, avgMinutes } = props;
  const diff = Math.abs(payload.dryingMinutes - avgMinutes);
  const threshold = avgMinutes * 0.15; // 15% deviation = anomaly
  const isAnomaly = diff > threshold;

  if (isAnomaly) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#0a0f1e" strokeWidth={2} opacity={0.9} />
        <circle cx={cx} cy={cy} r={10} fill="none" stroke="#f59e0b" strokeWidth={1} opacity={0.4} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={3.5} fill="#f59e0b" stroke="#0a0f1e" strokeWidth={1.5} opacity={0.85} />;
}

// Custom tooltip
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass-card border border-amber-500/25 px-4 py-3 shadow-2xl shadow-black/50 min-w-[200px]">
      <p className="text-xs text-slate-400 mb-2 font-medium">Batch Info</p>
      <p className="text-amber-400 font-bold text-sm mb-1">{d?.batchNo}</p>
      <div className="space-y-1 text-xs text-slate-300">
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Produk</span>
          <span className="font-medium text-right max-w-[140px] truncate">{d?.productName}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Tanggal</span>
          <span className="font-medium">{d?.date}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Planning</span>
          <span className="font-medium">{d?.planningKg} kg</span>
        </div>
        <div className="border-t border-amber-500/15 pt-1 mt-1 flex justify-between gap-6">
          <span className="text-slate-400">Drying Time</span>
          <span className="font-bold text-amber-300 text-sm">{d?.subTotalDrying}</span>
        </div>
      </div>
    </div>
  );
}

// Custom Y-axis tick formatter: minutes → HH:MM
function formatYTick(minutes) {
  return minutesToTime(minutes);
}

export default function DryingTrendChart({ filteredData, filters }) {
  const chartData = useMemo(() => {
    return filteredData.slice(0, 200).map((d, i) => {
      const shortBatch = d.batchNo.slice(-6);
      const yearSuffix = d.year ? String(d.year).slice(-2) : null;
      const label = yearSuffix ? `${shortBatch} / ${yearSuffix}` : shortBatch;
      return {
        ...d,
        index: i + 1,
        shortBatch: label,
      };
    });
  }, [filteredData]);

  const avgMinutes = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData.reduce((a, b) => a + b.dryingMinutes, 0) / chartData.length;
  }, [chartData]);

  const title = useMemo(() => {
    const parts = [];
    if (filters.product) parts.push(filters.product);
    if (filters.kg) parts.push(`(${filters.kg} Kg)`);
    if (filters.year) parts.push(`Tahun ${filters.year}`);
    return parts.length > 0
      ? `Trend Drying: ${parts.join(' ')}`
      : 'Trend Sub Total Drying (Semua Produk)';
  }, [filters]);

  const yDomain = useMemo(() => {
    if (!chartData.length) return [0, 360];
    const mins = chartData.map(d => d.dryingMinutes);
    const minV = Math.max(0, Math.min(...mins) - 20);
    const maxV = Math.max(...mins) + 30;
    return [minV, maxV];
  }, [chartData]);

  if (!filteredData.length) {
    return (
      <div className="glass-card p-6 mb-6 flex flex-col items-center justify-center min-h-[300px]">
        <TrendingUp className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-slate-500 text-sm">Tidak ada data untuk ditampilkan.</p>
        <p className="text-slate-600 text-xs mt-1">Ubah filter untuk melihat data.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 mb-6 fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <p className="text-xs text-slate-500 mt-1">
            Menampilkan {chartData.length} batch
            {chartData.length < filteredData.length && ` (dari ${filteredData.length} total)`}
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-amber-400 rounded" />
            <span className="text-slate-400">Drying Time</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 border-t-2 border-dashed border-red-400/70" />
            <span className="text-slate-400">Rata-rata ({minutesToTime(avgMinutes)})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
            <span className="text-slate-400">Anomali</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
        >
          <defs>
            <linearGradient id="dryingGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.04)"
            vertical={false}
          />
          <XAxis
            dataKey="shortBatch"
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            angle={-45}
            textAnchor="end"
            interval={Math.max(0, Math.floor(chartData.length / 20) - 1)}
            height={70}
          />
          <YAxis
            tickFormatter={formatYTick}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={yDomain}
            width={55}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: 'rgba(245,158,11,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          <ReferenceLine
            y={avgMinutes}
            stroke="rgba(239,68,68,0.6)"
            strokeDasharray="6 4"
            strokeWidth={1.5}
            label={{
              value: `Avg: ${minutesToTime(avgMinutes)}`,
              position: 'right',
              fill: '#ef4444',
              fontSize: 10,
              fontWeight: 600,
            }}
          />
          <Area
            type="monotone"
            dataKey="dryingMinutes"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#dryingGradient)"
            dot={<CustomDot avgMinutes={avgMinutes} />}
            activeDot={{ r: 7, fill: '#fbbf24', stroke: '#0a0f1e', strokeWidth: 2 }}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

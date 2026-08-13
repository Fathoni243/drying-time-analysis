import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { minutesToTime, timeToMinutes } from '../utils/timeUtils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Calculate % change: avg of last N batches vs avg of first N batches
 */
function calcTrend(minuteArr, n = 5) {
  if (minuteArr.length < 2) return 0;
  const take = Math.min(n, Math.floor(minuteArr.length / 2));
  if (take === 0) return 0;
  const first = minuteArr.slice(0, take).reduce((a, b) => a + b, 0) / take;
  const last = minuteArr.slice(-take).reduce((a, b) => a + b, 0) / take;
  return ((last - first) / first) * 100;
}

function Sparkline({ data, color }) {
  const points = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width={80} height={36}>
      <LineChart data={points}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TickerRow({ name, sub, minuteArr, latestTime, pct, index }) {
  const isDown = pct < -0.5;   // drying time turun = LEBIH CEPAT = hijau ✅
  const isUp = pct > 0.5;      // drying time naik  = LEBIH LAMA  = merah ⚠️
  const color = isDown ? '#10b981' : isUp ? '#ef4444' : '#94a3b8';
  const bgColor = isDown
    ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
    : isUp
      ? 'bg-red-500/5 hover:bg-red-500/10'
      : 'hover:bg-slate-700/20';

  const Icon = isDown ? TrendingDown : isUp ? TrendingUp : Minus;
  const sign = pct > 0 ? '+' : '';

  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] last:border-0 transition-colors duration-150 ${bgColor}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Left: name */}
      <div className="min-w-0 flex-1 pr-3">
        <p className="text-sm font-semibold text-slate-200 truncate leading-tight">{name}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{sub}</p>
      </div>

      {/* Center: sparkline */}
      <div className="shrink-0 mx-2">
        <Sparkline data={minuteArr} color={color} />
      </div>

      {/* Right: pct + value */}
      <div className="shrink-0 text-right min-w-[80px]">
        <div className="flex items-center justify-end gap-1 mb-0.5">
          <Icon className="w-3 h-3" style={{ color }} />
          <span className="text-sm font-bold" style={{ color }}>
            {sign}{pct.toFixed(2)}%
          </span>
        </div>
        <span className="text-xs text-slate-400 font-medium">{latestTime}</span>
      </div>
    </div>
  );
}

export default function DryingTickerWidget({ data, filters }) {
  const tickers = useMemo(() => {
    // Apply year filter only (show all products as tickers)
    let source = data;
    if (filters.year) source = source.filter(d => d.year === parseInt(filters.year));
    if (filters.kg) source = source.filter(d => d.planningKg === parseFloat(filters.kg));

    // Group by nameKg
    const groups = {};
    source.forEach(d => {
      const key = d.nameKg || `${d.productName} (${d.planningKg} kg)`;
      if (!groups[key]) groups[key] = { productName: d.productName, kg: d.planningKg, items: [] };
      groups[key].items.push(d);
    });

    return Object.entries(groups)
      .map(([key, val]) => {
        // Keep chronological order (assume data comes ordered by date)
        const minuteArr = val.items.map(d => d.dryingMinutes);
        const pct = calcTrend(minuteArr, 5);
        const latest = minuteArr[minuteArr.length - 1];
        // Downsample for sparkline (max 30 points)
        const step = Math.max(1, Math.floor(minuteArr.length / 30));
        const sampled = minuteArr.filter((_, i) => i % step === 0);

        return {
          key,
          name: val.productName,
          sub: `${val.kg} kg · ${val.items.length} batch`,
          minuteArr: sampled,
          latestTime: minutesToTime(latest),
          pct,
          absChange: Math.abs(pct),
        };
      })
      // Sort by absolute change desc (most volatile first)
      .sort((a, b) => b.absChange - a.absChange);
  }, [data, filters]);

  return (
    <div className="glass-card overflow-hidden fade-in-up flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-slate-200">Tren per Produk</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400">
            <TrendingDown className="w-3 h-3" /> Makin cepat
          </span>
          <span className="flex items-center gap-1 text-red-400">
            <TrendingUp className="w-3 h-3" /> Makin lama
          </span>
        </div>
      </div>

      {/* Subtitle */}
      <div className="px-4 py-2 bg-[#0d1528]/40 border-b border-white/[0.04]">
        <p className="text-xs text-slate-500">
          % perubahan = rata-rata 5 batch terakhir vs 5 batch pertama
          {filters.year ? ` · Tahun ${filters.year}` : ''}
          {filters.kg ? ` · ${filters.kg} kg` : ''}
        </p>
      </div>

      {/* Ticker list */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: '520px' }}>
        {tickers.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-500 text-sm">
            Tidak ada data
          </div>
        ) : (
          tickers.map((t, i) => (
            <TickerRow key={t.key} {...t} index={i} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.04] bg-[#0d1528]/40">
        <p className="text-xs text-slate-600 text-center">
          {tickers.length} produk/varian · diurutkan berdasarkan perubahan terbesar
        </p>
      </div>
    </div>
  );
}

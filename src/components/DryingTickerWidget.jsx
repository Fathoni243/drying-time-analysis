import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { minutesToTime } from '../utils/timeUtils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Trend calculation ────────────────────────────────────────────────────────

/**
 * Calculate % change between the average of the first N and last N batches.
 * Negative = drying time decreased (faster = good ✅)
 * Positive = drying time increased (slower = bad ⚠️)
 */
function calcTrendPct(minuteArr, n = 5) {
  if (minuteArr.length < 2) return 0;
  const take  = Math.min(n, Math.floor(minuteArr.length / 2));
  if (take === 0) return 0;
  const first = minuteArr.slice(0, take).reduce((a, b) => a + b, 0) / take;
  const last  = minuteArr.slice(-take).reduce((a, b) => a + b, 0) / take;
  return ((last - first) / first) * 100;
}

/** Downsample an array to at most `maxPoints` evenly-spaced elements */
function downsample(arr, maxPoints = 30) {
  if (arr.length <= maxPoints) return arr;
  const step = Math.floor(arr.length / maxPoints);
  return arr.filter((_, i) => i % step === 0);
}

// ── Sub-components ────────────────────────────────────────────────────────────

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

function TickerRow({ codeProduct, productName, sub, minuteArr, latestTime, pct, index }) {
  // Colour logic: negative pct (faster) = green, positive (slower) = red
  const isGood    = pct < -0.5;
  const isBad     = pct > 0.5;
  const color     = isGood ? '#10b981' : isBad ? '#ef4444' : '#94a3b8';
  const rowBg     = isGood
    ? 'hover:bg-emerald-500/10'
    : isBad
      ? 'hover:bg-red-500/10'
      : 'hover:bg-slate-700/20';

  const Icon = isGood ? TrendingDown : isBad ? TrendingUp : Minus;
  const sign = pct > 0 ? '+' : '';

  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] last:border-0 transition-colors duration-150 ${rowBg}`}
      style={{ animationDelay: `${index * 40}ms` }}
    >
      {/* Left: code + product name */}
      <div className="min-w-0 flex-1 pr-3">
        <p className="text-sm font-bold text-slate-100 truncate leading-tight">{codeProduct}</p>
        <p className="text-xs text-slate-500 truncate mt-0.5">{sub}</p>
      </div>

      {/* Center: sparkline */}
      <div className="shrink-0 mx-2">
        <Sparkline data={minuteArr} color={color} />
      </div>

      {/* Right: % change + latest drying time */}
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

// ── Main component ────────────────────────────────────────────────────────────

export default function DryingTickerWidget({ data, filters }) {
  const tickers = useMemo(() => {
    // Apply year + kg filters (code product filter is intentionally NOT applied here
    // so the ticker always shows the full landscape of products)
    let source = data;
    if (filters.year) source = source.filter(d => d.year === parseInt(filters.year));
    if (filters.kg)   source = source.filter(d => d.planningKg === parseFloat(filters.kg));

    // Group by codeProduct
    const groups = {};
    source.forEach(d => {
      const key = d.codeProduct || d.productName;
      if (!groups[key]) {
        groups[key] = {
          codeProduct: d.codeProduct || key,
          productName: d.productName,
          planningKg:  d.planningKg,
          items:       [],
        };
      }
      groups[key].items.push(d);
    });

    return Object.values(groups)
      .map(g => {
        const minuteArr = g.items.map(d => d.dryingMinutes);
        const pct       = calcTrendPct(minuteArr, 5);
        const latest    = minuteArr[minuteArr.length - 1];

        return {
          codeProduct: g.codeProduct,
          productName: g.productName,
          sub:         `${g.productName} · ${g.planningKg} kg · ${g.items.length} batch`,
          minuteArr:   downsample(minuteArr, 30),
          latestTime:  minutesToTime(latest),
          pct,
          absChange:   Math.abs(pct),
        };
      })
      // Most volatile products first
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
          % perubahan = avg 5 batch terakhir vs 5 batch pertama
          {filters.year ? ` · Tahun ${filters.year}` : ''}
          {filters.kg   ? ` · ${filters.kg} kg`      : ''}
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
            <TickerRow key={t.codeProduct} {...t} index={i} />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.04] bg-[#0d1528]/40">
        <p className="text-xs text-slate-600 text-center">
          {tickers.length} code product · diurutkan perubahan terbesar
        </p>
      </div>
    </div>
  );
}

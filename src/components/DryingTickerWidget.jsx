import { useMemo, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { minutesToTime } from '../utils/timeUtils';
import {
  TrendingUp, TrendingDown, Minus,
  Search, X, ArrowUpDown, ThumbsUp, ThumbsDown,
  Filter, MousePointerClick,
} from 'lucide-react';

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

function TickerRow({ codeProduct, productName, planningKg, sub, minuteArr, latestTime, pct, index, isActive, onApplyFilter }) {
  const isGood = pct < -0.5;
  const isBad  = pct > 0.5;
  const color  = isGood ? '#10b981' : isBad ? '#ef4444' : '#94a3b8';

  const Icon = isGood ? TrendingDown : isBad ? TrendingUp : Minus;
  const sign = pct > 0 ? '+' : '';

  // Active row styling
  const rowBg = isActive
    ? 'bg-amber-500/8 border-l-2 border-l-amber-400 hover:bg-amber-500/12'
    : isGood
      ? 'border-l-2 border-l-transparent hover:bg-emerald-500/10'
      : isBad
        ? 'border-l-2 border-l-transparent hover:bg-red-500/10'
        : 'border-l-2 border-l-transparent hover:bg-slate-700/20';

  return (
    <div
      onClick={() => onApplyFilter(codeProduct, planningKg)}
      className={`flex items-center justify-between px-3 py-2.5 border-b border-white/[0.04] last:border-0 transition-all duration-150 cursor-pointer group ${rowBg}`}
      style={{ animationDelay: `${index * 40}ms` }}
      title={`Klik untuk filter: ${codeProduct}`}
    >
      {/* Left: code + product name */}
      <div className="min-w-0 flex-1 pr-3">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-bold text-slate-100 truncate leading-tight">{codeProduct}</p>
          {isActive && (
            <span className="shrink-0 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 leading-none">
              AKTIF
            </span>
          )}
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{sub}</p>
      </div>

      {/* Center: sparkline */}
      <div className="shrink-0 mx-2">
        <Sparkline data={minuteArr} color={isActive ? '#f59e0b' : color} />
      </div>

      {/* Right: % change + latest drying time + filter icon hint */}
      <div className="shrink-0 text-right min-w-[80px]">
        <div className="flex items-center justify-end gap-1 mb-0.5">
          <Icon className="w-3 h-3" style={{ color }} />
          <span className="text-sm font-bold" style={{ color }}>
            {sign}{pct.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <span className="text-xs text-slate-400 font-medium">{latestTime}</span>
          <MousePointerClick className="w-3 h-3 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
        </div>
      </div>
    </div>
  );
}

// ── Sort button group ─────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { key: 'volatile', label: 'Volatile', icon: ArrowUpDown, title: 'Perubahan terbesar' },
  { key: 'fast',     label: 'Fastest',  icon: ThumbsUp,    title: 'Semakin cepat' },
  { key: 'slow',     label: 'Slowest',  icon: ThumbsDown,  title: 'Semakin lama' },
];

function SortGroup({ value, onChange }) {
  return (
    <div className="flex items-center gap-0.5 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
      {SORT_OPTIONS.map(({ key, label, icon: Icon, title }) => {
        const active = value === key;
        return (
          <button
            key={key}
            title={title}
            onClick={() => onChange(key)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 cursor-pointer
              ${active
                ? key === 'fast'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : key === 'slow'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DryingTickerWidget({ data, filters, onFilterApply, onFilterReset }) {
  const [search, setSearch]     = useState('');
  const [sortMode, setSortMode] = useState('volatile');

  // Check if filter was applied from this widget
  const activeCode = filters.codeProduct || '';

  const handleApplyFilter = (codeProduct, planningKg) => {
    // Toggle: klik row yang sudah aktif → reset filter
    if (activeCode === codeProduct) {
      onFilterReset?.();
      // Scroll to filter bar so user sees the reset
      document.getElementById('filter-bar-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    // Apply codeProduct (cascade-reset kg happens in App.jsx handleFilterChange)
    onFilterApply?.('codeProduct', codeProduct);

    // Set kg after the cascade reset resolves (next microtask)
    if (planningKg) {
      setTimeout(() => onFilterApply?.('kg', String(planningKg)), 0);
    }

    // Smooth scroll to FilterBar so user sees the applied filter
    setTimeout(() => {
      document.getElementById('filter-bar-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const tickers = useMemo(() => {
    // Apply year + kg filters from FilterBar
    // (codeProduct filter intentionally NOT applied so ticker shows full landscape)
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

    return Object.values(groups).map(g => {
      const minuteArr = g.items.map(d => d.dryingMinutes);
      const pct       = calcTrendPct(minuteArr, 5);
      const latest    = minuteArr[minuteArr.length - 1];

      return {
        codeProduct: g.codeProduct,
        productName: g.productName,
        planningKg:  g.planningKg,
        sub:         `${g.productName} · ${g.planningKg} kg · ${g.items.length} batch`,
        minuteArr:   downsample(minuteArr, 30),
        latestTime:  minutesToTime(latest),
        pct,
        absChange:   Math.abs(pct),
      };
    });
  }, [data, filters.year, filters.kg]);

  // Search filter
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tickers;
    return tickers.filter(t =>
      t.codeProduct.toLowerCase().includes(q) ||
      (t.productName && t.productName.toLowerCase().includes(q))
    );
  }, [tickers, search]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...searched];
    if (sortMode === 'volatile') return arr.sort((a, b) => b.absChange - a.absChange);
    if (sortMode === 'fast')     return arr.sort((a, b) => a.pct - b.pct);
    if (sortMode === 'slow')     return arr.sort((a, b) => b.pct - a.pct);
    return arr;
  }, [searched, sortMode]);

  const sortLabel = {
    volatile: 'diurutkan perubahan terbesar',
    fast:     'diurutkan terbaik (makin cepat)',
    slow:     'diurutkan terburuk (makin lama)',
  }[sortMode];

  return (
    <div className="glass-card overflow-hidden fade-in-up flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-slate-200">Tren per Produk</span>
          {activeCode && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <Filter className="w-2.5 h-2.5" />
              {activeCode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs">
          {activeCode ? (
            <button
              onClick={() => onFilterReset?.()}
              className="flex items-center gap-1 text-slate-500 hover:text-amber-400 transition-colors cursor-pointer"
              title="Reset filter"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          ) : (
            <>
              <span className="flex items-center gap-1 text-emerald-400">
                <TrendingDown className="w-3 h-3" /> Makin cepat
              </span>
              <span className="flex items-center gap-1 text-red-400">
                <TrendingUp className="w-3 h-3" /> Makin lama
              </span>
            </>
          )}
        </div>
      </div>

      {/* Subtitle */}
      <div className="px-4 py-2 bg-[#0d1528]/40 border-b border-white/[0.04]">
        <p className="text-xs text-slate-500">
          % perubahan = avg 5 batch terakhir vs 5 batch pertama
          {filters.year ? ` · Tahun ${filters.year}` : ''}
          {filters.kg   ? ` · ${filters.kg} kg`      : ''}
          {' · '}
          <span className="text-slate-600 italic">Klik baris untuk filter</span>
        </p>
      </div>

      {/* Search + Sort toolbar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.04] bg-[#0a0f1e]/30">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari code / nama produk..."
            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-amber-500/40 focus:bg-white/[0.06] transition-all duration-150"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Sort group */}
        <SortGroup value={sortMode} onChange={setSortMode} />
      </div>

      {/* Ticker list */}
      <div className="overflow-y-auto flex-1" style={{ maxHeight: '460px' }}>
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-slate-500 text-sm">
            {search ? (
              <>
                <Search className="w-5 h-5 text-slate-600" />
                <span>Tidak ada hasil untuk <span className="text-slate-400 font-medium">"{search}"</span></span>
              </>
            ) : (
              <span>Tidak ada data</span>
            )}
          </div>
        ) : (
          sorted.map((t, i) => (
            <TickerRow
              key={t.codeProduct}
              {...t}
              index={i}
              isActive={activeCode === t.codeProduct}
              onApplyFilter={handleApplyFilter}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-white/[0.04] bg-[#0d1528]/40">
        <p className="text-xs text-slate-600 text-center">
          {search
            ? `${sorted.length} dari ${tickers.length} produk · ${sortLabel}`
            : `${tickers.length} code product · ${sortLabel}`
          }
        </p>
      </div>
    </div>
  );
}

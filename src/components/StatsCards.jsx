import { useMemo } from 'react';
import { Clock, TrendingDown, TrendingUp, Activity, Database } from 'lucide-react';
import { minutesToTime } from '../utils/timeUtils';

function StatCard({ id, icon: Icon, label, value, sub, sub2, color, delay = 0 }) {
  return (
    <div
      id={id}
      className="stat-card p-5 fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background glow */}
      <div className={`pointer-events-none absolute inset-0 rounded-2xl opacity-5 ${color}`} />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mb-1">
            {label}
          </p>
          <p className="text-2xl font-bold text-slate-100 mt-1 leading-tight">
            {value}
          </p>
          {sub && (
            <p className="text-xs text-slate-500 mt-1">{sub}</p>
          )}
          {sub2 && (
            <p className="text-xs text-slate-500 mt-1">{sub2}</p>
          )}
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function StatsCards({ filteredData }) {
  const stats = useMemo(() => {
    if (!filteredData.length) return null;
    const minutes = filteredData.map(d => d.dryingMinutes);
    const avg = minutes.reduce((a, b) => a + b, 0) / minutes.length;
    const min = Math.min(...minutes);
    const max = Math.max(...minutes);

    const minRow = filteredData.find(d => d.dryingMinutes === min);
    const maxRow = filteredData.find(d => d.dryingMinutes === max);

    return {
      total: filteredData.length,
      avg: minutesToTime(avg),
      min: minutesToTime(min),
      max: minutesToTime(max),
      minBatch: minRow?.batchNo || '',
      maxBatch: maxRow?.batchNo || '',
      minProduct: minRow?.variantName + ' | ' + minRow?.codeProduct || '',
      maxProduct: maxRow?.variantName + ' | ' + maxRow?.codeProduct || '',
    };
  }, [filteredData]);

  if (!stats) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="stat-card p-5 h-24 shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard
        id="stat-total-batches"
        icon={Database}
        label="Total Batches"
        value={stats.total.toLocaleString('id-ID')}
        sub="batch terfilter"
        color="bg-blue-500 border-blue-500/30 text-blue-400"
        delay={0}
      />
      <StatCard
        id="stat-avg-drying"
        icon={Clock}
        label="Rata-rata Drying"
        value={stats.avg}
        sub="HH:MM rata-rata"
        color="bg-amber-500 border-amber-500/30 text-amber-400"
        delay={80}
      />
      <StatCard
        id="stat-fastest"
        icon={TrendingDown}
        label="Tercepat"
        value={stats.min}
        sub={stats.minBatch ? `Batch: ${stats.minBatch}` : '—'}
        sub2={stats.minProduct ? `Produk: ${stats.minProduct}` : '—'}
        color="bg-emerald-500 border-emerald-500/30 text-emerald-400"
        delay={160}
      />
      <StatCard
        id="stat-slowest"
        icon={TrendingUp}
        label="Terlama"
        value={stats.max}
        sub={stats.maxBatch ? `Batch: ${stats.maxBatch}` : '—'}
        sub2={stats.maxProduct ? `Produk: ${stats.maxProduct}` : '—'}
        color="bg-red-500 border-red-500/30 text-red-400"
        delay={240}
      />
    </div>
  );
}

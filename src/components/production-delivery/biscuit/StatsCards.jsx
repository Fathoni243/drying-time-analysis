import { Factory, Truck, Users } from 'lucide-react';
import { formatKg, formatNumber } from '../../../utils/biscuitUtils';

// ── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ id, icon: Icon, label, value, sub, colorClass, delay = 0 }) {
  return (
    <div
      id={id}
      className="stat-card p-5 fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background glow overlay */}
      <div className={`pointer-events-none absolute inset-0 rounded-2xl opacity-5 ${colorClass}`} />

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
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${colorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {[0, 1, 2].map(i => (
        <div key={i} className="stat-card p-5 h-28 shimmer" />
      ))}
    </div>
  );
}

// ── Main StatsCards ───────────────────────────────────────────────────────────

/**
 * @param {{
 *   totalProduksi: number,
 *   totalDelivery: number,
 *   totalCustomer: number,
 *   loading: boolean,
 * }} props
 */
export default function StatsCards({ totalProduksi, totalDelivery, totalCustomer, loading }) {
  if (loading) return <SkeletonCards />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

      {/* Card 1 — Total Produksi */}
      <StatCard
        id="stat-biscuit-produksi"
        icon={Factory}
        label="Total Kts. Produksi"
        value={formatKg(totalProduksi)}
        sub="dari production-data terfilter"
        colorClass="bg-teal-500 border-teal-500/30 text-teal-400"
        delay={0}
      />

      {/* Card 2 — Total Delivery */}
      <StatCard
        id="stat-biscuit-delivery"
        icon={Truck}
        label="Total Kts. Keluar (Delivery)"
        value={formatKg(totalDelivery)}
        sub="dari delivery-data terfilter"
        colorClass="bg-cyan-500 border-cyan-500/30 text-cyan-400"
        delay={80}
      />

      {/* Card 3 — Jumlah Customer */}
      <StatCard
        id="stat-biscuit-customer"
        icon={Users}
        label="Jumlah Customer"
        value={formatNumber(totalCustomer)}
        sub="customer unik dari delivery terfilter"
        colorClass="bg-violet-500 border-violet-500/30 text-violet-400"
        delay={160}
      />

    </div>
  );
}

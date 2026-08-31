import { Truck, Package, BarChart3, Clock, Construction } from 'lucide-react';
import Sidebar from '../components/shared/Sidebar';
import { useSidebar } from '../contexts/SidebarContext';

// ── Placeholder stat cards ───────────────────────────────────────────────────

const PLACEHOLDER_STATS = [
  {
    id: 'stat-total-orders',
    label: 'Total Orders',
    value: '—',
    sub: 'Segera hadir',
    icon: Package,
    color: 'bg-blue-500 border-blue-500/30 text-blue-400',
  },
  {
    id: 'stat-on-time',
    label: 'On-Time Delivery',
    value: '—',
    sub: 'Segera hadir',
    icon: Clock,
    color: 'bg-emerald-500 border-emerald-500/30 text-emerald-400',
  },
  {
    id: 'stat-in-transit',
    label: 'In Transit',
    value: '—',
    sub: 'Segera hadir',
    icon: Truck,
    color: 'bg-amber-500 border-amber-500/30 text-amber-400',
  },
  {
    id: 'stat-avg-lead',
    label: 'Avg Lead Time',
    value: '—',
    sub: 'Segera hadir',
    icon: BarChart3,
    color: 'bg-violet-500 border-violet-500/30 text-violet-400',
  },
];

function StatCard({ id, icon: Icon, label, value, sub, color }) {
  return (
    <div id={id} className="stat-card p-5 fade-in-up relative overflow-hidden opacity-60">
      <div className={`pointer-events-none absolute inset-0 rounded-2xl opacity-5 ${color}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-medium tracking-wide uppercase mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-100 mt-1 leading-tight">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
        </div>
        <div className={`flex items-center justify-center w-10 h-10 rounded-xl border ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductionDeliveryDashboard() {
  const { toggle } = useSidebar();
  return (
    <div className="min-h-screen bg-mesh">
      {/* Global sidebar navigation */}
      <Sidebar />

      {/* Header */}
      <header className="relative overflow-hidden border-b border-blue-500/10 bg-[#0d1528]/80 backdrop-blur-xl">
        <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="relative max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between gap-4">
          {/* Brand — klik untuk buka sidebar */}
          <button
            type="button"
            onClick={toggle}
            title="Klik untuk buka menu navigasi"
            aria-label="Buka menu navigasi"
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10
                            group-hover:border-blue-500/60 group-hover:shadow-blue-500/20 transition-all duration-200">
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <div className="text-left">
              <h1 className="text-lg font-bold text-blue-400 leading-tight group-hover:opacity-80 transition-opacity duration-200">
                Production Delivery
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                Dashboard Monitoring Pengiriman
              </p>
            </div>
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">

        {/* ── Under Construction Banner ── */}
        <div className="mb-8 fade-in-up">
          <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-blue-500/5 p-8 text-center">
            {/* Background glow */}
            <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-blue-500/8 rounded-full blur-3xl" />

            <div className="relative flex flex-col items-center gap-4">
              {/* Icon */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/25 flex items-center justify-center shadow-xl shadow-blue-500/10">
                  <Construction className="w-10 h-10 text-blue-400" />
                </div>
                {/* Pulsing ring */}
                <span className="absolute -inset-1 rounded-2xl border border-blue-400/20 animate-ping" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-100 mb-2">
                  Sedang dalam Pengembangan
                </h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
                  Dashboard Production & Delivery sedang dalam tahap pembangunan.
                  Fitur monitoring pengiriman, lead time, dan on-time delivery akan segera hadir.
                </p>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-xs text-blue-400 font-medium">Coming Soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Placeholder Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {PLACEHOLDER_STATS.map((s, i) => (
            <StatCard key={s.id} {...s} />
          ))}
        </div>

        {/* ── Placeholder chart areas ── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Chart placeholder 1 */}
          <div className="glass-card p-6 min-h-[320px] flex flex-col items-center justify-center gap-4 opacity-40">
            <BarChart3 className="w-12 h-12 text-slate-600" />
            <div className="text-center">
              <p className="text-slate-400 font-medium text-sm">Delivery Trend Chart</p>
              <p className="text-slate-600 text-xs mt-1">Akan menampilkan trend pengiriman per periode</p>
            </div>
            <div className="w-full space-y-2 px-4 mt-2">
              {[85, 65, 75, 50, 90, 60].map((w, i) => (
                <div key={i} className="shimmer h-3 rounded-full" style={{ width: `${w}%` }} />
              ))}
            </div>
          </div>

          {/* Chart placeholder 2 */}
          <div className="glass-card p-6 min-h-[320px] flex flex-col items-center justify-center gap-4 opacity-40">
            <Truck className="w-12 h-12 text-slate-600" />
            <div className="text-center">
              <p className="text-slate-400 font-medium text-sm">On-Time vs Late Delivery</p>
              <p className="text-slate-600 text-xs mt-1">Akan menampilkan komposisi ketepatan pengiriman</p>
            </div>
            <div className="w-48 h-48 rounded-full border-8 border-slate-700/40 border-t-slate-600/60 shimmer" />
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center py-4 text-xs text-slate-600 border-t border-white/[0.04]">
          Production Delivery Dashboard · Satoria Group · Segera hadir
        </footer>
      </main>
    </div>
  );
}

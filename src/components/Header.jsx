import { BarChart2, Droplets, RefreshCw } from 'lucide-react';

export default function Header({ lastFetched, onRefresh, loading }) {
  return (
    <header className="relative overflow-hidden border-b border-amber-500/10 bg-[#0d1528]/80 backdrop-blur-xl">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-amber-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 shadow-lg shadow-amber-500/10">
            <Droplets className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold gradient-text leading-tight">
              Drying Time Analysis
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
              Dashboard Monitoring Produksi
            </p>
          </div>
        </div>

        {/* Center decorative pills */}
        <div className="hidden md:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse-amber" />
            <span className="text-xs text-amber-400 font-medium">Live Data</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-700/40 border border-slate-600/30">
            <BarChart2 className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Google Sheets</span>
          </div>
        </div>

        {/* Right: last updated + refresh */}
        <div className="flex items-center gap-3">
          {lastFetched && (
            <span className="hidden sm:block text-xs text-slate-500">
              Diperbarui: {lastFetched.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button
            id="btn-refresh"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh data"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-sm font-medium
                       hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
}

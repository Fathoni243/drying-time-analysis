import { RefreshCw, Cookie } from 'lucide-react';
import { useSidebar } from '../../../contexts/SidebarContext';

/**
 * Header untuk Biscuit Dashboard.
 * Warna tema: teal/cyan untuk membedakan dari Drying Time (amber).
 *
 * @param {{ loading: boolean, lastFetched: Date|null, onRefresh: Function }} props
 */
export default function Header({ loading, lastFetched, onRefresh }) {
  const { toggle } = useSidebar();

  return (
    <header className="relative overflow-hidden border-b border-teal-500/10 bg-[#0d1528]/80 backdrop-blur-xl">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-teal-500/5 rounded-full blur-3xl" />

      <div className="relative max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between gap-4">

        {/* Brand — klik untuk buka sidebar */}
        <button
          type="button"
          onClick={toggle}
          title="Klik untuk buka menu navigasi"
          aria-label="Buka menu navigasi"
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30 shadow-lg shadow-teal-500/10
                          group-hover:border-teal-500/60 group-hover:shadow-teal-500/20 transition-all duration-200">
            <Cookie className="w-5 h-5 text-teal-400" />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold leading-tight group-hover:opacity-80 transition-opacity duration-200"
              style={{
                background: 'linear-gradient(135deg, #2dd4bf 0%, #67e8f9 50%, #0d9488 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Biscuit Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
              Production &amp; Delivery Monitoring
            </p>
          </div>
        </button>

        {/* Right: last fetched + refresh */}
        <div className="flex items-center gap-1.5 shrink-0">
          {lastFetched && (
            <div className="hidden sm:flex flex-col items-end text-right">
              <span className="text-[11px] text-slate-500 leading-tight">
                Data per:{' '}
                <span className="text-slate-400 font-mono">
                  {lastFetched.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </span>
            </div>
          )}

          <button
            id="btn-biscuit-refresh"
            onClick={onRefresh}
            disabled={loading}
            title="Refresh data"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/25 text-teal-400 text-sm font-medium
                       hover:bg-teal-500/20 hover:border-teal-500/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

      </div>
    </header>
  );
}

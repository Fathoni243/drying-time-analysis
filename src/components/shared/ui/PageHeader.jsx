import { RefreshCw } from 'lucide-react';
import { useSidebar } from '../../../contexts/SidebarContext';

/**
 * Shared PageHeader — dipakai di semua halaman dashboard.
 *
 * Props:
 * @param {React.ReactNode} icon          - Icon element (mis. <Droplets className="..." />)
 * @param {string}          title         - Judul halaman (h1)
 * @param {string}          subtitle      - Sub-judul kecil di bawah title
 * @param {string}          accentColor   - Tailwind color name, mis. "amber", "teal", "violet"
 * @param {Date|null}       lastFetched   - Timestamp terakhir data di-fetch
 * @param {boolean}         loading       - Apakah sedang loading (untuk spinner + disable)
 * @param {Function}        onRefresh     - Callback tombol Refresh
 * @param {string}          [refreshBtnId]- ID unik untuk tombol refresh (opsional)
 * @param {React.ReactNode} [extra]       - Slot tambahan di sebelah kanan (opsional)
 */
export default function PageHeader({
  icon,
  title,
  subtitle,
  accentColor = 'amber',
  lastFetched,
  loading,
  onRefresh,
  refreshBtnId = 'btn-page-refresh',
  extra,
}) {
  const { toggle } = useSidebar();

  // Mapping warna ke Tailwind classes (harus statis agar Tailwind tidak purge)
  const colorMap = {
    amber: {
      glow:   'bg-amber-500/5',
      border: 'border-amber-500/10',
      icon:   'from-amber-500/20 to-orange-500/20 border-amber-500/30 shadow-amber-500/10 group-hover:border-amber-500/60 group-hover:shadow-amber-500/20',
      btn:    'bg-amber-500/10 border-amber-500/25 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50',
      title:  'linear-gradient(135deg, #f59e0b 0%, #fbbf24 50%, #f97316 100%)',
    },
    teal: {
      glow:   'bg-teal-500/5',
      border: 'border-teal-500/10',
      icon:   'from-teal-500/20 to-cyan-500/20 border-teal-500/30 shadow-teal-500/10 group-hover:border-teal-500/60 group-hover:shadow-teal-500/20',
      btn:    'bg-teal-500/10 border-teal-500/25 text-teal-400 hover:bg-teal-500/20 hover:border-teal-500/50',
      title:  'linear-gradient(135deg, #2dd4bf 0%, #67e8f9 50%, #0d9488 100%)',
    },
    violet: {
      glow:   'bg-violet-500/5',
      border: 'border-violet-500/10',
      icon:   'from-violet-500/20 to-purple-500/20 border-violet-500/30 shadow-violet-500/10 group-hover:border-violet-500/60 group-hover:shadow-violet-500/20',
      btn:    'bg-violet-500/10 border-violet-500/25 text-violet-400 hover:bg-violet-500/20 hover:border-violet-500/50',
      title:  'linear-gradient(135deg, #a78bfa 0%, #c4b5fd 50%, #7c3aed 100%)',
    },
    blue: {
      glow:   'bg-blue-500/5',
      border: 'border-blue-500/10',
      icon:   'from-blue-500/20 to-indigo-500/20 border-blue-500/30 shadow-blue-500/10 group-hover:border-blue-500/60 group-hover:shadow-blue-500/20',
      btn:    'bg-blue-500/10 border-blue-500/25 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50',
      title:  'linear-gradient(135deg, #60a5fa 0%, #93c5fd 50%, #3b82f6 100%)',
    },
  };

  const c = colorMap[accentColor] ?? colorMap.amber;

  return (
    <header className={`relative overflow-hidden border-b ${c.border} bg-[#0d1528]/80 backdrop-blur-xl`}>
      {/* Ambient glow */}
      <div className={`pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[200px] ${c.glow} rounded-full blur-3xl`} />

      <div className="relative max-w-[1600px] mx-auto px-6 py-5 flex items-center justify-between gap-4">

        {/* Brand — klik untuk buka sidebar */}
        <button
          type="button"
          onClick={toggle}
          title="Klik untuk buka menu navigasi"
          aria-label="Buka menu navigasi"
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className={`flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${c.icon} shadow-lg transition-all duration-200`}>
            {icon}
          </div>
          <div className="text-left">
            <h1
              className="text-lg font-bold leading-tight group-hover:opacity-80 transition-opacity duration-200"
              style={{
                background: c.title,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </button>

        {/* Right: last fetched + extras + refresh */}
        <div className="flex items-center gap-2 shrink-0">
          {extra}

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

          {onRefresh && (
            <button
              id={refreshBtnId}
              onClick={onRefresh}
              disabled={loading}
              title="Refresh data"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${c.btn}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}

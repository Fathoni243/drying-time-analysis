/**
 * FilterTransitionOverlay
 * Muncul saat filter sedang diproses (isPending dari useTransition).
 * Memblokir semua interaksi halaman selama re-render chart berlangsung.
 */
export default function FilterTransitionOverlay({ show }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[99999] cursor-wait pointer-events-auto">

      {/* Backdrop veil */}
      <div className="absolute inset-0 bg-[#04091a]/50 backdrop-blur-[2px]" />

      {/* Spinner card — dead center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 px-10 py-8 rounded-2xl bg-[#0d1528]/95 border border-amber-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl">

        {/* Animated ring + arc */}
        <span className="relative flex h-14 w-14 shrink-0">
          {/* Pulsing outer ring */}
          <span className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
          {/* Spinning arc */}
          <svg
            className="relative h-14 w-14 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        </span>

        {/* Labels */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-base font-bold text-amber-400 tracking-wide whitespace-nowrap">
            Menerapkan filter...
          </span>
          <span className="text-xs text-slate-500 whitespace-nowrap">
            Mohon tunggu, data sedang diproses
          </span>
        </div>
      </div>

    </div>
  );
}

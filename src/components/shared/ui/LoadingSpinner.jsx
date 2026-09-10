import { Droplets } from 'lucide-react';

export default function LoadingSpinner({ message = 'Memuat data...' }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      {/* Pulsing icon */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Droplets className="w-9 h-9 text-amber-400 animate-pulse" />
        </div>
        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-amber-500/60 animate-spin" />
      </div>

      <div className="text-center">
        <p className="text-slate-300 font-medium">{message}</p>
        <p className="text-slate-600 text-sm mt-1">Mengambil data dari Google Sheets…</p>
      </div>

      {/* Skeleton rows */}
      <div className="w-full max-w-lg space-y-3 px-6">
        {[90, 75, 85, 60].map((w, i) => (
          <div key={i} className="shimmer h-3 rounded-full" style={{ width: `${w}%` }} />
        ))}
      </div>
    </div>
  );
}

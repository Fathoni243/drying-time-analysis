import { AlertTriangle, ClipboardList } from 'lucide-react';

// ── LoadingState ──────────────────────────────────────────────────────────────

/**
 * Tampilkan spinner saat data sedang di-fetch.
 */
export function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
      <p className="text-slate-400 text-sm">Memuat data dari Google Sheets…</p>
    </div>
  );
}

// ── ErrorState ────────────────────────────────────────────────────────────────

/**
 * Tampilkan pesan error dengan tombol retry.
 * @param {{ error: string, onRetry: () => void }} props
 */
export function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="glass-card border border-red-500/30 px-8 py-6 text-center max-w-lg">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 font-semibold mb-1">Gagal Memuat Data</p>
        <p className="text-slate-400 text-sm mb-4 whitespace-pre-wrap">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium hover:bg-red-500/20 transition-all"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

/**
 * Tampilkan placeholder saat belum ada entry ditambahkan.
 */
export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2">
        <ClipboardList className="w-8 h-8 text-amber-500/60" />
      </div>
      <p className="text-slate-300 font-medium">Belum ada produksi yang dicek</p>
      <p className="text-slate-500 text-sm max-w-xs">
        Tambahkan produk di form atas untuk mulai pengecekan kecukupan material.
      </p>
    </div>
  );
}

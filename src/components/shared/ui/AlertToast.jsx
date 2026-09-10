import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, XCircle, Info, X } from 'lucide-react';

/**
 * AlertToast - Komponen alert reusable yang bisa dipakai untuk:
 *   - 'warning'  -> peringatan / input belum lengkap
 *   - 'error'    -> aksi gagal / data tidak ditemukan
 *   - 'success'  -> aksi berhasil
 *   - 'info'     -> informasi umum
 *
 * Props:
 *   @param {boolean}  show            - Tampilkan / sembunyikan alert
 *   @param {'warning'|'error'|'success'|'info'} type - Jenis alert
 *   @param {string}   title           - Judul singkat
 *   @param {string}   message         - Deskripsi detail
 *   @param {number}   [autoDismissMs] - Jika diisi, alert otomatis hilang setelah N ms
 *   @param {Function} [onDismiss]     - Callback saat alert ditutup (manual / auto)
 *   @param {string}   [className]     - Kelas tambahan dari luar
 */
export default function AlertToast({
  show,
  type = 'warning',
  title,
  message,
  autoDismissMs,
  onDismiss,
  className = '',
}) {
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);

  // Mount -> fade-in
  useEffect(() => {
    if (show) {
      setRendered(true);
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
      const t = setTimeout(() => setRendered(false), 350);
      return () => clearTimeout(t);
    }
  }, [show]);

  // Auto-dismiss
  useEffect(() => {
    if (show && autoDismissMs) {
      const t = setTimeout(() => onDismiss?.(), autoDismissMs);
      return () => clearTimeout(t);
    }
  }, [show, autoDismissMs, onDismiss]);

  if (!rendered) return null;

  const variants = {
    warning: {
      icon:   AlertTriangle,
      bg:     'bg-amber-500/10',
      border: 'border-amber-500/40',
      accent: 'text-amber-400',
      bar:    'bg-amber-500',
      iconBg: 'bg-amber-500/15',
    },
    error: {
      icon:   XCircle,
      bg:     'bg-rose-500/10',
      border: 'border-rose-500/40',
      accent: 'text-rose-400',
      bar:    'bg-rose-500',
      iconBg: 'bg-rose-500/15',
    },
    success: {
      icon:   CheckCircle2,
      bg:     'bg-emerald-500/10',
      border: 'border-emerald-500/40',
      accent: 'text-emerald-400',
      bar:    'bg-emerald-500',
      iconBg: 'bg-emerald-500/15',
    },
    info: {
      icon:   Info,
      bg:     'bg-sky-500/10',
      border: 'border-sky-500/40',
      accent: 'text-sky-400',
      bar:    'bg-sky-500',
      iconBg: 'bg-sky-500/15',
    },
  };

  const v    = variants[type] ?? variants.warning;
  const Icon = v.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'relative overflow-hidden rounded-xl border backdrop-blur-sm',
        v.bg,
        v.border,
        className,
      ].join(' ')}
      style={{
        transition: 'opacity 350ms ease, transform 350ms ease',
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0) scale(1)' : 'translateY(-6px) scale(0.98)',
      }}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${v.bar}`} />

      <div className="flex items-start gap-3 px-4 py-3 pl-5">
        {/* Icon */}
        <span className={`mt-0.5 flex-shrink-0 rounded-lg p-1.5 ${v.iconBg}`}>
          <Icon className={`w-4 h-4 ${v.accent}`} strokeWidth={2.2} />
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className={`text-sm font-semibold leading-snug ${v.accent}`}>
              {title}
            </p>
          )}
          {message && (
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              {message}
            </p>
          )}
        </div>

        {/* Close button (opsional) */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Tutup peringatan"
            className="flex-shrink-0 mt-0.5 p-1 rounded-md text-slate-500
                       hover:text-slate-300 hover:bg-white/5
                       transition-colors duration-150"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Auto-dismiss progress bar */}
      {show && autoDismissMs && (
        <>
          <div
            className={`absolute bottom-0 left-0 h-[2px] ${v.bar} opacity-40`}
            style={{ animation: `alert-shrink ${autoDismissMs}ms linear forwards` }}
          />
          <style>{`
            @keyframes alert-shrink {
              from { width: 100%; }
              to   { width: 0%;   }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
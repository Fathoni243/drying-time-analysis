import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, ChevronUp, Droplets, Truck, Cog } from 'lucide-react';
import { useSidebar } from '../../contexts/SidebarContext';

// ── Sub-items: Production Delivery ───────────────────────────────────────────

const DELIVERY_CHILDREN = [
  { label: 'Biscuit',     id: 'biscuit'     },
  { label: 'Givaudan',    id: 'givaudan'    },
  { label: 'Liquid',      id: 'liquid'      },
  { label: 'Powder',      id: 'powder'      },
  { label: 'Santan',      id: 'santan'      },
  { label: 'Makloon MR',  id: 'makloon-mr'  },
  { label: 'PEA Protein', id: 'pea-protein' },
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { open, setOpen } = useSidebar();
  const location = useLocation();
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  const isDrying   = location.pathname === '/drying-time-dashboard';
  const isDelivery = location.pathname.startsWith('/production-delivery-dashboard');

  // Auto-expand delivery section when on its route
  useEffect(() => {
    if (isDelivery) setDeliveryOpen(true);
  }, [isDelivery]);

  // Close sidebar on route change
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, setOpen]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`
          fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]
          transition-opacity duration-300
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
      />

      {/* ── Sidebar Panel ── */}
      <aside
        aria-label="Navigasi"
        aria-hidden={!open}
        className={`
          fixed left-0 top-0 bottom-0 z-50 w-64
          flex flex-col
          bg-[#0d1117]
          transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* ── Brand Header ── */}
        <div className="flex items-center justify-between px-4 pt-5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
              <Cog size={20} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100 leading-tight">PPIC Dashboard</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Satoria Group</p>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Tutup menu"
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-all duration-150"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">

          {/* 1. Drying Time Dashboard */}
          <Link
            to="/drying-time-dashboard"
            aria-current={isDrying ? 'page' : undefined}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg
              text-sm font-medium transition-colors duration-150
              ${isDrying
                ? 'bg-slate-700/70 text-white'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}
            `}
          >
            <Droplets size={18} className="shrink-0" />
            <span>Drying Time Dashboard</span>
          </Link>

          {/* 2. Production Delivery (expandable) */}
          <div>
            {/* Parent toggle row */}
            <button
              onClick={() => setDeliveryOpen(v => !v)}
              aria-expanded={deliveryOpen}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left
                text-sm font-medium transition-colors duration-150
                ${isDelivery
                  ? 'bg-slate-700/70 text-white'
                  : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}
              `}
            >
              <Truck size={18} className="shrink-0" />
              <span className="flex-1">Production Delivery</span>
              <ChevronUp
                className={`w-4 h-4 shrink-0 transition-transform duration-200 ${deliveryOpen ? '' : 'rotate-180'}`}
              />
            </button>

            {/* Sub-items accordion */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${deliveryOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}
            >
              <div className="pl-11 py-1 space-y-0.5">
                {DELIVERY_CHILDREN.map(({ label, id }) => (
                  <Link
                    key={id}
                    to="/production-delivery-dashboard"
                    className="block px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 transition-colors duration-150"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </nav>

        {/* ── Footer ── */}
        <div className="px-4 py-3 border-t border-slate-800/80">
          <p className="text-[10px] text-slate-700 text-center">Satoria Group · v1.0.0</p>
        </div>
      </aside>
    </>
  );
}

import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

// ── Colors ───────────────────────────────────────────────────────────────────

const COLOR_PRODUKSI = '#f59e0b';   // amber/cocoa
const COLOR_DELIVERY = '#0d9488';   // teal

// ── Tooltip kustom ────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  const produksi = payload.find(p => p.dataKey === 'produksi');
  const delivery = payload.find(p => p.dataKey === 'delivery');

  const fmt = (v) => (v ?? 0).toLocaleString('id-ID', { maximumFractionDigits: 1 });

  return (
    <div className="glass-card border border-teal-500/25 px-4 py-3 shadow-2xl shadow-black/50 min-w-[220px] pointer-events-none">
      <p className="text-xs text-slate-400 mb-2 font-medium">{label}</p>
      <div className="space-y-1.5 text-xs">
        {produksi && (
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_PRODUKSI }} />
              Produksi
            </span>
            <span className="font-bold text-amber-300">{fmt(produksi.value)} Kg</span>
          </div>
        )}
        {delivery && (
          <div className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: COLOR_DELIVERY }} />
              Delivery
            </span>
            <span className="font-bold text-teal-300">{fmt(delivery.value)} Kg</span>
          </div>
        )}
        {produksi && delivery && (
          <>
            <div className="border-t border-slate-700/60 my-1" />
            <div className="flex items-center justify-between gap-6">
              <span className="text-slate-500">Gap</span>
              <span className={`font-medium ${(produksi.value - delivery.value) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {((produksi.value ?? 0) - (delivery.value ?? 0)).toLocaleString('id-ID', { maximumFractionDigits: 1 })} Kg
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Legend kustom ─────────────────────────────────────────────────────────────

function CustomLegend() {
  return (
    <div className="flex items-center justify-center gap-6 mt-2 mb-0">
      {[
        { color: COLOR_PRODUKSI, label: 'Kts. Produksi' },
        { color: COLOR_DELIVERY, label: 'Kts. Keluar (Delivery)' },
      ].map(({ color, label }) => (
        <div key={label} className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="inline-block w-8 h-2 rounded-full opacity-80" style={{ background: color }} />
          {label}
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-600">
      <TrendingUp className="w-10 h-10 opacity-30" />
      <p className="text-sm">Tidak ada data untuk periode &amp; filter yang dipilih</p>
    </div>
  );
}

// ── Main TrendChart ───────────────────────────────────────────────────────────

/**
 * Chart 1 — Tren Produksi vs Delivery per Bulan.
 *
 * @param {{ data: Array<{ month: string, produksi: number, delivery: number }> }} props
 */
export default function TrendChart({ data }) {
  const isEmpty = !data || data.length === 0;

  // Format sumbu X: "2023-07" → "Jul 2023"
  const formatXAxis = (ym) => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${monthNames[parseInt(m, 10) - 1]} '${y.slice(2)}`;
  };

  // Format sumbu Y: singkat jika besar
  const formatYAxis = (val) => {
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}jt`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}rb`;
    return val;
  };

  // Hitung interval agar label X tidak terlalu padat
  const tickInterval = useMemo(() => {
    const n = data?.length ?? 0;
    if (n <= 12) return 0;
    if (n <= 24) return 1;
    if (n <= 48) return 2;
    return Math.ceil(n / 16) - 1;
  }, [data]);

  return (
    <div className="glass-card p-6 mb-6 fade-in-up">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-4 h-4 text-teal-400 shrink-0" />
        <h2 className="text-sm font-semibold text-slate-200">
          Tren Produksi vs Delivery per Bulan
        </h2>
      </div>
      <p className="text-xs text-slate-500 mb-5 ml-6">
        Perbandingan volume produksi dan pengiriman BISCUIT dari waktu ke waktu
      </p>

      {isEmpty ? <EmptyState /> : (
        <>
          <CustomLegend />
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="gradProduksi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_PRODUKSI} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLOR_PRODUKSI} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradDelivery" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLOR_DELIVERY} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={COLOR_DELIVERY} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tickFormatter={formatXAxis}
                interval={tickInterval}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip content={<CustomTooltip />} />

              <Area
                type="monotone"
                dataKey="produksi"
                name="Produksi"
                stroke={COLOR_PRODUKSI}
                strokeWidth={2}
                fill="url(#gradProduksi)"
                dot={false}
                activeDot={{ r: 5, fill: COLOR_PRODUKSI, stroke: '#0a0f1e', strokeWidth: 2 }}
              />
              <Area
                type="monotone"
                dataKey="delivery"
                name="Delivery"
                stroke={COLOR_DELIVERY}
                strokeWidth={2}
                fill="url(#gradDelivery)"
                dot={false}
                activeDot={{ r: 5, fill: COLOR_DELIVERY, stroke: '#0a0f1e', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

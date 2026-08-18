import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Dot, Area, AreaChart
} from 'recharts';
import { minutesToTime, timeToMinutes } from '../utils/timeUtils';
import { TrendingUp, X, Clock, Package, Calendar, Weight } from 'lucide-react';

// Custom dot for anomaly highlighting
function CustomDot(props) {
  const { cx, cy, payload, avgMinutes, onClick } = props;
  const diff = Math.abs(payload.dryingMinutes - avgMinutes);
  const threshold = avgMinutes * 0.15; // 15% deviation = anomaly
  const isAnomaly = diff > threshold;

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) onClick(payload);
  };

  if (isAnomaly) {
    return (
      // fillOpacity={0} instead of fill="transparent" — SVG transparent/none disables pointer events
      <g onClick={handleClick} style={{ cursor: 'pointer' }}>
        <circle cx={cx} cy={cy} r={14} fill="#f59e0b" fillOpacity={0} />
        <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#0a0f1e" strokeWidth={2} opacity={0.9} />
        <circle cx={cx} cy={cy} r={10} fill="none" stroke="#f59e0b" strokeWidth={1} opacity={0.4} />
      </g>
    );
  }
  return (
    <g onClick={handleClick} style={{ cursor: 'pointer' }}>
      <circle cx={cx} cy={cy} r={10} fill="#f59e0b" fillOpacity={0} />
      <circle cx={cx} cy={cy} r={3.5} fill="#f59e0b" stroke="#0a0f1e" strokeWidth={1.5} opacity={0.85} />
    </g>
  );
}

// Hover tooltip (standard recharts)
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="glass-card border border-amber-500/25 px-4 py-3 shadow-2xl shadow-black/50 min-w-[200px] pointer-events-none">
      <p className="text-xs text-slate-400 mb-2 font-medium">Batch Info</p>
      <p className="text-amber-400 font-bold text-sm mb-1">{d?.batchNo}</p>
      <div className="space-y-1 text-xs text-slate-300">
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Produk</span>
          <span className="font-medium text-right max-w-[140px] truncate">{d?.productName}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Tanggal</span>
          <span className="font-medium">{d?.date}</span>
        </div>
        <div className="flex justify-between gap-6">
          <span className="text-slate-500">Planning</span>
          <span className="font-medium">{d?.planningKg} kg</span>
        </div>
        <div className="border-t border-amber-500/15 pt-1 mt-1 flex justify-between gap-6">
          <span className="text-slate-400">Drying Time</span>
          <span className="font-bold text-amber-300 text-sm">{d?.subTotalDryingFinal}</span>
        </div>
      </div>
    </div>
  );
}

// Center popup modal — menggunakan Tailwind CSS
// Inline style hanya untuk: custom gradient & keyframe animation (tidak bisa diekspresikan via Tailwind)
function BatchPopup({ data, onClose }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!data) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" />

      {/* Card */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-[90vw] min-w-[320px] max-w-[420px] rounded-2xl overflow-hidden border border-amber-500/35 shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(245,158,11,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]"
        style={{
          background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(20,30,60,0.98) 100%)',
          animation: 'popupFadeIn 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Amber glow top bar — custom gradient, inline style diperlukan */}
        <div
          className="h-[3px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #f59e0b, #fbbf24, #f59e0b, transparent)' }}
        />

        <div className="px-6 pt-5 pb-6">
          {/* Header row */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase mb-1">
                Batch Detail
              </p>
              <p className="text-lg font-bold text-amber-400 tracking-wide">
                {data.batchNo}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-[30px] h-[30px] rounded-full bg-white/5 border border-white/[0.08] text-slate-500 flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-white/[0.12] hover:text-slate-200 shrink-0"
              title="Tutup (Esc)"
            >
              <X size={14} />
            </button>
          </div>

          {/* Info rows */}
          <div className="flex flex-col gap-2.5">
            {/* Produk */}
            <div className="flex items-center gap-3 bg-white/[0.03] rounded-xl px-3.5 py-2.5 border border-white/[0.05]">
              <Package size={15} className="text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 mb-0.5">Produk</p>
                <p className="text-[13px] font-semibold text-slate-200 truncate">
                  {data.productName || '-'}
                </p>
              </div>
            </div>

            {/* Tanggal + Planning side by side */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl px-3.5 py-2.5 border border-white/[0.05]">
                <Calendar size={14} className="text-blue-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5">Tanggal</p>
                  <p className="text-xs font-semibold text-slate-200">{data.date || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 bg-white/[0.03] rounded-xl px-3.5 py-2.5 border border-white/[0.05]">
                <Weight size={14} className="text-violet-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500 mb-0.5">Planning</p>
                  <p className="text-xs font-semibold text-slate-200">{data.planningKg ? `${data.planningKg} kg` : '-'}</p>
                </div>
              </div>
            </div>

            {/* Drying Time highlighted — gradient bg pakai inline style */}
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3.5 border border-amber-500/25"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(251,191,36,0.06))' }}
            >
              <Clock size={16} className="text-amber-300 shrink-0" />
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-amber-900 mb-0.5">Drying Time</p>
                <p className="text-[22px] font-extrabold text-amber-300 tracking-wide leading-none">
                  {data.subTotalDryingFinal || '-'}
                </p>
              </div>
            </div>
          </div>

          {/* Footer hint */}
          <p className="text-[10px] text-slate-700 text-center mt-3.5">
            Klik di luar atau tekan Esc untuk menutup
          </p>
        </div>
      </div>

      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; transform: scale(0.88) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

// Custom Y-axis tick formatter: minutes -> HH:MM
function formatYTick(minutes) {
  return minutesToTime(minutes);
}

export default function DryingTrendChart({ filteredData, filters }) {
  const [popupData, setPopupData] = useState(null);

  const handleDotClick = useCallback((payload) => {
    setPopupData(payload);
  }, []);

  const chartData = useMemo(() => {
    return filteredData.slice(0, 200).map((d, i) => {
      const shortBatch = d.batchNo.slice(-6);
      const yearSuffix = d.year ? String(d.year).slice(-2) : null;
      const label = yearSuffix ? `${shortBatch} / ${yearSuffix}` : shortBatch;
      return {
        ...d,
        index: i + 1,
        shortBatch: label,
      };
    });
  }, [filteredData]);

  const avgMinutes = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData.reduce((a, b) => a + b.dryingMinutes, 0) / chartData.length;
  }, [chartData]);

  const title = useMemo(() => {
    const parts = [];
    if (filters.codeProduct) parts.push(`Code: ${filters.codeProduct}`);
    if (filters.kg)          parts.push(`(${filters.kg} Kg)`);
    if (filters.year)        parts.push(`Tahun ${filters.year}`);
    return parts.length > 0
      ? `Trend Drying Time: ${parts.join(' ')}`
      : 'Trend Sub Total Drying Time (Semua Produk)';
  }, [filters]);

  const yDomain = useMemo(() => {
    if (!chartData.length) return [0, 360];
    const mins = chartData.map(d => d.dryingMinutes);
    const minV = Math.max(0, Math.min(...mins) - 20);
    const maxV = Math.max(...mins) + 30;
    return [minV, maxV];
  }, [chartData]);

  // Hitung jumlah anomali (threshold sama dengan CustomDot: deviasi > 15%)
  const anomalyCount = useMemo(() => {
    if (!avgMinutes) return 0;
    const threshold = avgMinutes * 0.15;
    return chartData.filter(d => Math.abs(d.dryingMinutes - avgMinutes) > threshold).length;
  }, [chartData, avgMinutes]);

  // Tampilkan badge anomali hanya saat filter spesifik aktif
  const isSpecificFilter = !!(filters.codeProduct || filters.productName);

  if (!filteredData.length) {
    return (
      <div className="glass-card p-6 mb-6 flex flex-col items-center justify-center min-h-[300px]">
        <TrendingUp className="w-12 h-12 text-slate-600 mb-3" />
        <p className="text-slate-500 text-sm">Tidak ada data untuk ditampilkan.</p>
        <p className="text-slate-600 text-xs mt-1">Ubah filter untuk melihat data.</p>
      </div>
    );
  }

  return (
    <>
      {/* Center popup modal rendered at root level */}
      <BatchPopup data={popupData} onClose={() => setPopupData(null)} />

      <div className="glass-card p-6 mb-6 fade-in-up">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-100">{title}</h2>
            <p className="text-xs text-slate-500 mt-1">
              Menampilkan {chartData.length} batch
              {chartData.length < filteredData.length && ` (dari ${filteredData.length} total)`}
            </p>
            {isSpecificFilter && (
              <div className="flex items-center gap-2 mt-2">
                {anomalyCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    {anomalyCount} anomali terdeteksi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Tidak ada anomali
                  </span>
                )}
                <span className="text-[10px] text-slate-600">
                  ({((anomalyCount / chartData.length) * 100).toFixed(1)}% dari total batch)
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-amber-400 rounded" />
              <span className="text-slate-400">Drying Time</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 border-t-2 border-dashed border-red-400/70" />
              <span className="text-slate-400">Rata-rata ({minutesToTime(avgMinutes)})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-400 ring-2 ring-amber-400/30" />
              <span className="text-slate-400">Anomali</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={360}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 20, left: 0, bottom: 60 }}
          >
            <defs>
              <linearGradient id="dryingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="shortBatch"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              angle={-45}
              textAnchor="end"
              interval={Math.max(0, Math.floor(chartData.length / 20) - 1)}
              height={70}
            />
            <YAxis
              tickFormatter={formatYTick}
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={yDomain}
              width={55}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'rgba(245,158,11,0.2)', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <ReferenceLine
              y={avgMinutes}
              stroke="rgba(239,68,68,0.6)"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: `Avg: ${minutesToTime(avgMinutes)}`,
                position: 'right',
                fill: '#ef4444',
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <Area
              type="monotone"
              dataKey="dryingMinutes"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#dryingGradient)"
              dot={<CustomDot avgMinutes={avgMinutes} onClick={handleDotClick} />}
              activeDot={{ r: 7, fill: '#fbbf24', stroke: '#0a0f1e', strokeWidth: 2 }}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

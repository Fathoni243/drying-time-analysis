import { useMemo } from 'react';
import { SlidersHorizontal, X, Calendar, Tag } from 'lucide-react';

// ── Constants ────────────────────────────────────────────────────────────────

export const BISCUIT_CODES = [
  'Biscuit-Alamii',
  'Biscuit-Export',
  'Biscuit-Lokal',
  'Biscuit-PMT',
];

// ── Shared input styles ───────────────────────────────────────────────────────

const inputClass = `
  w-full bg-[#0d1528] border border-teal-500/15 text-slate-200 text-sm rounded-xl
  px-3 py-2.5 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/30
  hover:border-teal-500/30 transition-all duration-200
`;

// ── Sub-components ────────────────────────────────────────────────────────────

function MonthInput({ id, label, value, onChange, min, max }) {
  return (
    <div className="flex-1 space-y-1">
      <span className="text-[11px] text-slate-500 font-medium">{label}</span>
      <input
        id={id}
        type="month"
        value={value}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value)}
        className={inputClass}
        style={{
          colorScheme: 'dark',
        }}
      />
    </div>
  );
}

function CodeCheckbox({ code, checked, onChange }) {
  // Shorten label: "Biscuit-Alamii" → "Alamii"
  const shortLabel = code.replace('Biscuit-', '');
  const id = `chk-biscuit-${shortLabel.toLowerCase()}`;

  return (
    <label
      htmlFor={id}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer
        transition-all duration-200
        ${checked
          ? 'bg-teal-500/10 border-teal-500/40 text-teal-300'
          : 'bg-transparent border-slate-700/50 text-slate-500 hover:border-teal-500/25 hover:text-slate-300'}
      `}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(code, e.target.checked)}
        className="sr-only"
      />
      {/* Custom checkbox indicator */}
      <span className={`
        inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-all duration-200
        ${checked ? 'bg-teal-500 border-teal-400' : 'bg-transparent border-slate-600'}
      `}>
        {checked && (
          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5.5L4 8L8.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      {shortLabel}
    </label>
  );
}

// ── Main FilterBar ─────────────────────────────────────────────────────────────

/**
 * @param {{
 *   filters: { startMonth: string, endMonth: string, codes: string[] },
 *   onFilterChange: (key: string, value: any) => void,
 *   onReset: () => void,
 *   dataMinMonth: string,
 *   dataMaxMonth: string,
 * }} props
 */
export default function FilterBar({ filters, onFilterChange, onReset, dataMinMonth, dataMaxMonth }) {
  const hasActiveFilter = useMemo(() =>
    filters.startMonth || filters.endMonth || filters.codes.length < BISCUIT_CODES.length,
    [filters]
  );

  const handleCodeToggle = (code, checked) => {
    let next = checked
      ? [...filters.codes, code]
      : filters.codes.filter(c => c !== code);

    // Jika tidak ada yang tercentang → reset ke semua (jangan biarkan kosong)
    if (next.length === 0) next = [...BISCUIT_CODES];
    onFilterChange('codes', next);
  };

  // Validasi range bulan
  const monthRangeError =
    filters.startMonth && filters.endMonth &&
    filters.startMonth > filters.endMonth;

  return (
    <div id="filter-bar-biscuit" className="glass-card p-5 mb-6 fade-in-up">
      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-teal-400" />
          <span className="text-sm font-semibold text-slate-200">Filter Data</span>
          {hasActiveFilter && (
            <span className="px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-400 text-xs font-medium border border-teal-500/25">
              Aktif
            </span>
          )}
        </div>
        {hasActiveFilter && (
          <button
            id="btn-biscuit-reset-filter"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-400 transition-colors duration-200"
          >
            <X className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Periode (Month Range) ── */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-teal-500/70" />
            Periode (Bulan &amp; Tahun)
          </label>
          <div className="flex items-center gap-3">
            <MonthInput
              id="filter-biscuit-start-month"
              label="Dari"
              value={filters.startMonth}
              onChange={val => onFilterChange('startMonth', val)}
              min={dataMinMonth}
              max={filters.endMonth || dataMaxMonth}
            />
            <span className="text-slate-600 font-medium text-sm mt-4 shrink-0">→</span>
            <MonthInput
              id="filter-biscuit-end-month"
              label="Sampai"
              value={filters.endMonth}
              onChange={val => onFilterChange('endMonth', val)}
              min={filters.startMonth || dataMinMonth}
              max={dataMaxMonth}
            />
          </div>
          {monthRangeError && (
            <p className="flex items-center gap-1 text-[11px] text-red-400 mt-1 animate-pulse">
              <span className="inline-block w-1 h-1 rounded-full bg-red-400 shrink-0" />
              Bulan mulai tidak boleh melebihi bulan selesai
            </p>
          )}
          {(filters.startMonth || filters.endMonth) && !monthRangeError && (
            <p className="text-[11px] text-slate-500 mt-1">
              {filters.startMonth || dataMinMonth} → {filters.endMonth || dataMaxMonth}
            </p>
          )}
        </div>

        {/* ── Code (Multi-select Checkbox) ── */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Tag className="w-3.5 h-3.5 text-teal-500/70" />
            Code Produk
            <span className="text-slate-600">
              ({filters.codes.length}/{BISCUIT_CODES.length} dipilih)
            </span>
          </label>
          <div className="flex flex-wrap gap-2">
            {BISCUIT_CODES.map(code => (
              <CodeCheckbox
                key={code}
                code={code}
                checked={filters.codes.includes(code)}
                onChange={handleCodeToggle}
              />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

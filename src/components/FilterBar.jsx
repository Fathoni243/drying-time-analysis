import { useMemo, useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X, Calendar, Tag, Weight, Search } from 'lucide-react';

export default function FilterBar({ data, filters, onFilterChange, onReset }) {
  const [codeSearch, setCodeSearch]         = useState(filters.codeProduct || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef    = useRef(null);
  const dropdownRef = useRef(null);

  // Sync search text when filters are reset externally
  useEffect(() => {
    if (!filters.codeProduct) setCodeSearch('');
  }, [filters.codeProduct]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (
        !inputRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Filter option derivation ─────────────────────────────────────────────

  const years = useMemo(() => {
    const set = new Set(data.map(d => d.year).filter(Boolean));
    return Array.from(set).sort((a, b) => a - b);
  }, [data]);

  /** Unique Code Products, filtered by selected year */
  const codeProductOptions = useMemo(() => {
    const source = filters.year
      ? data.filter(d => d.year === parseInt(filters.year))
      : data;

    // Build a map: codeProduct → productName (for display hint)
    const map = new Map();
    source.forEach(d => {
      if (d.codeProduct && !map.has(d.codeProduct)) {
        map.set(d.codeProduct, d.productName);
      }
    });

    const entries = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b));

    if (!codeSearch.trim()) return entries;
    const q = codeSearch.toLowerCase();
    return entries.filter(
      ([code, name]) =>
        code.toLowerCase().includes(q) ||
        name.toLowerCase().includes(q)
    );
  }, [data, filters.year, codeSearch]);

  /** Planning (Kg) options, filtered by year + selected code product */
  const kgOptions = useMemo(() => {
    let source = data;
    if (filters.year)        source = source.filter(d => d.year === parseInt(filters.year));
    if (filters.codeProduct) source = source.filter(d => d.codeProduct === filters.codeProduct);
    const set = new Set(source.map(d => d.planningKg).filter(v => v > 0));
    return Array.from(set).sort((a, b) => a - b);
  }, [data, filters.year, filters.codeProduct]);

  const hasActiveFilter = filters.year || filters.codeProduct || filters.kg;

  // ── Event handlers ───────────────────────────────────────────────────────

  const handleSelectCode = (code) => {
    setCodeSearch(code);
    setShowSuggestions(false);
    onFilterChange('codeProduct', code);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setCodeSearch(val);
    setShowSuggestions(true);
    if (!val.trim()) onFilterChange('codeProduct', '');
  };

  const handleClearCode = () => {
    setCodeSearch('');
    setShowSuggestions(false);
    onFilterChange('codeProduct', '');
  };

  // ── Shared styles ────────────────────────────────────────────────────────

  const selectClass = `
    w-full bg-[#0d1528] border border-amber-500/15 text-slate-200 text-sm rounded-xl
    px-3 py-2.5 pr-9 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30
    hover:border-amber-500/30 transition-all duration-200 cursor-pointer
  `;

  return (
    <div className="glass-card p-5 mb-6 fade-in-up">
      {/* Title row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-slate-200">Filter Data</span>
          {hasActiveFilter && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium border border-amber-500/25">
              Aktif
            </span>
          )}
        </div>
        {hasActiveFilter && (
          <button
            id="btn-reset-filter"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors duration-200"
          >
            <X className="w-3.5 h-3.5" />
            Reset Filter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* ── Year ── */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Calendar className="w-3.5 h-3.5 text-amber-500/70" />
            Tahun
          </label>
          <select
            id="filter-year"
            className={selectClass}
            value={filters.year}
            onChange={e => onFilterChange('year', e.target.value)}
          >
            <option value="">Semua Tahun</option>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>

        {/* ── Code Product (searchable) ── */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Tag className="w-3.5 h-3.5 text-amber-500/70" />
            Code Product
            {filters.codeProduct && (
              <span className="text-amber-400 font-semibold">— terpilih</span>
            )}
          </label>
          <div className="relative">
            {/* Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500 pointer-events-none z-10" />
              <input
                id="filter-code-search"
                ref={inputRef}
                type="text"
                placeholder="Cari code / nama produk..."
                value={codeSearch}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                autoComplete="off"
                className={`
                  w-full bg-[#0d1528] border text-slate-200 text-sm rounded-xl
                  pl-9 pr-8 py-2.5
                  focus:outline-none focus:ring-1 focus:ring-amber-500/30
                  hover:border-amber-500/30 transition-all duration-200
                  ${filters.codeProduct
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-amber-500/15 focus:border-amber-500/50'}
                `}
              />
              {codeSearch && (
                <button
                  onClick={handleClearCode}
                  className="absolute right-3 text-slate-500 hover:text-amber-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestion dropdown */}
            {showSuggestions && codeProductOptions.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-amber-500/20 bg-[#0d1528] shadow-2xl shadow-black/60"
              >
                {codeProductOptions.map(([code, name]) => (
                  <button
                    key={code}
                    onMouseDown={() => handleSelectCode(code)}
                    className={`
                      w-full text-left px-3 py-2.5 transition-colors duration-150
                      border-b border-white/[0.04] last:border-0
                      ${filters.codeProduct === code
                        ? 'bg-amber-500/15 text-amber-300'
                        : 'hover:bg-amber-500/8 hover:text-amber-300'}
                    `}
                  >
                    <span className="block text-sm font-semibold text-slate-200">
                      <HighlightMatch text={code} query={codeSearch} />
                    </span>
                    <span className="block text-xs text-slate-500 mt-0.5 truncate">
                      <HighlightMatch text={name} query={codeSearch} />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* No results state */}
            {showSuggestions && codeSearch && codeProductOptions.length === 0 && (
              <div className="absolute z-50 mt-1 w-full rounded-xl border border-amber-500/20 bg-[#0d1528] shadow-2xl px-3 py-3">
                <p className="text-xs text-slate-500 text-center">Tidak ada code product ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Planning (Kg) ── */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Weight className="w-3.5 h-3.5 text-amber-500/70" />
            Planning (Kg)
          </label>
          <select
            id="filter-kg"
            className={selectClass}
            value={filters.kg}
            onChange={e => onFilterChange('kg', e.target.value)}
          >
            <option value="">Semua Kg</option>
            {kgOptions.map(k => <option key={k} value={k}>{k} kg</option>)}
          </select>
        </div>

      </div>
    </div>
  );
}

// ── Helper: highlight matched substring ─────────────────────────────────────
function HighlightMatch({ text, query }) {
  if (!query?.trim()) return <span>{text}</span>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <span>{text}</span>;
  return (
    <span>
      {text.slice(0, idx)}
      <mark className="bg-amber-400/25 text-amber-300 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </span>
  );
}

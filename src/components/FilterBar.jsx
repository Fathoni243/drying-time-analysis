import { useMemo, useState, useRef, useEffect } from 'react';
import { SlidersHorizontal, X, Calendar, Package, Weight, Search } from 'lucide-react';

export default function FilterBar({ data, filters, onFilterChange, onReset }) {
  const [productSearch, setProductSearch] = useState(filters.product || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  // Sync search text when filter is reset externally
  useEffect(() => {
    if (!filters.product) setProductSearch('');
  }, [filters.product]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchRef.current && !searchRef.current.contains(e.target) &&
        dropdownRef.current && !dropdownRef.current.contains(e.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derive years from full data
  const years = useMemo(() => {
    const set = new Set(data.map(d => d.year).filter(Boolean));
    return Array.from(set).sort((a, b) => a - b);
  }, [data]);

  // Filter product list based on search text + selected year
  const filteredProducts = useMemo(() => {
    let source = data;
    if (filters.year) source = source.filter(d => d.year === parseInt(filters.year));
    const set = new Set(source.map(d => d.productName).filter(Boolean));
    const allProducts = Array.from(set).sort();
    if (!productSearch.trim()) return allProducts;
    const q = productSearch.toLowerCase();
    return allProducts.filter(p => p.toLowerCase().includes(q));
  }, [data, filters.year, productSearch]);

  // Kg options based on year + selected product
  const kgOptions = useMemo(() => {
    let filtered = data;
    if (filters.year) filtered = filtered.filter(d => d.year === parseInt(filters.year));
    if (filters.product) filtered = filtered.filter(d => d.productName === filters.product);
    const set = new Set(filtered.map(d => d.planningKg).filter(v => v > 0));
    return Array.from(set).sort((a, b) => a - b);
  }, [data, filters.year, filters.product]);

  const hasActiveFilter = filters.year || filters.product || filters.kg;

  const selectClass = `
    w-full bg-[#0d1528] border border-amber-500/15 text-slate-200 text-sm rounded-xl
    px-3 py-2.5 pr-9 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30
    hover:border-amber-500/30 transition-all duration-200 cursor-pointer
  `;

  const handleSelectProduct = (product) => {
    setProductSearch(product);
    setShowSuggestions(false);
    onFilterChange('product', product);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setProductSearch(val);
    setShowSuggestions(true);
    // If cleared, reset product filter
    if (!val.trim()) {
      onFilterChange('product', '');
    }
  };

  const handleClearProduct = () => {
    setProductSearch('');
    setShowSuggestions(false);
    onFilterChange('product', '');
  };

  return (
    <div className="glass-card p-5 mb-6 fade-in-up">
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
        {/* Year */}
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
            {years.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Product Search */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Package className="w-3.5 h-3.5 text-amber-500/70" />
            Produk
            {filters.product && (
              <span className="text-amber-400 font-semibold">— terpilih</span>
            )}
          </label>
          <div className="relative">
            {/* Search Input */}
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-3.5 h-3.5 text-slate-500 pointer-events-none z-10" />
              <input
                id="filter-product-search"
                ref={searchRef}
                type="text"
                placeholder="Cari nama produk..."
                value={productSearch}
                onChange={handleSearchChange}
                onFocus={() => setShowSuggestions(true)}
                className={`
                  w-full bg-[#0d1528] border text-slate-200 text-sm rounded-xl
                  pl-9 pr-8 py-2.5
                  focus:outline-none focus:ring-1 focus:ring-amber-500/30
                  hover:border-amber-500/30 transition-all duration-200
                  ${filters.product
                    ? 'border-amber-500/40 bg-amber-500/5'
                    : 'border-amber-500/15 focus:border-amber-500/50'
                  }
                `}
                autoComplete="off"
              />
              {productSearch && (
                <button
                  onClick={handleClearProduct}
                  className="absolute right-3 text-slate-500 hover:text-amber-400 transition-colors"
                  title="Hapus pilihan"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Suggestion Dropdown */}
            {showSuggestions && filteredProducts.length > 0 && (
              <div
                ref={dropdownRef}
                className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-xl border border-amber-500/20 bg-[#0d1528] shadow-2xl shadow-black/60"
              >
                {filteredProducts.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-slate-500 text-center">
                    Tidak ada produk ditemukan
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product}
                      onMouseDown={() => handleSelectProduct(product)}
                      className={`
                        w-full text-left px-3 py-2.5 text-sm transition-colors duration-150
                        border-b border-white/[0.04] last:border-0
                        ${filters.product === product
                          ? 'bg-amber-500/15 text-amber-300 font-medium'
                          : 'text-slate-300 hover:bg-amber-500/8 hover:text-amber-300'
                        }
                      `}
                    >
                      {/* Highlight matched text */}
                      <HighlightMatch text={product} query={productSearch} />
                    </button>
                  ))
                )}
              </div>
            )}

            {/* No results */}
            {showSuggestions && productSearch && filteredProducts.length === 0 && (
              <div className="absolute z-100 mt-1 w-full rounded-xl border border-amber-500/20 bg-[#0d1528] shadow-2xl shadow-black/60 px-3 py-3">
                <p className="text-xs text-slate-500 text-center">Tidak ada produk ditemukan</p>
              </div>
            )}
          </div>
        </div>

        {/* Planning Kg */}
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
            {kgOptions.map(k => (
              <option key={k} value={k}>{k} kg</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// Utility component to highlight matched substring
function HighlightMatch({ text, query }) {
  if (!query.trim()) return <span>{text}</span>;
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

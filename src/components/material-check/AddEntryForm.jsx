import { useRef, useEffect } from 'react';
import { Plus, Search, XCircle, Info } from 'lucide-react';

/**
 * Form untuk menambahkan satu entry rencana produksi.
 *
 * @param {{
 *   form: object,
 *   formError: string,
 *   searchQuery: string,
 *   showDropdown: boolean,
 *   filteredProductOptions: Array,
 *   loading: boolean,
 *   hasFetched: boolean,
 *   onFormChange: (key, value) => void,
 *   onSelectProduct: (product) => void,
 *   onSearchChange: (query: string) => void,
 *   onToggleDropdown: (show: boolean) => void,
 *   onAdd: () => void,
 * }} props
 */
export default function AddEntryForm({
  form,
  formError,
  searchQuery,
  showDropdown,
  filteredProductOptions,
  loading,
  hasFetched,
  onFormChange,
  onSelectProduct,
  onSearchChange,
  onToggleDropdown,
  onAdd,
}) {
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        onToggleDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onToggleDropdown]);

  return (
    <div className="glass-card p-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
        <Plus className="w-4 h-4 text-amber-400" />
        Tambah Rencana Produksi
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">

        {/* Kode Produk — autocomplete */}
        <div className="xl:col-span-2 relative" ref={dropdownRef}>
          <label className="block text-xs text-slate-500 mb-1.5 font-medium">Kode Produk *</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
            <input
              id="field-kode-produk"
              type="text"
              placeholder={loading ? 'Memuat produk…' : 'Cari kode / nama produk…'}
              value={searchQuery}
              onChange={e => {
                onSearchChange(e.target.value);
                onToggleDropdown(true);
              }}
              onFocus={() => onToggleDropdown(true)}
              disabled={loading || !hasFetched}
              className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-800/60 border border-white/[0.08] text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 focus:bg-slate-800 transition-all disabled:opacity-50"
            />
          </div>

          {/* Dropdown list */}
          {showDropdown && filteredProductOptions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl bg-[#0d1528] border border-white/[0.1] shadow-2xl max-h-56 overflow-y-auto">
              {filteredProductOptions.map(p => (
                <button
                  key={p.kodeProduk}
                  onMouseDown={() => onSelectProduct(p)}
                  className="w-full text-left px-3 py-2.5 hover:bg-amber-500/10 transition-colors border-b border-white/[0.04] last:border-0"
                >
                  <p className="text-xs font-semibold text-amber-400">{p.kodeProduk}</p>
                  <p className="text-xs text-slate-400 truncate">{p.namaProduk}</p>
                </button>
              ))}
            </div>
          )}
          {showDropdown && searchQuery && filteredProductOptions.length === 0 && hasFetched && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl bg-[#0d1528] border border-white/[0.1] shadow-2xl px-3 py-3 text-center text-xs text-slate-500">
              Produk tidak ditemukan
            </div>
          )}
        </div>

        {/* Qty Plan */}
        <div>
          <label htmlFor="field-qty-plan" className="block text-xs text-slate-500 mb-1.5 font-medium">Qty Plan (kg) *</label>
          <input
            id="field-qty-plan"
            type="number"
            min="0"
            step="any"
            placeholder="0"
            value={form.qtyPlanKg}
            onChange={e => onFormChange('qtyPlanKg', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-white/[0.08] text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 focus:bg-slate-800 transition-all"
          />
        </div>

        {/* Jumlah Batch */}
        <div>
          <label htmlFor="field-jumlah-batch" className="block text-xs text-slate-500 mb-1.5 font-medium">Jumlah Batch</label>
          <input
            id="field-jumlah-batch"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={form.jumlahBatch}
            onChange={e => onFormChange('jumlahBatch', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-white/[0.08] text-slate-200 text-sm placeholder:text-slate-600 focus:outline-none focus:border-amber-500/40 focus:bg-slate-800 transition-all"
          />
        </div>

        {/* Tanggal Produksi */}
        <div>
          <label htmlFor="field-tanggal-produksi" className="block text-xs text-slate-500 mb-1.5 font-medium">Tanggal Produksi</label>
          <input
            id="field-tanggal-produksi"
            type="date"
            value={form.tanggalProduksi}
            onChange={e => onFormChange('tanggalProduksi', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-white/[0.08] text-slate-200 text-sm focus:outline-none focus:border-amber-500/40 focus:bg-slate-800 transition-all [color-scheme:dark]"
          />
        </div>

        {/* Line */}
        <div>
          <label htmlFor="field-line" className="block text-xs text-slate-500 mb-1.5 font-medium">Line</label>
          <select
            id="field-line"
            value={form.line}
            onChange={e => onFormChange('line', e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-white/[0.08] text-slate-200 text-sm focus:outline-none focus:border-amber-500/40 focus:bg-slate-800 transition-all"
          >
            <option value="">— Pilih Line —</option>
            <option value="LINE 1">LINE 1</option>
            <option value="LINE 2">LINE 2</option>
            <option value="LINE 3">LINE 3</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {formError && (
        <p className="mt-3 text-xs text-red-400 flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          {formError}
        </p>
      )}

      {/* Submit row */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[10px] text-slate-600 flex items-center gap-1">
          <Info className="w-3 h-3" />
          Data entri tersimpan otomatis di browser ini.
        </p>
        <button
          id="btn-tambah-produksi"
          onClick={onAdd}
          disabled={loading && !hasFetched}
          className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          Tambah Produksi
        </button>
      </div>
    </div>
  );
}

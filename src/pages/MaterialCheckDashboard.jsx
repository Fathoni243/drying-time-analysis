import { useState, useEffect, useMemo, useCallback } from 'react';

import Sidebar from '../components/shared/Sidebar';
import Header from '../components/material-check/Header';
import AddEntryForm from '../components/material-check/AddEntryForm';
import EntryCard from '../components/material-check/EntryCard';
import { SummaryBar } from '../components/material-check/SummaryBar';
import { LoadingState, ErrorState, EmptyState } from '../components/material-check/StateViews';

import { useMaterialCheckData } from '../hooks/useMaterialCheckData';
import { computeAll } from '../utils/materialCheckUtils';

// ── Constants ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'material-check-entries';

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── MaterialCheckDashboard ────────────────────────────────────────────────────

export default function MaterialCheckDashboard() {
  // ── Data fetching ──────────────────────────────────────────────────────────
  const {
    stockMap, incomingMap, productFormulaMap,
    loading, error, lastFetched, hasFetched, refetch,
  } = useMaterialCheckData();

  // ── Entries state (persisted ke localStorage) ──────────────────────────────
  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
      console.error('Gagal simpan entries ke localStorage:', e);
    }
  }, [entries]);

  // ── Computed entries (hasil kalkulasi cascading) ────────────────────────────
  const computedEntries = useMemo(() => {
    if (!hasFetched) return entries.map(e => ({ ...e, hasil: [] }));
    return computeAll(entries, stockMap, incomingMap, productFormulaMap);
  }, [entries, stockMap, incomingMap, productFormulaMap, hasFetched]);

  // ── Form state ────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    kodeProduk: '', qtyPlanKg: '', jumlahBatch: '', tanggalProduksi: '', line: '',
  });
  const [formError, setFormError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Daftar produk untuk dropdown, sorted
  const productOptions = useMemo(() =>
    Object.values(productFormulaMap).sort((a, b) => a.kodeProduk.localeCompare(b.kodeProduk)),
    [productFormulaMap]
  );

  // Filter produk berdasarkan search query
  const filteredProductOptions = useMemo(() => {
    if (!searchQuery || searchQuery.includes('—')) return productOptions;
    const q = searchQuery.toLowerCase();
    return productOptions.filter(
      p => p.kodeProduk.toLowerCase().includes(q) || p.namaProduk.toLowerCase().includes(q)
    );
  }, [productOptions, searchQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleFormChange = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (formError) setFormError('');
  }, [formError]);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    if (!query) setForm(prev => ({ ...prev, kodeProduk: '' }));
    if (formError) setFormError('');
  }, [formError]);

  const handleSelectProduct = useCallback((product) => {
    setForm(prev => ({ ...prev, kodeProduk: product.kodeProduk }));
    setSearchQuery(`${product.kodeProduk} — ${product.namaProduk}`);
    setShowDropdown(false);
  }, []);

  const handleAddEntry = useCallback(() => {
    if (!form.kodeProduk) {
      setFormError('Pilih Kode Produk terlebih dahulu.');
      return;
    }
    if (!productFormulaMap[form.kodeProduk]) {
      setFormError(`Kode Produk "${form.kodeProduk}" tidak ditemukan di data.`);
      return;
    }
    const qty = parseFloat(form.qtyPlanKg);
    if (!form.qtyPlanKg || isNaN(qty) || qty <= 0) {
      setFormError('Qty Plan (kg) harus berupa angka positif.');
      return;
    }
    const formula = productFormulaMap[form.kodeProduk];
    const newEntry = {
      id: genId(),
      kodeProduk: form.kodeProduk,
      namaProduk: formula?.namaProduk ?? form.kodeProduk,
      qtyPlanKg: qty,
      jumlahBatch: form.jumlahBatch ? Number(form.jumlahBatch) : '',
      tanggalProduksi: form.tanggalProduksi,
      line: form.line,
    };
    setEntries(prev => [...prev, newEntry]);
    setForm({ kodeProduk: '', qtyPlanKg: '', jumlahBatch: '', tanggalProduksi: '', line: '' });
    setSearchQuery('');
    setFormError('');
  }, [form, productFormulaMap]);

  const handleDelete = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    if (!window.confirm('Yakin ingin menghapus semua entri? Data yang tersimpan di browser akan ikut dihapus.')) return;
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Auto-fetch saat mount
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-mesh">
      <Sidebar />

      <Header loading={loading} lastFetched={lastFetched} onRefresh={refetch} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Form Tambah Entry */}
        <AddEntryForm
          form={form}
          formError={formError}
          searchQuery={searchQuery}
          showDropdown={showDropdown}
          filteredProductOptions={filteredProductOptions}
          loading={loading}
          hasFetched={hasFetched}
          onFormChange={handleFormChange}
          onSelectProduct={handleSelectProduct}
          onSearchChange={handleSearchChange}
          onToggleDropdown={setShowDropdown}
          onAdd={handleAddEntry}
        />

        {/* Loading / Error states */}
        {loading && !hasFetched && <LoadingState />}
        {error && !loading && <ErrorState error={error} onRetry={refetch} />}

        {/* Results */}
        {hasFetched && !error && (
          <>
            {computedEntries.length > 0 && (
              <SummaryBar entries={computedEntries} onClearAll={handleClearAll} />
            )}

            {computedEntries.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-4">
                {computedEntries.map((entry, i) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    index={i}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <footer className="text-center py-6 text-xs text-slate-700 border-t border-white/[0.04]">
          Pengecekan Kecukupan Material · PPIC Dashboard · Satoria Group
        </footer>

      </main>
    </div>
  );
}

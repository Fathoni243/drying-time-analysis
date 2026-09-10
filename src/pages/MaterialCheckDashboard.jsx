import { useState, useEffect, useMemo, useCallback } from 'react';

import Sidebar from '../components/shared/Sidebar';
import Header from '../components/material-check/Header';
import AddEntryForm from '../components/material-check/AddEntryForm';
import EntryCard from '../components/material-check/EntryCard';
import { SummaryBar } from '../components/material-check/SummaryBar';
import { LoadingState, ErrorState, EmptyState } from '../components/material-check/StateViews';
import AlertToast from '../components/shared/ui/AlertToast.jsx';

import { useMaterialCheckData } from '../hooks/useMaterialCheckData';
import { computeAll } from '../utils/materialCheckUtils';
import { exportMaterialCheckToExcel } from '../utils/excel/exportMaterialCheck.js';

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
  const [searchQuery, setSearchQuery]     = useState('');
  const [showDropdown, setShowDropdown]   = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportToast, setExportToast]     = useState({ show: false, type: 'success', title: '', message: '' });

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
  }, []);

  const handleSearchChange = useCallback((query) => {
    setSearchQuery(query);
    if (!query) setForm(prev => ({ ...prev, kodeProduk: '' }));
  }, []);

  const handleSelectProduct = useCallback((product) => {
    setForm(prev => ({ ...prev, kodeProduk: product.kodeProduk }));
    setSearchQuery(`${product.kodeProduk} — ${product.namaProduk}`);
    setShowDropdown(false);
  }, []);

  const handleAddEntry = useCallback(() => {
    if (!form.kodeProduk) {
      return { ok: false, message: 'Pilih Kode Produk terlebih dahulu.' };
    }
    if (!productFormulaMap[form.kodeProduk]) {
      return { ok: false, message: `Kode Produk "${form.kodeProduk}" tidak ditemukan di data.` };
    }
    const qty = parseFloat(form.qtyPlanKg);
    if (!form.qtyPlanKg || isNaN(qty) || qty <= 0) {
      return { ok: false, message: 'Qty Plan (kg) harus berupa angka positif.' };
    }
    const formula = productFormulaMap[form.kodeProduk];
    const namaProduk = formula?.namaProduk ?? form.kodeProduk;
    const newEntry = {
      id: genId(),
      kodeProduk: form.kodeProduk,
      namaProduk,
      qtyPlanKg: qty,
      jumlahBatch: form.jumlahBatch ? Number(form.jumlahBatch) : '',
      tanggalProduksi: form.tanggalProduksi,
      line: form.line,
    };
    setEntries(prev => [...prev, newEntry]);
    setForm({ kodeProduk: '', qtyPlanKg: '', jumlahBatch: '', tanggalProduksi: '', line: '' });
    setSearchQuery('');
    return { ok: true, namaProduk };
  }, [form, productFormulaMap]);

  const handleDelete = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleClearAll = useCallback(() => {
    if (!window.confirm('Yakin ingin menghapus semua entri? Data yang tersimpan di browser akan ikut dihapus.')) return;
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const handleExport = useCallback(async () => {
    if (!computedEntries.length) {
      setExportToast({
        show: true, type: 'warning',
        title: 'Tidak ada data',
        message: 'Tambahkan setidaknya satu produk sebelum melakukan export.',
      });
      return;
    }
    setExportLoading(true);
    try {
      await exportMaterialCheckToExcel(computedEntries);
      setExportToast({
        show: true, type: 'success',
        title: 'Export berhasil',
        message: `File Excel telah didownload (${computedEntries.length} produk).`,
      });
    } catch (err) {
      setExportToast({
        show: true, type: 'error',
        title: 'Export gagal',
        message: err.message ?? 'Terjadi kesalahan saat membuat file Excel.',
      });
    } finally {
      setExportLoading(false);
    }
  }, [computedEntries]);

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
              <SummaryBar
                entries={computedEntries}
                onClearAll={handleClearAll}
                onExport={handleExport}
                exportLoading={exportLoading}
              />
            )}

            {/* Toast hasil export */}
            <AlertToast
              show={exportToast.show}
              type={exportToast.type}
              title={exportToast.title}
              message={exportToast.message}
              autoDismissMs={exportToast.type === 'success' ? 4000 : 8000}
              onDismiss={() => setExportToast(t => ({ ...t, show: false }))}
            />

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

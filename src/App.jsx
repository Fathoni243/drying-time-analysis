import { useState, useMemo, useTransition } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSheetData } from './hooks/useSheetData';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import StatsCards from './components/StatsCards';
import DryingTrendChart from './components/DryingTrendChart';
import ProductCompareChart from './components/ProductCompareChart';
import DryingTickerWidget from './components/DryingTickerWidget';
import DataTable from './components/DataTable';
import LoadingSpinner from './components/LoadingSpinner';
import FilterTransitionOverlay from './components/FilterTransitionOverlay';
import { formatedDate } from './utils/dateFormat';

export default function App() {
  const { data, loading, error, refetch, lastFetched } = useSheetData();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    year:        '',
    codeProduct: '',  // replaces old "product" (name-based) filter
    kg:          '',
  });

  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (key, value) => {
    startTransition(() => {
      setFilters(prev => {
        const next = { ...prev, [key]: value };
        // Cascade reset on year change
        if (key === 'year') { next.codeProduct = ''; next.kg = ''; }
        // Reset kg when code product changes
        if (key === 'codeProduct') { next.kg = ''; }
        return next;
      });
    });
  };

  const handleReset = () => startTransition(() => setFilters({ year: '', codeProduct: '', kg: '' }));

  // ── Derived filtered data (used by Trend Chart, Stats Cards, Data Table) ──
  const filteredData = useMemo(() => {
    let d = data;
    if (filters.year)        d = d.filter(r => r.year === parseInt(filters.year));
    if (filters.codeProduct) d = d.filter(r => r.codeProduct === filters.codeProduct);
    if (filters.kg)          d = d.filter(r => r.planningKg === parseFloat(filters.kg));
    return d;
  }, [data, filters]);

  const latestData = data.at(-1);

  return (
    <div className="min-h-screen bg-mesh">
      <Header lastFetched={lastFetched} onRefresh={refetch} loading={loading} latestData={latestData} />

      {/* Filter transition overlay — blocks interaction during heavy re-render */}
      <FilterTransitionOverlay show={isPending} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">

        {/* ── Error banner ── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 fade-in-up">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
            <div>
              <p className="font-semibold text-sm">Gagal memuat data</p>
              <p className="text-xs text-red-400/80 mt-0.5">{error}</p>
              <button
                onClick={refetch}
                className="mt-2 text-xs underline hover:text-red-200 transition-colors"
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && !error && <LoadingSpinner />}

        {/* ── Dashboard ── */}
        {!loading && !error && (
          <>
            {/* Filters */}
            <FilterBar
              data={data}
              filters={filters}
              onFilterChange={handleFilterChange}
              onReset={handleReset}
            />

            {/* Stats Cards */}
            <StatsCards filteredData={filteredData} />

            {/* Trend Chart — always full width */}
            <div className="mb-6">
              <DryingTrendChart filteredData={filteredData} filters={filters} />
            </div>

            {/* Bottom row: Bar Chart + Ticker Widget side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <ProductCompareChart data={data} filters={filters} />
              <DryingTickerWidget  data={data} filters={filters} onFilterApply={handleFilterChange} onFilterReset={handleReset} />
            </div>

            {/* Data Table */}
            <DataTable filteredData={filteredData} />

            {/* Footer */}
            <footer className="text-center py-4 text-xs text-slate-600 border-t border-white/[0.04]">
              Drying Time Analysis Dashboard · Data diambil dari Google Sheets
              {latestData?.date && (
                <span> · Terakhir diperbarui <span className="text-amber-400 font-medium">{formatedDate(latestData.date)}</span></span>
              )}
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

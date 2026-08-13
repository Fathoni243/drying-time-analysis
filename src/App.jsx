import { useState, useMemo } from 'react';
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

export default function App() {
  const { data, loading, error, refetch, lastFetched } = useSheetData();

  const [filters, setFilters] = useState({
    year: '',
    product: '',
    kg: '',
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => {
      const next = { ...prev, [key]: value };
      // Cascade reset
      if (key === 'year') { next.product = ''; next.kg = ''; }
      if (key === 'product') { next.kg = ''; }
      return next;
    });
  };

  const handleReset = () => setFilters({ year: '', product: '', kg: '' });

  // Apply filters to data
  const filteredData = useMemo(() => {
    let d = data;
    if (filters.year) d = d.filter(r => r.year === parseInt(filters.year));
    if (filters.product) d = d.filter(r => r.productName === filters.product);
    if (filters.kg) d = d.filter(r => r.planningKg === parseFloat(filters.kg));
    return d;
  }, [data, filters]);

  return (
    <div className="min-h-screen bg-mesh">
      <Header lastFetched={lastFetched} onRefresh={refetch} loading={loading} />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
        {/* Error state */}
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

        {/* Loading */}
        {loading && !error && <LoadingSpinner />}

        {/* Main dashboard */}
        {!loading && !error && (
          <>
            {/* Filter Bar */}
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

            {/* Bottom row: Bar Chart + Ticker side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <ProductCompareChart data={data} filters={filters} />
              <DryingTickerWidget data={data} filters={filters} />
            </div>

            {/* Data Table */}
            <DataTable filteredData={filteredData} />

            {/* Footer */}
            <footer className="text-center py-4 text-xs text-slate-600 border-t border-white/[0.04]">
              Drying Time Analysis Dashboard · Data diambil dari Google Sheets
              {lastFetched && (
                <span> · Terakhir diperbarui {lastFetched.toLocaleString('id-ID')}</span>
              )}
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

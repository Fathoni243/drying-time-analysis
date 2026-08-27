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
import LoadingSpinner from './components/ui/LoadingSpinner';
import FilterTransitionOverlay from './components/ui/FilterTransitionOverlay';
import { formatedDate } from './utils/dateFormat';

export default function App() {
  const { data, loading, error, refetch, lastFetched } = useSheetData();

  // ── Filter state ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    yearStart:   '',  // tahun mulai (default: tahun paling awal dari data)
    yearEnd:     '',  // tahun selesai (default: tahun paling akhir dari data)
    codeProduct: '',  // replaces old "product" (name-based) filter
    kg:          '',
    line:        'GV 1', // default: GV 1
  });

  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (key, value) => {
    startTransition(() => {
      setFilters(prev => {
        const next = { ...prev, [key]: value };
        // Cascade reset on year range change
        if (key === 'yearStart' || key === 'yearEnd') { next.codeProduct = ''; next.kg = ''; }
        // Reset kg when code product changes
        if (key === 'codeProduct') { next.kg = ''; }
        return next;
      });
    });
  };

  const handleReset = () => startTransition(() => setFilters({ yearStart: '', yearEnd: '', codeProduct: '', kg: '', line: 'GV 1' }));

  // ── Derived filtered data (used by Trend Chart, Stats Cards, Data Table) ──
  const filteredData = useMemo(() => {
    let d = data;
    if (filters.yearStart)   d = d.filter(r => r.year >= parseInt(filters.yearStart));
    if (filters.yearEnd)     d = d.filter(r => r.year <= parseInt(filters.yearEnd));
    if (filters.codeProduct) d = d.filter(r => r.codeProduct === filters.codeProduct);
    if (filters.kg)          d = d.filter(r => r.planningKg === parseFloat(filters.kg));
    if (filters.line)        d = d.filter(r => r.line === filters.line);
    return d;
  }, [data, filters]);

  // ── Latest data per line ─────────────────────────────────────────────────
  // Parse DD/MM/YYYY string into a comparable Date value
  const parseDate = (dateStr) => {
    if (!dateStr) return 0;
    const [d, m, y] = dateStr.split('/');
    return new Date(+y, +m - 1, +d).getTime();
  };

  // Untuk masing-masing line, ambil baris data dengan tanggal terbaru
  const latestDataByLine = useMemo(() => {
    const lines = ['GV 1', 'GV 2', 'GV 3'];
    const result = {};
    lines.forEach(line => {
      const rows = data.filter(r => r.line === line);
      if (!rows.length) { result[line] = null; return; }
      result[line] = rows.reduce((latest, r) =>
        parseDate(r.date) > parseDate(latest.date) ? r : latest
      );
    });
    return result;
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Year bounds dari seluruh dataset (untuk label "Semua Tahun" vs range) ──
  const yearBounds = useMemo(() => {
    const years = Array.from(new Set(data.map(d => d.year).filter(Boolean))).sort((a, b) => a - b);
    return { min: years[0] ?? '', max: years[years.length - 1] ?? '' };
  }, [data]);

  return (
    <div className="min-h-screen bg-mesh">
      <Header lastFetched={lastFetched} onRefresh={refetch} loading={loading} latestDataByLine={latestDataByLine} activeLine={filters.line} />

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
              <DryingTrendChart filteredData={filteredData} filters={filters} yearBounds={yearBounds} />
            </div>

            {/* Bottom row: Bar Chart + Ticker Widget side by side */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <ProductCompareChart data={data} filters={filters} yearBounds={yearBounds} />
              <DryingTickerWidget  data={data} filters={filters} yearBounds={yearBounds} onFilterApply={handleFilterChange} onFilterReset={handleReset} />
            </div>

            {/* Data Table */}
            <DataTable filteredData={filteredData} />

            {/* Footer */}
            <footer className="text-center py-4 text-xs text-slate-600 border-t border-white/[0.04]">
              Drying Time Analysis Dashboard · Data diambil dari Google Sheets
              {latestDataByLine[filters.line]?.date && (
                <span> · Terakhir diperbarui <span className="text-amber-400 font-medium">{formatedDate(latestDataByLine[filters.line].date)}</span></span>
              )}
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

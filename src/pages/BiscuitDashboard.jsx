import { useState, useMemo, useTransition } from 'react';
import { AlertTriangle } from 'lucide-react';

import Sidebar from '../components/shared/Sidebar';
import LoadingSpinner from '../components/shared/ui/LoadingSpinner';

import Header from '../components/production-delivery/biscuit/Header';
import FilterBar, { BISCUIT_CODES } from '../components/production-delivery/biscuit/FilterBar';
import StatsCards from '../components/production-delivery/biscuit/StatsCards';
import TrendChart from '../components/production-delivery/biscuit/TrendChart';
import GapAnalysisChart from '../components/production-delivery/biscuit/GapAnalysisChart';
import TopCustomerChart from '../components/production-delivery/biscuit/TopCustomerChart';

import { useProductionDeliveryData } from '../hooks/useProductionDeliveryData';
import { toYearMonth, isInMonthRange } from '../utils/biscuitUtils';

// ── Constants ─────────────────────────────────────────────────────────────────

// Data scope: hanya CODE yang termasuk BISCUIT
const BISCUIT_CODE_SET = new Set(BISCUIT_CODES);

// Bulan batas data
const DATA_MIN_MONTH = '2019-07';
const DATA_MAX_MONTH = '2024-12';

// Default filter state
const DEFAULT_FILTERS = {
  startMonth: '',
  endMonth: '',
  codes: [...BISCUIT_CODES],
};

// ── Helper aggregators ────────────────────────────────────────────────────────

/**
 * Aggregate produksi per bulan.
 * Returns sorted array of { month: "YYYY-MM", produksi: number }.
 */
function aggProdByMonth(rows) {
  const map = new Map();
  for (const r of rows) {
    const ym = toYearMonth(r.tanggal);
    if (!ym) continue;
    map.set(ym, (map.get(ym) ?? 0) + r.ktsProduksi);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, produksi]) => ({ month, produksi }));
}

/**
 * Aggregate delivery per bulan.
 * Returns Map<"YYYY-MM", number>.
 */
function aggDelByMonth(rows) {
  const map = new Map();
  for (const r of rows) {
    const ym = toYearMonth(r.tanggal);
    if (!ym) continue;
    map.set(ym, (map.get(ym) ?? 0) + r.ktsKeluar);
  }
  return map;
}

/**
 * Merge produksi & delivery arrays keyed by month.
 * Ensures all months from produksi appear, delivery fills 0 if missing.
 */
function mergeTrendData(prodRows, delMap) {
  // Build full month set from both sources
  const allMonths = new Set([
    ...prodRows.map(r => r.month),
    ...delMap.keys(),
  ]);
  return [...allMonths]
    .sort()
    .map(month => ({
      month,
      produksi: prodRows.find(r => r.month === month)?.produksi ?? 0,
      delivery: delMap.get(month) ?? 0,
    }));
}

/**
 * Aggregate produksi per code.
 * Returns Map<code, number>.
 */
function aggProdByCode(rows) {
  const map = new Map();
  for (const r of rows) {
    map.set(r.code, (map.get(r.code) ?? 0) + r.ktsProduksi);
  }
  return map;
}

/**
 * Aggregate delivery per code.
 * Returns Map<code, number>.
 */
function aggDelByCode(rows) {
  const map = new Map();
  for (const r of rows) {
    map.set(r.code, (map.get(r.code) ?? 0) + r.ktsKeluar);
  }
  return map;
}

/**
 * Build gap data array, ordered by BISCUIT_CODES.
 */
function buildGapData(selectedCodes, prodCodeMap, delCodeMap) {
  return selectedCodes.map(code => ({
    code,
    produksi: prodCodeMap.get(code) ?? 0,
    delivery: delCodeMap.get(code) ?? 0,
  }));
}

/**
 * Top 10 customer by sum(ktsKeluar).
 */
function topCustomers(delRows, topN = 10) {
  const map = new Map();
  for (const r of delRows) {
    if (!r.customer) continue;
    map.set(r.customer, (map.get(r.customer) ?? 0) + r.ktsKeluar);
  }
  return [...map.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, topN)
    .map(([customer, ktsKeluar], i) => ({ customer, ktsKeluar, rank: i + 1 }));
}

// ── BiscuitDashboard ──────────────────────────────────────────────────────────

export default function BiscuitDashboard() {
  const { productionData, deliveryData, loading, error, refetch, lastFetched } =
    useProductionDeliveryData();

  const [filters, setFilters]     = useState(DEFAULT_FILTERS);
  const [, startTransition]       = useTransition();

  // ── Filter handlers ───────────────────────────────────────────────────────

  const handleFilterChange = (key, value) => {
    startTransition(() => {
      setFilters(prev => ({ ...prev, [key]: value }));
    });
  };

  const handleReset = () => {
    startTransition(() => setFilters(DEFAULT_FILTERS));
  };

  // ── Step 1: Scope — only BISCUIT codes ───────────────────────────────────

  const biscuitProd = useMemo(
    () => productionData.filter(r => BISCUIT_CODE_SET.has(r.code)),
    [productionData]
  );

  const biscuitDel = useMemo(
    () => deliveryData.filter(r => BISCUIT_CODE_SET.has(r.code)),
    [deliveryData]
  );

  // ── Derive month bounds from actual data (for filter hints) ───────────────

  const dataMinMonth = useMemo(() => {
    const months = [
      ...biscuitProd.map(r => toYearMonth(r.tanggal)),
      ...biscuitDel.map(r => toYearMonth(r.tanggal)),
    ].filter(Boolean).sort();
    return months[0] || DATA_MIN_MONTH;
  }, [biscuitProd, biscuitDel]);

  const dataMaxMonth = useMemo(() => {
    const months = [
      ...biscuitProd.map(r => toYearMonth(r.tanggal)),
      ...biscuitDel.map(r => toYearMonth(r.tanggal)),
    ].filter(Boolean).sort();
    return months[months.length - 1] || DATA_MAX_MONTH;
  }, [biscuitProd, biscuitDel]);

  // Resolve effective month range (kosong = seluruh data)
  const effectiveStart = filters.startMonth || dataMinMonth;
  const effectiveEnd   = filters.endMonth   || dataMaxMonth;

  // ── Step 2: Apply filters (month range + selected codes) ──────────────────

  const filteredProd = useMemo(() => {
    return biscuitProd.filter(r => {
      const ym = toYearMonth(r.tanggal);
      return (
        filters.codes.includes(r.code) &&
        isInMonthRange(ym, effectiveStart, effectiveEnd)
      );
    });
  }, [biscuitProd, filters.codes, effectiveStart, effectiveEnd]);

  const filteredDel = useMemo(() => {
    return biscuitDel.filter(r => {
      const ym = toYearMonth(r.tanggal);
      return (
        filters.codes.includes(r.code) &&
        isInMonthRange(ym, effectiveStart, effectiveEnd)
      );
    });
  }, [biscuitDel, filters.codes, effectiveStart, effectiveEnd]);

  // ── Step 3: Compute stats ─────────────────────────────────────────────────

  const totalProduksi = useMemo(
    () => filteredProd.reduce((sum, r) => sum + r.ktsProduksi, 0),
    [filteredProd]
  );

  const totalDelivery = useMemo(
    () => filteredDel.reduce((sum, r) => sum + r.ktsKeluar, 0),
    [filteredDel]
  );

  const totalCustomer = useMemo(
    () => new Set(filteredDel.map(r => r.customer).filter(Boolean)).size,
    [filteredDel]
  );

  // ── Step 4: Chart 1 — Trend per bulan ────────────────────────────────────

  const trendData = useMemo(() => {
    const prodByMonth = aggProdByMonth(filteredProd);
    const delByMonth  = aggDelByMonth(filteredDel);
    return mergeTrendData(prodByMonth, delByMonth);
  }, [filteredProd, filteredDel]);

  // ── Step 5: Chart 2 — Gap per code ───────────────────────────────────────

  const gapData = useMemo(() => {
    const prodCodeMap = aggProdByCode(filteredProd);
    const delCodeMap  = aggDelByCode(filteredDel);
    return buildGapData(filters.codes, prodCodeMap, delCodeMap);
  }, [filteredProd, filteredDel, filters.codes]);

  // ── Step 6: Chart 3 — Top 10 Customer ────────────────────────────────────

  const topCustomerData = useMemo(
    () => topCustomers(filteredDel, 10),
    [filteredDel]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center">
        <Sidebar />
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-mesh">
        <Sidebar />
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6">
          <div className="glass-card border border-red-500/30 px-8 py-6 text-center max-w-md">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-semibold mb-1">Gagal memuat data</p>
            <p className="text-slate-400 text-sm mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-sm font-medium hover:bg-teal-500/20 transition-all"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mesh">
      <Sidebar />

      {/* ── Header ── */}
      <Header loading={loading} lastFetched={lastFetched} onRefresh={refetch} />

      {/* ── Main Content ── */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">

        {/* Filter */}
        <FilterBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={handleReset}
          dataMinMonth={dataMinMonth}
          dataMaxMonth={dataMaxMonth}
        />

        {/* Summary Cards */}
        <StatsCards
          totalProduksi={totalProduksi}
          totalDelivery={totalDelivery}
          totalCustomer={totalCustomer}
          loading={false}
        />

        {/* Chart 1 — Trend */}
        <TrendChart data={trendData} />

        {/* Chart 2 + Chart 3 side by side on xl, stacked otherwise */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <GapAnalysisChart data={gapData} />
          <TopCustomerChart data={topCustomerData} />
        </div>

        {/* Footer */}
        <footer className="text-center py-6 text-xs text-slate-700 border-t border-white/[0.04] mt-6">
          Biscuit Dashboard · Production &amp; Delivery · Satoria Group
        </footer>

      </main>
    </div>
  );
}

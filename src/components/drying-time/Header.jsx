import { Droplets } from 'lucide-react';
import PageHeader from '../shared/ui/PageHeader.jsx';
import { GitBranch } from 'lucide-react';
import { formatedDate } from '../../utils/dateFormat';

/**
 * Header untuk Drying Time Analysis Dashboard.
 *
 * @param {{
 *   loading: boolean,
 *   lastFetched: Date|null,
 *   onRefresh: Function,
 *   latestDataByLine?: object,
 *   activeLine?: string,
 * }} props
 */
export default function Header({ loading, lastFetched, onRefresh, latestDataByLine, activeLine }) {
  // Slot tambahan: latest data per line
  const extra = activeLine && latestDataByLine?.[activeLine] ? (() => {
    const row = latestDataByLine[activeLine];
    return (
      <span className="hidden sm:flex items-center gap-1.5 text-[11px] leading-tight px-2 py-0.5 rounded-full text-slate-400">
        <GitBranch className="w-2.5 h-2.5 shrink-0 text-slate-400" />
        <span>Latest data {activeLine}:</span>
        <span>{formatedDate(row.date)}</span>
      </span>
    );
  })() : null;

  return (
    <PageHeader
      icon={<Droplets className="w-5 h-5 text-amber-400" />}
      title="Drying Time Analysis"
      subtitle="Dashboard Monitoring Produksi"
      accentColor="amber"
      lastFetched={lastFetched}
      loading={loading}
      onRefresh={onRefresh}
      refreshBtnId="btn-refresh"
      extra={extra}
    />
  );
}

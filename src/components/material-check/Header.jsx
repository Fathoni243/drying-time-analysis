import { PackageCheck } from 'lucide-react';
import PageHeader from '../shared/ui/PageHeader.jsx';

/**
 * Header untuk halaman Pengecekan Kecukupan Material.
 *
 * @param {{ loading: boolean, lastFetched: Date|null, onRefresh: Function }} props
 */
export default function Header({ loading, lastFetched, onRefresh }) {
  return (
    <PageHeader
      icon={<PackageCheck className="w-5 h-5 text-amber-400" />}
      title="Pengecekan Kecukupan Material"
      subtitle="Material Availability Check"
      accentColor="amber"
      lastFetched={lastFetched}
      loading={loading}
      onRefresh={onRefresh}
      refreshBtnId="btn-material-check-refresh"
    />
  );
}

import { Cookie } from 'lucide-react';
import PageHeader from '../../shared/ui/PageHeader.jsx';

/**
 * Header untuk Biscuit Dashboard.
 * Warna tema: teal/cyan untuk membedakan dari Drying Time (amber).
 *
 * @param {{ loading: boolean, lastFetched: Date|null, onRefresh: Function }} props
 */
export default function Header({ loading, lastFetched, onRefresh }) {
  return (
    <PageHeader
      icon={<Cookie className="w-5 h-5 text-teal-400" />}
      title="Biscuit Dashboard"
      subtitle="Production &amp; Delivery Monitoring"
      accentColor="teal"
      lastFetched={lastFetched}
      loading={loading}
      onRefresh={onRefresh}
      refreshBtnId="btn-biscuit-refresh"
    />
  );
}

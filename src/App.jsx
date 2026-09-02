import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider } from './contexts/SidebarContext';
import DryingTimeDashboard from './pages/DryingTimeDashboard';
import ProductionDeliveryDashboard from './pages/ProductionDeliveryDashboard';
import BiscuitDashboard from './pages/BiscuitDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <Routes>
          {/* Default redirect: domain/ → domain/drying-time-dashboard */}
          <Route path="/" element={<Navigate to="/drying-time-dashboard" replace />} />

          {/* Dashboard pages */}
          <Route path="/drying-time-dashboard" element={<DryingTimeDashboard />} />

          {/* Production Delivery sub-dashboards */}
          <Route path="/production-delivery-dashboard" element={<ProductionDeliveryDashboard />} />
          <Route path="/production-delivery-dashboard/biscuit" element={<BiscuitDashboard />} />
          {/* Sub-pages lainnya — under construction, redirect ke landing */}
          <Route path="/production-delivery-dashboard/:segment" element={<ProductionDeliveryDashboard />} />

          {/* Catch-all: redirect unknown paths back to default */}
          <Route path="*" element={<Navigate to="/drying-time-dashboard" replace />} />
        </Routes>
      </SidebarProvider>
    </BrowserRouter>
  );
}

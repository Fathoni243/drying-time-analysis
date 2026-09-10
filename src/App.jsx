import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider } from './contexts/SidebarContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import DryingTimeDashboard from './pages/DryingTimeDashboard';
import ProductionDeliveryDashboard from './pages/ProductionDeliveryDashboard';
import BiscuitDashboard from './pages/BiscuitDashboard';
import MaterialCheckDashboard from './pages/MaterialCheckDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <ProtectedRoute>
        <SidebarProvider>
          <Routes>
            {/* Default redirect: domain/ → domain/material-check */}
            <Route path="/" element={<Navigate to="/material-check" replace />} />

            {/* Pengecekan Kecukupan Material */}
            <Route path="/material-check" element={<MaterialCheckDashboard />} />

            {/* Dashboard pages */}
            <Route path="/drying-time-dashboard" element={<DryingTimeDashboard />} />

            {/* Production Delivery sub-dashboards */}
            <Route path="/production-delivery-dashboard" element={<ProductionDeliveryDashboard />} />
            <Route path="/production-delivery-dashboard/biscuit" element={<BiscuitDashboard />} />
            {/* Sub-pages lainnya — under construction, redirect ke landing */}
            <Route path="/production-delivery-dashboard/:segment" element={<ProductionDeliveryDashboard />} />

            {/* Catch-all: redirect unknown paths back to default */}
            <Route path="*" element={<Navigate to="/material-check" replace />} />
          </Routes>
        </SidebarProvider>
      </ProtectedRoute>
    </BrowserRouter>
  );
}

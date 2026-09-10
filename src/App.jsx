import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SidebarProvider } from './contexts/SidebarContext';
import ProtectedRoute from './components/shared/ProtectedRoute';
import DryingTimeDashboard from './pages/DryingTimeDashboard';
import ProductionDeliveryDashboard from './pages/ProductionDeliveryDashboard';
import BiscuitDashboard from './pages/BiscuitDashboard';
import PublicRoute from './components/shared/PublicRoute';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Route login — publik, tapi redirect ke dashboard kalau sudah login */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Semua route lain — butuh login */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SidebarProvider>
                <Routes>
                  <Route path="/" element={<Navigate to="/drying-time-dashboard" replace />} />
                  <Route path="/drying-time-dashboard" element={<DryingTimeDashboard />} />
                  <Route path="/production-delivery-dashboard" element={<ProductionDeliveryDashboard />} />
                  <Route path="/production-delivery-dashboard/biscuit" element={<BiscuitDashboard />} />
                  <Route path="/production-delivery-dashboard/:segment" element={<ProductionDeliveryDashboard />} />
                  <Route path="*" element={<Navigate to="/drying-time-dashboard" replace />} />
                </Routes>
              </SidebarProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
import { Navigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

export default function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d1528] text-amber-500">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Memuat...</span>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/drying-time-dashboard" replace />;
  }

  return children;
}
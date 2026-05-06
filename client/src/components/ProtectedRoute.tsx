import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  // If not authenticated, redirect to landing page
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
}

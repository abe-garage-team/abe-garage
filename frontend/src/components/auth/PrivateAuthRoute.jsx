import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import LoadingState from '../common/LoadingState.jsx';

// Logged out goes to Login (and comes back here afterwards); the wrong role goes to Unauthorized.
// The server checks every request as well; this only decides what to show.
export default function PrivateAuthRoute({ roles = [1, 2, 3] }) {
  const { checking, isAuthenticated, employee } = useAuth();
  const location = useLocation();
  if (checking) return <LoadingState message="Checking your session…" />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!roles.includes(employee.role_id)) return <Navigate to="/unauthorized" replace />;
  return <Outlet />;
}

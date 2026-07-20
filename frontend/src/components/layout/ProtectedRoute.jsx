import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageLoader from '../ui/PageLoader.jsx';

/** Redirects to /login (remembering the target) until authenticated. */
export default function ProtectedRoute() {
  const { user, initialized } = useSelector((s) => s.auth);
  const location = useLocation();
  if (!initialized) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return <Outlet />;
}

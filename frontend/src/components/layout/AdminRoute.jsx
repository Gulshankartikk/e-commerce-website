import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageLoader from '../ui/PageLoader.jsx';

/** Admin-only guard. */
export default function AdminRoute() {
  const { user, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <Outlet />;
}

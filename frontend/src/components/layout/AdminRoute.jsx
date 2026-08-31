import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PageLoader from '../ui/PageLoader.jsx';

/** Staff & management route guard (admin, manager, seller). */
export default function AdminRoute() {
  const { user, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: '/admin' }} replace />;
  if (!['admin', 'manager', 'seller'].includes(user.role)) return <Navigate to="/" replace />;
  return <Outlet />;
}

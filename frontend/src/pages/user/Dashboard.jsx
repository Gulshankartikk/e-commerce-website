import { NavLink, Route, Routes } from 'react-router-dom';
import { FiUser, FiPackage, FiHeart, FiMapPin, FiBell, FiLock } from 'react-icons/fi';
import Profile from './Profile.jsx';
import MyOrders from './MyOrders.jsx';
import Addresses from './Addresses.jsx';
import ChangePassword from './ChangePassword.jsx';
import Notifications from './Notifications.jsx';
import Wishlist from '../Wishlist.jsx';

const TABS = [
  { to: '', end: true, icon: FiUser, label: 'Profile' },
  { to: 'orders', icon: FiPackage, label: 'My Orders' },
  { to: 'wishlist', icon: FiHeart, label: 'Wishlist' },
  { to: 'addresses', icon: FiMapPin, label: 'Addresses' },
  { to: 'notifications', icon: FiBell, label: 'Notifications' },
  { to: 'password', icon: FiLock, label: 'Password' },
];

/** User dashboard shell with tab navigation + nested routes. */
export default function Dashboard() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="section-title mb-6">My account</h1>
      <div className="flex flex-col gap-8 lg:flex-row">
        <nav className="card-surface flex h-fit shrink-0 gap-1 overflow-x-auto p-2 lg:w-56 lg:flex-col">
          {TABS.map((t) => (
            <NavLink
              key={t.label}
              to={t.to}
              end={t.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-primary text-white shadow-glow' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <t.icon /> {t.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          <Routes>
            <Route index element={<Profile />} />
            <Route path="orders" element={<MyOrders />} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="password" element={<ChangePassword />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

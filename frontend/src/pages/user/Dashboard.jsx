import { NavLink, Route, Routes } from 'react-router-dom';
import {
  IconUserRound,
  IconPackage,
  IconHeart,
  IconMapPin,
  IconBell,
  IconLock,
} from '../../components/ui/icons.jsx';
import Profile from './Profile.jsx';
import MyOrders from './MyOrders.jsx';
import Addresses from './Addresses.jsx';
import ChangePassword from './ChangePassword.jsx';
import Notifications from './Notifications.jsx';
import Wishlist from '../Wishlist.jsx';

const TABS = [
  { to: '', end: true, icon: IconUserRound, label: 'Profile' },
  { to: 'orders', icon: IconPackage, label: 'My Orders' },
  { to: 'wishlist', icon: IconHeart, label: 'Wishlist' },
  { to: 'addresses', icon: IconMapPin, label: 'Addresses' },
  { to: 'notifications', icon: IconBell, label: 'Notifications' },
  { to: 'password', icon: IconLock, label: 'Password' },
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
                `flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-[#087F65] text-white shadow-sm' : 'text-[#65716A] hover:bg-[#EAF4EF] hover:text-[#075E4B]'}`}
            >
              <t.icon size={18} /> {t.label}
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

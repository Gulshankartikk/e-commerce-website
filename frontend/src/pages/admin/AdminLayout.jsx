import { NavLink, Route, Routes, Link } from 'react-router-dom';
import { useState } from 'react';
import { FiGrid, FiBox, FiShoppingBag, FiUsers, FiTag, FiImage, FiStar, FiLayers, FiMenu, FiX, FiArrowLeft, FiActivity } from 'react-icons/fi';
import AdminDashboard from './AdminDashboard.jsx';
import AdminProducts from './AdminProducts.jsx';
import AdminOrders from './AdminOrders.jsx';
import AdminUsers from './AdminUsers.jsx';
import AdminCoupons from './AdminCoupons.jsx';
import AdminBanners from './AdminBanners.jsx';
import AdminReviews from './AdminReviews.jsx';
import AdminCatalog from './AdminCatalog.jsx';
import AdminEvals from './AdminEvals.jsx';

const LINKS = [
  { to: '', end: true, icon: FiGrid, label: 'Dashboard' },
  { to: 'evals', icon: FiActivity, label: 'AI RAG & Evals' },
  { to: 'products', icon: FiBox, label: 'Products' },
  { to: 'orders', icon: FiShoppingBag, label: 'Orders' },
  { to: 'users', icon: FiUsers, label: 'Users' },
  { to: 'catalog', icon: FiLayers, label: 'Categories & Brands' },
  { to: 'coupons', icon: FiTag, label: 'Coupons' },
  { to: 'banners', icon: FiImage, label: 'Banners' },
  { to: 'reviews', icon: FiStar, label: 'Reviews' },
];

/** Admin panel shell styled in clean white & soft mint with deep emerald navigation. */
export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F1F7F4]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-[#E4EAE6] bg-white transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-[#E4EAE6] p-5">
          <Link to="/admin" className="flex items-center gap-2 font-display text-base font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#087F65] text-white text-xs font-bold">⚡</span>
            <span className="text-[#075E4B] font-extrabold text-lg">FLASH<span className="text-[#087F65]">SHOP</span></span>
            <span className="rounded bg-[#EAF4EF] px-1.5 py-0.5 text-[10px] font-bold text-[#075E4B]">Admin</span>
          </Link>
          <button className="lg:hidden text-[#202923]" onClick={() => setOpen(false)} aria-label="Close sidebar"><FiX /></button>
        </div>
        <nav className="space-y-1 p-3">
          {LINKS.map((l) => (
            <NavLink
              key={l.label} to={l.to} end={l.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-[#087F65] text-white font-semibold shadow-sm' : 'text-[#202923] hover:bg-[#F1F7F4] hover:text-[#087F65]'}`}
            >
              <l.icon /> {l.label}
            </NavLink>
          ))}
          <Link to="/" className="mt-6 flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-semibold text-[#087F65] transition-colors hover:bg-[#EAF4EF]">
            <FiArrowLeft /> Back to Storefront
          </Link>
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-[#202923]/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-[#E4EAE6] bg-white px-6 py-3.5 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open sidebar" className="text-[#202923]"><FiMenu className="text-xl" /></button>
          <span className="font-display font-bold text-[#202923]">Admin</span>
        </header>
        <main className="p-6">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="evals" element={<AdminEvals />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="catalog" element={<AdminCatalog />} />
            <Route path="coupons" element={<AdminCoupons />} />
            <Route path="banners" element={<AdminBanners />} />
            <Route path="reviews" element={<AdminReviews />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

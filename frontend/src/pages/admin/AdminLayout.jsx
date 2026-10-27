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

/** Admin panel shell: collapsible sidebar + nested routes. */
export default function AdminLayout() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-night">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-white/10 bg-card transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <Link to="/admin" className="font-display text-lg font-bold"><span className="gradient-text">LUX</span>ORA <span className="text-xs font-normal text-slate-400">Admin</span></Link>
          <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Close sidebar"><FiX /></button>
        </div>
        <nav className="space-y-1 p-3">
          {LINKS.map((l) => (
            <NavLink
              key={l.label} to={l.to} end={l.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-primary text-white shadow-glow' : 'text-slate-300 hover:bg-white/5'}`}
            >
              <l.icon /> {l.label}
            </NavLink>
          ))}
          <Link to="/" className="mt-4 flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-slate-400 transition-colors hover:bg-white/5">
            <FiArrowLeft /> Back to store
          </Link>
        </nav>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <header className="glass sticky top-0 z-20 flex items-center gap-3 px-6 py-3.5 lg:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open sidebar"><FiMenu className="text-xl" /></button>
          <span className="font-display font-bold">Admin</span>
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

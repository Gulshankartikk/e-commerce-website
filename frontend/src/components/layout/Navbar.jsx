import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiHeart, FiShoppingCart, FiUser, FiSun, FiMoon, FiMenu, FiX, FiLogOut, FiGrid, FiPackage, FiMic } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { logoutUser } from '../../features/authSlice.js';
import { resetCart, selectCartCount } from '../../features/cartSlice.js';
import { resetWishlist } from '../../features/wishlistSlice.js';
import { toggleTheme, setMobileMenu, toggleAiDrawer } from '../../features/uiSlice.js';
import useDebounce from '../../hooks/useDebounce.js';
import api from '../../api/axios.js';
import { formatPrice, imgUrl } from '../../utils/format.js';

/** Sticky glassmorphic navbar with live search, cart/wishlist badges and user menu. */
export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const theme = useSelector((s) => s.ui.theme);
  const cartCount = useSelector(selectCartCount);
  const wishlistCount = useSelector((s) => s.wishlist.wishlist?.products.length || 0);
  const mobileOpen = useSelector((s) => s.ui.mobileMenuOpen);

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = useRef(null);
  const menuRef = useRef(null);

  /* Live search suggestions */
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) { setSuggestions([]); return; }
    api.get(`/products/suggestions?keyword=${encodeURIComponent(debouncedQuery)}`)
      .then(({ data }) => setSuggestions(data.suggestions))
      .catch(() => {});
  }, [debouncedQuery]);

  /* Close dropdowns on outside click */
  useEffect(() => {
    const onClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false);
      if (menuRef.current && !menuRef.current.contains(e.target)) setUserMenu(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setShowSuggestions(false);
    navigate(`/products?keyword=${encodeURIComponent(query.trim())}`);
  };

  /** Voice search via the Web Speech API (where supported). */
  const voiceSearch = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast.error('Voice search is not supported in this browser'); return; }
    const rec = new SR();
    rec.lang = 'en-IN';
    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setQuery(text);
      navigate(`/products?keyword=${encodeURIComponent(text)}`);
    };
    rec.onerror = () => toast.error('Could not hear that. Try again');
    rec.start();
    toast('Listening…', { icon: '🎤' });
  };

  const handleLogout = async () => {
    await dispatch(logoutUser());
    dispatch(resetCart());
    dispatch(resetWishlist());
    setUserMenu(false);
    toast.success('Logged out');
    navigate('/');
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Shop' },
    { to: '/products?flashSale=true', label: 'Flash Sale' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className="glass sticky top-0 z-40">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
        {/* Mobile menu button */}
        <button className="md:hidden" aria-label="Menu" onClick={() => dispatch(setMobileMenu(!mobileOpen))}>
          {mobileOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
        </button>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-rose-500 text-white shadow-md shadow-purple-900/30">
            ⚡
          </span>
          <span className="tracking-tight text-white font-extrabold">
            <span className="bg-gradient-to-r from-purple-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">FLASH</span>SHOP
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-6 hidden items-center gap-5 text-sm font-medium md:flex">
          {navLinks.map((l) => (
            <NavLink key={l.label} to={l.to} className={({ isActive }) => `transition-colors hover:text-primary-300 ${isActive && l.to === '/' ? 'text-primary-300' : 'text-slate-300'}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Search */}
        <div ref={searchRef} className="relative ml-auto hidden flex-1 max-w-md sm:block">
          <form onSubmit={submitSearch} role="search">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search products, brands…"
              aria-label="Search products"
              className="input-field !rounded-full !py-2 pl-10 pr-10"
            />
            <button type="button" onClick={voiceSearch} aria-label="Voice search" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-primary-300">
              <FiMic />
            </button>
          </form>
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                className="glass absolute mt-2 w-full overflow-hidden rounded-xl py-1 shadow-card"
              >
                {suggestions.map((s) => (
                  <li key={s._id}>
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-white/10"
                      onClick={() => { setShowSuggestions(false); setQuery(''); navigate(`/product/${s.slug}`); }}
                    >
                      <img src={imgUrl(s.images?.[0]?.url)} alt="" className="h-9 w-9 rounded-lg object-cover" loading="lazy" />
                      <span className="flex-1 truncate">{s.name}</span>
                      <span className="font-semibold text-secondary-400">{formatPrice(s.price)}</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => dispatch(toggleAiDrawer())}
            aria-label="Open AI Shopping Assistant"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-rose-500/30 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:text-white hover:border-rose-400 transition-all shadow-sm"
          >
            <BsStars className="text-sm text-amber-400 animate-spin-slow" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          <button onClick={() => dispatch(toggleTheme())} aria-label="Toggle theme" className="rounded-full p-2.5 transition-colors hover:bg-white/10">
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
          <Link to="/wishlist" aria-label="Wishlist" className="relative rounded-full p-2.5 transition-colors hover:bg-white/10">
            <FiHeart />
            {wishlistCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white">{wishlistCount}</span>}
          </Link>
          <Link to="/cart" aria-label="Cart" className="relative rounded-full p-2.5 transition-colors hover:bg-white/10">
            <FiShoppingCart />
            {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">{cartCount}</span>}
          </Link>

          {/* User menu */}
          <div ref={menuRef} className="relative">
            {user ? (
              <>
                <button onClick={() => setUserMenu(!userMenu)} aria-label="Account menu" className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary-500 font-bold text-white">
                  {user.name[0].toUpperCase()}
                </button>
                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                      className="glass absolute right-0 mt-2 w-52 overflow-hidden rounded-xl py-1 shadow-card"
                    >
                      <div className="border-b border-white/10 px-4 py-2.5">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-sm font-semibold">{user.name}</p>
                          <span className={`chip text-[10px] uppercase font-bold ${user.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : user.role === 'seller' ? 'bg-emerald-500/20 text-emerald-300' : user.role === 'manager' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-primary/20 text-primary-300'}`}>
                            {user.role}
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate-400">{user.email}</p>
                      </div>
                      <Link to="/dashboard" onClick={() => setUserMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-white/10"><FiUser /> My Account</Link>
                      <Link to="/dashboard/orders" onClick={() => setUserMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors hover:bg-white/10"><FiPackage /> My Orders</Link>
                      {['admin', 'manager', 'seller'].includes(user.role) && (
                        <Link to="/admin" onClick={() => setUserMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-secondary-400 transition-colors hover:bg-white/10">
                          <FiGrid /> {user.role === 'admin' ? 'Admin Panel' : user.role === 'seller' ? 'Seller Panel' : 'Manager Panel'}
                        </Link>
                      )}
                      <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-white/10"><FiLogOut /> Logout</button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link to="/login" className="btn-primary !px-4 !py-2 text-sm">Sign in</Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 md:hidden"
          >
            <div className="space-y-1 px-4 py-3">
              <button
                onClick={() => {
                  dispatch(setMobileMenu(false));
                  dispatch(toggleAiDrawer());
                }}
                className="flex w-full items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500/20 to-amber-500/20 border border-rose-500/30 px-3 py-2.5 text-sm font-semibold text-rose-300"
              >
                <BsStars className="text-amber-400" />
                Ask AI Shopping Assistant
              </button>
              <form onSubmit={(e) => { submitSearch(e); dispatch(setMobileMenu(false)); }} className="relative mb-2 sm:hidden">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" className="input-field !rounded-full !py-2 pl-10" />
              </form>
              {navLinks.map((l) => (
                <NavLink key={l.label} to={l.to} onClick={() => dispatch(setMobileMenu(false))} className="block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/10">
                  {l.label}
                </NavLink>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

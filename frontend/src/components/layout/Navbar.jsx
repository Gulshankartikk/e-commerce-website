import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiSearch,
  FiHeart,
  FiShoppingCart,
  FiUser,
  FiMenu,
  FiX,
  FiLogOut,
  FiGrid,
  FiPackage,
  FiMic,
} from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { logoutUser } from '../../features/authSlice.js';
import { resetCart, selectCartCount } from '../../features/cartSlice.js';
import { resetWishlist } from '../../features/wishlistSlice.js';
import { setMobileMenu, toggleAiDrawer } from '../../features/uiSlice.js';
import useDebounce from '../../hooks/useDebounce.js';
import api from '../../api/axios.js';
import { formatPrice, imgUrl } from '../../utils/format.js';

/** Clean white header in deep emerald & soft mint with live search, wishlist, cart, and user menu. */
export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
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

  /** Voice search via Web Speech API */
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
    { to: '/products?view=categories', label: 'Categories' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E4EAE6] shadow-[0_2px_12px_rgba(21,61,43,0.04)]">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Mobile menu button */}
        <button
          className="rounded-lg p-2 text-[#202923] hover:bg-[#F1F7F4] md:hidden transition-colors"
          aria-label="Menu"
          onClick={() => dispatch(setMobileMenu(!mobileOpen))}
        >
          {mobileOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
        </button>

        {/* Brand Logo in Deep Emerald */}
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#087F65] text-white shadow-sm text-sm">
            ⚡
          </span>
          <span className="tracking-tight text-[#075E4B] font-extrabold text-xl">
            FLASH<span className="text-[#087F65]">SHOP</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="ml-8 hidden items-center gap-6 text-sm md:flex">
          {navLinks.map((l) => (
            <NavLink
              key={l.label}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `relative py-1 font-medium transition-colors hover:text-[#087F65] ${
                  isActive
                    ? 'text-[#087F65] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#087F65]'
                    : 'text-[#202923]'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        {/* Search Bar with Subtle Icon */}
        <div ref={searchRef} className="relative ml-auto hidden flex-1 max-w-md sm:block">
          <form onSubmit={submitSearch} role="search">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#65716A]" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search electronics, accessories, brands…"
              aria-label="Search products"
              className="w-full rounded-full border border-[#E4EAE6] bg-[#F1F7F4] py-2 pl-10 pr-10 text-sm text-[#202923] outline-none transition-all placeholder:text-[#89938D] focus:bg-white focus:border-[#087F65] focus:ring-2 focus:ring-[#087F65]/15"
            />
            <button
              type="button"
              onClick={voiceSearch}
              aria-label="Voice search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#65716A] transition-colors hover:text-[#087F65]"
            >
              <FiMic />
            </button>
          </form>

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute mt-2 w-full overflow-hidden rounded-xl bg-white border border-[#E4EAE6] py-1 shadow-[0_8px_24px_rgba(21,61,43,0.1)] z-50"
              >
                {suggestions.map((s) => (
                  <li key={s._id}>
                    <button
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-[#202923] transition-colors hover:bg-[#F1F7F4]"
                      onClick={() => { setShowSuggestions(false); setQuery(''); navigate(`/product/${s.slug}`); }}
                    >
                      <img src={imgUrl(s.images?.[0]?.url)} alt="" className="h-9 w-9 rounded-lg object-cover bg-[#F1F7F4]" loading="lazy" />
                      <span className="flex-1 truncate font-medium">{s.name}</span>
                      <span className="font-semibold text-[#087F65]">{formatPrice(s.price)}</span>
                    </button>
                  </li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-2">
          {/* Ask AI Copilot Button */}
          <button
            onClick={() => dispatch(toggleAiDrawer())}
            aria-label="Open AI Shopping Assistant"
            className="flex items-center gap-1.5 rounded-full bg-[#EAF4EF] border border-[#DDEBE3] px-3.5 py-1.5 text-xs font-semibold text-[#075E4B] hover:bg-[#DDEBE3] hover:text-[#087F65] transition-all shadow-sm"
          >
            <BsStars className="text-sm text-[#168764]" />
            <span className="hidden sm:inline font-bold">Ask AI</span>
          </button>

          {/* Wishlist */}
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative rounded-full p-2.5 text-[#202923] transition-colors hover:bg-[#F1F7F4] hover:text-[#087F65]"
          >
            <FiHeart className="text-lg" />
            {wishlistCount > 0 && (
              <span className="absolute 1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#168764] text-[10px] font-bold text-white">
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative rounded-full p-2.5 text-[#202923] transition-colors hover:bg-[#F1F7F4] hover:text-[#087F65]"
          >
            <FiShoppingCart className="text-lg" />
            {cartCount > 0 && (
              <span className="absolute 1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#087F65] text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Account Menu */}
          <div ref={menuRef} className="relative">
            {user ? (
              <>
                <button
                  onClick={() => setUserMenu(!userMenu)}
                  aria-label="Account menu"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-[#087F65] font-bold text-white shadow-sm hover:bg-[#066B55] transition-colors"
                >
                  {user.name[0].toUpperCase()}
                </button>
                <AnimatePresence>
                  {userMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl bg-white border border-[#E4EAE6] py-1 shadow-[0_8px_24px_rgba(21,61,43,0.1)] z-50"
                    >
                      <div className="border-b border-[#E4EAE6] px-4 py-2.5 bg-[#F1F7F4]">
                        <div className="flex items-center justify-between gap-1">
                          <p className="truncate text-sm font-semibold text-[#202923]">{user.name}</p>
                          <span className="chip text-[10px] uppercase font-bold bg-[#EAF4EF] text-[#075E4B] border border-[#DDEBE3]">
                            {user.role}
                          </span>
                        </div>
                        <p className="truncate text-xs text-[#65716A]">{user.email}</p>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#202923] transition-colors hover:bg-[#F1F7F4] hover:text-[#087F65]"
                      >
                        <FiUser /> My Account
                      </Link>
                      <Link
                        to="/dashboard/orders"
                        onClick={() => setUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#202923] transition-colors hover:bg-[#F1F7F4] hover:text-[#087F65]"
                      >
                        <FiPackage /> My Orders
                      </Link>
                      {['admin', 'manager', 'seller'].includes(user.role) && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenu(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-[#087F65] transition-colors hover:bg-[#F1F7F4]"
                        >
                          <FiGrid /> {user.role === 'admin' ? 'Admin Panel' : user.role === 'seller' ? 'Seller Panel' : 'Manager Panel'}
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#B42318] transition-colors hover:bg-[#F1F7F4]"
                      >
                        <FiLogOut /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link to="/login" className="btn-primary !px-4 !py-1.5 text-sm">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[#E4EAE6] bg-white md:hidden"
          >
            <div className="space-y-1.5 px-4 py-3">
              <button
                onClick={() => {
                  dispatch(setMobileMenu(false));
                  dispatch(toggleAiDrawer());
                }}
                className="flex w-full items-center gap-2 rounded-lg bg-[#EAF4EF] border border-[#DDEBE3] px-3.5 py-2.5 text-sm font-semibold text-[#075E4B]"
              >
                <BsStars className="text-[#168764]" />
                Ask AI Shopping Assistant
              </button>
              <form onSubmit={(e) => { submitSearch(e); dispatch(setMobileMenu(false)); }} className="relative mb-2 sm:hidden">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#65716A]" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search products…"
                  className="w-full rounded-full border border-[#E4EAE6] bg-[#F1F7F4] py-2 pl-10 text-sm text-[#202923] outline-none"
                />
              </form>
              {navLinks.map((l) => (
                <NavLink
                  key={l.label}
                  to={l.to}
                  end={l.to === '/'}
                  onClick={() => dispatch(setMobileMenu(false))}
                  className={({ isActive }) =>
                    `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-[#EAF4EF] text-[#087F65] font-semibold' : 'text-[#202923] hover:bg-[#F1F7F4]'
                    }`
                  }
                >
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

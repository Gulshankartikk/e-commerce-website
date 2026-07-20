import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './features/authSlice.js';
import { fetchCart } from './features/cartSlice.js';
import { fetchWishlist } from './features/wishlistSlice.js';
import Layout from './components/layout/Layout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AdminRoute from './components/layout/AdminRoute.jsx';
import PageLoader from './components/ui/PageLoader.jsx';
import QuickViewModal from './components/product/QuickViewModal.jsx';

/* ---------- Code-split pages ---------- */
const Home = lazy(() => import('./pages/Home.jsx'));
const Products = lazy(() => import('./pages/Products.jsx'));
const ProductDetails = lazy(() => import('./pages/ProductDetails.jsx'));
const Cart = lazy(() => import('./pages/Cart.jsx'));
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'));
const Checkout = lazy(() => import('./pages/Checkout.jsx'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess.jsx'));
const Compare = lazy(() => import('./pages/Compare.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const Login = lazy(() => import('./pages/auth/Login.jsx'));
const Signup = lazy(() => import('./pages/auth/Signup.jsx'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword.jsx'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail.jsx'));

const Dashboard = lazy(() => import('./pages/user/Dashboard.jsx'));
const OrderDetails = lazy(() => import('./pages/user/OrderDetails.jsx'));

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout.jsx'));

const StaticPage = lazy(() => import('./pages/static/StaticPage.jsx'));
const Contact = lazy(() => import('./pages/static/Contact.jsx'));
const FAQ = lazy(() => import('./pages/static/FAQ.jsx'));

/** Scroll to top on route change. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);
  return null;
}

export default function App() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  // Restore session on load
  useEffect(() => {
    if (localStorage.getItem('lx_token')) dispatch(fetchMe());
    else dispatch({ type: 'auth/me/rejected' });
  }, [dispatch]);

  // Load cart + wishlist once authenticated
  useEffect(() => {
    if (user) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [user, dispatch]);

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/verify-email/:token" element={<VerifyEmail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/about" element={<StaticPage page="about" />} />
            <Route path="/privacy" element={<StaticPage page="privacy" />} />
            <Route path="/terms" element={<StaticPage page="terms" />} />
            <Route path="/returns" element={<StaticPage page="returns" />} />

            {/* Authenticated */}
            <Route element={<ProtectedRoute />}>
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success/:id" element={<OrderSuccess />} />
              <Route path="/dashboard/orders/:id" element={<OrderDetails />} />
              <Route path="/dashboard/*" element={<Dashboard />} />
            </Route>

            {/* 404 within the storefront chrome */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin (own layout, no storefront chrome) */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/*" element={<AdminLayout />} />
          </Route>
        </Routes>
      </Suspense>
      <QuickViewModal />
    </>
  );
}

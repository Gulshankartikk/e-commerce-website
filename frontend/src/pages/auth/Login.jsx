import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiShield, FiShoppingBag, FiBriefcase, FiUsers, FiZap } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { loginUser, clearError } from '../../features/authSlice.js';

const DEMO_USERS = [
  { role: 'Admin', email: 'admin@luxora.shop', pass: 'Admin@12345', label: '👑 Admin', desc: 'Full store access & management', icon: FiShield, color: 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400' },
  { role: 'Customer', email: 'demo@luxora.shop', pass: 'Demo@12345', label: '🛍️ Customer', desc: 'Shop, cart, wishlist & orders', icon: FiShoppingBag, color: 'border-primary/40 bg-primary/10 text-primary-300 hover:border-primary-400' },
  { role: 'Seller', email: 'seller@luxora.shop', pass: 'Seller@12345', label: '🏪 Seller', desc: 'Vendor inventory & products', icon: FiBriefcase, color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400' },
  { role: 'Manager', email: 'manager@luxora.shop', pass: 'Manager@12345', label: '👔 Manager', desc: 'Store operations & catalog', icon: FiUsers, color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 hover:border-cyan-400' },
];

/** Multi-user Login page (React Hook Form + Redux thunk + 1-Click Demo Login). */
export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector((s) => s.auth);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => { document.title = 'Sign in — LUXORA'; dispatch(clearError()); }, [dispatch]);

  useEffect(() => {
    if (user) {
      toast.success(`Welcome back, ${user.name.split(' ')[0]}! (${user.role.toUpperCase()})`);
      navigate(location.state?.from || (['admin', 'manager', 'seller'].includes(user.role) ? '/admin' : '/'), { replace: true });
    }
  }, [user, navigate, location]);

  const onSubmit = (form) => dispatch(loginUser(form));

  const quickLogin = (email, password) => {
    setValue('email', email);
    setValue('password', password);
    dispatch(loginUser({ email, password }));
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-lg rounded-3xl p-8 shadow-2xl">
        <h1 className="text-center font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-slate-400">Sign in to your LUXORA account</p>

        {/* 1-Click Multi-User Demo Switcher */}
        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-400">
            <FiZap className="text-sm" /> Multi-User 1-Click Quick Login
          </div>
          <p className="mt-1 text-xs text-slate-400">Click any profile below to instantly log in as that role:</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {DEMO_USERS.map((u) => (
              <button
                key={u.role}
                type="button"
                onClick={() => quickLogin(u.email, u.pass)}
                disabled={loading}
                className={`flex flex-col items-start rounded-xl border p-2.5 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${u.color}`}
              >
                <span className="text-xs font-bold">{u.label}</span>
                <span className="text-[11px] opacity-80">{u.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-white/10" />
          <span className="absolute bg-card px-3 text-xs uppercase text-slate-500">or sign in with email</span>
        </div>

        {error && <p className="mb-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input type="email" placeholder="you@example.com" className="input-field"
              {...register('email', { required: 'Email is required', pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email' } })} />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-sm font-medium">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary-300 hover:underline">Forgot password?</Link>
            </div>
            <input type="password" placeholder="••••••••" className="input-field"
              {...register('password', { required: 'Password is required' })} />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3">{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          New to LUXORA? <Link to="/signup" className="font-semibold text-primary-300 hover:underline">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
}

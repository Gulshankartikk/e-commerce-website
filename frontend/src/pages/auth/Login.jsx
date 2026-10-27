import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import {
  IconShieldCheck,
  IconShoppingCart,
  IconBriefcase,
  IconUsers,
  IconZap,
} from '../../components/ui/icons.jsx';
import toast from 'react-hot-toast';
import { loginUser, clearError } from '../../features/authSlice.js';

const DEMO_USERS = [
  { role: 'Admin', email: 'admin@flashshop.com', pass: 'Admin@12345', label: 'Admin', desc: 'Full store access & AI evals', icon: IconShieldCheck, color: 'border-[#087F65]/40 bg-[#EAF4EF] text-[#075E4B] hover:border-[#087F65]' },
  { role: 'Customer', email: 'demo@flashshop.com', pass: 'Demo@12345', label: 'Customer', desc: 'Shop, cart, wishlist & orders', icon: IconShoppingCart, color: 'border-[#E4EAE6] bg-white text-[#202923] hover:border-[#087F65]' },
  { role: 'Seller', email: 'seller@flashshop.com', pass: 'Seller@12345', label: 'Seller', desc: 'Vendor inventory & products', icon: IconBriefcase, color: 'border-[#DDEBE3] bg-[#F1F7F4] text-[#075E4B] hover:border-[#087F65]' },
  { role: 'Manager', email: 'manager@flashshop.com', pass: 'Manager@12345', label: 'Manager', desc: 'Store operations & catalog', icon: IconUsers, color: 'border-[#E4EAE6] bg-white text-[#202923] hover:border-[#087F65]' },
];

/** Multi-user Login page styled in clean white & soft mint. */
export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector((s) => s.auth);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => { document.title = 'Sign in — FlashShop'; dispatch(clearError()); }, [dispatch]);

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
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg rounded-2xl border border-[#E4EAE6] bg-white p-8 shadow-[0_8px_30px_rgba(21,61,43,0.08)]">
        <h1 className="text-center font-display text-2xl font-bold text-[#202923]">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-[#65716A]">Sign in to your FlashShop account</p>

        {/* 1-Click Multi-User Demo Switcher */}
        <div className="mt-6 rounded-xl border border-[#E4EAE6] bg-[#F1F7F4] p-4">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#075E4B]">
            <IconZap size={15} className="text-[#087F65]" /> Multi-User 1-Click Quick Login
          </div>
          <p className="mt-1 text-xs text-[#65716A]">Click any profile below to instantly log in as that role:</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {DEMO_USERS.map((u) => {
              const RoleIcon = u.icon;
              return (
                <button
                  key={u.role}
                  type="button"
                  onClick={() => quickLogin(u.email, u.pass)}
                  disabled={loading}
                  className={`flex flex-col items-start rounded-lg border p-2.5 text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${u.color}`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-bold">
                    <RoleIcon size={14} className="text-[#087F65]" />
                    {u.label}
                  </span>
                  <span className="text-[11px] opacity-80">{u.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-[#E4EAE6]" />
          <span className="absolute bg-white px-3 text-xs uppercase text-[#89938D]">or sign in with email</span>
        </div>

        {error && <p className="mb-4 rounded-lg bg-[#B42318]/10 border border-[#B42318]/20 px-4 py-2.5 text-sm text-[#B42318]">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-[#202923]">Email</label>
            <input type="email" placeholder="you@example.com" className="input-field"
              {...register('email', { required: 'Email is required', pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email' } })} />
            {errors.email && <p className="mt-1 text-xs text-[#B42318]">{errors.email.message}</p>}
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="text-xs font-bold uppercase text-[#202923]">Password</label>
              <Link to="/forgot-password" className="text-xs text-[#087F65] hover:underline">Forgot password?</Link>
            </div>
            <input type="password" placeholder="••••••••" className="input-field"
              {...register('password', { required: 'Password is required' })} />
            {errors.password && <p className="mt-1 text-xs text-[#B42318]">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 font-semibold shadow-sm">{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-[#65716A]">
          New to FlashShop? <Link to="/signup" className="font-semibold text-[#087F65] hover:underline">Create an account</Link>
        </p>
      </motion.div>
    </div>
  );
}

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { registerUser, clearError } from '../../features/authSlice.js';

/** Signup form with password confirmation. */
export default function Signup() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((s) => s.auth);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  useEffect(() => { document.title = 'Create account — FlashShop'; dispatch(clearError()); }, [dispatch]);

  useEffect(() => {
    if (user) {
      toast.success('Account created! Check your email to verify it.');
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = ({ name, email, password, role }) => dispatch(registerUser({ name, email, password, role }));

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-md rounded-3xl p-8">
        <h1 className="text-center font-display text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-center text-sm text-slate-400">Join FlashShop for exclusive deals</p>

        {error && <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 p-2.5 text-xs font-semibold transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/20 has-[:checked]:text-primary-300">
                <input type="radio" value="user" defaultChecked {...register('role')} className="hidden" />
                🛍️ Customer
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 p-2.5 text-xs font-semibold transition-colors has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-500/20 has-[:checked]:text-emerald-300">
                <input type="radio" value="seller" {...register('role')} className="hidden" />
                🏪 Seller / Vendor
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Full name</label>
            <input placeholder="Your name" className="input-field"
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name is too short' } })} />
            {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Email</label>
            <input type="email" placeholder="you@example.com" className="input-field"
              {...register('email', { required: 'Email is required', pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email' } })} />
            {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Password</label>
            <input type="password" placeholder="Min. 8 characters" className="input-field"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} />
            {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">Confirm password</label>
            <input type="password" placeholder="Repeat password" className="input-field"
              {...register('confirm', { validate: (v) => v === watch('password') || 'Passwords do not match' })} />
            {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3">{loading ? 'Creating account…' : 'Create account'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="font-semibold text-primary-300 hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

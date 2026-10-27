import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { registerUser, clearError } from '../../features/authSlice.js';

/** Signup form with password confirmation styled in clean white & soft mint. */
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
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md rounded-2xl border border-[#E4EAE6] bg-white p-8 shadow-[0_8px_30px_rgba(21,61,43,0.08)]">
        <h1 className="text-center font-display text-2xl font-bold text-[#202923]">Create your account</h1>
        <p className="mt-1 text-center text-sm text-[#65716A]">Join FlashShop for exclusive electronics deals</p>

        {error && <p className="mt-4 rounded-lg bg-[#B42318]/10 border border-[#B42318]/20 px-4 py-2.5 text-sm text-[#B42318]">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-[#202923]">Account Type</label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E4EAE6] bg-white p-2.5 text-xs font-semibold text-[#202923] transition-colors has-[:checked]:border-[#087F65] has-[:checked]:bg-[#EAF4EF] has-[:checked]:text-[#075E4B]">
                <input type="radio" value="user" defaultChecked {...register('role')} className="hidden" />
                🛍️ Customer
              </label>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#E4EAE6] bg-white p-2.5 text-xs font-semibold text-[#202923] transition-colors has-[:checked]:border-[#087F65] has-[:checked]:bg-[#EAF4EF] has-[:checked]:text-[#075E4B]">
                <input type="radio" value="seller" {...register('role')} className="hidden" />
                🏪 Seller / Vendor
              </label>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-[#202923]">Full name</label>
            <input placeholder="Your full name" className="input-field"
              {...register('name', { required: 'Name is required', minLength: { value: 2, message: 'Name is too short' } })} />
            {errors.name && <p className="mt-1 text-xs text-[#B42318]">{errors.name.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-[#202923]">Email address</label>
            <input type="email" placeholder="you@example.com" className="input-field"
              {...register('email', { required: 'Email is required', pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email' } })} />
            {errors.email && <p className="mt-1 text-xs text-[#B42318]">{errors.email.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-[#202923]">Password</label>
            <input type="password" placeholder="Min. 8 characters" className="input-field"
              {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} />
            {errors.password && <p className="mt-1 text-xs text-[#B42318]">{errors.password.message}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-[#202923]">Confirm password</label>
            <input type="password" placeholder="Repeat password" className="input-field"
              {...register('confirm', { validate: (v) => v === watch('password') || 'Passwords do not match' })} />
            {errors.confirm && <p className="mt-1 text-xs text-[#B42318]">{errors.confirm.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 font-semibold shadow-sm">{loading ? 'Creating account…' : 'Create account'}</button>
        </form>

        <p className="mt-6 text-center text-sm text-[#65716A]">
          Already have an account? <Link to="/login" className="font-semibold text-[#087F65] hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}

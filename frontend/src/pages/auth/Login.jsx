import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { loginUser, clearError } from '../../features/authSlice.js';

/** Login form (React Hook Form + Redux thunk). */
export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, error } = useSelector((s) => s.auth);
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => { document.title = 'Sign in — LUXORA'; dispatch(clearError()); }, [dispatch]);

  useEffect(() => {
    if (user) {
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      navigate(location.state?.from || '/', { replace: true });
    }
  }, [user, navigate, location]);

  const onSubmit = (form) => dispatch(loginUser(form));

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-md rounded-3xl p-8">
        <h1 className="text-center font-display text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-center text-sm text-slate-400">Sign in to your LUXORA account</p>

        {error && <p className="mt-4 rounded-xl bg-red-500/10 px-4 py-2.5 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
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

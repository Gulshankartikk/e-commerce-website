import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { IconMail } from '../../components/ui/icons.jsx';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';

/** Request a password-reset email. */
export default function ForgotPassword() {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ email }) => {
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-surface w-full max-w-md rounded-2xl p-8 border border-[#E4EAE6] shadow-[0_8px_30px_rgba(21,61,43,0.08)]">
        {sent ? (
          <div className="text-center">
            <IconMail size={48} className="mx-auto text-[#087F65]" />
            <h1 className="mt-4 text-xl font-bold text-[#202923]">Check your inbox</h1>
            <p className="mt-2 text-sm text-[#65716A]">If that email is registered, a reset link is on its way. The link expires in 1 hour.</p>
            <Link to="/login" className="btn-outline mt-6 inline-flex">Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 className="text-center font-display text-2xl font-bold text-[#202923]">Reset your password</h1>
            <p className="mt-1 text-center text-sm text-[#65716A]">Enter your email and we'll send you a reset link</p>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
              <input type="email" placeholder="you@example.com" className="input-field"
                {...register('email', { required: 'Email is required', pattern: { value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/, message: 'Enter a valid email' } })} />
              {errors.email && <p className="text-xs text-[#B42318]">{errors.email.message}</p>}
              <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3">{isSubmitting ? 'Sending…' : 'Send reset link'}</button>
            </form>
            <p className="mt-6 text-center text-sm text-[#65716A]">
              Remembered it? <Link to="/login" className="font-semibold text-[#087F65] hover:underline">Sign in</Link>
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

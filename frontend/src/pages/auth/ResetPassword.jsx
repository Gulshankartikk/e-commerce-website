import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';

/** Set a new password using the emailed token. */
export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ password }) => {
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      localStorage.setItem('lx_token', data.token);
      toast.success('Password updated! You are signed in.');
      navigate('/');
      window.location.reload(); // refresh auth state
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass w-full max-w-md rounded-3xl p-8">
        <h1 className="text-center font-display text-2xl font-bold">Choose a new password</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">New password</label>
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
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full !py-3">{isSubmitting ? 'Updating…' : 'Update password'}</button>
        </form>
      </motion.div>
    </div>
  );
}

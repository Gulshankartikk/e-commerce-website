import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';

/** Change password form. */
export default function ChangePassword() {
  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      const { data } = await api.put('/auth/change-password', { currentPassword, newPassword });
      localStorage.setItem('lx_token', data.token);
      toast.success('Password changed');
      reset();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="card-surface max-w-xl p-6">
      <h2 className="mb-4 text-lg font-bold">Change password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Current password</label>
          <input type="password" className="input-field" {...register('currentPassword', { required: 'Current password is required' })} />
          {errors.currentPassword && <p className="mt-1 text-xs text-red-400">{errors.currentPassword.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">New password</label>
          <input type="password" className="input-field" {...register('newPassword', { required: 'New password is required', minLength: { value: 8, message: 'Use at least 8 characters' } })} />
          {errors.newPassword && <p className="mt-1 text-xs text-red-400">{errors.newPassword.message}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Confirm new password</label>
          <input type="password" className="input-field" {...register('confirm', { validate: (v) => v === watch('newPassword') || 'Passwords do not match' })} />
          {errors.confirm && <p className="mt-1 text-xs text-red-400">{errors.confirm.message}</p>}
        </div>
        <button type="submit" disabled={isSubmitting} className="btn-primary">{isSubmitting ? 'Updating…' : 'Update password'}</button>
      </form>
    </div>
  );
}

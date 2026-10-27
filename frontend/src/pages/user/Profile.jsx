import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import { setUser } from '../../features/authSlice.js';
import { formatDate } from '../../utils/format.js';

/** Profile info + name editing + email verification status. */
export default function Profile() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    if (name.trim().length < 2) { toast.error('Name is too short'); return; }
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', { name: name.trim() });
      dispatch(setUser(data.user));
      toast.success('Profile updated');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const resendVerification = async () => {
    try {
      await api.post('/auth/resend-verification');
      toast.success('Verification email sent');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="card-surface max-w-xl p-6">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary-500 text-2xl font-bold text-white">
          {user?.name?.[0]?.toUpperCase()}
        </span>
        <div>
          <h2 className="text-lg font-bold">{user?.name}</h2>
          <p className="text-sm text-slate-400">Member since {formatDate(user?.createdAt)}</p>
        </div>
      </div>

      <form onSubmit={save} className="mt-6 space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Email</label>
          <input value={user?.email || ''} disabled className="input-field opacity-60" />
          {user?.isVerified ? (
            <p className="mt-1.5 text-xs text-[#168764] font-medium">✓ Email verified</p>
          ) : (
            <p className="mt-1.5 text-xs text-[#65716A]">
              Email not verified — <button type="button" onClick={resendVerification} className="underline text-[#087F65] font-medium">resend link</button>
            </p>
          )}
        </div>
        <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}

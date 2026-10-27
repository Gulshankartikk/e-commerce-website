import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import api from '../../api/axios.js';
import Modal from '../../components/ui/Modal.jsx';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatPrice, formatDate } from '../../utils/format.js';

const EMPTY = { code: '', description: '', discountType: 'percent', discountValue: '', minOrderAmount: '', maxDiscount: '', expiresAt: '', usageLimit: '', isActive: true };

/** Admin coupon management. */
export default function AdminCoupons() {
  const { data, loading, refetch } = useFetch('/coupons');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModal(true); };
  const openEdit = (c) => {
    setEditing(c._id);
    setForm({ ...c, expiresAt: c.expiresAt?.slice(0, 10) || '', maxDiscount: c.maxDiscount ?? '', usageLimit: c.usageLimit ?? '', minOrderAmount: c.minOrderAmount ?? '' });
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.code || !form.discountValue || !form.expiresAt) { toast.error('Code, value and expiry are required'); return; }
    setSaving(true);
    const body = {
      code: form.code.toUpperCase(), description: form.description, discountType: form.discountType,
      discountValue: Number(form.discountValue), minOrderAmount: Number(form.minOrderAmount) || 0,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null, expiresAt: form.expiresAt,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null, isActive: form.isActive,
    };
    try {
      if (editing) await api.put(`/coupons/${editing}`, body);
      else await api.post('/coupons', body);
      toast.success(editing ? 'Coupon updated' : 'Coupon created');
      setModal(false);
      refetch();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try { await api.delete(`/coupons/${c._id}`); toast.success('Coupon deleted'); refetch(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button onClick={openAdd} className="btn-primary !py-2 text-sm"><FiPlus /> New coupon</button>
      </div>

      {loading ? <TableSkeleton rows={4} /> : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-slate-400">
                <th className="p-4">Code</th><th className="p-4">Discount</th><th className="p-4">Min order</th><th className="p-4">Used</th><th className="p-4">Expires</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.coupons || []).map((c) => {
                const expired = new Date(c.expiresAt) < new Date();
                return (
                  <tr key={c._id} className="border-b border-white/5 transition-colors hover:bg-white/[0.03]">
                    <td className="p-4"><span className="font-mono font-bold text-secondary-400">{c.code}</span><p className="text-xs text-slate-500">{c.description}</p></td>
                    <td className="p-4">{c.discountType === 'percent' ? `${c.discountValue}%${c.maxDiscount ? ` (max ${formatPrice(c.maxDiscount)})` : ''}` : formatPrice(c.discountValue)}</td>
                    <td className="p-4">{c.minOrderAmount ? formatPrice(c.minOrderAmount) : '—'}</td>
                    <td className="p-4">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                    <td className="p-4 text-slate-400">{formatDate(c.expiresAt)}</td>
                    <td className="p-4">
                      {expired ? <span className="chip bg-red-500/15 text-red-400">Expired</span>
                        : c.isActive ? <span className="chip bg-green-500/15 text-green-400">Active</span>
                        : <span className="chip bg-slate-500/15 text-slate-400">Inactive</span>}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => openEdit(c)} aria-label="Edit" className="p-2 text-slate-400 hover:text-primary-300"><FiEdit2 /></button>
                      <button onClick={() => remove(c)} aria-label="Delete" className="p-2 text-slate-400 hover:text-red-400"><FiTrash2 /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit coupon' : 'New coupon'}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <input placeholder="Code (e.g. SAVE20) *" value={form.code} onChange={set('code')} className="input-field uppercase" />
          <select value={form.discountType} onChange={set('discountType')} className="input-field" aria-label="Discount type">
            <option value="percent">Percent (%)</option>
            <option value="flat">Flat (₹)</option>
          </select>
          <input type="number" min="1" placeholder={form.discountType === 'percent' ? 'Discount % *' : 'Discount ₹ *'} value={form.discountValue} onChange={set('discountValue')} className="input-field" />
          <input type="number" min="0" placeholder="Min order amount (₹)" value={form.minOrderAmount} onChange={set('minOrderAmount')} className="input-field" />
          {form.discountType === 'percent' && (
            <input type="number" min="0" placeholder="Max discount cap (₹)" value={form.maxDiscount} onChange={set('maxDiscount')} className="input-field" />
          )}
          <input type="number" min="0" placeholder="Usage limit (blank = unlimited)" value={form.usageLimit} onChange={set('usageLimit')} className="input-field" />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-slate-400">Expiry date *</label>
            <input type="date" value={form.expiresAt} onChange={set('expiresAt')} className="input-field" />
          </div>
          <input placeholder="Description (shown to admins)" value={form.description} onChange={set('description')} className="input-field sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="h-4 w-4 accent-[#087F65]" /> Active</label>
          <button type="submit" disabled={saving} className="btn-primary sm:col-span-2">{saving ? 'Saving…' : 'Save coupon'}</button>
        </form>
      </Modal>
    </div>
  );
}

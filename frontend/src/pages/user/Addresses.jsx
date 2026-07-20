import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../api/axios.js';
import Modal from '../../components/ui/Modal.jsx';

/** Address book management: add, edit, delete, set default. */
export default function Addresses() {
  const [addresses, setAddresses] = useState([]);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const load = () => api.get('/addresses').then(({ data }) => setAddresses(data.addresses)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); reset({}); setModal(true); };
  const openEdit = (a) => { setEditing(a._id); reset(a); setModal(true); };

  const onSubmit = async (form) => {
    try {
      if (editing) await api.put(`/addresses/${editing}`, form);
      else await api.post('/addresses', form);
      toast.success(editing ? 'Address updated' : 'Address added');
      setModal(false);
      load();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Address deleted');
      load();
    } catch (e) { toast.error(e.message); }
  };

  const inputCls = (err) => `input-field ${err ? '!border-red-500' : ''}`;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Saved addresses</h2>
        <button onClick={openAdd} className="btn-primary !py-2 text-sm"><FiPlus /> Add address</button>
      </div>

      {addresses.length === 0 ? (
        <div className="card-surface flex flex-col items-center gap-3 p-10 text-center">
          <FiMapPin className="text-4xl text-slate-600" />
          <p className="text-sm text-slate-400">No addresses saved yet. Add one to speed up checkout.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a._id} className="card-surface p-5">
              <div className="flex items-start justify-between">
                <p className="font-semibold">{a.fullName} {a.isDefault && <span className="chip ml-1 bg-secondary-500/20 text-[10px] text-secondary-400">Default</span>}</p>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(a)} aria-label="Edit" className="p-1.5 text-slate-400 hover:text-primary-300"><FiEdit2 /></button>
                  <button onClick={() => remove(a._id)} aria-label="Delete" className="p-1.5 text-slate-400 hover:text-red-400"><FiTrash2 /></button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-400">{a.line1}{a.line2 && `, ${a.line2}`}</p>
              <p className="text-sm text-slate-400">{a.city}, {a.state} — {a.pincode}</p>
              <p className="mt-1 text-sm text-slate-400">📞 {a.phone}</p>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit address' : 'Add address'}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
          <div>
            <input placeholder="Full name" className={inputCls(errors.fullName)} {...register('fullName', { required: true })} />
            {errors.fullName && <p className="mt-1 text-xs text-red-400">Required</p>}
          </div>
          <div>
            <input placeholder="Mobile number" className={inputCls(errors.phone)} {...register('phone', { required: true, pattern: /^[6-9]\d{9}$/ })} />
            {errors.phone && <p className="mt-1 text-xs text-red-400">Valid 10-digit number required</p>}
          </div>
          <div className="sm:col-span-2">
            <input placeholder="Address line 1" className={inputCls(errors.line1)} {...register('line1', { required: true })} />
            {errors.line1 && <p className="mt-1 text-xs text-red-400">Required</p>}
          </div>
          <input placeholder="Address line 2 (optional)" className="input-field sm:col-span-2" {...register('line2')} />
          <div>
            <input placeholder="City" className={inputCls(errors.city)} {...register('city', { required: true })} />
            {errors.city && <p className="mt-1 text-xs text-red-400">Required</p>}
          </div>
          <div>
            <input placeholder="State" className={inputCls(errors.state)} {...register('state', { required: true })} />
            {errors.state && <p className="mt-1 text-xs text-red-400">Required</p>}
          </div>
          <div>
            <input placeholder="Pincode" className={inputCls(errors.pincode)} {...register('pincode', { required: true, pattern: /^\d{6}$/ })} />
            {errors.pincode && <p className="mt-1 text-xs text-red-400">Valid 6-digit pincode required</p>}
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" {...register('isDefault')} /> Set as default
          </label>
          <button type="submit" disabled={isSubmitting} className="btn-primary sm:col-span-2">{isSubmitting ? 'Saving…' : 'Save address'}</button>
        </form>
      </Modal>
    </div>
  );
}

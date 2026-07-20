import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import api from '../../api/axios.js';
import Modal from '../../components/ui/Modal.jsx';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { imgUrl } from '../../utils/format.js';

const EMPTY = { title: '', subtitle: '', link: '/products', ctaText: 'Shop Now', position: 'hero', order: 0, isActive: true };

/** Admin banner management with image upload. */
export default function AdminBanners() {
  const { data, loading, refetch } = useFetch('/banners/admin');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const openAdd = () => { setEditing(null); setForm(EMPTY); setFile(null); setModal(true); };
  const openEdit = (b) => { setEditing(b._id); setForm({ ...EMPTY, ...b }); setFile(null); setModal(true); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title is required'); return; }
    if (!editing && !file) { toast.error('Banner image is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      ['title', 'subtitle', 'link', 'ctaText', 'position', 'order', 'isActive'].forEach((k) => fd.append(k, form[k]));
      if (file) fd.append('image', file);
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editing) await api.put(`/banners/${editing}`, fd, cfg);
      else await api.post('/banners', fd, cfg);
      toast.success(editing ? 'Banner updated' : 'Banner created');
      setModal(false);
      refetch();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (b) => {
    if (!window.confirm(`Delete banner "${b.title}"?`)) return;
    try { await api.delete(`/banners/${b._id}`); toast.success('Banner deleted'); refetch(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Banners</h1>
        <button onClick={openAdd} className="btn-primary !py-2 text-sm"><FiPlus /> New banner</button>
      </div>

      {loading ? <TableSkeleton rows={3} /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {(data?.banners || []).map((b) => (
            <div key={b._id} className="card-surface overflow-hidden">
              <img src={imgUrl(b.image?.url)} alt={b.title} className="h-40 w-full object-cover" />
              <div className="flex items-start justify-between p-4">
                <div>
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-xs text-slate-400">{b.subtitle}</p>
                  <div className="mt-2 flex gap-2">
                    <span className="chip bg-white/5 capitalize text-slate-300">{b.position}</span>
                    <span className="chip bg-white/5 text-slate-300">Order {b.order}</span>
                    {b.isActive ? <span className="chip bg-green-500/15 text-green-400">Live</span> : <span className="chip bg-slate-500/15 text-slate-400">Hidden</span>}
                  </div>
                </div>
                <div className="flex">
                  <button onClick={() => openEdit(b)} aria-label="Edit" className="p-2 text-slate-400 hover:text-primary-300"><FiEdit2 /></button>
                  <button onClick={() => remove(b)} aria-label="Delete" className="p-2 text-slate-400 hover:text-red-400"><FiTrash2 /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit banner' : 'New banner'}>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <input placeholder="Title *" value={form.title} onChange={set('title')} className="input-field sm:col-span-2" />
          <input placeholder="Subtitle" value={form.subtitle} onChange={set('subtitle')} className="input-field sm:col-span-2" />
          <input placeholder="Link (e.g. /products)" value={form.link} onChange={set('link')} className="input-field" />
          <input placeholder="CTA text" value={form.ctaText} onChange={set('ctaText')} className="input-field" />
          <select value={form.position} onChange={set('position')} className="input-field" aria-label="Position">
            <option value="hero">Hero</option><option value="strip">Strip</option><option value="sidebar">Sidebar</option>
          </select>
          <input type="number" placeholder="Order" value={form.order} onChange={set('order')} className="input-field" />
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">{editing ? 'Replace image (optional)' : 'Banner image * (1600×700 recommended)'}</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])}
              className="mt-1 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} className="h-4 w-4 accent-indigo-600" /> Active</label>
          <button type="submit" disabled={saving} className="btn-primary sm:col-span-2">{saving ? 'Saving…' : 'Save banner'}</button>
        </form>
      </Modal>
    </div>
  );
}

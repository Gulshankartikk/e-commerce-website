import { useState } from 'react';
import { IconPlus, IconEdit, IconTrash2 } from '../../components/ui/icons.jsx';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import api from '../../api/axios.js';
import Modal from '../../components/ui/Modal.jsx';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { imgUrl } from '../../utils/format.js';

/** Combined Category + Brand management. */
export default function AdminCatalog() {
  const [tab, setTab] = useState('categories');
  const { data: catData, loading: catLoading, refetch: refetchCats } = useFetch('/categories');
  const { data: brandData, loading: brandLoading, refetch: refetchBrands } = useFetch('/brands');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const isCat = tab === 'categories';
  const items = isCat ? catData?.categories : brandData?.brands;
  const loading = isCat ? catLoading : brandLoading;
  const refetch = isCat ? refetchCats : refetchBrands;
  const endpoint = isCat ? '/categories' : '/brands';
  const imageField = isCat ? 'image' : 'logo';

  const openAdd = () => { setEditing(null); setForm({ name: '', description: '' }); setFile(null); setModal(true); };
  const openEdit = (item) => { setEditing(item._id); setForm({ name: item.name, description: item.description || '' }); setFile(null); setModal(true); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      if (isCat) fd.append('description', form.description);
      if (file) fd.append(imageField, file);
      const cfg = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editing) await api.put(`${endpoint}/${editing}`, fd, cfg);
      else await api.post(endpoint, fd, cfg);
      toast.success('Saved');
      setModal(false);
      refetch();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try { await api.delete(`${endpoint}/${item._id}`); toast.success('Deleted'); refetch(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories & Brands</h1>
        <button onClick={openAdd} className="btn-primary !py-2 text-sm flex items-center gap-1.5"><IconPlus size={16} /> Add {isCat ? 'category' : 'brand'}</button>
      </div>

      <div className="mb-5 flex gap-2">
        {['categories', 'brands'].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-xl px-5 py-2 text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-primary text-white shadow-glow' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>
            {t}
          </button>
        ))}
      </div>

      {loading ? <TableSkeleton rows={4} /> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(items || []).map((item) => (
            <div key={item._id} className="card-surface flex items-center gap-4 p-4">
              <img src={imgUrl((item.image || item.logo)?.url)} alt={item.name} className="h-14 w-14 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{item.name}</p>
                {item.description && <p className="truncate text-xs text-slate-400">{item.description}</p>}
              </div>
              <div className="flex shrink-0">
                <button onClick={() => openEdit(item)} aria-label="Edit" className="p-1.5 text-[#65716A] hover:bg-[#EAF4EF] hover:text-[#087F65] rounded-lg transition-colors mr-1"><IconEdit size={16} /></button>
                <button onClick={() => remove(item)} aria-label="Delete" className="p-1.5 text-[#65716A] hover:bg-[#EAF4EF] hover:text-[#B42318] rounded-lg transition-colors"><IconTrash2 size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={`${editing ? 'Edit' : 'Add'} ${isCat ? 'category' : 'brand'}`} maxWidth="max-w-md">
        <form onSubmit={submit} className="space-y-4">
          <input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          {isCat && <textarea placeholder="Description" rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field resize-none" />}
          <div>
            <label className="text-xs text-slate-400">{isCat ? 'Category image' : 'Brand logo'}{editing ? ' (optional — keeps current if empty)' : ''}</label>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])}
              className="mt-1 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
          </div>
          <button type="submit" disabled={saving} className="btn-primary w-full">{saving ? 'Saving…' : 'Save'}</button>
        </form>
      </Modal>
    </div>
  );
}

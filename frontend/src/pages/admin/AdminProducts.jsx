import { useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import api from '../../api/axios.js';
import Modal from '../../components/ui/Modal.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatPrice, imgUrl } from '../../utils/format.js';

const EMPTY_FORM = { name: '', description: '', price: '', mrp: '', stock: '', category: '', brand: '', highlights: '', colors: '', sizes: '', tags: '', isFeatured: false, isFlashSale: false };

/** Admin product management: paginated table + create/edit modal with multi-image upload. */
export default function AdminProducts() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);
  const { data, loading, refetch } = useFetch(`/products/admin/all?page=${page}&keyword=${encodeURIComponent(debouncedSearch)}`, [page, debouncedSearch]);
  const { data: catData } = useFetch('/categories');
  const { data: brandData } = useFetch('/brands');

  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null); // product being edited
  const [form, setForm] = useState(EMPTY_FORM);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFiles([]); setModal(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description, price: p.price, mrp: p.mrp || '', stock: p.stock,
      category: p.category?._id || p.category, brand: p.brand?._id || p.brand,
      highlights: (p.highlights || []).join('\n'), colors: (p.colors || []).join(', '),
      sizes: (p.sizes || []).join(', '), tags: (p.tags || []).join(', '),
      isFeatured: p.isFeatured, isFlashSale: p.isFlashSale,
    });
    setFiles([]);
    setModal(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.price || !form.category || !form.brand) {
      toast.error('Name, description, price, category and brand are required'); return;
    }
    if (!editing && !files.length) { toast.error('Upload at least one product image'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', form.price);
      if (form.mrp) fd.append('mrp', form.mrp);
      fd.append('stock', form.stock || 0);
      fd.append('category', form.category);
      fd.append('brand', form.brand);
      fd.append('isFeatured', form.isFeatured);
      fd.append('isFlashSale', form.isFlashSale);
      fd.append('highlights', JSON.stringify(form.highlights.split('\n').map((s) => s.trim()).filter(Boolean)));
      fd.append('colors', JSON.stringify(form.colors.split(',').map((s) => s.trim()).filter(Boolean)));
      fd.append('sizes', JSON.stringify(form.sizes.split(',').map((s) => s.trim()).filter(Boolean)));
      fd.append('tags', JSON.stringify(form.tags.split(',').map((s) => s.trim()).filter(Boolean)));
      files.forEach((f) => fd.append('images', f));
      const config = { headers: { 'Content-Type': 'multipart/form-data' } };
      if (editing) {
        await api.put(`/products/${editing._id}`, fd, config);
        toast.success('Product updated');
      } else {
        await api.post('/products', fd, config);
        toast.success('Product created');
      }
      setModal(false);
      refetch();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This also removes its reviews.`)) return;
    try {
      await api.delete(`/products/${p._id}`);
      toast.success('Product deleted');
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  const quickStock = async (p) => {
    const value = window.prompt(`Update stock for "${p.name}"`, p.stock);
    if (value === null) return;
    try {
      await api.put(`/products/${p._id}/stock`, { stock: Number(value) });
      toast.success('Stock updated');
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products {data && <span className="text-sm font-normal text-slate-400">({data.total})</span>}</h1>
        <div className="flex gap-3">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search products…" className="input-field !py-2 pl-9 text-sm" />
          </div>
          <button onClick={openAdd} className="btn-primary !py-2 text-sm"><FiPlus /> Add product</button>
        </div>
      </div>

      {loading ? <TableSkeleton rows={6} /> : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-slate-400">
                <th className="p-4">Product</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Sold</th><th className="p-4">Flags</th><th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.products || []).map((p) => (
                <tr key={p._id} className="border-b border-white/5 transition-colors hover:bg-white/[0.03]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={imgUrl(p.images?.[0]?.url)} alt="" className="h-11 w-11 rounded-lg object-cover" />
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.category?.name} · {p.brand?.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">{formatPrice(p.price)}{p.mrp > p.price && <span className="ml-1 text-xs text-slate-500 line-through">{formatPrice(p.mrp)}</span>}</td>
                  <td className="p-4">
                    <button onClick={() => quickStock(p)} className={`font-semibold hover:underline ${p.stock <= 5 ? 'text-accent' : ''}`}>{p.stock}</button>
                  </td>
                  <td className="p-4">{p.sold}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      {p.isFeatured && <span className="chip bg-primary/20 text-primary-300">Featured</span>}
                      {p.isFlashSale && <span className="chip bg-accent/20 text-accent">Flash</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => openEdit(p)} aria-label="Edit" className="p-2 text-slate-400 hover:text-primary-300"><FiEdit2 /></button>
                    <button onClick={() => remove(p)} aria-label="Delete" className="p-2 text-slate-400 hover:text-red-400"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={data?.pages} onChange={setPage} />

      {/* Create / edit modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit product' : 'Add product'} maxWidth="max-w-3xl">
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <input placeholder="Product name *" value={form.name} onChange={set('name')} className="input-field sm:col-span-2" />
          <textarea placeholder="Description *" rows="3" value={form.description} onChange={set('description')} className="input-field resize-none sm:col-span-2" />
          <input type="number" min="0" placeholder="Price (₹) *" value={form.price} onChange={set('price')} className="input-field" />
          <input type="number" min="0" placeholder="MRP (₹, optional)" value={form.mrp} onChange={set('mrp')} className="input-field" />
          <input type="number" min="0" placeholder="Stock" value={form.stock} onChange={set('stock')} className="input-field" />
          <select value={form.category} onChange={set('category')} className="input-field" aria-label="Category">
            <option value="">Category *</option>
            {(catData?.categories || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select value={form.brand} onChange={set('brand')} className="input-field" aria-label="Brand">
            <option value="">Brand *</option>
            {(brandData?.brands || []).map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <input placeholder="Colors (comma separated)" value={form.colors} onChange={set('colors')} className="input-field" />
          <input placeholder="Sizes (comma separated)" value={form.sizes} onChange={set('sizes')} className="input-field" />
          <input placeholder="Tags (comma separated)" value={form.tags} onChange={set('tags')} className="input-field" />
          <textarea placeholder="Highlights (one per line)" rows="3" value={form.highlights} onChange={set('highlights')} className="input-field resize-none sm:col-span-2" />
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">{editing ? 'Add more images (existing ones are kept)' : 'Product images * (up to 6)'}</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files].slice(0, 6))}
              className="mt-1 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white" />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} className="h-4 w-4 accent-indigo-600" /> Featured</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isFlashSale} onChange={set('isFlashSale')} className="h-4 w-4 accent-indigo-600" /> Flash sale</label>
          <button type="submit" disabled={saving} className="btn-primary sm:col-span-2">{saving ? 'Saving…' : editing ? 'Update product' : 'Create product'}</button>
        </form>
      </Modal>
    </div>
  );
}

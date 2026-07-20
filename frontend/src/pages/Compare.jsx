import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiBarChart2, FiX } from 'react-icons/fi';
import api from '../api/axios.js';
import Rating from '../components/ui/Rating.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import { toggleCompare } from '../features/uiSlice.js';
import { formatPrice, imgUrl } from '../utils/format.js';

/** Side-by-side comparison of up to 3 products (slugs stored in ui.compareItems). */
export default function Compare() {
  const dispatch = useDispatch();
  const slugs = useSelector((s) => s.ui.compareItems);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Compare — LUXORA';
    if (!slugs.length) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    Promise.all(slugs.map((slug) => api.get(`/products/${slug}`).then((r) => r.data.product).catch(() => null)))
      .then((list) => setProducts(list.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [slugs]);

  if (!loading && !products.length) {
    return <EmptyState icon={FiBarChart2} title="Nothing to compare" message="Add up to 3 products to compare using the compare icon on any product card." />;
  }

  const rows = [
    { label: 'Price', render: (p) => <span className="font-bold text-secondary-400">{formatPrice(p.price)}</span> },
    { label: 'MRP', render: (p) => (p.mrp ? formatPrice(p.mrp) : '—') },
    { label: 'Rating', render: (p) => <Rating value={p.ratingsAverage} count={p.ratingsCount} /> },
    { label: 'Brand', render: (p) => p.brand?.name || '—' },
    { label: 'Category', render: (p) => p.category?.name || '—' },
    { label: 'Stock', render: (p) => (p.stock > 0 ? `${p.stock} available` : 'Out of stock') },
    { label: 'Colors', render: (p) => p.colors?.join(', ') || '—' },
    { label: 'Sizes', render: (p) => p.sizes?.join(', ') || '—' },
    { label: 'Highlights', render: (p) => <ul className="list-inside list-disc space-y-1 text-left text-xs">{(p.highlights || []).map((h, i) => <li key={i}>{h}</li>)}</ul> },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Compare' }]} />
      <h1 className="section-title mb-6">Compare products</h1>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-32 p-3 text-left text-slate-400">Product</th>
              {products.map((p) => (
                <th key={p._id} className="card-surface p-4 text-center align-top">
                  <button onClick={() => dispatch(toggleCompare(p.slug))} aria-label="Remove from compare" className="ml-auto block text-slate-400 hover:text-red-400"><FiX /></button>
                  <Link to={`/product/${p.slug}`}>
                    <img src={imgUrl(p.images?.[0]?.url)} alt={p.name} className="mx-auto h-32 w-32 rounded-xl object-cover" />
                    <p className="mt-2 font-semibold transition-colors hover:text-primary-300">{p.name}</p>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-white/10">
                <td className="p-3 font-semibold text-slate-400">{row.label}</td>
                {products.map((p) => <td key={p._id} className="p-3 text-center">{row.render(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

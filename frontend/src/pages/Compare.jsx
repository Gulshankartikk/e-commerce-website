import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiBarChart2, FiX, FiCheck } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import Rating from '../components/ui/Rating.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import { toggleCompare, setAiDrawer } from '../features/uiSlice.js';
import { formatPrice, imgUrl } from '../utils/format.js';

/** Side-by-side comparison of up to 3 products (slugs stored in ui.compareItems). */
export default function Compare() {
  const dispatch = useDispatch();
  const slugs = useSelector((s) => s.ui.compareItems);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Comparison state
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    document.title = 'Compare — FlashShop';
    if (!slugs.length) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    setAiAnalysis(null);
    Promise.all(slugs.map((slug) => api.get(`/products/${slug}`).then((r) => r.data.product).catch(() => null)))
      .then((list) => setProducts(list.filter(Boolean)))
      .finally(() => setLoading(false));
  }, [slugs]);

  const requestAiComparison = async () => {
    if (products.length < 2) {
      toast.error('Add at least 2 products to compare');
      return;
    }
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/compare', {
        productIds: products.map((p) => p._id),
      });
      setAiAnalysis(data.comparison);
      toast.success('AI comparison generated');
    } catch (err) {
      toast.error(err.message || 'Could not generate AI comparison');
    } finally {
      setAiLoading(false);
    }
  };

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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="section-title !mb-0">Compare products</h1>
        {products.length >= 2 && (
          <button
            onClick={requestAiComparison}
            disabled={aiLoading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-900/30 hover:shadow-rose-600/20 disabled:opacity-50 transition-all"
          >
            <BsStars className={aiLoading ? 'animate-spin' : ''} />
            {aiLoading ? 'Analyzing Specifications...' : '✨ Ask AI for Recommendation'}
          </button>
        )}
      </div>

      {/* AI Comparison Analysis Result Card */}
      {aiAnalysis && (
        <div className="mb-8 rounded-2xl border border-rose-500/30 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 p-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-slate-750 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 to-rose-600 text-white shadow-md">
              <BsStars className="text-lg" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Gemini AI Executive Comparison Verdict</h3>
              <p className="text-xs text-slate-400">Personalized purchasing decision based on catalog specs</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <p className="text-sm text-slate-200 leading-relaxed">
              {aiAnalysis.summary}
            </p>

            <div className="rounded-xl bg-slate-950/50 p-4 border-l-4 border-amber-400">
              <p className="text-xs uppercase font-bold tracking-wider text-amber-400 mb-1">Expert Verdict</p>
              <p className="text-sm font-medium text-slate-100">{aiAnalysis.verdict}</p>
            </div>

            {aiAnalysis.dimensions?.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
                <table className="w-full text-xs">
                  <thead className="bg-slate-950/80 text-slate-400">
                    <tr>
                      <th className="p-2.5 text-left font-semibold">Evaluation Factor</th>
                      {products.map((p) => (
                        <th key={p._id} className="p-2.5 text-left font-semibold text-rose-300">
                          {p.name.slice(0, 25)}...
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60">
                    {aiAnalysis.dimensions.map((dim, i) => (
                      <tr key={i} className="hover:bg-slate-800/40">
                        <td className="p-2.5 font-medium text-slate-300">{dim.feature}</td>
                        {dim.values?.map((val, idx) => (
                          <td key={idx} className="p-2.5 text-slate-400">{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() =>
                  dispatch(
                    setAiDrawer({
                      open: true,
                      query: `Help me decide between ${products.map((p) => p.name).join(' and ')}`,
                    })
                  )
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300"
              >
                Discuss further with AI Concierge <BsStars />
              </button>
            </div>
          </div>
        </div>
      )}
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

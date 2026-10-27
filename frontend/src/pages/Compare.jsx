import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IconBarChart, IconX, IconCheck, IconSparkles } from '../components/ui/icons.jsx';
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
    return <EmptyState icon={IconBarChart} title="Nothing to compare" message="Add up to 3 products to compare using the compare icon on any product card." />;
  }

  const rows = [
    { label: 'Price', render: (p) => <span className="font-bold text-[#087F65]">{formatPrice(p.price)}</span> },
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
            className="flex items-center gap-2 rounded-xl bg-[#087F65] hover:bg-[#066B55] px-4 py-2.5 text-xs font-bold text-white shadow-sm disabled:opacity-50 transition-all"
          >
            <IconSparkles size={16} className={aiLoading ? 'animate-spin' : ''} />
            {aiLoading ? 'Analyzing Specifications...' : 'Ask AI for Recommendation'}
          </button>
        )}
      </div>

      {/* AI Comparison Analysis Result Card */}
      {aiAnalysis && (
        <div className="mb-8 rounded-2xl border border-[#E4EAE6] bg-[#F1F7F4] p-6 shadow-sm">
          <div className="flex items-center gap-3 border-b border-[#E4EAE6] pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF4EF] text-[#075E4B] border border-[#DDEBE3] shadow-sm">
              <IconSparkles size={20} className="text-[#075E4B]" />
            </div>
            <div>
              <h3 className="font-bold text-[#202923] text-base">Gemini AI Executive Comparison Verdict</h3>
              <p className="text-xs text-[#65716A]">Personalized purchasing decision based on catalog specs</p>
            </div>
          </div>

          <div className="mt-4 space-y-4">
            <p className="text-sm text-[#202923] leading-relaxed">
              {aiAnalysis.summary}
            </p>

            <div className="rounded-xl bg-[#EAF4EF] p-4 border-l-4 border-[#087F65]">
              <p className="text-xs uppercase font-bold tracking-wider text-[#075E4B] mb-1">Expert Verdict</p>
              <p className="text-sm font-medium text-[#202923]">{aiAnalysis.verdict}</p>
            </div>

            {aiAnalysis.dimensions?.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-xl border border-[#E4EAE6]">
                <table className="w-full text-xs">
                  <thead className="bg-[#EAF4EF] text-[#202923]">
                    <tr>
                      <th className="p-2.5 text-left font-semibold">Evaluation Factor</th>
                      {products.map((p) => (
                        <th key={p._id} className="p-2.5 text-left font-semibold text-[#087F65]">
                          {p.name.slice(0, 25)}...
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4EAE6] bg-white">
                    {aiAnalysis.dimensions.map((dim, i) => (
                      <tr key={i} className="hover:bg-[#F1F7F4]">
                        <td className="p-2.5 font-medium text-[#202923]">{dim.feature}</td>
                        {dim.values?.map((val, idx) => (
                          <td key={idx} className="p-2.5 text-[#65716A]">{val}</td>
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
                className="flex items-center gap-1.5 text-xs font-semibold text-[#087F65] hover:text-[#066B55]"
              >
                Discuss further with AI Concierge <IconSparkles size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-32 p-3 text-left text-[#65716A]">Product</th>
              {products.map((p) => (
                <th key={p._id} className="card-surface p-4 text-center align-top bg-white border border-[#E4EAE6] rounded-xl">
                  <button onClick={() => dispatch(toggleCompare(p.slug))} aria-label="Remove from compare" className="ml-auto block text-[#89938D] hover:text-[#B42318] p-1"><IconX size={16} /></button>
                  <Link to={`/product/${p.slug}`}>
                    <img src={imgUrl(p.images?.[0]?.url)} alt={p.name} className="mx-auto h-32 w-32 rounded-xl object-cover bg-[#F1F7F4] p-2" />
                    <p className="mt-2 font-semibold text-[#202923] transition-colors hover:text-[#087F65]">{p.name}</p>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-[#E4EAE6]">
                <td className="p-3 font-semibold text-[#65716A]">{row.label}</td>
                {products.map((p) => <td key={p._id} className="p-3 text-center text-[#202923]">{row.render(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiX, FiSearch } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import useFetch from '../hooks/useFetch.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ui/Skeletons.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Rating from '../components/ui/Rating.jsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'most-rated', label: 'Most Rated' },
];

const COLORS = ['Black', 'White', 'Navy', 'Charcoal', 'Silver', 'Midnight', 'Volt'];
const SIZES = ['S', 'M', 'L', 'XL', 'UK 7', 'UK 8', 'UK 9', 'UK 10'];

/* Hoisted so React preserves input focus across re-renders. */
const FilterSection = ({ title, children }) => (
  <div className="border-b border-white/10 py-4">
    <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h4>
    {children}
  </div>
);

const Check = ({ checked, onChange, children }) => (
  <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-slate-300 transition-colors hover:text-frost">
    <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-indigo-600" />
    {children}
  </label>
);

/** Product listing with URL-driven filters, sorting and pagination. */
export default function Products() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [priceDraft, setPriceDraft] = useState({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });

  const queryString = params.toString();
  const { data, loading } = useFetch(`/products?${queryString}`, [queryString]);
  const { data: catData } = useFetch('/categories');
  const { data: brandData } = useFetch('/brands');

  useEffect(() => { document.title = 'Shop — LUXORA'; }, []);

  /** Update one query param (resets to page 1). */
  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '' || value === undefined) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

  /** Toggle a value inside a comma-separated multi-value param. */
  const toggleMulti = (key, value) => {
    const current = params.get(key)?.split(',').filter(Boolean) || [];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilter(key, next.length ? next.join(',') : null);
  };

  const isChecked = (key, value) => (params.get(key)?.split(',') || []).includes(value);

  const activeFilterCount = useMemo(
    () => ['category', 'brand', 'color', 'size', 'rating', 'minPrice', 'maxPrice', 'inStock'].filter((k) => params.get(k)).length,
    [params]
  );

  const clearAll = () => {
    const keyword = params.get('keyword');
    const next = new URLSearchParams();
    if (keyword) next.set('keyword', keyword);
    setParams(next);
    setPriceDraft({ min: '', max: '' });
  };

  const filtersPanel = (
    <div className="card-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold">Filters {activeFilterCount > 0 && <span className="chip ml-1 bg-primary/20 text-primary-300">{activeFilterCount}</span>}</h3>
        {activeFilterCount > 0 && <button onClick={clearAll} className="text-xs text-accent hover:underline">Clear all</button>}
      </div>

      <FilterSection title="Category">
        {(catData?.categories || []).map((c) => (
          <Check key={c._id} checked={isChecked('category', c._id)} onChange={() => toggleMulti('category', c._id)}>{c.name}</Check>
        ))}
      </FilterSection>

      <FilterSection title="Brand">
        {(brandData?.brands || []).map((b) => (
          <Check key={b._id} checked={isChecked('brand', b._id)} onChange={() => toggleMulti('brand', b._id)}>{b.name}</Check>
        ))}
      </FilterSection>

      <FilterSection title="Price (₹)">
        <div className="flex items-center gap-2">
          <input type="number" min="0" placeholder="Min" value={priceDraft.min} onChange={(e) => setPriceDraft({ ...priceDraft, min: e.target.value })} className="input-field !py-1.5 text-xs" />
          <span className="text-slate-500">—</span>
          <input type="number" min="0" placeholder="Max" value={priceDraft.max} onChange={(e) => setPriceDraft({ ...priceDraft, max: e.target.value })} className="input-field !py-1.5 text-xs" />
        </div>
        <button
          onClick={() => { setFilter('minPrice', priceDraft.min || null); setFilter('maxPrice', priceDraft.max || null); }}
          className="btn-outline mt-2 w-full !py-1.5 text-xs"
        >
          Apply
        </button>
      </FilterSection>

      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => toggleMulti('color', c)}
              className={`chip border transition-all ${isChecked('color', c) ? 'border-primary bg-primary/20 text-primary-300' : 'border-slate-600 text-slate-400 hover:border-slate-400'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleMulti('size', s)}
              className={`chip border transition-all ${isChecked('size', s) ? 'border-primary bg-primary/20 text-primary-300' : 'border-slate-600 text-slate-400 hover:border-slate-400'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Rating">
        {[4, 3, 2].map((r) => (
          <Check key={r} checked={params.get('rating') === String(r)} onChange={() => setFilter('rating', params.get('rating') === String(r) ? null : String(r))}>
            <Rating value={r} /> <span className="text-xs">& up</span>
          </Check>
        ))}
      </FilterSection>

      <FilterSection title="Availability">
        <Check checked={params.get('inStock') === 'true'} onChange={() => setFilter('inStock', params.get('inStock') === 'true' ? null : 'true')}>
          In stock only
        </Check>
      </FilterSection>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Shop' }]} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title">
          {params.get('keyword') ? `Results for “${params.get('keyword')}”` : params.get('flashSale') ? '⚡ Flash Sale' : 'All products'}
          {data && <span className="ml-2 text-sm font-normal text-slate-400">({data.total} items)</span>}
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(true)} className="btn-outline !py-2 text-sm lg:hidden">
            <FiFilter /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select value={params.get('sort') || 'newest'} onChange={(e) => setFilter('sort', e.target.value)} aria-label="Sort products" className="input-field w-auto !py-2 text-sm">
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">{filtersPanel}</aside>

        {/* Mobile filter drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div className="fixed inset-0 z-50 bg-black/70 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowFilters(false)}>
              <motion.div
                className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-night p-4"
                initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }} transition={{ type: 'tween' }}
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={() => setShowFilters(false)} className="mb-3 ml-auto flex items-center gap-1 text-sm text-slate-400"><FiX /> Close</button>
                {filtersPanel}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Grid */}
        <div className="flex-1">
          {loading ? (
            <ProductGridSkeleton />
          ) : data?.products?.length ? (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {data.products.map((p) => <ProductCard key={p._id} product={p} />)}
              </div>
              <Pagination page={data.page} pages={data.pages} onChange={(p) => { const next = new URLSearchParams(params); next.set('page', p); setParams(next); }} />
            </>
          ) : (
            <EmptyState icon={FiSearch} title="No products found" message="Try adjusting your filters or search for something else." ctaText="Clear filters" ctaLink="/products" />
          )}
        </div>
      </div>
    </div>
  );
}

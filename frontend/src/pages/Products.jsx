import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IconSlidersHorizontal, IconX, IconSearch } from '../components/ui/icons.jsx';
import { AnimatePresence, motion } from 'framer-motion';
import useFetch from '../hooks/useFetch.js';
import ProductCard from '../components/product/ProductCard.jsx';
import { ProductGridSkeleton } from '../components/ui/Skeletons.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Rating from '../components/ui/Rating.jsx';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest Arrivals' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'most-rated', label: 'Most Rated' },
];

const COLORS = ['Black', 'White', 'Navy', 'Charcoal', 'Silver', 'Midnight', 'Volt'];
const SIZES = ['S', 'M', 'L', 'XL', 'UK 7', 'UK 8', 'UK 9', 'UK 10'];

const FilterSection = ({ title, children }) => (
  <div className="border-b border-[#E4EAE6] py-4">
    <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-[#202923]">{title}</h4>
    {children}
  </div>
);

const Check = ({ checked, onChange, children }) => (
  <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-[#202923] transition-colors hover:text-[#087F65]">
    <input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 rounded accent-[#087F65]" />
    {children}
  </label>
);

/** Product catalog page with clean white and mint filters, sorting and pagination. */
export default function Products() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [priceDraft, setPriceDraft] = useState({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });

  const queryString = params.toString();
  const { data, loading } = useFetch(`/products?${queryString}`, [queryString]);
  const { data: catData } = useFetch('/categories');
  const { data: brandData } = useFetch('/brands');

  useEffect(() => { document.title = 'Shop Products — FlashShop'; }, []);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === null || value === '' || value === undefined) next.delete(key);
    else next.set(key, value);
    next.delete('page');
    setParams(next);
  };

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
    <div className="rounded-xl border border-[#E4EAE6] bg-white p-5 shadow-[0_4px_18px_rgba(21,61,43,0.05)]">
      <div className="flex items-center justify-between border-b border-[#E4EAE6] pb-3">
        <h3 className="font-display font-bold text-[#202923]">
          Filters {activeFilterCount > 0 && <span className="chip ml-1 bg-[#EAF4EF] text-[#075E4B] border border-[#DDEBE3]">{activeFilterCount}</span>}
        </h3>
        {activeFilterCount > 0 && <button onClick={clearAll} className="text-xs font-semibold text-[#087F65] hover:underline">Clear all</button>}
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
          <span className="text-[#89938D]">—</span>
          <input type="number" min="0" placeholder="Max" value={priceDraft.max} onChange={(e) => setPriceDraft({ ...priceDraft, max: e.target.value })} className="input-field !py-1.5 text-xs" />
        </div>
        <button
          onClick={() => { setFilter('minPrice', priceDraft.min || null); setFilter('maxPrice', priceDraft.max || null); }}
          className="btn-outline mt-2.5 w-full !py-1.5 text-xs font-semibold"
        >
          Apply Price Filter
        </button>
      </FilterSection>

      <FilterSection title="Color">
        <div className="flex flex-wrap gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => toggleMulti('color', c)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                isChecked('color', c)
                  ? 'border border-[#087F65] bg-[#EAF4EF] text-[#075E4B]'
                  : 'border border-[#E4EAE6] text-[#65716A] hover:border-[#087F65] hover:text-[#087F65]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Size">
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => toggleMulti('size', s)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all ${
                isChecked('size', s)
                  ? 'border border-[#087F65] bg-[#EAF4EF] text-[#075E4B]'
                  : 'border border-[#E4EAE6] text-[#65716A] hover:border-[#087F65] hover:text-[#087F65]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Customer Rating">
        {[4, 3, 2].map((r) => (
          <Check key={r} checked={params.get('rating') === String(r)} onChange={() => setFilter('rating', params.get('rating') === String(r) ? null : String(r))}>
            <Rating value={r} /> <span className="text-xs text-[#65716A]">& up</span>
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Shop' }]} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="section-title text-[#202923]">
          {params.get('keyword') ? `Results for “${params.get('keyword')}”` : params.get('flashSale') ? '⚡ Flash Sale' : 'All Products'}
          {data && <span className="ml-2 text-sm font-normal text-[#65716A]">({data.total} items)</span>}
        </h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters(true)} className="btn-outline !py-2 text-sm lg:hidden flex items-center gap-1.5" aria-label="Open filter drawer">
            <IconSlidersHorizontal size={16} /> Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
          <select
            value={params.get('sort') || 'newest'}
            onChange={(e) => setFilter('sort', e.target.value)}
            aria-label="Sort products"
            className="input-field w-auto !py-2 text-sm bg-white"
          >
            {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">{filtersPanel}</aside>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="fixed inset-0 z-50 bg-[#202923]/50 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
            >
              <motion.div
                className="absolute left-0 top-0 h-full w-80 max-w-[85vw] overflow-y-auto bg-white p-5 border-r border-[#E4EAE6]"
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'tween' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-base text-[#202923]">Filter Products</h3>
                  <button onClick={() => setShowFilters(false)} aria-label="Close filters" className="rounded-lg p-1.5 text-[#65716A] hover:bg-[#EAF4EF] hover:text-[#066B55]"><IconX size={20} /></button>
                </div>
                {filtersPanel}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product Grid */}
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
            <EmptyState icon={IconSearch} title="No products found" message="Try adjusting your filters or search for something else." ctaText="Clear filters" ctaLink="/products" />
          )}
        </div>
      </div>
    </div>
  );
}

import { useSelector } from 'react-redux';
import { FiHeart } from 'react-icons/fi';
import ProductCard from '../components/product/ProductCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';

/** Wishlist grid — reuses ProductCard (heart toggles removal). */
export default function Wishlist() {
  const wishlist = useSelector((s) => s.wishlist.wishlist);
  const products = wishlist?.products || [];

  if (!products.length) {
    return <EmptyState icon={FiHeart} title="Your wishlist is empty" message="Tap the heart on any product to save it here for later." />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Wishlist' }]} />
      <h1 className="section-title mb-6">My wishlist <span className="text-sm font-normal text-slate-400">({products.length} items)</span></h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p) => <ProductCard key={p._id} product={p} />)}
      </div>
    </div>
  );
}

import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiEye, FiBarChart2 } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import toast from 'react-hot-toast';
import Rating from '../ui/Rating.jsx';
import { addToCart } from '../../features/cartSlice.js';
import { toggleWishlist, selectWishlistIds } from '../../features/wishlistSlice.js';
import { setQuickView, toggleCompare } from '../../features/uiSlice.js';
import { formatPrice, imgUrl } from '../../utils/format.js';

/** Product card with hover actions: wishlist, quick view, compare, add to cart. */
function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const wishlistIds = useSelector(selectWishlistIds);
  const compareItems = useSelector((s) => s.ui.compareItems);
  const inWishlist = wishlistIds.has(String(product._id));
  const inCompare = compareItems.includes(product.slug);
  const discount = product.discountPercent || (product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);

  const requireAuth = () => {
    if (!user) { toast('Sign in to continue', { icon: '🔐' }); navigate('/login'); return false; }
    return true;
  };

  const handleAddToCart = async () => {
    if (!requireAuth()) return;
    // Products with variants need a selection first
    if (product.colors?.length > 1 || product.sizes?.length) { navigate(`/product/${product.slug}`); return; }
    const res = await dispatch(addToCart({ productId: product._id, quantity: 1 }));
    if (res.error) toast.error(res.payload);
    else toast.success('Added to cart');
  };

  const handleWishlist = async () => {
    if (!requireAuth()) return;
    const res = await dispatch(toggleWishlist(product._id));
    if (!res.error) toast.success(inWishlist ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      className="card-surface group relative overflow-hidden transition-shadow duration-300 hover:shadow-glow"
    >
      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {discount > 0 && <span className="chip bg-accent text-white">-{discount}%</span>}
        {product.isFlashSale && <span className="chip bg-primary text-white">⚡ Flash</span>}
        {product.stock === 0 && <span className="chip bg-slate-700 text-slate-300">Out of stock</span>}
      </div>

      {/* Hover actions */}
      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2 opacity-100 transition-all duration-300 md:translate-x-12 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100">
        <button onClick={handleWishlist} aria-label="Toggle wishlist" className="glass flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:text-accent">
          {inWishlist ? <FaHeart className="text-accent" /> : <FiHeart />}
        </button>
        <button onClick={() => dispatch(setQuickView(product))} aria-label="Quick view" className="glass flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:text-secondary-400">
          <FiEye />
        </button>
        <button
          onClick={() => { dispatch(toggleCompare(product.slug)); toast.success(inCompare ? 'Removed from compare' : 'Added to compare'); }}
          aria-label="Compare" className={`glass flex h-9 w-9 items-center justify-center rounded-full transition-colors ${inCompare ? 'text-primary-300' : 'hover:text-primary-300'}`}
        >
          <FiBarChart2 />
        </button>
      </div>

      {/* Image */}
      <Link to={`/product/${product.slug}`} className="block overflow-hidden">
        <img
          src={imgUrl(product.images?.[0]?.url)}
          alt={product.name}
          loading="lazy"
          className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      {/* Info */}
      <div className="p-4">
        <Link to={`/product/${product.slug}`}>
          <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-primary-300">{product.name}</h3>
        </Link>
        <div className="mt-1.5"><Rating value={product.ratingsAverage} count={product.ratingsCount} /></div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-secondary-400">{formatPrice(product.price)}</span>
            {product.mrp > product.price && <span className="text-xs text-slate-500 line-through">{formatPrice(product.mrp)}</span>}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            aria-label="Add to cart"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-all hover:bg-primary-500 hover:shadow-glow active:scale-95 disabled:opacity-40"
          >
            <FiShoppingCart className="text-sm" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(ProductCard);

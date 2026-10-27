import { memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { IconHeart, IconShoppingCart, IconEye } from '../ui/icons.jsx';
import toast from 'react-hot-toast';
import Rating from '../ui/Rating.jsx';
import { addToCart } from '../../features/cartSlice.js';
import { toggleWishlist, selectWishlistIds } from '../../features/wishlistSlice.js';
import { setQuickView } from '../../features/uiSlice.js';
import { formatPrice, imgUrl } from '../../utils/format.js';

/**
 * Clean white ProductCard with pale-mint image surface, green buttons,
 * verified live prices, stock indicators, and wishlist toggle.
 */
function ProductCard({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const wishlistIds = useSelector(selectWishlistIds);
  const inWishlist = wishlistIds.has(String(product._id));
  const discount =
    product.discountPercent ||
    (product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0);

  const requireAuth = () => {
    if (!user) {
      toast('Sign in to continue', { icon: '🔐' });
      navigate('/login');
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!requireAuth()) return;
    if (product.colors?.length > 1 || product.sizes?.length) {
      navigate(`/product/${product.slug}`);
      return;
    }
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
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[12px] border border-[#E4EAE6] bg-white shadow-[0_4px_18px_rgba(21,61,43,0.06)] transition-all duration-200 hover:border-[#087F65]/50 hover:shadow-[0_8px_24px_rgba(21,61,43,0.12)]"
    >
      {/* Top Badges & Actions */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1">
        {discount > 0 && (
          <span className="rounded bg-[#168764] px-2 py-0.5 text-[11px] font-bold text-white shadow-sm">
            -{discount}%
          </span>
        )}
        {product.isFlashSale && (
          <span className="rounded bg-[#075E4B] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
            ⚡ Flash
          </span>
        )}
      </div>

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleWishlist}
          aria-label="Toggle wishlist"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#65716A] shadow-sm border border-[#E4EAE6] transition-colors hover:text-[#087F65] hover:bg-[#EAF4EF]"
        >
          <IconHeart size={16} className={inWishlist ? 'fill-[#168764] text-[#168764]' : ''} />
        </button>
        <button
          onClick={() => dispatch(setQuickView(product))}
          aria-label="Quick view"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#65716A] shadow-sm border border-[#E4EAE6] transition-colors hover:text-[#087F65] hover:bg-[#EAF4EF] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <IconEye size={16} />
        </button>
      </div>

      {/* Pale-Mint Image Container with Consistent Dimensions */}
      <Link to={`/product/${product.slug}`} className="block overflow-hidden bg-[#F1F7F4] p-4">
        <img
          src={imgUrl(product.images?.[0]?.url)}
          alt={product.name}
          loading="lazy"
          className="aspect-square w-full object-contain transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      {/* Card Details with Consistent Spacing */}
      <div className="flex flex-1 flex-col p-4">
        {/* Brand / Category */}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#65716A]">
          {product.brand?.name || product.category?.name || 'Electronics'}
        </p>

        {/* Product Name */}
        <Link to={`/product/${product.slug}`} className="mt-1 flex-1">
          <h3 className="line-clamp-2 text-sm font-semibold text-[#202923] transition-colors hover:text-[#087F65]">
            {product.name}
          </h3>
        </Link>

        {/* Star Rating with Emerald Stars */}
        <div className="mt-2 flex items-center gap-1.5">
          <Rating value={product.ratingsAverage} count={product.ratingsCount} size="text-xs" />
        </div>

        {/* Stock Status Indicator */}
        <div className="mt-2 text-[11px] font-medium">
          {product.stock > 0 ? (
            <span className="text-[#168764]">● In Stock ({product.stock})</span>
          ) : (
            <span className="text-[#B42318]">● Out of Stock</span>
          )}
        </div>

        {/* Price & Green Add to Cart Button */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-[#E4EAE6]/60">
          <div>
            <div className="text-base font-bold text-[#202923]">
              {formatPrice(product.price)}
            </div>
            {product.mrp > product.price && (
              <div className="text-xs text-[#89938D] line-through">
                {formatPrice(product.mrp)}
              </div>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            aria-label="Add to cart"
            className="flex items-center gap-1.5 rounded-[8px] bg-[#087F65] px-3.5 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#066B55] hover:shadow-[0_4px_12px_rgba(8,127,101,0.25)] active:scale-95 disabled:opacity-40"
          >
            <IconShoppingCart size={15} />
            <span>Add</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(ProductCard);

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiHeart, FiShare2, FiShoppingCart, FiCheck, FiTruck, FiShield, FiRotateCcw, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { FaHeart } from 'react-icons/fa';
import toast from 'react-hot-toast';
import useFetch from '../hooks/useFetch.js';
import api from '../api/axios.js';
import Rating from '../components/ui/Rating.jsx';
import StarInput from '../components/ui/StarInput.jsx';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import ProductRow from '../components/product/ProductRow.jsx';
import { DetailSkeleton } from '../components/ui/Skeletons.jsx';
import { addToCart } from '../features/cartSlice.js';
import { toggleWishlist, selectWishlistIds } from '../features/wishlistSlice.js';
import { formatPrice, formatDate, imgUrl } from '../utils/format.js';

/** Product detail page: gallery + zoom, variants, reviews, related products. */
export default function ProductDetails() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const wishlistIds = useSelector(selectWishlistIds);

  const { data, loading, refetch } = useFetch(`/products/${slug}`, [slug]);
  const product = data?.product;

  const [activeImage, setActiveImage] = useState(0);
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState({ show: false, x: 50, y: 50 });
  const imgRef = useRef(null);

  // Review form state
  const [reviewForm, setReviewForm] = useState({ rating: 0, title: '', comment: '' });
  const [reviewImages, setReviewImages] = useState([]);
  const [editingReview, setEditingReview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} — LUXORA`;
      setActiveImage(0);
      setColor(product.colors?.[0] || '');
      setSize('');
      setQty(1);
    }
  }, [product]);

  /** Stock for the currently selected variant (falls back to total stock). */
  const variantStock = useMemo(() => {
    if (!product?.variants?.length) return product?.stock ?? 0;
    const match = product.variants.find(
      (v) => (!color || v.color === color) && (!size || v.size === size)
    );
    if (color || size) return match ? match.stock : 0;
    return product.stock;
  }, [product, color, size]);

  const myReview = useMemo(
    () => data?.reviews?.find((r) => String(r.user?._id) === String(user?._id)),
    [data, user]
  );

  if (loading) return <DetailSkeleton />;
  if (!product) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link to="/products" className="btn-primary mt-6 inline-flex">Back to shop</Link>
      </div>
    );
  }

  const inWishlist = wishlistIds.has(String(product._id));
  const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const needsSize = product.sizes?.length > 0;

  const requireAuth = () => {
    if (!user) { toast('Sign in to continue', { icon: '🔐' }); navigate('/login'); return false; }
    return true;
  };

  const handleAddToCart = async () => {
    if (!requireAuth()) return;
    if (needsSize && !size) { toast.error('Please select a size'); return; }
    const res = await dispatch(addToCart({ productId: product._id, quantity: qty, variant: { color, size } }));
    if (res.error) toast.error(res.payload);
    else toast.success('Added to cart');
  };

  const handleBuyNow = async () => {
    if (!requireAuth()) return;
    if (needsSize && !size) { toast.error('Please select a size'); return; }
    const res = await dispatch(addToCart({ productId: product._id, quantity: qty, variant: { color, size } }));
    if (res.error) toast.error(res.payload);
    else navigate('/checkout');
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: product.name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  };

  /** Mouse-follow zoom on the main image. */
  const handleZoom = (e) => {
    const rect = imgRef.current.getBoundingClientRect();
    setZoom({
      show: true,
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!reviewForm.rating) { toast.error('Please select a star rating'); return; }
    if (!reviewForm.comment.trim()) { toast.error('Please write a short review'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('rating', reviewForm.rating);
      fd.append('title', reviewForm.title);
      fd.append('comment', reviewForm.comment);
      reviewImages.forEach((f) => fd.append('images', f));
      if (editingReview) {
        await api.put(`/reviews/${editingReview}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Review updated');
      } else {
        fd.append('productId', product._id);
        await api.post('/reviews', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Review posted');
      }
      setReviewForm({ rating: 0, title: '', comment: '' });
      setReviewImages([]);
      setEditingReview(null);
      refetch();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm('Delete your review?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      toast.success('Review deleted');
      refetch();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[
        { label: 'Shop', to: '/products' },
        { label: product.category?.name || 'Category', to: `/products?category=${product.category?._id}` },
        { label: product.name },
      ]} />

      <div className="grid gap-10 lg:grid-cols-2">
        {/* ---------- Gallery ---------- */}
        <div>
          <div
            ref={imgRef}
            className="relative aspect-square cursor-crosshair overflow-hidden rounded-2xl border border-white/10"
            onMouseMove={handleZoom}
            onMouseLeave={() => setZoom({ ...zoom, show: false })}
          >
            <img
              src={imgUrl(product.images?.[activeImage]?.url)}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-200"
              style={zoom.show ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : {}}
            />
            {discount > 0 && <span className="chip absolute left-4 top-4 bg-accent text-white">-{discount}%</span>}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${i === activeImage ? 'border-primary shadow-glow' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={imgUrl(img.url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Info ---------- */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-secondary-400">{product.brand?.name}</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight md:text-3xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <Rating value={product.ratingsAverage} count={product.ratingsCount} />
            {product.sold > 0 && <span className="text-xs text-slate-400">{product.sold} sold</span>}
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-4xl font-bold text-secondary-400">{formatPrice(product.price)}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-lg text-slate-500 line-through">{formatPrice(product.mrp)}</span>
                <span className="chip bg-accent/20 text-accent">Save {formatPrice(product.mrp - product.price)}</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-400">Inclusive of all taxes</p>

          {/* Highlights */}
          {product.highlights?.length > 0 && (
            <ul className="mt-5 space-y-1.5">
              {product.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-slate-300"><FiCheck className="shrink-0 text-secondary-400" /> {h}</li>
              ))}
            </ul>
          )}

          {/* Variants */}
          {product.colors?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold">Color: <span className="text-slate-400">{color}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={`chip border px-4 py-1.5 transition-all ${color === c ? 'border-primary bg-primary/20 text-primary-300' : 'border-slate-600 hover:border-slate-400'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {needsSize && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold">Size: <span className="text-slate-400">{size || 'Select a size'}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`chip border px-4 py-1.5 transition-all ${size === s ? 'border-primary bg-primary/20 text-primary-300' : 'border-slate-600 hover:border-slate-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock + quantity */}
          <p className={`mt-5 text-sm font-semibold ${variantStock > 0 ? (variantStock <= 5 ? 'text-amber-400' : 'text-green-400') : 'text-red-400'}`}>
            {variantStock > 0 ? (variantStock <= 5 ? `Only ${variantStock} left — order soon` : 'In stock') : 'Out of stock'}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-slate-600">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2.5 transition-colors hover:text-primary-300" aria-label="Decrease quantity">−</button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(Math.min(10, variantStock, qty + 1))} className="px-4 py-2.5 transition-colors hover:text-primary-300" aria-label="Increase quantity">+</button>
            </div>
            <button onClick={handleAddToCart} disabled={variantStock === 0} className="btn-primary flex-1 !py-3 sm:flex-none sm:px-8">
              <FiShoppingCart /> Add to cart
            </button>
            <button onClick={handleBuyNow} disabled={variantStock === 0} className="btn-accent flex-1 !py-3 sm:flex-none sm:px-8">Buy now</button>
            <button
              onClick={() => requireAuth() && dispatch(toggleWishlist(product._id))}
              aria-label="Toggle wishlist"
              className="btn-outline !px-3.5 !py-3"
            >
              {inWishlist ? <FaHeart className="text-accent" /> : <FiHeart />}
            </button>
            <button onClick={handleShare} aria-label="Share product" className="btn-outline !px-3.5 !py-3"><FiShare2 /></button>
          </div>

          {/* Trust badges */}
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-white/10 pt-5 text-center text-xs text-slate-400">
            <div className="flex flex-col items-center gap-1.5"><FiTruck className="text-lg text-secondary-400" /> Free delivery over ₹999</div>
            <div className="flex flex-col items-center gap-1.5"><FiRotateCcw className="text-lg text-secondary-400" /> 7-day easy returns</div>
            <div className="flex flex-col items-center gap-1.5"><FiShield className="text-lg text-secondary-400" /> Secure payments</div>
          </div>
        </div>
      </div>

      {/* ---------- Description ---------- */}
      <section className="card-surface mt-12 p-6">
        <h2 className="mb-3 text-lg font-bold">About this item</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">{product.description}</p>
      </section>

      {/* ---------- Reviews ---------- */}
      <section className="mt-12">
        <h2 className="section-title mb-6">Ratings & reviews</h2>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Write / edit review */}
          <div className="card-surface h-fit p-6">
            <h3 className="mb-3 font-bold">{editingReview ? 'Edit your review' : myReview ? 'Your review' : 'Write a review'}</h3>
            {myReview && !editingReview ? (
              <div>
                <Rating value={myReview.rating} />
                {myReview.title && <p className="mt-2 text-sm font-semibold">{myReview.title}</p>}
                <p className="mt-1 text-sm text-slate-400">{myReview.comment}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => { setEditingReview(myReview._id); setReviewForm({ rating: myReview.rating, title: myReview.title, comment: myReview.comment }); }}
                    className="btn-outline !py-1.5 text-xs"
                  >
                    <FiEdit2 /> Edit
                  </button>
                  <button onClick={() => deleteReview(myReview._id)} className="btn-outline !py-1.5 text-xs text-red-400"><FiTrash2 /> Delete</button>
                </div>
              </div>
            ) : (
              <form onSubmit={submitReview} className="space-y-4">
                <StarInput value={reviewForm.rating} onChange={(r) => setReviewForm({ ...reviewForm, rating: r })} />
                <input
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                  placeholder="Title (optional)" className="input-field"
                />
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  placeholder="What did you like or dislike?" rows="4" className="input-field resize-none"
                />
                <div>
                  <label className="text-xs text-slate-400">Add photos (up to 4)</label>
                  <input
                    type="file" accept="image/*" multiple
                    onChange={(e) => setReviewImages([...e.target.files].slice(0, 4))}
                    className="mt-1 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">{submitting ? 'Saving…' : editingReview ? 'Update review' : 'Post review'}</button>
                  {editingReview && <button type="button" onClick={() => { setEditingReview(null); setReviewForm({ rating: 0, title: '', comment: '' }); }} className="btn-outline">Cancel</button>}
                </div>
              </form>
            )}
          </div>

          {/* Review list */}
          <div className="space-y-4 lg:col-span-2">
            {data?.reviews?.length ? (
              data.reviews.map((r) => (
                <article key={r._id} className="card-surface p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary-500 font-bold text-white">
                        {r.user?.name?.[0]?.toUpperCase() || '?'}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">{r.user?.name || 'Anonymous'}</p>
                        <p className="text-xs text-slate-400">{formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <Rating value={r.rating} />
                  </div>
                  {r.title && <h4 className="mt-3 text-sm font-semibold">{r.title}</h4>}
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{r.comment}</p>
                  {r.images?.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {r.images.map((img, i) => (
                        <img key={i} src={imgUrl(img.url)} alt="Review" loading="lazy" className="h-16 w-16 rounded-lg object-cover" />
                      ))}
                    </div>
                  )}
                </article>
              ))
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">No reviews yet — be the first to share your experience.</p>
            )}
          </div>
        </div>
      </section>

      {/* ---------- Related ---------- */}
      {data?.related?.length > 0 && (
        <ProductRow title="You may also like" products={data.related} loading={false} />
      )}
    </div>
  );
}

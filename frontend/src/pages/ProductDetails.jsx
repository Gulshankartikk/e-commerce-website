import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  IconHeart,
  IconShare2,
  IconShoppingCart,
  IconCheck,
  IconTruck,
  IconShieldCheck,
  IconRefreshCw,
  IconTrash2,
  IconSparkles,
  IconPlus,
  IconMinus,
} from '../components/ui/icons.jsx';
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
import { setAiDrawer } from '../features/uiSlice.js';
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

  // AI Review Summary state
  const [aiSummary, setAiSummary] = useState(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);

  const fetchAiReviewSummary = async () => {
    if (!product?._id) return;
    setAiSummaryLoading(true);
    try {
      const { data: resData } = await api.get(`/ai/review-summary/${product._id}`);
      setAiSummary(resData.summary);
      toast.success('AI review synthesis updated');
    } catch (err) {
      toast.error('Could not load AI summary');
    } finally {
      setAiSummaryLoading(false);
    }
  };

  useEffect(() => {
    setAiSummary(null);
  }, [slug]);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} — FlashShop`;
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
            className="relative aspect-square cursor-crosshair overflow-hidden rounded-2xl border border-[#E4EAE6] bg-[#F1F7F4] p-4 shadow-sm"
            onMouseMove={handleZoom}
            onMouseLeave={() => setZoom({ ...zoom, show: false })}
          >
            <img
              src={imgUrl(product.images?.[activeImage]?.url)}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-200"
              style={zoom.show ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : {}}
            />
            {discount > 0 && <span className="chip absolute left-4 top-4 bg-[#168764] text-white font-bold">-{discount}%</span>}
          </div>
          {product.images?.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all bg-[#F1F7F4] p-1 ${i === activeImage ? 'border-[#087F65] shadow-sm' : 'border-[#E4EAE6] opacity-70 hover:opacity-100'}`}
                  aria-label={`View image ${i + 1}`}
                >
                  <img src={imgUrl(img.url)} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------- Info ---------- */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#65716A]">{product.brand?.name || 'Electronics'}</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight text-[#202923] md:text-3xl">{product.name}</h1>
          <div className="mt-3 flex items-center gap-3">
            <Rating value={product.ratingsAverage} count={product.ratingsCount} />
            {product.sold > 0 && <span className="text-xs text-[#65716A]">· {product.sold} sold</span>}
          </div>

          <div className="mt-5 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-[#202923]">{formatPrice(product.price)}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-base text-[#89938D] line-through">{formatPrice(product.mrp)}</span>
                <span className="chip bg-[#EAF4EF] text-[#075E4B] border border-[#DDEBE3]">Save {formatPrice(product.mrp - product.price)}</span>
              </>
            )}
          </div>
          <p className="mt-1 text-xs text-[#65716A]">Inclusive of all taxes</p>

          {/* Highlights */}
          {product.highlights?.length > 0 && (
            <ul className="mt-5 space-y-2">
              {product.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-[#202923]"><IconCheck size={16} className="shrink-0 text-[#087F65]" /> {h}</li>
              ))}
            </ul>
          )}

          {/* Variants */}
          {product.colors?.length > 0 && (
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-[#202923]">Color: <span className="text-[#65716A] font-normal">{color}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button key={c} onClick={() => setColor(c)} className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${color === c ? 'border border-[#087F65] bg-[#EAF4EF] text-[#075E4B]' : 'border border-[#E4EAE6] bg-white text-[#202923] hover:border-[#087F65]'}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}
          {needsSize && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-semibold text-[#202923]">Size: <span className="text-[#65716A] font-normal">{size || 'Select a size'}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSize(s)} className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${size === s ? 'border border-[#087F65] bg-[#EAF4EF] text-[#075E4B]' : 'border border-[#E4EAE6] bg-white text-[#202923] hover:border-[#087F65]'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock + quantity */}
          <p className={`mt-5 text-sm font-semibold ${variantStock > 0 ? 'text-[#168764]' : 'text-[#B42318]'}`}>
            {variantStock > 0 ? (variantStock <= 5 ? `● Only ${variantStock} left — order soon` : '● In stock, ready to ship') : '● Out of stock'}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-lg border border-[#E4EAE6] bg-white">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 text-[#202923] transition-colors hover:text-[#087F65] hover:bg-[#EAF4EF]" aria-label="Decrease quantity">
                <IconMinus size={15} />
              </button>
              <span className="w-8 text-center text-sm font-semibold text-[#202923]">{qty}</span>
              <button onClick={() => setQty(Math.min(10, variantStock, qty + 1))} className="px-3 py-2 text-[#202923] transition-colors hover:text-[#087F65] hover:bg-[#EAF4EF]" aria-label="Increase quantity">
                <IconPlus size={15} />
              </button>
            </div>
            <button onClick={handleAddToCart} disabled={variantStock === 0} className="btn-primary flex-1 !py-3 sm:flex-none sm:px-8">
              <IconShoppingCart size={18} /> Add to cart
            </button>
            <button onClick={handleBuyNow} disabled={variantStock === 0} className="btn-accent flex-1 !py-3 sm:flex-none sm:px-8">Buy now</button>
            <button
              onClick={() => requireAuth() && dispatch(toggleWishlist(product._id))}
              aria-label="Toggle wishlist"
              className="btn-outline !px-3.5 !py-3 hover:bg-[#EAF4EF]"
            >
              <IconHeart size={18} className={inWishlist ? 'fill-[#168764] text-[#168764]' : 'text-[#65716A]'} />
            </button>
            <button onClick={handleShare} aria-label="Share product" className="btn-outline !px-3.5 !py-3 hover:bg-[#EAF4EF]"><IconShare2 size={18} /></button>
            <button
              onClick={() => dispatch(setAiDrawer({ open: true, query: `Tell me about the highlights, sizing, and features of ${product.name}` }))}
              aria-label="Ask AI about this product"
              className="btn-outline !py-3 flex items-center gap-1.5 border-[#087F65]/40 text-[#075E4B] hover:bg-[#EAF4EF] hover:border-[#087F65]"
              title="Ask AI Concierge about this product"
            >
              <IconSparkles size={16} className="text-[#087F65]" />
              <span className="text-xs font-semibold">Ask AI</span>
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-7 grid grid-cols-3 gap-3 border-t border-[#E4EAE6] pt-5 text-center text-xs text-[#65716A]">
            <div className="flex flex-col items-center gap-1.5"><IconTruck size={20} className="text-[#087F65]" /> Free delivery over ₹999</div>
            <div className="flex flex-col items-center gap-1.5"><IconRefreshCw size={20} className="text-[#087F65]" /> 7-day easy returns</div>
            <div className="flex flex-col items-center gap-1.5"><IconShieldCheck size={20} className="text-[#087F65]" /> 100% Genuine product</div>
          </div>
        </div>
      </div>

      {/* ---------- Description ---------- */}
      <section className="mt-12 rounded-xl border border-[#E4EAE6] bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-lg font-bold text-[#202923]">About this item</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-[#65716A]">{product.description}</p>
      </section>

      {/* ---------- Reviews ---------- */}
      <section className="mt-12">
        <h2 className="section-title mb-6 text-[#202923]">Ratings & Reviews</h2>
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Write / edit review */}
          <div className="rounded-xl border border-[#E4EAE6] bg-white h-fit p-6 shadow-sm">
            <h3 className="mb-3 font-bold text-[#202923]">{editingReview ? 'Edit your review' : myReview ? 'Your review' : 'Write a review'}</h3>
            {myReview && !editingReview ? (
              <div>
                <Rating value={myReview.rating} />
                {myReview.title && <p className="mt-2 text-sm font-semibold text-[#202923]">{myReview.title}</p>}
                <p className="mt-1 text-sm text-[#65716A]">{myReview.comment}</p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => { setEditingReview(myReview._id); setReviewForm({ rating: myReview.rating, title: myReview.title, comment: myReview.comment }); }}
                    className="btn-outline !py-1.5 text-xs hover:bg-[#EAF4EF]"
                  >
                    Edit
                  </button>
                  <button onClick={() => deleteReview(myReview._id)} className="btn-outline !py-1.5 text-xs text-[#B42318] hover:bg-red-50 flex items-center gap-1"><IconTrash2 size={14} /> Delete</button>
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
                  placeholder="What did you like or dislike about this product?" rows="4" className="input-field resize-none"
                />
                <div>
                  <label className="text-xs text-[#65716A]">Add photos (up to 4)</label>
                  <input
                    type="file" accept="image/*" multiple
                    onChange={(e) => setReviewImages([...e.target.files].slice(0, 4))}
                    className="mt-1 block w-full text-xs text-[#65716A] file:mr-3 file:rounded-lg file:border-0 file:bg-[#087F65] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
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
            {/* AI Review Summary Box */}
            {data?.reviews?.length > 0 && (
              <div className="rounded-xl border border-[#DDEBE3] bg-[#EAF4EF] p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DDEBE3] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#087F65] text-white shadow-sm">
                      <IconSparkles size={18} className="text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-[#075E4B] text-sm">AI Customer Sentiment Synthesis</h4>
                      <p className="text-[11px] text-[#65716A]">Distilled from verified buyer reviews with Google Gemini</p>
                    </div>
                  </div>

                  <button
                    onClick={fetchAiReviewSummary}
                    disabled={aiSummaryLoading}
                    className="flex items-center gap-1.5 rounded-lg bg-[#087F65] hover:bg-[#066B55] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50"
                  >
                    <IconSparkles size={14} className={aiSummaryLoading ? 'animate-spin' : ''} />
                    {aiSummaryLoading ? 'Analyzing...' : aiSummary ? 'Refresh AI Summary' : 'Generate AI Summary'}
                  </button>
                </div>

                {aiSummary ? (
                  <div className="mt-4 space-y-3.5 text-sm">
                    <div className="flex items-center justify-between rounded-xl bg-white p-3 border border-[#E4EAE6]">
                      <div>
                        <span className="text-xs text-[#65716A]">Buyer Sentiment:</span>
                        <p className="font-bold text-[#075E4B]">{aiSummary.sentiment}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-[#65716A]">Positive Consensus</span>
                        <p className="font-bold text-[#168764]">{aiSummary.sentimentScore}%</p>
                      </div>
                    </div>

                    <p className="text-[#202923] italic leading-relaxed bg-white p-3 rounded-lg border-l-2 border-[#087F65] text-xs">
                      "{aiSummary.verdict}"
                    </p>

                    <div className="grid sm:grid-cols-2 gap-3 pt-1">
                      {aiSummary.pros?.length > 0 && (
                        <div className="rounded-xl bg-white border border-[#DDEBE3] p-3">
                          <p className="text-xs font-bold text-[#075E4B] mb-1.5 flex items-center gap-1">
                            <IconCheck size={16} className="text-[#087F65]" /> What Customers Love
                          </p>
                          <ul className="space-y-1 text-xs text-[#202923]">
                            {aiSummary.pros.map((pro, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-[#087F65] mt-0.5">•</span>
                                <span>{pro}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiSummary.cons?.length > 0 && (
                        <div className="rounded-xl bg-white border border-[#E4EAE6] p-3">
                          <p className="text-xs font-bold text-[#B42318] mb-1.5 flex items-center gap-1">
                            ⚠️ Things to Note
                          </p>
                          <ul className="space-y-1 text-xs text-[#65716A]">
                            {aiSummary.cons.map((con, i) => (
                              <li key={i} className="flex items-start gap-1.5">
                                <span className="text-[#B42318] mt-0.5">•</span>
                                <span>{con}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-[#65716A]">
                    Click "Generate AI Summary" to let Gemini analyze all customer reviews and extract top pros, cons, and buyer satisfaction consensus.
                  </p>
                )}
              </div>
            )}
            {data?.reviews?.length ? (
              data.reviews.map((r) => (
                <article key={r._id} className="rounded-xl border border-[#E4EAE6] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EAF4EF] font-bold text-[#075E4B] border border-[#DDEBE3]">
                        {r.user?.name?.[0]?.toUpperCase() || '?'}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-[#202923]">{r.user?.name || 'Anonymous'}</p>
                        <p className="text-xs text-[#65716A]">{formatDate(r.createdAt)}</p>
                      </div>
                    </div>
                    <Rating value={r.rating} />
                  </div>
                  {r.title && <h4 className="mt-3 text-sm font-semibold text-[#202923]">{r.title}</h4>}
                  <p className="mt-1 text-sm leading-relaxed text-[#65716A]">{r.comment}</p>
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
              <p className="py-10 text-center text-sm text-[#65716A]">No reviews yet — be the first to share your experience.</p>
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

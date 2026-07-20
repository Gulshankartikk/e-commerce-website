import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiShoppingCart, FiTrash2, FiTag, FiX, FiBookmark, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { updateCartItem, removeCartItem, toggleSaveForLater, applyCoupon, removeCoupon } from '../features/cartSlice.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import { formatPrice, imgUrl } from '../utils/format.js';

/** Shopping cart with quantity controls, save-for-later, coupons and order summary. */
export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { cart, totals, loading } = useSelector((s) => s.cart);
  const [couponInput, setCouponInput] = useState('');

  if (!user) {
    return <EmptyState icon={FiShoppingCart} title="Your cart is waiting" message="Sign in to view your cart and continue shopping." ctaText="Sign in" ctaLink="/login" />;
  }

  const activeItems = cart?.items.filter((i) => !i.savedForLater && i.product) || [];
  const savedItems = cart?.items.filter((i) => i.savedForLater && i.product) || [];

  if (!activeItems.length && !savedItems.length) {
    return <EmptyState icon={FiShoppingCart} title="Your cart is empty" message="Explore our catalog and find something you love." />;
  }

  const act = async (thunkAction, successMsg) => {
    const res = await dispatch(thunkAction);
    if (res.error) toast.error(res.payload);
    else if (successMsg) toast.success(successMsg);
  };

  const CartLine = ({ item, saved }) => (
    <div className="card-surface flex gap-4 p-4">
      <Link to={`/product/${item.product.slug}`} className="shrink-0">
        <img src={imgUrl(item.product.images?.[0]?.url)} alt={item.product.name} className="h-24 w-24 rounded-xl object-cover" />
      </Link>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/product/${item.product.slug}`} className="text-sm font-semibold transition-colors hover:text-primary-300">{item.product.name}</Link>
            {(item.variant?.color || item.variant?.size) && (
              <p className="mt-0.5 text-xs text-slate-400">
                {[item.variant.color, item.variant.size].filter(Boolean).join(' · ')}
              </p>
            )}
            {item.product.stock === 0 && <p className="mt-1 text-xs font-semibold text-red-400">Out of stock</p>}
          </div>
          <button onClick={() => act(removeCartItem(item._id), 'Removed from cart')} aria-label="Remove item" className="p-1 text-slate-400 transition-colors hover:text-red-400"><FiTrash2 /></button>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
          {!saved ? (
            <div className="flex items-center rounded-lg border border-slate-600 text-sm">
              <button onClick={() => item.quantity > 1 && act(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))} className="px-3 py-1.5 hover:text-primary-300" aria-label="Decrease">−</button>
              <span className="w-8 text-center font-semibold">{item.quantity}</span>
              <button onClick={() => act(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))} className="px-3 py-1.5 hover:text-primary-300" aria-label="Increase">+</button>
            </div>
          ) : <span />}
          <div className="flex items-center gap-3">
            <button onClick={() => act(toggleSaveForLater(item._id), saved ? 'Moved to cart' : 'Saved for later')} className="flex items-center gap-1 text-xs text-secondary-400 hover:underline">
              <FiBookmark /> {saved ? 'Move to cart' : 'Save for later'}
            </button>
            <span className="font-bold text-secondary-400">{formatPrice(item.product.price * item.quantity)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Cart' }]} />
      <h1 className="section-title mb-6">Shopping cart <span className="text-sm font-normal text-slate-400">({activeItems.length} items)</span></h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {activeItems.map((item) => <CartLine key={item._id} item={item} />)}

          {savedItems.length > 0 && (
            <>
              <h2 className="pt-4 text-lg font-bold">Saved for later ({savedItems.length})</h2>
              {savedItems.map((item) => <CartLine key={item._id} item={item} saved />)}
            </>
          )}
        </div>

        {/* Order summary */}
        {activeItems.length > 0 && totals && (
          <aside className="card-surface sticky top-24 h-fit p-6">
            <h2 className="mb-4 text-lg font-bold">Order summary</h2>

            {/* Coupon */}
            {cart.coupon?.code ? (
              <div className="mb-4 flex items-center justify-between rounded-xl border border-secondary-500/40 bg-secondary-500/10 px-3 py-2.5 text-sm">
                <span className="flex items-center gap-2 font-semibold text-secondary-400"><FiTag /> {cart.coupon.code}</span>
                <button onClick={() => act(removeCoupon(), 'Coupon removed')} aria-label="Remove coupon" className="text-slate-400 hover:text-red-400"><FiX /></button>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); if (couponInput.trim()) act(applyCoupon(couponInput.trim().toUpperCase()), 'Coupon applied!'); }}
                className="mb-4 flex gap-2"
              >
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code" className="input-field flex-1 !py-2 text-sm uppercase" />
                <button type="submit" className="btn-outline !px-4 !py-2 text-sm">Apply</button>
              </form>
            )}

            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Subtotal</dt><dd>{formatPrice(totals.itemsPrice)}</dd></div>
              {totals.discount > 0 && <div className="flex justify-between text-secondary-400"><dt>Coupon discount</dt><dd>− {formatPrice(totals.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-400">Shipping</dt><dd>{totals.shippingPrice === 0 ? <span className="text-green-400">FREE</span> : formatPrice(totals.shippingPrice)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">GST (18%)</dt><dd>{formatPrice(totals.taxPrice)}</dd></div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold"><dt>Total</dt><dd className="text-secondary-400">{formatPrice(totals.totalPrice)}</dd></div>
            </dl>
            {totals.itemsPrice < 999 && totals.itemsPrice > 0 && (
              <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary-300">
                Add {formatPrice(999 - totals.itemsPrice)} more for free shipping
              </p>
            )}
            <button onClick={() => navigate('/checkout')} disabled={loading} className="btn-primary mt-5 w-full !py-3">
              Proceed to checkout <FiArrowRight />
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}

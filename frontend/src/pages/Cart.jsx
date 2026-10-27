import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { IconShoppingCart, IconTrash2, IconTag, IconX, IconArrowRight, IconPlus, IconMinus } from '../components/ui/icons.jsx';
import toast from 'react-hot-toast';
import { updateCartItem, removeCartItem, toggleSaveForLater, applyCoupon, removeCoupon } from '../features/cartSlice.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import { formatPrice, imgUrl } from '../utils/format.js';

/** Shopping cart styled in clean white & soft mint. */
export default function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { cart, totals, loading } = useSelector((s) => s.cart);
  const [couponInput, setCouponInput] = useState('');

  if (!user) {
    return <EmptyState icon={IconShoppingCart} title="Your cart is waiting" message="Sign in to view your cart and continue shopping." ctaText="Sign in" ctaLink="/login" />;
  }

  const activeItems = cart?.items.filter((i) => !i.savedForLater && i.product) || [];
  const savedItems = cart?.items.filter((i) => i.savedForLater && i.product) || [];

  if (!activeItems.length && !savedItems.length) {
    return <EmptyState icon={IconShoppingCart} title="Your cart is empty" message="Explore our electronics catalog and find something you love." ctaText="Discover products" ctaLink="/products" />;
  }

  const act = async (thunkAction, successMsg) => {
    const res = await dispatch(thunkAction);
    if (res.error) toast.error(res.payload);
    else if (successMsg) toast.success(successMsg);
  };

  const CartLine = ({ item, saved }) => (
    <div className="flex gap-4 rounded-xl border border-[#E4EAE6] bg-white p-4 shadow-sm">
      <Link to={`/product/${item.product.slug}`} className="shrink-0">
        <img src={imgUrl(item.product.images?.[0]?.url)} alt={item.product.name} className="h-24 w-24 rounded-lg object-contain bg-[#F1F7F4] p-1 border border-[#E4EAE6]" />
      </Link>
      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link to={`/product/${item.product.slug}`} className="text-sm font-semibold text-[#202923] transition-colors hover:text-[#087F65]">
              {item.product.name}
            </Link>
            {(item.variant?.color || item.variant?.size) && (
              <p className="mt-0.5 text-xs text-[#65716A]">
                {[item.variant.color, item.variant.size].filter(Boolean).join(' · ')}
              </p>
            )}
            {item.product.stock === 0 && <p className="mt-1 text-xs font-semibold text-[#B42318]">Out of stock</p>}
          </div>
          <button onClick={() => act(removeCartItem(item._id), 'Removed from cart')} aria-label="Remove item" className="p-1.5 rounded-lg text-[#65716A] transition-colors hover:text-[#B42318] hover:bg-red-50">
            <IconTrash2 size={16} />
          </button>
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E4EAE6]/60">
          {!saved ? (
            <div className="flex items-center rounded-lg border border-[#E4EAE6] bg-[#F1F7F4] text-sm">
              <button onClick={() => item.quantity > 1 && act(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))} className="px-2.5 py-1 text-[#202923] hover:text-[#087F65] hover:bg-[#EAF4EF] rounded-l-lg transition-colors" aria-label="Decrease">
                <IconMinus size={14} />
              </button>
              <span className="w-8 text-center font-semibold text-[#202923]">{item.quantity}</span>
              <button onClick={() => act(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))} className="px-2.5 py-1 text-[#202923] hover:text-[#087F65] hover:bg-[#EAF4EF] rounded-r-lg transition-colors" aria-label="Increase">
                <IconPlus size={14} />
              </button>
            </div>
          ) : <span />}
          <div className="flex items-center gap-3">
            <button onClick={() => act(toggleSaveForLater(item._id), saved ? 'Moved to cart' : 'Saved for later')} className="flex items-center gap-1 text-xs font-semibold text-[#087F65] hover:underline">
              {saved ? 'Move to cart' : 'Save for later'}
            </button>
            <span className="font-bold text-[#087F65]">{formatPrice(item.product.price * item.quantity)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Cart' }]} />
      <h1 className="section-title mb-6 text-[#202923]">Shopping Cart <span className="text-sm font-normal text-[#65716A]">({activeItems.length} items)</span></h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {activeItems.map((item) => <CartLine key={item._id} item={item} />)}

          {savedItems.length > 0 && (
            <>
              <h2 className="pt-4 text-base font-bold text-[#202923]">Saved for later ({savedItems.length})</h2>
              {savedItems.map((item) => <CartLine key={item._id} item={item} saved />)}
            </>
          )}
        </div>

        {/* Order summary */}
        {activeItems.length > 0 && totals && (
          <aside className="sticky top-24 h-fit rounded-xl border border-[#E4EAE6] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#202923]">Order Summary</h2>

            {/* Coupon */}
            {cart.coupon?.code ? (
              <div className="mb-4 flex items-center justify-between rounded-lg border border-[#DDEBE3] bg-[#EAF4EF] px-3.5 py-2.5 text-sm">
                <span className="flex items-center gap-2 font-bold text-[#075E4B]"><IconTag size={16} /> {cart.coupon.code}</span>
                <button onClick={() => act(removeCoupon(), 'Coupon removed')} aria-label="Remove coupon" className="text-[#65716A] hover:text-[#B42318] p-1"><IconX size={16} /></button>
              </div>
            ) : (
              <form
                onSubmit={(e) => { e.preventDefault(); if (couponInput.trim()) act(applyCoupon(couponInput.trim().toUpperCase()), 'Coupon applied!'); }}
                className="mb-4 flex gap-2"
              >
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Coupon code (e.g. WELCOME10)" className="input-field flex-1 !py-2 text-xs uppercase" />
                <button type="submit" className="btn-outline !px-4 !py-2 text-xs font-semibold">Apply</button>
              </form>
            )}

            <dl className="space-y-2.5 text-sm text-[#202923]">
              <div className="flex justify-between"><dt className="text-[#65716A]">Subtotal</dt><dd className="font-semibold">{formatPrice(totals.itemsPrice)}</dd></div>
              {totals.discount > 0 && <div className="flex justify-between text-[#087F65] font-semibold"><dt>Coupon discount</dt><dd>− {formatPrice(totals.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-[#65716A]">Shipping</dt><dd>{totals.shippingPrice === 0 ? <span className="font-bold text-[#168764]">FREE</span> : formatPrice(totals.shippingPrice)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#65716A]">GST (18%)</dt><dd>{formatPrice(totals.taxPrice)}</dd></div>
              <div className="flex justify-between border-t border-[#E4EAE6] pt-3 text-base font-bold text-[#202923]"><dt>Total</dt><dd className="text-xl text-[#087F65]">{formatPrice(totals.totalPrice)}</dd></div>
            </dl>
            {totals.itemsPrice < 999 && totals.itemsPrice > 0 && (
              <p className="mt-3 rounded-lg border border-[#DDEBE3] bg-[#EAF4EF] px-3 py-2 text-xs text-[#075E4B] font-medium">
                Add {formatPrice(999 - totals.itemsPrice)} more for free shipping
              </p>
            )}
            <button onClick={() => navigate('/checkout')} disabled={loading} className="btn-primary mt-5 w-full !py-3 font-semibold shadow-sm flex items-center justify-center gap-2">
              Proceed to checkout <IconArrowRight size={18} />
            </button>
          </aside>
        )}
      </div>
    </div>
  );
}

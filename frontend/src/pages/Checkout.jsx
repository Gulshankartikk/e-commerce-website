import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { FiMapPin, FiPlus, FiTruck, FiZap, FiCreditCard, FiDollarSign, FiSmartphone } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../api/axios.js';
import useFetch from '../hooks/useFetch.js';
import { fetchCart } from '../features/cartSlice.js';
import Breadcrumbs from '../components/ui/Breadcrumbs.jsx';
import Modal from '../components/ui/Modal.jsx';
import { formatPrice } from '../utils/format.js';

/** Load the Razorpay checkout script on demand. */
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

/** Checkout: address → delivery → payment (Stripe / Razorpay / COD). */
export default function Checkout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const { cart, totals } = useSelector((s) => s.cart);
  const { data: payConfig } = useFetch('/payments/config');

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [delivery, setDelivery] = useState('standard');
  const [payment, setPayment] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [addressModal, setAddressModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const activeItems = cart?.items.filter((i) => !i.savedForLater && i.product) || [];

  /* Load addresses; refresh totals when delivery option changes */
  useEffect(() => {
    api.get('/addresses').then(({ data }) => {
      setAddresses(data.addresses);
      const def = data.addresses.find((a) => a.isDefault) || data.addresses[0];
      if (def) setSelectedAddress(def._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!activeItems.length && cart) { toast('Your cart is empty'); navigate('/cart'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const deliveryTotals = totals ? {
    ...totals,
    shippingPrice: totals.shippingPrice + (delivery === 'express' ? 99 : 0),
    totalPrice: totals.totalPrice + (delivery === 'express' ? 99 : 0),
  } : null;

  const saveAddress = async (form) => {
    try {
      const { data } = await api.post('/addresses', form);
      setAddresses(data.addresses);
      setSelectedAddress(data.addresses[data.addresses.length - 1]._id);
      setAddressModal(false);
      reset();
      toast.success('Address saved');
    } catch (e) { toast.error(e.message); }
  };

  /** Place the order via the selected gateway. */
  const placeOrder = async () => {
    if (!selectedAddress) { toast.error('Please select a delivery address'); return; }
    setPlacing(true);
    const body = { addressId: selectedAddress, deliveryOption: delivery };
    try {
      if (payment === 'cod') {
        const { data } = await api.post('/orders', body);
        await dispatch(fetchCart());
        navigate(`/order-success/${data.order._id}`);
      } else if (payment === 'razorpay') {
        const ok = await loadRazorpay();
        if (!ok) throw new Error('Could not load Razorpay. Check your connection');
        const { data } = await api.post('/payments/razorpay/create-order', body);
        const rzp = new window.Razorpay({
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: 'FlashShop',
          description: 'Order payment',
          order_id: data.razorpayOrderId,
          prefill: { name: user.name, email: user.email },
          theme: { color: '#087F65' },
          handler: async (resp) => {
            try {
              await api.post('/payments/razorpay/verify', { orderId: data.orderId, ...resp });
              await dispatch(fetchCart());
              navigate(`/order-success/${data.orderId}`);
            } catch (e) { toast.error(e.message); }
          },
          modal: { ondismiss: () => toast('Payment cancelled', { icon: 'ℹ️' }) },
        });
        rzp.open();
      } else if (payment === 'stripe') {
        // Server creates the PaymentIntent; without Stripe.js UI embedded we confirm via redirect flow.
        const { data } = await api.post('/payments/stripe/create-intent', body);
        toast('Stripe test mode: confirming payment…', { icon: '💳' });
        // In production you would mount Stripe Elements with data.clientSecret.
        // Here we poll the confirm endpoint which validates the intent status server-side.
        await api.post('/payments/stripe/confirm', { orderId: data.orderId });
        await dispatch(fetchCart());
        navigate(`/order-success/${data.orderId}`);
      }
    } catch (e) {
      toast.error(e.message);
    } finally {
      setPlacing(false);
    }
  };

  const paymentOptions = [
    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: FiDollarSign, enabled: true },
    { id: 'razorpay', label: 'Razorpay', desc: 'UPI, cards, netbanking & wallets', icon: FiSmartphone, enabled: payConfig?.razorpay },
    { id: 'stripe', label: 'Stripe', desc: 'International credit & debit cards', icon: FiCreditCard, enabled: payConfig?.stripe },
  ];

  const inputCls = (err) => `input-field ${err ? '!border-[#B42318]' : ''}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="section-title mb-8 text-[#202923]">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* 1 — Address */}
          <section className="rounded-xl border border-[#E4EAE6] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold text-[#202923]"><FiMapPin className="text-[#087F65]" /> Delivery Address</h2>
              <button onClick={() => setAddressModal(true)} className="btn-outline !py-1.5 text-xs font-semibold"><FiPlus /> Add new</button>
            </div>
            {addresses.length === 0 ? (
              <p className="text-sm text-[#65716A]">No saved addresses yet. Add one to continue.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <button
                    key={a._id}
                    onClick={() => setSelectedAddress(a._id)}
                    className={`rounded-xl border p-4 text-left text-sm transition-all ${selectedAddress === a._id ? 'border-[#087F65] bg-[#EAF4EF] shadow-xs' : 'border-[#E4EAE6] bg-white hover:border-[#087F65]'}`}
                  >
                    <p className="font-semibold text-[#202923]">{a.fullName} {a.isDefault && <span className="chip ml-1 bg-[#DDEBE3] text-[10px] text-[#075E4B]">Default</span>}</p>
                    <p className="mt-1 text-[#65716A]">{a.line1}{a.line2 && `, ${a.line2}`}</p>
                    <p className="text-[#65716A]">{a.city}, {a.state} — {a.pincode}</p>
                    <p className="mt-1 text-[#65716A]">📞 {a.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 2 — Delivery */}
          <section className="rounded-xl border border-[#E4EAE6] bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#202923]"><FiTruck className="text-[#087F65]" /> Delivery Option</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: 'standard', label: 'Standard Delivery', desc: '4–6 business days', extra: 'FREE over ₹999', icon: FiTruck },
                { id: 'express', label: 'Express Delivery', desc: '1–2 business days', extra: '+ ₹99', icon: FiZap },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDelivery(opt.id)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${delivery === opt.id ? 'border-[#087F65] bg-[#EAF4EF]' : 'border-[#E4EAE6] bg-white hover:border-[#087F65]'}`}
                >
                  <opt.icon className="text-xl text-[#087F65]" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#202923]">{opt.label}</p>
                    <p className="text-xs text-[#65716A]">{opt.desc}</p>
                  </div>
                  <span className="text-xs font-bold text-[#168764]">{opt.extra}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 3 — Payment */}
          <section className="rounded-xl border border-[#E4EAE6] bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[#202923]"><FiCreditCard className="text-[#087F65]" /> Payment Method</h2>
            <div className="space-y-3">
              {paymentOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => opt.enabled && setPayment(opt.id)}
                  disabled={!opt.enabled}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all disabled:opacity-40 ${payment === opt.id ? 'border-[#087F65] bg-[#EAF4EF]' : 'border-[#E4EAE6] bg-white hover:border-[#087F65]'}`}
                >
                  <opt.icon className="text-xl text-[#087F65]" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#202923]">{opt.label}</p>
                    <p className="text-xs text-[#65716A]">{opt.enabled ? opt.desc : 'Not configured on this server'}</p>
                  </div>
                  <span className={`h-4 w-4 rounded-full border-2 ${payment === opt.id ? 'border-[#087F65] bg-[#087F65]' : 'border-[#E4EAE6]'}`} />
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        {deliveryTotals && (
          <aside className="sticky top-24 h-fit rounded-xl border border-[#E4EAE6] bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[#202923]">Order Summary</h2>
            <ul className="mb-4 max-h-56 space-y-3 overflow-y-auto pr-1 text-sm text-[#202923]">
              {activeItems.map((i) => (
                <li key={i._id} className="flex justify-between gap-2">
                  <span className="truncate text-[#202923]">{i.product.name} <span className="text-[#65716A]">×{i.quantity}</span></span>
                  <span className="shrink-0 font-semibold">{formatPrice(i.product.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2.5 border-t border-[#E4EAE6] pt-4 text-sm text-[#202923]">
              <div className="flex justify-between"><dt className="text-[#65716A]">Subtotal</dt><dd className="font-semibold">{formatPrice(deliveryTotals.itemsPrice)}</dd></div>
              {deliveryTotals.discount > 0 && <div className="flex justify-between text-[#087F65] font-semibold"><dt>Discount</dt><dd>− {formatPrice(deliveryTotals.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-[#65716A]">Shipping</dt><dd>{deliveryTotals.shippingPrice === 0 ? <span className="font-bold text-[#168764]">FREE</span> : formatPrice(deliveryTotals.shippingPrice)}</dd></div>
              <div className="flex justify-between"><dt className="text-[#65716A]">GST (18%)</dt><dd>{formatPrice(deliveryTotals.taxPrice)}</dd></div>
              <div className="flex justify-between border-t border-[#E4EAE6] pt-3 text-base font-bold text-[#202923]"><dt>Grand Total</dt><dd className="text-xl text-[#087F65]">{formatPrice(deliveryTotals.totalPrice)}</dd></div>
            </dl>
            <button onClick={placeOrder} disabled={placing || !activeItems.length} className="btn-primary mt-5 w-full !py-3.5 font-semibold shadow-sm">
              {placing ? 'Placing order…' : `Place order · ${formatPrice(deliveryTotals.totalPrice)}`}
            </button>
            <p className="mt-3 text-center text-xs text-[#65716A]">🔒 Payments are encrypted and secure</p>
          </aside>
        )}
      </div>

      {/* New address modal */}
      <Modal open={addressModal} onClose={() => setAddressModal(false)} title="Add delivery address">
        <form onSubmit={handleSubmit(saveAddress)} className="grid gap-4 sm:grid-cols-2">
          <div>
            <input placeholder="Full name" className={inputCls(errors.fullName)} {...register('fullName', { required: true })} />
            {errors.fullName && <p className="mt-1 text-xs text-red-400">Full name is required</p>}
          </div>
          <div>
            <input placeholder="Mobile number" className={inputCls(errors.phone)} {...register('phone', { required: true, pattern: /^[6-9]\d{9}$/ })} />
            {errors.phone && <p className="mt-1 text-xs text-red-400">Enter a valid 10-digit mobile number</p>}
          </div>
          <div className="sm:col-span-2">
            <input placeholder="Address line 1 (house, street)" className={inputCls(errors.line1)} {...register('line1', { required: true })} />
            {errors.line1 && <p className="mt-1 text-xs text-red-400">Address is required</p>}
          </div>
          <input placeholder="Address line 2 (optional)" className="input-field sm:col-span-2" {...register('line2')} />
          <div>
            <input placeholder="City" className={inputCls(errors.city)} {...register('city', { required: true })} />
            {errors.city && <p className="mt-1 text-xs text-red-400">City is required</p>}
          </div>
          <div>
            <input placeholder="State" className={inputCls(errors.state)} {...register('state', { required: true })} />
            {errors.state && <p className="mt-1 text-xs text-red-400">State is required</p>}
          </div>
          <div>
            <input placeholder="Pincode" className={inputCls(errors.pincode)} {...register('pincode', { required: true, pattern: /^\d{6}$/ })} />
            {errors.pincode && <p className="mt-1 text-xs text-red-400">Enter a valid 6-digit pincode</p>}
          </div>
          <label className="flex items-center gap-2 text-sm text-[#202923]">
            <input type="checkbox" className="h-4 w-4 accent-[#087F65]" {...register('isDefault')} /> Set as default
          </label>
          <button type="submit" className="btn-primary sm:col-span-2">Save address</button>
        </form>
      </Modal>
    </div>
  );
}

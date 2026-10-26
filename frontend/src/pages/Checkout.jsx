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
          theme: { color: '#4F46E5' },
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

  const inputCls = (err) => `input-field ${err ? '!border-red-500' : ''}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Cart', to: '/cart' }, { label: 'Checkout' }]} />
      <h1 className="section-title mb-8">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* 1 — Address */}
          <section className="card-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold"><FiMapPin className="text-primary-300" /> Delivery address</h2>
              <button onClick={() => setAddressModal(true)} className="btn-outline !py-1.5 text-xs"><FiPlus /> Add new</button>
            </div>
            {addresses.length === 0 ? (
              <p className="text-sm text-slate-400">No saved addresses yet. Add one to continue.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <button
                    key={a._id}
                    onClick={() => setSelectedAddress(a._id)}
                    className={`rounded-xl border p-4 text-left text-sm transition-all ${selectedAddress === a._id ? 'border-primary bg-primary/10 shadow-glow' : 'border-slate-600 hover:border-slate-400'}`}
                  >
                    <p className="font-semibold">{a.fullName} {a.isDefault && <span className="chip ml-1 bg-secondary-500/20 text-[10px] text-secondary-400">Default</span>}</p>
                    <p className="mt-1 text-slate-400">{a.line1}{a.line2 && `, ${a.line2}`}</p>
                    <p className="text-slate-400">{a.city}, {a.state} — {a.pincode}</p>
                    <p className="mt-1 text-slate-400">📞 {a.phone}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* 2 — Delivery */}
          <section className="card-surface p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><FiTruck className="text-primary-300" /> Delivery option</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { id: 'standard', label: 'Standard', desc: '4–6 business days', extra: 'FREE over ₹999', icon: FiTruck },
                { id: 'express', label: 'Express', desc: '1–2 business days', extra: '+ ₹99', icon: FiZap },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDelivery(opt.id)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${delivery === opt.id ? 'border-primary bg-primary/10' : 'border-slate-600 hover:border-slate-400'}`}
                >
                  <opt.icon className="text-xl text-secondary-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-slate-400">{opt.desc}</p>
                  </div>
                  <span className="text-xs font-semibold text-accent">{opt.extra}</span>
                </button>
              ))}
            </div>
          </section>

          {/* 3 — Payment */}
          <section className="card-surface p-6">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><FiCreditCard className="text-primary-300" /> Payment method</h2>
            <div className="space-y-3">
              {paymentOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => opt.enabled && setPayment(opt.id)}
                  disabled={!opt.enabled}
                  className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all disabled:opacity-40 ${payment === opt.id ? 'border-primary bg-primary/10' : 'border-slate-600 hover:border-slate-400'}`}
                >
                  <opt.icon className="text-xl text-secondary-400" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{opt.label}</p>
                    <p className="text-xs text-slate-400">{opt.enabled ? opt.desc : 'Not configured on this server'}</p>
                  </div>
                  <span className={`h-4 w-4 rounded-full border-2 ${payment === opt.id ? 'border-primary bg-primary' : 'border-slate-500'}`} />
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        {deliveryTotals && (
          <aside className="card-surface sticky top-24 h-fit p-6">
            <h2 className="mb-4 text-lg font-bold">Order summary</h2>
            <ul className="mb-4 max-h-56 space-y-3 overflow-y-auto pr-1 text-sm">
              {activeItems.map((i) => (
                <li key={i._id} className="flex justify-between gap-2">
                  <span className="truncate text-slate-300">{i.product.name} <span className="text-slate-500">×{i.quantity}</span></span>
                  <span className="shrink-0 font-semibold">{formatPrice(i.product.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-2.5 border-t border-white/10 pt-4 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Subtotal</dt><dd>{formatPrice(deliveryTotals.itemsPrice)}</dd></div>
              {deliveryTotals.discount > 0 && <div className="flex justify-between text-secondary-400"><dt>Discount</dt><dd>− {formatPrice(deliveryTotals.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-400">Shipping</dt><dd>{deliveryTotals.shippingPrice === 0 ? <span className="text-green-400">FREE</span> : formatPrice(deliveryTotals.shippingPrice)}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">GST (18%)</dt><dd>{formatPrice(deliveryTotals.taxPrice)}</dd></div>
              <div className="flex justify-between border-t border-white/10 pt-3 text-base font-bold"><dt>Total</dt><dd className="text-secondary-400">{formatPrice(deliveryTotals.totalPrice)}</dd></div>
            </dl>
            <button onClick={placeOrder} disabled={placing || !activeItems.length} className="btn-accent mt-5 w-full !py-3">
              {placing ? 'Placing order…' : `Place order · ${formatPrice(deliveryTotals.totalPrice)}`}
            </button>
            <p className="mt-3 text-center text-xs text-slate-500">🔒 Payments are encrypted and secure</p>
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
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" {...register('isDefault')} /> Set as default
          </label>
          <button type="submit" className="btn-primary sm:col-span-2">Save address</button>
        </form>
      </Modal>
    </div>
  );
}

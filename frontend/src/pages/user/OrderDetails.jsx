import { Link, useNavigate, useParams } from 'react-router-dom';
import { IconDownload, IconXCircle, IconCheck } from '../../components/ui/icons.jsx';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import api from '../../api/axios.js';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatPrice, formatDateTime, ORDER_STATUS_STEPS, STATUS_COLORS, imgUrl } from '../../utils/format.js';

/** Full order view: status timeline, items, address, totals, invoice, cancel. */
export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, loading, refetch } = useFetch(`/orders/${id}`);
  const order = data?.order;

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-8"><TableSkeleton rows={5} /></div>;
  if (!order) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-xl font-bold">Order not found</h1>
        <Link to="/dashboard/orders" className="btn-primary mt-4 inline-flex">Back to orders</Link>
      </div>
    );
  }

  const isCancelled = ['cancelled', 'refunded'].includes(order.status);
  const currentStep = ORDER_STATUS_STEPS.indexOf(order.status);
  const canCancel = ['pending', 'confirmed', 'processing'].includes(order.status);

  const cancelOrder = async () => {
    if (!window.confirm('Cancel this order? Any payment will be refunded.')) return;
    try {
      await api.put(`/orders/${id}/cancel`);
      toast.success('Order cancelled');
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  const downloadInvoice = async () => {
    try {
      const res = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.orderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Could not download the invoice'); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'My Orders', to: '/dashboard/orders' }, { label: order.orderNumber }]} />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-bold">{order.orderNumber}</h1>
          <p className="text-sm text-slate-400">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={downloadInvoice} className="btn-outline !py-2 text-sm"><IconDownload size={16} /> Invoice</button>
          {canCancel && <button onClick={cancelOrder} className="btn-outline !py-2 text-sm text-red-400"><IconXCircle size={16} /> Cancel order</button>}
        </div>
      </div>

      {/* Status timeline */}
      <div className="card-surface mb-6 p-6">
        {isCancelled ? (
          <p className={`chip capitalize ${STATUS_COLORS[order.status]}`}>{order.status}</p>
        ) : (
          <div className="flex items-center">
            {ORDER_STATUS_STEPS.map((step, i) => {
              const done = i <= currentStep;
              return (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <div className="flex flex-col items-center">
                    <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${done ? 'bg-[#087F65] text-white shadow-sm' : 'bg-[#E4EAE6] text-[#89938D]'}`}>
                      {done ? <IconCheck size={16} strokeWidth={2.2} /> : i + 1}
                    </span>
                    <span className={`mt-1.5 hidden text-[10px] capitalize sm:block ${done ? 'text-[#075E4B] font-semibold' : 'text-[#89938D]'}`}>{step.replace(/-/g, ' ')}</span>
                  </div>
                  {i < ORDER_STATUS_STEPS.length - 1 && <div className={`mx-1 h-0.5 flex-1 rounded ${i < currentStep ? 'bg-[#087F65]' : 'bg-[#E4EAE6]'}`} />}
                </div>
              );
            })}
          </div>
        )}
        {/* History log */}
        <div className="mt-5 space-y-2 border-t border-[#E4EAE6] pt-4">
          {[...order.statusHistory].reverse().map((h, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="capitalize text-[#202923]">{h.note || h.status.replace(/-/g, ' ')}</span>
              <span className="text-[#65716A]">{formatDateTime(h.at)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Items */}
        <div className="card-surface p-6 md:col-span-2">
          <h2 className="mb-4 font-bold">Items</h2>
          <ul className="space-y-4">
            {order.items.map((item, i) => (
              <li key={i} className="flex items-center gap-4">
                <img src={imgUrl(item.image)} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{item.name}</p>
                  {(item.variant?.color || item.variant?.size) && (
                    <p className="text-xs text-slate-400">{[item.variant.color, item.variant.size].filter(Boolean).join(' · ')}</p>
                  )}
                  <p className="text-xs text-slate-400">Qty {item.quantity}</p>
                </div>
                <span className="font-semibold">{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Address + totals */}
        <div className="space-y-6">
          <div className="card-surface p-6">
            <h2 className="mb-2 font-bold">Delivery address</h2>
            <p className="text-sm font-semibold">{order.shippingAddress.fullName}</p>
            <p className="text-sm text-slate-400">{order.shippingAddress.line1}{order.shippingAddress.line2 && `, ${order.shippingAddress.line2}`}</p>
            <p className="text-sm text-slate-400">{order.shippingAddress.city}, {order.shippingAddress.state} — {order.shippingAddress.pincode}</p>
            <p className="mt-1 text-sm text-slate-400">📞 {order.shippingAddress.phone}</p>
          </div>
          <div className="card-surface p-6">
            <h2 className="mb-3 font-bold">Payment</h2>
            <p className="text-sm uppercase text-slate-300">{order.paymentMethod} · <span className="capitalize">{order.paymentStatus}</span></p>
            <dl className="mt-3 space-y-2 border-t border-white/10 pt-3 text-sm">
              <div className="flex justify-between"><dt className="text-slate-400">Subtotal</dt><dd>{formatPrice(order.itemsPrice)}</dd></div>
              {order.discount > 0 && <div className="flex justify-between text-secondary-400"><dt>Discount</dt><dd>− {formatPrice(order.discount)}</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-400">Shipping</dt><dd>{order.shippingPrice ? formatPrice(order.shippingPrice) : 'FREE'}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-400">GST</dt><dd>{formatPrice(order.taxPrice)}</dd></div>
              <div className="flex justify-between border-t border-white/10 pt-2 font-bold"><dt>Total</dt><dd className="text-secondary-400">{formatPrice(order.totalPrice)}</dd></div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

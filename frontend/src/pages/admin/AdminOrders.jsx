import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import api from '../../api/axios.js';
import Pagination from '../../components/ui/Pagination.jsx';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatPrice, formatDate, STATUS_COLORS } from '../../utils/format.js';

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'refunded'];

/** Admin order management: filter by status, inline status updates. */
export default function AdminOrders() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const { data, loading, refetch } = useFetch(`/orders?page=${page}${status ? `&status=${status}` : ''}`, [page, status]);

  const updateStatus = async (order, newStatus) => {
    if (newStatus === order.status) return;
    if (['cancelled', 'refunded'].includes(newStatus) && !window.confirm(`Mark ${order.orderNumber} as ${newStatus}?`)) { refetch(); return; }
    try {
      await api.put(`/orders/${order._id}/status`, { status: newStatus });
      toast.success(`Order ${newStatus}`);
      refetch();
    } catch (e) { toast.error(e.message); refetch(); }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders {data && <span className="text-sm font-normal text-slate-400">({data.total})</span>}</h1>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="input-field w-auto !py-2 text-sm" aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {loading ? <TableSkeleton rows={6} /> : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-slate-400">
                <th className="p-4">Order</th><th className="p-4">Customer</th><th className="p-4">Items</th><th className="p-4">Payment</th><th className="p-4">Total</th><th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data?.orders || []).map((o) => (
                <tr key={o._id} className="border-b border-white/5 transition-colors hover:bg-white/[0.03]">
                  <td className="p-4">
                    <Link to={`/dashboard/orders/${o._id}`} className="font-mono text-xs font-semibold text-primary-300 hover:underline">{o.orderNumber}</Link>
                    <p className="text-xs text-slate-500">{formatDate(o.createdAt)}</p>
                  </td>
                  <td className="p-4">
                    <p>{o.user?.name || '—'}</p>
                    <p className="text-xs text-slate-500">{o.user?.email}</p>
                  </td>
                  <td className="p-4">{o.items.length}</td>
                  <td className="p-4">
                    <span className="uppercase">{o.paymentMethod}</span>
                    <p className={`text-xs capitalize ${o.paymentStatus === 'paid' ? 'text-green-400' : 'text-slate-400'}`}>{o.paymentStatus}</p>
                  </td>
                  <td className="p-4 font-semibold">{formatPrice(o.totalPrice)}</td>
                  <td className="p-4">
                    {['cancelled', 'refunded'].includes(o.status) ? (
                      <span className={`chip capitalize ${STATUS_COLORS[o.status]}`}>{o.status}</span>
                    ) : (
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o, e.target.value)}
                        className={`rounded-lg border-0 px-2.5 py-1.5 text-xs font-semibold capitalize outline-none ${STATUS_COLORS[o.status]} bg-transparent`}
                        style={{ background: 'rgba(255,255,255,0.05)' }}
                        aria-label="Update status"
                      >
                        {STATUSES.map((s) => <option key={s} value={s} className="bg-card capitalize text-frost">{s}</option>)}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={data?.pages} onChange={setPage} />
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage } from 'react-icons/fi';
import useFetch from '../../hooks/useFetch.js';
import Pagination from '../../components/ui/Pagination.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatPrice, formatDate, STATUS_COLORS, imgUrl } from '../../utils/format.js';

/** Order history list with pagination. */
export default function MyOrders() {
  const [page, setPage] = useState(1);
  const { data, loading } = useFetch(`/orders/my?page=${page}`, [page]);

  if (loading) return <TableSkeleton rows={4} />;
  if (!data?.orders?.length) {
    return <EmptyState icon={FiPackage} title="No orders yet" message="When you place an order, it will show up here with live tracking." />;
  }

  return (
    <div className="space-y-4">
      {data.orders.map((order) => (
        <Link key={order._id} to={`/dashboard/orders/${order._id}`} className="card-surface block p-5 transition-all hover:border-[#087F65] hover:shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm font-semibold text-[#202923]">{order.orderNumber}</p>
              <p className="text-xs text-[#65716A]">{formatDate(order.createdAt)} · {order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`chip capitalize ${STATUS_COLORS[order.status]}`}>{order.status.replace(/-/g, ' ')}</span>
              <span className="font-bold text-[#087F65]">{formatPrice(order.totalPrice)}</span>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {order.items.slice(0, 4).map((item, i) => (
              <img key={i} src={imgUrl(item.image)} alt={item.name} className="h-14 w-14 rounded-lg object-cover bg-[#F1F7F4] p-1 border border-[#E4EAE6]" loading="lazy" />
            ))}
            {order.items.length > 4 && (
              <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#F1F7F4] text-xs font-semibold text-[#65716A] border border-[#E4EAE6]">+{order.items.length - 4}</span>
            )}
          </div>
        </Link>
      ))}
      <Pagination page={page} pages={data.pages} onChange={setPage} />
    </div>
  );
}

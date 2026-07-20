import { FiBell, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import api from '../../api/axios.js';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatDateTime } from '../../utils/format.js';

const TYPE_ICONS = { order: '📦', promo: '🏷️', account: '👤', system: '🔔' };

/** Notification center. */
export default function Notifications() {
  const { data, loading, refetch } = useFetch('/notifications');

  const markAllRead = async () => {
    await api.put('/notifications/read-all').catch(() => {});
    refetch();
  };

  const remove = async (id) => {
    try { await api.delete(`/notifications/${id}`); refetch(); }
    catch (e) { toast.error(e.message); }
  };

  if (loading) return <TableSkeleton rows={4} />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">Notifications {data?.unread > 0 && <span className="chip ml-1 bg-primary/20 text-primary-300">{data.unread} new</span>}</h2>
        {data?.unread > 0 && <button onClick={markAllRead} className="flex items-center gap-1 text-xs text-secondary-400 hover:underline"><FiCheckCircle /> Mark all read</button>}
      </div>

      {!data?.notifications?.length ? (
        <div className="card-surface flex flex-col items-center gap-3 p-10 text-center">
          <FiBell className="text-4xl text-slate-600" />
          <p className="text-sm text-slate-400">You're all caught up. Order updates and offers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.notifications.map((n) => (
            <div key={n._id} className={`card-surface flex items-start gap-3 p-4 ${!n.isRead ? 'border-l-4 !border-l-primary' : ''}`}>
              <span className="text-xl">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{n.title}</p>
                <p className="text-sm text-slate-400">{n.message}</p>
                <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                  <span>{formatDateTime(n.createdAt)}</span>
                  {n.link && <Link to={n.link} className="text-primary-300 hover:underline">View →</Link>}
                </div>
              </div>
              <button onClick={() => remove(n._id)} aria-label="Delete notification" className="p-1 text-slate-500 hover:text-red-400"><FiTrash2 /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

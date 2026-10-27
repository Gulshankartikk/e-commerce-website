import {
  IconBell,
  IconTrash2,
  IconCheckCircle2,
  IconPackage,
  IconTag,
  IconUserRound,
} from '../../components/ui/icons.jsx';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import api from '../../api/axios.js';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatDateTime } from '../../utils/format.js';

const TYPE_ICONS = {
  order: IconPackage,
  promo: IconTag,
  account: IconUserRound,
  system: IconBell,
};

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
        <h2 className="text-lg font-bold text-[#202923]">Notifications {data?.unread > 0 && <span className="chip ml-1 bg-[#EAF4EF] text-[#087F65] font-semibold">{data.unread} new</span>}</h2>
        {data?.unread > 0 && (
          <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs text-[#087F65] hover:underline font-medium">
            <IconCheckCircle2 size={14} /> Mark all read
          </button>
        )}
      </div>

      {!data?.notifications?.length ? (
        <div className="card-surface flex flex-col items-center gap-3 p-10 text-center">
          <IconBell size={36} className="text-[#89938D]" />
          <p className="text-sm text-[#65716A]">You're all caught up. Order updates and offers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.notifications.map((n) => {
            const IconComponent = TYPE_ICONS[n.type] || IconBell;
            return (
              <div key={n._id} className={`card-surface flex items-start gap-3 p-4 ${!n.isRead ? 'border-l-4 !border-l-[#087F65]' : ''}`}>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF4EF] text-[#087F65]">
                  <IconComponent size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[#202923]">{n.title}</p>
                  <p className="text-sm text-[#65716A]">{n.message}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-[#89938D]">
                    <span>{formatDateTime(n.createdAt)}</span>
                    {n.link && <Link to={n.link} className="text-[#087F65] font-medium hover:underline">View →</Link>}
                  </div>
                </div>
                <button
                  onClick={() => remove(n._id)}
                  aria-label="Delete notification"
                  className="rounded-lg p-1.5 text-[#65716A] transition-colors hover:bg-[#EAF4EF] hover:text-[#B42318]"
                >
                  <IconTrash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

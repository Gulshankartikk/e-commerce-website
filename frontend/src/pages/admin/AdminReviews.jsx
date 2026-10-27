import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import api from '../../api/axios.js';
import Rating from '../../components/ui/Rating.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatDate } from '../../utils/format.js';

/** Admin review moderation: approve/hide and delete. */
export default function AdminReviews() {
  const [page, setPage] = useState(1);
  const { data, loading, refetch } = useFetch(`/reviews/admin?page=${page}`, [page]);

  const toggle = async (r) => {
    try {
      await api.put(`/reviews/${r._id}/approve`);
      toast.success(r.isApproved ? 'Review hidden' : 'Review approved');
      refetch();
    } catch (e) { toast.error(e.message); }
  };

  const remove = async (r) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try { await api.delete(`/reviews/${r._id}`); toast.success('Review deleted'); refetch(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div>
      <h1 className="mb-5 text-2xl font-bold">Reviews {data && <span className="text-sm font-normal text-slate-400">({data.total})</span>}</h1>
      {loading ? <TableSkeleton rows={5} /> : (
        <div className="space-y-3">
          {(data?.reviews || []).map((r) => (
            <div key={r._id} className={`card-surface p-5 ${!r.isApproved ? 'opacity-60' : ''}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <Rating value={r.rating} />
                    {!r.isApproved && <span className="chip bg-stone-100 text-[#65716A] border border-[#E4EAE6]">Hidden</span>}
                  </div>
                  {r.title && <p className="mt-1.5 text-sm font-semibold">{r.title}</p>}
                  <p className="mt-1 text-sm text-slate-300">{r.comment}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    {r.user?.name} ({r.user?.email}) · {formatDate(r.createdAt)} · on{' '}
                    {r.product ? <Link to={`/product/${r.product.slug}`} className="text-primary-300 hover:underline">{r.product.name}</Link> : 'deleted product'}
                  </p>
                </div>
                <div className="flex shrink-0">
                  <button onClick={() => toggle(r)} title={r.isApproved ? 'Hide review' : 'Approve review'} className="p-2 text-slate-400 hover:text-[#087F65]">
                    {r.isApproved ? <FiEyeOff /> : <FiEye />}
                  </button>
                  <button onClick={() => remove(r)} title="Delete" className="p-2 text-slate-400 hover:text-red-400"><FiTrash2 /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pages={data?.pages} onChange={setPage} />
    </div>
  );
}

import { useState } from 'react';
import { FiSearch, FiShield, FiSlash, FiTrash2, FiUserCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import api from '../../api/axios.js';
import Pagination from '../../components/ui/Pagination.jsx';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatDate } from '../../utils/format.js';

const ROLE_BADGES = {
  admin: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  seller: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  manager: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
  user: 'bg-primary/20 text-primary-300 border border-primary/30',
};

/** Admin user management: search, block, assign role, delete. */
export default function AdminUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 400);
  const { data, loading, refetch } = useFetch(`/admin/users?page=${page}&keyword=${encodeURIComponent(debounced)}`, [page, debounced]);

  const act = async (fn, msg) => {
    try { await fn(); toast.success(msg); refetch(); }
    catch (e) { toast.error(e.message); }
  };

  const handleRoleChange = async (userId, newRole) => {
    act(() => api.put(`/admin/users/${userId}/role`, { role: newRole }), `Role changed to ${newRole}`);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Users & Roles {data && <span className="text-sm font-normal text-slate-400">({data.total})</span>}</h1>
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email…" className="input-field !py-2 pl-9 text-sm" />
        </div>
      </div>

      {loading ? <TableSkeleton rows={6} /> : (
        <div className="card-surface overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase text-slate-400">
                <th className="p-4">User</th><th className="p-4">Role</th><th className="p-4">Verified</th><th className="p-4">Joined</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(data?.users || []).map((u) => (
                <tr key={u._id} className="border-b border-white/5 transition-colors hover:bg-white/[0.03]">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary-500 text-sm font-bold text-white">{u.name[0]?.toUpperCase()}</span>
                      <div><p className="font-medium">{u.name}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize outline-none ${ROLE_BADGES[u.role] || 'bg-white/5 text-slate-300'}`}
                      style={{ background: 'rgba(255,255,255,0.06)' }}
                    >
                      <option value="user" className="bg-card text-frost">🛍️ User / Customer</option>
                      <option value="seller" className="bg-card text-frost">🏪 Seller / Vendor</option>
                      <option value="manager" className="bg-card text-frost">👔 Manager</option>
                      <option value="admin" className="bg-card text-frost">👑 Admin</option>
                    </select>
                  </td>
                  <td className="p-4">{u.isVerified ? <span className="text-green-400">✓</span> : <span className="text-slate-500">—</span>}</td>
                  <td className="p-4 text-slate-400">{formatDate(u.createdAt)}</td>
                  <td className="p-4">{u.isBlocked ? <span className="chip bg-red-500/15 text-red-400">Blocked</span> : <span className="chip bg-green-500/15 text-green-400">Active</span>}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => act(() => api.put(`/admin/users/${u._id}/block`), u.isBlocked ? 'User unblocked' : 'User blocked')}
                      title={u.isBlocked ? 'Unblock' : 'Block'} className="p-2 text-slate-400 hover:text-amber-400"
                    >
                      <FiSlash />
                    </button>
                    <button
                      onClick={() => window.confirm(`Delete ${u.name}? This cannot be undone.`) && act(() => api.delete(`/admin/users/${u._id}`), 'User deleted')}
                      title="Delete" className="p-2 text-slate-400 hover:text-red-400"
                    >
                      <FiTrash2 />
                    </button>
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

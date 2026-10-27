import { useState } from 'react';
import { IconSearch, IconSlash, IconTrash2 } from '../../components/ui/icons.jsx';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch.js';
import useDebounce from '../../hooks/useDebounce.js';
import api from '../../api/axios.js';
import Pagination from '../../components/ui/Pagination.jsx';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatDate } from '../../utils/format.js';

const ROLE_BADGES = {
  admin: 'bg-[#075E4B] text-white border border-[#075E4B]',
  seller: 'bg-[#EAF4EF] text-[#087F65] border border-[#DDEBE3]',
  manager: 'bg-[#F1F7F4] text-[#202923] border border-[#E4EAE6]',
  user: 'bg-[#EAF4EF] text-[#075E4B] border border-[#DDEBE3]',
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
          <IconSearch size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#89938D]" />
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
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize outline-none ${ROLE_BADGES[u.role] || 'bg-[#F1F7F4] text-[#202923]'}`}
                      style={{ background: '#F1F7F4' }}
                    >
                      <option value="user" className="bg-white text-[#202923]">User / Customer</option>
                      <option value="seller" className="bg-white text-[#202923]">Seller / Vendor</option>
                      <option value="manager" className="bg-white text-[#202923]">Manager</option>
                      <option value="admin" className="bg-white text-[#202923]">Admin</option>
                    </select>
                  </td>
                  <td className="p-4">{u.isVerified ? <span className="text-[#168764] font-bold">✓</span> : <span className="text-[#89938D]">—</span>}</td>
                  <td className="p-4 text-[#65716A]">{formatDate(u.createdAt)}</td>
                  <td className="p-4">{u.isBlocked ? <span className="chip bg-[#B42318]/15 text-[#B42318]">Blocked</span> : <span className="chip bg-[#EAF4EF] text-[#087F65]">Active</span>}</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => act(() => api.put(`/admin/users/${u._id}/block`), u.isBlocked ? 'User unblocked' : 'User blocked')}
                      title={u.isBlocked ? 'Unblock' : 'Block'} className="rounded-lg p-1.5 text-[#65716A] hover:bg-[#EAF4EF] hover:text-[#087F65] transition-colors inline-block mr-1"
                    >
                      <IconSlash size={16} />
                    </button>
                    <button
                      onClick={() => window.confirm(`Delete ${u.name}? This cannot be undone.`) && act(() => api.delete(`/admin/users/${u._id}`), 'User deleted')}
                      title="Delete" className="rounded-lg p-1.5 text-[#65716A] hover:bg-[#EAF4EF] hover:text-[#B42318] transition-colors inline-block"
                    >
                      <IconTrash2 size={16} />
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

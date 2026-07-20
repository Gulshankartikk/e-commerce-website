import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { FiTrendingUp, FiUsers, FiShoppingBag, FiBox } from 'react-icons/fi';
import useFetch from '../../hooks/useFetch.js';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatPrice, formatDate, STATUS_COLORS, imgUrl } from '../../utils/format.js';

const PIE_COLORS = ['#EAB308', '#3B82F6', '#4F46E5', '#06B6D4', '#14B8A6', '#22C55E', '#EF4444', '#A855F7'];

/** Admin analytics dashboard: KPIs, sales graph, status pie, top products, low stock. */
export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const { data, loading } = useFetch(`/admin/dashboard?days=${days}`, [days]);

  if (loading) return <TableSkeleton rows={6} />;
  const stats = data?.stats || {};

  const kpis = [
    { label: 'Total revenue', value: formatPrice(stats.totalRevenue), icon: FiTrendingUp, color: 'from-primary to-primary-400' },
    { label: 'Total orders', value: stats.totalOrders ?? 0, icon: FiShoppingBag, color: 'from-secondary-500 to-secondary-400' },
    { label: 'Customers', value: stats.totalUsers ?? 0, icon: FiUsers, color: 'from-accent to-accent-400' },
    { label: 'Products', value: stats.totalProducts ?? 0, icon: FiBox, color: 'from-purple-600 to-purple-400' },
  ];

  const pieData = (data?.statusBreakdown || []).map((s) => ({ name: s._id, value: s.count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="input-field w-auto !py-2 text-sm" aria-label="Time range">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="card-surface flex items-center gap-4 p-5">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${k.color} text-xl text-white`}><k.icon /></span>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">{k.label}</p>
              <p className="text-xl font-bold">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold">Sales — last {days} days</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data?.salesByDay || []}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#4F46E5" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="_id" stroke="#64748B" fontSize={11} tickFormatter={(d) => d.slice(5)} />
              <YAxis stroke="#64748B" fontSize={11} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip
                contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#F8FAFC' }}
                formatter={(v, name) => (name === 'revenue' ? [formatPrice(v), 'Revenue'] : [v, 'Orders'])}
              />
              <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={2} fill="url(#rev)" />
              <Area type="monotone" dataKey="orders" stroke="#06B6D4" strokeWidth={2} fill="transparent" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card-surface p-5">
          <h2 className="mb-4 font-bold">Orders by status</h2>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#F8FAFC' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="py-16 text-center text-sm text-slate-400">No orders yet</p>}
        </div>
      </div>

      {/* Recent orders + top products + low stock */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card-surface p-5 lg:col-span-2">
          <h2 className="mb-4 font-bold">Recent orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead><tr className="text-left text-xs uppercase text-slate-400"><th className="pb-3">Order</th><th className="pb-3">Customer</th><th className="pb-3">Status</th><th className="pb-3 text-right">Total</th></tr></thead>
              <tbody>
                {(data?.recentOrders || []).map((o) => (
                  <tr key={o._id} className="border-t border-white/5">
                    <td className="py-2.5 font-mono text-xs">{o.orderNumber}<br /><span className="text-slate-500">{formatDate(o.createdAt)}</span></td>
                    <td className="py-2.5">{o.user?.name || '—'}</td>
                    <td className="py-2.5"><span className={`chip capitalize ${STATUS_COLORS[o.status]}`}>{o.status.replace(/-/g, ' ')}</span></td>
                    <td className="py-2.5 text-right font-semibold">{formatPrice(o.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-surface p-5">
            <h2 className="mb-4 font-bold">Top selling</h2>
            <ul className="space-y-3">
              {(data?.topProducts || []).map((p) => (
                <li key={p._id} className="flex items-center gap-3">
                  <img src={imgUrl(p.images?.[0]?.url)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.sold} sold</p>
                  </div>
                  <span className="text-sm font-semibold text-secondary-400">{formatPrice(p.price)}</span>
                </li>
              ))}
            </ul>
          </div>
          {data?.lowStock?.length > 0 && (
            <div className="card-surface border-l-4 !border-l-accent p-5">
              <h2 className="mb-3 font-bold text-accent">⚠ Low stock</h2>
              <ul className="space-y-2 text-sm">
                {data.lowStock.map((p) => (
                  <li key={p._id} className="flex justify-between gap-2">
                    <span className="truncate">{p.name}</span>
                    <span className="shrink-0 font-bold text-accent">{p.stock} left</span>
                  </li>
                ))}
              </ul>
              <Link to="/admin/products" className="mt-3 inline-block text-xs text-primary-300 hover:underline">Manage inventory →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

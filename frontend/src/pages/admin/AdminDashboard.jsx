import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { IconTrendingUp, IconUsers, IconShoppingCart, IconPackage, IconAlertCircle } from '../../components/ui/icons.jsx';
import useFetch from '../../hooks/useFetch.js';
import { TableSkeleton } from '../../components/ui/Skeletons.jsx';
import { formatPrice, formatDate, STATUS_COLORS, imgUrl } from '../../utils/format.js';

const PIE_COLORS = ['#087F65', '#168764', '#075E4B', '#52B599', '#A7D4C3', '#043D31', '#B42318', '#E4EAE6'];

/** Admin analytics dashboard styled in clean white & soft mint. */
export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const { data, loading } = useFetch(`/admin/dashboard?days=${days}`, [days]);

  if (loading) return <TableSkeleton rows={6} />;
  const stats = data?.stats || {};

  const kpis = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: IconTrendingUp, bg: 'bg-[#EAF4EF]', color: 'text-[#087F65]' },
    { label: 'Total Orders', value: stats.totalOrders ?? 0, icon: IconShoppingCart, bg: 'bg-[#EAF4EF]', color: 'text-[#087F65]' },
    { label: 'Customers', value: stats.totalUsers ?? 0, icon: IconUsers, bg: 'bg-[#EAF4EF]', color: 'text-[#087F65]' },
    { label: 'Live Products', value: stats.totalProducts ?? 0, icon: IconPackage, bg: 'bg-[#EAF4EF]', color: 'text-[#087F65]' },
  ];

  const pieData = (data?.statusBreakdown || []).map((s) => ({ name: s._id, value: s.count }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#202923]">Store Overview</h1>
          <p className="text-xs text-[#65716A]">Real-time sales, order fulfillment, and catalog performance</p>
        </div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="input-field w-auto !py-2 text-sm bg-white" aria-label="Time range">
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-[#E4EAE6] bg-white p-5 shadow-sm flex items-center gap-4">
            <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${k.bg} text-xl ${k.color} border border-[#DDEBE3]`}>
              <k.icon size={22} />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#65716A]">{k.label}</p>
              <p className="text-2xl font-extrabold text-[#202923] mt-0.5">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[#E4EAE6] bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 font-bold text-base text-[#202923]">Sales Revenue — Last {days} Days</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data?.salesByDay || []}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#087F65" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#087F65" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="_id" stroke="#89938D" fontSize={11} tickFormatter={(d) => d.slice(5)} />
              <YAxis stroke="#89938D" fontSize={11} tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`} />
              <Tooltip
                contentStyle={{ background: '#FFFFFF', border: '1px solid #E4EAE6', borderRadius: 8, color: '#202923' }}
                formatter={(v, name) => (name === 'revenue' ? [formatPrice(v), 'Revenue'] : [v, 'Orders'])}
              />
              <Area type="monotone" dataKey="revenue" stroke="#087F65" strokeWidth={2.5} fill="url(#rev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-[#E4EAE6] bg-white p-5 shadow-sm">
          <h2 className="mb-4 font-bold text-base text-[#202923]">Orders by Status</h2>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#FFFFFF', border: '1px solid #E4EAE6', borderRadius: 8, color: '#202923' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="py-16 text-center text-sm text-[#65716A]">No orders yet</p>}
        </div>
      </div>

      {/* Recent orders + top products + low stock */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[#E4EAE6] bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="mb-4 font-bold text-base text-[#202923]">Recent Orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase font-bold text-[#65716A] border-b border-[#E4EAE6]">
                  <th className="pb-3">Order #</th>
                  <th className="pb-3">Customer</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(data?.recentOrders || []).map((o) => (
                  <tr key={o._id} className="border-t border-[#E4EAE6]">
                    <td className="py-2.5 font-mono text-xs text-[#202923]">{o.orderNumber}<br /><span className="text-[#65716A] font-sans">{formatDate(o.createdAt)}</span></td>
                    <td className="py-2.5 text-[#202923] font-medium">{o.user?.name || '—'}</td>
                    <td className="py-2.5"><span className={`chip capitalize ${STATUS_COLORS[o.status]}`}>{o.status.replace(/-/g, ' ')}</span></td>
                    <td className="py-2.5 text-right font-bold text-[#087F65]">{formatPrice(o.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-[#E4EAE6] bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-bold text-base text-[#202923]">Top Selling Products</h2>
            <ul className="space-y-3">
              {(data?.topProducts || []).map((p) => (
                <li key={p._id} className="flex items-center gap-3">
                  <img src={imgUrl(p.images?.[0]?.url)} alt="" className="h-10 w-10 rounded-lg object-contain bg-[#F1F7F4] p-1 border border-[#E4EAE6]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#202923]">{p.name}</p>
                    <p className="text-xs text-[#65716A]">{p.sold} units sold</p>
                  </div>
                  <span className="text-sm font-bold text-[#087F65]">{formatPrice(p.price)}</span>
                </li>
              ))}
            </ul>
          </div>
          {data?.lowStock?.length > 0 && (
            <div className="rounded-xl border-l-4 border-l-[#B42318] border border-[#E4EAE6] bg-white p-5 shadow-sm">
              <h2 className="mb-2 font-bold text-sm text-[#B42318] flex items-center gap-1.5">
                <IconAlertCircle size={16} className="text-[#B42318]" /> Low Stock Alerts
              </h2>
              <ul className="space-y-2 text-sm">
                {data.lowStock.map((p) => (
                  <li key={p._id} className="flex justify-between gap-2 text-xs">
                    <span className="truncate text-[#202923]">{p.name}</span>
                    <span className="shrink-0 font-bold text-[#B42318]">{p.stock} left</span>
                  </li>
                ))}
              </ul>
              <Link to="/admin/products" className="mt-3 inline-block text-xs font-semibold text-[#087F65] hover:underline">Manage inventory →</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

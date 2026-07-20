/** Currency + misc formatting helpers (INR locale). */
export const formatPrice = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (d) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Resolve image URLs — local /uploads paths pass through the Vite proxy in dev. */
export const imgUrl = (url) => url || 'https://picsum.photos/seed/placeholder/600/600';

export const ORDER_STATUS_STEPS = ['confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered'];

export const STATUS_COLORS = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  confirmed: 'bg-blue-500/15 text-blue-400',
  processing: 'bg-indigo-500/15 text-indigo-400',
  shipped: 'bg-cyan-500/15 text-cyan-400',
  'out-for-delivery': 'bg-teal-500/15 text-teal-400',
  delivered: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-red-500/15 text-red-400',
  refunded: 'bg-purple-500/15 text-purple-400',
};

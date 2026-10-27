/** Currency + misc formatting helpers (INR locale). */
export const formatPrice = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const formatDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatDateTime = (d) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** Resolve image URLs — local /images or /uploads paths pass through the Vite proxy in dev. */
export const imgUrl = (url) => {
  if (!url) return '/images/products/nova-airbeat-pro.jpg';
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/uploads/${url}`;
};

export const ORDER_STATUS_STEPS = ['confirmed', 'processing', 'shipped', 'out-for-delivery', 'delivered'];

export const STATUS_COLORS = {
  pending: 'bg-[#F1F7F4] text-[#65716A] border border-[#E4EAE6]',
  confirmed: 'bg-[#EAF4EF] text-[#075E4B] border border-[#DDEBE3]',
  processing: 'bg-[#EAF4EF] text-[#087F65] border border-[#DDEBE3]',
  shipped: 'bg-[#EAF4EF] text-[#168764] border border-[#DDEBE3]',
  'out-for-delivery': 'bg-[#EAF4EF] text-[#075E4B] border border-[#DDEBE3]',
  delivered: 'bg-[#EAF4EF] text-[#168764] border border-[#DDEBE3] font-semibold',
  cancelled: 'bg-red-50 text-[#B42318] border border-red-200',
  refunded: 'bg-stone-100 text-[#65716A] border border-[#E4EAE6]',
};

import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiPackage, FiDownload } from 'react-icons/fi';
import useFetch from '../hooks/useFetch.js';
import api from '../api/axios.js';
import toast from 'react-hot-toast';
import { formatPrice } from '../utils/format.js';

/** Post-checkout confirmation with confetti-style entrance. */
export default function OrderSuccess() {
  const { id } = useParams();
  const { data } = useFetch(`/orders/${id}`);
  const order = data?.order;

  useEffect(() => { document.title = 'Order confirmed — FlashShop'; }, []);

  const downloadInvoice = async () => {
    try {
      const res = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order?.orderNumber || id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Could not download the invoice'); }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="card-surface w-full max-w-lg p-8 text-center"
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }}>
          <FiCheckCircle className="mx-auto text-7xl text-[#168764]" />
        </motion.div>
        <h1 className="mt-5 text-2xl font-bold text-[#202923]">Order confirmed! 🎉</h1>
        <p className="mt-2 text-sm text-[#65716A]">
          Thanks for shopping with FlashShop. A confirmation email is on its way.
        </p>
        {order && (
          <div className="mt-6 rounded-xl bg-[#F1F7F4] border border-[#E4EAE6] p-4 text-left text-sm">
            <div className="flex justify-between"><span className="text-[#65716A]">Order number</span><span className="font-mono font-semibold text-[#202923]">{order.orderNumber}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-[#65716A]">Items</span><span className="text-[#202923]">{order.items.length}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-[#65716A]">Payment</span><span className="uppercase text-[#202923]">{order.paymentMethod} · {order.paymentStatus}</span></div>
            <div className="mt-2 flex justify-between border-t border-[#E4EAE6] pt-2 font-bold text-[#202923]"><span>Total</span><span className="text-[#087F65]">{formatPrice(order.totalPrice)}</span></div>
          </div>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to={`/dashboard/orders/${id}`} className="btn-primary flex-1"><FiPackage /> Track order</Link>
          <button onClick={downloadInvoice} className="btn-outline flex-1"><FiDownload /> Invoice PDF</button>
        </div>
        <Link to="/products" className="mt-4 inline-block text-sm text-[#087F65] font-semibold hover:underline">Continue shopping →</Link>
      </motion.div>
    </div>
  );
}

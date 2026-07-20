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

  useEffect(() => { document.title = 'Order confirmed — LUXORA'; }, []);

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
          <FiCheckCircle className="mx-auto text-7xl text-green-400" />
        </motion.div>
        <h1 className="mt-5 text-2xl font-bold">Order confirmed! 🎉</h1>
        <p className="mt-2 text-sm text-slate-400">
          Thanks for shopping with LUXORA. A confirmation email is on its way.
        </p>
        {order && (
          <div className="mt-6 rounded-xl bg-night/60 p-4 text-left text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Order number</span><span className="font-mono font-semibold">{order.orderNumber}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-slate-400">Items</span><span>{order.items.length}</span></div>
            <div className="mt-2 flex justify-between"><span className="text-slate-400">Payment</span><span className="uppercase">{order.paymentMethod} · {order.paymentStatus}</span></div>
            <div className="mt-2 flex justify-between border-t border-white/10 pt-2 font-bold"><span>Total</span><span className="text-secondary-400">{formatPrice(order.totalPrice)}</span></div>
          </div>
        )}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link to={`/dashboard/orders/${id}`} className="btn-primary flex-1"><FiPackage /> Track order</Link>
          <button onClick={downloadInvoice} className="btn-outline flex-1"><FiDownload /> Invoice PDF</button>
        </div>
        <Link to="/products" className="mt-4 inline-block text-sm text-primary-300 hover:underline">Continue shopping →</Link>
      </motion.div>
    </div>
  );
}

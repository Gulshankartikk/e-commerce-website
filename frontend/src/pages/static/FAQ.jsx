import { useEffect, useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';
import { AnimatePresence, motion } from 'framer-motion';
import Breadcrumbs from '../../components/ui/Breadcrumbs.jsx';

const FAQS = [
  { q: 'How long does delivery take?', a: 'Standard delivery takes 4–6 business days across India. Express delivery (1–2 business days) is available at checkout for ₹99. Orders above ₹999 always ship free with the standard option.' },
  { q: 'What payment methods do you accept?', a: 'We accept UPI, credit/debit cards, netbanking and wallets via Razorpay, international cards via Stripe, and Cash on Delivery on all orders.' },
  { q: 'How do I track my order?', a: 'Go to My Account → My Orders and open any order to see its live status timeline — from confirmation to delivery. You will also receive email updates at each stage.' },
  { q: 'What is the return policy?', a: 'Most items can be returned within 7 days of delivery, unused and in original packaging, for a full refund. Doorstep pickup is free. See our Return Policy page for exclusions.' },
  { q: 'How do coupons work?', a: 'Enter a coupon code in the cart before checkout. Discounts apply to the item subtotal; some coupons have minimum order values or caps, which are shown when applied.' },
  { q: 'Is Cash on Delivery available everywhere?', a: 'COD is available on nearly all pincodes we serve. If COD is unavailable for your address, checkout will show only prepaid options.' },
  { q: 'How do I cancel an order?', a: 'Orders can be cancelled from My Orders any time before they are shipped. Prepaid amounts are refunded to the original payment method within 5–7 business days.' },
  { q: 'Are the products genuine?', a: 'Yes — we source directly from brands and authorized distributors only. Every product is backed by its standard manufacturer warranty where applicable.' },
];

/** FAQ accordion. */
export default function FAQ() {
  const [open, setOpen] = useState(0);
  useEffect(() => { document.title = 'FAQ — FlashShop'; }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Breadcrumbs items={[{ label: 'FAQ' }]} />
      <h1 className="section-title mb-8">Frequently asked questions</h1>
      <div className="space-y-3">
        {FAQS.map((f, i) => (
          <div key={i} className="card-surface overflow-hidden">
            <button onClick={() => setOpen(open === i ? -1 : i)} className="flex w-full items-center justify-between p-5 text-left font-semibold" aria-expanded={open === i}>
              {f.q}
              <FiChevronDown className={`shrink-0 transition-transform ${open === i ? 'rotate-180 text-primary-300' : ''}`} />
            </button>
            <AnimatePresence>
              {open === i && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

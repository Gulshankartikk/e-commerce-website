import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiShoppingBag, FiCheckCircle } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import { setAiDrawer } from '../../features/uiSlice.js';
import { addToCart } from '../../features/cartSlice.js';
import toast from 'react-hot-toast';
import { formatPrice, imgUrl } from '../../utils/format.js';

/** Wide mint-green promotional section showcasing the AI Shopping Copilot and real electronics offers. */
export default function AIFeatureShowcase({ featuredProducts = [] }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activePrompt] = useState('Show me earbuds under ₹5,000');

  // Preview products for the interactive mockup
  const previewProducts =
    featuredProducts.length >= 2
      ? featuredProducts.slice(0, 2)
      : [
          {
            _id: 'sample-earbuds',
            name: 'Nova AirBeat Pro Earbuds',
            slug: 'nova-airbeat-pro-wireless-earbuds',
            price: 4999,
            mrp: 7999,
            image: '/images/products/nova-airbeat-pro.jpg',
          },
          {
            _id: 'sample-watch',
            name: 'Pulse Vitals X2 Watch',
            slug: 'pulse-vitals-x2-smartwatch',
            price: 6499,
            mrp: 8999,
            image: '/images/products/pulse-vitals-x2.jpg',
          },
        ];

  const handleQuickAdd = async (e, p) => {
    e.stopPropagation();
    if (p._id && !p._id.startsWith('sample')) {
      try {
        await dispatch(addToCart({ productId: p._id, quantity: 1 })).unwrap();
        toast.success(`${p.name} added to cart!`);
      } catch (err) {
        toast.error(err || 'Failed to add to cart');
      }
    } else {
      toast.success(`${p.name} added to cart!`);
    }
  };

  const openAssistantWith = (query) => {
    dispatch(setAiDrawer({ open: true, query }));
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#EAF4EF] via-[#F1F7F4] to-[#EAF4EF] border border-[#E4EAE6] p-8 sm:p-12">
        {/* Soft mint ambient blur */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-80 w-80 rounded-full bg-[#DDEBE3]/70 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Heading, Supporting Text & CTAs */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#DDEBE3] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#075E4B]">
              <span className="flex h-2 w-2 rounded-full bg-[#087F65]" />
              <span>AI SHOPPING COPILOT</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#202923] leading-[1.15]">
              Visual product discovery <br className="hidden sm:inline" />
              <span className="text-[#087F65]">shoppers can act on.</span>
            </h2>

            <p className="text-base sm:text-lg text-[#65716A] max-w-xl leading-relaxed">
              Ask questions about return policies, technical specs, or warranty terms. The copilot searches our live catalog, retrieves verified citations, and lets you add items directly to your cart.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4EAE6] bg-white px-3.5 py-2 text-xs font-bold text-[#202923] shadow-sm">
                <FiCheckCircle className="text-[#087F65]" />
                Live Catalog Grounding
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4EAE6] bg-white px-3.5 py-2 text-xs font-bold text-[#202923] shadow-sm">
                <FiCheckCircle className="text-[#087F65]" />
                Verified Citations
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4EAE6] bg-white px-3.5 py-2 text-xs font-bold text-[#202923] shadow-sm">
                <FiCheckCircle className="text-[#087F65]" />
                One-Click Add to Cart
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => openAssistantWith(activePrompt)}
                className="btn-primary !px-7 !py-3.5 text-sm font-semibold shadow-[0_4px_16px_rgba(8,127,101,0.25)] hover:shadow-[0_6px_20px_rgba(8,127,101,0.35)]"
              >
                <span>Try Store Assistant</span>
                <FiArrowUpRight className="text-base" />
              </button>
              <button
                onClick={() => navigate('/products')}
                className="btn-outline !px-6 !py-3.5 text-sm font-semibold"
              >
                Explore Full Catalog
              </button>
            </div>
          </div>

          {/* Right Column: Realistic Browser Mockup Preview */}
          <div className="lg:col-span-6 relative">
            <div className="rounded-2xl border border-[#E4EAE6] bg-white shadow-[0_12px_36px_rgba(21,61,43,0.08)] overflow-hidden">
              {/* Window Controls Bar */}
              <div className="flex items-center gap-2 border-b border-[#E4EAE6] bg-[#F1F7F4] px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E4EAE6]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E4EAE6]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E4EAE6]" />
                </div>
                <div className="mx-auto rounded-full bg-white border border-[#E4EAE6] px-4 py-0.5 text-[11px] font-medium text-[#65716A]">
                  flashshop.com/assistant
                </div>
              </div>

              {/* Window Content */}
              <div className="p-4 sm:p-5 bg-[#F1F7F4]/40">
                {/* Floating Assistant Card */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  onClick={() => openAssistantWith(activePrompt)}
                  className="rounded-xl bg-white border border-[#E4EAE6] shadow-sm overflow-hidden cursor-pointer hover:border-[#087F65]/50 transition-all"
                >
                  {/* Deep Emerald Header */}
                  <div className="bg-[#075E4B] p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                          <BsStars className="text-sm text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">FlashShop Copilot</h4>
                          <p className="text-[11px] text-[#DDEBE3]">Grounded in store inventory</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#087F65] px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                        Active
                      </span>
                    </div>
                  </div>

                  {/* Body with Query & Product Cards */}
                  <div className="p-4 space-y-3">
                    {/* User Message */}
                    <div className="flex justify-end">
                      <div className="rounded-xl bg-[#087F65] px-3.5 py-2 text-xs font-semibold text-white max-w-[80%]">
                        {activePrompt}
                      </div>
                    </div>

                    {/* Copilot Response */}
                    <div className="space-y-2">
                      <p className="text-xs text-[#202923] leading-relaxed">
                        Here are top-rated wireless earbuds matching your budget under ₹5,000, backed by our 7-day return policy [1]:
                      </p>

                      {/* Verified Citation Pill */}
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF4EF] border border-[#DDEBE3] px-2.5 py-1 text-[11px] font-semibold text-[#075E4B]">
                        <span>[1]</span>
                        <span>Return & Refund Policy (Verified)</span>
                      </div>

                      {/* Mini Product Cards */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {previewProducts.map((p) => (
                          <div
                            key={p._id}
                            className="rounded-lg border border-[#E4EAE6] bg-[#F1F7F4] p-2.5 transition-all hover:border-[#087F65]"
                          >
                            <img
                              src={imgUrl(p.image?.url || p.image)}
                              alt={p.name}
                              className="h-20 w-full rounded-md object-contain bg-white"
                            />
                            <p className="mt-1.5 line-clamp-1 text-xs font-bold text-[#202923]">{p.name}</p>
                            <p className="text-xs font-bold text-[#087F65]">{formatPrice(p.price)}</p>
                            <button
                              onClick={(e) => handleQuickAdd(e, p)}
                              className="mt-2 flex w-full items-center justify-center gap-1 rounded bg-[#087F65] py-1 text-[11px] font-bold text-white hover:bg-[#066B55]"
                            >
                              <FiShoppingBag className="text-xs" /> Add
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiShoppingBag, FiCheckCircle } from 'react-icons/fi';
import { BsStars } from 'react-icons/bs';
import { setAiDrawer } from '../../features/uiSlice.js';
import { addToCart } from '../../features/cartSlice.js';
import toast from 'react-hot-toast';

export default function AIFeatureShowcase({ featuredProducts = [] }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [activePrompt, setActivePrompt] = useState('Show me earbuds under ₹5,000');

  // Preview products for the interactive mockup
  const previewProducts = featuredProducts.length >= 2 ? featuredProducts.slice(0, 2) : [
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
    <section className="relative overflow-hidden py-16 lg:py-24 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 h-96 w-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 h-80 w-80 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headline & Copilot Highlights */}
          <div className="lg:col-span-6 space-y-6">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2.5 rounded-full border border-purple-500/30 bg-purple-950/40 px-4 py-1.5 text-xs font-semibold text-purple-300 backdrop-blur shadow-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI shopping copilot for FlashShop</span>
            </div>

            <p className="text-xs font-black uppercase tracking-widest text-purple-400">
              FLASHSHOP COPILOT
            </p>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.08]">
              Visual product recommendations <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-purple-400 via-rose-400 to-amber-300 bg-clip-text text-transparent">
                shoppers can act on.
              </span>
            </h2>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              The agent searches the catalog, returns rich product cards, and lets shoppers add items without leaving the conversation.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-750 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-sm">
                <FiCheckCircle className="text-purple-400" />
                Product cards
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-750 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-sm">
                <FiCheckCircle className="text-purple-400" />
                Variants
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-slate-750 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-sm">
                <FiCheckCircle className="text-purple-400" />
                Add to cart
              </span>
            </div>

            {/* Call to action button */}
            <div className="pt-4 flex flex-wrap items-center gap-3">
              <button
                onClick={() => openAssistantWith('Show me earbuds under ₹5,000')}
                className="flex items-center gap-2 rounded-full bg-[#703080] hover:bg-[#5b1e6d] px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-purple-950/50 hover:shadow-purple-600/30 transition-all group"
              >
                <span>Try Store Assistant</span>
                <FiArrowUpRight className="text-base group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>
              <button
                onClick={() => navigate('/products')}
                className="rounded-full border border-slate-700 bg-slate-800/40 hover:bg-slate-800 px-6 py-3.5 text-sm font-semibold text-slate-300 transition-colors"
              >
                Explore Full Catalog
              </button>
            </div>
          </div>

          {/* Right Column: Realistic Browser Mockup Preview */}
          <div className="lg:col-span-6 relative">
            {/* Outer Browser Window */}
            <div className="rounded-3xl border border-slate-750 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-xl">
              {/* Window Controls Bar */}
              <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950/80 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-rose-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                </div>
                <div className="mx-auto rounded-full bg-slate-800/80 px-4 py-1 text-[11px] font-medium text-slate-400">
                  flashshop.shop/catalog
                </div>
              </div>

              {/* Window Canvas */}
              <div className="p-4 sm:p-6 bg-slate-950/40 relative min-h-[460px] flex items-center justify-center">
                {/* Background Store Content (subtle preview) */}
                <div className="absolute inset-0 p-5 opacity-25 pointer-events-none select-none">
                  <h3 className="text-xl font-bold text-white">FlashShop Curated</h3>
                  <div className="mt-3 rounded-2xl bg-slate-800 p-4">
                    <p className="text-base font-bold text-white">Built for faster product discovery.</p>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="h-24 rounded-xl bg-slate-800/60" />
                    <div className="h-24 rounded-xl bg-slate-800/60" />
                  </div>
                </div>

                {/* The Floating Store Shopping Assistant Card (matches user screenshot) */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  onClick={() => openAssistantWith(activePrompt)}
                  className="relative z-10 w-full max-w-[390px] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden cursor-pointer group"
                >
                  {/* Purple Header */}
                  <div className="bg-[#703080] p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BsStars className="text-lg text-amber-300" />
                        <h4 className="font-bold text-sm">Store Shopping Assistant</h4>
                      </div>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
                        Gemini 2.5
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-purple-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Online & Ready</span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3.5 bg-slate-50 dark:bg-slate-900">
                    {/* User Prompt Bubble */}
                    <div className="flex justify-end">
                      <div className="rounded-2xl rounded-tr-xs bg-[#703080] text-white px-3.5 py-2 text-xs font-medium shadow-sm max-w-[85%]">
                        {activePrompt}
                      </div>
                    </div>

                    {/* Assistant Message Bubble */}
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-tl-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/80 px-3.5 py-2.5 text-xs leading-relaxed shadow-sm max-w-[92%]">
                        Here are the strongest matches. You can compare variants, add to cart, or ask a follow-up.
                      </div>
                    </div>

                    {/* Recommended Products Container */}
                    <div className="rounded-2xl bg-white dark:bg-slate-850 p-3.5 border border-slate-200 dark:border-slate-750 shadow-sm space-y-2.5">
                      <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 tracking-wide">
                        Recommended Products
                      </p>

                      <div className="grid grid-cols-2 gap-2.5">
                        {previewProducts.map((p, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-slate-150 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/40 p-2 text-center transition-all hover:border-purple-400/50"
                          >
                            <div className="h-20 w-full rounded-lg bg-[#edf2f7] dark:bg-slate-800 flex items-center justify-center p-1 overflow-hidden">
                              <img
                                src={p.image || p.images?.[0]?.url || '/images/products/nova-airbeat-pro.jpg'}
                                alt={p.name}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <p className="mt-1.5 text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {p.name}
                            </p>
                            <p className="text-xs font-black text-[#703080] dark:text-purple-300">
                              ₹{p.price.toLocaleString('en-IN')}
                            </p>
                            <button
                              onClick={(e) => handleQuickAdd(e, p)}
                              className="mt-1.5 w-full rounded-md bg-[#703080] hover:bg-[#5b1e6d] py-1 text-[10px] font-bold text-white transition-colors flex items-center justify-center gap-1"
                            >
                              <FiShoppingBag className="text-[9px]" /> Add to cart
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Pill Input & Purple Circle Arrow */}
                    <div className="pt-1 flex items-center gap-2">
                      <div className="flex-1 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs text-slate-400 shadow-inner">
                        Ask a question or search products
                      </div>
                      <button
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-[#703080] text-white shadow-md group-hover:scale-105 transition-transform"
                      >
                        <FiArrowUpRight className="text-base" />
                      </button>
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

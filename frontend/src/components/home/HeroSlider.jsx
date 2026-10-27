import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconArrowRight, IconTruck, IconShieldCheck, IconPhone, IconCheck } from '../ui/icons.jsx';
import { imgUrl } from '../../utils/format.js';

/** Wide light-mint hero section matching the reference design. */
export default function HeroSlider({ banners, loading }) {
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="skeleton h-[420px] w-full rounded-2xl md:h-[480px]" />
      </div>
    );
  }

  // Active banner or canonical default electronics hero
  const banner = banners?.[0] || {
    title: "Technology within everyone's reach",
    subtitle: "Discover the latest electronics, smart devices, and accessories at prices you'll love.",
    link: '/products',
    ctaText: 'Discover products',
    image: { url: '/images/products/nova-airbeat-pro.jpg' },
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EAF4EF] via-[#F1F7F4] to-[#EAF4EF] border border-[#E4EAE6]">
        {/* Soft background ambient glow */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[#DDEBE3]/60 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-[#EAF4EF] blur-3xl pointer-events-none" />

        <div className="relative z-10 grid items-center gap-8 px-6 py-10 sm:px-10 md:grid-cols-12 md:py-16 lg:px-16">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="space-y-6 md:col-span-7">
            {/* Small green promotional badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-[#DDEBE3] px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[#075E4B]">
              <span className="flex h-2 w-2 rounded-full bg-[#087F65]" />
              <span>PREMIUM ELECTRONICS SALE</span>
            </div>

            {/* Large dark green headline */}
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-[#202923] sm:text-4xl lg:text-5xl leading-[1.12]">
              {banner.title || "Technology within everyone's reach"}
            </h1>

            {/* Short description */}
            <p className="max-w-xl text-base sm:text-lg text-[#65716A] leading-relaxed">
              {banner.subtitle || "Discover the latest electronics, smart devices, and accessories at prices you'll love."}
            </p>

            {/* Green CTA Button */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                to={banner.link || '/products'}
                className="btn-primary !px-7 !py-3.5 text-base font-semibold shadow-[0_4px_16px_rgba(8,127,101,0.25)] hover:shadow-[0_6px_20px_rgba(8,127,101,0.35)]"
              >
                <span>{banner.ctaText || 'Discover products'}</span>
                <IconArrowRight size={18} />
              </Link>
              <Link
                to="/products?featured=true"
                className="btn-outline !px-6 !py-3.5 text-base font-semibold"
              >
                View Best Sellers
              </Link>
            </div>

            {/* Value Highlights beneath CTA */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-[#E4EAE6]/80">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DDEBE3] text-[#075E4B]">
                  <IconTruck size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#202923]">Free Shipping</p>
                  <p className="text-[11px] text-[#65716A]">Orders over ₹999</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DDEBE3] text-[#075E4B]">
                  <IconShieldCheck size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#202923]">1-Year Warranty</p>
                  <p className="text-[11px] text-[#65716A]">100% Genuine gear</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#DDEBE3] text-[#075E4B]">
                  <IconPhone size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#202923]">24/7 Support</p>
                  <p className="text-[11px] text-[#65716A]">AI Copilot & agents</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: High-quality Electronics Imagery */}
          <div className="relative md:col-span-5 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative w-full max-w-[380px]"
            >
              <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-[0_8px_30px_rgba(21,61,43,0.08)] border border-[#E4EAE6]">
                <img
                  src={imgUrl(banner.image?.url) || '/images/products/nova-airbeat-pro.jpg'}
                  alt={banner.title || 'Featured Electronics'}
                  className="aspect-square w-full rounded-xl object-cover bg-[#F1F7F4]"
                />
              </div>

              {/* Floating verified badge */}
              <div className="absolute -bottom-4 -left-4 rounded-xl bg-white p-3 shadow-lg border border-[#E4EAE6] flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF4EF] text-[#087F65]">
                  <IconCheck size={20} />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#202923]">Verified Authentic</p>
                  <p className="text-[11px] text-[#65716A]">Direct from manufacturer</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

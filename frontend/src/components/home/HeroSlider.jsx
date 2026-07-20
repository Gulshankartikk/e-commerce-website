import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { imgUrl } from '../../utils/format.js';

/** Full-width autoplay hero with gradient overlays and animated copy. */
export default function HeroSlider({ banners, loading }) {
  if (loading) return <div className="skeleton mx-auto h-[420px] max-w-7xl rounded-none md:h-[520px]" />;

  const slides = banners?.length ? banners : [
    { _id: 'default', title: 'Premium picks. Honest prices.', subtitle: 'Electronics, fashion and home — curated for you', image: { url: 'https://picsum.photos/seed/hero-default/1600/700' }, link: '/products', ctaText: 'Shop Now' },
  ];

  return (
    <section className="relative bg-hero-radial">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        effect="fade"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={slides.length > 1}
        className="h-[420px] md:h-[520px]"
      >
        {slides.map((b) => (
          <SwiperSlide key={b._id}>
            <div className="relative h-full w-full">
              <img src={imgUrl(b.image?.url)} alt={b.title} className="h-full w-full object-cover" />
              {/* Readability gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-night via-night/70 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="mx-auto w-full max-w-7xl px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="max-w-xl"
                  >
                    <span className="chip glass mb-4 text-secondary-400">✦ LUXORA EXCLUSIVE</span>
                    <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-6xl">{b.title}</h1>
                    {b.subtitle && <p className="mt-4 text-base text-slate-300 md:text-lg">{b.subtitle}</p>}
                    <Link to={b.link || '/products'} className="btn-primary mt-7 !px-8 !py-3.5 text-base">
                      {b.ctaText || 'Shop Now'} <FiArrowRight />
                    </Link>
                  </motion.div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

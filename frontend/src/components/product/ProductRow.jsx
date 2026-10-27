import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, FreeMode } from 'swiper/modules';
import { FiArrowRight } from 'react-icons/fi';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import ProductCard from './ProductCard.jsx';
import { ProductCardSkeleton } from '../ui/Skeletons.jsx';

/** Horizontal product carousel matching the clean mint reference style. */
export default function ProductRow({ title, subtitle, products, loading, viewAllLink, accent }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="section-title text-[#202923]">
            {accent ? <span className="text-[#075E4B]">{title}</span> : title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-[#65716A]">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link
            to={viewAllLink}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#087F65] transition-colors hover:text-[#066B55]"
          >
            <span>View all</span>
            <FiArrowRight className="text-base" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : (
        <Swiper
          modules={[Navigation, FreeMode]}
          navigation
          freeMode
          spaceBetween={16}
          slidesPerView={2}
          breakpoints={{ 640: { slidesPerView: 3 }, 1024: { slidesPerView: 4 } }}
          className="!pb-2"
        >
          {(products || []).map((p) => (
            <SwiperSlide key={p._id} className="h-auto">
              <ProductCard product={p} />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </section>
  );
}

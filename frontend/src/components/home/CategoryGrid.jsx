import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { imgUrl } from '../../utils/format.js';

/** Shop by Category section matching the clean mint reference style. */
export default function CategoryGrid({ categories, loading }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="section-title">Shop by Category</h2>
          <p className="mt-1 text-sm text-[#65716A]">Explore our top electronic devices, wearables, and audio gear</p>
        </div>
        <Link
          to="/products"
          className="text-sm font-semibold text-[#087F65] hover:text-[#066B55] transition-colors"
        >
          All categories →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[4/3] rounded-xl" />
            ))
          : (categories || []).map((cat, i) => (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/products?category=${cat._id}`}
                  className="group block rounded-xl border border-[#E4EAE6] bg-[#F1F7F4] p-4 text-center transition-all duration-200 hover:border-[#087F65] hover:bg-[#EAF4EF] hover:shadow-[0_4px_16px_rgba(21,61,43,0.06)]"
                >
                  <div className="mx-auto mb-3 flex h-28 w-28 items-center justify-center overflow-hidden rounded-xl bg-white p-2 border border-[#E4EAE6]/60">
                    <img
                      src={imgUrl(cat.image?.url)}
                      alt={cat.name}
                      loading="lazy"
                      className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <h3 className="font-display text-sm font-bold text-[#202923] group-hover:text-[#087F65] transition-colors">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="mt-0.5 text-xs text-[#65716A] line-clamp-1">
                      {cat.description}
                    </p>
                  )}
                </Link>
              </motion.div>
            ))}
      </div>
    </section>
  );
}

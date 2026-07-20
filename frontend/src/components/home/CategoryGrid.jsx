import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { imgUrl } from '../../utils/format.js';

/** Category tiles with hover zoom. */
export default function CategoryGrid({ categories, loading }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="section-title mb-6">Shop by category</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton aspect-[3/2]" />)
          : (categories || []).map((cat, i) => (
              <motion.div
                key={cat._id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <Link to={`/products?category=${cat._id}`} className="group relative block aspect-[3/2] overflow-hidden rounded-2xl">
                  <img src={imgUrl(cat.image?.url)} alt={cat.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/20 to-transparent" />
                  <div className="absolute bottom-0 p-4">
                    <h3 className="font-display text-lg font-bold">{cat.name}</h3>
                    <p className="text-xs text-slate-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">{cat.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
      </div>
    </section>
  );
}

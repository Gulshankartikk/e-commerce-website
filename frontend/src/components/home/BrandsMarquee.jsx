import { Link } from 'react-router-dom';
import { imgUrl } from '../../utils/format.js';

/** Infinite marquee of brand logos. */
export default function BrandsMarquee({ brands }) {
  if (!brands?.length) return null;
  const doubled = [...brands, ...brands]; // seamless loop
  return (
    <section className="overflow-hidden border-y border-white/5 bg-card/40 py-8">
      <div className="flex w-max animate-marquee gap-12 hover:[animation-play-state:paused]">
        {doubled.map((b, i) => (
          <Link key={`${b._id}-${i}`} to={`/products?brand=${b._id}`} className="flex items-center gap-3 opacity-60 transition-opacity hover:opacity-100">
            <img src={imgUrl(b.logo?.url)} alt={b.name} loading="lazy" className="h-10 w-10 rounded-full object-cover" />
            <span className="font-display text-lg font-semibold text-slate-300">{b.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

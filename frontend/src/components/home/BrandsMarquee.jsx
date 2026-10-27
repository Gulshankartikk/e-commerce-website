import { Link } from 'react-router-dom';
import { imgUrl } from '../../utils/format.js';

/** Infinite marquee of brand logos styled in clean soft mint. */
export default function BrandsMarquee({ brands }) {
  if (!brands?.length) return null;
  const doubled = [...brands, ...brands]; // seamless loop
  return (
    <section className="overflow-hidden border-y border-[#E4EAE6] bg-[#F1F7F4] py-8">
      <div className="flex w-max animate-marquee gap-14 hover:[animation-play-state:paused]">
        {doubled.map((b, i) => (
          <Link
            key={`${b._id}-${i}`}
            to={`/products?brand=${b._id}`}
            className="flex items-center gap-3 opacity-70 transition-all hover:opacity-100 hover:text-[#087F65]"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#E4EAE6] p-1 shadow-sm">
              <img src={imgUrl(b.logo?.url)} alt={b.name} loading="lazy" className="h-full w-full rounded-full object-contain" />
            </div>
            <span className="font-display text-base font-bold text-[#202923]">{b.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import Rating from '../ui/Rating.jsx';

/* Storefront social proof — static curated quotes. */
const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Bengaluru', rating: 5, text: 'Ordered earbuds during the flash sale — delivered in two days, sealed and authentic. The order tracking is the best I have used on any Indian store.' },
  { name: 'Arjun Mehta', city: 'Mumbai', rating: 5, text: 'The product pages are refreshingly honest: real photos, clear specs, verified reviews. Bought a soundbar and it matched the description exactly.' },
  { name: 'Sneha Iyer', city: 'Chennai', rating: 4, text: 'Returned a hoodie that ran small — pickup was arranged the next morning and the refund hit my account in three days. Zero drama.' },
  { name: 'Rohan Gupta', city: 'Delhi', rating: 5, text: 'Customer support actually answers. Got sizing advice on chat before ordering running shoes, and they were spot on.' },
];

/** Auto-scrolling customer review carousel. */
export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10">
      <h2 className="section-title mb-6">What customers say</h2>
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 4000 }}
        loop
        spaceBetween={16}
        slidesPerView={1}
        breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
      >
        {TESTIMONIALS.map((t) => (
          <SwiperSlide key={t.name}>
            <figure className="card-surface h-full p-6">
              <Rating value={t.rating} />
              <blockquote className="mt-3 text-sm leading-relaxed text-slate-300">“{t.text}”</blockquote>
              <figcaption className="mt-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary-500 font-bold text-white">{t.name[0]}</span>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.city}</p>
                </div>
              </figcaption>
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

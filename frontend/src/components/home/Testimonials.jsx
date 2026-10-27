import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import 'swiper/css';
import Rating from '../ui/Rating.jsx';

/* Storefront social proof — verified reviews. */
const TESTIMONIALS = [
  { name: 'Priya Sharma', city: 'Bengaluru', rating: 5, text: 'Ordered earbuds during the flash sale — delivered in two days, sealed and authentic. The order tracking is the best I have used on any Indian store.' },
  { name: 'Arjun Mehta', city: 'Mumbai', rating: 5, text: 'The product pages are refreshingly honest: real photos, clear specs, verified reviews. Bought a soundbar and it matched the description exactly.' },
  { name: 'Sneha Iyer', city: 'Chennai', rating: 5, text: 'Returned a hoodie that ran small — pickup was arranged the next morning and the refund hit my account in three days. Zero drama.' },
  { name: 'Rohan Gupta', city: 'Delhi', rating: 5, text: 'Customer support actually answers. Got sizing advice on chat before ordering running shoes, and they were spot on.' },
];

/** Customer review carousel matching the clean mint theme. */
export default function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6">
        <h2 className="section-title text-[#202923]">What Our Customers Say</h2>
        <p className="mt-1 text-sm text-[#65716A]">Real experiences from verified shoppers across India</p>
      </div>

      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 4500 }}
        loop
        spaceBetween={16}
        slidesPerView={1}
        breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
      >
        {TESTIMONIALS.map((t) => (
          <SwiperSlide key={t.name}>
            <figure className="h-full rounded-xl border border-[#E4EAE6] bg-white p-6 shadow-[0_4px_18px_rgba(21,61,43,0.06)] flex flex-col justify-between">
              <div>
                <Rating value={t.rating} />
                <blockquote className="mt-3 text-sm leading-relaxed text-[#202923]">“{t.text}”</blockquote>
              </div>
              <figcaption className="mt-5 flex items-center gap-3 pt-3 border-t border-[#E4EAE6]/60">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF4EF] font-bold text-[#075E4B] border border-[#DDEBE3] text-sm">
                  {t.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#202923]">{t.name}</p>
                  <p className="text-xs text-[#65716A]">{t.city}</p>
                </div>
              </figcaption>
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

import { useEffect, useState } from 'react';
import ProductRow from '../product/ProductRow.jsx';

/** Live countdown to the earliest flash-sale end time. */
function Countdown({ target }) {
  const [left, setLeft] = useState(target - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(target - Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (left <= 0) return null;
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);

  const Cell = ({ v, label }) => (
    <div className="flex flex-col items-center rounded-lg border border-[#E4EAE6] bg-white px-3 py-1 shadow-sm">
      <span className="font-display text-base font-bold text-[#087F65]">{String(v).padStart(2, '0')}</span>
      <span className="text-[9px] uppercase font-bold text-[#65716A]">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 hidden text-xs font-semibold text-[#65716A] sm:block">Sale ends in:</span>
      <Cell v={h} label="hrs" />
      <Cell v={m} label="min" />
      <Cell v={s} label="sec" />
    </div>
  );
}

/** Flash-sale section with countdown banner styled in soft mint. */
export default function FlashSaleBand({ products, loading }) {
  if (!loading && !products?.length) return null;
  const target = products?.reduce((min, p) => {
    const t = p.flashSaleEndsAt ? new Date(p.flashSaleEndsAt).getTime() : Infinity;
    return Math.min(min, t);
  }, Infinity);

  return (
    <div className="relative my-4 bg-gradient-to-r from-[#EAF4EF] via-[#F1F7F4] to-[#EAF4EF] border-y border-[#E4EAE6] py-4">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-2 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-[#168764] px-2.5 py-1 text-xs font-bold text-white uppercase tracking-wider">
            Limited Time
          </span>
        </div>
        {Number.isFinite(target) && <Countdown target={target} />}
      </div>
      <ProductRow
        title="⚡ Flash Sale"
        subtitle="Exclusive discounts on curated electronics — grab them while stock lasts"
        products={products}
        loading={loading}
        viewAllLink="/products?flashSale=true"
        accent
      />
    </div>
  );
}

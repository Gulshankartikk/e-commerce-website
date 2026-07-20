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
  const h = Math.floor(left / 3600000), m = Math.floor((left % 3600000) / 60000), s = Math.floor((left % 60000) / 1000);
  const Cell = ({ v, label }) => (
    <div className="glass flex flex-col items-center rounded-xl px-3 py-1.5">
      <span className="font-display text-lg font-bold text-accent">{String(v).padStart(2, '0')}</span>
      <span className="text-[10px] uppercase text-slate-400">{label}</span>
    </div>
  );
  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 hidden text-sm text-slate-400 sm:block">Ends in</span>
      <Cell v={h} label="hrs" /><Cell v={m} label="min" /><Cell v={s} label="sec" />
    </div>
  );
}

/** Flash-sale section with countdown banner. */
export default function FlashSaleBand({ products, loading }) {
  if (!loading && !products?.length) return null;
  const target = products?.reduce((min, p) => {
    const t = p.flashSaleEndsAt ? new Date(p.flashSaleEndsAt).getTime() : Infinity;
    return Math.min(min, t);
  }, Infinity);

  return (
    <div className="relative bg-gradient-to-r from-accent/10 via-transparent to-primary/10">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 pt-8">
        <div />
        {Number.isFinite(target) && <Countdown target={target} />}
      </div>
      <ProductRow
        title="⚡ Flash Sale"
        subtitle="Steep discounts, tiny window — grab them while stock lasts"
        products={products}
        loading={loading}
        viewAllLink="/products?flashSale=true"
        accent
      />
    </div>
  );
}

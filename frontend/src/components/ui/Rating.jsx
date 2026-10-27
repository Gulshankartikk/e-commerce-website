import { LuStar } from 'react-icons/lu';

/** Read-only star rating display using consistent Lucide outline stars. */
export default function Rating({ value = 0, count, size = 'text-sm' }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const isFilled = value >= i - 0.25;
    stars.push(
      <LuStar
        key={i}
        size={14}
        strokeWidth={1.75}
        className={isFilled ? 'fill-[#168764] text-[#168764]' : 'fill-none text-[#E4EAE6]'}
        aria-hidden="true"
      />
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 ${size}`} aria-label={`Rating: ${value} out of 5 stars`}>
      <span className="flex items-center gap-0.5">{stars}</span>
      {count !== undefined && <span className="text-xs text-[#89938D]">({count})</span>}
    </span>
  );
}

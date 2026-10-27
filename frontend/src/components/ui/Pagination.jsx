import { IconChevronLeft, IconChevronRight } from './icons.jsx';

/** Numbered pagination with prev/next using outline icons. */
export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const nums = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) nums.push(i);
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className="btn-outline !px-3 !py-2 disabled:opacity-40" aria-label="Previous page">
        <IconChevronLeft size={18} />
      </button>
      {nums.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`h-10 w-10 rounded-xl font-semibold transition-all ${n === page ? 'bg-[#087F65] text-white shadow-sm' : 'border border-[#E4EAE6] text-[#202923] hover:border-[#087F65] hover:text-[#087F65] hover:bg-[#EAF4EF]'}`}
        >
          {n}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} className="btn-outline !px-3 !py-2 disabled:opacity-40" aria-label="Next page">
        <IconChevronRight size={18} />
      </button>
    </div>
  );
}

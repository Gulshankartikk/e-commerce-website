import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/** Numbered pagination with prev/next. */
export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const nums = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, start + 4);
  for (let i = start; i <= end; i++) nums.push(i);
  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1} className="btn-outline !px-3 !py-2" aria-label="Previous page">
        <FiChevronLeft />
      </button>
      {nums.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
          className={`h-10 w-10 rounded-xl font-semibold transition-all ${n === page ? 'bg-primary text-white shadow-glow' : 'border border-slate-600 hover:border-primary'}`}
        >
          {n}
        </button>
      ))}
      <button onClick={() => onChange(page + 1)} disabled={page >= pages} className="btn-outline !px-3 !py-2" aria-label="Next page">
        <FiChevronRight />
      </button>
    </div>
  );
}

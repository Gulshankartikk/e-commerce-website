import { useState } from 'react';
import { LuStar } from 'react-icons/lu';

/** Interactive star selector for review forms using consistent Lucide outline stars. */
export default function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5 text-2xl">
      {[1, 2, 3, 4, 5].map((i) => {
        const active = (hover || value) >= i;
        return (
          <button
            key={i}
            type="button"
            aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(i)}
            className="p-1 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#087F65] rounded-md"
          >
            <LuStar
              size={24}
              strokeWidth={1.75}
              className={`transition-colors ${active ? 'fill-[#168764] text-[#168764]' : 'fill-none text-[#E4EAE6]'}`}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

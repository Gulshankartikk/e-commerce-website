import { useState } from 'react';
import { FaStar } from 'react-icons/fa';

/** Interactive star selector for review forms. */
export default function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 text-2xl">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}
          className={`transition-transform hover:scale-110 ${(hover || value) >= i ? 'text-amber-400' : 'text-slate-600'}`}
        >
          <FaStar />
        </button>
      ))}
    </div>
  );
}

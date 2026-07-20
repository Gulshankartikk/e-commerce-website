import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

/** Read-only star rating display. */
export default function Rating({ value = 0, count, size = 'text-sm' }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (value >= i) stars.push(<FaStar key={i} />);
    else if (value >= i - 0.5) stars.push(<FaStarHalfAlt key={i} />);
    else stars.push(<FaRegStar key={i} />);
  }
  return (
    <span className={`flex items-center gap-1 ${size}`}>
      <span className="flex text-amber-400">{stars}</span>
      {count !== undefined && <span className="text-xs text-slate-400">({count})</span>}
    </span>
  );
}

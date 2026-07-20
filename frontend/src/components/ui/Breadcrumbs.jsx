import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

/** Breadcrumb trail: items = [{ label, to? }] — last item is the current page. */
export default function Breadcrumbs({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
      <Link to="/" className="transition-colors hover:text-primary-300">Home</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <FiChevronRight className="text-xs" />
          {item.to ? (
            <Link to={item.to} className="transition-colors hover:text-primary-300">{item.label}</Link>
          ) : (
            <span className="text-frost/90" aria-current="page">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

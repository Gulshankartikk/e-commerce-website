import { Link } from 'react-router-dom';

/** Friendly empty state with an action. */
export default function EmptyState({ icon: Icon, title, message, ctaText = 'Browse products', ctaLink = '/products' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      {Icon && <Icon size={52} strokeWidth={1.5} className="text-[#087F65]" />}
      <h2 className="text-xl font-bold text-[#202923]">{title}</h2>
      <p className="max-w-sm text-sm text-[#65716A]">{message}</p>
      <Link to={ctaLink} className="btn-primary mt-2">{ctaText}</Link>
    </div>
  );
}

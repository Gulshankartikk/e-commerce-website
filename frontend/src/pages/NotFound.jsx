import { Link } from 'react-router-dom';

/** 404 page. */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-display text-7xl font-bold"><span className="text-[#087F65]">404</span></h1>
      <h2 className="text-xl font-bold text-[#202923]">This page wandered off</h2>
      <p className="max-w-sm text-sm text-[#65716A]">The link may be broken, or the page may have been moved. Let's get you back to shopping.</p>
      <Link to="/" className="btn-primary mt-2">Back to home</Link>
    </div>
  );
}

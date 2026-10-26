/** Full-page loading state used by Suspense + route guards. */
export default function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-600 border-t-primary" />
        <span className="font-display text-sm tracking-widest text-slate-400">FLASHSHOP</span>
      </div>
    </div>
  );
}

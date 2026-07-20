/** Loading skeletons for cards and detail pages. */
export function ProductCardSkeleton() {
  return (
    <div className="card-surface overflow-hidden">
      <div className="skeleton aspect-square rounded-none" />
      <div className="space-y-2 p-4">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-6 w-1/3" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-2">
      <div className="skeleton aspect-square" />
      <div className="space-y-4">
        <div className="skeleton h-8 w-3/4" />
        <div className="skeleton h-5 w-1/3" />
        <div className="skeleton h-10 w-1/2" />
        <div className="skeleton h-24 w-full" />
        <div className="skeleton h-12 w-full" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border p-5 space-y-3">
      <div className="h-4 w-24 skeleton-shimmer rounded" />
      <div className="h-8 w-16 skeleton-shimmer rounded" />
      <div className="h-3 w-32 skeleton-shimmer rounded" />
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-16 skeleton-shimmer rounded-lg" />
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 skeleton-shimmer rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <ListSkeleton />
    </div>
  );
}

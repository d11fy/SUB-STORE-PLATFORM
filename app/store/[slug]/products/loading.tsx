export default function ProductsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse" dir="rtl">
      {/* Title */}
      <div className="space-y-2">
        <div className="h-7 w-40 bg-muted rounded-xl mr-auto" />
        <div className="h-3 w-64 bg-muted rounded mr-auto" />
      </div>

      {/* Filter bar skeleton */}
      <div className="flex gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-20 bg-muted rounded-full" />
        ))}
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square bg-muted rounded-2xl" />
            <div className="h-3 bg-muted rounded w-3/4 mr-auto" />
            <div className="h-3 bg-muted rounded w-1/2 mr-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

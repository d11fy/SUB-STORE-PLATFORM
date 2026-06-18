export default function StoreLoading() {
  return (
    <div className="animate-pulse" dir="rtl">
      {/* Hero skeleton */}
      <div className="h-[420px] bg-muted w-full" />

      {/* Trust strip skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-8 justify-center">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-8 w-28 bg-muted rounded-xl" />
        ))}
      </div>

      {/* Products grid skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="h-6 w-32 bg-muted rounded-xl mr-auto" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-square bg-muted rounded-2xl" />
              <div className="h-3 bg-muted rounded w-3/4 mr-auto" />
              <div className="h-3 bg-muted rounded w-1/2 mr-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

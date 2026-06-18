export default function ProductDetailLoading() {
  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-pulse"
      dir="rtl"
    >
      {/* Breadcrumb */}
      <div className="flex gap-2 justify-end mb-10">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-3 w-16 bg-muted rounded" />
        ))}
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left: details */}
        <div className="space-y-5">
          <div className="h-6 w-16 bg-muted rounded-full" />
          <div className="h-8 w-3/4 bg-muted rounded-xl mr-auto" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-5/6" />
          <div className="h-10 w-32 bg-muted rounded-xl" />
          <div className="h-12 w-full bg-muted rounded-xl" />
        </div>

        {/* Right: image */}
        <div className="space-y-4">
          <div className="aspect-square w-full bg-muted rounded-2xl" />
          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

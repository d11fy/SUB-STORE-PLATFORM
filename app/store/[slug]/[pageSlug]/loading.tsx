export default function CustomPageLoading() {
  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse"
      dir="rtl"
    >
      {/* Page title */}
      <div className="space-y-2 text-right">
        <div className="h-7 w-44 bg-muted rounded-xl mr-0" />
      </div>

      {/* Hero-style section */}
      <div className="h-52 bg-muted rounded-2xl w-full" />

      {/* Two-column content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-36 bg-muted rounded-2xl" />
        <div className="h-36 bg-muted rounded-2xl" />
      </div>

      {/* Text block */}
      <div className="space-y-3 max-w-2xl">
        <div className="h-4 bg-muted rounded-lg w-full" />
        <div className="h-4 bg-muted rounded-lg w-5/6" />
        <div className="h-4 bg-muted rounded-lg w-4/6" />
      </div>
    </div>
  );
}

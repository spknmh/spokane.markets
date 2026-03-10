export default function EventDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-64 bg-muted rounded-lg mb-6" />
      <div className="h-10 bg-muted rounded w-96 mb-4" />
      <div className="h-4 bg-muted rounded w-48 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-3/4" />
        </div>
        <div className="h-48 bg-muted rounded-lg" />
      </div>
    </div>
  );
}

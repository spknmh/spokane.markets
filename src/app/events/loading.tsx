export default function EventsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 animate-pulse">
      <div className="h-8 bg-muted rounded w-48 mb-6" />
      <div className="flex gap-4 mb-6">
        <div className="h-10 bg-muted rounded w-32" />
        <div className="h-10 bg-muted rounded w-32" />
        <div className="h-10 bg-muted rounded w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="h-72 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}

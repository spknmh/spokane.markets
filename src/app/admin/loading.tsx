export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 bg-muted rounded w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}

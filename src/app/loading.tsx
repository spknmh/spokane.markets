export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none">
      <span className="sr-only">Loading page content</span>
      <div className="mx-auto mt-4 h-1 w-full max-w-7xl overflow-hidden rounded-full bg-border/50">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-primary/70" />
      </div>
    </div>
  );
}

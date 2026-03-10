"use client";

export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
      <p className="text-muted-foreground mb-6">{error.message || "Failed to load dashboard"}</p>
      <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
        Try again
      </button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
}

export function Pagination({ page, totalPages, totalItems, limit }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function buildUrl(newPage: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    return `${pathname}?${params.toString()}`;
  }

  if (totalPages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  return (
    <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {start}–{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        {page <= 1 ? (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft className="h-4 w-4" aria-hidden />
            Previous
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildUrl(page - 1)}>
              <ChevronLeft className="h-4 w-4" aria-hidden />
              Previous
            </Link>
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </span>
        {page >= totalPages ? (
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildUrl(page + 1)}>
              Next
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

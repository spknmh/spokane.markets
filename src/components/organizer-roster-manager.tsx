"use client";

import { useState, useTransition, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { ParticipationMode } from "@/lib/participation-config";

interface VendorSummary {
  id: string;
  businessName: string;
  slug: string;
  imageUrl: string | null;
  specialties: string | null;
}

interface Request {
  id: string;
  vendorProfileId: string;
  status: string;
  vendorProfile: VendorSummary;
}

interface RosterEntry {
  id: string;
  vendorProfileId: string;
  status: string;
  vendorProfile: VendorSummary;
}

interface OrganizerRosterManagerProps {
  eventId: string;
  eventSlug: string;
  mode: ParticipationMode;
  capacity: number | null;
  requests: Request[];
  roster: RosterEntry[];
}

function VendorRow({
  vendor,
  onApprove,
  onReject,
  onRemove,
  showApproveReject,
  showRemove,
  isPending,
}: {
  vendor: VendorSummary;
  onApprove?: () => void;
  onReject?: () => void;
  onRemove?: () => void;
  showApproveReject?: boolean;
  showRemove?: boolean;
  isPending: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
      <Link
        href={`/vendors/${vendor.slug}`}
        className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80"
      >
        {vendor.imageUrl ? (
          <img
            src={vendor.imageUrl}
            alt={vendor.businessName}
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
            {vendor.businessName.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-medium">{vendor.businessName}</p>
          {vendor.specialties && (
            <p className="truncate text-sm text-muted-foreground">
              {vendor.specialties.split(",")[0]?.trim()}
            </p>
          )}
        </div>
      </Link>
      <div className="flex shrink-0 gap-2">
        {showApproveReject && (
          <>
            <Button
              size="sm"
              disabled={isPending}
              onClick={onApprove}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={onReject}
            >
              Reject
            </Button>
          </>
        )}
        {showRemove && (
          <Button
            size="sm"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            disabled={isPending}
            onClick={onRemove}
          >
            Remove
          </Button>
        )}
      </div>
    </div>
  );
}

export function OrganizerRosterManager({
  eventId,
  eventSlug,
  mode,
  capacity,
  requests,
  roster,
}: OrganizerRosterManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function approve(vendorId: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/organizer/events/${eventId}/roster/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to approve");
        return;
      }
      router.refresh();
    });
  }

  async function reject(vendorId: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/organizer/events/${eventId}/roster/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to reject");
        return;
      }
      router.refresh();
    });
  }

  async function remove(vendorId: string) {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/organizer/events/${eventId}/roster/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to remove");
        return;
      }
      router.refresh();
    });
  }

  const rosterCount = roster.length;
  const capacityLabel =
    capacity != null ? `${rosterCount} / ${capacity} slots` : `${rosterCount} vendor(s)`;
  const atCapacity = capacity != null && rosterCount >= capacity;

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorResults, setVendorResults] = useState<VendorSummary[]>([]);
  const [vendorSearching, setVendorSearching] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rosterIds = new Set(roster.map((r) => r.vendorProfileId));
  const requestIds = new Set(requests.map((r) => r.vendorProfileId));

  const searchVendors = useCallback(async (q: string) => {
    if (q.length < 2) {
      setVendorResults([]);
      return;
    }
    setVendorSearching(true);
    try {
      const res = await fetch(
        `/api/organizer/vendors/search?q=${encodeURIComponent(q)}`
      );
      const data = await res.json();
      setVendorResults(Array.isArray(data) ? data : []);
    } catch {
      setVendorResults([]);
    } finally {
      setVendorSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!addDialogOpen) return;
    debounceRef.current = setTimeout(() => searchVendors(vendorSearch), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [vendorSearch, addDialogOpen, searchVendors]);

  async function addVendor(vendorId: string) {
    setAddError(null);
    startTransition(async () => {
      const res = await fetch(`/api/organizer/events/${eventId}/roster/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, status: "CONFIRMED" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAddError(data.error ?? "Failed to add vendor");
        return;
      }
      setAddDialogOpen(false);
      setVendorSearch("");
      setVendorResults([]);
      router.refresh();
    });
  }

  function exportCsv() {
    const headers = ["Business Name", "Slug", "Specialties", "Status"];
    const rows = roster.map((r) => [
      r.vendorProfile.businessName,
      r.vendorProfile.slug,
      r.vendorProfile.specialties ?? "",
      r.status,
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-${eventSlug}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-8 space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {(mode === "REQUEST_TO_JOIN" || mode === "CAPACITY_LIMITED") && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
            <p className="text-sm text-muted-foreground">
              Vendors who have requested to be listed. Approve or reject.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No pending requests.
              </p>
            ) : (
              requests.map((r) => (
                <VendorRow
                  key={r.id}
                  vendor={r.vendorProfile}
                  showApproveReject
                  isPending={isPending}
                  onApprove={() => approve(r.vendorProfileId)}
                  onReject={() => reject(r.vendorProfileId)}
                />
              ))
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CardTitle>Official Roster</CardTitle>
              {capacity != null && (
                <Badge variant="secondary">{capacityLabel}</Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddDialogOpen(true)}
                disabled={atCapacity || isPending}
              >
                Add vendor
              </Button>
              {roster.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportCsv}>
                  Export CSV
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Organizer-verified vendors for this event.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {roster.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No vendors on the roster yet.
            </p>
          ) : (
            roster.map((r) => (
              <VendorRow
                key={r.id}
                vendor={r.vendorProfile}
                showRemove
                isPending={isPending}
                onRemove={() => remove(r.vendorProfileId)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add vendor to roster</DialogTitle>
            <DialogDescription>
              Search by business name. Vendors already on the roster or with pending requests won&apos;t appear.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="relative">
              <Input
                placeholder="Search vendors by business name..."
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
                autoFocus
                className="pr-9"
              />
              {vendorSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                </span>
              )}
            </div>
            {addError && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {addError}
              </div>
            )}
            <div className="min-h-[120px]">
              {vendorSearch.length < 2 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search for vendors.
                </p>
              ) : vendorSearching ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Searching...
                </p>
              ) : vendorResults.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No vendors found. Try a different search term.
                </p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto rounded-md border p-2">
                  {vendorResults
                    .filter(
                      (v) => !rosterIds.has(v.id) && !requestIds.has(v.id)
                    )
                    .map((vendor) => (
                      <div
                        key={vendor.id}
                        className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 px-3 py-2 transition-colors hover:bg-muted/50"
                      >
                        <Link
                          href={`/vendors/${vendor.slug}`}
                          className="flex min-w-0 flex-1 items-center gap-3 hover:opacity-80"
                        >
                          {vendor.imageUrl ? (
                            <img
                              src={vendor.imageUrl}
                              alt={vendor.businessName}
                              className="h-9 w-9 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                              {vendor.businessName.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {vendor.businessName}
                            </p>
                            {vendor.specialties && (
                              <p className="truncate text-xs text-muted-foreground">
                                {vendor.specialties.split(",")[0]?.trim()}
                              </p>
                            )}
                          </div>
                        </Link>
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => addVendor(vendor.id)}
                          className="shrink-0"
                        >
                          Add
                        </Button>
                      </div>
                    ))}
                  {vendorResults.filter(
                    (v) => !rosterIds.has(v.id) && !requestIds.has(v.id)
                  ).length === 0 &&
                    vendorResults.length > 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">
                        All matching vendors are already on the roster or have pending requests.
                      </p>
                    )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Role } from "@prisma/client";

interface UserFiltersProps {
  q: string;
  role: string;
  roles: { label: string; value: Role | "" }[];
}

export function UserFilters({ q, role, roles }: UserFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(q);

  const buildUrl = useCallback(
    (updates: { q?: string; role?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      params.set("page", "1");
      return `/admin/users?${params.toString()}`;
    },
    [searchParams]
  );

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildUrl({ q: searchValue.trim() || undefined, role: role || undefined }));
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    router.push(
      buildUrl({
        q: searchValue.trim() || undefined,
        role: value === "all" ? undefined : value,
      })
    );
  };

  return (
    <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-end gap-4">
      <div className="flex-1 min-w-[200px]">
        <Label htmlFor="user-search" className="sr-only">
          Search by name or email
        </Label>
        <Input
          id="user-search"
          type="search"
          placeholder="Search by name or email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="w-[180px]">
        <Label htmlFor="role-filter" className="sr-only">
          Filter by role
        </Label>
        <Select
          id="role-filter"
          value={role || "all"}
          onChange={handleRoleChange}
          className="h-10"
        >
          {roles.map((r) => (
            <option key={r.value || "all"} value={r.value || "all"}>
              {r.label}
            </option>
          ))}
        </Select>
      </div>
      <Button type="submit" variant="secondary" size="sm">
        Search
      </Button>
    </form>
  );
}

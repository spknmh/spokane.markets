"use client";

import * as React from "react";
import { useCallback, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface UserOption {
  id: string;
  name: string | null;
  email: string;
}

interface UserSearchInputProps {
  value: string;
  onChange: (userId: string, user: UserOption | null) => void;
  displayValue?: string;
  placeholder?: string;
  label?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
}

export function UserSearchInput({
  value,
  onChange,
  displayValue,
  placeholder = "Search by name or email...",
  label = "Owner",
  id = "owner-search",
  className,
  disabled,
}: UserSearchInputProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<UserOption[]>([]);

  React.useEffect(() => {
    if (value && displayValue) {
      setQuery(displayValue);
    } else if (!value) {
      setQuery("");
    }
  }, [value, displayValue]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (v === "") {
      setSelectedUser(null);
      onChange("", null);
      setSuggestions([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(v), 200);
  };

  const handleSelect = (user: UserOption) => {
    setSelectedUser(user);
    setQuery(user.name || user.email);
    onChange(user.id, user);
    setSuggestions([]);
    setOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setSelectedUser(null);
    onChange("", null);
    setSuggestions([]);
    setOpen(false);
  };

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {label && (
        <Label htmlFor={id} className="mb-1.5 block">
          {label}
        </Label>
      )}
      <div className="flex gap-2">
        <Input
          id={id}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="shrink-0 rounded-md border border-border px-2 text-sm text-muted-foreground hover:bg-muted"
          >
            Clear
          </button>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-background py-1 shadow-lg">
          {suggestions.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                onClick={() => handleSelect(user)}
              >
                <span className="font-medium">{user.name || "—"}</span>
                <span className="ml-2 text-muted-foreground">{user.email}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {loading && (
        <p className="mt-1 text-xs text-muted-foreground">Searching...</p>
      )}
    </div>
  );
}

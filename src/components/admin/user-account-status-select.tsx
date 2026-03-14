"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";

const ACCOUNT_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "BANNED", label: "Banned" },
  { value: "DEACTIVATED", label: "Deactivated" },
] as const;

type AccountStatus = (typeof ACCOUNT_STATUSES)[number]["value"];

interface UserAccountStatusSelectProps {
  userId: string;
  currentStatus: AccountStatus;
}

export function UserAccountStatusSelect({
  userId,
  currentStatus,
}: UserAccountStatusSelectProps) {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const accountStatus = e.target.value as AccountStatus;
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountStatus }),
    });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <Select value={currentStatus} onChange={handleChange} className="w-36">
      {ACCOUNT_STATUSES.map((status) => (
        <option key={status.value} value={status.value}>
          {status.label}
        </option>
      ))}
    </Select>
  );
}


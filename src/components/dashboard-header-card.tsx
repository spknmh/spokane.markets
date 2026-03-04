import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeIcon } from "@/components/badge-icon";

function formatMemberSince(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export interface DashboardHeaderCardUser {
  name: string | null;
  email: string;
  image: string | null;
  createdAt: Date;
  role: string;
}

export interface DashboardHeaderCardProps {
  user: DashboardHeaderCardUser;
  vendorProfile?: { createdAt: Date };
  organizerSince?: Date;
  badges?: { slug: string; name: string; icon: string | null }[];
}

const ROLE_LABELS: Record<string, string> = {
  USER: "Member",
  VENDOR: "Vendor",
  ORGANIZER: "Organizer",
  ADMIN: "Admin",
};

export function DashboardHeaderCard({
  user,
  vendorProfile,
  organizerSince,
  badges = [],
}: DashboardHeaderCardProps) {
  const displayName = user.name || user.email;
  const fallbackLetter = displayName.charAt(0).toUpperCase();

  return (
    <Card className="border-2">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex shrink-0 items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 rounded-full object-cover"
              unoptimized={user.image.startsWith("/uploads/")}
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xl font-bold text-primary">
              {fallbackLetter}
            </div>
          )}
          <div>
            <h2 className="text-lg font-semibold">{displayName}</h2>
            <Badge variant="secondary" className="mt-0.5">
              {ROLE_LABELS[user.role] ?? user.role}
            </Badge>
          </div>
        </div>
        <div className="flex flex-1 flex-wrap items-center gap-x-6 gap-y-1 text-sm text-muted-foreground">
          <span>Member since {formatMemberSince(user.createdAt)}</span>
          {vendorProfile && (
            <span>Vendor since {formatMemberSince(vendorProfile.createdAt)}</span>
          )}
          {organizerSince && (
            <span>Organizer since {formatMemberSince(organizerSince)}</span>
          )}
        </div>
        {badges.length > 0 && (
          <div className="flex shrink-0 flex-wrap gap-1.5" title={badges.map((b) => b.name).join(", ")}>
            {badges.map((b) => (
              <Badge key={b.slug} variant="outline" className="gap-1">
                <BadgeIcon name={b.icon} />
                {b.name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

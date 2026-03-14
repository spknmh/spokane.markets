export type DashboardNavIcon =
  | "LayoutDashboard"
  | "Heart"
  | "Bell"
  | "Shield"
  | "Store"
  | "User"
  | "Link2"
  | "ExternalLink"
  | "PlusCircle"
  | "MapPin";

export type DashboardNavItem = {
  label: string;
  href: string;
  icon: DashboardNavIcon;
};

export type DashboardNavSection = {
  id: string;
  label: string;
  items: DashboardNavItem[];
  defaultOpen?: boolean;
};

export function buildDashboardNavSections({
  isAdmin,
  hasVendorProfile,
  hasOrganizerAccess,
  vendorSlug,
}: {
  isAdmin: boolean;
  hasVendorProfile: boolean;
  hasOrganizerAccess: boolean;
  vendorSlug: string | null;
}): DashboardNavSection[] {
  const sections: DashboardNavSection[] = [
    {
      id: "account",
      label: "Account",
      items: [
        { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
        { label: "Favorite Vendors", href: "/dashboard#favorites", icon: "Heart" },
        { label: "Notifications", href: "/notifications", icon: "Bell" },
      ],
      defaultOpen: true,
    },
  ];

  if (hasVendorProfile) {
    sections.push({
      id: "vendor",
      label: "Vendor",
      items: [
        { label: "Vendor Dashboard", href: "/vendor/dashboard", icon: "Store" },
        { label: "Edit Profile", href: "/vendor/profile/edit", icon: "User" },
        { label: "Link to Event", href: "/vendor/events/link", icon: "Link2" },
        {
          label: "Public Profile",
          href: vendorSlug ? `/vendors/${vendorSlug}` : "/vendors",
          icon: "ExternalLink",
        },
      ],
      defaultOpen: true,
    });
  }

  if (hasOrganizerAccess) {
    sections.push({
      id: "organizer",
      label: "Organizer",
      items: [
        { label: "Organizer Dashboard", href: "/organizer/dashboard", icon: "MapPin" },
        { label: "Create Market", href: "/organizer/markets/new", icon: "MapPin" },
        { label: "Submit Event", href: "/organizer/events/new", icon: "PlusCircle" },
      ],
      defaultOpen: true,
    });
  }

  if (isAdmin) {
    sections.push({
      id: "admin",
      label: "Admin",
      items: [{ label: "Admin Dashboard", href: "/admin", icon: "Shield" }],
      defaultOpen: true,
    });
  }

  return sections;
}

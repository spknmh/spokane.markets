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
  | "MapPin"
  | "Bookmark"
  | "Settings"
  | "Award"
  | "Inbox"
  | "SlidersHorizontal"
  | "Lock"
  | "FileText";

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
  hasApplications = false,
}: {
  isAdmin: boolean;
  hasVendorProfile: boolean;
  hasOrganizerAccess: boolean;
  vendorSlug: string | null;
  hasApplications?: boolean;
}): DashboardNavSection[] {
  const accountItems: DashboardNavSection["items"] = [
    { label: "Overview", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Saved", href: "/account/saved", icon: "Bookmark" },
    { label: "Activity", href: "/notifications", icon: "Inbox" },
    { label: "Badges", href: "/dashboard/badges", icon: "Award" },
  ];

  if (hasApplications) {
    accountItems.splice(2, 0, {
      label: "Applications",
      href: "/account/applications",
      icon: "FileText",
    });
  }

  const sections: DashboardNavSection[] = [
    {
      id: "account",
      label: "Account",
      items: accountItems,
      defaultOpen: true,
    },
    {
      id: "settings",
      label: "Settings",
      items: [
        { label: "Account & data", href: "/account/settings", icon: "Settings" },
        {
          label: "Notification settings",
          href: "/account/notifications",
          icon: "SlidersHorizontal",
        },
        { label: "Privacy", href: "/account/privacy", icon: "Shield" },
        { label: "Security", href: "/account/security", icon: "Lock" },
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

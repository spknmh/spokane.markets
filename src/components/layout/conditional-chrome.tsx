"use client";

import { usePathname } from "next/navigation";

/** Hides Navbar and Footer in admin area and maintenance landing page. */
export function ConditionalChrome({
  children,
  nav,
  announcement,
  footer,
}: {
  children: React.ReactNode;
  nav: React.ReactNode;
  announcement?: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");
  const isMaintenance = pathname === "/maintenance";

  if (isAdmin || isMaintenance) {
    return <>{children}</>;
  }

  return (
    <>
      {nav}
      {announcement}
      {children}
      {footer}
    </>
  );
}

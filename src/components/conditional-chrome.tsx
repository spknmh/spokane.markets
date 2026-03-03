"use client";

import { usePathname } from "next/navigation";

/** Hides Navbar and Footer when the user is in the admin area. */
export function ConditionalChrome({
  children,
  nav,
  footer,
}: {
  children: React.ReactNode;
  nav: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {nav}
      {children}
      {footer}
    </>
  );
}

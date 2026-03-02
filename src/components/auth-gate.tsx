"use client";

import { useState } from "react";
import type { Session } from "next-auth";
import { AuthRequiredModal } from "@/components/auth-required-modal";

interface AuthGateProps {
  session: Session | null;
  callbackUrl: string;
  children: React.ReactNode;
}

export function AuthGate({ session, callbackUrl, children }: AuthGateProps) {
  const [open, setOpen] = useState(false);

  if (session) {
    return <>{children}</>;
  }

  return (
    <>
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        {children}
      </span>
      <AuthRequiredModal
        open={open}
        onOpenChange={setOpen}
        callbackUrl={callbackUrl}
      />
    </>
  );
}

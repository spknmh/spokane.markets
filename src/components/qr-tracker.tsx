"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics";

/** Tracks business_card_qr and redirects to homepage. Used for /qr (business card QR code). */
export function QRTracker() {
  const router = useRouter();

  useEffect(() => {
    trackEvent("business_card_qr", { source: "qr" });
    router.replace("/");
  }, [router]);

  return null;
}

"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Share2 } from "lucide-react";

interface ShareButtonProps {
  url: string;
  title: string;
  text?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function ShareButton({
  url,
  title,
  text,
  variant = "outline",
  size = "sm",
  className,
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text ?? title,
          url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await fallbackCopy(url);
        }
      }
    } else {
      await fallbackCopy(url);
    }
  }, [url, title, text]);

  async function fallbackCopy(urlToCopy: string) {
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: open in new tab
      window.open(urlToCopy, "_blank");
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleShare}
      type="button"
    >
      <Share2 className="h-4 w-4" aria-hidden />
      {copied ? "Copied!" : "Share"}
    </Button>
  );
}

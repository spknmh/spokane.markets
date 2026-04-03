"use client";

import { useCallback, useEffect, useState } from "react";
import type { AnalyticsParams } from "@/lib/analytics";
import { trackEvent } from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link2, Mail, MessageCircle, MessageSquare, Share2, Facebook } from "lucide-react";
import { cn } from "@/lib/utils";

function buildShareBody(title: string, url: string, description?: string | null): string {
  const lines = [title, "", url];
  if (description?.trim()) {
    lines.push("", description.trim().slice(0, 400));
  }
  return lines.join("\n");
}

export function EventShareDialog({
  eventId,
  title,
  description,
  shareUrl,
  analyticsParams,
  triggerClassName,
}: {
  eventId: string;
  title: string;
  description: string | null;
  shareUrl: string;
  analyticsParams?: AnalyticsParams;
  /** Extra classes for the trigger control (e.g. hero title row alignment). */
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = buildShareBody(title, shareUrl, description);
  const tweetText = encodeURIComponent(`${title} ${shareUrl}`);
  const mailtoHref = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareText)}`;
  const smsHref = `sms:?&body=${encodeURIComponent(shareText)}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${tweetText}`;

  const track = useCallback(
    (method: string) => {
      trackEvent("event_share_click", {
        ...analyticsParams,
        event_id: eventId,
        method,
        surface: "detail_page",
      });
    },
    [analyticsParams, eventId]
  );

  const copy = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        track("copy_link");
      } catch {
        track("copy_failed");
      }
    },
    [track]
  );

  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && typeof navigator.share === "function");
  }, []);

  const tryNativeShare = useCallback(async () => {
    track("native_share");
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description ?? title,
          url: shareUrl,
        });
        setOpen(false);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          await copy(shareUrl);
        }
      }
    } else {
      await copy(shareUrl);
    }
  }, [copy, description, shareUrl, title, track]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("min-h-[44px]", triggerClassName)}
        onClick={() => setOpen(true)}
      >
        <Share2 className="mr-1.5 h-4 w-4 stroke-[1.5]" aria-hidden />
        Share
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share this event</DialogTitle>
            <DialogDescription>Copy a link or open another app to share.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 px-6 pb-6">
            {canNativeShare && (
              <Button type="button" variant="secondary" className="justify-start" onClick={() => void tryNativeShare()}>
                <Share2 className="mr-2 h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                Share via device…
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() => void copy(shareUrl)}
            >
              <Link2 className="mr-2 h-4 w-4 shrink-0 stroke-[1.5] text-emerald-600 dark:text-emerald-400" aria-hidden />
              {copied ? "Copied!" : "Copy link"}
            </Button>
            <Button type="button" variant="outline" className="justify-start" asChild>
              <a href={mailtoHref} onClick={() => track("email")}>
                <Mail className="mr-2 h-4 w-4 shrink-0 stroke-[1.5] text-slate-600 dark:text-slate-300" aria-hidden />
                Email
              </a>
            </Button>
            <Button type="button" variant="outline" className="justify-start" asChild>
              <a href={smsHref} onClick={() => track("sms")}>
                <MessageSquare className="mr-2 h-4 w-4 shrink-0 stroke-[1.5] text-blue-600 dark:text-blue-400" aria-hidden />
                Messages / SMS
              </a>
            </Button>
            <Button type="button" variant="outline" className="justify-start" asChild>
              <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp")}>
                <MessageCircle className="mr-2 h-4 w-4 shrink-0 stroke-[1.5] text-green-600 dark:text-green-400" aria-hidden />
                WhatsApp
              </a>
            </Button>
            <Button type="button" variant="outline" className="justify-start" asChild>
              <a href={fbHref} target="_blank" rel="noopener noreferrer" onClick={() => track("facebook")}>
                <Facebook className="mr-2 h-4 w-4 shrink-0 text-[#1877F2]" aria-hidden />
                Facebook
              </a>
            </Button>
            <Button type="button" variant="outline" className="justify-start" asChild>
              <a href={xHref} target="_blank" rel="noopener noreferrer" onClick={() => track("twitter")}>
                <span className="mr-2 text-sm font-bold" aria-hidden>
                  𝕏
                </span>
                X (Twitter)
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

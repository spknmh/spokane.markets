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
import {
  Link2,
  Mail,
  MessageCircle,
  MessageSquare,
  Share2,
  Facebook,
  Instagram,
} from "lucide-react";

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
}: {
  eventId: string;
  title: string;
  description: string | null;
  shareUrl: string;
  analyticsParams?: AnalyticsParams;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"link" | "caption" | null>(null);

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
    async (text: string, kind: "link" | "caption") => {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(kind);
        setTimeout(() => setCopied(null), 2000);
        track(kind === "link" ? "copy_link" : "copy_caption");
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
          await copy(shareUrl, "link");
        }
      }
    } else {
      await copy(shareUrl, "link");
    }
  }, [copy, description, shareUrl, title, track]);

  return (
    <>
      <Button type="button" variant="outline" size="sm" className="min-h-[44px]" onClick={() => setOpen(true)}>
        <Share2 className="mr-1.5 h-4 w-4" aria-hidden />
        Share
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share this event</DialogTitle>
            <DialogDescription>Copy a link or open your favorite app.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 px-6 pb-6">
            {canNativeShare && (
              <Button type="button" variant="secondary" className="justify-start" onClick={() => void tryNativeShare()}>
                <Share2 className="mr-2 h-4 w-4 shrink-0" aria-hidden />
                Share via device…
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              className="justify-start"
              onClick={() => void copy(shareUrl, "link")}
            >
              <Link2 className="mr-2 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
              {copied === "link" ? "Copied!" : "Copy link"}
            </Button>
            <Button type="button" variant="outline" className="justify-start" asChild>
              <a href={mailtoHref} onClick={() => track("email")}>
                <Mail className="mr-2 h-4 w-4 shrink-0 text-slate-600 dark:text-slate-300" aria-hidden />
                Email
              </a>
            </Button>
            <Button type="button" variant="outline" className="justify-start" asChild>
              <a href={smsHref} onClick={() => track("sms")}>
                <MessageSquare className="mr-2 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                Messages / SMS
              </a>
            </Button>
            <Button type="button" variant="outline" className="justify-start" asChild>
              <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp")}>
                <MessageCircle className="mr-2 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden />
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
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="flex items-start gap-2">
                <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" aria-hidden />
                Instagram doesn&apos;t support one-tap web sharing. Copy the caption below, then paste in the app.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="mt-2 w-full justify-start"
                onClick={() => void copy(shareText, "caption")}
              >
                {copied === "caption" ? "Caption copied!" : "Copy caption for Instagram"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

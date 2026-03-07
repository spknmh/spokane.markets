import Image from "next/image";
import Link from "next/link";
import { SITE_NAME } from "@/lib/constants";

export function SiteLogo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-2.5 transition-opacity hover:opacity-90"
    >
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
        <Image
          src="/store.png"
          alt=""
          width={36}
          height={36}
          className="object-contain p-0.5"
          priority
        />
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-heading text-lg font-bold tracking-tight text-foreground">
          <span className="text-primary">{SITE_NAME.split(" ")[0]}</span>
          {SITE_NAME.includes(" ") && (
            <>
              {" "}
              <span className="text-foreground/90">
                {SITE_NAME.split(" ").slice(1).join(" ")}
              </span>
            </>
          )}
        </span>
        <span className="hidden text-[11px] font-medium uppercase tracking-wider text-muted-foreground sm:block">
          Discover local
        </span>
      </div>
    </Link>
  );
}

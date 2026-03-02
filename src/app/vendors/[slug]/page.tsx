import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteVendorButton } from "@/components/favorite-vendor-button";
import { AuthGate } from "@/components/auth-gate";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { EventCard } from "@/components/event-card";
import { VendorSocialLinks } from "@/components/vendor-social-links";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getVendor(slug: string) {
  return db.vendorProfile.findUnique({
    where: { slug },
    include: {
      vendorEvents: {
        include: {
          event: {
            include: {
              venue: true,
              tags: true,
              features: true,
              _count: { select: { vendorEvents: true } },
            },
          },
        },
        orderBy: { event: { startDate: "asc" } },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getVendor(slug);

  if (!vendor) {
    return { title: "Vendor Not Found" };
  }

  return {
    title: `${vendor.businessName} | Spokane Markets`,
    description:
      vendor.description ??
      `${vendor.businessName} — a local vendor on Spokane Markets.`,
  };
}

export default async function VendorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [vendor, session] = await Promise.all([
    getVendor(slug),
    auth(),
  ]);

  if (!vendor) {
    notFound();
  }

  const favorite = session?.user
    ? await db.favoriteVendor.findUnique({
        where: {
          userId_vendorProfileId: {
            userId: session.user.id!,
            vendorProfileId: vendor.id,
          },
        },
      })
    : null;

  const upcomingEvents = vendor.vendorEvents
    .filter(
      (ve) =>
        ve.event.startDate >= new Date() && ve.event.status === "PUBLISHED",
    )
    .map((ve) => ve.event);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {vendor.imageUrl ? (
              <img
                src={vendor.imageUrl}
                alt={vendor.businessName}
                className="h-40 w-40 shrink-0 rounded-xl object-cover sm:h-48 sm:w-48"
              />
            ) : (
              <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-4xl font-bold text-primary sm:h-48 sm:w-48">
                {vendor.businessName.charAt(0)}
              </div>
            )}

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight">
                  {vendor.businessName}
                </h1>
                {session?.user && (
                  <FavoriteVendorButton
                    slug={vendor.slug}
                    initialFavorited={!!favorite}
                    initialEmailAlerts={favorite?.emailAlerts ?? true}
                  />
                )}
              </div>

              {vendor.specialties && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {vendor.specialties.split(",").map((s) => (
                    <Badge key={s.trim()} variant="secondary">
                      {s.trim()}
                    </Badge>
                  ))}
                </div>
              )}

              {vendor.description && (
                <p className="mt-4 whitespace-pre-line text-muted-foreground">
                  {vendor.description}
                </p>
              )}
            </div>
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-semibold">
              Where We&apos;ll Be Next
            </h2>

            {upcomingEvents.length === 0 ? (
              <Card className="mt-4">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No upcoming events scheduled. Check back soon!
                </CardContent>
              </Card>
            ) : (
              <div className="mt-4 space-y-3">
                {upcomingEvents.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-80 lg:sticky lg:top-24">
          <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-5">
            <VendorSocialLinks
              websiteUrl={vendor.websiteUrl}
              facebookUrl={vendor.facebookUrl}
              instagramUrl={vendor.instagramUrl}
            />

            {vendor.userId == null && (
              <AuthGate
                session={session}
                callbackUrl={`/vendors/${vendor.slug}/claim`}
              >
                <Button asChild className="w-full">
                  <Link href={`/vendors/${vendor.slug}/claim`}>
                    Claim This Vendor
                  </Link>
                </Button>
              </AuthGate>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

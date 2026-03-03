import Image from "next/image";
import { getBannerImages } from "@/lib/banner-images";
import { isBannerUnoptimized } from "@/lib/utils";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const banners = await getBannerImages();
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="absolute inset-0 -z-10">
        <Image
          src={banners.community}
          alt=""
          fill
          className="object-cover opacity-20"
          priority
          unoptimized={isBannerUnoptimized(banners.community)}
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>
      {children}
    </div>
  );
}

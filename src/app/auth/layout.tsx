import Image from "next/image";
import { COMMUNITY_IMAGES } from "@/lib/community-images";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100vh-4rem)]">
      <div className="absolute inset-0 -z-10">
        <Image
          src={COMMUNITY_IMAGES.community}
          alt=""
          fill
          className="object-cover opacity-20"
          priority
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>
      {children}
    </div>
  );
}

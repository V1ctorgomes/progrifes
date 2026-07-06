import Image from "next/image";
import type { Banner } from "@/types/banner";
import { cn } from "@/utils/cn";

interface BannerImageProps {
  banner: Banner;
  priority?: boolean;
  className?: string;
  sizes?: string;
  overlay?: boolean;
}

export function BannerImage({
  banner,
  priority = false,
  className,
  sizes = "100vw",
  overlay = false,
}: BannerImageProps) {
  const mobileSrc = banner.imagemMobile ?? banner.imagemDesktop;

  return (
    <div className={cn("relative h-full w-full", className)}>
      <Image
        src={mobileSrc}
        alt={banner.titulo}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className="object-cover md:hidden"
        sizes={sizes}
      />
      <Image
        src={banner.imagemDesktop}
        alt={banner.titulo}
        fill
        priority={priority}
        loading={priority ? undefined : "lazy"}
        className="hidden object-cover md:block"
        sizes={sizes}
      />
      {overlay && (
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      )}
    </div>
  );
}

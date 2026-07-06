import Image from "next/image";
import type { Category } from "@/types/category";
import { cn } from "@/utils/cn";

interface CategoryBannerProps {
  category: Category;
  className?: string;
}

export function CategoryBanner({ category, className }: CategoryBannerProps) {
  return (
    <div className={cn("relative aspect-[16/7] w-full overflow-hidden bg-brand-light sm:aspect-[21/7]", className)}>
      <Image
        src={category.banner}
        alt={category.nome}
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
    </div>
  );
}

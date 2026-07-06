import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types/home";

interface CategoryCardProps {
  category: Category;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`#categoria-${category.slug}`}
      className="group flex w-[120px] flex-shrink-0 flex-col items-center gap-2 sm:w-[140px]"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-full bg-brand-light">
        <Image
          src={category.image}
          alt={category.name}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="140px"
        />
      </div>
      <span className="text-center text-xs font-medium uppercase tracking-wide text-brand-black sm:text-sm">
        {category.name}
      </span>
    </Link>
  );
}

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
      className="group relative block overflow-hidden bg-brand-light"
    >
      <div className="relative aspect-[3/4] sm:aspect-square">
        <Image
          src={category.image}
          alt={category.name}
          fill
          loading="lazy"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, 25vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-brand-white">
          <h3 className="font-display text-lg font-bold uppercase tracking-wider">
            {category.name}
          </h3>
          <p className="mt-1 text-xs text-neutral-200">
            {category.productCount} produtos
          </p>
        </div>
      </div>
    </Link>
  );
}

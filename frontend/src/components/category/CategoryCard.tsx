import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/types/category";
import { cn } from "@/utils/cn";

type CategoryCardVariant = "home" | "list";

interface CategoryCardProps {
  category: Category;
  variant?: CategoryCardVariant;
  className?: string;
}

export function CategoryCard({ category, variant = "home", className }: CategoryCardProps) {
  const href = `/categorias/${category.slug}`;

  if (variant === "list") {
    return (
      <article
        className={cn(
          "group flex flex-col overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-md",
          className,
        )}
      >
        <Link href={href} className="relative block aspect-[16/10] overflow-hidden bg-neutral-50">
          <Image
            src={category.imagem}
            alt={category.nome}
            fill
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </Link>
        <div className="flex flex-1 flex-col p-5">
          <Link href={href}>
            <h3 className="font-display text-lg font-bold tracking-tight text-brand-black">
              {category.nome}
            </h3>
          </Link>
          <p className="mt-2 line-clamp-2 flex-1 text-sm text-neutral-500">{category.descricao}</p>
          <p className="mt-3 text-xs font-medium text-neutral-400">
            {category.productCount} produtos
          </p>
          <div className="mt-4">
            <Link href={href}>
              <Button size="sm" fullWidth>
                Ver produtos
              </Button>
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={cn("group flex flex-col", className)}>
      <Link
        href={href}
        className="relative block overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 shadow-sm transition-shadow group-hover:shadow-md"
      >
        <div className="relative aspect-[3/4] sm:aspect-square">
          <Image
            src={category.imagem}
            alt={category.nome}
            fill
            loading="lazy"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 25vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className="font-display text-lg font-bold tracking-tight">{category.nome}</h3>
            <p className="mt-1 text-xs font-medium text-neutral-200">
              {category.productCount} produtos
            </p>
          </div>
        </div>
      </Link>
      <Link href={href} className="mt-3">
        <Button size="sm" variant="outline" fullWidth>
          Visualizar
        </Button>
      </Link>
    </article>
  );
}

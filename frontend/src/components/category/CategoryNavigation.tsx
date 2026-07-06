import Link from "next/link";
import type { Category } from "@/types/category";
import { getSubcategories } from "@/lib/categories";
import { cn } from "@/utils/cn";

interface CategoryNavigationProps {
  categories: Category[];
  currentCategory: Category;
  className?: string;
}

export function CategoryNavigation({
  categories,
  currentCategory,
  className,
}: CategoryNavigationProps) {
  const parent = currentCategory.categoriaPai
    ? categories.find((c) => c.id === currentCategory.categoriaPai)
    : currentCategory;

  const siblings = parent
    ? getSubcategories(categories, parent.id)
    : [];

  const items =
    siblings.length > 0
      ? siblings
      : currentCategory.categoriaPai === null
        ? categories.filter((c) => c.categoriaPai === null && c.ativo)
        : [currentCategory];

  if (items.length <= 1) return null;

  return (
    <nav aria-label="Subcategorias" className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/categorias/${item.slug}`}
          className={cn(
            "border px-4 py-2 text-xs font-medium uppercase tracking-wide transition-colors",
            item.slug === currentCategory.slug
              ? "border-brand-black bg-brand-black text-brand-white"
              : "border-neutral-300 text-brand-black hover:border-brand-black",
          )}
        >
          {item.nome}
        </Link>
      ))}
    </nav>
  );
}

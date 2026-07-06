import type { ReactNode } from "react";
import type { Category } from "@/types/category";
import { CategoryCard } from "@/components/category/CategoryCard";
import { cn } from "@/utils/cn";

type CategoryCardVariant = "home" | "list";

interface CategoryGridProps {
  categories: Category[];
  variant?: CategoryCardVariant;
  columns?: 2 | 3 | 4;
  className?: string;
  children?: ReactNode;
}

const columnStyles = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-2 lg:grid-cols-4",
};

export function CategoryGrid({
  categories,
  variant = "home",
  columns = 4,
  className,
  children,
}: CategoryGridProps) {
  if (categories.length === 0 && !children) return null;

  return (
    <div className={cn("grid gap-4 sm:gap-6", columnStyles[columns], className)}>
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} variant={variant} />
      ))}
      {children}
    </div>
  );
}

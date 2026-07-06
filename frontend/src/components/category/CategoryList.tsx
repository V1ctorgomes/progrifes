import type { Category } from "@/types/category";
import { CategoryGrid } from "@/components/category/CategoryGrid";
import { cn } from "@/utils/cn";

interface CategoryListProps {
  categories: Category[];
  className?: string;
}

export function CategoryList({ categories, className }: CategoryListProps) {
  return (
    <CategoryGrid
      categories={categories}
      variant="list"
      columns={3}
      className={cn(className)}
    />
  );
}

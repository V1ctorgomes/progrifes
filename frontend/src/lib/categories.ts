import type { BreadcrumbItem, Category } from "@/types/category";
import type { Product } from "@/types/home";

export const HOME_CATEGORIES_LIMIT = 4;

export function getActiveCategories(categories: Category[]): Category[] {
  return categories.filter((c) => c.ativo).sort((a, b) => a.ordem - b.ordem);
}

export function getRootCategories(categories: Category[]): Category[] {
  return getActiveCategories(categories).filter((c) => c.categoriaPai === null);
}

export function getHomeCategories(categories: Category[], limit = HOME_CATEGORIES_LIMIT): Category[] {
  return getRootCategories(categories).slice(0, limit);
}

export function hasMoreHomeCategories(
  categories: Category[],
  limit = HOME_CATEGORIES_LIMIT,
): boolean {
  return getRootCategories(categories).length > limit;
}

export function getSubcategories(categories: Category[], parentId: string): Category[] {
  return getActiveCategories(categories).filter((c) => c.categoriaPai === parentId);
}

export function sortCategories(categories: Category[]): Category[] {
  return [...categories].sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
}

export function getRootCategoriesAll(categories: Category[]): Category[] {
  return sortCategories(categories.filter((c) => c.categoriaPai === null));
}

export function getChildCategoriesAll(categories: Category[], parentId: string): Category[] {
  return sortCategories(categories.filter((c) => c.categoriaPai === parentId));
}

export function getOrphanCategories(categories: Category[]): Category[] {
  return sortCategories(
    categories.filter(
      (category) =>
        category.categoriaPai !== null &&
        !categories.some((parent) => parent.id === category.categoriaPai),
    ),
  );
}

export function getCategoryBySlug(categories: Category[], slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug && c.ativo);
}

export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id && c.ativo);
}

export function getBreadcrumbTrail(categories: Category[], slug: string): BreadcrumbItem[] {
  const trail: BreadcrumbItem[] = [{ label: "Início", href: "/" }];
  const category = getCategoryBySlug(categories, slug);

  if (!category) {
    return [...trail, { label: "Categorias", href: "/categorias" }];
  }

  trail.push({ label: "Categorias", href: "/categorias" });

  if (category.categoriaPai) {
    const parent = getCategoryById(categories, category.categoriaPai);
    if (parent) {
      trail.push({ label: parent.nome, href: `/categorias/${parent.slug}` });
    }
  }

  trail.push({ label: category.nome, href: `/categorias/${category.slug}` });

  return trail;
}

export function getProductsByCategory(products: Product[], categorySlug: string): Product[] {
  return products.filter((p) => p.categorySlug === categorySlug);
}

export function getProductsForCategoryTree(
  products: Product[],
  categories: Category[],
  slug: string,
): Product[] {
  const category = getCategoryBySlug(categories, slug);
  if (!category) return [];

  const slugs = [category.slug];
  const subcategories = getSubcategories(categories, category.id);
  subcategories.forEach((sub) => slugs.push(sub.slug));

  return products.filter((p) => p.categorySlug && slugs.includes(p.categorySlug));
}

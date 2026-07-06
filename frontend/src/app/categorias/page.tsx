import Link from "next/link";
import { CategoriesPage } from "@/features/categories/CategoriesPage";
import { getPublicCategories } from "@/lib/public-api";

export const revalidate = 30;

export default async function Page() {
  const categories = await getPublicCategories();
  return <CategoriesPage categories={categories} />;
}

import { CategoryDetailPage } from "@/features/categories/CategoryDetailPage";
import { getPublicCategories, getPublicProducts } from "@/lib/public-api";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const [categories, productsResponse] = await Promise.all([
    getPublicCategories(),
    getPublicProducts({ categorySlug: slug, limit: 50 }),
  ]);

  return (
    <CategoryDetailPage
      slug={slug}
      categories={categories}
      products={productsResponse.data}
    />
  );
}

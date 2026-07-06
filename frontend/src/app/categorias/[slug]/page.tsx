import { CategoryDetailPage } from "@/features/categories/CategoryDetailPage";
import { getPublicCategories } from "@/lib/public-api";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const categories = await getPublicCategories();

  return <CategoryDetailPage slug={slug} categories={categories} />;
}

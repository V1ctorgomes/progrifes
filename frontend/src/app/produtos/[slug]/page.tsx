import { ProductDetailPage } from "@/features/products/ProductDetailPage";
import { getPublicCategories, getPublicProductBySlug } from "@/lib/public-api";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;

  try {
    const [product, categories] = await Promise.all([
      getPublicProductBySlug(slug),
      getPublicCategories(),
    ]);

    return <ProductDetailPage product={product} categories={categories} />;
  } catch {
    notFound();
  }
}

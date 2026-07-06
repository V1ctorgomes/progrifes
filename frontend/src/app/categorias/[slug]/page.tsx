import { CategoryDetailPage } from "@/features/categories/CategoryDetailPage";
import { mockCategories } from "@/lib/mock-categories";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return mockCategories
    .filter((c) => c.ativo)
    .map((category) => ({ slug: category.slug }));
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <CategoryDetailPage slug={slug} />;
}

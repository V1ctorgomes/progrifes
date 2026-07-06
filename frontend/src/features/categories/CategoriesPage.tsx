import Link from "next/link";
import { Breadcrumb, CategoryList } from "@/components/category";
import { StoreLayout } from "@/layouts/StoreLayout";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { getRootCategories } from "@/lib/categories";
import type { Category } from "@/types/category";

interface CategoriesPageProps {
  categories: Category[];
}

export function CategoriesPage({ categories }: CategoriesPageProps) {
  const rootCategories = getRootCategories(categories);

  return (
    <StoreLayout categories={categories}>
      <main className="py-10 sm:py-14">
        <Container>
          <Breadcrumb
            items={[
              { label: "Início", href: "/" },
              { label: "Categorias", href: "/categorias" },
            ]}
            className="mb-6"
          />
          <SectionTitle
            title="Categorias"
            subtitle="Explore nossas categorias e encontre o que você procura"
            align="left"
          />
          <CategoryList categories={rootCategories} />
          <p className="mt-8 text-center text-sm text-brand-gray">
            <Link href="/" className="underline hover:text-brand-black">
              Voltar para a Home
            </Link>
          </p>
        </Container>
      </main>
    </StoreLayout>
  );
}

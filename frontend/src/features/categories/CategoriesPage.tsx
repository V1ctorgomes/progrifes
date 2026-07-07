import Link from "next/link";
import { Breadcrumb, CategoryList, EmptyState } from "@/components/category";
import { StoreLayout } from "@/layouts/StoreLayout";
import { Button } from "@/components/ui/Button";
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
            subtitle={
              rootCategories.length > 0
                ? `${rootCategories.length} categoria${rootCategories.length > 1 ? "s" : ""} disponíve${rootCategories.length > 1 ? "is" : "l"}`
                : "Explore nossas categorias e encontre o que você procura"
            }
            align="left"
          />

          {rootCategories.length > 0 ? (
            <CategoryList categories={rootCategories} />
          ) : (
            <EmptyState
              title="Nenhuma categoria disponível"
              description="Novas categorias serão exibidas aqui assim que forem publicadas."
              action={
                <Link href="/">
                  <Button variant="outline">Voltar para a Home</Button>
                </Link>
              }
            />
          )}
        </Container>
      </main>
    </StoreLayout>
  );
}

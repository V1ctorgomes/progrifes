import Link from "next/link";
import {
  Breadcrumb,
  CategoryBanner,
  CategoryGrid,
  CategoryNavigation,
  EmptyState,
} from "@/components/category";
import { ProductCard } from "@/components/home/ProductCard";
import { StoreLayout } from "@/layouts/StoreLayout";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Input } from "@/components/ui/Input";
import {
  getBreadcrumbTrail,
  getCategoryBySlug,
  getProductsForCategoryTree,
  getSubcategories,
} from "@/lib/categories";
import { mockCategories } from "@/lib/mock-categories";
import { allProducts } from "@/lib/mock-data";

interface CategoryDetailPageProps {
  slug: string;
}

export function CategoryDetailPage({ slug }: CategoryDetailPageProps) {
  const category = getCategoryBySlug(mockCategories, slug);

  if (!category) {
    return (
      <StoreLayout categories={mockCategories}>
        <main className="py-16">
          <Container>
            <EmptyState
              title="Categoria não encontrada"
              description="A categoria que você procura não existe ou foi desativada."
              action={
                <Link href="/categorias">
                  <Button>Ver categorias</Button>
                </Link>
              }
            />
          </Container>
        </main>
      </StoreLayout>
    );
  }

  const breadcrumb = getBreadcrumbTrail(mockCategories, slug);
  const products = getProductsForCategoryTree(allProducts, mockCategories, slug);
  const subcategories = getSubcategories(mockCategories, category.id);

  return (
    <StoreLayout categories={mockCategories}>
      <main>
        <CategoryBanner category={category} />

        <Container className="py-8 sm:py-12">
          <Breadcrumb items={breadcrumb} className="mb-6" />

          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold uppercase tracking-wider text-brand-black sm:text-4xl">
              {category.nome}
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-brand-gray sm:text-base">
              {category.descricao}
            </p>
            <p className="mt-2 text-xs text-brand-gray">{category.productCount} produtos</p>
          </div>

          <CategoryNavigation
            categories={mockCategories}
            currentCategory={category}
            className="mb-10"
          />

          {subcategories.length > 0 && (
            <section className="mb-12" aria-label="Subcategorias">
              <h2 className="mb-6 font-display text-xl font-bold uppercase tracking-wider text-brand-black">
                Subcategorias
              </h2>
              <CategoryGrid categories={subcategories} variant="home" columns={3} />
            </section>
          )}

          <section aria-label="Produtos da categoria">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-xl font-bold uppercase tracking-wider text-brand-black">
                Produtos
              </h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  type="search"
                  placeholder="Buscar nesta categoria..."
                  aria-label="Buscar produtos na categoria"
                  disabled
                  className="sm:w-64"
                />
                <Button variant="outline" size="sm" disabled>
                  Filtros
                </Button>
              </div>
            </div>

            {products.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <div className="mt-10 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled>
                    Anterior
                  </Button>
                  <span className="px-4 text-sm text-brand-gray">Página 1 de 1</span>
                  <Button variant="outline" size="sm" disabled>
                    Próxima
                  </Button>
                </div>
              </>
            ) : (
              <EmptyState
                title="Nenhum produto encontrado"
                description="Em breve teremos novidades nesta categoria. Enquanto isso, explore outras seções da loja."
                action={
                  <Link href="/categorias">
                    <Button>Ver categorias</Button>
                  </Link>
                }
              />
            )}
          </section>
        </Container>
      </main>
    </StoreLayout>
  );
}

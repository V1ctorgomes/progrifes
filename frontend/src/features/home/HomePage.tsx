import type { Banner } from "@/types/banner";
import type { Category } from "@/types/category";
import type { Product as StoreProduct } from "@/types/home";
import Link from "next/link";
import {
  BannerHorizontal,
  BannerInstitucional,
  BannerPromocional,
  HeroSlider,
} from "@/components/banner";
import { CategoryGrid } from "@/components/category";
import { BenefitCard } from "@/components/home/BenefitCard";
import { CollectionCard } from "@/components/home/CollectionCard";
import { ProductCard } from "@/components/home/ProductCard";
import { WhatsAppCTA } from "@/components/home/WhatsAppCTA";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { StoreLayout } from "@/layouts/StoreLayout";
import { getBannersByType } from "@/lib/banners";
import { getHomeCategories, getRootCategories, hasMoreHomeCategories } from "@/lib/categories";
import { benefits, collections } from "@/lib/mock-data";

interface HomePageProps {
  banners: Banner[];
  categories: Category[];
  featuredProducts: StoreProduct[];
  recentProducts: StoreProduct[];
}

export function HomePage({
  banners,
  categories,
  featuredProducts,
  recentProducts,
}: HomePageProps) {
  const heroBanners = getBannersByType(banners, "hero");
  const horizontalBanners = getBannersByType(banners, "horizontal");
  const promotionalBanners = getBannersByType(banners, "promocional");
  const institutionalBanners = getBannersByType(banners, "institucional");
  const rootCategories = getRootCategories(categories);
  const homeCategories = getHomeCategories(categories);
  const showMoreCategories = hasMoreHomeCategories(categories);

  return (
    <StoreLayout categories={categories}>
      <main>
        <HeroSlider banners={heroBanners} />

        {rootCategories.length > 0 ? (
          <section id="categorias" className="py-16 sm:py-20" aria-label="Categorias em destaque">
            <Container>
              <SectionTitle
                title="Categorias"
                subtitle="Explore nossas principais categorias"
                action={
                  showMoreCategories ? (
                    <Link href="/categorias">
                      <Button variant="outline">Ver mais</Button>
                    </Link>
                  ) : undefined
                }
              />
              <CategoryGrid categories={homeCategories} variant="home" columns={4} />
            </Container>
          </section>
        ) : null}

        {horizontalBanners.map((banner) => (
          <BannerHorizontal key={banner.id} banner={banner} />
        ))}

        <section id="produtos" className="bg-white py-16 sm:py-20" aria-label="Produtos em destaque">
          <Container>
            <SectionTitle
              title="Chegou agora"
              subtitle="As novidades mais recentes da temporada"
            />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Container>
        </section>

        {promotionalBanners.length > 0 && (
          <section id="promocoes" className="py-16 sm:py-20" aria-label="Promoções">
            <Container>
              <SectionTitle title="Promoções" subtitle="Aproveite as melhores ofertas" />
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                {promotionalBanners.map((banner) => (
                  <BannerPromocional key={banner.id} banner={banner} />
                ))}
              </div>
            </Container>
          </section>
        )}

        <section className="py-16 sm:py-20" aria-label="Coleções">
          <Container>
            <SectionTitle title="Coleções" subtitle="Campanhas e lançamentos exclusivos" />
            <div className="space-y-16 sm:space-y-20">
              {collections.map((collection, index) => (
                <CollectionCard
                  key={collection.id}
                  collection={collection}
                  reversed={index % 2 !== 0}
                />
              ))}
            </div>
          </Container>
        </section>

        <section className="border-y border-neutral-100 bg-white py-16 sm:py-20" aria-label="Benefícios">
          <Container>
            <SectionTitle title="Por que comprar conosco?" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => (
                <BenefitCard key={benefit.id} benefit={benefit} />
              ))}
            </div>
          </Container>
        </section>

        {institutionalBanners.map((banner) => (
          <BannerInstitucional key={banner.id} banner={banner} />
        ))}

        <section className="py-16 sm:py-20" aria-label="Produtos recentes">
          <Container>
            <SectionTitle title="Mais vendidos" subtitle="Os favoritos dos nossos clientes" />
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {recentProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </Container>
        </section>

        <WhatsAppCTA />
      </main>
    </StoreLayout>
  );
}

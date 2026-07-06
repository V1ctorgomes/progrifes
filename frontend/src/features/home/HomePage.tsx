import { Banner } from "@/components/home/Banner";
import { BenefitCard } from "@/components/home/BenefitCard";
import { CategoryStrip } from "@/components/home/CategoryStrip";
import { CollectionCard } from "@/components/home/CollectionCard";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { Navbar } from "@/components/home/Navbar";
import { ProductCard } from "@/components/home/ProductCard";
import { WhatsAppCTA } from "@/components/home/WhatsAppCTA";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import {
  benefits,
  categories,
  collections,
  featuredProducts,
  heroSlides,
  institutionalBanner,
  recentProducts,
} from "@/lib/mock-data";

export function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero slides={heroSlides} />
        <CategoryStrip categories={categories} />

        <section id="produtos" className="bg-brand-light py-16 sm:py-20" aria-label="Produtos em destaque">
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

        <section className="border-y border-neutral-200 bg-brand-white py-16 sm:py-20" aria-label="Benefícios">
          <Container>
            <SectionTitle title="Por que comprar conosco?" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {benefits.map((benefit) => (
                <BenefitCard key={benefit.id} benefit={benefit} />
              ))}
            </div>
          </Container>
        </section>

        <Banner data={institutionalBanner} />

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
      <Footer />
    </>
  );
}

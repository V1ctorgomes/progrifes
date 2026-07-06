import { CategoryStrip } from "@/components/home/CategoryStrip";
import { CookieBanner } from "@/components/home/CookieBanner";
import { Footer } from "@/components/home/Footer";
import { Hero } from "@/components/home/Hero";
import { InstagramSection } from "@/components/home/InstagramSection";
import { Navbar } from "@/components/home/Navbar";
import { NewsletterSection } from "@/components/home/NewsletterSection";
import { ProductCard } from "@/components/home/ProductCard";
import { Container } from "@/components/ui/Container";
import { ProductSection } from "@/components/ui/SectionTitle";
import {
  bestSellers,
  categories,
  heroSlides,
  newArrivals,
  outletProducts,
} from "@/lib/mock-data";

export function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero slides={heroSlides} />
        <CategoryStrip categories={categories} />

        <Container>
          <ProductSection id="produtos" title="Chegou agora">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductSection>

          <ProductSection id="mais-vendidos" title="Mais vendidos">
            {bestSellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductSection>

          <ProductSection id="outlet" title="Outlet" className="pb-14 sm:pb-20">
            {outletProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ProductSection>
        </Container>

        <InstagramSection />
        <NewsletterSection />
      </main>
      <Footer />
      <CookieBanner />
    </>
  );
}

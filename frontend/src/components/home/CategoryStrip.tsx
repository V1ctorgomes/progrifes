import { CategoryCard } from "@/components/home/CategoryCard";
import { Container } from "@/components/ui/Container";
import { SectionTitle } from "@/components/ui/SectionTitle";
import type { Category } from "@/types/home";

interface CategoryStripProps {
  categories: Category[];
}

export function CategoryStrip({ categories }: CategoryStripProps) {
  return (
    <section id="categorias" className="py-10 sm:py-14" aria-label="Categorias em destaque">
      <Container>
        <SectionTitle
          title="Categorias"
          subtitle="Explore nossas principais categorias"
        />
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide sm:justify-center sm:gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      </Container>
    </section>
  );
}

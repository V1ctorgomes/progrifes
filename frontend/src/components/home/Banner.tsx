import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { InstitutionalBanner } from "@/types/home";

interface BannerProps {
  data: InstitutionalBanner;
}

export function Banner({ data }: BannerProps) {
  return (
    <section id="sobre" className="bg-brand-light py-16 sm:py-20" aria-label="Sobre a marca">
      <Container>
        <div className="grid items-center gap-8 overflow-hidden md:grid-cols-2 md:gap-12">
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={data.image}
              alt={data.title}
              fill
              loading="lazy"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-brand-accent">
              Nossa marca
            </p>
            <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-brand-black sm:text-3xl">
              {data.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-brand-gray sm:text-base">
              {data.description}
            </p>
            <div className="mt-8">
              <Button variant="outline">{data.cta}</Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

import { BannerButton } from "@/components/banner/BannerButton";
import { BannerCard } from "@/components/banner/BannerCard";
import { BannerImage } from "@/components/banner/BannerImage";
import { Container } from "@/components/ui/Container";
import type { Banner } from "@/types/banner";

interface BannerInstitucionalProps {
  banner: Banner;
}

export function BannerInstitucional({ banner }: BannerInstitucionalProps) {
  return (
    <BannerCard id="sobre" className="bg-white py-16 sm:py-20" ariaLabel="Sobre a marca">
      <Container>
        <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 shadow-sm">
            <BannerImage banner={banner} sizes="(max-width: 768px) 100vw, 50vw" />
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-brand-accent">
              Nossa marca
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-brand-black sm:text-3xl">
              {banner.titulo}
            </h2>
            {banner.descricao && (
              <p className="mt-4 text-sm leading-relaxed text-neutral-500 sm:text-base">
                {banner.descricao}
              </p>
            )}
            {banner.textoBotaoPrimario && (
              <div className="mt-8">
                <BannerButton href={banner.linkPrimario} variant="outline">
                  {banner.textoBotaoPrimario}
                </BannerButton>
              </div>
            )}
          </div>
        </div>
      </Container>
    </BannerCard>
  );
}

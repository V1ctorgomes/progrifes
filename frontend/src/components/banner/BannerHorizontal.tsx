import { BannerButton } from "@/components/banner/BannerButton";
import { BannerCard } from "@/components/banner/BannerCard";
import { BannerImage } from "@/components/banner/BannerImage";
import { Container } from "@/components/ui/Container";
import type { Banner } from "@/types/banner";

interface BannerHorizontalProps {
  banner: Banner;
}

export function BannerHorizontal({ banner }: BannerHorizontalProps) {
  return (
    <BannerCard ariaLabel={banner.nome}>
      <Container className="py-8 sm:py-10">
        <div className="relative overflow-hidden">
          <div className="relative aspect-[16/7] sm:aspect-[21/7]">
            <BannerImage banner={banner} sizes="(max-width: 768px) 100vw, 1280px" overlay />
            <div className="absolute inset-0 flex items-center">
              <div className="px-6 py-8 text-brand-white sm:px-12">
                <h2 className="font-display text-2xl font-bold uppercase tracking-wider sm:text-3xl">
                  {banner.titulo}
                </h2>
                {banner.descricao && (
                  <p className="mt-3 max-w-lg text-sm leading-relaxed text-neutral-200 sm:text-base">
                    {banner.descricao}
                  </p>
                )}
                {banner.textoBotaoPrimario && (
                  <div className="mt-6">
                    <BannerButton href={banner.linkPrimario} variant="secondary">
                      {banner.textoBotaoPrimario}
                    </BannerButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </BannerCard>
  );
}

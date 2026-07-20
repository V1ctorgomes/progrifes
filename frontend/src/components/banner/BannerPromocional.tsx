import { BannerButton } from "@/components/banner/BannerButton";
import { BannerCard } from "@/components/banner/BannerCard";
import { BannerImage } from "@/components/banner/BannerImage";
import type { Banner } from "@/types/banner";

interface BannerPromocionalProps {
  banner: Banner;
}

export function BannerPromocional({ banner }: BannerPromocionalProps) {
  return (
    <BannerCard ariaLabel={banner.nome} className="group">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50 shadow-sm sm:aspect-[21/9]">
        <BannerImage
          banner={banner}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-5 text-brand-white sm:p-8">
          {banner.subtitulo && (
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-brand-accent">
              {banner.subtitulo}
            </p>
          )}
          <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            {banner.titulo}
          </h2>
          {banner.descricao && (
            <p className="mt-2 max-w-md text-sm text-neutral-200">{banner.descricao}</p>
          )}
          {banner.textoBotaoPrimario && (
            <div className="mt-4">
              <BannerButton href={banner.linkPrimario} variant="secondary">
                {banner.textoBotaoPrimario}
              </BannerButton>
            </div>
          )}
        </div>
      </div>
    </BannerCard>
  );
}

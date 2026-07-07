import { BadRequestException } from "@nestjs/common";
import { BannerType } from "@prisma/client";

export const BANNER_LIMITS: Partial<Record<BannerType, number>> = {
  [BannerType.HERO]: 3,
  [BannerType.HORIZONTAL]: 2,
  [BannerType.INSTITUCIONAL]: 1,
};

const BANNER_TYPE_LABELS: Record<BannerType, { singular: string; plural: string }> = {
  [BannerType.HERO]: { singular: "banner principal", plural: "banners principais" },
  [BannerType.HORIZONTAL]: { singular: "banner secundário", plural: "banners secundários" },
  [BannerType.PROMOCIONAL]: { singular: "banner promocional", plural: "banners promocionais" },
  [BannerType.INSTITUCIONAL]: { singular: "banner institucional", plural: "banners institucionais" },
};

export function getBannerTypeLabel(tipo: BannerType, plural = false): string {
  const labels = BANNER_TYPE_LABELS[tipo];
  return plural ? labels.plural : labels.singular;
}

export function assertBannerTypeLimit(
  tipo: BannerType,
  currentCount: number,
): void {
  const limit = BANNER_LIMITS[tipo];
  if (limit === undefined) return;

  if (currentCount >= limit) {
    const label = getBannerTypeLabel(tipo, limit > 1);
    throw new BadRequestException(
      `É permitido no máximo ${limit} ${label}.`,
    );
  }
}

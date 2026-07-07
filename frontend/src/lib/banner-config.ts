import type { Banner, BannerType } from "@/types/banner";

export const BANNER_TYPE_LABELS: Record<BannerType, string> = {
  hero: "Principal",
  horizontal: "Secundário",
  promocional: "Promocional",
  institucional: "Institucional",
};

export const BANNER_LIMITS: Partial<Record<BannerType, number>> = {
  hero: 3,
  horizontal: 2,
  promocional: 2,
  institucional: 1,
};

export function getBannerTypeLabel(tipo: BannerType): string {
  return BANNER_TYPE_LABELS[tipo];
}

export function countBannersByType(
  banners: Banner[],
  tipo: BannerType,
  excludeId?: string,
): number {
  return banners.filter((banner) => banner.tipo === tipo && banner.id !== excludeId).length;
}

export function isBannerTypeAtLimit(
  banners: Banner[],
  tipo: BannerType,
  excludeId?: string,
): boolean {
  const limit = BANNER_LIMITS[tipo];
  if (limit === undefined) return false;
  return countBannersByType(banners, tipo, excludeId) >= limit;
}

const BANNER_TYPE_LIMIT_LABELS: Partial<Record<BannerType, { one: string; many: string }>> = {
  hero: { one: "principal", many: "principais" },
  horizontal: { one: "secundário", many: "secundários" },
  promocional: { one: "promocional", many: "promocionais" },
  institucional: { one: "institucional", many: "institucionais" },
};

function formatBannerLimitLabel(tipo: BannerType, limit: number): string {
  const labels = BANNER_TYPE_LIMIT_LABELS[tipo];
  if (!labels) return BANNER_TYPE_LABELS[tipo].toLowerCase();
  return limit > 1 ? labels.many : labels.one;
}

export function getBannerLimitMessage(tipo: BannerType): string | null {
  const limit = BANNER_LIMITS[tipo];
  if (limit === undefined) return null;

  const label = formatBannerLimitLabel(tipo, limit);
  return `Máximo de ${limit} banner${limit > 1 ? "s" : ""} ${label}.`;
}

export function getBannerLimitError(
  banners: Banner[],
  tipo: BannerType,
  excludeId?: string,
): string | null {
  if (!isBannerTypeAtLimit(banners, tipo, excludeId)) return null;

  const limit = BANNER_LIMITS[tipo];
  if (!limit) return null;

  const label = formatBannerLimitLabel(tipo, limit);
  return `Limite atingido: máximo de ${limit} banner${limit > 1 ? "s" : ""} ${label}.`;
}

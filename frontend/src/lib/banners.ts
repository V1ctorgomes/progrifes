import type { Banner, BannerType } from "@/types/banner";

export function getActiveBanners(banners: Banner[]): Banner[] {
  return banners.filter((b) => b.ativo).sort((a, b) => a.ordem - b.ordem);
}

export function getBannersByType(banners: Banner[], tipo: BannerType): Banner[] {
  return getActiveBanners(banners).filter((b) => b.tipo === tipo);
}

export function getBannerImage(banner: Banner, isMobile: boolean): string {
  if (isMobile && banner.imagemMobile) {
    return banner.imagemMobile;
  }
  return banner.imagemDesktop;
}

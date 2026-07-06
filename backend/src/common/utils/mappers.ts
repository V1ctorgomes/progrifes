import { BannerType } from "@prisma/client";

export function bannerTypeToClient(tipo: BannerType): string {
  return tipo.toLowerCase();
}

export function bannerTypeFromClient(tipo: string): BannerType {
  return tipo.toUpperCase() as BannerType;
}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

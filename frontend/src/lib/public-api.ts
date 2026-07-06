import type { Banner } from "@/types/banner";
import type { Category } from "@/types/category";
import { getBackendUrl } from "@/lib/auth-config";

async function fetchPublic<T>(path: string): Promise<T> {
  const response = await fetch(`${getBackendUrl()}${path}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }

  return response.json() as Promise<T>;
}

export function getPublicBanners(): Promise<Banner[]> {
  return fetchPublic<Banner[]>("/api/banners");
}

export function getPublicCategories(): Promise<Category[]> {
  return fetchPublic<Category[]>("/api/categories");
}

export function getPublicCategoryBySlug(slug: string): Promise<Category> {
  return fetchPublic<Category>(`/api/categories/slug/${slug}`);
}

import type { Banner } from "@/types/banner";
import type { Category } from "@/types/category";
import type { Product as ApiProduct, ProductsListResponse } from "@/types/product";
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

export function getPublicProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  categorySlug?: string;
  destaque?: boolean;
  novo?: boolean;
}): Promise<ProductsListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);
  if (params?.categoryId) query.set("categoryId", params.categoryId);
  if (params?.categorySlug) query.set("categorySlug", params.categorySlug);
  if (params?.destaque !== undefined) query.set("destaque", String(params.destaque));
  if (params?.novo !== undefined) query.set("novo", String(params.novo));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  return fetchPublic<ProductsListResponse>(`/api/products${suffix}`);
}

export function getPublicProductBySlug(slug: string): Promise<ApiProduct> {
  return fetchPublic<ApiProduct>(`/api/products/slug/${slug}`);
}

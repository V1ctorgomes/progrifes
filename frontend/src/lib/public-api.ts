import type { Banner } from "@/types/banner";
import type { Category } from "@/types/category";
import type { Product as ApiProduct, ProductsListResponse } from "@/types/product";
import { getBackendUrl } from "@/lib/auth-config";

const EMPTY_PRODUCTS_RESPONSE: ProductsListResponse = {
  data: [],
  meta: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

async function fetchPublic<T>(path: string, fallback: T): Promise<T> {
  const backendUrl = getBackendUrl().replace(/\/$/, "");

  try {
    const response = await fetch(`${backendUrl}${path}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(`[public-api] ${path} respondeu ${response.status} (${backendUrl})`);
      return fallback;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.error(`[public-api] falha ao carregar ${path} (${backendUrl})`, error);
    return fallback;
  }
}

export function getPublicBanners(): Promise<Banner[]> {
  return fetchPublic<Banner[]>("/api/banners", []);
}

export function getPublicCategories(): Promise<Category[]> {
  return fetchPublic<Category[]>("/api/categories", []);
}

export function getPublicCategoryBySlug(slug: string): Promise<Category | null> {
  return fetchPublic<Category | null>(`/api/categories/slug/${slug}`, null);
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
  return fetchPublic<ProductsListResponse>(`/api/products${suffix}`, EMPTY_PRODUCTS_RESPONSE);
}

export function getPublicProductBySlug(slug: string): Promise<ApiProduct | null> {
  return fetchPublic<ApiProduct | null>(`/api/products/slug/${slug}`, null);
}

import axios, { isAxiosError } from "axios";
import type { Banner, BannerType } from "@/types/banner";
import type { Category } from "@/types/category";
import type { Product, ProductInput, ProductsListResponse } from "@/types/product";

const api = axios.create({
  baseURL: "/api/admin",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message[0];
    if (typeof message === "string") return message;
  }
  return "Não foi possível completar a requisição";
}

export type BannerInput = {
  nome?: string;
  titulo: string;
  subtitulo?: string;
  descricao?: string;
  imagemDesktop: string;
  imagemMobile?: string;
  tipo: BannerType | string;
  link?: string;
  textoBotaoPrimario?: string;
  textoBotaoSecundario?: string;
  linkPrimario?: string;
  linkSecundario?: string;
  ordem?: number;
  ativo?: boolean;
};

export type CategoryInput = {
  nome: string;
  slug?: string;
  descricao: string;
  imagem: string;
  banner: string;
  categoriaPaiId?: string | null;
  ordem?: number;
  ativo?: boolean;
};

export const bannersAdminApi = {
  list: async () => (await api.get<Banner[]>("/banners")).data,
  create: async (data: BannerInput) => (await api.post<Banner>("/banners", data)).data,
  update: async (id: string, data: Partial<BannerInput>) =>
    (await api.put<Banner>(`/banners/${id}`, data)).data,
  remove: async (id: string) => (await api.delete(`/banners/${id}`)).data,
  activate: async (id: string) => (await api.patch<Banner>(`/banners/${id}/activate`)).data,
  deactivate: async (id: string) => (await api.patch<Banner>(`/banners/${id}/deactivate`)).data,
  reorder: async (ids: string[]) => (await api.patch<Banner[]>("/banners/reorder", { ids })).data,
};

export const categoriesAdminApi = {
  list: async () => (await api.get<Category[]>("/categories")).data,
  create: async (data: CategoryInput) => (await api.post<Category>("/categories", data)).data,
  update: async (id: string, data: Partial<CategoryInput>) =>
    (await api.put<Category>(`/categories/${id}`, data)).data,
  remove: async (id: string) => (await api.delete(`/categories/${id}`)).data,
  activate: async (id: string) => (await api.patch<Category>(`/categories/${id}/activate`)).data,
  deactivate: async (id: string) =>
    (await api.patch<Category>(`/categories/${id}/deactivate`)).data,
  reorder: async (ids: string[]) =>
    (await api.patch<Category[]>("/categories/reorder", { ids })).data,
};

export const productsAdminApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    ativo?: boolean;
    destaque?: boolean;
    novo?: boolean;
  }) => (await api.get<ProductsListResponse>("/products", { params })).data,
  create: async (data: ProductInput) => (await api.post<Product>("/products", data)).data,
  update: async (id: string, data: Partial<ProductInput>) =>
    (await api.put<Product>(`/products/${id}`, data)).data,
  remove: async (id: string) => (await api.delete(`/products/${id}`)).data,
  activate: async (id: string) => (await api.patch<Product>(`/products/${id}/activate`)).data,
  deactivate: async (id: string) => (await api.patch<Product>(`/products/${id}/deactivate`)).data,
  duplicate: async (id: string) => (await api.post<Product>(`/products/${id}/duplicate`)).data,
};

export { getErrorMessage };

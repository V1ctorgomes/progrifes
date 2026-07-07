import axios, { isAxiosError } from "axios";
import type { Banner, BannerType } from "@/types/banner";
import type { Attribute, AttributeInput } from "@/types/attribute";
import type { Category } from "@/types/category";
import type { Product, ProductInput, ProductsListResponse } from "@/types/product";
import type {
  Order,
  OrderHistoryEntry,
  OrdersDashboard,
  OrdersListResponse,
  OrderStatus,
} from "@/types/order";
import type {
  Customer,
  CustomerAddress,
  CustomerAddressInput,
  CustomerCrm,
  CustomerInput,
  CustomerNote,
  CustomerOrdersResponse,
  CustomersListResponse,
  CustomerStatistics,
  CustomerTag,
  CustomerTimelineEntry,
} from "@/types/customer";
import type { InventoryAlerts, InventoryListItem, InventoryListResponse } from "@/types/inventory";
import type {
  CreateInventoryEntryInput,
  InventoryEntriesListResponse,
  InventoryEntryDetail,
} from "@/types/inventory-entry";
import type {
  BulkUpdateVariantsInput,
  GenerateVariantsInput,
  ProductVariant,
  VariantInput,
  VariantsListResponse,
} from "@/types/variant";

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
  getById: async (id: string) => (await api.get<Product>(`/products/${id}`)).data,
  create: async (data: ProductInput) => (await api.post<Product>("/products", data)).data,
  update: async (id: string, data: Partial<ProductInput>) =>
    (await api.put<Product>(`/products/${id}`, data)).data,
  remove: async (id: string) => (await api.delete(`/products/${id}`)).data,
  activate: async (id: string) => (await api.patch<Product>(`/products/${id}/activate`)).data,
  deactivate: async (id: string) => (await api.patch<Product>(`/products/${id}/deactivate`)).data,
  duplicate: async (id: string) => (await api.post<Product>(`/products/${id}/duplicate`)).data,
};

export const customersAdminApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    cidade?: string;
    bairro?: string;
    ativo?: boolean;
  }) => (await api.get<CustomersListResponse>("/customers", { params })).data,
  getById: async (id: string) => (await api.get<Customer>(`/customers/${id}`)).data,
  create: async (data: CustomerInput) => (await api.post<Customer>("/customers", data)).data,
  update: async (id: string, data: Partial<CustomerInput>) =>
    (await api.put<Customer>(`/customers/${id}`, data)).data,
  remove: async (id: string) => (await api.delete(`/customers/${id}`)).data,
  activate: async (id: string) =>
    (await api.patch<Customer>(`/customers/${id}/activate`)).data,
  deactivate: async (id: string) =>
    (await api.patch<Customer>(`/customers/${id}/deactivate`)).data,
  addAddress: async (id: string, data: CustomerAddressInput) =>
    (await api.post<CustomerAddress>(`/customers/${id}/addresses`, data)).data,
  updateAddress: async (id: string, addressId: string, data: CustomerAddressInput) =>
    (await api.put<CustomerAddress>(`/customers/${id}/addresses/${addressId}`, data)).data,
  removeAddress: async (id: string, addressId: string) =>
    (await api.delete(`/customers/${id}/addresses/${addressId}`)).data,
  setPrincipalAddress: async (id: string, addressId: string) =>
    (await api.patch<Customer>(`/customers/${id}/addresses/${addressId}/principal`)).data,
  getStatistics: async (id: string) =>
    (await api.get<CustomerStatistics>(`/customers/${id}/statistics`)).data,
  getHistory: async (id: string) =>
    (await api.get<CustomerTimelineEntry[]>(`/customers/${id}/history`)).data,
  getOrders: async (id: string, params?: { page?: number; limit?: number }) =>
    (await api.get<CustomerOrdersResponse>(`/customers/${id}/orders`, { params })).data,
  getNotes: async (id: string) => (await api.get<CustomerNote[]>(`/customers/${id}/notes`)).data,
  createNote: async (id: string, descricao: string) =>
    (await api.post<CustomerNote>(`/customers/${id}/notes`, { descricao })).data,
  deleteNote: async (id: string, noteId: string) =>
    (await api.delete(`/customers/${id}/notes/${noteId}`)).data,
  getCrm: async (id: string) => (await api.get<CustomerCrm>(`/customers/${id}/crm`)).data,
  updateCrm: async (
    id: string,
    data: {
      origem?: string | null;
      canalAtendimento?: string | null;
      responsavelId?: string | null;
      observacoesComerciais?: string | null;
    },
  ) => (await api.patch<CustomerCrm>(`/customers/${id}/crm`, data)).data,
  listTags: async () => (await api.get<CustomerTag[]>("/customers/tags")).data,
  createTag: async (data: { nome: string; cor?: string }) =>
    (await api.post<CustomerTag>("/customers/tags", data)).data,
  assignTag: async (id: string, data: { tagId?: string; nome?: string; cor?: string }) =>
    (await api.post<CustomerCrm>(`/customers/${id}/tags`, data)).data,
  removeTag: async (id: string, tagId: string) =>
    (await api.delete(`/customers/${id}/tags/${tagId}`)).data,
};

export const inventoryAdminApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    categoriaId?: string;
    produtoId?: string;
    produtoAtivo?: boolean;
    sort?: string;
  }) => (await api.get<InventoryListResponse>("/inventory", { params })).data,
  getByVariantId: async (variantId: string) =>
    (await api.get<InventoryListItem>(`/inventory/${variantId}`)).data,
  getAlerts: async () => (await api.get<InventoryAlerts>("/inventory/alerts")).data,
  getLowStock: async () => (await api.get<InventoryListItem[]>("/inventory/low-stock")).data,
  getOutOfStock: async () =>
    (await api.get<InventoryListItem[]>("/inventory/out-of-stock")).data,
  listEntries: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    tipo?: string;
    produtoId?: string;
    categoriaId?: string;
    fornecedor?: string;
    usuarioId?: string;
    dataInicio?: string;
    dataFim?: string;
  }) => (await api.get<InventoryEntriesListResponse>("/inventory/entries", { params })).data,
  getEntryById: async (id: string) =>
    (await api.get<InventoryEntryDetail>(`/inventory/entries/${id}`)).data,
  createEntry: async (data: CreateInventoryEntryInput) =>
    (await api.post<InventoryEntryDetail>("/inventory/entries", data)).data,
};

export const variantsAdminApi = {
  list: async (params?: {
    produtoId?: string;
    search?: string;
    page?: number;
    limit?: number;
    ativo?: boolean;
  }) => (await api.get<VariantsListResponse>("/variants", { params })).data,
  listByProduct: async (productId: string) =>
    (await api.get<ProductVariant[]>(`/products/${productId}/variants`)).data,
  create: async (data: VariantInput) => (await api.post<ProductVariant>("/variants", data)).data,
  update: async (id: string, data: Partial<VariantInput>) =>
    (await api.put<ProductVariant>(`/variants/${id}`, data)).data,
  remove: async (id: string) => (await api.delete(`/variants/${id}`)).data,
  activate: async (id: string) => (await api.patch<ProductVariant>(`/variants/${id}/activate`)).data,
  deactivate: async (id: string) =>
    (await api.patch<ProductVariant>(`/variants/${id}/deactivate`)).data,
  generate: async (data: GenerateVariantsInput) =>
    (await api.post<{ created: ProductVariant[]; total: number }>("/variants/generate", data)).data,
  bulkUpdate: async (data: BulkUpdateVariantsInput) =>
    (await api.patch<ProductVariant[]>("/variants/bulk", data)).data,
};

export const attributesAdminApi = {
  list: async () => (await api.get<Attribute[]>("/attributes")).data,
  create: async (data: AttributeInput) => (await api.post<Attribute>("/attributes", data)).data,
  update: async (id: string, data: Partial<AttributeInput>) =>
    (await api.put<Attribute>(`/attributes/${id}`, data)).data,
  remove: async (id: string) => (await api.delete(`/attributes/${id}`)).data,
  addValue: async (attributeId: string, valor: string) =>
    (await api.post(`/attributes/${attributeId}/values`, { valor })).data,
  removeValue: async (valueId: string) =>
    (await api.delete(`/attributes/values/${valueId}`)).data,
};

export const ordersAdminApi = {
  list: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: OrderStatus;
    formaPagamento?: string;
    bairro?: string;
    dataInicio?: string;
    dataFim?: string;
    valorMin?: number;
    valorMax?: number;
    sort?: string;
  }) => (await api.get<OrdersListResponse>("/orders", { params })).data,
  dashboard: async () => (await api.get<OrdersDashboard>("/orders/dashboard")).data,
  getById: async (id: string) => (await api.get<Order>(`/orders/${id}`)).data,
  getHistory: async (id: string) =>
    (await api.get<OrderHistoryEntry[]>(`/orders/${id}/history`)).data,
  updateStatus: async (id: string, status: OrderStatus) =>
    (await api.patch<Order>(`/orders/${id}/status`, { status })).data,
  cancel: async (id: string, motivo: string) =>
    (await api.patch<Order>(`/orders/${id}/cancel`, { motivo })).data,
};

export { getErrorMessage };

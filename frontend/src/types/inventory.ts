export type InventoryStatus = "EM_ESTOQUE" | "ESTOQUE_BAIXO" | "SEM_ESTOQUE";

export type StockStatusKey = "em_estoque" | "estoque_baixo" | "sem_estoque";

export interface InventoryListItem {
  id: string;
  variantId: string;
  produtoId: string;
  produtoNome: string;
  produtoAtivo: boolean;
  varianteAtiva: boolean;
  categoriaId: string;
  categoriaNome: string;
  sku: string;
  atributos: Array<{ nome: string; valor: string }>;
  quantidadeTotal: number;
  quantidadeReservada: number;
  quantidadeDisponivel: number;
  estoqueMinimo: number;
  status: InventoryStatus;
  statusLabel: string;
  statusCor: string;
  statusKey: StockStatusKey;
  updatedAt: string;
}

export interface InventoryListResponse {
  data: InventoryListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryAlerts {
  estoqueBaixo: number;
  semEstoque: number;
  comReserva: number;
  itensBaixo: InventoryListItem[];
  itensSem: InventoryListItem[];
  itensReservados: InventoryListItem[];
}

export const STOCK_STATUS_FILTER_OPTIONS = [
  { value: "", label: "Todos os status" },
  { value: "EM_ESTOQUE", label: "Em Estoque" },
  { value: "ESTOQUE_BAIXO", label: "Estoque Baixo" },
  { value: "SEM_ESTOQUE", label: "Sem Estoque" },
] as const;

export const INVENTORY_SORT_OPTIONS = [
  { value: "disponivel_asc", label: "Menor estoque disponível" },
  { value: "disponivel_desc", label: "Maior estoque disponível" },
  { value: "total_asc", label: "Menor estoque total" },
  { value: "total_desc", label: "Maior estoque total" },
  { value: "nome", label: "Nome do produto" },
  { value: "categoria", label: "Categoria" },
  { value: "sku", label: "SKU" },
] as const;

export function formatVariantLabel(item: InventoryListItem) {
  if (item.atributos.length === 0) return "—";
  return item.atributos.map((attr) => attr.valor).join(" / ");
}

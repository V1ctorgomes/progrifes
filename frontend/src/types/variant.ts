export type StockStatus = "em_estoque" | "estoque_baixo" | "sem_estoque";

export interface VariantAttribute {
  attributeId: string;
  attributeNome: string;
  valueId: string;
  valor: string;
}

export interface VariantImage {
  id: string;
  url: string;
  ordem: number;
  principal: boolean;
}

export interface ProductVariant {
  id: string;
  produtoId: string;
  sku: string;
  codigoBarras?: string | null;
  preco: number;
  precoPromocional?: number | null;
  custo?: number | null;
  estoque: number;
  estoqueTotal?: number;
  estoqueReservado?: number;
  estoqueMinimo: number;
  statusEstoque: StockStatus;
  ativo: boolean;
  atributos: VariantAttribute[];
  imagens: VariantImage[];
  createdAt: string;
  updatedAt: string;
}

export interface VariantsListResponse {
  data: ProductVariant[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VariantInput {
  produtoId: string;
  sku: string;
  codigoBarras?: string;
  preco?: number;
  precoPromocional?: number;
  custo?: number;
  estoque?: number;
  estoqueMinimo?: number;
  ativo?: boolean;
  attributeValueIds: string[];
  imagens?: Array<{ url: string; ordem?: number; principal?: boolean }>;
}

export interface GenerateVariantsInput {
  produtoId: string;
  grupos: Array<{ attributeId: string; valueIds: string[] }>;
  estoqueInicial?: number;
  estoqueMinimo?: number;
}

export interface BulkUpdateVariantsInput {
  ids: string[];
  preco?: number;
  custo?: number;
  estoque?: number;
  estoqueMinimo?: number;
  ativo?: boolean;
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  em_estoque: "Em estoque",
  estoque_baixo: "Estoque baixo",
  sem_estoque: "Sem estoque",
};

export type InventoryAuditType =
  | "GERAL"
  | "PARCIAL"
  | "CATEGORIA"
  | "PRODUTO"
  | "VARIANTE";

export type InventoryAuditStatus =
  | "RASCUNHO"
  | "EM_ANDAMENTO"
  | "PAUSADO"
  | "FINALIZADO"
  | "CANCELADO";

export type InventoryAdjustmentType = "ENTRADA" | "SAIDA" | "NENHUM";

export interface InventoryAuditListItem {
  id: string;
  numero: number;
  numeroFormatado: string;
  nome: string;
  tipo: InventoryAuditType;
  tipoLabel: string;
  status: InventoryAuditStatus;
  statusLabel: string;
  responsavelNome: string;
  categoriaNome: string | null;
  produtoNome: string | null;
  totalItens: number;
  dataInventario: string;
  createdAt: string;
  finishedAt: string | null;
}

export interface InventoryAuditItem {
  id: string;
  variantId: string;
  produtoNome: string;
  categoriaNome: string;
  sku: string;
  varianteLabel: string;
  quantidadeSistema: number;
  quantidadeFisica: number | null;
  diferenca: number | null;
  tipoAjuste: InventoryAdjustmentType | null;
  tipoAjusteLabel: string | null;
  contado: boolean;
}

export interface InventoryAuditDetail extends InventoryAuditListItem {
  categoriaId: string | null;
  produtoId: string | null;
  variantId: string | null;
  variantSku: string | null;
  responsavelId: string;
  responsavelEmail: string;
  observacoes: string | null;
  resumo: {
    totalItens: number;
    itensConferidos: number;
    itensPendentes: number;
    divergencias: number;
    totalAjustado: number;
    contagemCompleta: boolean;
  };
  itens: InventoryAuditItem[];
}

export interface InventoryAuditsListResponse {
  data: InventoryAuditListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateInventoryAuditInput {
  nome: string;
  tipo: InventoryAuditType;
  dataInventario?: string;
  categoriaId?: string;
  produtoId?: string;
  variantId?: string;
  variantIds?: string[];
  observacoes?: string;
}

export const INVENTORY_AUDIT_TYPE_OPTIONS: Array<{
  value: InventoryAuditType;
  label: string;
}> = [
  { value: "GERAL", label: "Inventário Geral" },
  { value: "PARCIAL", label: "Inventário Parcial" },
  { value: "CATEGORIA", label: "Por Categoria" },
  { value: "PRODUTO", label: "Por Produto" },
  { value: "VARIANTE", label: "Por Variante" },
];

export const INVENTORY_AUDIT_STATUS_OPTIONS: Array<{
  value: InventoryAuditStatus | "";
  label: string;
}> = [
  { value: "", label: "Todos" },
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "EM_ANDAMENTO", label: "Em Andamento" },
  { value: "PAUSADO", label: "Pausado" },
  { value: "FINALIZADO", label: "Finalizado" },
  { value: "CANCELADO", label: "Cancelado" },
];

export const AUDIT_STATUS_COLORS: Record<InventoryAuditStatus, string> = {
  RASCUNHO: "#6b7280",
  EM_ANDAMENTO: "#2563eb",
  PAUSADO: "#f59e0b",
  FINALIZADO: "#16a34a",
  CANCELADO: "#ef4444",
};

export function formatAuditDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

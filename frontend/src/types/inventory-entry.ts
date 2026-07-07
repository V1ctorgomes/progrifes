export type InventoryEntryType =
  | "COMPRA"
  | "REPOSICAO"
  | "DEVOLUCAO_CLIENTE"
  | "AJUSTE_POSITIVO"
  | "PRODUCAO"
  | "OUTROS";

export interface InventoryEntryListItem {
  id: string;
  numero: number;
  numeroFormatado: string;
  variantId: string;
  produtoId: string;
  produtoNome: string;
  categoriaNome: string;
  sku: string;
  varianteLabel: string;
  tipo: InventoryEntryType;
  tipoLabel: string;
  quantidade: number;
  documento: string | null;
  fornecedor: string | null;
  usuarioId: string | null;
  responsavelNome: string | null;
  dataEntrada: string;
  createdAt: string;
}

export interface InventoryEntryDetail extends InventoryEntryListItem {
  valorUnitario: number | null;
  notaFiscal: string | null;
  observacoes: string | null;
  responsavelEmail: string | null;
  movimento: {
    id: string;
    saldoAnterior: number | null;
    saldoAtual: number | null;
    createdAt: string;
  } | null;
}

export interface InventoryEntriesListResponse {
  data: InventoryEntryListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateInventoryEntryInput {
  variantId: string;
  tipo: InventoryEntryType;
  quantidade: number;
  dataEntrada?: string;
  valorUnitario?: number;
  documento?: string;
  notaFiscal?: string;
  fornecedor?: string;
  observacoes?: string;
}

export const INVENTORY_ENTRY_TYPE_OPTIONS: Array<{
  value: InventoryEntryType;
  label: string;
}> = [
  { value: "COMPRA", label: "Compra" },
  { value: "REPOSICAO", label: "Reposição" },
  { value: "DEVOLUCAO_CLIENTE", label: "Devolução de Cliente" },
  { value: "AJUSTE_POSITIVO", label: "Ajuste Positivo" },
  { value: "PRODUCAO", label: "Produção" },
  { value: "OUTROS", label: "Outros" },
];

export function formatEntryDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

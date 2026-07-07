export type InventoryOutputType =
  | "PERDA"
  | "AVARIA"
  | "CONSUMO_INTERNO"
  | "DOACAO"
  | "AJUSTE_NEGATIVO"
  | "OUTROS";

export type InventoryOutputListType = InventoryOutputType | "VENDA";

export type InventoryMovementType =
  | "ENTRADA"
  | "SAIDA"
  | "RESERVA"
  | "LIBERACAO"
  | "BAIXA";

export type MovementSourceCategory = "ENTRADA" | "SAIDA" | "PEDIDO" | "INVENTARIO" | "OUTROS";

export interface InventoryOutputListItem {
  id: string;
  numero: number | null;
  numeroFormatado: string | null;
  variantId: string;
  produtoId: string;
  produtoNome: string;
  categoriaNome: string;
  sku: string;
  varianteLabel: string;
  tipo: InventoryMovementType;
  tipoLabel: string;
  tipoSaida: string | null;
  tipoSaidaLabel: string;
  automatica: boolean;
  origem: string | null;
  origemLabel: string | null;
  quantidade: number;
  saldoAnterior: number | null;
  saldoAtual: number | null;
  motivo: string | null;
  documento: string | null;
  usuarioId: string | null;
  responsavelNome: string | null;
  orderId: string | null;
  orderNumero: number | null;
  createdAt: string;
}

export interface InventoryOutputDetail extends InventoryOutputListItem {
  observacoes: string;
  responsavelEmail: string | null;
  orderNumeroFormatado: string | null;
  entryNumeroFormatado: string | null;
  categoriaOrigem: MovementSourceCategory;
  categoriaOrigemLabel: string;
}

export interface InventoryOutputsListResponse {
  data: InventoryOutputListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface InventoryMovementListItem {
  id: string;
  numero: number | null;
  numeroFormatado: string | null;
  variantId: string;
  produtoId: string;
  produtoNome: string;
  categoriaNome: string;
  sku: string;
  varianteLabel: string;
  tipo: InventoryMovementType;
  tipoLabel: string;
  origem: string | null;
  origemLabel: string | null;
  categoriaOrigem: MovementSourceCategory;
  categoriaOrigemLabel: string;
  quantidade: number;
  saldoAnterior: number | null;
  saldoAtual: number | null;
  motivo: string | null;
  documento: string | null;
  usuarioId: string | null;
  responsavelNome: string | null;
  orderId: string | null;
  orderNumero: number | null;
  entryId: string | null;
  entryNumero: number | null;
  createdAt: string;
}

export interface InventoryMovementDetail extends InventoryMovementListItem {
  observacoes: string;
  responsavelEmail: string | null;
  orderNumeroFormatado: string | null;
  entryNumeroFormatado: string | null;
  automatica: boolean;
}

export interface InventoryMovementsListResponse {
  data: InventoryMovementListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateInventoryOutputInput {
  variantId: string;
  tipo: InventoryOutputType;
  quantidade: number;
  motivo: string;
  documento?: string;
  observacoes?: string;
}

export const INVENTORY_OUTPUT_TYPE_OPTIONS: Array<{
  value: InventoryOutputType;
  label: string;
}> = [
  { value: "PERDA", label: "Perda" },
  { value: "AVARIA", label: "Avaria" },
  { value: "CONSUMO_INTERNO", label: "Consumo Interno" },
  { value: "DOACAO", label: "Doação" },
  { value: "AJUSTE_NEGATIVO", label: "Ajuste Negativo" },
  { value: "OUTROS", label: "Outros" },
];

export const INVENTORY_OUTPUT_FILTER_OPTIONS: Array<{
  value: InventoryOutputListType | "";
  label: string;
}> = [
  { value: "", label: "Todos" },
  { value: "VENDA", label: "Venda (pedido)" },
  ...INVENTORY_OUTPUT_TYPE_OPTIONS,
];

export const MOVEMENT_TYPE_OPTIONS: Array<{
  value: InventoryMovementType | "";
  label: string;
}> = [
  { value: "", label: "Todos" },
  { value: "ENTRADA", label: "Entrada" },
  { value: "SAIDA", label: "Saída" },
  { value: "RESERVA", label: "Reserva" },
  { value: "LIBERACAO", label: "Liberação" },
  { value: "BAIXA", label: "Baixa" },
];

export const MOVEMENT_SOURCE_OPTIONS: Array<{
  value: MovementSourceCategory | "";
  label: string;
}> = [
  { value: "", label: "Todas as origens" },
  { value: "ENTRADA", label: "Entradas" },
  { value: "SAIDA", label: "Saídas" },
  { value: "PEDIDO", label: "Pedidos" },
  { value: "INVENTARIO", label: "Inventário" },
];

export function formatMovementDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

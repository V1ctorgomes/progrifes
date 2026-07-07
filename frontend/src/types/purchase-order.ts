export type PurchaseOrderStatus =
  | "RASCUNHO"
  | "AGUARDANDO_APROVACAO"
  | "APROVADA"
  | "ENVIADA"
  | "RECEBIMENTO_PARCIAL"
  | "RECEBIDA"
  | "CANCELADA";

export interface PurchaseOrderStatusMeta {
  value: PurchaseOrderStatus;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  variantId: string;
  produtoNome: string;
  sku: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  subtotal: number;
}

export interface PurchaseOrderSupplier {
  id: string;
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  telefone: string;
  email?: string | null;
  endereco?: {
    cep: string;
    rua: string;
    numero: string;
    complemento?: string | null;
    bairro: string;
    cidade: string;
    estado: string;
  } | null;
}

export interface PurchaseOrderListItem {
  id: string;
  numero: number;
  numeroFormatado: string;
  supplierId: string;
  fornecedorNome: string;
  fornecedorRazaoSocial: string;
  status: PurchaseOrderStatus;
  statusLabel: string;
  statusCor: string;
  data: string;
  previsaoEntrega: string;
  subtotal: number;
  total: number;
  pedidoFornecedor?: string | null;
  responsavel?: { id: string; nome: string } | null;
  itensCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrder extends PurchaseOrderListItem {
  frete: number;
  desconto: number;
  observacoes?: string | null;
  motivoCancelamento?: string | null;
  aprovadaEm?: string | null;
  enviadaEm?: string | null;
  recebidaEm?: string | null;
  canceladaEm?: string | null;
  canEdit: boolean;
  nextStatuses: PurchaseOrderStatusMeta[];
  fornecedor: PurchaseOrderSupplier;
  itens: PurchaseOrderItem[];
}

export interface PurchaseOrdersListResponse {
  data: PurchaseOrderListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PurchaseOrdersDashboard {
  rascunho: number;
  aguardando: number;
  aprovadas: number;
  enviadas: number;
  recebidas: number;
  canceladas: number;
}

export interface PurchaseOrderHistoryEntry {
  id: string;
  status: PurchaseOrderStatus;
  statusLabel: string;
  descricao: string;
  usuario?: { id: string; nome: string; email: string } | null;
  createdAt: string;
}

export interface PurchaseOrderItemInput {
  id?: string;
  productId: string;
  variantId: string;
  quantidade: number;
  valorUnitario: number;
  desconto?: number;
}

export interface PurchaseOrderInput {
  supplierId: string;
  data: string;
  previsaoEntrega: string;
  frete?: number;
  desconto?: number;
  pedidoFornecedor?: string;
  observacoes?: string;
  itens: PurchaseOrderItemInput[];
}

export const PURCHASE_ORDER_STATUS_OPTIONS: Array<{
  value: PurchaseOrderStatus | "";
  label: string;
}> = [
  { value: "", label: "Todos os status" },
  { value: "RASCUNHO", label: "Rascunho" },
  { value: "AGUARDANDO_APROVACAO", label: "Aguardando Aprovação" },
  { value: "APROVADA", label: "Aprovada" },
  { value: "ENVIADA", label: "Enviada" },
  { value: "RECEBIMENTO_PARCIAL", label: "Recebimento Parcial" },
  { value: "RECEBIDA", label: "Recebida" },
  { value: "CANCELADA", label: "Cancelada" },
];

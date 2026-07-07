export type GoodsReceiptSituacao = "PENDENTE" | "PARCIAL" | "RECEBIDO";

export type PayableGenerationMode = "PER_RECEIPT" | "AT_COMPLETION";

export interface GoodsReceiptListItem {
  id: string;
  numero: number;
  numeroFormatado: string;
  purchaseOrderId: string;
  ordemNumero: number;
  ordemNumeroFormatado: string;
  ordemStatus: string;
  fornecedorNome: string;
  supplierId: string;
  valorTotal: number;
  itensCount: number;
  responsavel?: { id: string; nome: string } | null;
  createdAt: string;
}

export interface GoodsReceiptItem {
  id: string;
  purchaseOrderItemId: string;
  variantId: string;
  produtoNome: string;
  sku: string;
  quantidadePedida: number;
  quantidadeRecebida: number;
  valorUnitario: number;
}

export interface GoodsReceipt extends GoodsReceiptListItem {
  observacoes?: string | null;
  fornecedor: {
    id: string;
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
  };
  contaPagar?: {
    id: string;
    numero: number;
    numeroFormatado: string;
    valor: number;
    status: string;
    vencimento?: string | null;
  } | null;
  itens: GoodsReceiptItem[];
}

export interface GoodsReceiptsListResponse {
  data: GoodsReceiptListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderReceiptSummaryItem {
  id: string;
  productId: string;
  variantId: string;
  produtoNome: string;
  sku: string;
  quantidadePedida: number;
  quantidadeRecebida: number;
  quantidadePendente: number;
  valorUnitario: number;
  desconto: number;
  subtotal: number;
}

export interface OrderReceiptSummary {
  purchaseOrderId: string;
  status: string;
  canReceive: boolean;
  itens: OrderReceiptSummaryItem[];
}

export interface GoodsReceiptItemInput {
  purchaseOrderItemId: string;
  quantidadeRecebida: number;
}

export interface CreateGoodsReceiptInput {
  purchaseOrderId: string;
  observacoes?: string;
  itens: GoodsReceiptItemInput[];
}

export const GOODS_RECEIPT_SITUACAO_OPTIONS: Array<{
  value: GoodsReceiptSituacao | "";
  label: string;
}> = [
  { value: "", label: "Todas as situações" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "PARCIAL", label: "Recebimento parcial" },
  { value: "RECEBIDO", label: "Recebido" },
];

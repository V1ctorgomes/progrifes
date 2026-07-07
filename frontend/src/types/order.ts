export type PaymentMethod = "PIX" | "DINHEIRO" | "CARTAO_ENTREGA";

export type OrderStatus =
  | "AGUARDANDO_CONFIRMACAO"
  | "CONFIRMADO"
  | "SEPARANDO"
  | "PRONTO_PARA_ENTREGA"
  | "SAIU_PARA_ENTREGA"
  | "ENTREGUE"
  | "CANCELADO";

export interface OrderStatusMeta {
  value: OrderStatus;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
}

export interface OrderItem {
  id: string;
  produtoId: string;
  variantId: string;
  produtoNome: string;
  sku: string;
  cor?: string | null;
  tamanho?: string | null;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  imagem?: string | null;
}

export interface OrderListItem {
  id: string;
  numero: number;
  numeroFormatado: string;
  clienteNome: string;
  clienteTelefone: string;
  formaPagamento: PaymentMethod;
  total: number;
  status: OrderStatus;
  statusLabel: string;
  statusCor: string;
  itemCount: number;
  createdAt: string;
}

export interface Order extends OrderListItem {
  clienteEmail?: string | null;
  cep: string;
  rua: string;
  numeroEndereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string | null;
  referencia?: string | null;
  trocoPara?: number | null;
  observacoes?: string | null;
  subtotal: number;
  taxaEntrega: number;
  statusDescricao: string;
  motivoCancelamento?: string | null;
  confirmadoEm?: string | null;
  separadoEm?: string | null;
  prontoEntregaEm?: string | null;
  saiuEntregaEm?: string | null;
  entregueEm?: string | null;
  canceladoEm?: string | null;
  nextStatuses: OrderStatusMeta[];
  itens: OrderItem[];
  updatedAt: string;
}

export interface OrderHistoryEntry {
  id: string;
  status: OrderStatus;
  statusLabel: string;
  descricao: string;
  usuario: { id: string; nome: string; email: string } | null;
  createdAt: string;
}

export interface OrdersListResponse {
  data: OrderListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrdersDashboard {
  pedidosHoje: number;
  aguardando: number;
  separando: number;
  saiuEntrega: number;
  entregues: number;
  cancelados: number;
}

export interface CreateOrderInput {
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail?: string;
  cep: string;
  rua: string;
  numeroEndereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string;
  referencia?: string;
  formaPagamento: PaymentMethod;
  trocoPara?: number;
  observacoes?: string;
  itens: Array<{ varianteId: string; quantidade: number }>;
}

export interface CreateOrderResponse extends Order {
  whatsappUrl: string;
  whatsappMessage: string;
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO_ENTREGA: "Cartão na Entrega",
};

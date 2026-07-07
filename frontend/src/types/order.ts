export type PaymentMethod = "PIX" | "DINHEIRO" | "CARTAO_ENTREGA";

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
}

export interface Order {
  id: string;
  numero: number;
  numeroFormatado: string;
  clienteNome: string;
  clienteTelefone: string;
  clienteEmail?: string | null;
  cep: string;
  rua: string;
  numeroEndereco: string;
  bairro: string;
  cidade: string;
  estado: string;
  complemento?: string | null;
  referencia?: string | null;
  formaPagamento: PaymentMethod;
  trocoPara?: number | null;
  observacoes?: string | null;
  subtotal: number;
  taxaEntrega: number;
  total: number;
  status: string;
  statusLabel: string;
  itens: OrderItem[];
  createdAt: string;
  updatedAt: string;
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

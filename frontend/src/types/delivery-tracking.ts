import type { PaymentMethod } from "./order";

export type DeliveryStatus =
  | "PEDIDO_RECEBIDO"
  | "EM_SEPARACAO"
  | "PRONTO_PARA_ENTREGA"
  | "SAIU_PARA_ENTREGA"
  | "ENTREGUE"
  | "NAO_ENTREGUE"
  | "CANCELADO";

export type DeliveryStatusMeta = {
  value: DeliveryStatus;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
};

export type DeliveryListItem = {
  id: string;
  orderId: string;
  deliveryPersonId: string | null;
  status: DeliveryStatus;
  statusLabel: string;
  statusCor: string;
  estimatedDeliveryTime: number | null;
  estimatedDeliveryAt: string | null;
  leftForDeliveryAt: string | null;
  deliveredAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  order: {
    id: string;
    numero: number;
    numeroFormatado: string;
    clienteNome: string;
    clienteTelefone: string;
    bairro: string;
    total: number;
    taxaEntrega: number;
    formaPagamento: PaymentMethod;
    createdAt: string;
    prazoEntregaMinutos: number | null;
  } | null;
  deliveryPerson: {
    id: string;
    name: string;
    phone: string;
    status: string;
  } | null;
  nextStatuses: DeliveryStatusMeta[];
};

export type DeliveryHistoryEntry = {
  id: string;
  status: DeliveryStatus;
  statusLabel: string;
  notes: string | null;
  usuario: { id: string; nome: string; email: string } | null;
  createdAt: string;
};

export type DeliveryDetail = DeliveryListItem & {
  history: DeliveryHistoryEntry[];
};

export type DeliveriesListResponse = {
  data: DeliveryListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DeliveriesDashboard = {
  entregasHoje: number;
  entregasEmAberto: number;
  entregasEmAndamento: number;
  entregasConcluidas: number;
  entregasCanceladas: number;
  tempoMedioEntregaMinutos: number;
  entregadorComMaisEntregas: {
    id: string;
    name: string;
    total: number;
  } | null;
};

export const DELIVERY_STATUS_OPTIONS: Array<{
  value: DeliveryStatus;
  label: string;
}> = [
  { value: "PEDIDO_RECEBIDO", label: "Pedido Recebido" },
  { value: "EM_SEPARACAO", label: "Em Separação" },
  { value: "PRONTO_PARA_ENTREGA", label: "Pronto para Entrega" },
  { value: "SAIU_PARA_ENTREGA", label: "Saiu para Entrega" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "NAO_ENTREGUE", label: "Não Entregue" },
  { value: "CANCELADO", label: "Cancelado" },
];

export const DELIVERY_STATUS_COLORS: Record<DeliveryStatus, string> = {
  PEDIDO_RECEBIDO: "text-amber-700",
  EM_SEPARACAO: "text-violet-700",
  PRONTO_PARA_ENTREGA: "text-cyan-700",
  SAIU_PARA_ENTREGA: "text-orange-700",
  ENTREGUE: "text-emerald-700",
  NAO_ENTREGUE: "text-red-700",
  CANCELADO: "text-red-700",
};

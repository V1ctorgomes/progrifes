import { OrderStatus } from "@prisma/client";

export interface OrderStatusMeta {
  value: OrderStatus;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  AGUARDANDO_CONFIRMACAO: {
    value: "AGUARDANDO_CONFIRMACAO",
    nome: "Aguardando Confirmação",
    descricao: "Pedido criado e aguardando confirmação da loja",
    cor: "#f59e0b",
    ordem: 1,
  },
  CONFIRMADO: {
    value: "CONFIRMADO",
    nome: "Confirmado",
    descricao: "Pedido confirmado pelo atendimento",
    cor: "#3b82f6",
    ordem: 2,
  },
  SEPARANDO: {
    value: "SEPARANDO",
    nome: "Separando Pedido",
    descricao: "Itens em separação no estoque",
    cor: "#8b5cf6",
    ordem: 3,
  },
  PRONTO_PARA_ENTREGA: {
    value: "PRONTO_PARA_ENTREGA",
    nome: "Pronto para Entrega",
    descricao: "Pedido separado e pronto para envio",
    cor: "#06b6d4",
    ordem: 4,
  },
  SAIU_PARA_ENTREGA: {
    value: "SAIU_PARA_ENTREGA",
    nome: "Saiu para Entrega",
    descricao: "Pedido em rota de entrega",
    cor: "#f97316",
    ordem: 5,
  },
  ENTREGUE: {
    value: "ENTREGUE",
    nome: "Entregue",
    descricao: "Pedido entregue ao cliente",
    cor: "#22c55e",
    ordem: 6,
  },
  CANCELADO: {
    value: "CANCELADO",
    nome: "Cancelado",
    descricao: "Pedido cancelado",
    cor: "#ef4444",
    ordem: 7,
  },
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "AGUARDANDO_CONFIRMACAO",
  "CONFIRMADO",
  "SEPARANDO",
  "PRONTO_PARA_ENTREGA",
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
];

export function getStatusMeta(status: OrderStatus) {
  return ORDER_STATUS_META[status];
}

export function getNextStatuses(current: OrderStatus): OrderStatus[] {
  if (current === "CANCELADO" || current === "ENTREGUE") {
    return [];
  }

  const index = ORDER_STATUS_FLOW.indexOf(current);
  const next = ORDER_STATUS_FLOW[index + 1];
  const options = next ? [next] : [];
  return [...options, "CANCELADO"];
}

export function getStatusTimestampField(status: OrderStatus) {
  const map: Partial<Record<OrderStatus, string>> = {
    CONFIRMADO: "confirmadoEm",
    SEPARANDO: "separadoEm",
    PRONTO_PARA_ENTREGA: "prontoEntregaEm",
    SAIU_PARA_ENTREGA: "saiuEntregaEm",
    ENTREGUE: "entregueEm",
    CANCELADO: "canceladoEm",
  };
  return map[status];
}

export function getStatusDescription(status: OrderStatus) {
  const descriptions: Record<OrderStatus, string> = {
    AGUARDANDO_CONFIRMACAO: "Pedido criado",
    CONFIRMADO: "Pedido confirmado",
    SEPARANDO: "Separação iniciada",
    PRONTO_PARA_ENTREGA: "Pedido pronto para entrega",
    SAIU_PARA_ENTREGA: "Saiu para entrega",
    ENTREGUE: "Pedido entregue",
    CANCELADO: "Pedido cancelado",
  };
  return descriptions[status];
}

import { DeliveryStatus, OrderStatus } from "@prisma/client";

export interface DeliveryStatusMeta {
  value: DeliveryStatus;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
}

export const DELIVERY_STATUS_META: Record<DeliveryStatus, DeliveryStatusMeta> = {
  PEDIDO_RECEBIDO: {
    value: "PEDIDO_RECEBIDO",
    nome: "Pedido Recebido",
    descricao: "Pedido recebido e aguardando separação",
    cor: "#f59e0b",
    ordem: 1,
  },
  EM_SEPARACAO: {
    value: "EM_SEPARACAO",
    nome: "Em Separação",
    descricao: "Itens em separação no estoque",
    cor: "#8b5cf6",
    ordem: 2,
  },
  PRONTO_PARA_ENTREGA: {
    value: "PRONTO_PARA_ENTREGA",
    nome: "Pronto para Entrega",
    descricao: "Pedido separado e pronto para envio",
    cor: "#06b6d4",
    ordem: 3,
  },
  SAIU_PARA_ENTREGA: {
    value: "SAIU_PARA_ENTREGA",
    nome: "Saiu para Entrega",
    descricao: "Pedido em rota de entrega",
    cor: "#f97316",
    ordem: 4,
  },
  ENTREGUE: {
    value: "ENTREGUE",
    nome: "Entregue",
    descricao: "Pedido entregue ao cliente",
    cor: "#22c55e",
    ordem: 5,
  },
  NAO_ENTREGUE: {
    value: "NAO_ENTREGUE",
    nome: "Não Entregue",
    descricao: "Entrega não concluída",
    cor: "#dc2626",
    ordem: 6,
  },
  CANCELADO: {
    value: "CANCELADO",
    nome: "Cancelado",
    descricao: "Entrega cancelada",
    cor: "#ef4444",
    ordem: 7,
  },
};

export const DELIVERY_STATUS_FLOW: DeliveryStatus[] = [
  "PEDIDO_RECEBIDO",
  "EM_SEPARACAO",
  "PRONTO_PARA_ENTREGA",
  "SAIU_PARA_ENTREGA",
  "ENTREGUE",
];

export function getDeliveryStatusMeta(status: DeliveryStatus) {
  return DELIVERY_STATUS_META[status];
}

export function getNextDeliveryStatuses(current: DeliveryStatus): DeliveryStatus[] {
  if (current === "CANCELADO" || current === "ENTREGUE") {
    return [];
  }

  if (current === "NAO_ENTREGUE") {
    return ["SAIU_PARA_ENTREGA", "CANCELADO"];
  }

  const index = DELIVERY_STATUS_FLOW.indexOf(current);
  const next = DELIVERY_STATUS_FLOW[index + 1];
  const options = next ? [next] : [];

  if (current === "SAIU_PARA_ENTREGA") {
    return [...options, "NAO_ENTREGUE", "CANCELADO"];
  }

  return [...options, "CANCELADO"];
}

export function getDeliveryStatusDescription(status: DeliveryStatus) {
  const descriptions: Record<DeliveryStatus, string> = {
    PEDIDO_RECEBIDO: "Pedido criado",
    EM_SEPARACAO: "Separação iniciada",
    PRONTO_PARA_ENTREGA: "Pronto para entrega",
    SAIU_PARA_ENTREGA: "Saiu para entrega",
    ENTREGUE: "Entrega concluída",
    NAO_ENTREGUE: "Entrega não concluída",
    CANCELADO: "Entrega cancelada",
  };
  return descriptions[status];
}

export function mapOrderStatusToDeliveryStatus(status: OrderStatus): DeliveryStatus {
  const map: Record<OrderStatus, DeliveryStatus> = {
    AGUARDANDO_CONFIRMACAO: "PEDIDO_RECEBIDO",
    CONFIRMADO: "PEDIDO_RECEBIDO",
    SEPARANDO: "EM_SEPARACAO",
    PRONTO_PARA_ENTREGA: "PRONTO_PARA_ENTREGA",
    SAIU_PARA_ENTREGA: "SAIU_PARA_ENTREGA",
    ENTREGUE: "ENTREGUE",
    CANCELADO: "CANCELADO",
  };
  return map[status];
}

export function mapDeliveryStatusToOrderStatus(status: DeliveryStatus): OrderStatus | null {
  const map: Partial<Record<DeliveryStatus, OrderStatus>> = {
    PEDIDO_RECEBIDO: "AGUARDANDO_CONFIRMACAO",
    EM_SEPARACAO: "SEPARANDO",
    PRONTO_PARA_ENTREGA: "PRONTO_PARA_ENTREGA",
    SAIU_PARA_ENTREGA: "SAIU_PARA_ENTREGA",
    ENTREGUE: "ENTREGUE",
    CANCELADO: "CANCELADO",
  };
  return map[status] ?? null;
}

export function getOrderStatusesToReach(target: OrderStatus): OrderStatus[] {
  const flow: OrderStatus[] = [
    "AGUARDANDO_CONFIRMACAO",
    "CONFIRMADO",
    "SEPARANDO",
    "PRONTO_PARA_ENTREGA",
    "SAIU_PARA_ENTREGA",
    "ENTREGUE",
  ];

  const targetIndex = flow.indexOf(target);
  if (targetIndex < 0) return [];

  return flow.slice(0, targetIndex + 1);
}

export function mapDeliveryRecord(delivery: {
  id: string;
  orderId: string;
  deliveryPersonId: string | null;
  status: DeliveryStatus;
  estimatedDeliveryTime: number | null;
  leftForDeliveryAt: Date | null;
  deliveredAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  order?: {
    id: string;
    numero: number;
    clienteNome: string;
    clienteTelefone: string;
    bairro: string;
    total: unknown;
    taxaEntrega: unknown;
    formaPagamento: string;
    createdAt: Date;
    prazoEntregaMinutos: number | null;
    deliveryPerson?: {
      id: string;
      name: string;
      phone: string;
      status: string;
    } | null;
  };
  deliveryPerson?: {
    id: string;
    name: string;
    phone: string;
    status: string;
  } | null;
}) {
  const order = delivery.order;
  const person = delivery.deliveryPerson ?? order?.deliveryPerson ?? null;
  const estimatedAt =
    order?.createdAt && delivery.estimatedDeliveryTime
      ? new Date(order.createdAt.getTime() + delivery.estimatedDeliveryTime * 60_000)
      : null;

  return {
    id: delivery.id,
    orderId: delivery.orderId,
    deliveryPersonId: delivery.deliveryPersonId,
    status: delivery.status,
    statusLabel: DELIVERY_STATUS_META[delivery.status].nome,
    statusCor: DELIVERY_STATUS_META[delivery.status].cor,
    estimatedDeliveryTime: delivery.estimatedDeliveryTime,
    estimatedDeliveryAt: estimatedAt,
    leftForDeliveryAt: delivery.leftForDeliveryAt,
    deliveredAt: delivery.deliveredAt,
    notes: delivery.notes,
    createdAt: delivery.createdAt,
    updatedAt: delivery.updatedAt,
    order: order
      ? {
          id: order.id,
          numero: order.numero,
          numeroFormatado: `#${String(order.numero).padStart(4, "0")}`,
          clienteNome: order.clienteNome,
          clienteTelefone: order.clienteTelefone,
          bairro: order.bairro,
          total: Number(order.total),
          taxaEntrega: Number(order.taxaEntrega),
          formaPagamento: order.formaPagamento,
          createdAt: order.createdAt,
          prazoEntregaMinutos: order.prazoEntregaMinutos,
        }
      : null,
    deliveryPerson: person
      ? {
          id: person.id,
          name: person.name,
          phone: person.phone,
          status: person.status,
        }
      : null,
    nextStatuses: getNextDeliveryStatuses(delivery.status).map(
      (status) => DELIVERY_STATUS_META[status],
    ),
  };
}

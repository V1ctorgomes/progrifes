import { PurchaseOrderStatus } from "@prisma/client";

export interface PurchaseOrderStatusMeta {
  value: PurchaseOrderStatus;
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
}

export const PURCHASE_ORDER_STATUS_META: Record<PurchaseOrderStatus, PurchaseOrderStatusMeta> = {
  RASCUNHO: {
    value: "RASCUNHO",
    nome: "Rascunho",
    descricao: "Ordem em elaboração",
    cor: "#6b7280",
    ordem: 1,
  },
  AGUARDANDO_APROVACAO: {
    value: "AGUARDANDO_APROVACAO",
    nome: "Aguardando Aprovação",
    descricao: "Ordem aguardando aprovação",
    cor: "#f59e0b",
    ordem: 2,
  },
  APROVADA: {
    value: "APROVADA",
    nome: "Aprovada",
    descricao: "Ordem aprovada internamente",
    cor: "#3b82f6",
    ordem: 3,
  },
  ENVIADA: {
    value: "ENVIADA",
    nome: "Enviada",
    descricao: "Ordem enviada ao fornecedor",
    cor: "#8b5cf6",
    ordem: 4,
  },
  RECEBIMENTO_PARCIAL: {
    value: "RECEBIMENTO_PARCIAL",
    nome: "Recebimento Parcial",
    descricao: "Mercadorias recebidas parcialmente",
    cor: "#06b6d4",
    ordem: 5,
  },
  RECEBIDA: {
    value: "RECEBIDA",
    nome: "Recebida",
    descricao: "Mercadorias totalmente recebidas",
    cor: "#22c55e",
    ordem: 6,
  },
  CANCELADA: {
    value: "CANCELADA",
    nome: "Cancelada",
    descricao: "Ordem cancelada",
    cor: "#ef4444",
    ordem: 7,
  },
};

export const PURCHASE_ORDER_STATUS_FLOW: PurchaseOrderStatus[] = [
  "RASCUNHO",
  "AGUARDANDO_APROVACAO",
  "APROVADA",
  "ENVIADA",
  "RECEBIMENTO_PARCIAL",
  "RECEBIDA",
];

export function getStatusMeta(status: PurchaseOrderStatus) {
  return PURCHASE_ORDER_STATUS_META[status];
}

export function getNextStatuses(current: PurchaseOrderStatus): PurchaseOrderStatus[] {
  if (current === "CANCELADA" || current === "RECEBIDA") {
    return [];
  }

  if (current === "RASCUNHO") {
    return ["AGUARDANDO_APROVACAO", "CANCELADA"];
  }

  if (current === "AGUARDANDO_APROVACAO") {
    return ["APROVADA", "CANCELADA"];
  }

  if (current === "APROVADA") {
    return ["ENVIADA", "CANCELADA"];
  }

  if (current === "ENVIADA") {
    return ["RECEBIMENTO_PARCIAL", "RECEBIDA", "CANCELADA"];
  }

  if (current === "RECEBIMENTO_PARCIAL") {
    return ["RECEBIDA"];
  }

  return [];
}

export function getStatusTimestampField(status: PurchaseOrderStatus) {
  const map: Partial<Record<PurchaseOrderStatus, string>> = {
    APROVADA: "aprovadaEm",
    ENVIADA: "enviadaEm",
    RECEBIDA: "recebidaEm",
    CANCELADA: "canceladaEm",
  };
  return map[status];
}

export function getStatusDescription(status: PurchaseOrderStatus) {
  const descriptions: Record<PurchaseOrderStatus, string> = {
    RASCUNHO: "Ordem criada",
    AGUARDANDO_APROVACAO: "Ordem enviada para aprovação",
    APROVADA: "Ordem aprovada",
    ENVIADA: "Ordem enviada ao fornecedor",
    RECEBIMENTO_PARCIAL: "Recebimento parcial registrado",
    RECEBIDA: "Ordem totalmente recebida",
    CANCELADA: "Ordem cancelada",
  };
  return descriptions[status];
}

export function requiresApproval(status: PurchaseOrderStatus) {
  return status === "APROVADA";
}

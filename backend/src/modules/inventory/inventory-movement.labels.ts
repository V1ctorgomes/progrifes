import { InventoryMovementType } from "@prisma/client";

export type MovementSourceCategory = "ENTRADA" | "SAIDA" | "PEDIDO" | "INVENTARIO" | "OUTROS";

export const MOVEMENT_TYPE_LABELS: Record<InventoryMovementType, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
  RESERVA: "Reserva",
  LIBERACAO: "Liberação",
  BAIXA: "Baixa",
};

export const MOVEMENT_SOURCE_LABELS: Record<MovementSourceCategory, string> = {
  ENTRADA: "Entrada de estoque",
  SAIDA: "Saída de estoque",
  PEDIDO: "Pedido",
  INVENTARIO: "Inventário",
  OUTROS: "Outros",
};

const ENTRY_ORIGEM_LABELS: Record<string, string> = {
  COMPRA: "Compra",
  REPOSICAO: "Reposição",
  DEVOLUCAO_CLIENTE: "Devolução de Cliente",
  AJUSTE_POSITIVO: "Ajuste Positivo",
  PRODUCAO: "Produção",
};

export const ORIGEM_LABELS: Record<string, string> = {
  VENDA: "Venda",
  PEDIDO: "Pedido",
  PERDA: "Perda",
  AVARIA: "Avaria",
  CONSUMO_INTERNO: "Consumo Interno",
  DOACAO: "Doação",
  AJUSTE_NEGATIVO: "Ajuste Negativo",
  INVENTARIO: "Inventário",
  OUTROS: "Outros",
  ...ENTRY_ORIGEM_LABELS,
};

export function resolveMovementSourceCategory(
  tipo: InventoryMovementType,
  origem: string | null,
): MovementSourceCategory {
  if (origem === "INVENTARIO") return "INVENTARIO";
  if (tipo === InventoryMovementType.ENTRADA) return "ENTRADA";
  if (tipo === InventoryMovementType.SAIDA) return "SAIDA";
  if (tipo === InventoryMovementType.BAIXA && origem === "VENDA") return "SAIDA";
  if (
    tipo === InventoryMovementType.RESERVA ||
    tipo === InventoryMovementType.LIBERACAO ||
    tipo === InventoryMovementType.BAIXA
  ) {
    return "PEDIDO";
  }
  return "OUTROS";
}

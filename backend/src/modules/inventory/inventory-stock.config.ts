import { InventoryStatus } from "@prisma/client";

export type StockStatusKey = "em_estoque" | "estoque_baixo" | "sem_estoque";

export const INVENTORY_STATUS_META: Record<
  InventoryStatus,
  { key: StockStatusKey; nome: string; cor: string }
> = {
  EM_ESTOQUE: { key: "em_estoque", nome: "Em Estoque", cor: "#22c55e" },
  ESTOQUE_BAIXO: { key: "estoque_baixo", nome: "Estoque Baixo", cor: "#f59e0b" },
  SEM_ESTOQUE: { key: "sem_estoque", nome: "Sem Estoque", cor: "#ef4444" },
};

export function computeDisponivel(total: number, reservado: number) {
  return Math.max(0, total - reservado);
}

export function computeInventoryStatus(
  disponivel: number,
  estoqueMinimo: number,
): InventoryStatus {
  if (disponivel <= 0) return InventoryStatus.SEM_ESTOQUE;
  if (disponivel <= estoqueMinimo) return InventoryStatus.ESTOQUE_BAIXO;
  return InventoryStatus.EM_ESTOQUE;
}

export function toStockStatusKey(status: InventoryStatus): StockStatusKey {
  return INVENTORY_STATUS_META[status].key;
}

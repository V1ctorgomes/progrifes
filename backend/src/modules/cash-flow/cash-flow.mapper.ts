import {
  CashClosing,
  CashFlowEntry,
  CashFlowType,
  FinancialCashbox,
  FinancialTransaction,
  User,
} from "@prisma/client";

type StatementEntry = CashFlowEntry & {
  financialTransaction: FinancialTransaction & {
    category: { id: string; nome: string; codigo: string } | null;
    chartAccount: { id: string; nome: string; codigo: string } | null;
    costCenter: { id: string; nome: string; codigo: string } | null;
    paymentMethod: { id: string; nome: string; codigo: string } | null;
  };
  financialAccount: { id: string; nome: string } | null;
  cashbox: { id: string; nome: string; codigo: string } | null;
  usuario: Pick<User, "id" | "nome" | "email"> | null;
};

export function decimal(value: unknown) {
  return Number(value ?? 0);
}

export function formatCashFlowTipo(tipo: CashFlowType) {
  const labels: Record<CashFlowType, string> = {
    ENTRADA: "Entrada",
    SAIDA: "Saída",
    TRANSFERENCIA: "Transferência",
    AJUSTE_POSITIVO: "Ajuste Positivo",
    AJUSTE_NEGATIVO: "Ajuste Negativo",
  };
  return labels[tipo];
}

export function mapStatementEntry(entry: StatementEntry) {
  const tx = entry.financialTransaction;
  return {
    id: entry.id,
    financialTransactionId: entry.financialTransactionId,
    numeroFormatado: `TX-${String(tx.numero).padStart(6, "0")}`,
    tipo: entry.tipo,
    tipoLabel: formatCashFlowTipo(entry.tipo),
    origem: entry.origem,
    descricao: entry.descricao,
    valor: decimal(entry.valor),
    saldoApos: decimal(entry.saldoApos),
    createdAt: entry.createdAt.toISOString(),
    financialAccount: entry.financialAccount,
    cashbox: entry.cashbox,
    category: tx.category,
    chartAccount: tx.chartAccount,
    costCenter: tx.costCenter,
    paymentMethod: tx.paymentMethod,
    usuario: entry.usuario,
    transferId: entry.transferId,
  };
}

export function mapCashClosing(
  closing: CashClosing & {
    cashbox: Pick<FinancialCashbox, "id" | "nome" | "codigo">;
    usuario: Pick<User, "id" | "nome" | "email"> | null;
  },
) {
  return {
    id: closing.id,
    cashbox: closing.cashbox,
    saldoInicial: decimal(closing.saldoInicial),
    saldoFinal: closing.saldoFinal ? decimal(closing.saldoFinal) : null,
    status: closing.status,
    observacoes: closing.observacoes,
    usuario: closing.usuario,
    openedAt: closing.openedAt.toISOString(),
    closedAt: closing.closedAt?.toISOString() ?? null,
  };
}

export type CashFlowType =
  | "ENTRADA"
  | "SAIDA"
  | "TRANSFERENCIA"
  | "AJUSTE_POSITIVO"
  | "AJUSTE_NEGATIVO";

export type CashFlowStatementItem = {
  id: string;
  financialTransactionId: string;
  numeroFormatado: string;
  tipo: CashFlowType;
  tipoLabel: string;
  origem: string;
  descricao: string;
  valor: number;
  saldoApos: number;
  createdAt: string;
  transferId: string | null;
  financialAccount: { id: string; nome: string } | null;
  cashbox: { id: string; nome: string; codigo: string } | null;
  category: { id: string; nome: string; codigo: string } | null;
  chartAccount: { id: string; nome: string; codigo: string } | null;
  costCenter: { id: string; nome: string; codigo: string } | null;
  paymentMethod: { id: string; nome: string; codigo: string } | null;
  usuario: { id: string; nome: string; email: string } | null;
};

export type CashFlowStatementResponse = {
  items: CashFlowStatementItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type CashFlowDashboard = {
  summary: {
    saldoAtual: number;
    saldoBancario: number;
    saldoCaixa: number;
    entradasDia: number;
    saidasDia: number;
    entradasMes: number;
    saidasMes: number;
    contasAReceber: number;
    contasAPagar: number;
    projecaoFinanceira: number;
  };
  accounts: Array<{
    id: string;
    nome: string;
    saldoAtual: number;
  }>;
  cashboxes: Array<{
    id: string;
    nome: string;
    codigo: string;
    saldoAtual: number;
  }>;
  fluxoDiario: Array<{
    dia: string;
    entradas: number;
    saidas: number;
    saldo: number;
  }>;
};

export type CreateCashTransferInput = {
  fromFinancialAccountId?: string;
  fromCashboxId?: string;
  toFinancialAccountId?: string;
  toCashboxId?: string;
  paymentMethodId: string;
  valor: number;
  descricao?: string;
  data?: string;
};

export type CreateCashAdjustmentInput = {
  tipo: "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO";
  financialAccountId?: string;
  cashboxId?: string;
  paymentMethodId: string;
  valor: number;
  motivo: string;
  descricao?: string;
  data?: string;
};

export type OpenCashboxInput = {
  cashboxId: string;
  saldoInicial: number;
  observacoes?: string;
};

export type CloseCashboxInput = {
  cashboxId: string;
  saldoFinal?: number;
  observacoes?: string;
};

export const CASH_FLOW_TYPE_OPTIONS: Array<{ value: CashFlowType | ""; label: string }> = [
  { value: "", label: "Todos os tipos" },
  { value: "ENTRADA", label: "Entrada" },
  { value: "SAIDA", label: "Saída" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "AJUSTE_POSITIVO", label: "Ajuste positivo" },
  { value: "AJUSTE_NEGATIVO", label: "Ajuste negativo" },
];

export type FinancialTransactionType = "RECEITA" | "DESPESA" | "TRANSFERENCIA" | "AJUSTE";

export type FinancialTransactionStatus =
  | "PENDENTE"
  | "RECEBIDO"
  | "PAGO"
  | "CANCELADO"
  | "VENCIDO"
  | "PARCIALMENTE_PAGO";

export type FinancialOriginType =
  | "PEDIDO"
  | "COMPRA"
  | "RECEBIMENTO"
  | "CLIENTE"
  | "FORNECEDOR"
  | "DESPESA"
  | "TRANSFERENCIA"
  | "AJUSTE"
  | "LANCAMENTO_MANUAL";

export type FinancialAccountType = "CONTA_CORRENTE" | "CONTA_POUPANCA" | "CONTA_DIGITAL";

export type FinancialCategory = {
  id: string;
  codigo: string;
  nome: string;
  chartAccountId: string | null;
  ativo: boolean;
};

export type FinancialBankAccount = {
  id: string;
  nome: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  tipo: FinancialAccountType;
  saldoInicial: number;
  saldoAtual: number;
  ativo: boolean;
};

export type FinancialCashbox = {
  id: string;
  codigo: string;
  nome: string;
  saldoInicial: number;
  saldoAtual: number;
  ativo: boolean;
};

export type FinancialPaymentMethod = {
  id: string;
  codigo: string;
  nome: string;
  ativo: boolean;
};

export type FinancialTransaction = {
  id: string;
  numero: number;
  numeroFormatado: string;
  tipo: FinancialTransactionType;
  origem: FinancialOriginType;
  origemReferenciaId: string | null;
  categoryId: string;
  category: FinancialCategory | null;
  valor: number;
  data: string;
  competencia: string;
  vencimento: string | null;
  pagamento: string | null;
  status: FinancialTransactionStatus;
  observacoes: string | null;
};

export type FinancialOverview = {
  summary: {
    totalReceitas: number;
    totalDespesas: number;
    lucro: number;
    saldoBancario: number;
    saldoCaixa: number;
    contasAReceber: number;
    contasAPagar: number;
    transacoesPendentes: number;
  };
  counts: {
    chartAccounts: number;
    accounts: number;
    cashboxes: number;
    categories: number;
    paymentMethods: number;
    transactions: number;
  };
  chartAccounts: Array<{
    id: string;
    codigo: string;
    nome: string;
    tipo: "RECEITA" | "DESPESA";
    parentId: string | null;
    ativo: boolean;
  }>;
  categories: FinancialCategory[];
  costCenters: Array<{
    id: string;
    codigo: string;
    nome: string;
    principal: boolean;
    ativo: boolean;
  }>;
  accounts: FinancialBankAccount[];
  cashboxes: FinancialCashbox[];
  paymentMethods: FinancialPaymentMethod[];
};

export type FinancialTransactionsListResponse = {
  items: FinancialTransaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

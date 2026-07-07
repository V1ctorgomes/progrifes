export type ReceivableOriginType =
  | "PEDIDO"
  | "VENDA_MANUAL"
  | "LANCAMENTO_MANUAL"
  | "AJUSTE_FINANCEIRO"
  | "OUTRAS_RECEITAS";

export type ReceivableStatus =
  | "PENDENTE"
  | "RECEBIDO"
  | "PARCIALMENTE_RECEBIDO"
  | "VENCIDO"
  | "CANCELADO"
  | "ESTORNADO";

export type AccountReceivableListItem = {
  id: string;
  numero: number;
  numeroFormatado: string;
  customerId: string;
  customerNome: string;
  originType: ReceivableOriginType;
  originId: string | null;
  orderId: string | null;
  orderNumero: number | null;
  orderNumeroFormatado: string | null;
  categoryId: string;
  categoryNome: string;
  paymentMethodId: string;
  paymentMethodNome: string;
  valorOriginal: number;
  valorRecebido: number;
  saldo: number;
  competencia: string;
  vencimento: string;
  status: ReceivableStatus;
  documento: string | null;
  observacoes: string | null;
  createdAt: string;
};

export type AccountReceivableReceipt = {
  id: string;
  valor: number;
  paymentMethodId: string;
  paymentMethodNome: string;
  financialAccountId: string | null;
  cashboxId: string | null;
  recebidoEm: string;
  estornado: boolean;
  usuarioId: string | null;
  usuarioNome: string | null;
  createdAt: string;
};

export type AccountReceivableHistoryEntry = {
  id: string;
  operacao: string;
  descricao: string;
  valorAnterior: number | null;
  valorNovo: number | null;
  usuarioId: string | null;
  usuarioNome: string | null;
  createdAt: string;
};

export type AccountReceivableDetail = AccountReceivableListItem & {
  chartAccountId: string;
  chartAccountNome: string;
  costCenterId: string | null;
  costCenterNome: string | null;
  financialAccountId: string | null;
  referenciaExterna: string | null;
  usuarioId: string | null;
  usuarioNome: string | null;
  updatedAt: string;
  recebimentos: AccountReceivableReceipt[];
  historico: AccountReceivableHistoryEntry[];
};

export type AccountsReceivableDashboard = {
  totalAReceber: number;
  recebidoHoje: number;
  recebidoMes: number;
  contasVencidas: { quantidade: number; valor: number };
  recebimentosPendentes: number;
  receitasPorCategoria: Array<{
    categoriaId: string;
    categoriaNome: string;
    total: number;
  }>;
};

export type AccountsReceivableListResponse = {
  data: AccountReceivableListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  dashboard: AccountsReceivableDashboard;
};

export type CreateAccountReceivableInput = {
  customerId: string;
  originType: ReceivableOriginType;
  originId?: string;
  categoryId: string;
  chartAccountId: string;
  paymentMethodId: string;
  costCenterId?: string;
  financialAccountId?: string;
  valor: number;
  competencia: string;
  vencimento: string;
  documento?: string;
  referenciaExterna?: string;
  observacoes?: string;
};

export type ReceiveAccountReceivableInput = {
  valor: number;
  paymentMethodId: string;
  financialAccountId?: string;
  cashboxId?: string;
  recebidoEm?: string;
};

export const RECEIVABLE_STATUS_OPTIONS: Array<{
  value: ReceivableStatus;
  label: string;
}> = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "RECEBIDO", label: "Recebido" },
  { value: "PARCIALMENTE_RECEBIDO", label: "Parcialmente recebido" },
  { value: "VENCIDO", label: "Vencido" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "ESTORNADO", label: "Estornado" },
];

export const RECEIVABLE_ORIGIN_OPTIONS: Array<{
  value: ReceivableOriginType;
  label: string;
}> = [
  { value: "PEDIDO", label: "Pedido" },
  { value: "VENDA_MANUAL", label: "Venda manual" },
  { value: "LANCAMENTO_MANUAL", label: "Lançamento manual" },
  { value: "AJUSTE_FINANCEIRO", label: "Ajuste financeiro" },
  { value: "OUTRAS_RECEITAS", label: "Outras receitas" },
];

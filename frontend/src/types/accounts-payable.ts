export type PayableOriginType =
  | "RECEBIMENTO_MERCADORIAS"
  | "COMPRA_MANUAL"
  | "DESPESA_MANUAL"
  | "FORNECEDOR"
  | "AJUSTE_FINANCEIRO"
  | "OUTRAS_OBRIGACOES";

export type PayableStatus =
  | "PENDENTE"
  | "PAGO"
  | "PARCIALMENTE_PAGO"
  | "VENCIDO"
  | "CANCELADO"
  | "ESTORNADO";

export type AccountPayableListItem = {
  id: string;
  numero: number;
  numeroFormatado: string;
  supplierId: string;
  supplierNome: string;
  originType: PayableOriginType;
  originId: string | null;
  purchaseOrderId: string | null;
  orderNumero: number | null;
  orderNumeroFormatado: string | null;
  categoryId: string;
  categoryNome: string;
  paymentMethodId: string;
  paymentMethodNome: string;
  valorOriginal: number;
  valorPago: number;
  saldo: number;
  competencia: string;
  vencimento: string;
  status: PayableStatus;
  documento: string | null;
  numeroNota: string | null;
  observacoes: string | null;
  createdAt: string;
};

export type AccountPayablePayment = {
  id: string;
  valor: number;
  paymentMethodId: string;
  paymentMethodNome: string;
  financialAccountId: string | null;
  cashboxId: string | null;
  pagoEm: string;
  estornado: boolean;
  usuarioId: string | null;
  usuarioNome: string | null;
  createdAt: string;
};

export type AccountPayableHistoryEntry = {
  id: string;
  operacao: string;
  descricao: string;
  valorAnterior: number | null;
  valorNovo: number | null;
  usuarioId: string | null;
  usuarioNome: string | null;
  createdAt: string;
};

export type AccountPayableDetail = AccountPayableListItem & {
  chartAccountId: string;
  chartAccountNome: string;
  costCenterId: string | null;
  costCenterNome: string | null;
  financialAccountId: string | null;
  referenciaExterna: string | null;
  goodsReceiptId: string | null;
  usuarioId: string | null;
  usuarioNome: string | null;
  updatedAt: string;
  pagamentos: AccountPayablePayment[];
  historico: AccountPayableHistoryEntry[];
};

export type AccountsPayableDashboard = {
  totalAPagar: number;
  pagamentosHoje: number;
  pagamentosMes: number;
  contasVencidas: { quantidade: number; valor: number };
  contasPendentes: number;
  despesasPorCategoria: Array<{
    categoriaId: string;
    categoriaNome: string;
    total: number;
  }>;
  obrigacoesPorFornecedor: Array<{
    supplierId: string;
    supplierNome: string;
    quantidade: number;
    valor: number;
  }>;
};

export type AccountsPayableListResponse = {
  data: AccountPayableListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  dashboard: AccountsPayableDashboard;
};

export type CreateAccountPayableInput = {
  supplierId: string;
  originType: PayableOriginType;
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
  numeroNota?: string;
  referenciaExterna?: string;
  observacoes?: string;
};

export type PayAccountPayableInput = {
  valor: number;
  paymentMethodId: string;
  financialAccountId?: string;
  cashboxId?: string;
  pagoEm?: string;
};

export const PAYABLE_STATUS_OPTIONS: Array<{ value: PayableStatus; label: string }> = [
  { value: "PENDENTE", label: "Pendente" },
  { value: "PAGO", label: "Pago" },
  { value: "PARCIALMENTE_PAGO", label: "Parcialmente pago" },
  { value: "VENCIDO", label: "Vencido" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "ESTORNADO", label: "Estornado" },
];

export const PAYABLE_ORIGIN_OPTIONS: Array<{ value: PayableOriginType; label: string }> = [
  { value: "RECEBIMENTO_MERCADORIAS", label: "Recebimento" },
  { value: "COMPRA_MANUAL", label: "Compra manual" },
  { value: "DESPESA_MANUAL", label: "Despesa manual" },
  { value: "FORNECEDOR", label: "Fornecedor" },
  { value: "AJUSTE_FINANCEIRO", label: "Ajuste financeiro" },
  { value: "OUTRAS_OBRIGACOES", label: "Outras obrigações" },
];

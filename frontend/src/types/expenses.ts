export type ExpenseStatus =
  | "PENDENTE"
  | "PAGO"
  | "PARCIALMENTE_PAGO"
  | "VENCIDO"
  | "CANCELADO"
  | "ESTORNADO";

export type ExpenseRecurrenceFrequency =
  | "SEMANAL"
  | "QUINZENAL"
  | "MENSAL"
  | "BIMESTRAL"
  | "TRIMESTRAL"
  | "SEMESTRAL"
  | "ANUAL";

export type ExpenseListItem = {
  id: string;
  numero: number;
  numeroFormatado: string;
  descricao: string;
  documento: string | null;
  supplierId: string | null;
  supplierNome: string | null;
  categoryId: string;
  categoryNome: string;
  costCenterId: string;
  costCenterNome: string;
  paymentMethodId: string | null;
  paymentMethodNome: string | null;
  financialAccountId: string | null;
  accountPayableId: string;
  valor: number;
  competencia: string;
  vencimento: string;
  status: ExpenseStatus;
  recorrente: boolean;
  frequencia: ExpenseRecurrenceFrequency | null;
  variavel: boolean;
  grupoParcelasId: string | null;
  parcelaNumero: number | null;
  totalParcelas: number | null;
  observacoes: string | null;
  createdAt: string;
};

export type ExpenseHistoryEntry = {
  id: string;
  operacao: string;
  descricao: string;
  valorAnterior: number | null;
  valorNovo: number | null;
  usuarioId: string | null;
  usuarioNome: string | null;
  createdAt: string;
};

export type ExpenseAttachment = {
  id: string;
  nome: string;
  arquivo: string;
  tipo: string;
  usuarioId: string | null;
  usuarioNome: string | null;
  createdAt: string;
};

export type ExpenseDetail = ExpenseListItem & {
  chartAccountId: string;
  chartAccountNome: string;
  proximaRecorrencia: string | null;
  recorrenciaOrigemId: string | null;
  usuarioId: string | null;
  usuarioNome: string | null;
  updatedAt: string;
  valorPago: number;
  saldo: number;
  parcela: {
    id: string;
    grupoId: string;
    numero: number;
    valor: number;
    vencimento: string;
    status: ExpenseStatus;
  } | null;
  anexos: ExpenseAttachment[];
  historico: ExpenseHistoryEntry[];
  pagamentos: Array<{
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
  }>;
};

export type ExpensesDashboard = {
  despesasDia: number;
  despesasMes: number;
  despesasPendentes: { quantidade: number; valor: number };
  despesasVencidas: { quantidade: number; valor: number };
  despesasFixas: number;
  despesasVariaveis: number;
  despesasPorCategoria: Array<{
    categoryId: string;
    categoryNome: string;
    total: number;
    quantidade: number;
  }>;
  despesasPorCentroCusto: Array<{
    costCenterId: string;
    costCenterNome: string;
    total: number;
    quantidade: number;
  }>;
};

export type ExpensesListResponse = {
  data: ExpenseListItem[];
  meta: { page: number; limit: number; total: number; totalPages: number };
  dashboard: ExpensesDashboard;
};

export type CreateExpenseInput = {
  descricao: string;
  categoryId: string;
  chartAccountId: string;
  costCenterId: string;
  supplierId?: string;
  financialAccountId?: string;
  paymentMethodId?: string;
  valor: number;
  competencia: string;
  vencimento: string;
  documento?: string;
  observacoes?: string;
  recorrente?: boolean;
  frequencia?: ExpenseRecurrenceFrequency;
  variavel?: boolean;
  quantidadeParcelas?: number;
};

export type UpdateExpenseInput = Partial<CreateExpenseInput>;

export type PayExpenseInput = {
  valor: number;
  paymentMethodId: string;
  financialAccountId?: string;
  cashboxId?: string;
  pagoEm?: string;
};

export const EXPENSE_STATUS_OPTIONS: Array<{ value: ExpenseStatus | ""; label: string }> = [
  { value: "", label: "Todos os status" },
  { value: "PENDENTE", label: "Pendente" },
  { value: "PARCIALMENTE_PAGO", label: "Parcialmente pago" },
  { value: "PAGO", label: "Pago" },
  { value: "VENCIDO", label: "Vencido" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "ESTORNADO", label: "Estornado" },
];

export const EXPENSE_FREQUENCY_OPTIONS: Array<{
  value: ExpenseRecurrenceFrequency;
  label: string;
}> = [
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINZENAL", label: "Quinzenal" },
  { value: "MENSAL", label: "Mensal" },
  { value: "BIMESTRAL", label: "Bimestral" },
  { value: "TRIMESTRAL", label: "Trimestral" },
  { value: "SEMESTRAL", label: "Semestral" },
  { value: "ANUAL", label: "Anual" },
];

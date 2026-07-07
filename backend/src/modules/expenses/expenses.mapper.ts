import {
  AccountPayable,
  Expense,
  ExpenseAttachment,
  ExpenseHistory,
  ExpenseInstallment,
  FinancialCategory,
  FinancialChartAccount,
  FinancialCostCenter,
  FinancialPaymentMethod,
  Supplier,
  User,
} from "@prisma/client";

export type ExpenseWithRelations = Expense & {
  supplier: Supplier | null;
  category: FinancialCategory;
  chartAccount: FinancialChartAccount;
  costCenter: FinancialCostCenter;
  paymentMethod: FinancialPaymentMethod | null;
  accountPayable: AccountPayable & {
    pagamentos: Array<{
      id: string;
      valor: unknown;
      paymentMethodId: string;
      paymentMethod: FinancialPaymentMethod;
      financialAccountId: string | null;
      cashboxId: string | null;
      pagoEm: Date;
      estornado: boolean;
      usuarioId: string | null;
      usuario: Pick<User, "id" | "nome"> | null;
      createdAt: Date;
    }>;
  };
  usuario: Pick<User, "id" | "nome"> | null;
  parcela: ExpenseInstallment | null;
  anexos: Array<
    ExpenseAttachment & {
      usuario: Pick<User, "id" | "nome"> | null;
    }
  >;
  historico: Array<
    ExpenseHistory & {
      usuario: Pick<User, "id" | "nome"> | null;
    }
  >;
};

export function formatExpenseNumero(numero: number) {
  return `DESP-${String(numero).padStart(6, "0")}`;
}

export function decimal(value: unknown) {
  return Number(value ?? 0);
}

export function mapExpenseListItem(expense: ExpenseWithRelations) {
  return {
    id: expense.id,
    numero: expense.numero,
    numeroFormatado: formatExpenseNumero(expense.numero),
    descricao: expense.descricao,
    documento: expense.documento,
    supplierId: expense.supplierId,
    supplierNome: expense.supplier?.nomeFantasia ?? null,
    categoryId: expense.categoryId,
    categoryNome: expense.category.nome,
    costCenterId: expense.costCenterId,
    costCenterNome: expense.costCenter.nome,
    paymentMethodId: expense.paymentMethodId,
    paymentMethodNome: expense.paymentMethod?.nome ?? null,
    financialAccountId: expense.financialAccountId,
    accountPayableId: expense.accountPayableId,
    valor: decimal(expense.valor),
    competencia: expense.competencia.toISOString(),
    vencimento: expense.vencimento.toISOString(),
    status: expense.status,
    recorrente: expense.recorrente,
    frequencia: expense.frequencia,
    variavel: expense.variavel,
    grupoParcelasId: expense.grupoParcelasId,
    parcelaNumero: expense.parcelaNumero,
    totalParcelas: expense.totalParcelas,
    observacoes: expense.observacoes,
    createdAt: expense.createdAt.toISOString(),
  };
}

export function mapExpenseDetail(expense: ExpenseWithRelations) {
  return {
    ...mapExpenseListItem(expense),
    chartAccountId: expense.chartAccountId,
    chartAccountNome: expense.chartAccount.nome,
    proximaRecorrencia: expense.proximaRecorrencia?.toISOString() ?? null,
    recorrenciaOrigemId: expense.recorrenciaOrigemId,
    usuarioId: expense.usuarioId,
    usuarioNome: expense.usuario?.nome ?? null,
    updatedAt: expense.updatedAt.toISOString(),
    valorPago: decimal(expense.accountPayable.valorPago),
    saldo: decimal(expense.accountPayable.saldo),
    parcela: expense.parcela
      ? {
          id: expense.parcela.id,
          grupoId: expense.parcela.grupoId,
          numero: expense.parcela.numero,
          valor: decimal(expense.parcela.valor),
          vencimento: expense.parcela.vencimento.toISOString(),
          status: expense.parcela.status,
        }
      : null,
    anexos: expense.anexos.map((anexo) => ({
      id: anexo.id,
      nome: anexo.nome,
      arquivo: anexo.arquivo,
      tipo: anexo.tipo,
      usuarioId: anexo.usuarioId,
      usuarioNome: anexo.usuario?.nome ?? null,
      createdAt: anexo.createdAt.toISOString(),
    })),
    historico: expense.historico.map((entry) => ({
      id: entry.id,
      operacao: entry.operacao,
      descricao: entry.descricao,
      valorAnterior: entry.valorAnterior ? decimal(entry.valorAnterior) : null,
      valorNovo: entry.valorNovo ? decimal(entry.valorNovo) : null,
      usuarioId: entry.usuarioId,
      usuarioNome: entry.usuario?.nome ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
    pagamentos: expense.accountPayable.pagamentos.map((payment) => ({
      id: payment.id,
      valor: decimal(payment.valor),
      paymentMethodId: payment.paymentMethodId,
      paymentMethodNome: payment.paymentMethod.nome,
      financialAccountId: payment.financialAccountId,
      cashboxId: payment.cashboxId,
      pagoEm: payment.pagoEm.toISOString(),
      estornado: payment.estornado,
      usuarioId: payment.usuarioId,
      usuarioNome: payment.usuario?.nome ?? null,
      createdAt: payment.createdAt.toISOString(),
    })),
  };
}

export function payableStatusToExpenseStatus(
  status: AccountPayable["status"],
): Expense["status"] {
  return status as Expense["status"];
}

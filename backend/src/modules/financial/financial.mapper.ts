import {
  FinancialAccount,
  FinancialCashbox,
  FinancialCategory,
  FinancialChartAccount,
  FinancialCostCenter,
  FinancialPaymentMethod,
  FinancialTransaction,
  FinancialTransactionHistory,
  Prisma,
} from "@prisma/client";

type TransactionWithRelations = FinancialTransaction & {
  category?: FinancialCategory | null;
  chartAccount?: FinancialChartAccount | null;
  costCenter?: FinancialCostCenter | null;
  bankAccount?: FinancialAccount | null;
  cashbox?: FinancialCashbox | null;
  paymentMethod?: FinancialPaymentMethod | null;
  historico?: FinancialTransactionHistory[];
};

export function formatFinancialNumero(numero: number) {
  return `FIN-${String(numero).padStart(6, "0")}`;
}

export function mapChartAccount(account: FinancialChartAccount) {
  return {
    id: account.id,
    codigo: account.codigo,
    nome: account.nome,
    tipo: account.tipo,
    parentId: account.parentId,
    ativo: account.ativo,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export function mapCategory(category: FinancialCategory) {
  return {
    id: category.id,
    codigo: category.codigo,
    nome: category.nome,
    chartAccountId: category.chartAccountId,
    ativo: category.ativo,
    createdAt: category.createdAt.toISOString(),
    updatedAt: category.updatedAt.toISOString(),
  };
}

export function mapCostCenter(center: FinancialCostCenter) {
  return {
    id: center.id,
    codigo: center.codigo,
    nome: center.nome,
    principal: center.principal,
    ativo: center.ativo,
    createdAt: center.createdAt.toISOString(),
    updatedAt: center.updatedAt.toISOString(),
  };
}

export function mapBankAccount(
  account: FinancialAccount,
  saldoAtual: number,
) {
  return {
    id: account.id,
    nome: account.nome,
    banco: account.banco,
    agencia: account.agencia,
    conta: account.conta,
    tipo: account.tipo,
    saldoInicial: Number(account.saldoInicial),
    saldoAtual,
    ativo: account.ativo,
    createdAt: account.createdAt.toISOString(),
    updatedAt: account.updatedAt.toISOString(),
  };
}

export function mapCashbox(cashbox: FinancialCashbox, saldoAtual: number) {
  return {
    id: cashbox.id,
    codigo: cashbox.codigo,
    nome: cashbox.nome,
    saldoInicial: Number(cashbox.saldoInicial),
    saldoAtual,
    ativo: cashbox.ativo,
    createdAt: cashbox.createdAt.toISOString(),
    updatedAt: cashbox.updatedAt.toISOString(),
  };
}

export function mapPaymentMethod(method: FinancialPaymentMethod) {
  return {
    id: method.id,
    codigo: method.codigo,
    nome: method.nome,
    ativo: method.ativo,
    createdAt: method.createdAt.toISOString(),
    updatedAt: method.updatedAt.toISOString(),
  };
}

export function mapTransaction(transaction: TransactionWithRelations) {
  return {
    id: transaction.id,
    numero: transaction.numero,
    numeroFormatado: formatFinancialNumero(transaction.numero),
    tipo: transaction.tipo,
    origem: transaction.origem,
    origemReferenciaId: transaction.origemReferenciaId,
    categoryId: transaction.categoryId,
    category: transaction.category ? mapCategory(transaction.category) : null,
    chartAccountId: transaction.chartAccountId,
    chartAccount: transaction.chartAccount
      ? mapChartAccount(transaction.chartAccount)
      : null,
    costCenterId: transaction.costCenterId,
    costCenter: transaction.costCenter
      ? mapCostCenter(transaction.costCenter)
      : null,
    bankAccountId: transaction.bankAccountId,
    bankAccount: transaction.bankAccount
      ? {
          id: transaction.bankAccount.id,
          nome: transaction.bankAccount.nome,
        }
      : null,
    cashboxId: transaction.cashboxId,
    cashbox: transaction.cashbox
      ? {
          id: transaction.cashbox.id,
          nome: transaction.cashbox.nome,
        }
      : null,
    paymentMethodId: transaction.paymentMethodId,
    paymentMethod: transaction.paymentMethod
      ? mapPaymentMethod(transaction.paymentMethod)
      : null,
    valor: Number(transaction.valor),
    data: transaction.data.toISOString(),
    competencia: transaction.competencia.toISOString(),
    vencimento: transaction.vencimento?.toISOString() ?? null,
    pagamento: transaction.pagamento?.toISOString() ?? null,
    status: transaction.status,
    observacoes: transaction.observacoes,
    usuarioId: transaction.usuarioId,
    createdAt: transaction.createdAt.toISOString(),
    updatedAt: transaction.updatedAt.toISOString(),
  };
}

export function decimalToNumber(value: Prisma.Decimal | null | undefined) {
  return value == null ? null : Number(value);
}

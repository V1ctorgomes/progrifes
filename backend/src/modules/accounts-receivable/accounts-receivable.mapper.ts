import {
  AccountReceivable,
  AccountReceivableHistory,
  AccountReceivableReceipt,
  Customer,
  FinancialCategory,
  FinancialChartAccount,
  FinancialCostCenter,
  FinancialPaymentMethod,
  Order,
  Prisma,
  User,
} from "@prisma/client";

export type AccountReceivableWithRelations = AccountReceivable & {
  customer: Customer;
  category: FinancialCategory;
  chartAccount: FinancialChartAccount;
  costCenter: FinancialCostCenter | null;
  paymentMethod: FinancialPaymentMethod;
  order: Pick<Order, "id" | "numero"> | null;
  usuario: Pick<User, "id" | "nome"> | null;
  recebimentos: Array<
    AccountReceivableReceipt & {
      paymentMethod: FinancialPaymentMethod;
      usuario: Pick<User, "id" | "nome"> | null;
    }
  >;
  historico: Array<
    AccountReceivableHistory & {
      usuario: Pick<User, "id" | "nome"> | null;
    }
  >;
};

export function formatReceivableNumero(numero: number) {
  return `CR-${String(numero).padStart(6, "0")}`;
}

export function mapReceivableListItem(account: AccountReceivableWithRelations) {
  return {
    id: account.id,
    numero: account.numero,
    numeroFormatado: formatReceivableNumero(account.numero),
    customerId: account.customerId,
    customerNome: account.customer.nome,
    originType: account.originType,
    originId: account.originId,
    orderId: account.orderId,
    orderNumero: account.order ? account.order.numero : null,
    orderNumeroFormatado: account.order
      ? `PED-${String(account.order.numero).padStart(6, "0")}`
      : null,
    categoryId: account.categoryId,
    categoryNome: account.category.nome,
    paymentMethodId: account.paymentMethodId,
    paymentMethodNome: account.paymentMethod.nome,
    valorOriginal: Number(account.valorOriginal),
    valorRecebido: Number(account.valorRecebido),
    saldo: Number(account.saldo),
    competencia: account.competencia.toISOString(),
    vencimento: account.vencimento.toISOString(),
    status: account.status,
    documento: account.documento,
    observacoes: account.observacoes,
    createdAt: account.createdAt.toISOString(),
  };
}

export function mapReceivableDetail(account: AccountReceivableWithRelations) {
  return {
    ...mapReceivableListItem(account),
    chartAccountId: account.chartAccountId,
    chartAccountNome: account.chartAccount.nome,
    costCenterId: account.costCenterId,
    costCenterNome: account.costCenter?.nome ?? null,
    financialAccountId: account.financialAccountId,
    referenciaExterna: account.referenciaExterna,
    usuarioId: account.usuarioId,
    usuarioNome: account.usuario?.nome ?? null,
    updatedAt: account.updatedAt.toISOString(),
    recebimentos: account.recebimentos.map((receipt) => ({
      id: receipt.id,
      valor: Number(receipt.valor),
      paymentMethodId: receipt.paymentMethodId,
      paymentMethodNome: receipt.paymentMethod.nome,
      financialAccountId: receipt.financialAccountId,
      cashboxId: receipt.cashboxId,
      recebidoEm: receipt.recebidoEm.toISOString(),
      estornado: receipt.estornado,
      usuarioId: receipt.usuarioId,
      usuarioNome: receipt.usuario?.nome ?? null,
      createdAt: receipt.createdAt.toISOString(),
    })),
    historico: account.historico.map((entry) => ({
      id: entry.id,
      operacao: entry.operacao,
      descricao: entry.descricao,
      valorAnterior: entry.valorAnterior ? Number(entry.valorAnterior) : null,
      valorNovo: entry.valorNovo ? Number(entry.valorNovo) : null,
      usuarioId: entry.usuarioId,
      usuarioNome: entry.usuario?.nome ?? null,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}

export function decimal(value: Prisma.Decimal | number) {
  return typeof value === "number" ? value : Number(value);
}

import {
  AccountPayable,
  AccountPayableHistory,
  AccountPayablePayment,
  FinancialCategory,
  FinancialChartAccount,
  FinancialCostCenter,
  FinancialPaymentMethod,
  Prisma,
  PurchaseOrder,
  Supplier,
  User,
} from "@prisma/client";

export type AccountPayableWithRelations = AccountPayable & {
  supplier: Supplier | null;
  category: FinancialCategory;
  chartAccount: FinancialChartAccount;
  costCenter: FinancialCostCenter | null;
  paymentMethod: FinancialPaymentMethod;
  purchaseOrder: Pick<PurchaseOrder, "id" | "numero"> | null;
  usuario: Pick<User, "id" | "nome"> | null;
  pagamentos: Array<
    AccountPayablePayment & {
      paymentMethod: FinancialPaymentMethod;
      usuario: Pick<User, "id" | "nome"> | null;
    }
  >;
  historico: Array<
    AccountPayableHistory & {
      usuario: Pick<User, "id" | "nome"> | null;
    }
  >;
};

export function formatPayableNumero(numero: number) {
  return `CP-${String(numero).padStart(6, "0")}`;
}

export function mapPayableListItem(account: AccountPayableWithRelations) {
  return {
    id: account.id,
    numero: account.numero,
    numeroFormatado: formatPayableNumero(account.numero),
    supplierId: account.supplierId,
    supplierNome: account.supplier?.nomeFantasia ?? "—",
    originType: account.originType,
    originId: account.originId,
    purchaseOrderId: account.purchaseOrderId,
    orderNumero: account.purchaseOrder ? account.purchaseOrder.numero : null,
    orderNumeroFormatado: account.purchaseOrder
      ? `OC-${String(account.purchaseOrder.numero).padStart(6, "0")}`
      : null,
    categoryId: account.categoryId,
    categoryNome: account.category.nome,
    paymentMethodId: account.paymentMethodId,
    paymentMethodNome: account.paymentMethod.nome,
    valorOriginal: Number(account.valorOriginal),
    valorPago: Number(account.valorPago),
    saldo: Number(account.saldo),
    competencia: account.competencia.toISOString(),
    vencimento: account.vencimento.toISOString(),
    status: account.status,
    documento: account.documento,
    numeroNota: account.numeroNota,
    observacoes: account.observacoes,
    createdAt: account.createdAt.toISOString(),
  };
}

export function mapPayableDetail(account: AccountPayableWithRelations) {
  return {
    ...mapPayableListItem(account),
    chartAccountId: account.chartAccountId,
    chartAccountNome: account.chartAccount.nome,
    costCenterId: account.costCenterId,
    costCenterNome: account.costCenter?.nome ?? null,
    financialAccountId: account.financialAccountId,
    referenciaExterna: account.referenciaExterna,
    goodsReceiptId: account.goodsReceiptId,
    usuarioId: account.usuarioId,
    usuarioNome: account.usuario?.nome ?? null,
    updatedAt: account.updatedAt.toISOString(),
    pagamentos: account.pagamentos.map((payment) => ({
      id: payment.id,
      valor: Number(payment.valor),
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

import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const transactionInclude = {
  category: true,
  chartAccount: true,
  costCenter: true,
  bankAccount: true,
  cashbox: true,
  paymentMethod: true,
} satisfies Prisma.FinancialTransactionInclude;

@Injectable()
export class FinancialTransactionRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.FinancialTransactionWhereInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.financialTransaction.findMany({
      where,
      skip,
      take,
      orderBy: [{ data: "desc" }, { numero: "desc" }],
      include: transactionInclude,
    });
  }

  count(where: Prisma.FinancialTransactionWhereInput) {
    return this.prisma.financialTransaction.count({ where });
  }

  getNextNumero(tx: Prisma.TransactionClient) {
    return tx.financialTransaction
      .aggregate({ _max: { numero: true } })
      .then((result) => (result._max.numero ?? 0) + 1);
  }

  create(
    data: Omit<Prisma.FinancialTransactionCreateInput, "numero">,
    tx: Prisma.TransactionClient,
  ) {
    return this.getNextNumero(tx).then((numero) =>
      tx.financialTransaction.create({
        data: { ...data, numero },
        include: transactionInclude,
      }),
    );
  }

  aggregateByTipoAndStatus(
    tipo: Prisma.EnumFinancialTransactionTypeFilter["equals"],
    status: Prisma.EnumFinancialTransactionStatusFilter["equals"],
    whereExtra?: Prisma.FinancialTransactionWhereInput,
  ) {
    return this.prisma.financialTransaction.aggregate({
      where: {
        deletedAt: null,
        tipo,
        status,
        ...whereExtra,
      },
      _sum: { valor: true },
      _count: true,
    });
  }

  aggregateCashImpact(
    bankAccountId?: string,
    cashboxId?: string,
  ) {
    const completedStatuses = ["PAGO", "RECEBIDO"] as const;
    return this.prisma.financialTransaction.groupBy({
      by: ["tipo"],
      where: {
        deletedAt: null,
        status: { in: [...completedStatuses] },
        ...(bankAccountId ? { bankAccountId } : {}),
        ...(cashboxId ? { cashboxId } : {}),
      },
      _sum: { valor: true },
    });
  }

  createHistory(
    data: Prisma.FinancialTransactionHistoryCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.financialTransactionHistory.create({ data });
  }
}

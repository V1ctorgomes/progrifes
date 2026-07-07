import { Injectable } from "@nestjs/common";
import { ExpenseStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { ExpenseWithRelations } from "./expenses.mapper";

const include = {
  supplier: true,
  category: true,
  chartAccount: true,
  costCenter: true,
  paymentMethod: true,
  accountPayable: {
    include: {
      pagamentos: {
        orderBy: { pagoEm: "desc" as const },
        include: {
          paymentMethod: true,
          usuario: { select: { id: true, nome: true } },
        },
      },
    },
  },
  usuario: { select: { id: true, nome: true } },
  parcela: true,
  anexos: {
    orderBy: { createdAt: "desc" as const },
    include: { usuario: { select: { id: true, nome: true } } },
  },
  historico: {
    orderBy: { createdAt: "desc" as const },
    include: { usuario: { select: { id: true, nome: true } } },
  },
} satisfies Prisma.ExpenseInclude;

@Injectable()
export class ExpensesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where: Prisma.ExpenseWhereInput, skip: number, take: number) {
    return this.prisma.expense.findMany({
      where,
      skip,
      take,
      orderBy: [{ vencimento: "asc" }, { numero: "desc" }],
      include,
    }) as Promise<ExpenseWithRelations[]>;
  }

  count(where: Prisma.ExpenseWhereInput) {
    return this.prisma.expense.count({ where });
  }

  findById(id: string) {
    return this.prisma.expense.findFirst({
      where: { id, deletedAt: null },
      include,
    }) as Promise<ExpenseWithRelations | null>;
  }

  getNextNumero(tx: Prisma.TransactionClient) {
    return tx.expense
      .aggregate({ _max: { numero: true } })
      .then((result) => (result._max.numero ?? 0) + 1);
  }

  create(data: Omit<Prisma.ExpenseCreateInput, "numero">, tx: Prisma.TransactionClient) {
    return this.getNextNumero(tx).then((numero) =>
      tx.expense.create({
        data: { ...data, numero },
        include,
      }),
    ) as Promise<ExpenseWithRelations>;
  }

  update(
    id: string,
    data: Prisma.ExpenseUpdateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.expense.update({
      where: { id },
      data,
      include,
    }) as Promise<ExpenseWithRelations>;
  }

  markOverdue(now = new Date()) {
    return this.prisma.expense.updateMany({
      where: {
        deletedAt: null,
        status: { in: ["PENDENTE", "PARCIALMENTE_PAGO"] },
        vencimento: { lt: now },
      },
      data: { status: "VENCIDO" },
    });
  }

  aggregateValor(where: Prisma.ExpenseWhereInput) {
    return this.prisma.expense.aggregate({
      where,
      _sum: { valor: true },
      _count: true,
    });
  }

  groupByCategory(where: Prisma.ExpenseWhereInput) {
    return this.prisma.expense.groupBy({
      by: ["categoryId"],
      where,
      _sum: { valor: true },
      _count: true,
    });
  }

  groupByCostCenter(where: Prisma.ExpenseWhereInput) {
    return this.prisma.expense.groupBy({
      by: ["costCenterId"],
      where,
      _sum: { valor: true },
      _count: true,
    });
  }

  findRecurringDue(now = new Date()) {
    return this.prisma.expense.findMany({
      where: {
        deletedAt: null,
        recorrente: true,
        recorrenciaOrigemId: null,
        proximaRecorrencia: { lte: now },
        status: { in: ["PAGO", "CANCELADO"] },
      },
      include,
    }) as Promise<ExpenseWithRelations[]>;
  }

  createInstallment(
    data: Prisma.ExpenseInstallmentCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.expenseInstallment.create({ data });
  }

  updateInstallmentStatus(
    expenseId: string,
    status: ExpenseStatus,
    tx: Prisma.TransactionClient,
  ) {
    return tx.expenseInstallment.updateMany({
      where: { expenseId },
      data: { status },
    });
  }

  createHistory(
    data: Prisma.ExpenseHistoryCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.expenseHistory.create({ data });
  }

  createAttachment(
    data: Prisma.ExpenseAttachmentCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.expenseAttachment.create({
      data,
      include: { usuario: { select: { id: true, nome: true } } },
    });
  }
}

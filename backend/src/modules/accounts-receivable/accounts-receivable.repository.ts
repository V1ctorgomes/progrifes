import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { AccountReceivableWithRelations } from "./accounts-receivable.mapper";

const include = {
  customer: true,
  category: true,
  chartAccount: true,
  costCenter: true,
  paymentMethod: true,
  order: { select: { id: true, numero: true } },
  usuario: { select: { id: true, nome: true } },
  recebimentos: {
    orderBy: { recebidoEm: "desc" as const },
    include: {
      paymentMethod: true,
      usuario: { select: { id: true, nome: true } },
    },
  },
  historico: {
    orderBy: { createdAt: "desc" as const },
    include: {
      usuario: { select: { id: true, nome: true } },
    },
  },
} satisfies Prisma.AccountReceivableInclude;

@Injectable()
export class AccountsReceivableRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where: Prisma.AccountReceivableWhereInput, skip: number, take: number) {
    return this.prisma.accountReceivable.findMany({
      where,
      skip,
      take,
      orderBy: [{ vencimento: "asc" }, { numero: "desc" }],
      include,
    }) as Promise<AccountReceivableWithRelations[]>;
  }

  count(where: Prisma.AccountReceivableWhereInput) {
    return this.prisma.accountReceivable.count({ where });
  }

  findById(id: string) {
    return this.prisma.accountReceivable.findFirst({
      where: { id, deletedAt: null },
      include,
    }) as Promise<AccountReceivableWithRelations | null>;
  }

  findByOrderId(orderId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.accountReceivable.findFirst({
      where: { orderId, deletedAt: null },
    });
  }

  getNextNumero(tx: Prisma.TransactionClient) {
    return tx.accountReceivable
      .aggregate({ _max: { numero: true } })
      .then((result) => (result._max.numero ?? 0) + 1);
  }

  create(
    data: Omit<Prisma.AccountReceivableCreateInput, "numero">,
    tx: Prisma.TransactionClient,
  ) {
    return this.getNextNumero(tx).then((numero) =>
      tx.accountReceivable.create({
        data: { ...data, numero },
        include,
      }),
    ) as Promise<AccountReceivableWithRelations>;
  }

  update(
    id: string,
    data: Prisma.AccountReceivableUpdateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.accountReceivable.update({
      where: { id },
      data,
      include,
    }) as Promise<AccountReceivableWithRelations>;
  }

  markOverdue(now = new Date()) {
    return this.prisma.accountReceivable.updateMany({
      where: {
        deletedAt: null,
        status: { in: ["PENDENTE", "PARCIALMENTE_RECEBIDO"] },
        vencimento: { lt: now },
      },
      data: { status: "VENCIDO" },
    });
  }

  aggregateSaldo(where: Prisma.AccountReceivableWhereInput) {
    return this.prisma.accountReceivable.aggregate({
      where,
      _sum: { saldo: true },
      _count: true,
    });
  }

  aggregateReceipts(where: Prisma.AccountReceivableReceiptWhereInput) {
    return this.prisma.accountReceivableReceipt.aggregate({
      where,
      _sum: { valor: true },
      _count: true,
    });
  }

  groupReceiptsByCategory(start: Date, end: Date) {
    return this.prisma.accountReceivableReceipt.groupBy({
      by: ["accountReceivableId"],
      where: {
        estornado: false,
        recebidoEm: { gte: start, lte: end },
      },
      _sum: { valor: true },
    });
  }

  findReceiptById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.accountReceivableReceipt.findUnique({
      where: { id },
      include: {
        accountReceivable: true,
        financialTransaction: true,
      },
    });
  }

  createReceipt(
    data: Prisma.AccountReceivableReceiptCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.accountReceivableReceipt.create({ data });
  }

  updateReceipt(
    id: string,
    data: Prisma.AccountReceivableReceiptUpdateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.accountReceivableReceipt.update({ where: { id }, data });
  }

  createHistory(
    data: Prisma.AccountReceivableHistoryCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.accountReceivableHistory.create({ data });
  }
}

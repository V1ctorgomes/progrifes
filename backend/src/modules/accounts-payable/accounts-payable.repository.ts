import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { AccountPayableWithRelations } from "./accounts-payable.mapper";

const include = {
  supplier: true,
  category: true,
  chartAccount: true,
  costCenter: true,
  paymentMethod: true,
  purchaseOrder: { select: { id: true, numero: true } },
  usuario: { select: { id: true, nome: true } },
  pagamentos: {
    orderBy: { pagoEm: "desc" as const },
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
} satisfies Prisma.AccountPayableInclude;

@Injectable()
export class AccountsPayableRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where: Prisma.AccountPayableWhereInput, skip: number, take: number) {
    return this.prisma.accountPayable.findMany({
      where,
      skip,
      take,
      orderBy: [{ vencimento: "asc" }, { numero: "desc" }],
      include,
    }) as Promise<AccountPayableWithRelations[]>;
  }

  count(where: Prisma.AccountPayableWhereInput) {
    return this.prisma.accountPayable.count({ where });
  }

  findById(id: string) {
    return this.prisma.accountPayable.findFirst({
      where: { id, deletedAt: null },
      include,
    }) as Promise<AccountPayableWithRelations | null>;
  }

  findByGoodsReceiptId(goodsReceiptId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.accountPayable.findFirst({
      where: { goodsReceiptId, deletedAt: null },
    });
  }

  getNextNumero(tx: Prisma.TransactionClient) {
    return tx.accountPayable
      .aggregate({ _max: { numero: true } })
      .then((result) => (result._max.numero ?? 0) + 1);
  }

  create(
    data: Omit<Prisma.AccountPayableCreateInput, "numero">,
    tx: Prisma.TransactionClient,
  ) {
    return this.getNextNumero(tx).then((numero) =>
      tx.accountPayable.create({
        data: { ...data, numero },
        include,
      }),
    ) as Promise<AccountPayableWithRelations>;
  }

  update(
    id: string,
    data: Prisma.AccountPayableUpdateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.accountPayable.update({
      where: { id },
      data,
      include,
    }) as Promise<AccountPayableWithRelations>;
  }

  markOverdue(now = new Date()) {
    return this.prisma.accountPayable.updateMany({
      where: {
        deletedAt: null,
        status: { in: ["PENDENTE", "PARCIALMENTE_PAGO"] },
        vencimento: { lt: now },
      },
      data: { status: "VENCIDO" },
    });
  }

  aggregateSaldo(where: Prisma.AccountPayableWhereInput) {
    return this.prisma.accountPayable.aggregate({
      where,
      _sum: { saldo: true },
      _count: true,
    });
  }

  aggregatePayments(where: Prisma.AccountPayablePaymentWhereInput) {
    return this.prisma.accountPayablePayment.aggregate({
      where,
      _sum: { valor: true },
      _count: true,
    });
  }

  groupBySupplier(where: Prisma.AccountPayableWhereInput) {
    return this.prisma.accountPayable.groupBy({
      by: ["supplierId"],
      where,
      _sum: { saldo: true },
      _count: true,
    });
  }

  findPaymentById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.accountPayablePayment.findUnique({
      where: { id },
      include: { accountPayable: true },
    });
  }

  createPayment(
    data: Prisma.AccountPayablePaymentCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.accountPayablePayment.create({ data });
  }

  updatePayment(
    id: string,
    data: Prisma.AccountPayablePaymentUpdateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.accountPayablePayment.update({ where: { id }, data });
  }

  createHistory(
    data: Prisma.AccountPayableHistoryCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.accountPayableHistory.create({ data });
  }
}

import { Injectable } from "@nestjs/common";
import { CashFlowType, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const statementInclude = {
  financialTransaction: {
    include: {
      category: true,
      chartAccount: true,
      costCenter: true,
      paymentMethod: true,
    },
  },
  financialAccount: true,
  cashbox: true,
  usuario: { select: { id: true, nome: true, email: true } },
} satisfies Prisma.CashFlowEntryInclude;

@Injectable()
export class CashFlowRepository {
  constructor(private readonly prisma: PrismaService) {}

  countEntries() {
    return this.prisma.cashFlowEntry.count();
  }

  findStatement(
    where: Prisma.CashFlowEntryWhereInput,
    skip: number,
    take: number,
  ) {
    return this.prisma.cashFlowEntry.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: statementInclude,
    });
  }

  countStatement(where: Prisma.CashFlowEntryWhereInput) {
    return this.prisma.cashFlowEntry.count({ where });
  }

  findLastSaldo(
    tx: Prisma.TransactionClient,
    input: { financialAccountId?: string | null; cashboxId?: string | null },
  ) {
    return tx.cashFlowEntry.findFirst({
      where: {
        financialAccountId: input.financialAccountId ?? null,
        cashboxId: input.cashboxId ?? null,
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: { saldoApos: true },
    });
  }

  existsForTransaction(
    financialTransactionId: string,
    tx: Prisma.TransactionClient,
  ) {
    return tx.cashFlowEntry.findUnique({
      where: { financialTransactionId },
      select: { id: true },
    });
  }

  createEntry(
    data: Omit<Prisma.CashFlowEntryCreateInput, "id">,
    tx: Prisma.TransactionClient,
  ) {
    return tx.cashFlowEntry.create({ data, include: statementInclude });
  }

  aggregateByTipo(
    tipo: CashFlowType,
    whereExtra?: Prisma.CashFlowEntryWhereInput,
  ) {
    return this.prisma.cashFlowEntry.aggregate({
      where: { tipo, ...whereExtra },
      _sum: { valor: true },
      _count: true,
    });
  }

  getNextTransferNumero(tx: Prisma.TransactionClient) {
    return tx.cashTransfer
      .aggregate({ _max: { numero: true } })
      .then((result) => (result._max.numero ?? 0) + 1);
  }

  createTransfer(
    data: Omit<Prisma.CashTransferCreateInput, "numero">,
    tx: Prisma.TransactionClient,
  ) {
    return this.getNextTransferNumero(tx).then((numero) =>
      tx.cashTransfer.create({ data: { ...data, numero } }),
    );
  }

  findOpenClosing(cashboxId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.cashClosing.findFirst({
      where: { cashboxId, status: "ABERTO" },
      orderBy: { openedAt: "desc" },
      include: {
        cashbox: { select: { id: true, nome: true, codigo: true } },
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  findLatestClosing(cashboxId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.cashClosing.findFirst({
      where: { cashboxId },
      orderBy: { openedAt: "desc" },
    });
  }

  createClosing(
    data: Prisma.CashClosingCreateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.cashClosing.create({
      data,
      include: {
        cashbox: { select: { id: true, nome: true, codigo: true } },
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  updateClosing(
    id: string,
    data: Prisma.CashClosingUpdateInput,
    tx: Prisma.TransactionClient,
  ) {
    return tx.cashClosing.update({
      where: { id },
      data,
      include: {
        cashbox: { select: { id: true, nome: true, codigo: true } },
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });
  }

  listClosingsByCashbox(cashboxId: string) {
    return this.prisma.cashClosing.findMany({
      where: { cashboxId },
      orderBy: { openedAt: "desc" },
      include: {
        cashbox: { select: { id: true, nome: true, codigo: true } },
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });
  }
}

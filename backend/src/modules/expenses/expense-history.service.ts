import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { ExpensesRepository } from "./expenses.repository";

@Injectable()
export class ExpenseHistoryService {
  constructor(
    private readonly repository: ExpensesRepository,
    private readonly prisma: PrismaService,
  ) {}

  record(
    data: {
      expenseId: string;
      operacao: string;
      descricao: string;
      usuarioId?: string | null;
      valorAnterior?: Prisma.Decimal | number | null;
      valorNovo?: Prisma.Decimal | number | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const payload: Prisma.ExpenseHistoryCreateInput = {
      expense: { connect: { id: data.expenseId } },
      operacao: data.operacao,
      descricao: data.descricao,
      valorAnterior: data.valorAnterior ?? null,
      valorNovo: data.valorNovo ?? null,
      usuario: data.usuarioId
        ? { connect: { id: data.usuarioId } }
        : undefined,
    };

    if (tx) {
      return this.repository.createHistory(payload, tx);
    }

    return this.prisma.expenseHistory.create({ data: payload });
  }
}

import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ListFinancialTransactionsQueryDto } from "./dto/financial.dto";
import { mapTransaction } from "./financial.mapper";
import { FinancialTransactionRepository } from "./financial-transaction.repository";

@Injectable()
export class FinancialTransactionService {
  constructor(
    private readonly transactionRepository: FinancialTransactionRepository,
  ) {}

  async findAll(query: ListFinancialTransactionsQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.FinancialTransactionWhereInput = {
      deletedAt: null,
      ...(query.tipo ? { tipo: query.tipo } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.origem ? { origem: query.origem } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.bankAccountId ? { bankAccountId: query.bankAccountId } : {}),
      ...(query.cashboxId ? { cashboxId: query.cashboxId } : {}),
      ...(query.dataInicio || query.dataFim
        ? {
            data: {
              ...(query.dataInicio ? { gte: new Date(query.dataInicio) } : {}),
              ...(query.dataFim ? { lte: new Date(query.dataFim) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.transactionRepository.findMany(where, skip, limit),
      this.transactionRepository.count(where),
    ]);

    return {
      items: items.map(mapTransaction),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

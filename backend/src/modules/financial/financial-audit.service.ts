import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { FinancialTransactionRepository } from "./financial-transaction.repository";

type AuditContext = {
  usuarioId?: string | null;
  ip?: string | null;
  origem?: string | null;
};

@Injectable()
export class FinancialAuditService {
  constructor(
    private readonly transactionRepository: FinancialTransactionRepository,
  ) {}

  recordCreation(
    transactionId: string,
    valor: Prisma.Decimal,
    context: AuditContext,
    tx: Prisma.TransactionClient,
  ) {
    return this.transactionRepository.createHistory(
      {
        transaction: { connect: { id: transactionId } },
        operacao: "CRIACAO",
        valorNovo: valor,
        descricao: "Lançamento financeiro criado",
        usuario: context.usuarioId
          ? { connect: { id: context.usuarioId } }
          : undefined,
        ip: context.ip ?? null,
        origem: context.origem ?? null,
      },
      tx,
    );
  }
}

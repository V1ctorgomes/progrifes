import { BadRequestException, Injectable } from "@nestjs/common";
import {
  CashFlowType,
  FinancialTransaction,
  FinancialTransactionStatus,
  FinancialTransactionType,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CashFlowRepository } from "./cash-flow.repository";
import { decimal } from "./cash-flow.mapper";

type SyncInput = {
  transaction: FinancialTransaction;
  usuarioId?: string | null;
  tipo?: CashFlowType;
  transferId?: string | null;
  descricao?: string;
};

@Injectable()
export class CashFlowSyncService {
  constructor(
    private readonly repository: CashFlowRepository,
    private readonly prisma: PrismaService,
  ) {}

  private isCompleted(transaction: FinancialTransaction) {
    return (
      transaction.status === FinancialTransactionStatus.RECEBIDO ||
      transaction.status === FinancialTransactionStatus.PAGO
    );
  }

  private hasCashImpact(transaction: FinancialTransaction) {
    return Boolean(transaction.bankAccountId || transaction.cashboxId);
  }

  private resolveTipo(
    transaction: FinancialTransaction,
    override?: CashFlowType,
  ): CashFlowType | null {
    if (override) return override;

    if (transaction.tipo === FinancialTransactionType.TRANSFERENCIA) {
      return CashFlowType.TRANSFERENCIA;
    }

    if (
      transaction.tipo === FinancialTransactionType.RECEITA ||
      (transaction.tipo === FinancialTransactionType.AJUSTE &&
        transaction.status === FinancialTransactionStatus.RECEBIDO)
    ) {
      return CashFlowType.ENTRADA;
    }

    if (transaction.tipo === FinancialTransactionType.DESPESA) {
      return CashFlowType.SAIDA;
    }

    if (transaction.tipo === FinancialTransactionType.AJUSTE) {
      return CashFlowType.AJUSTE_POSITIVO;
    }

    return null;
  }

  private applyMovement(saldo: number, tipo: CashFlowType, valor: number) {
    if (
      tipo === CashFlowType.ENTRADA ||
      tipo === CashFlowType.AJUSTE_POSITIVO
    ) {
      return saldo + valor;
    }

    if (tipo === CashFlowType.SAIDA || tipo === CashFlowType.AJUSTE_NEGATIVO) {
      return saldo - valor;
    }

    throw new BadRequestException("Tipo de movimentação inválido para saldo");
  }

  private async getBaseSaldo(
    tx: Prisma.TransactionClient,
    input: { financialAccountId?: string | null; cashboxId?: string | null },
  ) {
    const last = await this.repository.findLastSaldo(tx, input);
    if (last) return decimal(last.saldoApos);

    if (input.financialAccountId) {
      const account = await tx.financialAccount.findUnique({
        where: { id: input.financialAccountId },
        select: { saldoInicial: true },
      });
      return decimal(account?.saldoInicial);
    }

    if (input.cashboxId) {
      const openClosing = await this.repository.findOpenClosing(
        input.cashboxId,
        tx,
      );
      if (openClosing) return decimal(openClosing.saldoInicial);

      const cashbox = await tx.financialCashbox.findUnique({
        where: { id: input.cashboxId },
        select: { saldoInicial: true },
      });
      return decimal(cashbox?.saldoInicial);
    }

    return 0;
  }

  async recordFromTransaction(
    input: SyncInput,
    tx: Prisma.TransactionClient,
  ) {
    const { transaction } = input;

    if (!this.isCompleted(transaction) || !this.hasCashImpact(transaction)) {
      return null;
    }

    const existing = await this.repository.existsForTransaction(
      transaction.id,
      tx,
    );
    if (existing) return null;

    const tipo = this.resolveTipo(transaction, input.tipo);
    if (!tipo) return null;

    const valor = decimal(transaction.valor);
    const baseSaldo = await this.getBaseSaldo(tx, {
      financialAccountId: transaction.bankAccountId,
      cashboxId: transaction.cashboxId,
    });
    const saldoApos = this.applyMovement(baseSaldo, tipo, valor);

    return this.repository.createEntry(
      {
        financialTransaction: { connect: { id: transaction.id } },
        tipo,
        origem: transaction.origem,
        descricao:
          input.descricao?.trim() ||
          transaction.observacoes?.trim() ||
          "Movimentação financeira",
        financialAccount: transaction.bankAccountId
          ? { connect: { id: transaction.bankAccountId } }
          : undefined,
        cashbox: transaction.cashboxId
          ? { connect: { id: transaction.cashboxId } }
          : undefined,
        valor,
        saldoApos,
        transfer: input.transferId
          ? { connect: { id: input.transferId } }
          : undefined,
        usuario: input.usuarioId
          ? { connect: { id: input.usuarioId } }
          : undefined,
        createdAt: transaction.data,
      },
      tx,
    );
  }

  async backfillHistoricalEntries() {
    const existing = await this.repository.countEntries();
    if (existing > 0) return;

    const transactions = await this.prisma.financialTransaction.findMany({
      where: {
        deletedAt: null,
        status: {
          in: [
            FinancialTransactionStatus.PAGO,
            FinancialTransactionStatus.RECEBIDO,
          ],
        },
        OR: [{ bankAccountId: { not: null } }, { cashboxId: { not: null } }],
        tipo: {
          in: [
            FinancialTransactionType.RECEITA,
            FinancialTransactionType.DESPESA,
          ],
        },
      },
      orderBy: [{ data: "asc" }, { numero: "asc" }],
    });

    if (!transactions.length) return;

    await this.prisma.$transaction(async (tx) => {
      for (const transaction of transactions) {
        await this.recordFromTransaction({ transaction }, tx);
      }
    });
  }
}

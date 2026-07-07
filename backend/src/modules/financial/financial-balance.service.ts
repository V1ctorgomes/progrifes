import { Injectable } from "@nestjs/common";
import {
  FinancialAccount,
  FinancialCashbox,
  FinancialTransactionType,
} from "@prisma/client";
import { FinancialTransactionRepository } from "./financial-transaction.repository";

@Injectable()
export class FinancialBalanceService {
  constructor(
    private readonly transactionRepository: FinancialTransactionRepository,
  ) {}

  private calculateBalance(
    saldoInicial: number,
    groups: Array<{ tipo: FinancialTransactionType; _sum: { valor: unknown } }>,
  ) {
    let entradas = 0;
    let saidas = 0;

    for (const group of groups) {
      const valor = Number(group._sum.valor ?? 0);
      if (
        group.tipo === FinancialTransactionType.RECEITA ||
        group.tipo === FinancialTransactionType.AJUSTE
      ) {
        entradas += valor;
      } else if (group.tipo === FinancialTransactionType.DESPESA) {
        saidas += valor;
      }
    }

    return {
      saldoInicial,
      entradas,
      saidas,
      saldoAtual: saldoInicial + entradas - saidas,
    };
  }

  async getBankAccountBalance(account: FinancialAccount) {
    const groups = await this.transactionRepository.aggregateCashImpact(
      account.id,
    );
    return this.calculateBalance(Number(account.saldoInicial), groups);
  }

  async getCashboxBalance(cashbox: FinancialCashbox) {
    const groups = await this.transactionRepository.aggregateCashImpact(
      undefined,
      cashbox.id,
    );
    return this.calculateBalance(Number(cashbox.saldoInicial), groups);
  }
}

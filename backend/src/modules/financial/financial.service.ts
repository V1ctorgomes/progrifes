import { Injectable } from "@nestjs/common";
import { FinancialTransactionType } from "@prisma/client";
import { FinancialBalanceService } from "./financial-balance.service";
import {
  mapBankAccount,
  mapCashbox,
  mapCategory,
  mapChartAccount,
  mapCostCenter,
  mapPaymentMethod,
} from "./financial.mapper";
import { FinancialRepository } from "./financial.repository";
import { FinancialTransactionRepository } from "./financial-transaction.repository";

@Injectable()
export class FinancialService {
  constructor(
    private readonly repository: FinancialRepository,
    private readonly transactionRepository: FinancialTransactionRepository,
    private readonly balanceService: FinancialBalanceService,
  ) {}

  async getOverview() {
    const [
      chartAccounts,
      categories,
      costCenters,
      bankAccounts,
      cashboxes,
      paymentMethods,
      [accountsCount, cashboxesCount, categoriesCount, paymentMethodsCount, transactionsCount],
      receitasRecebidas,
      despesasPagas,
      receitasPendentes,
      despesasPendentes,
      transacoesPendentes,
    ] = await Promise.all([
      this.repository.findChartAccounts(),
      this.repository.findCategories(),
      this.repository.findCostCenters(),
      this.repository.findBankAccounts(),
      this.repository.findCashboxes(),
      this.repository.findPaymentMethods(),
      this.repository.countActiveMasterData(),
      this.transactionRepository.aggregateByTipoAndStatus(
        FinancialTransactionType.RECEITA,
        "RECEBIDO",
      ),
      this.transactionRepository.aggregateByTipoAndStatus(
        FinancialTransactionType.DESPESA,
        "PAGO",
      ),
      this.transactionRepository.aggregateByTipoAndStatus(
        FinancialTransactionType.RECEITA,
        "PENDENTE",
      ),
      this.transactionRepository.aggregateByTipoAndStatus(
        FinancialTransactionType.DESPESA,
        "PENDENTE",
      ),
      this.transactionRepository.count({
        deletedAt: null,
        status: "PENDENTE",
      }),
    ]);

    const bankBalances = await Promise.all(
      bankAccounts.map(async (account) => {
        const balance = await this.balanceService.getBankAccountBalance(account);
        return mapBankAccount(account, balance.saldoAtual);
      }),
    );

    const cashboxBalances = await Promise.all(
      cashboxes.map(async (cashbox) => {
        const balance = await this.balanceService.getCashboxBalance(cashbox);
        return mapCashbox(cashbox, balance.saldoAtual);
      }),
    );

    const saldoBancario = bankBalances.reduce(
      (sum, account) => sum + account.saldoAtual,
      0,
    );
    const saldoCaixa = cashboxBalances.reduce(
      (sum, cashbox) => sum + cashbox.saldoAtual,
      0,
    );

    return {
      summary: {
        totalReceitas: Number(receitasRecebidas._sum.valor ?? 0),
        totalDespesas: Number(despesasPagas._sum.valor ?? 0),
        lucro:
          Number(receitasRecebidas._sum.valor ?? 0) -
          Number(despesasPagas._sum.valor ?? 0),
        saldoBancario,
        saldoCaixa,
        contasAReceber: Number(receitasPendentes._sum.valor ?? 0),
        contasAPagar: Number(despesasPendentes._sum.valor ?? 0),
        transacoesPendentes,
      },
      counts: {
        chartAccounts: chartAccounts.length,
        accounts: accountsCount,
        cashboxes: cashboxesCount,
        categories: categoriesCount,
        paymentMethods: paymentMethodsCount,
        transactions: transactionsCount,
      },
      chartAccounts: chartAccounts.map(mapChartAccount),
      categories: categories.map(mapCategory),
      costCenters: costCenters.map(mapCostCenter),
      accounts: bankBalances,
      cashboxes: cashboxBalances,
      paymentMethods: paymentMethods.map(mapPaymentMethod),
    };
  }

  async getAccounts() {
    const accounts = await this.repository.findBankAccounts();
    return Promise.all(
      accounts.map(async (account) => {
        const balance = await this.balanceService.getBankAccountBalance(account);
        return mapBankAccount(account, balance.saldoAtual);
      }),
    );
  }

  async getCashboxes() {
    const cashboxes = await this.repository.findCashboxes();
    return Promise.all(
      cashboxes.map(async (cashbox) => {
        const balance = await this.balanceService.getCashboxBalance(cashbox);
        return mapCashbox(cashbox, balance.saldoAtual);
      }),
    );
  }

  getCategories() {
    return this.repository
      .findCategories()
      .then((items) => items.map(mapCategory));
  }

  getPaymentMethods() {
    return this.repository
      .findPaymentMethods()
      .then((items) => items.map(mapPaymentMethod));
  }
}

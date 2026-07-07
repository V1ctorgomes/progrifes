import { Injectable, OnModuleInit } from "@nestjs/common";
import { CashFlowType, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { FinancialBalanceService } from "../financial/financial-balance.service";
import { FinancialRepository } from "../financial/financial.repository";
import { mapBankAccount, mapCashbox } from "../financial/financial.mapper";
import { CashFlowRepository } from "./cash-flow.repository";
import { CashFlowSyncService } from "./cash-flow-sync.service";
import { ListCashFlowStatementQueryDto } from "./dto/cash-flow.dto";
import { decimal, mapStatementEntry } from "./cash-flow.mapper";

function startOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date: Date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

@Injectable()
export class CashFlowService implements OnModuleInit {
  constructor(
    private readonly repository: CashFlowRepository,
    private readonly syncService: CashFlowSyncService,
    private readonly financialRepository: FinancialRepository,
    private readonly balanceService: FinancialBalanceService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    await this.syncService.backfillHistoricalEntries();
  }

  private buildStatementWhere(
    query: ListCashFlowStatementQueryDto,
  ): Prisma.CashFlowEntryWhereInput {
    const where: Prisma.CashFlowEntryWhereInput = {};

    if (query.tipo) where.tipo = query.tipo;
    if (query.financialAccountId) {
      where.financialAccountId = query.financialAccountId;
    }
    if (query.cashboxId) where.cashboxId = query.cashboxId;
    if (query.usuarioId) where.usuarioId = query.usuarioId;
    if (query.categoryId) {
      where.financialTransaction = { categoryId: query.categoryId };
    }

    if (query.dataInicio || query.dataFim) {
      where.createdAt = {};
      if (query.dataInicio) {
        where.createdAt.gte = startOfDay(new Date(query.dataInicio));
      }
      if (query.dataFim) {
        where.createdAt.lte = endOfDay(new Date(query.dataFim));
      }
    }

    if (query.search?.trim()) {
      const term = query.search.trim();
      where.OR = [
        { descricao: { contains: term, mode: "insensitive" } },
        {
          financialTransaction: {
            observacoes: { contains: term, mode: "insensitive" },
          },
        },
        {
          financialTransaction: {
            category: { nome: { contains: term, mode: "insensitive" } },
          },
        },
        { usuario: { nome: { contains: term, mode: "insensitive" } } },
      ];
    }

    return where;
  }

  async getDashboard() {
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);

    const dayFilter = { createdAt: { gte: dayStart, lte: dayEnd } };
    const monthFilter = { createdAt: { gte: monthStart, lte: dayEnd } };

    const entradaTypes: CashFlowType[] = [
      CashFlowType.ENTRADA,
      CashFlowType.AJUSTE_POSITIVO,
    ];
    const saidaTypes: CashFlowType[] = [
      CashFlowType.SAIDA,
      CashFlowType.AJUSTE_NEGATIVO,
    ];

    const [
      bankAccounts,
      cashboxes,
      entradasDia,
      saidasDia,
      entradasMes,
      saidasMes,
      receivablesPending,
      payablesPending,
      fluxoDiario,
    ] = await Promise.all([
      this.financialRepository.findBankAccounts(),
      this.financialRepository.findCashboxes(),
      this.prisma.cashFlowEntry.aggregate({
        where: { tipo: { in: entradaTypes }, ...dayFilter },
        _sum: { valor: true },
      }),
      this.prisma.cashFlowEntry.aggregate({
        where: { tipo: { in: saidaTypes }, ...dayFilter },
        _sum: { valor: true },
      }),
      this.prisma.cashFlowEntry.aggregate({
        where: { tipo: { in: entradaTypes }, ...monthFilter },
        _sum: { valor: true },
      }),
      this.prisma.cashFlowEntry.aggregate({
        where: { tipo: { in: saidaTypes }, ...monthFilter },
        _sum: { valor: true },
      }),
      this.prisma.accountReceivable.aggregate({
        where: {
          status: { in: ["PENDENTE", "PARCIALMENTE_RECEBIDO", "VENCIDO"] },
        },
        _sum: { saldo: true },
      }),
      this.prisma.accountPayable.aggregate({
        where: {
          status: { in: ["PENDENTE", "PARCIALMENTE_PAGO", "VENCIDO"] },
        },
        _sum: { saldo: true },
      }),
      this.prisma.$queryRaw<Array<{ dia: Date; entradas: string; saidas: string }>>`
        SELECT
          DATE_TRUNC('day', created_at) AS dia,
          COALESCE(SUM(CASE WHEN tipo IN ('ENTRADA', 'AJUSTE_POSITIVO') THEN valor ELSE 0 END), 0) AS entradas,
          COALESCE(SUM(CASE WHEN tipo IN ('SAIDA', 'AJUSTE_NEGATIVO') THEN valor ELSE 0 END), 0) AS saidas
        FROM cash_flow
        WHERE created_at >= ${new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000)}
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY dia ASC
      `,
    ]);

    const accountsWithBalance = await Promise.all(
      bankAccounts.map(async (account) => {
        const balance = await this.balanceService.getBankAccountBalance(account);
        return mapBankAccount(account, balance.saldoAtual);
      }),
    );

    const cashboxesWithBalance = await Promise.all(
      cashboxes.map(async (cashbox) => {
        const balance = await this.balanceService.getCashboxBalance(cashbox);
        return mapCashbox(cashbox, balance.saldoAtual);
      }),
    );

    const saldoBancario = accountsWithBalance.reduce(
      (sum, account) => sum + account.saldoAtual,
      0,
    );
    const saldoCaixa = cashboxesWithBalance.reduce(
      (sum, cashbox) => sum + cashbox.saldoAtual,
      0,
    );
    const saldoAtual = saldoBancario + saldoCaixa;
    const contasAReceber = decimal(receivablesPending._sum?.saldo);
    const contasAPagar = decimal(payablesPending._sum?.saldo);

    return {
      summary: {
        saldoAtual,
        saldoBancario,
        saldoCaixa,
        entradasDia: decimal(entradasDia._sum.valor),
        saidasDia: decimal(saidasDia._sum.valor),
        entradasMes: decimal(entradasMes._sum.valor),
        saidasMes: decimal(saidasMes._sum.valor),
        contasAReceber,
        contasAPagar,
        projecaoFinanceira: saldoAtual + contasAReceber - contasAPagar,
      },
      accounts: accountsWithBalance,
      cashboxes: cashboxesWithBalance,
      fluxoDiario: fluxoDiario.map((item) => ({
        dia: item.dia.toISOString(),
        entradas: decimal(item.entradas),
        saidas: decimal(item.saidas),
        saldo: decimal(item.entradas) - decimal(item.saidas),
      })),
    };
  }

  async getStatement(query: ListCashFlowStatementQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildStatementWhere(query);

    const [items, total] = await Promise.all([
      this.repository.findStatement(where, (page - 1) * limit, limit),
      this.repository.countStatement(where),
    ]);

    return {
      items: items.map(mapStatementEntry),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }
}

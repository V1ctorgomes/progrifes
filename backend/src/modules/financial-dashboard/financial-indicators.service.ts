import { Injectable } from "@nestjs/common";
import { FinancialTransactionType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { FinancialBalanceService } from "../financial/financial-balance.service";
import { FinancialRepository } from "../financial/financial.repository";
import {
  comparisonResult,
  DateRange,
  decimal,
  endOfDay,
  previousDayRange,
  previousMonthRanges,
  previousWeekRanges,
  previousYearRanges,
  REVENUE_ORDER_STATUSES,
  startOfDay,
} from "./financial-dashboard.utils";

@Injectable()
export class FinancialIndicatorsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialRepository: FinancialRepository,
    private readonly balanceService: FinancialBalanceService,
  ) {}

  private orderRevenueWhere(range: DateRange) {
    return {
      status: { in: [...REVENUE_ORDER_STATUSES] },
      createdAt: { gte: range.start, lte: range.end },
    };
  }

  private async getCostOfGoodsSold(range: DateRange) {
    const items = await this.prisma.orderItem.findMany({
      where: { order: this.orderRevenueWhere(range) },
      include: { variant: { select: { custo: true } } },
    });

    return items.reduce(
      (sum, item) => sum + decimal(item.quantidade) * decimal(item.variant.custo),
      0,
    );
  }

  async getMainCards(range: DateRange) {
    const today: DateRange = {
      preset: "HOJE",
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
    };
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = endOfDay(new Date());

    const [
      faturamentoDia,
      faturamentoMes,
      pedidosPeriodo,
      pedidosMes,
      clientesAtivos,
      produtosVendidos,
      receitasRecebidas,
      despesasPagas,
      recebidoPeriodo,
      pagoPeriodo,
      custoVendido,
      saldos,
    ] = await Promise.all([
      this.prisma.order.aggregate({
        where: this.orderRevenueWhere(today),
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: {
          status: { in: [...REVENUE_ORDER_STATUSES] },
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: this.orderRevenueWhere(range),
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.count({
        where: {
          status: { in: [...REVENUE_ORDER_STATUSES] },
          createdAt: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.customer.count({ where: { ativo: true } }),
      this.prisma.orderItem.aggregate({
        where: { order: this.orderRevenueWhere(range) },
        _sum: { quantidade: true },
      }),
      this.prisma.financialTransaction.aggregate({
        where: {
          deletedAt: null,
          tipo: FinancialTransactionType.RECEITA,
          status: "RECEBIDO",
          data: { gte: range.start, lte: range.end },
        },
        _sum: { valor: true },
      }),
      this.prisma.financialTransaction.aggregate({
        where: {
          deletedAt: null,
          tipo: FinancialTransactionType.DESPESA,
          status: "PAGO",
          data: { gte: range.start, lte: range.end },
        },
        _sum: { valor: true },
      }),
      this.prisma.accountReceivableReceipt.aggregate({
        where: {
          estornado: false,
          recebidoEm: { gte: range.start, lte: range.end },
        },
        _sum: { valor: true },
      }),
      this.prisma.accountPayablePayment.aggregate({
        where: {
          estornado: false,
          pagoEm: { gte: range.start, lte: range.end },
        },
        _sum: { valor: true },
      }),
      this.getCostOfGoodsSold(range),
      this.getBalances(),
    ]);

    const faturamentoPeriodo = decimal(pedidosPeriodo._sum.total);
    const totalRecebido = decimal(recebidoPeriodo._sum.valor);
    const totalPago = decimal(pagoPeriodo._sum.valor);
    const lucroLiquido = totalRecebido - totalPago;
    const pedidosCount = pedidosPeriodo._count;
    const ticketMedio = pedidosCount > 0 ? faturamentoPeriodo / pedidosCount : 0;

    return {
      faturamentoDia: decimal(faturamentoDia._sum.total),
      faturamentoMes: decimal(faturamentoMes._sum.total),
      faturamentoPeriodo,
      lucroBruto: faturamentoPeriodo - custoVendido,
      lucroLiquido,
      totalRecebido,
      totalPago,
      saldoAtual: saldos.saldoAtual,
      fluxoCaixa: totalRecebido - totalPago,
      ticketMedio,
      quantidadePedidos: pedidosCount,
      pedidosMes,
      quantidadeClientes: clientesAtivos,
      produtosVendidos: decimal(produtosVendidos._sum.quantidade),
      receitasRecebidas: decimal(receitasRecebidas._sum.valor),
      despesasPagas: decimal(despesasPagas._sum.valor),
      saldoBancario: saldos.saldoBancario,
      saldoCaixa: saldos.saldoCaixa,
    };
  }

  async getFinancialIndicators() {
    const openReceivable = ["PENDENTE", "PARCIALMENTE_RECEBIDO", "VENCIDO"] as const;
    const openPayable = ["PENDENTE", "PARCIALMENTE_PAGO", "VENCIDO"] as const;

    const [
      contasReceber,
      contasPagar,
      despesasPendentes,
      despesasPagas,
      receitasPendentes,
      receitasRecebidas,
      saldos,
    ] = await Promise.all([
      this.prisma.accountReceivable.aggregate({
        where: { deletedAt: null, status: { in: [...openReceivable] } },
        _sum: { saldo: true },
      }),
      this.prisma.accountPayable.aggregate({
        where: { deletedAt: null, status: { in: [...openPayable] } },
        _sum: { saldo: true },
      }),
      this.prisma.expense.aggregate({
        where: {
          deletedAt: null,
          status: { in: ["PENDENTE", "PARCIALMENTE_PAGO", "VENCIDO"] },
        },
        _sum: { valor: true },
        _count: true,
      }),
      this.prisma.expense.aggregate({
        where: { deletedAt: null, status: "PAGO" },
        _sum: { valor: true },
        _count: true,
      }),
      this.prisma.accountReceivable.aggregate({
        where: {
          deletedAt: null,
          status: { in: ["PENDENTE", "PARCIALMENTE_RECEBIDO"] },
        },
        _sum: { saldo: true },
      }),
      this.prisma.accountReceivable.aggregate({
        where: { deletedAt: null, status: "RECEBIDO" },
        _sum: { valorRecebido: true },
      }),
      this.getBalances(),
    ]);

    return {
      contasAReceber: decimal(contasReceber._sum.saldo),
      contasAPagar: decimal(contasPagar._sum.saldo),
      despesasPendentes: {
        quantidade: despesasPendentes._count,
        valor: decimal(despesasPendentes._sum.valor),
      },
      despesasPagas: {
        quantidade: despesasPagas._count,
        valor: decimal(despesasPagas._sum.valor),
      },
      receitasPendentes: decimal(receitasPendentes._sum.saldo),
      receitasRecebidas: decimal(receitasRecebidas._sum.valorRecebido),
      saldoBancario: saldos.saldoBancario,
      saldoCaixa: saldos.saldoCaixa,
    };
  }

  async getCommercialIndicators(range: DateRange) {
    const today: DateRange = {
      preset: "HOJE",
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
    };
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [
      pedidosHoje,
      pedidosMes,
      clientesAtivos,
      novosClientes,
      totalPedidos,
      pedidosConfirmados,
      vendasPorProduto,
      topProdutos,
    ] = await Promise.all([
      this.prisma.order.count({
        where: { createdAt: { gte: today.start, lte: today.end } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: monthStart, lte: today.end } },
      }),
      this.prisma.customer.count({ where: { ativo: true } }),
      this.prisma.customer.count({
        where: {
          createdAt: { gte: range.start, lte: range.end },
        },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: range.start, lte: range.end } },
      }),
      this.prisma.order.count({
        where: {
          status: { in: [...REVENUE_ORDER_STATUSES] },
          createdAt: { gte: range.start, lte: range.end },
        },
      }),
      this.prisma.orderItem.groupBy({
        by: ["produtoId"],
        where: { order: this.orderRevenueWhere(range) },
        _sum: { subtotal: true, quantidade: true },
        orderBy: { _sum: { subtotal: "desc" } },
        take: 8,
      }),
      this.prisma.orderItem.groupBy({
        by: ["produtoId", "produtoNome"],
        where: { order: this.orderRevenueWhere(range) },
        _sum: { quantidade: true, subtotal: true },
        orderBy: { _sum: { quantidade: "desc" } },
        take: 8,
      }),
    ]);

    const produtoIds = vendasPorProduto.map((item) => item.produtoId);
    const produtos = produtoIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: produtoIds } },
          include: { categoria: true },
        })
      : [];
    const produtoMap = new Map(produtos.map((p) => [p.id, p]));

    const porCategoria = vendasPorProduto.reduce<
      Record<string, { categoriaId: string; categoriaNome: string; total: number }>
    >((acc, item) => {
      const produto = produtoMap.get(item.produtoId);
      const key = produto?.categoriaId ?? "outros";
      const nome = produto?.categoria?.nome ?? "Outros";
      const current = acc[key] ?? { categoriaId: key, categoriaNome: nome, total: 0 };
      current.total += decimal(item._sum.subtotal);
      acc[key] = current;
      return acc;
    }, {});

    return {
      pedidosHoje,
      pedidosMes,
      vendasPorCategoria: Object.values(porCategoria),
      produtosMaisVendidos: topProdutos.map((item) => ({
        produtoId: item.produtoId,
        produtoNome: item.produtoNome,
        quantidade: decimal(item._sum.quantidade),
        total: decimal(item._sum.subtotal),
      })),
      clientesAtivos,
      novosClientes,
      conversaoPedidos:
        totalPedidos > 0
          ? Math.round((pedidosConfirmados / totalPedidos) * 10000) / 100
          : 0,
    };
  }

  async getInventoryIndicators() {
    const [emEstoque, semEstoque, estoqueBaixo, valorEstoque, comprasPendentes] =
      await Promise.all([
        this.prisma.inventory.count({
          where: { quantidadeDisponivel: { gt: 0 } },
        }),
        this.prisma.inventory.count({ where: { status: "SEM_ESTOQUE" } }),
        this.prisma.inventory.count({ where: { status: "ESTOQUE_BAIXO" } }),
        this.prisma.$queryRaw<Array<{ total: string }>>`
        SELECT COALESCE(SUM(i.quantidade_disponivel * COALESCE(v.custo, v.preco, 0)), 0) AS total
        FROM inventory i
        INNER JOIN product_variants v ON v.id = i.variant_id
      `,
        this.prisma.purchaseOrder.count({
          where: {
            deletedAt: null,
            status: {
              in: [
                "AGUARDANDO_APROVACAO",
                "APROVADA",
                "ENVIADA",
                "RECEBIMENTO_PARCIAL",
              ],
            },
          },
        }),
      ]);

    return {
      produtosEmEstoque: emEstoque,
      produtosSemEstoque: semEstoque,
      produtosEstoqueBaixo: estoqueBaixo,
      valorTotalEstoque: decimal(valorEstoque[0]?.total),
      comprasPendentes,
    };
  }

  async getComparisons(tipo: "DIA" | "SEMANA" | "MES" | "ANO") {
    const ranges =
      tipo === "DIA"
        ? previousDayRange()
        : tipo === "SEMANA"
          ? previousWeekRanges()
          : tipo === "ANO"
            ? previousYearRanges()
            : previousMonthRanges();

    const [current, previous] = await Promise.all([
      this.getMainCards(ranges.current),
      this.getMainCards(ranges.previous),
    ]);

    return {
      tipo,
      faturamento: comparisonResult(
        current.faturamentoPeriodo,
        previous.faturamentoPeriodo,
      ),
      lucroLiquido: comparisonResult(current.lucroLiquido, previous.lucroLiquido),
      totalRecebido: comparisonResult(current.totalRecebido, previous.totalRecebido),
      totalPago: comparisonResult(current.totalPago, previous.totalPago),
      pedidos: comparisonResult(current.quantidadePedidos, previous.quantidadePedidos),
      ticketMedio: comparisonResult(current.ticketMedio, previous.ticketMedio),
    };
  }

  private async getBalances() {
    const [accounts, cashboxes] = await Promise.all([
      this.financialRepository.findBankAccounts(),
      this.financialRepository.findCashboxes(),
    ]);

    const bankBalances = await Promise.all(
      accounts.map((account) => this.balanceService.getBankAccountBalance(account)),
    );
    const cashboxBalances = await Promise.all(
      cashboxes.map((cashbox) => this.balanceService.getCashboxBalance(cashbox)),
    );

    const saldoBancario = bankBalances.reduce((sum, item) => sum + item.saldoAtual, 0);
    const saldoCaixa = cashboxBalances.reduce((sum, item) => sum + item.saldoAtual, 0);

    return {
      saldoBancario,
      saldoCaixa,
      saldoAtual: saldoBancario + saldoCaixa,
    };
  }
}

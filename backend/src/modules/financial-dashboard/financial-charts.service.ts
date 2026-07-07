import { Injectable } from "@nestjs/common";
import { CashFlowType, FinancialTransactionType } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import {
  DateRange,
  decimal,
  endOfDay,
  REVENUE_ORDER_STATUSES,
  startOfDay,
  subtractDays,
} from "./financial-dashboard.utils";

@Injectable()
export class FinancialChartsService {
  constructor(private readonly prisma: PrismaService) {}

  private orderRevenueWhere(range: DateRange) {
    return {
      status: { in: [...REVENUE_ORDER_STATUSES] },
      createdAt: { gte: range.start, lte: range.end },
    };
  }

  async getCharts(range: DateRange) {
    const [
      receitasVsDespesas,
      fluxoCaixaDiario,
      fluxoCaixaMensal,
      faturamentoMensal,
      vendasPorCategoria,
      comprasPorMes,
      produtosMaisVendidos,
    ] = await Promise.all([
      this.getReceitasVsDespesas(range),
      this.getFluxoCaixaDiario(range),
      this.getFluxoCaixaMensal(range),
      this.getFaturamentoMensal(range),
      this.getVendasPorCategoria(range),
      this.getComprasPorMes(range),
      this.getProdutosMaisVendidos(range),
    ]);

    return {
      receitasVsDespesas,
      fluxoCaixaDiario,
      fluxoCaixaMensal,
      faturamentoMensal,
      vendasPorCategoria,
      comprasPorMes,
      produtosMaisVendidos,
    };
  }

  private async getReceitasVsDespesas(range: DateRange) {
    const [receitas, despesas] = await Promise.all([
      this.prisma.accountReceivableReceipt.groupBy({
        by: ["recebidoEm"],
        where: {
          estornado: false,
          recebidoEm: { gte: range.start, lte: range.end },
        },
        _sum: { valor: true },
      }),
      this.prisma.accountPayablePayment.groupBy({
        by: ["pagoEm"],
        where: {
          estornado: false,
          pagoEm: { gte: range.start, lte: range.end },
        },
        _sum: { valor: true },
      }),
    ]);

    const map = new Map<string, { periodo: string; receitas: number; despesas: number }>();

    for (const item of receitas) {
      const key = item.recebidoEm.toISOString().slice(0, 10);
      const current = map.get(key) ?? { periodo: key, receitas: 0, despesas: 0 };
      current.receitas += decimal(item._sum.valor);
      map.set(key, current);
    }

    for (const item of despesas) {
      const key = item.pagoEm.toISOString().slice(0, 10);
      const current = map.get(key) ?? { periodo: key, receitas: 0, despesas: 0 };
      current.despesas += decimal(item._sum.valor);
      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }

  private async getFluxoCaixaDiario(range: DateRange) {
    const entradas: CashFlowType[] = ["ENTRADA", "AJUSTE_POSITIVO"];
    const saidas: CashFlowType[] = ["SAIDA", "AJUSTE_NEGATIVO"];

    const entries = await this.prisma.cashFlowEntry.findMany({
      where: { createdAt: { gte: range.start, lte: range.end } },
      select: { createdAt: true, tipo: true, valor: true },
      orderBy: { createdAt: "asc" },
    });

    const map = new Map<string, { periodo: string; entradas: number; saidas: number; saldo: number }>();

    for (const entry of entries) {
      const key = entry.createdAt.toISOString().slice(0, 10);
      const current = map.get(key) ?? { periodo: key, entradas: 0, saidas: 0, saldo: 0 };
      const valor = decimal(entry.valor);

      if (entradas.includes(entry.tipo)) {
        current.entradas += valor;
        current.saldo += valor;
      } else if (saidas.includes(entry.tipo)) {
        current.saidas += valor;
        current.saldo -= valor;
      }

      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }

  private async getFluxoCaixaMensal(range: DateRange) {
    const entradas: CashFlowType[] = ["ENTRADA", "AJUSTE_POSITIVO"];
    const saidas: CashFlowType[] = ["SAIDA", "AJUSTE_NEGATIVO"];

    const entries = await this.prisma.cashFlowEntry.findMany({
      where: { createdAt: { gte: range.start, lte: range.end } },
      select: { createdAt: true, tipo: true, valor: true },
    });

    const map = new Map<string, { periodo: string; entradas: number; saidas: number; saldo: number }>();

    for (const entry of entries) {
      const key = `${entry.createdAt.getFullYear()}-${String(entry.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const current = map.get(key) ?? { periodo: key, entradas: 0, saidas: 0, saldo: 0 };
      const valor = decimal(entry.valor);

      if (entradas.includes(entry.tipo)) {
        current.entradas += valor;
        current.saldo += valor;
      } else if (saidas.includes(entry.tipo)) {
        current.saidas += valor;
        current.saldo -= valor;
      }

      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }

  private async getFaturamentoMensal(range: DateRange) {
    const orders = await this.prisma.order.findMany({
      where: this.orderRevenueWhere(range),
      select: { createdAt: true, total: true },
    });

    const map = new Map<string, { periodo: string; total: number; pedidos: number }>();

    for (const order of orders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const current = map.get(key) ?? { periodo: key, total: 0, pedidos: 0 };
      current.total += decimal(order.total);
      current.pedidos += 1;
      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }

  private async getVendasPorCategoria(range: DateRange) {
    const items = await this.prisma.orderItem.groupBy({
      by: ["produtoId"],
      where: { order: this.orderRevenueWhere(range) },
      _sum: { subtotal: true },
    });

    const produtoIds = items.map((item) => item.produtoId);
    const produtos = produtoIds.length
      ? await this.prisma.product.findMany({
          where: { id: { in: produtoIds } },
          include: { categoria: true },
        })
      : [];

    const produtoMap = new Map(produtos.map((p) => [p.id, p]));
    const map = new Map<string, { categoriaId: string; categoriaNome: string; total: number }>();

    for (const item of items) {
      const produto = produtoMap.get(item.produtoId);
      const key = produto?.categoriaId ?? "outros";
      const nome = produto?.categoria?.nome ?? "Outros";
      const current = map.get(key) ?? { categoriaId: key, categoriaNome: nome, total: 0 };
      current.total += decimal(item._sum.subtotal);
      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }

  private async getComprasPorMes(range: DateRange) {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: {
        deletedAt: null,
        createdAt: { gte: range.start, lte: range.end },
        status: { not: "CANCELADA" },
      },
      select: { createdAt: true, total: true },
    });

    const map = new Map<string, { periodo: string; total: number; quantidade: number }>();

    for (const order of orders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, "0")}`;
      const current = map.get(key) ?? { periodo: key, total: 0, quantidade: 0 };
      current.total += decimal(order.total);
      current.quantidade += 1;
      map.set(key, current);
    }

    return Array.from(map.values()).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }

  private async getProdutosMaisVendidos(range: DateRange) {
    const items = await this.prisma.orderItem.groupBy({
      by: ["produtoId", "produtoNome"],
      where: { order: this.orderRevenueWhere(range) },
      _sum: { quantidade: true, subtotal: true },
      orderBy: { _sum: { quantidade: "desc" } },
      take: 10,
    });

    return items.map((item) => ({
      produtoId: item.produtoId,
      produtoNome: item.produtoNome,
      quantidade: decimal(item._sum.quantidade),
      total: decimal(item._sum.subtotal),
    }));
  }

  async getDailySeries(days = 30) {
    const end = endOfDay(new Date());
    const start = startOfDay(subtractDays(end, days - 1));
    return this.getFluxoCaixaDiario({ start, end, preset: "ULTIMOS_30_DIAS" });
  }

  async getTransactionSummary(range: DateRange) {
    const [receitas, despesas] = await Promise.all([
      this.prisma.financialTransaction.aggregate({
        where: {
          deletedAt: null,
          tipo: FinancialTransactionType.RECEITA,
          data: { gte: range.start, lte: range.end },
        },
        _sum: { valor: true },
      }),
      this.prisma.financialTransaction.aggregate({
        where: {
          deletedAt: null,
          tipo: FinancialTransactionType.DESPESA,
          data: { gte: range.start, lte: range.end },
        },
        _sum: { valor: true },
      }),
    ]);

    return {
      receitas: decimal(receitas._sum.valor),
      despesas: decimal(despesas._sum.valor),
    };
  }
}

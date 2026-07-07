import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { FinancialDashboardQueryDto, FinancialDashboardSummaryQueryDto } from "./dto/financial-dashboard.dto";
import { FinancialChartsService } from "./financial-charts.service";
import { FinancialIndicatorsService } from "./financial-indicators.service";
import { decimal, resolveDateRange } from "./financial-dashboard.utils";

@Injectable()
export class FinancialDashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly indicatorsService: FinancialIndicatorsService,
    private readonly chartsService: FinancialChartsService,
  ) {}

  async getFullDashboard(query: FinancialDashboardQueryDto) {
    const range = resolveDateRange(query);

    const [cards, financeiro, comercial, estoque, charts, alerts] = await Promise.all([
      this.indicatorsService.getMainCards(range),
      this.indicatorsService.getFinancialIndicators(),
      this.indicatorsService.getCommercialIndicators(range),
      this.indicatorsService.getInventoryIndicators(),
      this.chartsService.getCharts(range),
      this.getAlerts(),
    ]);

    return {
      periodo: {
        preset: range.preset,
        dataInicio: range.start.toISOString(),
        dataFim: range.end.toISOString(),
      },
      cards,
      financeiro,
      comercial,
      estoque,
      charts,
      alerts,
    };
  }

  async getCards(query: FinancialDashboardQueryDto) {
    const range = resolveDateRange(query);
    return {
      periodo: {
        preset: range.preset,
        dataInicio: range.start.toISOString(),
        dataFim: range.end.toISOString(),
      },
      ...await this.indicatorsService.getMainCards(range),
    };
  }

  async getCharts(query: FinancialDashboardQueryDto) {
    const range = resolveDateRange(query);
    return {
      periodo: {
        preset: range.preset,
        dataInicio: range.start.toISOString(),
        dataFim: range.end.toISOString(),
      },
      ...(await this.chartsService.getCharts(range)),
    };
  }

  async getSummary(query: FinancialDashboardSummaryQueryDto) {
    const range = resolveDateRange(query);
    const comparativo = query.comparativo ?? "MES";

    const [cards, financeiro, comercial, estoque, comparacoes] = await Promise.all([
      this.indicatorsService.getMainCards(range),
      this.indicatorsService.getFinancialIndicators(),
      this.indicatorsService.getCommercialIndicators(range),
      this.indicatorsService.getInventoryIndicators(),
      this.indicatorsService.getComparisons(comparativo),
    ]);

    return {
      periodo: {
        preset: range.preset,
        dataInicio: range.start.toISOString(),
        dataFim: range.end.toISOString(),
      },
      cards,
      financeiro,
      comercial,
      estoque,
      comparacoes,
    };
  }

  async getAlerts() {
    const now = new Date();

    const [
      receberVencidas,
      pagarVencidas,
      despesasVencidas,
      pedidosAguardando,
      comprasPendentes,
      semEstoque,
      estoqueBaixo,
      saldoNegativo,
    ] = await Promise.all([
      this.prisma.accountReceivable.findMany({
        where: { deletedAt: null, status: "VENCIDO" },
        take: 10,
        orderBy: { vencimento: "asc" },
        select: {
          id: true,
          numero: true,
          saldo: true,
          vencimento: true,
          customer: { select: { nome: true } },
        },
      }),
      this.prisma.accountPayable.findMany({
        where: { deletedAt: null, status: "VENCIDO" },
        take: 10,
        orderBy: { vencimento: "asc" },
        select: {
          id: true,
          numero: true,
          saldo: true,
          vencimento: true,
          supplier: { select: { nomeFantasia: true } },
        },
      }),
      this.prisma.expense.findMany({
        where: { deletedAt: null, status: "VENCIDO" },
        take: 10,
        orderBy: { vencimento: "asc" },
        select: {
          id: true,
          numero: true,
          descricao: true,
          valor: true,
          vencimento: true,
        },
      }),
      this.prisma.order.findMany({
        where: { status: "AGUARDANDO_CONFIRMACAO" },
        take: 10,
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          numero: true,
          clienteNome: true,
          total: true,
          createdAt: true,
        },
      }),
      this.prisma.purchaseOrder.findMany({
        where: {
          deletedAt: null,
          status: { in: ["AGUARDANDO_APROVACAO", "APROVADA", "ENVIADA", "RECEBIMENTO_PARCIAL"] },
        },
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          numero: true,
          status: true,
          total: true,
          createdAt: true,
        },
      }),
      this.prisma.inventory.findMany({
        where: { status: "SEM_ESTOQUE" },
        take: 10,
        orderBy: { updatedAt: "desc" },
        include: {
          variant: {
            include: { produto: { select: { nome: true } } },
          },
        },
      }),
      this.prisma.inventory.findMany({
        where: { status: "ESTOQUE_BAIXO" },
        take: 10,
        orderBy: { quantidadeDisponivel: "asc" },
        include: {
          variant: {
            include: { produto: { select: { nome: true } } },
          },
        },
      }),
      this.indicatorsService.getMainCards({
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
        preset: "ESTE_MES",
      }),
    ]);

    const alertas: Array<{
      tipo: string;
      severidade: "ALTA" | "MEDIA" | "BAIXA";
      titulo: string;
      descricao: string;
      quantidade: number;
      valor?: number;
      itens?: unknown[];
    }> = [];

    if (receberVencidas.length > 0) {
      alertas.push({
        tipo: "CONTAS_RECEBER_VENCIDAS",
        severidade: "ALTA",
        titulo: "Contas a receber vencidas",
        descricao: `${receberVencidas.length} título(s) em atraso`,
        quantidade: receberVencidas.length,
        valor: receberVencidas.reduce((sum, item) => sum + decimal(item.saldo), 0),
        itens: receberVencidas.map((item) => ({
          id: item.id,
          numero: item.numero,
          cliente: item.customer.nome,
          saldo: decimal(item.saldo),
          vencimento: item.vencimento,
        })),
      });
    }

    if (pagarVencidas.length > 0) {
      alertas.push({
        tipo: "CONTAS_PAGAR_VENCIDAS",
        severidade: "ALTA",
        titulo: "Contas a pagar vencidas",
        descricao: `${pagarVencidas.length} obrigação(ões) em atraso`,
        quantidade: pagarVencidas.length,
        valor: pagarVencidas.reduce((sum, item) => sum + decimal(item.saldo), 0),
        itens: pagarVencidas.map((item) => ({
          id: item.id,
          numero: item.numero,
          fornecedor: item.supplier?.nomeFantasia ?? "—",
          saldo: decimal(item.saldo),
          vencimento: item.vencimento,
        })),
      });
    }

    if (despesasVencidas.length > 0) {
      alertas.push({
        tipo: "DESPESAS_VENCIDAS",
        severidade: "ALTA",
        titulo: "Despesas vencidas",
        descricao: `${despesasVencidas.length} despesa(s) vencida(s)`,
        quantidade: despesasVencidas.length,
        valor: despesasVencidas.reduce((sum, item) => sum + decimal(item.valor), 0),
        itens: despesasVencidas,
      });
    }

    if (semEstoque.length > 0) {
      alertas.push({
        tipo: "SEM_ESTOQUE",
        severidade: "MEDIA",
        titulo: "Produtos sem estoque",
        descricao: `${semEstoque.length} produto(s) zerados`,
        quantidade: semEstoque.length,
        itens: semEstoque.map((item) => ({
          variantId: item.variantId,
          produto: item.variant.produto.nome,
          sku: item.variant.sku,
        })),
      });
    }

    if (estoqueBaixo.length > 0) {
      alertas.push({
        tipo: "ESTOQUE_BAIXO",
        severidade: "MEDIA",
        titulo: "Estoque mínimo atingido",
        descricao: `${estoqueBaixo.length} produto(s) abaixo do mínimo`,
        quantidade: estoqueBaixo.length,
        itens: estoqueBaixo.map((item) => ({
          variantId: item.variantId,
          produto: item.variant.produto.nome,
          sku: item.variant.sku,
          disponivel: item.quantidadeDisponivel,
          minimo: item.estoqueMinimo,
        })),
      });
    }

    if (pedidosAguardando.length > 0) {
      alertas.push({
        tipo: "PEDIDOS_AGUARDANDO",
        severidade: "MEDIA",
        titulo: "Pedidos aguardando atendimento",
        descricao: `${pedidosAguardando.length} pedido(s) pendentes de confirmação`,
        quantidade: pedidosAguardando.length,
        itens: pedidosAguardando.map((item) => ({
          id: item.id,
          numero: item.numero,
          cliente: item.clienteNome,
          total: decimal(item.total),
          criadoEm: item.createdAt,
        })),
      });
    }

    if (comprasPendentes.length > 0) {
      alertas.push({
        tipo: "COMPRAS_PENDENTES",
        severidade: "BAIXA",
        titulo: "Compras pendentes",
        descricao: `${comprasPendentes.length} ordem(ns) de compra em andamento`,
        quantidade: comprasPendentes.length,
        itens: comprasPendentes.map((item) => ({
          id: item.id,
          numero: item.numero,
          status: item.status,
          total: decimal(item.total),
        })),
      });
    }

    if (saldoNegativo.fluxoCaixa < 0) {
      alertas.push({
        tipo: "FLUXO_CAIXA_NEGATIVO",
        severidade: "ALTA",
        titulo: "Fluxo de caixa negativo",
        descricao: "Saídas superiores às entradas no período atual",
        quantidade: 1,
        valor: saldoNegativo.fluxoCaixa,
      });
    }

    return {
      total: alertas.length,
      alertas,
    };
  }
}

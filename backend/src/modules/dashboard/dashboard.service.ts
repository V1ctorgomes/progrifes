import { Injectable } from "@nestjs/common";
import {
  InventoryStatus,
  OrderStatus,
  PaymentMethod,
  UserRole,
} from "@prisma/client";
import { hasPermission } from "../../common/permissions/role-permissions";
import { AuthUser } from "../../common/interfaces/jwt-payload.interface";
import { PrismaService } from "../../database/prisma.service";
import { getStatusMeta } from "../orders/order-status.config";
import { DashboardQueryDto } from "./dto/dashboard.dto";
import {
  comparisonResult,
  DateRange,
  decimal,
  eachDayKeys,
  resolveDashboardDateRange,
  REVENUE_ORDER_STATUSES,
  startOfDay,
  subtractDays,
} from "./dashboard.utils";

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  PIX: "PIX",
  DINHEIRO: "Dinheiro",
  CARTAO_ENTREGA: "Cartão",
};

const ORDER_STATUS_GROUPS: Array<{ key: string; label: string; statuses: OrderStatus[] }> = [
  {
    key: "recebido",
    label: "Recebido",
    statuses: ["AGUARDANDO_CONFIRMACAO", "CONFIRMADO"],
  },
  { key: "separacao", label: "Separação", statuses: ["SEPARANDO"] },
  {
    key: "entrega",
    label: "Entrega",
    statuses: ["PRONTO_PARA_ENTREGA", "SAIU_PARA_ENTREGA"],
  },
  { key: "concluido", label: "Concluído", statuses: ["ENTREGUE"] },
  { key: "cancelado", label: "Cancelado", statuses: ["CANCELADO"] },
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  private can(user: AuthUser, permission: string) {
    return hasPermission(user.cargo as UserRole, permission);
  }

  private periodPayload(range: DateRange) {
    return {
      preset: range.preset,
      dataInicio: range.start.toISOString(),
      dataFim: range.end.toISOString(),
    };
  }

  private revenueWhere(range: DateRange) {
    return {
      status: { in: [...REVENUE_ORDER_STATUSES] },
      createdAt: { gte: range.start, lte: range.end },
    };
  }

  async getFullDashboard(query: DashboardQueryDto, user: AuthUser) {
    const range = resolveDashboardDateRange(query);
    const [cards, charts, recentOrders, productSales, stock, financial, deliveries] =
      await Promise.all([
        this.getCards(query, user),
        this.can(user, "orders:read") ? this.buildCharts(range) : null,
        this.can(user, "orders:read") ? this.buildRecentOrders() : [],
        this.can(user, "orders:read") ? this.buildProductSalesRanking(range) : null,
        this.can(user, "stock:read") ? this.buildStockSummary() : null,
        this.can(user, "finance:read") ? this.buildFinancialSummary(range) : null,
        this.can(user, "orders:read") ? this.buildDeliveriesSummary(range) : null,
      ]);

    return {
      periodo: this.periodPayload(range),
      cards: cards.cards,
      charts,
      recentOrders,
      productSales,
      stock,
      financial,
      deliveries,
      customers: null,
      activities: [],
      shortcuts: [],
    };
  }

  async getCards(query: DashboardQueryDto, user: AuthUser) {
    const range = resolveDashboardDateRange(query);
    const todayStart = startOfDay(new Date());
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const canOrders = this.can(user, "orders:read");
    const canStock = this.can(user, "stock:read");

    const [
      pedidosHoje,
      pedidosHojeAnterior,
      vendasHoje,
      vendasHojeAnterior,
      semEstoque,
      entregasPendentes,
    ] = await Promise.all([
      canOrders
        ? this.prisma.order.count({ where: { createdAt: { gte: todayStart, lte: todayEnd } } })
        : Promise.resolve(0),
      canOrders
        ? this.prisma.order.count({
            where: {
              createdAt: {
                gte: startOfDay(subtractDays(new Date(), 1)),
                lte: (() => {
                  const d = subtractDays(new Date(), 1);
                  d.setHours(23, 59, 59, 999);
                  return d;
                })(),
              },
            },
          })
        : Promise.resolve(0),
      canOrders
        ? this.prisma.order.aggregate({
            where: this.revenueWhere({
              preset: "HOJE",
              start: todayStart,
              end: todayEnd,
            }),
            _sum: { total: true },
            _count: true,
          })
        : Promise.resolve({ _sum: { total: null }, _count: 0 }),
      canOrders
        ? this.prisma.order.aggregate({
            where: this.revenueWhere({
              preset: "ONTEM",
              start: startOfDay(subtractDays(new Date(), 1)),
              end: (() => {
                const d = subtractDays(new Date(), 1);
                d.setHours(23, 59, 59, 999);
                return d;
              })(),
            }),
            _sum: { total: true },
            _count: true,
          })
        : Promise.resolve({ _sum: { total: null }, _count: 0 }),
      canStock
        ? this.prisma.inventory.count({ where: { status: InventoryStatus.SEM_ESTOQUE } })
        : Promise.resolve(0),
      canOrders
        ? this.prisma.delivery.count({
            where: {
              status: {
                in: [
                  "PEDIDO_RECEBIDO",
                  "EM_SEPARACAO",
                  "PRONTO_PARA_ENTREGA",
                  "SAIU_PARA_ENTREGA",
                ],
              },
            },
          })
        : Promise.resolve(0),
    ]);

    const cards = [
      canOrders
        ? {
            id: "pedidos-hoje",
            titulo: "Pedidos Hoje",
            valor: pedidosHoje,
            formato: "number" as const,
            href: "/admin/pedidos",
            comparacao: comparisonResult(pedidosHoje, pedidosHojeAnterior),
          }
        : null,
      canOrders
        ? {
            id: "faturamento-dia",
            titulo: "Faturamento do Dia",
            valor: decimal(vendasHoje._sum.total),
            formato: "currency" as const,
            href: "/admin/pedidos",
            comparacao: comparisonResult(
              decimal(vendasHoje._sum.total),
              decimal(vendasHojeAnterior._sum.total),
            ),
          }
        : null,
      canOrders
        ? {
            id: "entregas-pendentes",
            titulo: "Entregas Pendentes",
            valor: entregasPendentes,
            formato: "number" as const,
            href: "/admin/entregas",
            comparacao: null,
          }
        : null,
      canStock
        ? {
            id: "sem-estoque",
            titulo: "Produtos Sem Estoque",
            valor: semEstoque,
            formato: "number" as const,
            href: "/admin/estoque",
            comparacao: null,
          }
        : null,
    ].filter(Boolean);

    return {
      periodo: this.periodPayload(range),
      cards,
    };
  }

  async getCharts(query: DashboardQueryDto, user: AuthUser) {
    const range = resolveDashboardDateRange(query);
    if (!this.can(user, "orders:read")) {
      return { periodo: this.periodPayload(range), charts: null };
    }
    return {
      periodo: this.periodPayload(range),
      charts: await this.buildCharts(range),
    };
  }

  async getRecentOrders(user: AuthUser) {
    if (!this.can(user, "orders:read")) return [];
    return this.buildRecentOrders();
  }

  async getActivities(user: AuthUser) {
    return this.buildActivities(user);
  }

  private async buildCharts(range: DateRange) {
    const dayKeys = eachDayKeys(range);

    const [orders, paymentGroups, statusGroups] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: range.start, lte: range.end } },
        select: {
          createdAt: true,
          total: true,
          status: true,
          formaPagamento: true,
        },
      }),
      this.prisma.order.groupBy({
        by: ["formaPagamento"],
        where: {
          createdAt: { gte: range.start, lte: range.end },
          status: { not: OrderStatus.CANCELADO },
        },
        _count: true,
        _sum: { total: true },
      }),
      this.prisma.order.groupBy({
        by: ["status"],
        where: { createdAt: { gte: range.start, lte: range.end } },
        _count: true,
      }),
    ]);

    const faturamentoMap = new Map(dayKeys.map((key) => [key, 0]));
    const pedidosMap = new Map(dayKeys.map((key) => [key, 0]));

    for (const order of orders) {
      if (order.status === OrderStatus.CANCELADO) continue;
      const key = order.createdAt.toISOString().slice(0, 10);
      if (REVENUE_ORDER_STATUSES.includes(order.status as (typeof REVENUE_ORDER_STATUSES)[number])) {
        faturamentoMap.set(key, (faturamentoMap.get(key) ?? 0) + decimal(order.total));
      }
      pedidosMap.set(key, (pedidosMap.get(key) ?? 0) + 1);
    }

    const statusCount = new Map(statusGroups.map((item) => [item.status, item._count]));

    return {
      faturamento: dayKeys.map((periodo) => ({
        periodo,
        valor: Math.round((faturamentoMap.get(periodo) ?? 0) * 100) / 100,
      })),
      pedidos: dayKeys.map((periodo) => ({
        periodo,
        quantidade: pedidosMap.get(periodo) ?? 0,
      })),
      formasPagamento: paymentGroups.map((item) => ({
        metodo: item.formaPagamento,
        label: PAYMENT_LABELS[item.formaPagamento] ?? item.formaPagamento,
        quantidade: item._count,
        valor: decimal(item._sum.total),
      })),
      statusPedidos: ORDER_STATUS_GROUPS.map((group) => ({
        key: group.key,
        label: group.label,
        quantidade: group.statuses.reduce(
          (sum, status) => sum + (statusCount.get(status) ?? 0),
          0,
        ),
      })).filter((item) => item.quantidade > 0),
    };
  }

  private async buildRecentOrders() {
    const orders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        numero: true,
        clienteNome: true,
        total: true,
        status: true,
        createdAt: true,
      },
    });

    return orders.map((order) => ({
      id: order.id,
      numero: order.numero,
      numeroFormatado: `#${String(order.numero).padStart(6, "0")}`,
      clienteNome: order.clienteNome,
      total: decimal(order.total),
      status: order.status,
      statusLabel: getStatusMeta(order.status).nome,
      createdAt: order.createdAt.toISOString(),
      href: `/admin/pedidos/${order.id}`,
    }));
  }

  private async buildProductSalesRanking(range: DateRange) {
    const grouped = await this.prisma.orderItem.groupBy({
      by: ["produtoId"],
      where: {
        order: {
          createdAt: { gte: range.start, lte: range.end },
          status: { not: OrderStatus.CANCELADO },
        },
      },
      _sum: { quantidade: true, subtotal: true },
    });

    if (grouped.length === 0) {
      return { maisVendidos: [], menosVendidos: [] };
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: grouped.map((item) => item.produtoId) } },
      select: { id: true, nome: true },
    });
    const productNameById = new Map(products.map((product) => [product.id, product.nome]));

    const ranked = grouped
      .map((item) => ({
        id: item.produtoId,
        produtoNome: productNameById.get(item.produtoId) ?? "Produto",
        quantidade: item._sum.quantidade ?? 0,
        valor: decimal(item._sum.subtotal),
        href: `/admin/produtos/${item.produtoId}/variantes`,
      }))
      .sort((a, b) => b.quantidade - a.quantidade || b.valor - a.valor);

    const maisVendidos = ranked.slice(0, 5);
    const menosVendidos =
      ranked.length > 5
        ? ranked.slice(-5).reverse()
        : ranked.length > 1
          ? [ranked[ranked.length - 1]]
          : [];

    return {
      maisVendidos,
      menosVendidos,
    };
  }

  private async buildStockSummary() {
    const [semEstoque, estoqueBaixo] = await Promise.all([
      this.prisma.inventory.count({ where: { status: InventoryStatus.SEM_ESTOQUE } }),
      this.prisma.inventory.count({ where: { status: InventoryStatus.ESTOQUE_BAIXO } }),
    ]);

    return {
      semEstoque: [],
      estoqueBaixo: [],
      movimentacoes: [],
      totais: {
        semEstoque,
        estoqueBaixo,
      },
    };
  }

  private async buildFinancialSummary(range: DateRange) {
    const [receitas, despesas] = await Promise.all([
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
    ]);

    const receitasPeriodo = decimal(receitas._sum.valor);
    const despesasPeriodo = decimal(despesas._sum.valor);

    return {
      receitasPeriodo,
      despesasPeriodo,
      saldo: receitasPeriodo - despesasPeriodo,
      contasVencidas: {
        receber: { quantidade: 0, valor: 0 },
        pagar: { quantidade: 0, valor: 0 },
      },
      contasAVencer: {
        receber: { quantidade: 0, valor: 0 },
        pagar: { quantidade: 0, valor: 0 },
      },
    };
  }

  private async buildDeliveriesSummary(range: DateRange) {
    const groups = await this.prisma.delivery.groupBy({
      by: ["status"],
      where: { createdAt: { gte: range.start, lte: range.end } },
      _count: true,
    });

    const map = new Map(groups.map((item) => [item.status, item._count]));

    return {
      emPreparacao: (map.get("PEDIDO_RECEBIDO") ?? 0) + (map.get("EM_SEPARACAO") ?? 0),
      prontas: map.get("PRONTO_PARA_ENTREGA") ?? 0,
      saiuParaEntrega: map.get("SAIU_PARA_ENTREGA") ?? 0,
      concluidas: map.get("ENTREGUE") ?? 0,
      canceladas: (map.get("CANCELADO") ?? 0) + (map.get("NAO_ENTREGUE") ?? 0),
    };
  }

  private async buildCustomersSummary(range: DateRange) {
    const inactiveSince = subtractDays(new Date(), 60);

    const [novos, ativos, semCompras] = await Promise.all([
      this.prisma.customer.count({
        where: { createdAt: { gte: range.start, lte: range.end } },
      }),
      this.prisma.customer.count({
        where: {
          ativo: true,
          pedidos: {
            some: {
              createdAt: { gte: range.start, lte: range.end },
              status: { not: OrderStatus.CANCELADO },
            },
          },
        },
      }),
      this.prisma.customer.count({
        where: {
          ativo: true,
          OR: [
            { pedidos: { none: {} } },
            {
              pedidos: {
                every: { createdAt: { lt: inactiveSince } },
              },
            },
          ],
        },
      }),
    ]);

    return {
      novosClientes: novos,
      clientesAtivos: ativos,
      semComprasRecentes: semCompras,
    };
  }

  private async buildActivities(user: AuthUser) {
    const canOrders = this.can(user, "orders:read");
    const canProducts = this.can(user, "products:read");
    const canStock = this.can(user, "stock:read");
    const canSuppliers = this.can(user, "suppliers:read");
    const canFinance = this.can(user, "finance:read");

    const [orderHistory, products, movements, suppliers, receipts, payments] =
      await Promise.all([
        canOrders
          ? this.prisma.orderHistory.findMany({
              take: 15,
              orderBy: { createdAt: "desc" },
              include: {
                usuario: { select: { nome: true } },
                order: { select: { numero: true } },
              },
            })
          : Promise.resolve([]),
        canProducts
          ? this.prisma.product.findMany({
              where: { deletedAt: null },
              take: 8,
              orderBy: { createdAt: "desc" },
              select: { id: true, nome: true, createdAt: true },
            })
          : Promise.resolve([]),
        canStock
          ? this.prisma.inventoryMovement.findMany({
              take: 8,
              orderBy: { createdAt: "desc" },
              include: {
                variant: {
                  select: { sku: true, produto: { select: { nome: true } } },
                },
                usuario: { select: { nome: true } },
              },
            })
          : Promise.resolve([]),
        canSuppliers
          ? this.prisma.supplier.findMany({
              where: { deletedAt: null },
              take: 5,
              orderBy: { createdAt: "desc" },
              select: { id: true, nomeFantasia: true, createdAt: true },
            })
          : Promise.resolve([]),
        canFinance
          ? this.prisma.accountReceivableReceipt.findMany({
              take: 8,
              orderBy: { createdAt: "desc" },
              where: { estornado: false },
              include: {
                usuario: { select: { nome: true } },
                accountReceivable: { select: { numero: true } },
              },
            })
          : Promise.resolve([]),
        canFinance
          ? this.prisma.accountPayablePayment.findMany({
              take: 8,
              orderBy: { createdAt: "desc" },
              where: { estornado: false },
              include: {
                usuario: { select: { nome: true } },
                accountPayable: { select: { numero: true } },
              },
            })
          : Promise.resolve([]),
      ]);

    type Activity = {
      id: string;
      tipo: string;
      descricao: string;
      usuarioNome: string | null;
      createdAt: string;
    };

    const activities: Activity[] = [];

    for (const item of orderHistory) {
      const isCancel = item.status === OrderStatus.CANCELADO;
      activities.push({
        id: `order-history-${item.id}`,
        tipo: isCancel ? "PEDIDO_CANCELADO" : "PEDIDO",
        descricao: `${item.descricao} (#${String(item.order.numero).padStart(6, "0")})`,
        usuarioNome: item.usuario?.nome ?? null,
        createdAt: item.createdAt.toISOString(),
      });
    }

    for (const item of products) {
      activities.push({
        id: `product-${item.id}`,
        tipo: "PRODUTO_CADASTRADO",
        descricao: `Produto cadastrado: ${item.nome}`,
        usuarioNome: null,
        createdAt: item.createdAt.toISOString(),
      });
    }

    for (const item of movements) {
      activities.push({
        id: `movement-${item.id}`,
        tipo: "ESTOQUE_ATUALIZADO",
        descricao: `Estoque atualizado: ${item.variant.produto.nome} (${item.variant.sku}) — ${item.tipo}`,
        usuarioNome: item.usuario?.nome ?? null,
        createdAt: item.createdAt.toISOString(),
      });
    }

    for (const item of suppliers) {
      activities.push({
        id: `supplier-${item.id}`,
        tipo: "FORNECEDOR_CADASTRADO",
        descricao: `Fornecedor cadastrado: ${item.nomeFantasia}`,
        usuarioNome: null,
        createdAt: item.createdAt.toISOString(),
      });
    }

    for (const item of receipts) {
      activities.push({
        id: `receipt-${item.id}`,
        tipo: "CONTA_RECEBIDA",
        descricao: `Conta recebida #${item.accountReceivable.numero} — ${decimal(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
        usuarioNome: item.usuario?.nome ?? null,
        createdAt: item.createdAt.toISOString(),
      });
    }

    for (const item of payments) {
      activities.push({
        id: `payment-${item.id}`,
        tipo: "CONTA_PAGA",
        descricao: `Conta paga #${item.accountPayable.numero} — ${decimal(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
        usuarioNome: item.usuario?.nome ?? null,
        createdAt: item.createdAt.toISOString(),
      });
    }

    return activities
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 20);
  }

  private buildShortcuts(user: AuthUser) {
    const shortcuts = [
      {
        id: "novo-produto",
        label: "Novo Produto",
        href: "/admin/produtos",
        permission: "products:write",
      },
      {
        id: "novo-pedido",
        label: "Novo Pedido",
        href: "/admin/pedidos",
        permission: "orders:write",
      },
      {
        id: "novo-cliente",
        label: "Novo Cliente",
        href: "/admin/clientes",
        permission: "customers:write",
      },
      {
        id: "nova-compra",
        label: "Nova Compra",
        href: "/admin/compras",
        permission: "purchases:write",
      },
      {
        id: "nova-conta",
        label: "Nova Conta",
        href: "/admin/financeiro/contas-receber",
        permission: "receivables:write",
      },
      {
        id: "novo-fornecedor",
        label: "Novo Fornecedor",
        href: "/admin/fornecedores",
        permission: "suppliers:write",
      },
    ];

    return shortcuts.filter((item) => this.can(user, item.permission));
  }
}

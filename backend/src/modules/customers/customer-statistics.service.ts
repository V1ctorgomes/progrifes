import { Injectable, NotFoundException } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { getStatusMeta } from "../orders/order-status.config";

const OPEN_STATUSES: OrderStatus[] = [
  "AGUARDANDO_CONFIRMACAO",
  "CONFIRMADO",
  "SEPARANDO",
  "PRONTO_PARA_ENTREGA",
  "SAIU_PARA_ENTREGA",
];

export type PurchaseFrequency =
  | "NOVO_CLIENTE"
  | "RECORRENTE"
  | "ESPORADICO"
  | "INATIVO";

@Injectable()
export class CustomerStatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatistics(customerId: string) {
    await this.ensureCustomer(customerId);

    const orders = await this.prisma.order.findMany({
      where: { customerId },
      select: {
        id: true,
        numero: true,
        total: true,
        status: true,
        createdAt: true,
        itens: { select: { produtoNome: true, quantidade: true, produtoId: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const customer = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { createdAt: true, ativo: true },
    });

    const totals = orders.map((order) => Number(order.total));
    const quantidadePedidos = orders.length;
    const totalGasto = totals.reduce((sum, value) => sum + value, 0);
    const ticketMedio = quantidadePedidos > 0 ? totalGasto / quantidadePedidos : 0;
    const ultimaCompra = orders[0]?.createdAt ?? null;
    const pedidoEmAberto =
      orders.find((order) => OPEN_STATUSES.includes(order.status)) ?? null;

    const productMap = new Map<string, { nome: string; quantidade: number }>();
    for (const order of orders) {
      for (const item of order.itens) {
        const current = productMap.get(item.produtoId) ?? {
          nome: item.produtoNome,
          quantidade: 0,
        };
        current.quantidade += item.quantidade;
        productMap.set(item.produtoId, current);
      }
    }

    const produtosMaisComprados = [...productMap.values()]
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 10);

    return {
      clienteDesde: customer!.createdAt,
      ultimaCompra,
      quantidadePedidos,
      totalGasto,
      ticketMedio,
      maiorCompra: totals.length > 0 ? Math.max(...totals) : 0,
      menorCompra: totals.length > 0 ? Math.min(...totals) : 0,
      pedidoEmAberto: pedidoEmAberto
        ? {
            id: pedidoEmAberto.id,
            numero: pedidoEmAberto.numero,
            numeroFormatado: `#${String(pedidoEmAberto.numero).padStart(6, "0")}`,
            status: pedidoEmAberto.status,
            statusLabel: getStatusMeta(pedidoEmAberto.status).nome,
          }
        : null,
      frequenciaCompra: this.calculateFrequency(customer!.createdAt, orders),
      statusCliente: customer!.ativo ? "Ativo" : "Inativo",
      produtosMaisComprados,
    };
  }

  private calculateFrequency(
    customerCreatedAt: Date,
    orders: Array<{ createdAt: Date }>,
  ): PurchaseFrequency {
    const now = Date.now();
    const daysSince = (date: Date) => (now - date.getTime()) / (1000 * 60 * 60 * 24);

    if (orders.length === 0) {
      return daysSince(customerCreatedAt) > 30 ? "INATIVO" : "NOVO_CLIENTE";
    }

    if (orders.length === 1) {
      return daysSince(orders[0]!.createdAt) > 90 ? "INATIVO" : "NOVO_CLIENTE";
    }

    if (daysSince(orders[0]!.createdAt) > 90) {
      return "INATIVO";
    }

    const sorted = [...orders].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(
        (sorted[i]!.createdAt.getTime() - sorted[i - 1]!.createdAt.getTime()) /
          (1000 * 60 * 60 * 24),
      );
    }
    const avgInterval = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;

    if (orders.length >= 3 && avgInterval <= 60) {
      return "RECORRENTE";
    }

    return "ESPORADICO";
  }

  private async ensureCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado");
    }
    return customer;
  }
}

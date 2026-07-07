import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { getStatusMeta } from "../orders/order-status.config";

@Injectable()
export class CustomerHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async getHistory(customerId: string) {
    await this.ensureCustomer(customerId);

    const [customer, orders, notes, tagRelations] = await Promise.all([
      this.prisma.customer.findUnique({
        where: { id: customerId },
        select: { createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { customerId },
        select: {
          id: true,
          numero: true,
          status: true,
          createdAt: true,
          entregueEm: true,
          historico: {
            orderBy: { createdAt: "asc" },
            select: { status: true, descricao: true, createdAt: true },
          },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.customerNote.findMany({
        where: { customerId, deletedAt: null },
        include: { usuario: { select: { id: true, nome: true } } },
        orderBy: { createdAt: "asc" },
      }),
      this.prisma.customerTagRelation.findMany({
        where: { customerId },
        include: { tag: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

    const events: Array<{
      id: string;
      tipo: string;
      titulo: string;
      descricao: string;
      createdAt: Date;
      usuario?: { id: string; nome: string } | null;
    }> = [];

    events.push({
      id: `customer-created-${customerId}`,
      tipo: "CADASTRO",
      titulo: "Cliente cadastrado",
      descricao: "Cadastro criado no ERP",
      createdAt: customer!.createdAt,
    });

    for (const [index, order] of orders.entries()) {
      events.push({
        id: `order-created-${order.id}`,
        tipo: "PEDIDO",
        titulo: "Novo pedido",
        descricao: `Pedido #${String(order.numero).padStart(6, "0")} criado`,
        createdAt: order.createdAt,
      });

      if (index === 0) {
        events.push({
          id: `order-first-${order.id}`,
          tipo: "PEDIDO",
          titulo: "Primeiro pedido",
          descricao: "Primeira compra registrada",
          createdAt: order.createdAt,
        });
      }

      if (order.entregueEm) {
        events.push({
          id: `order-delivered-${order.id}`,
          tipo: "PEDIDO",
          titulo: "Pedido entregue",
          descricao: `Pedido #${String(order.numero).padStart(6, "0")} entregue`,
          createdAt: order.entregueEm,
        });
      }

      for (const entry of order.historico) {
        if (entry.status === "AGUARDANDO_CONFIRMACAO") continue;
        events.push({
          id: `order-history-${order.id}-${entry.createdAt.toISOString()}`,
          tipo: "STATUS",
          titulo: getStatusMeta(entry.status).nome,
          descricao: entry.descricao,
          createdAt: entry.createdAt,
        });
      }
    }

    for (const note of notes) {
      events.push({
        id: `note-${note.id}`,
        tipo: "OBSERVACAO",
        titulo: "Observação adicionada",
        descricao: note.descricao,
        createdAt: note.createdAt,
        usuario: note.usuario,
      });
    }

    for (const relation of tagRelations) {
      events.push({
        id: `tag-${relation.customerId}-${relation.tagId}`,
        tipo: "TAG",
        titulo: "Tag aplicada",
        descricao: `Tag "${relation.tag.nome}" adicionada`,
        createdAt: relation.createdAt,
      });
    }

    return events
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((event) => ({
        ...event,
        createdAt: event.createdAt,
      }));
  }

  private async ensureCustomer(customerId: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      throw new NotFoundException("Cliente não encontrado");
    }
    return customer;
  }
}

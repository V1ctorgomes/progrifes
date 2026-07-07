import { Injectable } from "@nestjs/common";
import { OrderStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { getStatusDescription } from "./order-status.config";

@Injectable()
export class OrderHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  findByOrderId(orderId: string) {
    return this.prisma.orderHistory.findMany({
      where: { orderId },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  create(
    data: {
      orderId: string;
      status: OrderStatus;
      descricao: string;
      usuarioId?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.orderHistory.create({
      data: {
        orderId: data.orderId,
        status: data.status,
        descricao: data.descricao,
        usuarioId: data.usuarioId ?? null,
      },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
    });
  }

  async recordStatusChange(
    orderId: string,
    status: OrderStatus,
    usuarioId?: string | null,
    descricao?: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.create(
      {
        orderId,
        status,
        descricao: descricao ?? getStatusDescription(status),
        usuarioId,
      },
      tx,
    );
  }
}

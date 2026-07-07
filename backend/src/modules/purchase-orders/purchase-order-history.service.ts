import { Injectable } from "@nestjs/common";
import { Prisma, PurchaseOrderStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { getStatusDescription } from "./purchase-order-status.config";

@Injectable()
export class PurchaseOrderHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  findByOrderId(purchaseOrderId: string) {
    return this.prisma.purchaseOrderHistory.findMany({
      where: { purchaseOrderId },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  create(
    data: {
      purchaseOrderId: string;
      status: PurchaseOrderStatus;
      descricao: string;
      usuarioId?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.purchaseOrderHistory.create({
      data: {
        purchaseOrderId: data.purchaseOrderId,
        status: data.status,
        descricao: data.descricao,
        usuarioId: data.usuarioId ?? null,
      },
      include: { usuario: { select: { id: true, nome: true, email: true } } },
    });
  }

  async recordStatusChange(
    purchaseOrderId: string,
    status: PurchaseOrderStatus,
    usuarioId?: string | null,
    descricao?: string,
    tx?: Prisma.TransactionClient,
  ) {
    return this.create(
      {
        purchaseOrderId,
        status,
        descricao: descricao ?? getStatusDescription(status),
        usuarioId,
      },
      tx,
    );
  }
}

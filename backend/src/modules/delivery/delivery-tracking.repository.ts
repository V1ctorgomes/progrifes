import { Injectable } from "@nestjs/common";
import { DeliveryStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const deliveryInclude = {
  order: {
    select: {
      id: true,
      numero: true,
      clienteNome: true,
      clienteTelefone: true,
      bairro: true,
      total: true,
      taxaEntrega: true,
      formaPagamento: true,
      createdAt: true,
      prazoEntregaMinutos: true,
      deliveryPerson: {
        select: { id: true, name: true, phone: true, status: true },
      },
    },
  },
  deliveryPerson: {
    select: { id: true, name: true, phone: true, status: true },
  },
} satisfies Prisma.DeliveryInclude;

@Injectable()
export class DeliveryTrackingRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.DeliveryWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.DeliveryOrderByWithRelationInput,
  ) {
    return this.prisma.delivery.findMany({
      where,
      skip,
      take,
      orderBy,
      include: deliveryInclude,
    });
  }

  count(where: Prisma.DeliveryWhereInput) {
    return this.prisma.delivery.count({ where });
  }

  findById(id: string) {
    return this.prisma.delivery.findUnique({
      where: { id },
      include: deliveryInclude,
    });
  }

  findByOrderId(orderId: string) {
    return this.prisma.delivery.findUnique({
      where: { orderId },
      include: deliveryInclude,
    });
  }

  create(
    data: Prisma.DeliveryUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.delivery.create({ data, include: deliveryInclude });
  }

  update(
    id: string,
    data: Prisma.DeliveryUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.delivery.update({
      where: { id },
      data,
      include: deliveryInclude,
    });
  }

  recordHistory(
    data: {
      deliveryId: string;
      status: DeliveryStatus;
      usuarioId?: string;
      notes?: string | null;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.deliveryHistory.create({ data });
  }

  findHistory(deliveryId: string) {
    return this.prisma.deliveryHistory.findMany({
      where: { deliveryId },
      orderBy: { createdAt: "asc" },
      include: {
        usuario: { select: { id: true, nome: true, email: true } },
      },
    });
  }
}

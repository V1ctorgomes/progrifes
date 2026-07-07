import { Injectable } from "@nestjs/common";
import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const orderInclude = {
  deliveryPerson: {
    select: { id: true, name: true, phone: true, status: true },
  },
  itens: {
    orderBy: { produtoNome: "asc" as const },
    include: {
      variant: {
        include: {
          imagens: { orderBy: { ordem: "asc" as const }, take: 1 },
        },
      },
    },
  },
};

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where?: Prisma.OrderWhereInput,
    skip?: number,
    take?: number,
    orderBy?: Prisma.OrderOrderByWithRelationInput | Prisma.OrderOrderByWithRelationInput[],
  ) {
    return this.prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: orderBy ?? { createdAt: "desc" },
      skip,
      take,
    });
  }

  count(where?: Prisma.OrderWhereInput) {
    return this.prisma.order.count({ where });
  }

  findById(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: orderInclude,
    });
  }

  findByNumero(numero: number) {
    return this.prisma.order.findUnique({
      where: { numero },
      include: orderInclude,
    });
  }

  getNextNumero(tx: Prisma.TransactionClient) {
    return tx.order
      .findFirst({
        orderBy: { numero: "desc" },
        select: { numero: true },
      })
      .then((last) => (last?.numero ?? 0) + 1);
  }

  update(id: string, data: Prisma.OrderUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.order.update({
      where: { id },
      data,
      include: orderInclude,
    });
  }

  countByStatus(status: OrderStatus, where?: Prisma.OrderWhereInput) {
    return this.prisma.order.count({ where: { ...where, status } });
  }

  countToday() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return this.prisma.order.count({
      where: { createdAt: { gte: start } },
    });
  }
}

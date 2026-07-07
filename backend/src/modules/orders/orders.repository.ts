import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const orderInclude = {
  itens: {
    orderBy: { produtoNome: "asc" as const },
  },
};

@Injectable()
export class OrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where?: Prisma.OrderWhereInput, skip?: number, take?: number) {
    return this.prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
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

  create(data: Prisma.OrderCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.order.create({
      data,
      include: orderInclude,
    });
  }
}

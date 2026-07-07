import { Injectable } from "@nestjs/common";
import { DeliveryPersonStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class DeliveryPersonRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.DeliveryPersonWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.DeliveryPersonOrderByWithRelationInput,
  ) {
    return this.prisma.deliveryPerson.findMany({ where, skip, take, orderBy });
  }

  count(where: Prisma.DeliveryPersonWhereInput) {
    return this.prisma.deliveryPerson.count({ where });
  }

  findById(id: string) {
    return this.prisma.deliveryPerson.findFirst({
      where: { id, deletedAt: null },
    });
  }

  findAvailable() {
    return this.prisma.deliveryPerson.findMany({
      where: {
        deletedAt: null,
        status: DeliveryPersonStatus.DISPONIVEL,
      },
      orderBy: { name: "asc" },
    });
  }

  findActive() {
    return this.prisma.deliveryPerson.findMany({
      where: {
        deletedAt: null,
        status: { not: DeliveryPersonStatus.INATIVO },
      },
      orderBy: { name: "asc" },
    });
  }
}

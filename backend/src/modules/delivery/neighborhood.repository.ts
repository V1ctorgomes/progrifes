import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class NeighborhoodRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.DeliveryNeighborhoodWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.DeliveryNeighborhoodOrderByWithRelationInput,
  ) {
    return this.prisma.deliveryNeighborhood.findMany({
      where,
      skip,
      take,
      orderBy,
    });
  }

  count(where: Prisma.DeliveryNeighborhoodWhereInput) {
    return this.prisma.deliveryNeighborhood.count({ where });
  }

  findById(id: string) {
    return this.prisma.deliveryNeighborhood.findFirst({
      where: { id, deletedAt: null },
    });
  }

  findActive() {
    return this.prisma.deliveryNeighborhood.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: [{ city: "asc" }, { name: "asc" }],
    });
  }

  findAllNonDeleted() {
    return this.prisma.deliveryNeighborhood.findMany({
      where: { deletedAt: null },
    });
  }
}

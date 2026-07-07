import { Injectable } from "@nestjs/common";
import { InventoryStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class InventoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByVariantId(variantId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.inventory.findUnique({
      where: { variantId },
      include: {
        variant: {
          include: {
            produto: { include: { categoria: true } },
            atributos: {
              include: { attributeValue: { include: { attribute: true } } },
            },
          },
        },
      },
    });
  }

  findMany(
    where: Prisma.InventoryWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.InventoryOrderByWithRelationInput | Prisma.InventoryOrderByWithRelationInput[],
  ) {
    return this.prisma.inventory.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        variant: {
          include: {
            produto: { include: { categoria: true } },
            atributos: {
              include: { attributeValue: { include: { attribute: true } } },
            },
          },
        },
      },
    });
  }

  count(where: Prisma.InventoryWhereInput) {
    return this.prisma.inventory.count({ where });
  }

  create(data: Prisma.InventoryCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.inventory.create({ data });
  }

  update(
    variantId: string,
    data: Prisma.InventoryUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx ?? this.prisma;
    return client.inventory.update({ where: { variantId }, data });
  }

  createMovement(data: Prisma.InventoryMovementCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.inventoryMovement.create({ data });
  }

  countByStatus(status: InventoryStatus) {
    return this.prisma.inventory.count({ where: { status } });
  }

  countReserved() {
    return this.prisma.inventory.count({ where: { quantidadeReservada: { gt: 0 } } });
  }
}

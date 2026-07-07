import { Injectable } from "@nestjs/common";
import { InventoryMovementType, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export const movementInclude = {
  variant: {
    include: {
      produto: { include: { categoria: true } },
      atributos: {
        include: { attributeValue: { include: { attribute: true } } },
      },
    },
  },
  usuario: {
    select: { id: true, nome: true, email: true },
  },
  order: {
    select: { id: true, numero: true },
  },
  entry: {
    select: { id: true, numero: true, tipo: true },
  },
} satisfies Prisma.InventoryMovementInclude;

export type MovementWithRelations = Prisma.InventoryMovementGetPayload<{
  include: typeof movementInclude;
}>;

@Injectable()
export class InventoryMovementRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.inventoryMovement.findUnique({
      where: { id },
      include: movementInclude,
    });
  }

  findMany(
    where: Prisma.InventoryMovementWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.InventoryMovementOrderByWithRelationInput,
  ) {
    return this.prisma.inventoryMovement.findMany({
      where,
      skip,
      take,
      orderBy,
      include: movementInclude,
    });
  }

  count(where: Prisma.InventoryMovementWhereInput) {
    return this.prisma.inventoryMovement.count({ where });
  }

  getNextOutputNumero(tx: Prisma.TransactionClient) {
    return tx.inventoryMovement
      .aggregate({
        where: { tipo: InventoryMovementType.SAIDA, numero: { not: null } },
        _max: { numero: true },
      })
      .then((result) => (result._max.numero ?? 0) + 1);
  }
}

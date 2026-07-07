import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const entryInclude = {
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
  movimento: true,
} satisfies Prisma.InventoryEntryInclude;

@Injectable()
export class InventoryEntryRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.inventoryEntry.findUnique({
      where: { id },
      include: entryInclude,
    });
  }

  findMany(
    where: Prisma.InventoryEntryWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.InventoryEntryOrderByWithRelationInput,
  ) {
    return this.prisma.inventoryEntry.findMany({
      where,
      skip,
      take,
      orderBy,
      include: entryInclude,
    });
  }

  count(where: Prisma.InventoryEntryWhereInput) {
    return this.prisma.inventoryEntry.count({ where });
  }

  getNextNumero(tx: Prisma.TransactionClient) {
    return tx.inventoryEntry
      .aggregate({ _max: { numero: true } })
      .then((result) => (result._max.numero ?? 0) + 1);
  }

  create(data: Prisma.InventoryEntryCreateInput, tx: Prisma.TransactionClient) {
    return tx.inventoryEntry.create({ data, include: entryInclude });
  }
}

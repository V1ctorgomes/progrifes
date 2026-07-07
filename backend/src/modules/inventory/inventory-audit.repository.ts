import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export const auditInclude = {
  usuario: { select: { id: true, nome: true, email: true } },
  categoria: { select: { id: true, nome: true } },
  produto: { select: { id: true, nome: true } },
  variant: {
    select: {
      id: true,
      sku: true,
      produto: { select: { id: true, nome: true } },
    },
  },
  itens: {
    include: {
      variant: {
        include: {
          produto: { include: { categoria: true } },
          atributos: {
            include: { attributeValue: { include: { attribute: true } } },
          },
          inventory: true,
        },
      },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.InventoryAuditInclude;

@Injectable()
export class InventoryAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.inventoryAudit.findUnique({
      where: { id },
      include: auditInclude,
    });
  }

  findMany(
    where: Prisma.InventoryAuditWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.InventoryAuditOrderByWithRelationInput,
  ) {
    return this.prisma.inventoryAudit.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        usuario: { select: { id: true, nome: true } },
        categoria: { select: { id: true, nome: true } },
        produto: { select: { id: true, nome: true } },
        _count: { select: { itens: true } },
      },
    });
  }

  count(where: Prisma.InventoryAuditWhereInput) {
    return this.prisma.inventoryAudit.count({ where });
  }

  getNextNumero(tx: Prisma.TransactionClient) {
    return tx.inventoryAudit
      .aggregate({ _max: { numero: true } })
      .then((result) => (result._max.numero ?? 0) + 1);
  }

  findActiveInProgress(tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.inventoryAudit.findFirst({
      where: { status: "EM_ANDAMENTO" },
    });
  }

  create(data: Prisma.InventoryAuditCreateInput, tx: Prisma.TransactionClient) {
    return tx.inventoryAudit.create({ data, include: auditInclude });
  }

  update(id: string, data: Prisma.InventoryAuditUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.inventoryAudit.update({ where: { id }, data, include: auditInclude });
  }
}

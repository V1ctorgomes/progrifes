import { Injectable } from "@nestjs/common";
import { Prisma, Supplier, SupplierAddress, SupplierContact } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export type SupplierWithRelations = Supplier & {
  endereco: SupplierAddress | null;
  contatos: SupplierContact[];
};

@Injectable()
export class SuppliersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.SupplierWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.SupplierOrderByWithRelationInput = { createdAt: "desc" },
  ) {
    return this.prisma.supplier.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        endereco: true,
        contatos: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  count(where: Prisma.SupplierWhereInput) {
    return this.prisma.supplier.count({ where });
  }

  findById(id: string) {
    return this.prisma.supplier.findFirst({
      where: { id, deletedAt: null },
      include: {
        endereco: true,
        contatos: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  findByCnpj(cnpj: string) {
    return this.prisma.supplier.findFirst({
      where: { cnpj, deletedAt: null },
    });
  }

  create(data: Prisma.SupplierCreateInput) {
    return this.prisma.supplier.create({
      data,
      include: {
        endereco: true,
        contatos: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  update(id: string, data: Prisma.SupplierUpdateInput) {
    return this.prisma.supplier.update({
      where: { id },
      data,
      include: {
        endereco: true,
        contatos: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  softDelete(id: string) {
    return this.prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), ativo: false },
    });
  }
}

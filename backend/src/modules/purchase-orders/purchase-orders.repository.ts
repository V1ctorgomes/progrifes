import { Injectable } from "@nestjs/common";
import { Prisma, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export type PurchaseOrderWithRelations = PurchaseOrder & {
  supplier: {
    id: string;
    razaoSocial: string;
    nomeFantasia: string;
    cnpj: string;
    telefone: string;
    email: string | null;
    endereco: {
      cep: string;
      rua: string;
      numero: string;
      complemento: string | null;
      bairro: string;
      cidade: string;
      estado: string;
    } | null;
  };
  usuario: { id: string; nome: string; email: string } | null;
  itens: Array<
    PurchaseOrderItem & {
      product: { id: string; nome: string };
      variant: { id: string; sku: string };
    }
  >;
};

@Injectable()
export class PurchaseOrdersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.PurchaseOrderWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.PurchaseOrderOrderByWithRelationInput = { createdAt: "desc" },
  ) {
    return this.prisma.purchaseOrder.findMany({
      where,
      skip,
      take,
      orderBy,
      include: this.listInclude(),
    });
  }

  count(where: Prisma.PurchaseOrderWhereInput) {
    return this.prisma.purchaseOrder.count({ where });
  }

  findById(id: string) {
    return this.prisma.purchaseOrder.findFirst({
      where: { id, deletedAt: null },
      include: this.detailInclude(),
    });
  }

  getNextNumero(tx: Prisma.TransactionClient) {
    return tx.purchaseOrder
      .findFirst({
        orderBy: { numero: "desc" },
        select: { numero: true },
      })
      .then((last) => (last?.numero ?? 0) + 1);
  }

  create(data: Prisma.PurchaseOrderCreateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.purchaseOrder.create({
      data,
      include: this.detailInclude(),
    });
  }

  update(id: string, data: Prisma.PurchaseOrderUpdateInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    return client.purchaseOrder.update({
      where: { id },
      data,
      include: this.detailInclude(),
    });
  }

  softDelete(id: string) {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  countByStatus(status: PurchaseOrderStatus, where?: Prisma.PurchaseOrderWhereInput) {
    return this.prisma.purchaseOrder.count({
      where: { ...where, status, deletedAt: null },
    });
  }

  private listInclude() {
    return {
      supplier: {
        select: {
          id: true,
          razaoSocial: true,
          nomeFantasia: true,
          cnpj: true,
          telefone: true,
          email: true,
          endereco: true,
        },
      },
      usuario: { select: { id: true, nome: true, email: true } },
      itens: {
        include: {
          product: { select: { id: true, nome: true } },
          variant: { select: { id: true, sku: true } },
        },
      },
    } satisfies Prisma.PurchaseOrderInclude;
  }

  private detailInclude() {
    return this.listInclude();
  }
}

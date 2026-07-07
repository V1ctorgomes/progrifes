import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const receiptInclude = {
  purchaseOrder: {
    include: {
      supplier: {
        select: {
          id: true,
          razaoSocial: true,
          nomeFantasia: true,
          cnpj: true,
        },
      },
    },
  },
  usuario: { select: { id: true, nome: true, email: true } },
  itens: {
    include: {
      purchaseOrderItem: true,
      variant: {
        include: {
          produto: { select: { id: true, nome: true } },
          atributos: {
            include: { attributeValue: { include: { attribute: true } } },
          },
        },
      },
    },
  },
  contaPagar: true,
} satisfies Prisma.GoodsReceiptInclude;

@Injectable()
export class GoodsReceiptsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.GoodsReceiptWhereInput,
    skip: number,
    take: number,
    orderBy: Prisma.GoodsReceiptOrderByWithRelationInput = { createdAt: "desc" },
  ) {
    return this.prisma.goodsReceipt.findMany({
      where,
      skip,
      take,
      orderBy,
      include: receiptInclude,
    });
  }

  count(where: Prisma.GoodsReceiptWhereInput) {
    return this.prisma.goodsReceipt.count({ where });
  }

  findById(id: string) {
    return this.prisma.goodsReceipt.findUnique({
      where: { id },
      include: receiptInclude,
    });
  }

  findByPurchaseOrderId(purchaseOrderId: string) {
    return this.prisma.goodsReceipt.findMany({
      where: { purchaseOrderId },
      orderBy: { createdAt: "asc" },
      include: receiptInclude,
    });
  }

  getNextNumero(tx: Prisma.TransactionClient) {
    return tx.goodsReceipt
      .aggregate({ _max: { numero: true } })
      .then((result) => (result._max.numero ?? 0) + 1);
  }

  create(data: Prisma.GoodsReceiptCreateInput, tx: Prisma.TransactionClient) {
    return tx.goodsReceipt.create({
      data,
      include: receiptInclude,
    });
  }
}

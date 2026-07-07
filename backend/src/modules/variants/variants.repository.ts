import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

export const variantInclude = {
  imagens: { orderBy: { ordem: "asc" as const } },
  atributos: {
    include: {
      attributeValue: {
        include: { attribute: true },
      },
    },
  },
  produto: true,
  inventory: true,
};

@Injectable()
export class VariantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where: Prisma.ProductVariantWhereInput, skip?: number, take?: number) {
    return this.prisma.productVariant.findMany({
      where,
      include: variantInclude,
      orderBy: { createdAt: "asc" },
      skip,
      take,
    });
  }

  count(where: Prisma.ProductVariantWhereInput) {
    return this.prisma.productVariant.count({ where });
  }

  findById(id: string) {
    return this.prisma.productVariant.findFirst({
      where: { id, deletedAt: null },
      include: variantInclude,
    });
  }

  findBySku(sku: string) {
    return this.prisma.productVariant.findFirst({
      where: { sku, deletedAt: null },
      include: variantInclude,
    });
  }

  findByProductId(produtoId: string, publicOnly = false) {
    return this.prisma.productVariant.findMany({
      where: {
        produtoId,
        deletedAt: null,
        ...(publicOnly ? { ativo: true } : {}),
      },
      include: variantInclude,
      orderBy: { createdAt: "asc" },
    });
  }

  create(data: Prisma.ProductVariantCreateInput) {
    return this.prisma.productVariant.create({
      data,
      include: variantInclude,
    });
  }

  update(id: string, data: Prisma.ProductVariantUpdateInput) {
    return this.prisma.productVariant.update({
      where: { id },
      data,
      include: variantInclude,
    });
  }

  updateMany(ids: string[], data: Prisma.ProductVariantUpdateManyMutationInput) {
    return this.prisma.productVariant.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data,
    });
  }

  softDelete(id: string) {
    return this.prisma.productVariant.update({
      where: { id },
      data: { deletedAt: new Date(), ativo: false },
    });
  }

  deleteImagesByVariantId(varianteId: string) {
    return this.prisma.variantImage.deleteMany({ where: { varianteId } });
  }

  deleteAttributesByVariantId(varianteId: string) {
    return this.prisma.variantAttribute.deleteMany({ where: { varianteId } });
  }

  findAttributeValuesByIds(ids: string[]) {
    return this.prisma.attributeValue.findMany({
      where: { id: { in: ids } },
      include: { attribute: true },
    });
  }
}

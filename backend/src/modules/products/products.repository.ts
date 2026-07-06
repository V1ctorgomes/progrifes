import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const productInclude = {
  categoria: true,
  imagens: { orderBy: { ordem: "asc" as const } },
};

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(
    where: Prisma.ProductWhereInput,
    skip?: number,
    take?: number,
  ) {
    return this.prisma.product.findMany({
      where,
      include: productInclude,
      orderBy: [{ ordem: "asc" }, { createdAt: "desc" }],
      skip,
      take,
    });
  }

  count(where: Prisma.ProductWhereInput) {
    return this.prisma.product.count({ where });
  }

  findById(id: string) {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: productInclude,
    });
  }

  findBySlug(slug: string) {
    return this.prisma.product.findFirst({
      where: { slug, deletedAt: null },
      include: productInclude,
    });
  }

  create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data,
      include: productInclude,
    });
  }

  update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
      include: productInclude,
    });
  }

  softDelete(id: string) {
    return this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), ativo: false },
    });
  }

  deleteImagesByProductId(produtoId: string) {
    return this.prisma.productImage.deleteMany({ where: { produtoId } });
  }
}

import { Injectable } from "@nestjs/common";
import { Category, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where?: Prisma.CategoryWhereInput) {
    return this.prisma.category.findMany({
      where,
      orderBy: [{ ordem: "asc" }, { nome: "asc" }],
    });
  }

  findById(id: string) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  findBySlug(slug: string) {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  create(data: Prisma.CategoryCreateInput) {
    return this.prisma.category.create({ data });
  }

  update(id: string, data: Prisma.CategoryUpdateInput) {
    return this.prisma.category.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }

  count(where?: Prisma.CategoryWhereInput) {
    return this.prisma.category.count({ where });
  }

  getNextOrder(categoriaPaiId: string | null) {
    return this.prisma.category.aggregate({
      where: { categoriaPaiId },
      _max: { ordem: true },
    });
  }
}

export { Category };

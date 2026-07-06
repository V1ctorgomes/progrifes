import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

const attributeInclude = {
  valores: { orderBy: { valor: "asc" as const } },
};

@Injectable()
export class AttributesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.attribute.findMany({
      include: attributeInclude,
      orderBy: { nome: "asc" },
    });
  }

  findById(id: string) {
    return this.prisma.attribute.findUnique({
      where: { id },
      include: attributeInclude,
    });
  }

  findByNome(nome: string) {
    return this.prisma.attribute.findUnique({
      where: { nome },
      include: attributeInclude,
    });
  }

  create(data: Prisma.AttributeCreateInput) {
    return this.prisma.attribute.create({
      data,
      include: attributeInclude,
    });
  }

  update(id: string, data: Prisma.AttributeUpdateInput) {
    return this.prisma.attribute.update({
      where: { id },
      data,
      include: attributeInclude,
    });
  }

  delete(id: string) {
    return this.prisma.attribute.delete({ where: { id } });
  }

  addValue(attributeId: string, valor: string) {
    return this.prisma.attributeValue.create({
      data: { attributeId, valor },
    });
  }

  findValueById(id: string) {
    return this.prisma.attributeValue.findUnique({
      where: { id },
      include: { attribute: true },
    });
  }

  deleteValue(id: string) {
    return this.prisma.attributeValue.delete({ where: { id } });
  }

  countValueUsage(valueId: string) {
    return this.prisma.variantAttribute.count({
      where: { attributeValueId: valueId },
    });
  }
}

import { Injectable } from "@nestjs/common";
import { Banner, BannerType, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class BannersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(where?: Prisma.BannerWhereInput) {
    return this.prisma.banner.findMany({
      where,
      orderBy: [{ ordem: "asc" }, { createdAt: "asc" }],
    });
  }

  findById(id: string) {
    return this.prisma.banner.findUnique({ where: { id } });
  }

  create(data: Prisma.BannerCreateInput) {
    return this.prisma.banner.create({ data });
  }

  update(id: string, data: Prisma.BannerUpdateInput) {
    return this.prisma.banner.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.banner.delete({ where: { id } });
  }

  count() {
    return this.prisma.banner.count();
  }

  getNextOrder(tipo: BannerType) {
    return this.prisma.banner.aggregate({
      where: { tipo },
      _max: { ordem: true },
    });
  }

  countByType(tipo: BannerType, excludeId?: string) {
    return this.prisma.banner.count({
      where: {
        tipo,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  }
}

export { Banner };

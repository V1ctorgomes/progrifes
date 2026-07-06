import { Injectable, OnModuleInit } from "@nestjs/common";
import { ensureAdminUser } from "./ensure-admin";
import { ensureInitialContent } from "./ensure-content";
import { ensureProducts } from "./ensure-products";
import { PrismaService } from "./prisma.service";

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await ensureAdminUser(this.prisma);
      await ensureInitialContent(this.prisma);
      await ensureProducts(this.prisma);
    } catch (error) {
      console.error("Falha ao executar seed inicial:", error);
    }
  }
}

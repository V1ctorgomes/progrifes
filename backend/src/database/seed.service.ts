import { Injectable, OnModuleInit } from "@nestjs/common";
import { ensureAdminUser } from "./ensure-admin";
import { PrismaService } from "./prisma.service";

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    try {
      await ensureAdminUser(this.prisma);
    } catch (error) {
      console.error("Falha ao garantir usuário administrador:", error);
    }
  }
}

import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  createRefreshToken(userId: string, token: string, expiresAt: Date) {
    return this.prisma.refreshToken.create({
      data: { userId, token, expiresAt },
    });
  }

  findRefreshToken(token: string) {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  deleteRefreshToken(token: string) {
    return this.prisma.refreshToken.delete({ where: { token } });
  }

  deleteAllUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  deleteExpiredRefreshTokens() {
    return this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}

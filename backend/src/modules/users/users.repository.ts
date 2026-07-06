import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { User, UserRole } from "@prisma/client";

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  updateLastLogin(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { ultimoLogin: new Date() },
    });
  }
}

export { UserRole };

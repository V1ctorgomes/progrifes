import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

export async function ensureAdminUser(prisma: PrismaClient): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? "admin@grifres.com").toLowerCase().trim();
  const senha = process.env.ADMIN_PASSWORD ?? "12345678";
  const senhaHash = await bcrypt.hash(senha, 10);

  await prisma.user.upsert({
    where: { email },
    update: {
      nome: "Administrador",
      senha: senhaHash,
      cargo: UserRole.ADMINISTRADOR,
      ativo: true,
    },
    create: {
      nome: "Administrador",
      email,
      senha: senhaHash,
      cargo: UserRole.ADMINISTRADOR,
      ativo: true,
    },
  });

  console.log(`Administrador garantido: ${email}`);
}

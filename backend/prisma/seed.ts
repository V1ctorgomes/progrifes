import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
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

  console.log(`Seed concluído: ${email} / ${senha}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

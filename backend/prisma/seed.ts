import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const senhaHash = await bcrypt.hash("12345678", 10);

  await prisma.user.upsert({
    where: { email: "admin@grifres.com" },
    update: {
      nome: "Administrador",
      senha: senhaHash,
      cargo: UserRole.ADMINISTRADOR,
      ativo: true,
    },
    create: {
      nome: "Administrador",
      email: "admin@grifres.com",
      senha: senhaHash,
      cargo: UserRole.ADMINISTRADOR,
      ativo: true,
    },
  });

  console.log("Seed concluído: admin@grifres.com / 12345678");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import { ensureAdminUser } from "./ensure-admin";
import { ensureInitialContent } from "./ensure-content";

async function main() {
  const prisma = new PrismaClient();

  try {
    await ensureAdminUser(prisma);
    await ensureInitialContent(prisma);
    console.log("Seed executado com sucesso");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("Falha ao executar seed:", error);
  process.exit(1);
});

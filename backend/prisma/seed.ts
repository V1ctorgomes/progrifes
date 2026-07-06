import { PrismaClient } from "@prisma/client";
import { ensureAdminUser } from "../src/database/ensure-admin";
import { ensureInitialContent } from "../src/database/ensure-content";

const prisma = new PrismaClient();

async function main() {
  await ensureAdminUser(prisma);
  await ensureInitialContent(prisma);
  console.log("Seed concluído");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

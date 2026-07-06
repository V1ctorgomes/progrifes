import { PrismaClient } from "@prisma/client";
import { ensureAdminUser } from "../src/database/ensure-admin";

const prisma = new PrismaClient();

async function main() {
  await ensureAdminUser(prisma);
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

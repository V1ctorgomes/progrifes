-- CreateEnum
CREATE TYPE "DeliveryPersonStatus" AS ENUM (
  'DISPONIVEL',
  'EM_ENTREGA',
  'AUSENTE',
  'FOLGA',
  'INATIVO'
);

-- AlterTable
ALTER TABLE "orders"
  ADD COLUMN "delivery_person_id" TEXT;

-- CreateTable
CREATE TABLE "delivery_persons" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "cpf" TEXT,
  "document" TEXT,
  "status" "DeliveryPersonStatus" NOT NULL DEFAULT 'DISPONIVEL',
  "notes" TEXT,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "delivery_persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_person_history" (
  "id" TEXT NOT NULL,
  "delivery_person_id" TEXT NOT NULL,
  "operacao" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "usuario_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "delivery_person_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_persons_name_idx" ON "delivery_persons"("name");
CREATE INDEX "delivery_persons_phone_idx" ON "delivery_persons"("phone");
CREATE INDEX "delivery_persons_status_idx" ON "delivery_persons"("status");
CREATE INDEX "delivery_persons_deleted_at_idx" ON "delivery_persons"("deleted_at");
CREATE INDEX "orders_delivery_person_id_idx" ON "orders"("delivery_person_id");
CREATE INDEX "delivery_person_history_delivery_person_id_idx"
  ON "delivery_person_history"("delivery_person_id");
CREATE INDEX "delivery_person_history_created_at_idx"
  ON "delivery_person_history"("created_at");

-- AddForeignKey
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_delivery_person_id_fkey"
  FOREIGN KEY ("delivery_person_id") REFERENCES "delivery_persons"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_person_history"
  ADD CONSTRAINT "delivery_person_history_delivery_person_id_fkey"
  FOREIGN KEY ("delivery_person_id") REFERENCES "delivery_persons"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_person_history"
  ADD CONSTRAINT "delivery_person_history_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

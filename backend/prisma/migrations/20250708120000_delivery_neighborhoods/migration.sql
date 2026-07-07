-- AlterTable
ALTER TABLE "orders"
  ADD COLUMN "delivery_neighborhood_id" TEXT,
  ADD COLUMN "prazo_entrega_minutos" INTEGER;

-- CreateTable
CREATE TABLE "delivery_neighborhoods" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "state" TEXT NOT NULL,
  "delivery_fee" DECIMAL(10, 2) NOT NULL DEFAULT 0,
  "average_delivery_time" INTEGER NOT NULL DEFAULT 45,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "deleted_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "delivery_neighborhoods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_neighborhood_history" (
  "id" TEXT NOT NULL,
  "neighborhood_id" TEXT NOT NULL,
  "operacao" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "usuario_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "delivery_neighborhood_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "delivery_neighborhoods_name_idx" ON "delivery_neighborhoods"("name");
CREATE INDEX "delivery_neighborhoods_city_idx" ON "delivery_neighborhoods"("city");
CREATE INDEX "delivery_neighborhoods_state_idx" ON "delivery_neighborhoods"("state");
CREATE INDEX "delivery_neighborhoods_is_active_idx" ON "delivery_neighborhoods"("is_active");
CREATE INDEX "delivery_neighborhoods_deleted_at_idx" ON "delivery_neighborhoods"("deleted_at");
CREATE INDEX "orders_delivery_neighborhood_id_idx" ON "orders"("delivery_neighborhood_id");
CREATE INDEX "delivery_neighborhood_history_neighborhood_id_idx"
  ON "delivery_neighborhood_history"("neighborhood_id");
CREATE INDEX "delivery_neighborhood_history_created_at_idx"
  ON "delivery_neighborhood_history"("created_at");

-- AddForeignKey
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_delivery_neighborhood_id_fkey"
  FOREIGN KEY ("delivery_neighborhood_id") REFERENCES "delivery_neighborhoods"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_neighborhood_history"
  ADD CONSTRAINT "delivery_neighborhood_history_neighborhood_id_fkey"
  FOREIGN KEY ("neighborhood_id") REFERENCES "delivery_neighborhoods"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_neighborhood_history"
  ADD CONSTRAINT "delivery_neighborhood_history_usuario_id_fkey"
  FOREIGN KEY ("usuario_id") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

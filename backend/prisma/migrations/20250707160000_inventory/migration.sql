-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('RESERVA', 'LIBERACAO', 'BAIXA');

-- CreateEnum
CREATE TYPE "InventoryStatus" AS ENUM ('EM_ESTOQUE', 'ESTOQUE_BAIXO', 'SEM_ESTOQUE');

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantidade_total" INTEGER NOT NULL DEFAULT 0,
    "quantidade_reservada" INTEGER NOT NULL DEFAULT 0,
    "quantidade_disponivel" INTEGER NOT NULL DEFAULT 0,
    "estoque_minimo" INTEGER NOT NULL DEFAULT 0,
    "status" "InventoryStatus" NOT NULL DEFAULT 'SEM_ESTOQUE',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "order_id" TEXT,
    "tipo" "InventoryMovementType" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_variant_id_key" ON "inventory"("variant_id");

-- CreateIndex
CREATE INDEX "inventory_status_idx" ON "inventory"("status");

-- CreateIndex
CREATE INDEX "inventory_movements_variant_id_idx" ON "inventory_movements"("variant_id");

-- CreateIndex
CREATE INDEX "inventory_movements_order_id_idx" ON "inventory_movements"("order_id");

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill inventory from existing variants
INSERT INTO "inventory" (
    "id",
    "variant_id",
    "quantidade_total",
    "quantidade_reservada",
    "quantidade_disponivel",
    "estoque_minimo",
    "status",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    pv."id",
    pv."estoque",
    0,
    pv."estoque",
    pv."estoque_minimo",
    CASE
        WHEN pv."estoque" <= 0 THEN 'SEM_ESTOQUE'::"InventoryStatus"
        WHEN pv."estoque" <= pv."estoque_minimo" THEN 'ESTOQUE_BAIXO'::"InventoryStatus"
        ELSE 'EM_ESTOQUE'::"InventoryStatus"
    END,
    NOW()
FROM "product_variants" pv
WHERE pv."deleted_at" IS NULL;

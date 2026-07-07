-- AlterEnum
ALTER TYPE "InventoryMovementType" ADD VALUE 'SAIDA';

-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN "numero" INTEGER,
ADD COLUMN "motivo" TEXT,
ADD COLUMN "documento" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "inventory_movements_numero_key" ON "inventory_movements"("numero");

-- CreateIndex
CREATE INDEX "inventory_movements_origem_idx" ON "inventory_movements"("origem");

-- CreateIndex
CREATE INDEX "inventory_movements_created_at_idx" ON "inventory_movements"("created_at");

-- Backfill BAIXA de pedidos com origem VENDA
UPDATE "inventory_movements"
SET "origem" = 'VENDA',
    "motivo" = 'Entrega do pedido'
WHERE "tipo" = 'BAIXA' AND "order_id" IS NOT NULL;

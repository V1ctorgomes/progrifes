-- AlterEnum
ALTER TYPE "InventoryMovementType" ADD VALUE 'ENTRADA';

-- CreateEnum
CREATE TYPE "InventoryEntryType" AS ENUM (
  'COMPRA',
  'REPOSICAO',
  'DEVOLUCAO_CLIENTE',
  'AJUSTE_POSITIVO',
  'PRODUCAO',
  'OUTROS'
);

-- CreateTable
CREATE TABLE "inventory_entries" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "variant_id" TEXT NOT NULL,
    "tipo" "InventoryEntryType" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "valor_unitario" DECIMAL(10,2),
    "documento" TEXT,
    "nota_fiscal" TEXT,
    "fornecedor" TEXT,
    "observacoes" TEXT,
    "usuario_id" TEXT,
    "data_entrada" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_entries_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN "entry_id" TEXT,
ADD COLUMN "usuario_id" TEXT,
ADD COLUMN "origem" TEXT,
ADD COLUMN "saldo_anterior" INTEGER,
ADD COLUMN "saldo_atual" INTEGER,
ADD COLUMN "referencia_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "inventory_entries_numero_key" ON "inventory_entries"("numero");

-- CreateIndex
CREATE INDEX "inventory_entries_variant_id_idx" ON "inventory_entries"("variant_id");

-- CreateIndex
CREATE INDEX "inventory_entries_tipo_idx" ON "inventory_entries"("tipo");

-- CreateIndex
CREATE INDEX "inventory_entries_data_entrada_idx" ON "inventory_entries"("data_entrada");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_movements_entry_id_key" ON "inventory_movements"("entry_id");

-- CreateIndex
CREATE INDEX "inventory_movements_tipo_idx" ON "inventory_movements"("tipo");

-- AddForeignKey
ALTER TABLE "inventory_entries" ADD CONSTRAINT "inventory_entries_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_entries" ADD CONSTRAINT "inventory_entries_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "inventory_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill origem for existing order movements
UPDATE "inventory_movements"
SET "origem" = 'PEDIDO'
WHERE "order_id" IS NOT NULL AND "origem" IS NULL;

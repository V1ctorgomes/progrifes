-- CreateEnum
CREATE TYPE "InventoryAuditType" AS ENUM ('GERAL', 'PARCIAL', 'CATEGORIA', 'PRODUTO', 'VARIANTE');
CREATE TYPE "InventoryAuditStatus" AS ENUM ('RASCUNHO', 'EM_ANDAMENTO', 'PAUSADO', 'FINALIZADO', 'CANCELADO');
CREATE TYPE "InventoryAdjustmentType" AS ENUM ('ENTRADA', 'SAIDA', 'NENHUM');

-- CreateTable
CREATE TABLE "inventory_audits" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "InventoryAuditType" NOT NULL,
    "status" "InventoryAuditStatus" NOT NULL DEFAULT 'RASCUNHO',
    "categoria_id" TEXT,
    "produto_id" TEXT,
    "variant_id" TEXT,
    "usuario_id" TEXT NOT NULL,
    "observacoes" TEXT,
    "data_inventario" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "inventory_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_audit_items" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "quantidade_sistema" INTEGER NOT NULL,
    "quantidade_fisica" INTEGER,
    "diferenca" INTEGER,
    "tipo_ajuste" "InventoryAdjustmentType",
    "contado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_audit_items_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN "audit_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "inventory_audits_numero_key" ON "inventory_audits"("numero");
CREATE INDEX "inventory_audits_status_idx" ON "inventory_audits"("status");
CREATE INDEX "inventory_audits_tipo_idx" ON "inventory_audits"("tipo");
CREATE INDEX "inventory_audits_data_inventario_idx" ON "inventory_audits"("data_inventario");
CREATE INDEX "inventory_audits_usuario_id_idx" ON "inventory_audits"("usuario_id");

CREATE UNIQUE INDEX "inventory_audit_items_audit_id_variant_id_key" ON "inventory_audit_items"("audit_id", "variant_id");
CREATE INDEX "inventory_audit_items_variant_id_idx" ON "inventory_audit_items"("variant_id");

CREATE INDEX "inventory_movements_audit_id_idx" ON "inventory_movements"("audit_id");

-- AddForeignKey
ALTER TABLE "inventory_audits" ADD CONSTRAINT "inventory_audits_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_audits" ADD CONSTRAINT "inventory_audits_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_audits" ADD CONSTRAINT "inventory_audits_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "inventory_audits" ADD CONSTRAINT "inventory_audits_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory_audit_items" ADD CONSTRAINT "inventory_audit_items_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "inventory_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_audit_items" ADD CONSTRAINT "inventory_audit_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "inventory_audits"("id") ON DELETE SET NULL ON UPDATE CASCADE;

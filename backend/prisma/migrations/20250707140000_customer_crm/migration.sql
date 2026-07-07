-- AlterTable
ALTER TABLE "customers" ADD COLUMN "origem" TEXT,
ADD COLUMN "canal_atendimento" TEXT,
ADD COLUMN "responsavel_id" TEXT,
ADD COLUMN "observacoes_comerciais" TEXT;

-- CreateTable
CREATE TABLE "customer_notes" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "descricao" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_tags" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cor" TEXT NOT NULL DEFAULT '#111111',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_tag_relations" (
    "customer_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_tag_relations_pkey" PRIMARY KEY ("customer_id","tag_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customer_tags_nome_key" ON "customer_tags"("nome");

-- CreateIndex
CREATE INDEX "customer_notes_customer_id_idx" ON "customer_notes"("customer_id");

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_tag_relations" ADD CONSTRAINT "customer_tag_relations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_tag_relations" ADD CONSTRAINT "customer_tag_relations_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "customer_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed default tags
INSERT INTO "customer_tags" ("id", "nome", "cor", "created_at") VALUES
  (gen_random_uuid(), 'Cliente VIP', '#7c3aed', NOW()),
  (gen_random_uuid(), 'Cliente Atacadista', '#2563eb', NOW()),
  (gen_random_uuid(), 'Cliente Frequente', '#16a34a', NOW()),
  (gen_random_uuid(), 'Primeira Compra', '#f59e0b', NOW()),
  (gen_random_uuid(), 'Pagamento Pendente', '#dc2626', NOW()),
  (gen_random_uuid(), 'Entrega Prioritária', '#0891b2', NOW());

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "email" TEXT,
    "cpf" TEXT,
    "data_nascimento" TIMESTAMP(3),
    "observacoes" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "cep" TEXT NOT NULL,
    "rua" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "complemento" TEXT,
    "bairro" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "referencia" TEXT,
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "customer_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "customers_telefone_key" ON "customers"("telefone");

-- CreateIndex
CREATE INDEX "customers_nome_idx" ON "customers"("nome");

-- CreateIndex
CREATE INDEX "customers_email_idx" ON "customers"("email");

-- CreateIndex
CREATE INDEX "customers_cpf_idx" ON "customers"("cpf");

-- CreateIndex
CREATE INDEX "customer_addresses_cidade_idx" ON "customer_addresses"("cidade");

-- CreateIndex
CREATE INDEX "customer_addresses_bairro_idx" ON "customer_addresses"("bairro");

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill customers from existing orders
INSERT INTO "customers" ("id", "nome", "telefone", "email", "ativo", "created_at", "updated_at")
SELECT
    gen_random_uuid(),
    latest."cliente_nome",
    latest."telefone_norm",
    latest."cliente_email",
    true,
    latest."created_at",
    NOW()
FROM (
    SELECT DISTINCT ON (regexp_replace(o."cliente_telefone", '[^0-9]', '', 'g'))
        regexp_replace(o."cliente_telefone", '[^0-9]', '', 'g') AS "telefone_norm",
        o."cliente_nome",
        o."cliente_email",
        o."created_at"
    FROM "orders" o
    ORDER BY regexp_replace(o."cliente_telefone", '[^0-9]', '', 'g'), o."created_at" DESC
) latest;

-- Link orders to customers
UPDATE "orders" o
SET "customer_id" = c."id"
FROM "customers" c
WHERE regexp_replace(o."cliente_telefone", '[^0-9]', '', 'g') = c."telefone";

-- Backfill principal addresses from latest order per customer
INSERT INTO "customer_addresses" (
    "id",
    "customer_id",
    "cep",
    "rua",
    "numero",
    "complemento",
    "bairro",
    "cidade",
    "estado",
    "referencia",
    "principal",
    "created_at",
    "updated_at"
)
SELECT
    gen_random_uuid(),
    c."id",
    latest."cep",
    latest."rua",
    latest."numero_endereco",
    latest."complemento",
    latest."bairro",
    latest."cidade",
    latest."estado",
    latest."referencia",
    true,
    latest."created_at",
    NOW()
FROM "customers" c
JOIN LATERAL (
    SELECT o.*
    FROM "orders" o
    WHERE regexp_replace(o."cliente_telefone", '[^0-9]', '', 'g') = c."telefone"
    ORDER BY o."created_at" DESC
    LIMIT 1
) latest ON true;

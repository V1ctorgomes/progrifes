-- Expand PayableStatus enum
ALTER TYPE "PayableStatus" ADD VALUE IF NOT EXISTS 'PARCIALMENTE_PAGO';
ALTER TYPE "PayableStatus" ADD VALUE IF NOT EXISTS 'VENCIDO';
ALTER TYPE "PayableStatus" ADD VALUE IF NOT EXISTS 'ESTORNADO';

-- CreateEnum
CREATE TYPE "PayableOriginType" AS ENUM ('RECEBIMENTO_MERCADORIAS', 'COMPRA_MANUAL', 'DESPESA_MANUAL', 'FORNECEDOR', 'AJUSTE_FINANCEIRO', 'OUTRAS_OBRIGACOES');

-- Add new columns (nullable first for migration)
ALTER TABLE "accounts_payable" ADD COLUMN "origin_type" "PayableOriginType";
ALTER TABLE "accounts_payable" ADD COLUMN "origin_id" TEXT;
ALTER TABLE "accounts_payable" ADD COLUMN "category_id" TEXT;
ALTER TABLE "accounts_payable" ADD COLUMN "chart_account_id" TEXT;
ALTER TABLE "accounts_payable" ADD COLUMN "cost_center_id" TEXT;
ALTER TABLE "accounts_payable" ADD COLUMN "payment_method_id" TEXT;
ALTER TABLE "accounts_payable" ADD COLUMN "financial_account_id" TEXT;
ALTER TABLE "accounts_payable" ADD COLUMN "documento" TEXT;
ALTER TABLE "accounts_payable" ADD COLUMN "numero_nota" TEXT;
ALTER TABLE "accounts_payable" ADD COLUMN "referencia_externa" TEXT;
ALTER TABLE "accounts_payable" ADD COLUMN "valor_original" DECIMAL(12,2);
ALTER TABLE "accounts_payable" ADD COLUMN "valor_pago" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "accounts_payable" ADD COLUMN "saldo" DECIMAL(12,2);
ALTER TABLE "accounts_payable" ADD COLUMN "competencia" TIMESTAMP(3);
ALTER TABLE "accounts_payable" ADD COLUMN "observacoes" TEXT;
ALTER TABLE "accounts_payable" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- Migrate existing data
UPDATE "accounts_payable" ap
SET
  "valor_original" = ap."valor",
  "saldo" = CASE WHEN ap."status" = 'PAGO' THEN 0 ELSE ap."valor" END,
  "valor_pago" = CASE WHEN ap."status" = 'PAGO' THEN ap."valor" ELSE 0 END,
  "observacoes" = ap."descricao",
  "competencia" = COALESCE(ap."created_at", CURRENT_TIMESTAMP),
  "vencimento" = COALESCE(ap."vencimento", ap."created_at", CURRENT_TIMESTAMP),
  "origin_type" = CASE
    WHEN ap."goods_receipt_id" IS NOT NULL THEN 'RECEBIMENTO_MERCADORIAS'::"PayableOriginType"
    ELSE 'FORNECEDOR'::"PayableOriginType"
  END,
  "origin_id" = COALESCE(ap."goods_receipt_id", ap."purchase_order_id"),
  "category_id" = (SELECT id FROM "financial_categories" WHERE codigo = 'COMPRA' LIMIT 1),
  "chart_account_id" = (SELECT id FROM "financial_chart_accounts" WHERE codigo = 'DESPESAS_COMPRAS' LIMIT 1),
  "payment_method_id" = (SELECT id FROM "financial_payment_methods" WHERE codigo = 'PIX' LIMIT 1);

-- Make required columns NOT NULL
ALTER TABLE "accounts_payable" ALTER COLUMN "origin_type" SET NOT NULL;
ALTER TABLE "accounts_payable" ALTER COLUMN "category_id" SET NOT NULL;
ALTER TABLE "accounts_payable" ALTER COLUMN "chart_account_id" SET NOT NULL;
ALTER TABLE "accounts_payable" ALTER COLUMN "payment_method_id" SET NOT NULL;
ALTER TABLE "accounts_payable" ALTER COLUMN "valor_original" SET NOT NULL;
ALTER TABLE "accounts_payable" ALTER COLUMN "saldo" SET NOT NULL;
ALTER TABLE "accounts_payable" ALTER COLUMN "competencia" SET NOT NULL;
ALTER TABLE "accounts_payable" ALTER COLUMN "vencimento" SET NOT NULL;

-- Make purchase_order_id optional
ALTER TABLE "accounts_payable" ALTER COLUMN "purchase_order_id" DROP NOT NULL;

-- Drop legacy columns
ALTER TABLE "accounts_payable" DROP COLUMN "descricao";
ALTER TABLE "accounts_payable" DROP COLUMN "valor";

-- Drop legacy financial transaction link
ALTER TABLE "financial_transactions" DROP CONSTRAINT IF EXISTS "financial_transactions_account_payable_id_fkey";
DROP INDEX IF EXISTS "financial_transactions_account_payable_id_key";
ALTER TABLE "financial_transactions" DROP COLUMN IF EXISTS "account_payable_id";

-- CreateTable
CREATE TABLE "accounts_payable_payments" (
    "id" TEXT NOT NULL,
    "account_payable_id" TEXT NOT NULL,
    "financial_transaction_id" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "payment_method_id" TEXT NOT NULL,
    "financial_account_id" TEXT,
    "cashbox_id" TEXT,
    "pago_em" TIMESTAMP(3) NOT NULL,
    "usuario_id" TEXT,
    "estornado" BOOLEAN NOT NULL DEFAULT false,
    "estorno_transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_payable_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_payable_history" (
    "id" TEXT NOT NULL,
    "account_payable_id" TEXT NOT NULL,
    "operacao" TEXT NOT NULL,
    "usuario_id" TEXT,
    "descricao" TEXT NOT NULL,
    "valor_anterior" DECIMAL(12,2),
    "valor_novo" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_payable_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_payable_payments_financial_transaction_id_key" ON "accounts_payable_payments"("financial_transaction_id");
CREATE UNIQUE INDEX "accounts_payable_payments_estorno_transaction_id_key" ON "accounts_payable_payments"("estorno_transaction_id");
CREATE INDEX "accounts_payable_payments_account_payable_id_idx" ON "accounts_payable_payments"("account_payable_id");
CREATE INDEX "accounts_payable_payments_pago_em_idx" ON "accounts_payable_payments"("pago_em");
CREATE INDEX "accounts_payable_vencimento_idx" ON "accounts_payable"("vencimento");
CREATE INDEX "accounts_payable_origin_type_idx" ON "accounts_payable"("origin_type");
CREATE INDEX "accounts_payable_competencia_idx" ON "accounts_payable"("competencia");
CREATE INDEX "accounts_payable_history_account_payable_id_idx" ON "accounts_payable_history"("account_payable_id");
CREATE INDEX "accounts_payable_history_created_at_idx" ON "accounts_payable_history"("created_at");

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "financial_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_chart_account_id_fkey" FOREIGN KEY ("chart_account_id") REFERENCES "financial_chart_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "financial_cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "financial_payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "accounts_payable_payments" ADD CONSTRAINT "accounts_payable_payments_account_payable_id_fkey" FOREIGN KEY ("account_payable_id") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accounts_payable_payments" ADD CONSTRAINT "accounts_payable_payments_financial_transaction_id_fkey" FOREIGN KEY ("financial_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounts_payable_payments" ADD CONSTRAINT "accounts_payable_payments_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "financial_payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "accounts_payable_payments" ADD CONSTRAINT "accounts_payable_payments_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts_payable_payments" ADD CONSTRAINT "accounts_payable_payments_cashbox_id_fkey" FOREIGN KEY ("cashbox_id") REFERENCES "financial_cashboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts_payable_payments" ADD CONSTRAINT "accounts_payable_payments_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "accounts_payable_payments" ADD CONSTRAINT "accounts_payable_payments_estorno_transaction_id_fkey" FOREIGN KEY ("estorno_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "accounts_payable_history" ADD CONSTRAINT "accounts_payable_history_account_payable_id_fkey" FOREIGN KEY ("account_payable_id") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "accounts_payable_history" ADD CONSTRAINT "accounts_payable_history_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

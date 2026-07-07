-- CreateEnum
CREATE TYPE "ReceivableOriginType" AS ENUM ('PEDIDO', 'VENDA_MANUAL', 'LANCAMENTO_MANUAL', 'AJUSTE_FINANCEIRO', 'OUTRAS_RECEITAS');

-- CreateEnum
CREATE TYPE "ReceivableStatus" AS ENUM ('PENDENTE', 'RECEBIDO', 'PARCIALMENTE_RECEBIDO', 'VENCIDO', 'CANCELADO', 'ESTORNADO');

-- CreateTable
CREATE TABLE "accounts_receivable" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "customer_id" TEXT NOT NULL,
    "origin_type" "ReceivableOriginType" NOT NULL,
    "origin_id" TEXT,
    "order_id" TEXT,
    "category_id" TEXT NOT NULL,
    "chart_account_id" TEXT NOT NULL,
    "cost_center_id" TEXT,
    "payment_method_id" TEXT NOT NULL,
    "financial_account_id" TEXT,
    "documento" TEXT,
    "referencia_externa" TEXT,
    "valor_original" DECIMAL(12,2) NOT NULL,
    "valor_recebido" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "saldo" DECIMAL(12,2) NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "ReceivableStatus" NOT NULL DEFAULT 'PENDENTE',
    "observacoes" TEXT,
    "usuario_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accounts_receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_receivable_receipts" (
    "id" TEXT NOT NULL,
    "account_receivable_id" TEXT NOT NULL,
    "financial_transaction_id" TEXT NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "payment_method_id" TEXT NOT NULL,
    "financial_account_id" TEXT,
    "cashbox_id" TEXT,
    "recebido_em" TIMESTAMP(3) NOT NULL,
    "usuario_id" TEXT,
    "estornado" BOOLEAN NOT NULL DEFAULT false,
    "estorno_transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_receivable_receipts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts_receivable_history" (
    "id" TEXT NOT NULL,
    "account_receivable_id" TEXT NOT NULL,
    "operacao" TEXT NOT NULL,
    "usuario_id" TEXT,
    "descricao" TEXT NOT NULL,
    "valor_anterior" DECIMAL(12,2),
    "valor_novo" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_receivable_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_receivable_numero_key" ON "accounts_receivable"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_receivable_order_id_key" ON "accounts_receivable"("order_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_customer_id_idx" ON "accounts_receivable"("customer_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_vencimento_idx" ON "accounts_receivable"("vencimento");

-- CreateIndex
CREATE INDEX "accounts_receivable_status_idx" ON "accounts_receivable"("status");

-- CreateIndex
CREATE INDEX "accounts_receivable_origin_type_idx" ON "accounts_receivable"("origin_type");

-- CreateIndex
CREATE INDEX "accounts_receivable_competencia_idx" ON "accounts_receivable"("competencia");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_receivable_receipts_financial_transaction_id_key" ON "accounts_receivable_receipts"("financial_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_receivable_receipts_estorno_transaction_id_key" ON "accounts_receivable_receipts"("estorno_transaction_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_receipts_account_receivable_id_idx" ON "accounts_receivable_receipts"("account_receivable_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_receipts_recebido_em_idx" ON "accounts_receivable_receipts"("recebido_em");

-- CreateIndex
CREATE INDEX "accounts_receivable_history_account_receivable_id_idx" ON "accounts_receivable_history"("account_receivable_id");

-- CreateIndex
CREATE INDEX "accounts_receivable_history_created_at_idx" ON "accounts_receivable_history"("created_at");

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "financial_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_chart_account_id_fkey" FOREIGN KEY ("chart_account_id") REFERENCES "financial_chart_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "financial_cost_centers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "financial_payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable" ADD CONSTRAINT "accounts_receivable_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_receipts" ADD CONSTRAINT "accounts_receivable_receipts_account_receivable_id_fkey" FOREIGN KEY ("account_receivable_id") REFERENCES "accounts_receivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_receipts" ADD CONSTRAINT "accounts_receivable_receipts_financial_transaction_id_fkey" FOREIGN KEY ("financial_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_receipts" ADD CONSTRAINT "accounts_receivable_receipts_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "financial_payment_methods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_receipts" ADD CONSTRAINT "accounts_receivable_receipts_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_receipts" ADD CONSTRAINT "accounts_receivable_receipts_cashbox_id_fkey" FOREIGN KEY ("cashbox_id") REFERENCES "financial_cashboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_receipts" ADD CONSTRAINT "accounts_receivable_receipts_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_receipts" ADD CONSTRAINT "accounts_receivable_receipts_estorno_transaction_id_fkey" FOREIGN KEY ("estorno_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_history" ADD CONSTRAINT "accounts_receivable_history_account_receivable_id_fkey" FOREIGN KEY ("account_receivable_id") REFERENCES "accounts_receivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_receivable_history" ADD CONSTRAINT "accounts_receivable_history_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

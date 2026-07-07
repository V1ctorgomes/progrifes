-- CreateEnum
CREATE TYPE "CashFlowType" AS ENUM ('ENTRADA', 'SAIDA', 'TRANSFERENCIA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO');

-- CreateEnum
CREATE TYPE "CashClosingStatus" AS ENUM ('ABERTO', 'FECHADO');

-- CreateTable
CREATE TABLE "cash_flow" (
    "id" TEXT NOT NULL,
    "financial_transaction_id" TEXT NOT NULL,
    "tipo" "CashFlowType" NOT NULL,
    "origem" "FinancialOriginType" NOT NULL,
    "descricao" TEXT NOT NULL,
    "financial_account_id" TEXT,
    "cashbox_id" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "saldo_apos" DECIMAL(12,2) NOT NULL,
    "transfer_id" TEXT,
    "usuario_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_flow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_transfers" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "from_financial_account_id" TEXT,
    "from_cashbox_id" TEXT,
    "to_financial_account_id" TEXT,
    "to_cashbox_id" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "out_transaction_id" TEXT NOT NULL,
    "in_transaction_id" TEXT NOT NULL,
    "usuario_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cash_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_closings" (
    "id" TEXT NOT NULL,
    "cashbox_id" TEXT NOT NULL,
    "saldo_inicial" DECIMAL(12,2) NOT NULL,
    "saldo_final" DECIMAL(12,2),
    "status" "CashClosingStatus" NOT NULL DEFAULT 'ABERTO',
    "observacoes" TEXT,
    "usuario_id" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "cash_closings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cash_flow_financial_transaction_id_key" ON "cash_flow"("financial_transaction_id");

-- CreateIndex
CREATE INDEX "cash_flow_created_at_idx" ON "cash_flow"("created_at");

-- CreateIndex
CREATE INDEX "cash_flow_financial_account_id_idx" ON "cash_flow"("financial_account_id");

-- CreateIndex
CREATE INDEX "cash_flow_cashbox_id_idx" ON "cash_flow"("cashbox_id");

-- CreateIndex
CREATE INDEX "cash_flow_tipo_idx" ON "cash_flow"("tipo");

-- CreateIndex
CREATE INDEX "cash_flow_origem_idx" ON "cash_flow"("origem");

-- CreateIndex
CREATE UNIQUE INDEX "cash_transfers_numero_key" ON "cash_transfers"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "cash_transfers_out_transaction_id_key" ON "cash_transfers"("out_transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "cash_transfers_in_transaction_id_key" ON "cash_transfers"("in_transaction_id");

-- CreateIndex
CREATE INDEX "cash_transfers_created_at_idx" ON "cash_transfers"("created_at");

-- CreateIndex
CREATE INDEX "cash_closings_cashbox_id_idx" ON "cash_closings"("cashbox_id");

-- CreateIndex
CREATE INDEX "cash_closings_status_idx" ON "cash_closings"("status");

-- CreateIndex
CREATE INDEX "cash_closings_opened_at_idx" ON "cash_closings"("opened_at");

-- AddForeignKey
ALTER TABLE "cash_flow" ADD CONSTRAINT "cash_flow_financial_transaction_id_fkey" FOREIGN KEY ("financial_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow" ADD CONSTRAINT "cash_flow_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow" ADD CONSTRAINT "cash_flow_cashbox_id_fkey" FOREIGN KEY ("cashbox_id") REFERENCES "financial_cashboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow" ADD CONSTRAINT "cash_flow_transfer_id_fkey" FOREIGN KEY ("transfer_id") REFERENCES "cash_transfers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_flow" ADD CONSTRAINT "cash_flow_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transfers" ADD CONSTRAINT "cash_transfers_from_financial_account_id_fkey" FOREIGN KEY ("from_financial_account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transfers" ADD CONSTRAINT "cash_transfers_from_cashbox_id_fkey" FOREIGN KEY ("from_cashbox_id") REFERENCES "financial_cashboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transfers" ADD CONSTRAINT "cash_transfers_to_financial_account_id_fkey" FOREIGN KEY ("to_financial_account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transfers" ADD CONSTRAINT "cash_transfers_to_cashbox_id_fkey" FOREIGN KEY ("to_cashbox_id") REFERENCES "financial_cashboxes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transfers" ADD CONSTRAINT "cash_transfers_out_transaction_id_fkey" FOREIGN KEY ("out_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transfers" ADD CONSTRAINT "cash_transfers_in_transaction_id_fkey" FOREIGN KEY ("in_transaction_id") REFERENCES "financial_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_transfers" ADD CONSTRAINT "cash_transfers_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_cashbox_id_fkey" FOREIGN KEY ("cashbox_id") REFERENCES "financial_cashboxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_closings" ADD CONSTRAINT "cash_closings_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

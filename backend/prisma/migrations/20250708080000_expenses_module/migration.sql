-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('PENDENTE', 'PAGO', 'PARCIALMENTE_PAGO', 'VENCIDO', 'CANCELADO', 'ESTORNADO');

-- CreateEnum
CREATE TYPE "ExpenseRecurrenceFrequency" AS ENUM ('SEMANAL', 'QUINZENAL', 'MENSAL', 'BIMESTRAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL');

-- AlterTable
ALTER TABLE "accounts_payable" ALTER COLUMN "supplier_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "supplier_id" TEXT,
    "category_id" TEXT NOT NULL,
    "chart_account_id" TEXT NOT NULL,
    "cost_center_id" TEXT NOT NULL,
    "financial_account_id" TEXT,
    "payment_method_id" TEXT,
    "account_payable_id" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "documento" TEXT,
    "valor" DECIMAL(12,2) NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDENTE',
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "frequencia" "ExpenseRecurrenceFrequency",
    "variavel" BOOLEAN NOT NULL DEFAULT true,
    "grupo_parcelas_id" TEXT,
    "parcela_numero" INTEGER,
    "total_parcelas" INTEGER,
    "recorrencia_origem_id" TEXT,
    "proxima_recorrencia" TIMESTAMP(3),
    "observacoes" TEXT,
    "usuario_id" TEXT,
    "deleted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_installments" (
    "id" TEXT NOT NULL,
    "grupo_id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_attachments" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "arquivo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "usuario_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_history" (
    "id" TEXT NOT NULL,
    "expense_id" TEXT NOT NULL,
    "operacao" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "usuario_id" TEXT,
    "valor_anterior" DECIMAL(12,2),
    "valor_novo" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "expenses_numero_key" ON "expenses"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_account_payable_id_key" ON "expenses"("account_payable_id");

-- CreateIndex
CREATE INDEX "expenses_supplier_id_idx" ON "expenses"("supplier_id");

-- CreateIndex
CREATE INDEX "expenses_category_id_idx" ON "expenses"("category_id");

-- CreateIndex
CREATE INDEX "expenses_cost_center_id_idx" ON "expenses"("cost_center_id");

-- CreateIndex
CREATE INDEX "expenses_vencimento_idx" ON "expenses"("vencimento");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expenses_grupo_parcelas_id_idx" ON "expenses"("grupo_parcelas_id");

-- CreateIndex
CREATE INDEX "expenses_recorrente_idx" ON "expenses"("recorrente");

-- CreateIndex
CREATE UNIQUE INDEX "expense_installments_expense_id_key" ON "expense_installments"("expense_id");

-- CreateIndex
CREATE INDEX "expense_installments_grupo_id_idx" ON "expense_installments"("grupo_id");

-- CreateIndex
CREATE INDEX "expense_installments_vencimento_idx" ON "expense_installments"("vencimento");

-- CreateIndex
CREATE INDEX "expense_installments_status_idx" ON "expense_installments"("status");

-- CreateIndex
CREATE INDEX "expense_attachments_expense_id_idx" ON "expense_attachments"("expense_id");

-- CreateIndex
CREATE INDEX "expense_history_expense_id_idx" ON "expense_history"("expense_id");

-- CreateIndex
CREATE INDEX "expense_history_created_at_idx" ON "expense_history"("created_at");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "financial_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_chart_account_id_fkey" FOREIGN KEY ("chart_account_id") REFERENCES "financial_chart_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_cost_center_id_fkey" FOREIGN KEY ("cost_center_id") REFERENCES "financial_cost_centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_financial_account_id_fkey" FOREIGN KEY ("financial_account_id") REFERENCES "financial_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_payment_method_id_fkey" FOREIGN KEY ("payment_method_id") REFERENCES "financial_payment_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_account_payable_id_fkey" FOREIGN KEY ("account_payable_id") REFERENCES "accounts_payable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorrencia_origem_id_fkey" FOREIGN KEY ("recorrencia_origem_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_installments" ADD CONSTRAINT "expense_installments_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_history" ADD CONSTRAINT "expense_history_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_history" ADD CONSTRAINT "expense_history_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
